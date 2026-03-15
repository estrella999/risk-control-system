from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from database import get_db
from schemas import (
    CustomerCreate, CustomerOut, ApplicationCreate, ApplicationOut,
    TradeLogisticsCreate, TradeLogisticsOut,
    PickupRecordCreate, PickupRecordOut,
    AIOutputOut, OverrideRequest,
)
import crud
import risk_policy
from models import Application, AIOutput, Customer
from ai_engine import generate_portfolio_insight
from datetime import date, timedelta

def _maturity_date(app_date, term_months):
    """Compute maturity date from application date + loan term months."""
    if not app_date or not term_months:
        return None
    d = app_date if isinstance(app_date, date) else date.fromisoformat(str(app_date))
    return str(d + timedelta(days=term_months * 30))

router = APIRouter(prefix="/api")


# ══════════════════════════ Customer Routes ══════════════════════════

@router.get("/customers")
def list_customers(skip: int = 0, limit: int = 100, db: Session = Depends(get_db)):
    customers = crud.get_customers(db, skip, limit)
    result = []
    for c in customers:
        apps = crud.get_applications(db, c.customer_id)
        total_app_count = len(apps)
        total_app_amount = sum(a.requested_loan_amount or 0 for a in apps)

        # Get latest (most recent app) risk level/score from AI outputs
        risk_level = None
        risk_score = None
        risk_assessed_at = None
        for a in apps:  # apps sorted by application_date DESC, first = newest
            ao = crud.get_ai_output(db, a.application_id)
            if ao:
                risk_level = ao.risk_level
                risk_score = ao.total_risk_score
                if ao.generated_at:
                    risk_assessed_at = str(ao.generated_at)[:10]
                break  # take the newest app's score

        utilization = 0
        if c.total_credit_limit and c.total_credit_limit > 0:
            utilization = (c.current_outstanding_amount or 0) / c.total_credit_limit

        ever_overdue = any((a.days_past_due or 0) > 0 for a in apps)

        result.append({
            "customer_id": c.customer_id,
            "customer_name": c.customer_name,
            "country": c.country,
            "city_or_port_type": c.city_or_port_type,
            "city_or_port": c.city_or_port,
            "industry_type": c.industry_type,
            "years_in_auto_parts": c.years_in_auto_parts,
            "cooperation_months": c.cooperation_months,
            "is_key_customer": c.is_key_customer,
            "total_historical_order_amount": c.total_historical_order_amount,
            "customer_status": c.customer_status,
            "credit_grade": c.credit_grade,
            "total_credit_limit": c.total_credit_limit,
            "current_outstanding_amount": c.current_outstanding_amount,
            "total_application_count": total_app_count,
            "total_application_amount": total_app_amount,
            "current_risk_level": risk_level,
            "current_risk_score": risk_score,
            "risk_assessed_at": risk_assessed_at,
            "credit_utilization": utilization,
            "ever_overdue": ever_overdue,
        })
    return result


@router.get("/customers/{customer_id}")
def get_customer(customer_id: str, db: Session = Depends(get_db)):
    c = crud.get_customer(db, customer_id)
    if not c:
        raise HTTPException(404, "Customer not found")
    return CustomerOut.model_validate(c)


@router.post("/customers")
def create_customer(data: CustomerCreate, db: Session = Depends(get_db)):
    c = crud.create_customer(db, data)
    return CustomerOut.model_validate(c)


@router.put("/customers/{customer_id}")
def update_customer(customer_id: str, data: dict, db: Session = Depends(get_db)):
    c = crud.update_customer(db, customer_id, data)
    if not c:
        raise HTTPException(404, "Customer not found")
    return CustomerOut.model_validate(c)


@router.delete("/customers/{customer_id}")
def delete_customer(customer_id: str, db: Session = Depends(get_db)):
    if not crud.delete_customer(db, customer_id):
        raise HTTPException(404, "Customer not found")
    return {"ok": True}


