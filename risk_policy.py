"""
Risk Policy Configuration — v1.1
Centralized, configurable policy parameters for the risk control system.
All thresholds and limits are defined here and referenced by scoring, anomaly, and AI modules.
"""

# ══════════════════════════ Structure-related ══════════════════════════

# Minimum down payment ratio (20%). AI must not recommend below this as normal.
min_down_payment_ratio = 0.20

# Maximum loan-to-contract ratio
max_loan_to_contract_ratio = 0.85

# Default customer credit limit (ZAR) for demo
default_customer_credit_limit = 2_000_000

# Project-level total capital budget (ZAR)
project_total_limit = 10_000_000

# Project utilization warning threshold (show banner when exceeded)
project_utilization_warning_threshold = 0.70

# Customer-level credit utilization warning threshold
customer_utilization_warning_threshold = 0.80


# ══════════════════════════ Risk-level boundaries ══════════════════════════

# Score boundaries for risk levels
risk_level_low_min = 80      # 80-100: Low Risk
risk_level_medium_min = 60   # 60-79: Medium Risk
# 0-59: High Risk


# ══════════════════════════ Behavior-related (Pickup) ══════════════════════════

# Days from arrival to first pickup
first_pickup_normal_max = 7       # <= 7 days: normal
first_pickup_slow_max = 21        # 8-21 days: slow
# > 21 days: significantly slow

# Total pickup completion days
completion_normal_max = 30        # <= 30 days: normal
completion_slow_max = 60          # 31-60 days: slow
# > 60 days: significantly slow

# Long idle after arrival (no pickups within this many days)
long_idle_threshold = 30


# ══════════════════════════ Behavior-related (Repayment) ══════════════════════════

# Repayment delay thresholds (days past due)
minor_delay_max = 15              # <= 15 days: minor delay
# > 15 days: severe delay


# ══════════════════════════ Loan term options ══════════════════════════

# Allowed loan terms (months)
allowed_loan_terms = [3, 6]
loan_term_days = {3: 90, 6: 180}


# ══════════════════════════ Watchlist / Suspended rules ══════════════════════════

# Conditions for auto Watchlist (Medium Risk score range)
# Customers with scores in medium range are flagged as watchlist
# Conditions for auto Suspended (High Risk)
# Customers with high risk scores are flagged as suspended


def get_risk_level(score: float) -> str:
    """Determine risk level from score using configurable thresholds."""
    if score >= risk_level_low_min:
        return "low"
    elif score >= risk_level_medium_min:
        return "medium"
    else:
        return "high"


def get_customer_status_from_risk(risk_level: str) -> str:
    """Determine customer status from risk level."""
    if risk_level == "high":
        return "suspended"
    elif risk_level == "medium":
        return "watchlist"
    else:
        return "active"


def get_pickup_pattern_label(pattern_key: str) -> str:
    """Convert internal pickup pattern enum to user-facing label."""
    labels = {
        "single": "Single pickup",
        "one_time": "Single pickup",
        "batch_normal": "Multiple pickups, normal pace",
        "batch_regular": "Multiple pickups, normal pace",
        "batch_slow": "Multiple pickups, slow completion",
        "batch_irregular": "Multiple pickups, slow completion",
        "long_idle": "Long idle after arrival",
    }
    return labels.get(pattern_key, pattern_key)
