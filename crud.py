from sqlalchemy.orm import Session
from sqlalchemy import func
from models import Customer, Application, TradeLogistics, PickupRecord, AIOutput
from schemas import CustomerCreate, ApplicationCreate, TradeLogisticsCreate, PickupRecordCreate
from scoring import compute_full_score
from anomaly import detect_anomalies
from ai_engine import generate_risk_summary
import risk_policy
import datetime


# ══════════════════════════ Customer CRUD ══════════════════════════

def _next_customer_id(db: Session) -> str:
    """Auto-generate next customer ID like C001, C002, ..."""
    last = db.query(Customer).order_by(Customer.customer_id.desc()).first()
    if last and last.customer_id.startswith("C"):
        try:
            num = int(last.customer_id[1:]) + 1
        except ValueError:
            num = 1
    else:
        num = 1
    return f"C{num:03d}"


def get_customers(db: Session, skip: int = 0, limit: int = 100):
    return db.query(Customer).offset(skip).limit(limit).all()


def get_customer(db: Session, customer_id: str):
    return db.query(Customer).filter(Customer.customer_id == customer_id).first()


def create_customer(db: Session, data: CustomerCreate):
    customer_id = _next_customer_id(db)
    customer_data = data.model_dump()
    customer = Customer(customer_id=customer_id, **customer_data)
    db.add(customer)
    db.commit()
    db.refresh(customer)
    return customer


def update_customer(db: Session, customer_id: str, data: dict):
    customer = get_customer(db, customer_id)
    if not customer:
        return None
    for key, value in data.items():
        if hasattr(customer, key) and key != "customer_id":
            setattr(customer, key, value)
    customer.updated_at = datetime.datetime.utcnow()
    db.commit()
    db.refresh(customer)
    return customer


def delete_customer(db: Session, customer_id: str):
    customer = get_customer(db, customer_id)
    if customer:
        db.delete(customer)
        db.commit()
        return True
    return False


# ══════════════════════════ Application CRUD ══════════════════════════

def _next_application_id(db: Session) -> str:
    """Auto-generate next application ID like A001, A002, ..."""
    last = db.query(Application).order_by(Application.application_id.desc()).first()
    if last and last.application_id.startswith("A"):
        try:
            num = int(last.application_id[1:]) + 1
        except ValueError:
            num = 1
    else:
        num = 1
    return f"A{num:03d}"


def get_applications(db: Session, customer_id: str = None, skip: int = 0, limit: int = 100):
    q = db.query(Application)
    if customer_id:
        q = q.filter(Application.customer_id == customer_id)
    return q.order_by(Application.application_date.desc()).offset(skip).limit(limit).all()


def get_application(db: Session, application_id: str):
    return db.query(Application).filter(Application.application_id == application_id).first()


def create_application(db: Session, data: ApplicationCreate):
    app_id = _next_application_id(db)
    app_data = data.model_dump()
    app_data.pop("customer_id", None)
    app = Application(application_id=app_id, customer_id=data.customer_id, **app_data)
    db.add(app)
    db.commit()
    db.refresh(app)
    return app


def update_application(db: Session, application_id: str, data: dict):
    app = get_application(db, application_id)
    if not app:
        return None
    for key, value in data.items():
        if hasattr(app, key):
            setattr(app, key, value)
    db.commit()
    db.refresh(app)
    return app


# ══════════════════════════ Trade Logistics CRUD ══════════════════════════

def get_trade_logistics(db: Session, application_id: str):
    return db.query(TradeLogistics).filter(TradeLogistics.application_id == application_id).first()


def create_trade_logistics(db: Session, data: TradeLogisticsCreate):
    logi = TradeLogistics(**data.model_dump())
    db.add(logi)
    db.commit()
    db.refresh(logi)
    return logi


def update_trade_logistics(db: Session, application_id: str, data: dict):
    logi = get_trade_logistics(db, application_id)
    if not logi:
        return None
    for key, value in data.items():
        if hasattr(logi, key):
            setattr(logi, key, value)
    db.commit()
    db.refresh(logi)
    return logi


# ══════════════════════════ Pickup Records CRUD ══════════════════════════

def get_pickup_records(db: Session, application_id: str):
    return db.query(PickupRecord).filter(
        PickupRecord.application_id == application_id
    ).order_by(PickupRecord.pickup_date).all()


def create_pickup_record(db: Session, data: PickupRecordCreate):
    record = PickupRecord(**data.model_dump())
    db.add(record)
    db.commit()
    db.refresh(record)
    return record


def get_pickup_summary(db: Session, application_id: str, trade_logi: TradeLogistics | None):
    """Compute derived pickup metrics."""
    records = get_pickup_records(db, application_id)
    if not records:
        return None

    sorted_recs = sorted(records, key=lambda r: r.pickup_date)
    first_date = sorted_recs[0].pickup_date
    last_date = sorted_recs[-1].pickup_date
    total_days = (last_date - first_date).days if len(sorted_recs) > 1 else 0

    days_from_arrival = None
    if trade_logi and trade_logi.actual_arrival_date:
        days_from_arrival = (first_date - trade_logi.actual_arrival_date).days

    # Determine pattern label
    num = len(sorted_recs)
    if num == 1:
        pattern = "Single pickup"
    elif total_days <= risk_policy.completion_normal_max:
        pattern = "Multiple pickups, normal pace"
    elif total_days <= risk_policy.completion_slow_max:
        pattern = "Multiple pickups, slow completion"
    else:
        pattern = "Multiple pickups, slow completion"

    if days_from_arrival and days_from_arrival > risk_policy.long_idle_threshold:
        pattern = "Long idle after arrival"

    return {
        "first_pickup_date": str(first_date),
        "last_pickup_date": str(last_date),
        "number_of_pickups": num,
        "total_completion_days": total_days,
        "days_from_arrival_to_first_pickup": days_from_arrival,
        "pickup_pattern_label": pattern,
    }