# ══════════════════════════ Application Routes ══════════════════════════

@router.get("/applications")
def list_applications(customer_id: str = None, db: Session = Depends(get_db)):
    apps = crud.get_applications(db, customer_id)
    result = []
    for a in apps:
        cust = crud.get_customer(db, a.customer_id)
        ao = crud.get_ai_output(db, a.application_id)
        result.append({
            "application_id": a.application_id,
            "customer_id": a.customer_id,
            "customer_name": cust.customer_name if cust else "Unknown",
            "application_date": str(a.application_date) if a.application_date else None,
            "contract_amount": a.contract_amount,
            "requested_loan_amount": a.requested_loan_amount,
            "down_payment_amount": a.down_payment_amount,
            "loan_term_months": a.loan_term_months,
            "days_past_due": a.days_past_due or 0,
            "loan_ratio": a.loan_ratio,
            "maturity_date": _maturity_date(a.application_date, a.loan_term_months),
            "use_of_funds": a.use_of_funds,
            "receivable_status": a.receivable_status or "not_yet_due",
            "disbursement_status": a.disbursement_status or "not_disbursed",
            "application_status": a.application_status,
            "manual_review_required": a.manual_review_required or False,
            "manual_decision": a.manual_decision,
            "risk_level": ao.risk_level if ao else None,
            "risk_score": ao.total_risk_score if ao else None,
        })
    return result


@router.get("/applications/{application_id}")
def get_application(application_id: str, db: Session = Depends(get_db)):
    a = crud.get_application(db, application_id)
    if not a:
        raise HTTPException(404, "Application not found")
    return {
        "application_id": a.application_id,
        "customer_id": a.customer_id,
        "application_date": str(a.application_date) if a.application_date else None,
        "contract_amount": a.contract_amount,
        "requested_loan_amount": a.requested_loan_amount,
        "down_payment_amount": a.down_payment_amount,
        "loan_term_months": a.loan_term_months,
        "days_past_due": a.days_past_due or 0,
        "loan_ratio": a.loan_ratio,
        "use_of_funds": a.use_of_funds,
        "receivable_status": a.receivable_status or "not_yet_due",
        "disbursement_status": a.disbursement_status or "not_disbursed",
        "application_status": a.application_status,
        "manual_review_required": a.manual_review_required or False,
        "manual_decision": a.manual_decision,
    }


@router.post("/applications")
def create_application(data: ApplicationCreate, db: Session = Depends(get_db)):
    customer = crud.get_customer(db, data.customer_id)
    if not customer:
        raise HTTPException(400, "Customer not found")

    # Validate loan term
    if data.loan_term_months not in risk_policy.allowed_loan_terms:
        raise HTTPException(400,
            f"Loan term must be one of: {risk_policy.allowed_loan_terms} months."
        )

    # High Risk customers: flag for additional manual review
    if customer.customer_status == "suspended":
        data.manual_review_required = True

    app = crud.create_application(db, data)
    return {
        "application_id": app.application_id,
        "customer_id": app.customer_id,
        "application_date": str(app.application_date) if app.application_date else None,
        "contract_amount": app.contract_amount,
        "requested_loan_amount": app.requested_loan_amount,
        "down_payment_amount": app.down_payment_amount,
        "loan_term_months": app.loan_term_months,
        "days_past_due": app.days_past_due or 0,
        "loan_ratio": app.loan_ratio,
        "use_of_funds": app.use_of_funds,
        "receivable_status": app.receivable_status or "not_yet_due",
        "disbursement_status": app.disbursement_status or "not_disbursed",
        "application_status": app.application_status,
        "manual_review_required": app.manual_review_required or False,
        "manual_decision": app.manual_decision,
    }


@router.put("/applications/{application_id}")
def update_application(application_id: str, data: dict, db: Session = Depends(get_db)):
    a = crud.update_application(db, application_id, data)
    if not a:
        raise HTTPException(404, "Application not found")
    return {
        "application_id": a.application_id,
        "customer_id": a.customer_id,
        "loan_term_months": a.loan_term_months,
        "application_status": a.application_status,
    }


