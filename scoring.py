"""
Risk Scoring Engine — v1.1
4 dimensions, 25 points each, total 100.

Dimension 1: Business & Relationship Stability (score_stability)
Dimension 2: Historical Repayment Behavior (score_repayment)
Dimension 3: Current Financing Structure (score_structure)
Dimension 4: Logistics & Pickup Behavior (score_logistics)

Risk levels are configurable via risk_policy.
"""

from sqlalchemy.orm import Session
from models import Customer, Application, TradeLogistics, PickupRecord
import risk_policy


def score_stability(customer: Customer) -> float:
    """Dimension 1: Business & Relationship Stability (25 pts)"""
    months = customer.cooperation_months or 0
    if months >= 24:
        s1 = 10
    elif months >= 12:
        s1 = 7
    elif months >= 6:
        s1 = 4
    else:
        s1 = 2

    years = customer.years_in_auto_parts or 0
    if years >= 10:
        s2 = 8
    elif years >= 5:
        s2 = 6
    elif years >= 2:
        s2 = 3
    else:
        s2 = 1

    amount = customer.total_historical_order_amount or 0
    if amount >= 500000:
        s3 = 7
    elif amount >= 200000:
        s3 = 5
    elif amount >= 50000:
        s3 = 3
    else:
        s3 = 1

    return s1 + s2 + s3


def score_repayment(customer: Customer, db: Session) -> float:
    """Dimension 2: Historical Repayment Behavior (25 pts)"""
    past_apps = db.query(Application).filter(
        Application.customer_id == customer.customer_id,
        Application.application_status == "approved"
    ).all()

    count = len(past_apps)

    if count >= 5:
        s1 = 8
    elif count >= 3:
        s1 = 6
    elif count >= 1:
        s1 = 4
    else:
        s1 = 2

    # Repayment consistency based on loan term months
    if count >= 2:
        terms = [a.loan_term_months for a in past_apps if a.loan_term_months]
        if len(terms) >= 2:
            avg = sum(terms) / len(terms)
            variance = sum((t - avg) ** 2 for t in terms) / len(terms)
            if variance <= 1:
                s2 = 9
            elif variance <= 4:
                s2 = 6
            else:
                s2 = 3
        else:
            s2 = 5
    elif count == 1:
        s2 = 5
    else:
        s2 = 4

    if customer.is_key_customer:
        s3 = 8
    elif count >= 3:
        s3 = 5
    else:
        s3 = 3

    return s1 + s2 + s3


def score_structure(application: Application) -> float:
    """Dimension 3: Current Financing Structure (25 pts)"""
    contract = application.contract_amount or 1
    down = application.down_payment_amount or 0
    loan = application.requested_loan_amount or 0
    term = application.loan_term_months or 3

    dp_ratio = down / contract if contract > 0 else 0
    if dp_ratio >= 0.3:
        s1 = 9
    elif dp_ratio >= 0.2:
        s1 = 6
    elif dp_ratio >= 0.1:
        s1 = 3
    else:
        s1 = 1

    fin_ratio = loan / contract if contract > 0 else 1
    if fin_ratio <= 0.7:
        s2 = 9
    elif fin_ratio <= 0.8:
        s2 = 6
    elif fin_ratio <= 0.9:
        s2 = 3
    else:
        s2 = 1

    # Term scoring: 3 months is better than 6 months
    if term <= 3:
        s3 = 7
    else:
        s3 = 5

    return s1 + s2 + s3


def score_logistics(trade_logi: TradeLogistics | None, pickup_records: list | None) -> float:
    """Dimension 4: Logistics & Pickup Behavior (25 pts)"""
    if trade_logi is None and not pickup_records:
        return 12  # neutral default

    s1 = 4  # default for no pickup data
    s2 = 4
    s3 = 3
    s4 = 3

    pickups = pickup_records or []

    if trade_logi and trade_logi.actual_arrival_date and pickups:
        sorted_pickups = sorted(pickups, key=lambda p: p.pickup_date)
        first_pickup = sorted_pickups[0]
        days_to_first = (first_pickup.pickup_date - trade_logi.actual_arrival_date).days

        if days_to_first <= risk_policy.first_pickup_normal_max:
            s1 = 7
        elif days_to_first <= risk_policy.first_pickup_slow_max:
            s1 = 4
        else:
            s1 = 1

        # Pickup completion days
        if len(sorted_pickups) > 1:
            last_pickup = sorted_pickups[-1]
            completion_days = (last_pickup.pickup_date - first_pickup.pickup_date).days
        else:
            completion_days = 0

        if completion_days <= 7:
            s2 = 7
        elif completion_days <= risk_policy.completion_normal_max:
            s2 = 5
        elif completion_days <= risk_policy.completion_slow_max:
            s2 = 3
        else:
            s2 = 1

        # Pickup pattern
        num_pickups = len(sorted_pickups)
        if num_pickups == 1:
            s3 = 6
        elif completion_days <= risk_policy.completion_normal_max:
            s3 = 4
        else:
            s3 = 2

    # Goods liquidity
    if trade_logi:
        liquidity = (trade_logi.goods_liquidity_level or "").lower()
        if liquidity == "high":
            s4 = 5
        elif liquidity == "medium":
            s4 = 3
        else:
            s4 = 1

    return s1 + s2 + s3 + s4


def compute_full_score(customer: Customer, application: Application,
                       trade_logi: TradeLogistics | None,
                       pickup_records: list | None, db: Session) -> dict:
    """Compute all 4 dimension scores and return result dict."""
    s1 = score_stability(customer)
    s2 = score_repayment(customer, db)
    s3 = score_structure(application)
    s4 = score_logistics(trade_logi, pickup_records)

    total = s1 + s2 + s3 + s4
    level = risk_policy.get_risk_level(total)

    return {
        "score_stability": round(s1, 1),
        "score_repayment": round(s2, 1),
        "score_structure": round(s3, 1),
        "score_logistics": round(s4, 1),
        "total_risk_score": round(total, 1),
        "risk_level": level,
    }
