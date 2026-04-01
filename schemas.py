from pydantic import BaseModel
from typing import Optional
from datetime import date, datetime


# ── Customer ──
class CustomerCreate(BaseModel):
    customer_name: str
    country: str = "South Africa"
    city_or_port_type: Optional[str] = None
    city_or_port: Optional[str] = None
    industry_type: Optional[str] = None
    years_in_auto_parts: float = 0
    cooperation_months: int = 0
    is_key_customer: bool = False
    total_historical_order_amount: float = 0
    contact_name: Optional[str] = None
    contact_phone: Optional[str] = None
    total_credit_limit: float = 2000000
    total_disbursed_amount: float = 0
    current_outstanding_amount: float = 0
    credit_grade: str = "B"
    customer_status: str = "active"


class CustomerOut(BaseModel):
    customer_id: str
    customer_name: str
    country: str = "South Africa"
    city_or_port_type: Optional[str] = None
    city_or_port: Optional[str] = None
    industry_type: Optional[str] = None
    years_in_auto_parts: float = 0
    cooperation_months: int = 0
    is_key_customer: bool = False
    total_historical_order_amount: float = 0
    contact_name: Optional[str] = None
    contact_phone: Optional[str] = None
    total_credit_limit: float = 2000000
    total_disbursed_amount: float = 0
    current_outstanding_amount: float = 0
    credit_grade: str = "B"
    customer_status: str = "active"
    created_at: Optional[datetime] = None
    updated_at: Optional[datetime] = None

    class Config:
        from_attributes = True


# ── Application ──
class ApplicationCreate(BaseModel):
    customer_id: str
    application_date: Optional[date] = None
    contract_amount: float
    requested_loan_amount: float
    down_payment_amount: float
    loan_term_months: int = 3  # 3 or 6
    days_past_due: int = 0
    use_of_funds: Optional[str] = None
    receivable_status: str = "not_yet_due"
    disbursement_status: str = "not_disbursed"
    application_status: str = "pending"
    manual_review_required: bool = False
    manual_decision: Optional[str] = None
    recovery_amount: float = 0


class ApplicationOut(BaseModel):
    application_id: str
    customer_id: str
    application_date: Optional[date] = None
    contract_amount: float = 0
    requested_loan_amount: float = 0
    down_payment_amount: float = 0
    loan_term_months: int = 3
    days_past_due: int = 0
    loan_ratio: Optional[float] = None
    use_of_funds: Optional[str] = None
    receivable_status: str = "not_yet_due"
    disbursement_status: str = "not_disbursed"
    application_status: str = "pending"
    manual_review_required: bool = False
    manual_decision: Optional[str] = None
    recovery_amount: float = 0

    class Config:
        from_attributes = True


# ── Trade Logistics ──
class TradeLogisticsCreate(BaseModel):
    application_id: str
    etd: Optional[date] = None
    eta: Optional[date] = None
    actual_arrival_date: Optional[date] = None
    goods_type: Optional[str] = None
    goods_liquidity_level: Optional[str] = None


class TradeLogisticsOut(TradeLogisticsCreate):
    id: Optional[int] = None

    class Config:
        from_attributes = True


# ── Pickup Record ──
class PickupRecordCreate(BaseModel):
    application_id: str
    pickup_date: date
    pickup_percentage: float = 0
    note: Optional[str] = None


class PickupRecordOut(PickupRecordCreate):
    id: Optional[int] = None

    class Config:
        from_attributes = True


# ── AI Output ──
class AIOutputOut(BaseModel):
    application_id: str
    total_risk_score: Optional[float] = None
    risk_level: Optional[str] = None
    score_stability: Optional[float] = None
    score_repayment: Optional[float] = None
    score_structure: Optional[float] = None
    score_logistics: Optional[float] = None
    anomaly_flags: Optional[list] = []
    recommended_loan_band: Optional[str] = None
    recommended_term: Optional[str] = None
    recommended_down_payment_ratio: Optional[str] = None
    ai_risk_summary: Optional[str] = None
    ai_recommendation: Optional[str] = None
    ai_explanation: Optional[str] = None
    ai_risk_summary_zh: Optional[str] = None
    ai_recommendation_zh: Optional[str] = None
    ai_explanation_zh: Optional[str] = None
    override_flag: bool = False
    override_reason: Optional[str] = None
    governance_follow_up: Optional[str] = None
    governance_outcome: Optional[str] = None
    ai_version: Optional[str] = None
    generated_at: Optional[datetime] = None

    class Config:
        from_attributes = True


class OverrideRequest(BaseModel):
    manual_decision: str  # pass / review / reject
    override_reason: str


class DashboardStats(BaseModel):
    total_customers: int
    total_applications: int
    total_loan_amount: float
    avg_risk_score: float
    risk_distribution: dict
    recent_applications: list
    project_total_limit: float
    current_outstanding: float
    remaining_capacity: float
    utilization_ratio: float
    utilization_warning: Optional[str] = None
    customer_risk_counts: dict
    customers_near_limit: int
    total_accounts_receivable: float = 0
    total_accounts_payable: float = 0
