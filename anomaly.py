"""
Anomaly Detection Engine — v1.1
Uses risk_policy thresholds for configurable detection.
"""

from sqlalchemy.orm import Session
from models import Application, TradeLogistics, PickupRecord
import risk_policy


def detect_anomalies(application: Application, trade_logi: TradeLogistics | None,
                     pickup_records: list | None, db: Session) -> list[dict]:
    """Return a list of anomaly flags, each with 'en' and 'zh' text."""
    flags = []
    customer_id = application.customer_id

    past_apps = db.query(Application).filter(
        Application.customer_id == customer_id,
        Application.application_id != application.application_id,
        Application.application_status == "approved"
    ).all()

    contract = application.contract_amount or 1
    loan = application.requested_loan_amount or 0
    down = application.down_payment_amount or 0
    current_fin_ratio = loan / contract if contract > 0 else 0
    current_dp_ratio = down / contract if contract > 0 else 0

    # Financing ratio higher than historical average
    if past_apps:
        hist_ratios = []
        for a in past_apps:
            if a.contract_amount and a.contract_amount > 0:
                hist_ratios.append((a.requested_loan_amount or 0) / a.contract_amount)
        if hist_ratios:
            avg_ratio = sum(hist_ratios) / len(hist_ratios)
            if current_fin_ratio > avg_ratio * 1.3:
                flags.append({
                    "en": (f"FINANCING_RATIO_HIGH: Current financing ratio ({current_fin_ratio:.1%}) "
                           f"exceeds historical average ({avg_ratio:.1%}) by >30%"),
                    "zh": (f"融资比例偏高：当前融资比例（{current_fin_ratio:.1%}）"
                           f"超过历史均值（{avg_ratio:.1%}）30%以上"),
                })

    # Financing ratio exceeds max
    if current_fin_ratio > risk_policy.max_loan_to_contract_ratio:
        flags.append({
            "en": (f"FINANCING_RATIO_EXTREME: Financing ratio ({current_fin_ratio:.1%}) "
                   f"exceeds {risk_policy.max_loan_to_contract_ratio:.0%}"),
            "zh": (f"融资比例过高：融资比例（{current_fin_ratio:.1%}）"
                   f"超过上限{risk_policy.max_loan_to_contract_ratio:.0%}"),
        })

    # Low down payment
    if current_dp_ratio < risk_policy.min_down_payment_ratio:
        flags.append({
            "en": (f"LOW_DOWN_PAYMENT: Down payment ratio ({current_dp_ratio:.1%}) "
                   f"below minimum {risk_policy.min_down_payment_ratio:.0%}"),
            "zh": (f"首付比例不足：首付比例（{current_dp_ratio:.1%}）"
                   f"低于最低要求{risk_policy.min_down_payment_ratio:.0%}"),
        })

    # Loan amount spike
    if past_apps:
        hist_loans = [a.requested_loan_amount for a in past_apps if a.requested_loan_amount]
        if hist_loans:
            avg_loan = sum(hist_loans) / len(hist_loans)
            if loan > avg_loan * 2:
                flags.append({
                    "en": (f"LOAN_AMOUNT_SPIKE: Requested loan (R{loan:,.0f}) "
                           f"is >2x historical average (R{avg_loan:,.0f})"),
                    "zh": (f"贷款金额激增：申请贷款（R{loan:,.0f}）"
                           f"超过历史均值（R{avg_loan:,.0f}）的2倍"),
                })

    # Pickup timing anomalies
    pickups = pickup_records or []
    if trade_logi and trade_logi.actual_arrival_date and pickups:
        sorted_pickups = sorted(pickups, key=lambda p: p.pickup_date)
        first = sorted_pickups[0]
        days_to_first = (first.pickup_date - trade_logi.actual_arrival_date).days

        if days_to_first > risk_policy.first_pickup_slow_max:
            flags.append({
                "en": (f"SLOW_FIRST_PICKUP: {days_to_first} days from arrival to first pickup "
                       f"(threshold: {risk_policy.first_pickup_slow_max}d)"),
                "zh": (f"首次提货缓慢：到达后{days_to_first}天才首次提货"
                       f"（阈值：{risk_policy.first_pickup_slow_max}天）"),
            })

        if len(sorted_pickups) > 1:
            last = sorted_pickups[-1]
            comp_days = (last.pickup_date - first.pickup_date).days
            if comp_days > risk_policy.completion_slow_max:
                flags.append({
                    "en": (f"SLOW_PICKUP_COMPLETION: Pickup completion took {comp_days} days "
                           f"(threshold: {risk_policy.completion_slow_max}d)"),
                    "zh": (f"提货完成缓慢：提货全程耗时{comp_days}天"
                           f"（阈值：{risk_policy.completion_slow_max}天）"),
                })

    # Long idle after arrival
    if trade_logi and trade_logi.actual_arrival_date and not pickups:
        flags.append({
            "en": f"LONG_IDLE: No pickups recorded after arrival on {trade_logi.actual_arrival_date}",
            "zh": f"长期闲置：货物于{trade_logi.actual_arrival_date}到达后无提货记录",
        })

    return flags