# ══════════════════════════ Trade Logistics Routes ══════════════════════════

@router.get("/trade-logistics/{application_id}")
def get_trade_logistics(application_id: str, db: Session = Depends(get_db)):
    tl = crud.get_trade_logistics(db, application_id)
    if not tl:
        raise HTTPException(404, "Trade logistics not found")
    return TradeLogisticsOut.model_validate(tl)


@router.post("/trade-logistics")
def create_trade_logistics(data: TradeLogisticsCreate, db: Session = Depends(get_db)):
    if not crud.get_application(db, data.application_id):
        raise HTTPException(400, "Application not found")
    return TradeLogisticsOut.model_validate(crud.create_trade_logistics(db, data))


@router.put("/trade-logistics/{application_id}")
def update_trade_logistics(application_id: str, data: dict, db: Session = Depends(get_db)):
    tl = crud.update_trade_logistics(db, application_id, data)
    if not tl:
        raise HTTPException(404, "Trade logistics not found")
    return TradeLogisticsOut.model_validate(tl)


# ══════════════════════════ Pickup Record Routes ══════════════════════════

@router.get("/pickup-records/{application_id}")
def get_pickup_records(application_id: str, db: Session = Depends(get_db)):
    records = crud.get_pickup_records(db, application_id)
    return [PickupRecordOut.model_validate(r) for r in records]


@router.post("/pickup-records")
def create_pickup_record(data: PickupRecordCreate, db: Session = Depends(get_db)):
    if not crud.get_application(db, data.application_id):
        raise HTTPException(400, "Application not found")
    return PickupRecordOut.model_validate(crud.create_pickup_record(db, data))


@router.get("/pickup-summary/{application_id}")
def get_pickup_summary(application_id: str, db: Session = Depends(get_db)):
    trade_logi = crud.get_trade_logistics(db, application_id)
    summary = crud.get_pickup_summary(db, application_id, trade_logi)
    if not summary:
        return {"message": "No pickup records found"}
    return summary


# ══════════════════════════ AI Output Routes ══════════════════════════

@router.get("/ai-output/{application_id}", response_model=AIOutputOut)
def get_ai_output(application_id: str, db: Session = Depends(get_db)):
    ao = crud.get_ai_output(db, application_id)
    if not ao:
        raise HTTPException(404, "AI output not found")
    return ao


@router.post("/ai-output/{application_id}/generate", response_model=AIOutputOut)
def generate_ai_output(application_id: str, db: Session = Depends(get_db)):
    ao = crud.generate_ai_output(db, application_id)
    if not ao:
        raise HTTPException(404, "Application not found")
    return ao


@router.post("/ai-output/{application_id}/override")
def override_decision(application_id: str, req: OverrideRequest, db: Session = Depends(get_db)):
    result = crud.override_decision(db, application_id, req.manual_decision, req.override_reason)
    if not result:
        raise HTTPException(404, "Application not found")
    return {"ok": True, "manual_decision": req.manual_decision}


# ══════════════════════════ Dashboard ══════════════════════════

