from sqlalchemy import (
    Column, String, Float, Integer, Boolean, DateTime, Date, ForeignKey, JSON, Text
)
from sqlalchemy.orm import relationship
from database import Base
import datetime


class Customer(Base):
    __tablename__ = "customers"

    customer_id = Column(String, primary_key=True)  # auto-generated: C001, C002, ...
    customer_name = Column(String, nullable=False)
    country = Column(String, default="South Africa")
    city_or_port_type = Column(String)  # city / port
    city_or_port = Column(String)
    industry_type = Column(String)
    years_in_auto_parts = Column(Float, default=0)
    cooperation_months = Column(Integer, default=0)
    is_key_customer = Column(Boolean, default=False)
    total_historical_order_amount = Column(Float, default=0)
    contact_name = Column(String)
    contact_phone = Column(String)
    # v1.1: credit exposure fields
    total_credit_limit = Column(Float, default=2000000)
    total_disbursed_amount = Column(Float, default=0)
    current_outstanding_amount = Column(Float, default=0)
    # v1.1: internal qualitative credit grade
    credit_grade = Column(String, default="B")  # A / B / C / D
    # v1.1: status now includes "suspended" for High Risk
    customer_status = Column(String, default="active")  # active / watchlist / suspended
    created_at = Column(DateTime, default=datetime.datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.datetime.utcnow, onupdate=datetime.datetime.utcnow)

    applications = relationship("Application", back_populates="customer")


class Application(Base):
    __tablename__ = "applications"

    application_id = Column(String, primary_key=True)
    customer_id = Column(String, ForeignKey("customers.customer_id"), nullable=False)
    application_date = Column(Date)
    contract_amount = Column(Float)
    requested_loan_amount = Column(Float)
    down_payment_amount = Column(Float)
    # v1.1: replaced planned_repayment_days with loan_term_months (3 or 6)
    loan_term_months = Column(Integer, default=3)  # 3 or 6
    # v1.1: removed repayment_anchor
    days_past_due = Column(Integer, default=0)  # overdue days (0 = not overdue)
    use_of_funds = Column(String)
    receivable_status = Column(String, default="not_yet_due")  # not_yet_due / due / overdue / paid
    disbursement_status = Column(String, default="not_disbursed")  # not_disbursed / disbursed
    application_status = Column(String, default="pending")  # pending/approved/rejected
    manual_review_required = Column(Boolean, default=False)  # True = escalated for additional human review
    manual_decision = Column(String)  # pass/reject
    recovery_amount = Column(Float, default=0)  # amount recovered from selling collateral on defaulted loans

    customer = relationship("Customer", back_populates="applications")
    trade_logistics = relationship("TradeLogistics", back_populates="application", uselist=False)
    pickup_records = relationship("PickupRecord", back_populates="application")
    ai_output = relationship("AIOutput", back_populates="application", uselist=False)

    @property
    def loan_ratio(self):
        if self.contract_amount and self.contract_amount > 0:
            return self.requested_loan_amount / self.contract_amount
        return 0


class TradeLogistics(Base):
    """v1.1: Separated shipping/ocean logistics from pickup behavior."""
    __tablename__ = "trade_logistics"

    id = Column(Integer, primary_key=True, autoincrement=True)
    application_id = Column(String, ForeignKey("applications.application_id"), nullable=False)
    etd = Column(Date)  # estimated time of departure
    eta = Column(Date)  # estimated time of arrival
    actual_arrival_date = Column(Date)
    goods_type = Column(String)
    goods_liquidity_level = Column(String)  # high / medium / low

    application = relationship("Application", back_populates="trade_logistics")


class PickupRecord(Base):
    """v1.1: Individual pickup events (multiple per application)."""
    __tablename__ = "pickup_records"

    id = Column(Integer, primary_key=True, autoincrement=True)
    application_id = Column(String, ForeignKey("applications.application_id"), nullable=False)
    pickup_date = Column(Date, nullable=False)
    pickup_percentage = Column(Float, default=0)  # percentage of total goods picked up
    note = Column(String)

    application = relationship("Application", back_populates="pickup_records")


class AIOutput(Base):
    __tablename__ = "ai_outputs"

    id = Column(Integer, primary_key=True, autoincrement=True)
    application_id = Column(String, ForeignKey("applications.application_id"), nullable=False)
    total_risk_score = Column(Float)
    risk_level = Column(String)  # low / medium / high
    score_stability = Column(Float)
    score_repayment = Column(Float)
    score_structure = Column(Float)
    score_logistics = Column(Float)
    anomaly_flags = Column(JSON, default=[])
    recommended_loan_band = Column(String)
    recommended_term = Column(String)  # v1.1: "3 months" or "6 months"
    recommended_down_payment_ratio = Column(String)
    ai_risk_summary = Column(String)
    ai_recommendation = Column(String)
    ai_explanation = Column(String)
    ai_risk_summary_zh = Column(String)
    ai_recommendation_zh = Column(String)
    ai_explanation_zh = Column(String)
    override_flag = Column(Boolean, default=False)
    override_reason = Column(String)
    governance_follow_up = Column(String)   # 后续处理
    governance_outcome = Column(String)     # 最终结果
    ai_version = Column(String, default="v1.1-rule-based")
    generated_at = Column(DateTime, default=datetime.datetime.utcnow)

    application = relationship("Application", back_populates="ai_output")