# ══════════════════════════ AI Output ══════════════════════════

def get_ai_output(db: Session, application_id: str):
    return db.query(AIOutput).filter(AIOutput.application_id == application_id).first()


def generate_ai_output(db: Session, application_id: str):
    """Run scoring + anomaly detection + AI summary for an application."""
    app = get_application(db, application_id)
    if not app:
        return None

    customer = get_customer(db, app.customer_id)
    if not customer:
        return None

    trade_logi = get_trade_logistics(db, application_id)
    pickup_records = get_pickup_records(db, application_id)

    # 1. Compute risk scores
    scores = compute_full_score(customer, app, trade_logi, pickup_records, db)

    # 2. Detect anomalies
    anomaly_flags = detect_anomalies(app, trade_logi, pickup_records, db)

    # 3. Generate AI summary
    ai_result = generate_risk_summary(customer, app, trade_logi, pickup_records, scores, anomaly_flags, db)

    # 4. Update customer status based on risk level
    new_status = risk_policy.get_customer_status_from_risk(scores["risk_level"])
    if customer.customer_status != new_status:
        customer.customer_status = new_status
        customer.updated_at = datetime.datetime.utcnow()

        # If customer is now suspended, flag all their pending applications for manual review
        if new_status == "suspended":
            pending_apps = db.query(Application).filter(
                Application.customer_id == customer.customer_id,
                Application.application_status == "pending"
            ).all()
            for pa in pending_apps:
                pa.manual_review_required = True
                ai_out = get_ai_output(db, pa.application_id)
                if ai_out:
                    ai_out.override_flag = True
                    ai_out.override_reason = "Auto-flagged: customer scored as High Risk. Requires additional review."

    # 5. Save or update AI output
    existing = get_ai_output(db, application_id)
    if existing:
        existing.total_risk_score = scores["total_risk_score"]
        existing.risk_level = scores["risk_level"]
        existing.score_stability = scores["score_stability"]
        existing.score_repayment = scores["score_repayment"]
        existing.score_structure = scores["score_structure"]
        existing.score_logistics = scores["score_logistics"]
        existing.anomaly_flags = anomaly_flags
        existing.recommended_loan_band = ai_result.get("recommended_loan_band", "")
        existing.recommended_term = ai_result.get("recommended_term", "")
        existing.recommended_down_payment_ratio = ai_result.get("recommended_down_payment_ratio", "")
        existing.ai_risk_summary = ai_result.get("ai_risk_summary", "")
        existing.ai_recommendation = ai_result.get("ai_recommendation", "")
        existing.ai_explanation = ai_result.get("ai_explanation", "")
        existing.ai_risk_summary_zh = ai_result.get("ai_risk_summary_zh", "")
        existing.ai_recommendation_zh = ai_result.get("ai_recommendation_zh", "")
        existing.ai_explanation_zh = ai_result.get("ai_explanation_zh", "")
        existing.generated_at = datetime.datetime.utcnow()
        db.commit()
        db.refresh(existing)
        return existing
    else:
        ai_output = AIOutput(
            application_id=application_id,
            total_risk_score=scores["total_risk_score"],
            risk_level=scores["risk_level"],
            score_stability=scores["score_stability"],
            score_repayment=scores["score_repayment"],
            score_structure=scores["score_structure"],
            score_logistics=scores["score_logistics"],
            anomaly_flags=anomaly_flags,
            recommended_loan_band=ai_result.get("recommended_loan_band", ""),
            recommended_term=ai_result.get("recommended_term", ""),
            recommended_down_payment_ratio=ai_result.get("recommended_down_payment_ratio", ""),
            ai_risk_summary=ai_result.get("ai_risk_summary", ""),
            ai_recommendation=ai_result.get("ai_recommendation", ""),
            ai_explanation=ai_result.get("ai_explanation", ""),
            ai_risk_summary_zh=ai_result.get("ai_risk_summary_zh", ""),
            ai_recommendation_zh=ai_result.get("ai_recommendation_zh", ""),
            ai_explanation_zh=ai_result.get("ai_explanation_zh", ""),
            generated_at=datetime.datetime.utcnow(),
        )
        db.add(ai_output)
        db.commit()
        db.refresh(ai_output)
        return ai_output


def override_decision(db: Session, application_id: str, manual_decision: str, override_reason: str):
    """Human override of AI recommendation."""
    app = get_application(db, application_id)
    if not app:
        return None

    app.manual_decision = manual_decision

    ai_output = get_ai_output(db, application_id)
    if ai_output:
        ai_output.override_flag = True
        ai_output.override_reason = override_reason

    db.commit()
    return {"application": app, "ai_output": ai_output}