@router.get("/dashboard")
def get_dashboard(db: Session = Depends(get_db)):
    customers = db.query(Customer).all()
    applications = db.query(Application).all()
    ai_outputs = db.query(AIOutput).all()

    total_loan = sum(a.requested_loan_amount or 0 for a in applications)
    scores = [ao.total_risk_score for ao in ai_outputs if ao.total_risk_score is not None]
    avg_score = sum(scores) / len(scores) if scores else 0

    risk_dist = {"low": 0, "medium": 0, "high": 0}
    for ao in ai_outputs:
        if ao.risk_level in risk_dist:
            risk_dist[ao.risk_level] += 1

    status_dist = {}
    for a in applications:
        s = a.application_status or "pending"
        status_dist[s] = status_dist.get(s, 0) + 1

    # Project-level credit exposure
    current_outstanding = sum(c.current_outstanding_amount or 0 for c in customers)
    remaining_capacity = risk_policy.project_total_limit - current_outstanding
    utilization_ratio = current_outstanding / risk_policy.project_total_limit if risk_policy.project_total_limit > 0 else 0

    utilization_warning = None
    if utilization_ratio > risk_policy.project_utilization_warning_threshold:
        utilization_warning = (
            f"Project utilization has reached {utilization_ratio:.0%}. "
            f"Please pay attention to portfolio exposure when approving new loans."
        )

    # Customer risk counts
    customer_risk = {"low": 0, "medium": 0, "high": 0}
    for c in customers:
        if c.customer_status == "active":
            customer_risk["low"] += 1
        elif c.customer_status == "watchlist":
            customer_risk["medium"] += 1
        elif c.customer_status == "suspended":
            customer_risk["high"] += 1

    # Overdue loans stats
    overdue_apps = [a for a in applications if (a.days_past_due or 0) > 0]
    overdue_count = len(overdue_apps)
    overdue_amount = sum(a.requested_loan_amount or 0 for a in overdue_apps)

    # Highest overdue: customer name + DPD
    overdue_highest_name = None
    overdue_highest_dpd = 0
    if overdue_apps:
        worst = max(overdue_apps, key=lambda a: a.days_past_due or 0)
        cust_worst = next((c for c in customers if c.customer_id == worst.customer_id), None)
        overdue_highest_name = cust_worst.customer_name if cust_worst else worst.customer_id
        overdue_highest_dpd = worst.days_past_due or 0

    # Collection stats: paid loans
    paid_apps = [a for a in applications if a.receivable_status == "paid" and a.disbursement_status == "disbursed"]
    paid_amount = sum(a.requested_loan_amount or 0 for a in paid_apps)
    due_or_paid_apps = [a for a in applications if a.receivable_status in ("paid", "due", "overdue") and a.disbursement_status == "disbursed"]
    due_or_paid_amount = sum(a.requested_loan_amount or 0 for a in due_or_paid_apps)
    collection_rate = round(paid_amount / due_or_paid_amount, 4) if due_or_paid_amount > 0 else 1.0

    # Finance KPIs: Accounts Receivable & Payable
    # AR = sum of loan amounts for approved/disbursed apps where buyer hasn't fully paid
    total_accounts_receivable = sum(
        a.requested_loan_amount or 0 for a in applications
        if a.application_status == "approved"
        and a.disbursement_status == "disbursed"
        and a.receivable_status != "paid"
    )
    # AP = sum of (contract_amount - down_payment) for approved apps not yet disbursed
    total_accounts_payable = sum(
        (a.contract_amount or 0) - (a.down_payment_amount or 0) for a in applications
        if a.application_status == "approved"
        and a.disbursement_status != "disbursed"
    )

    # Customers near credit limit
    near_limit = sum(
        1 for c in customers
        if c.total_credit_limit and c.total_credit_limit > 0
        and (c.current_outstanding_amount or 0) / c.total_credit_limit > risk_policy.customer_utilization_warning_threshold
    )

    # Recent applications
    recent = sorted(applications, key=lambda x: x.application_date or "", reverse=True)[:10]
    recent_list = []
    for a in recent:
        cust = next((c for c in customers if c.customer_id == a.customer_id), None)
        ao = next((o for o in ai_outputs if o.application_id == a.application_id), None)
        recent_list.append({
            "application_id": a.application_id,
            "customer_id": a.customer_id,
            "customer_name": cust.customer_name if cust else "Unknown",
            "contract_amount": a.contract_amount,
            "requested_loan_amount": a.requested_loan_amount,
            "loan_ratio": a.loan_ratio,
            "application_date": str(a.application_date) if a.application_date else "",
            "application_status": a.application_status,
            "risk_level": ao.risk_level if ao else None,
            "risk_score": ao.total_risk_score if ao else None,
        })

    # Build metrics dict for portfolio insight generation
    dashboard_metrics = {
        "total_customers": len(customers),
        "total_applications": len(applications),
        "total_loan_amount": total_loan,
        "avg_risk_score": round(avg_score, 1),
        "risk_distribution": risk_dist,
        "status_distribution": status_dist,
        "project_total_limit": risk_policy.project_total_limit,
        "current_outstanding": current_outstanding,
        "remaining_capacity": remaining_capacity,
        "utilization_ratio": round(utilization_ratio, 4),
        "overdue_count": overdue_count,
        "overdue_amount": overdue_amount,
        "overdue_highest_name": overdue_highest_name,
        "overdue_highest_dpd": overdue_highest_dpd,
        "collection_rate": collection_rate,
        "total_accounts_receivable": total_accounts_receivable,
        "total_accounts_payable": total_accounts_payable,
    }
    portfolio_insight = generate_portfolio_insight(dashboard_metrics)

    return {
        **dashboard_metrics,
        "utilization_warning": utilization_warning,
        "recent_applications": recent_list,
        "customer_risk_counts": customer_risk,
        "customers_near_limit": near_limit,
        "portfolio_insight": portfolio_insight,
    }


# ══════════════════════════ Customer Detail (enriched) ══════════════════════════

@router.get("/customers/{customer_id}/detail")
def get_customer_detail(customer_id: str, db: Session = Depends(get_db)):
    """Get customer with all applications, logistics, pickup records, and AI outputs."""
    customer = crud.get_customer(db, customer_id)
    if not customer:
        raise HTTPException(404, "Customer not found")

    apps = crud.get_applications(db, customer_id)

    # Compute aggregates
    total_app_count = len(apps)
    total_app_amount = sum(a.requested_loan_amount or 0 for a in apps)

    utilization = 0
    if customer.total_credit_limit and customer.total_credit_limit > 0:
        utilization = (customer.current_outstanding_amount or 0) / customer.total_credit_limit

    utilization_warning = None
    if utilization > risk_policy.customer_utilization_warning_threshold:
        utilization_warning = (
            f"This customer is close to the credit limit ({utilization:.0%} utilized). "
            f"Please be cautious when approving new financing."
        )

    # Get latest risk info
    latest_risk_level = None
    latest_risk_score = None
    for a in apps:
        ao = crud.get_ai_output(db, a.application_id)
        if ao:
            latest_risk_level = ao.risk_level
            latest_risk_score = ao.total_risk_score

    app_details = []
    for a in apps:
        trade_logi = crud.get_trade_logistics(db, a.application_id)
        pickup_recs = crud.get_pickup_records(db, a.application_id)
        pickup_summary = crud.get_pickup_summary(db, a.application_id, trade_logi)
        ao = crud.get_ai_output(db, a.application_id)

        app_details.append({
            "application": {
                "application_id": a.application_id,
                "application_date": str(a.application_date) if a.application_date else None,
                "contract_amount": a.contract_amount,
                "requested_loan_amount": a.requested_loan_amount,
                "down_payment_amount": a.down_payment_amount,
                "loan_term_months": a.loan_term_months,
                "days_past_due": a.days_past_due or 0,
                "loan_ratio": a.loan_ratio,
                "use_of_funds": a.use_of_funds,
                "receivable_status": a.receivable_status or "not_yet_due",
                "disbursement_status": a.disbursement_status or "not_disbursed",
                "application_status": a.application_status,
                "manual_review_required": a.manual_review_required or False,
                "manual_decision": a.manual_decision,
                "recovery_amount": a.recovery_amount or 0,
            },
            "trade_logistics": {
                "etd": str(trade_logi.etd) if trade_logi and trade_logi.etd else None,
                "eta": str(trade_logi.eta) if trade_logi and trade_logi.eta else None,
                "actual_arrival_date": str(trade_logi.actual_arrival_date) if trade_logi and trade_logi.actual_arrival_date else None,
                "goods_type": trade_logi.goods_type if trade_logi else None,
                "goods_liquidity_level": trade_logi.goods_liquidity_level if trade_logi else None,
            } if trade_logi else None,
            "pickup_records": [
                {
                    "id": pr.id,
                    "pickup_date": str(pr.pickup_date),
                    "pickup_percentage": pr.pickup_percentage,
                    "note": pr.note,
                } for pr in pickup_recs
            ],
            "pickup_summary": pickup_summary,
            "ai_output": {
                "total_risk_score": ao.total_risk_score,
                "risk_level": ao.risk_level,
                "score_stability": ao.score_stability,
                "score_repayment": ao.score_repayment,
                "score_structure": ao.score_structure,
                "score_logistics": ao.score_logistics,
                "anomaly_flags": ao.anomaly_flags,
                "recommended_loan_band": ao.recommended_loan_band,
                "recommended_term": ao.recommended_term,
                "recommended_down_payment_ratio": ao.recommended_down_payment_ratio,
                "ai_risk_summary": ao.ai_risk_summary,
                "ai_recommendation": ao.ai_recommendation,
                "ai_explanation": ao.ai_explanation,
                "override_flag": ao.override_flag,
                "override_reason": ao.override_reason,
                "governance_follow_up": ao.governance_follow_up,
                "governance_outcome": ao.governance_outcome,
                "generated_at": str(ao.generated_at) if ao.generated_at else None,
            } if ao else None,
        })

    return {
        "customer": {
            "customer_id": customer.customer_id,
            "customer_name": customer.customer_name,
            "country": customer.country,
            "city_or_port_type": customer.city_or_port_type,
            "city_or_port": customer.city_or_port,
            "industry_type": customer.industry_type,
            "years_in_auto_parts": customer.years_in_auto_parts,
            "cooperation_months": customer.cooperation_months,
            "is_key_customer": customer.is_key_customer,
            "total_historical_order_amount": customer.total_historical_order_amount,
            "contact_name": customer.contact_name,
            "contact_phone": customer.contact_phone,
            "customer_status": customer.customer_status,
            "credit_grade": customer.credit_grade,
            "total_credit_limit": customer.total_credit_limit,
            "total_disbursed_amount": customer.total_disbursed_amount,
            "current_outstanding_amount": customer.current_outstanding_amount,
        },
        "total_application_count": total_app_count,
        "total_application_amount": total_app_amount,
        "credit_utilization": utilization,
        "utilization_warning": utilization_warning,
        "current_risk_level": latest_risk_level,
        "current_risk_score": latest_risk_score,
        "applications": app_details,
    }


# ══════════════════════════ Policy Config (read-only) ══════════════════════════

@router.get("/policy")
def get_policy():
    """Return current risk policy configuration."""
    return {
        "min_down_payment_ratio": risk_policy.min_down_payment_ratio,
        "max_loan_to_contract_ratio": risk_policy.max_loan_to_contract_ratio,
        "default_customer_credit_limit": risk_policy.default_customer_credit_limit,
        "project_total_limit": risk_policy.project_total_limit,
        "project_utilization_warning_threshold": risk_policy.project_utilization_warning_threshold,
        "customer_utilization_warning_threshold": risk_policy.customer_utilization_warning_threshold,
        "risk_level_low_min": risk_policy.risk_level_low_min,
        "risk_level_medium_min": risk_policy.risk_level_medium_min,
        "allowed_loan_terms": risk_policy.allowed_loan_terms,
        "first_pickup_normal_max": risk_policy.first_pickup_normal_max,
        "first_pickup_slow_max": risk_policy.first_pickup_slow_max,
        "completion_normal_max": risk_policy.completion_normal_max,
        "completion_slow_max": risk_policy.completion_slow_max,
        "long_idle_threshold": risk_policy.long_idle_threshold,
    }
