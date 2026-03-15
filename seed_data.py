"""Demo seed data — v1.3
10 customers with diverse risk profiles, 25 applications, trade logistics, pickup records.
Statuses: Pending / Approved / Rejected only. manual_review_required flag for high-risk escalation.
- C001: Low Risk, key customer, Grade A — 4 apps (3 approved, 1 pending)
- C002: Low Risk, port-based, Grade B — 3 apps (2 approved, 1 pending)
- C003: High Risk, new, Grade D — 2 apps (1 approved-overdue, 1 pending + manual review)
- C004: Low Risk, best customer, Grade A — 4 apps (3 approved, 1 pending)
- C005: High Risk, very new, Grade D — 3 apps (1 approved+overdue, 1 rejected+override, 1 pending + manual review)
- C006: Medium Risk, near limit, Grade C — 3 apps (2 approved, 1 pending)
- C007: Low Risk, steady dealer, Grade B — 2 apps (1 approved, 1 pending)
- C008: Medium Risk, newer, Grade C — 2 apps (1 approved, 1 pending)
- C009: Low Risk, experienced, Grade A — 2 apps (2 approved, paid)
- C010: High Risk, minimal history, Grade D — 1 app (pending + manual review)
"""

from sqlalchemy.orm import Session
from models import Customer, Application, TradeLogistics, PickupRecord
from datetime import date


def seed(db: Session):
    if db.query(Customer).count() > 0:
        return

    customers = [
        Customer(
            customer_id="C001", customer_name="Cape Auto Parts Ltd",
            country="South Africa", city_or_port_type="city", city_or_port="Cape Town",
            industry_type="auto_parts_wholesale", years_in_auto_parts=12, cooperation_months=36,
            is_key_customer=True, total_historical_order_amount=850000,
            contact_name="James van der Berg", contact_phone="+27-21-555-0101",
            credit_grade="A", customer_status="active",
            total_credit_limit=3000000, total_disbursed_amount=600000, current_outstanding_amount=280000,
        ),
        Customer(
            customer_id="C002", customer_name="Durban Motor Supplies",
            country="South Africa", city_or_port_type="port", city_or_port="Durban Port",
            industry_type="auto_parts_wholesale", years_in_auto_parts=8, cooperation_months=18,
            is_key_customer=False, total_historical_order_amount=320000,
            contact_name="Sipho Ndlovu", contact_phone="+27-31-555-0202",
            credit_grade="B", customer_status="active",
            total_credit_limit=1500000, total_disbursed_amount=350000, current_outstanding_amount=180000,
        ),
        Customer(
            customer_id="C003", customer_name="Joburg Vehicle Spares",
            country="South Africa", city_or_port_type="city", city_or_port="Johannesburg",
            industry_type="auto_repair", years_in_auto_parts=3, cooperation_months=8,
            is_key_customer=False, total_historical_order_amount=95000,
            contact_name="Ahmed Patel", contact_phone="+27-11-555-0303",
            credit_grade="D", customer_status="active",  # will become suspended after scoring
            total_credit_limit=800000, total_disbursed_amount=108000, current_outstanding_amount=108000,
        ),
        Customer(
            customer_id="C004", customer_name="PE Auto Distributors",
            country="South Africa", city_or_port_type="port", city_or_port="Port Elizabeth Port",
            industry_type="vehicle_dealer", years_in_auto_parts=15, cooperation_months=48,
            is_key_customer=True, total_historical_order_amount=1200000,
            contact_name="Maria Santos", contact_phone="+27-41-555-0404",
            credit_grade="A", customer_status="active",
            total_credit_limit=5000000, total_disbursed_amount=1800000, current_outstanding_amount=420000,
        ),
        Customer(
            customer_id="C005", customer_name="Pretoria Parts Hub",
            country="South Africa", city_or_port_type="city", city_or_port="Pretoria",
            industry_type="auto_parts_retail", years_in_auto_parts=1, cooperation_months=3,
            is_key_customer=False, total_historical_order_amount=15000,
            contact_name="Linda Mokoena", contact_phone="+27-12-555-0505",
            credit_grade="D", customer_status="suspended",
            total_credit_limit=500000, total_disbursed_amount=55000, current_outstanding_amount=55000,
        ),
        Customer(
            customer_id="C006", customer_name="Richards Bay Motors",
            country="South Africa", city_or_port_type="port", city_or_port="Richards Bay Port",
            industry_type="auto_parts_wholesale", years_in_auto_parts=6, cooperation_months=14,
            is_key_customer=False, total_historical_order_amount=180000,
            contact_name="David Kruger", contact_phone="+27-35-555-0606",
            credit_grade="C", customer_status="watchlist",
            total_credit_limit=1200000, total_disbursed_amount=500000, current_outstanding_amount=950000,
        ),
        Customer(
            customer_id="C007", customer_name="Bloemfontein Auto Centre",
            country="South Africa", city_or_port_type="city", city_or_port="Bloemfontein",
            industry_type="vehicle_dealer", years_in_auto_parts=10, cooperation_months=24,
            is_key_customer=False, total_historical_order_amount=420000,
            contact_name="Thabo Molefe", contact_phone="+27-51-555-0707",
            credit_grade="B", customer_status="active",
            total_credit_limit=2000000, total_disbursed_amount=300000, current_outstanding_amount=150000,
        ),
        Customer(
            customer_id="C008", customer_name="East London Parts Depot",
            country="South Africa", city_or_port_type="city", city_or_port="Johannesburg",
            industry_type="auto_parts_retail", years_in_auto_parts=4, cooperation_months=10,
            is_key_customer=False, total_historical_order_amount=130000,
            contact_name="Nandi Zulu", contact_phone="+27-43-555-0808",
            credit_grade="C", customer_status="active",  # will become watchlist after scoring
            total_credit_limit=1000000, total_disbursed_amount=160000, current_outstanding_amount=120000,
        ),
        Customer(
            customer_id="C009", customer_name="Stellenbosch Motor Works",
            country="South Africa", city_or_port_type="city", city_or_port="Cape Town",
            industry_type="auto_repair", years_in_auto_parts=18, cooperation_months=42,
            is_key_customer=True, total_historical_order_amount=950000,
            contact_name="Willem Botha", contact_phone="+27-21-555-0909",
            credit_grade="A", customer_status="active",
            total_credit_limit=4000000, total_disbursed_amount=800000, current_outstanding_amount=0,
        ),
        Customer(
            customer_id="C010", customer_name="Nelspruit Quick Parts",
            country="South Africa", city_or_port_type="city", city_or_port="Pretoria",
            industry_type="auto_parts_retail", years_in_auto_parts=2, cooperation_months=4,
            is_key_customer=False, total_historical_order_amount=28000,
            contact_name="Grace Mabaso", contact_phone="+27-13-555-1010",
            credit_grade="D", customer_status="suspended",
            total_credit_limit=600000, total_disbursed_amount=0, current_outstanding_amount=0,
        ),
    ]
    db.add_all(customers)

    applications = [
        # ═══ C001: 4 apps (3 approved, 1 pending) ═══
        Application(application_id="A001", customer_id="C001", application_date=date(2025, 3, 15),
                    contract_amount=120000, requested_loan_amount=84000, down_payment_amount=36000,
                    loan_term_months=3, days_past_due=15, use_of_funds="inventory_purchase",
                    receivable_status="overdue", disbursement_status="disbursed",
                    application_status="approved", manual_decision="pass", recovery_amount=75000),
        Application(application_id="A002", customer_id="C001", application_date=date(2025, 7, 20),
                    contract_amount=95000, requested_loan_amount=66500, down_payment_amount=28500,
                    loan_term_months=3, use_of_funds="inventory_purchase",
                    receivable_status="paid", disbursement_status="disbursed",
                    application_status="approved", manual_decision="pass"),
        Application(application_id="A003", customer_id="C001", application_date=date(2025, 11, 10),
                    contract_amount=150000, requested_loan_amount=105000, down_payment_amount=45000,
                    loan_term_months=6, use_of_funds="inventory_purchase",
                    receivable_status="not_yet_due", disbursement_status="disbursed",
                    application_status="approved", manual_decision="pass"),
        Application(application_id="A004", customer_id="C001", application_date=date(2026, 2, 28),
                    contract_amount=200000, requested_loan_amount=140000, down_payment_amount=60000,
                    loan_term_months=6, use_of_funds="inventory_purchase",
                    application_status="pending"),

        # ═══ C002: 3 apps (2 approved, 1 pending) ═══
        Application(application_id="A005", customer_id="C002", application_date=date(2025, 6, 10),
                    contract_amount=70000, requested_loan_amount=49000, down_payment_amount=21000,
                    loan_term_months=3, use_of_funds="inventory_purchase",
                    receivable_status="paid", disbursement_status="disbursed",
                    application_status="approved", manual_decision="pass"),
        Application(application_id="A006", customer_id="C002", application_date=date(2025, 9, 5),
                    contract_amount=80000, requested_loan_amount=56000, down_payment_amount=24000,
                    loan_term_months=3, use_of_funds="inventory_purchase",
                    receivable_status="due", disbursement_status="disbursed",
                    application_status="approved", manual_decision="pass"),
        Application(application_id="A007", customer_id="C002", application_date=date(2026, 3, 1),
                    contract_amount=110000, requested_loan_amount=77000, down_payment_amount=33000,
                    loan_term_months=6, use_of_funds="inventory_purchase",
                    application_status="pending"),

        # ═══ C003: 2 apps (1 approved overdue, 1 pending + manual review) — High Risk ═══
        Application(application_id="A008", customer_id="C003", application_date=date(2025, 12, 1),
                    contract_amount=60000, requested_loan_amount=54000, down_payment_amount=6000,
                    loan_term_months=6, days_past_due=30, use_of_funds="equipment_purchase",
                    receivable_status="overdue", disbursement_status="disbursed",
                    application_status="approved", manual_decision="pass", recovery_amount=18000),
        Application(application_id="A009", customer_id="C003", application_date=date(2026, 3, 5),
                    contract_amount=45000, requested_loan_amount=40500, down_payment_amount=4500,
                    loan_term_months=6, use_of_funds="inventory_purchase",
                    application_status="pending", manual_review_required=True),

        # ═══ C004: 4 apps (3 approved, 1 pending) — Best customer ═══
        Application(application_id="A010", customer_id="C004", application_date=date(2025, 1, 20),
                    contract_amount=200000, requested_loan_amount=120000, down_payment_amount=80000,
                    loan_term_months=3, use_of_funds="inventory_purchase",
                    receivable_status="paid", disbursement_status="disbursed",
                    application_status="approved", manual_decision="pass"),
        Application(application_id="A011", customer_id="C004", application_date=date(2025, 5, 12),
                    contract_amount=160000, requested_loan_amount=96000, down_payment_amount=64000,
                    loan_term_months=3, use_of_funds="inventory_purchase",
                    receivable_status="paid", disbursement_status="disbursed",
                    application_status="approved", manual_decision="pass"),
        Application(application_id="A012", customer_id="C004", application_date=date(2025, 8, 15),
                    contract_amount=180000, requested_loan_amount=108000, down_payment_amount=72000,
                    loan_term_months=3, use_of_funds="inventory_purchase",
                    receivable_status="not_yet_due", disbursement_status="disbursed",
                    application_status="approved", manual_decision="pass"),
        Application(application_id="A013", customer_id="C004", application_date=date(2026, 3, 8),
                    contract_amount=250000, requested_loan_amount=150000, down_payment_amount=100000,
                    loan_term_months=6, use_of_funds="inventory_purchase",
                    application_status="pending"),

        # ═══ C005: 3 apps (1 approved+overdue, 1 rejected, 1 pending + manual review) — High Risk ═══
        Application(application_id="A026", customer_id="C005", application_date=date(2025, 10, 10),
                    contract_amount=35000, requested_loan_amount=28000, down_payment_amount=7000,
                    loan_term_months=3, days_past_due=25, use_of_funds="inventory_purchase",
                    receivable_status="overdue", disbursement_status="disbursed",
                    application_status="approved", manual_decision="pass", recovery_amount=12000),
        Application(application_id="A014", customer_id="C005", application_date=date(2026, 1, 15),
                    contract_amount=30000, requested_loan_amount=27000, down_payment_amount=3000,
                    loan_term_months=6, use_of_funds="inventory_purchase",
                    application_status="rejected", manual_decision="reject"),
        Application(application_id="A015", customer_id="C005", application_date=date(2026, 3, 7),
                    contract_amount=25000, requested_loan_amount=20000, down_payment_amount=5000,
                    loan_term_months=3, use_of_funds="working_capital",
                    application_status="pending", manual_review_required=True),

        # ═══ C006: 3 apps (2 approved, 1 pending) — Medium Risk, near limit ═══
        Application(application_id="A016", customer_id="C006", application_date=date(2025, 7, 1),
                    contract_amount=80000, requested_loan_amount=56000, down_payment_amount=24000,
                    loan_term_months=3, use_of_funds="inventory_purchase",
                    receivable_status="paid", disbursement_status="disbursed",
                    application_status="approved", manual_decision="pass"),
        Application(application_id="A017", customer_id="C006", application_date=date(2025, 10, 1),
                    contract_amount=100000, requested_loan_amount=70000, down_payment_amount=30000,
                    loan_term_months=3, days_past_due=45, use_of_funds="inventory_purchase",
                    receivable_status="overdue", disbursement_status="disbursed",
                    application_status="approved", manual_decision="pass", recovery_amount=42000),
        Application(application_id="A018", customer_id="C006", application_date=date(2026, 3, 10),
                    contract_amount=130000, requested_loan_amount=91000, down_payment_amount=39000,
                    loan_term_months=6, use_of_funds="inventory_purchase",
                    application_status="pending"),

        # ═══ C007: 2 apps (1 approved, 1 draft) — Low Risk, steady ═══
        Application(application_id="A019", customer_id="C007", application_date=date(2025, 10, 20),
                    contract_amount=140000, requested_loan_amount=84000, down_payment_amount=56000,
                    loan_term_months=3, use_of_funds="inventory_purchase",
                    receivable_status="not_yet_due", disbursement_status="disbursed",
                    application_status="approved", manual_decision="pass"),
        Application(application_id="A020", customer_id="C007", application_date=date(2026, 3, 12),
                    contract_amount=170000, requested_loan_amount=102000, down_payment_amount=68000,
                    loan_term_months=6, use_of_funds="inventory_purchase",
                    application_status="pending"),

        # ═══ C008: 2 apps (1 approved, 1 pending) — Medium Risk ═══
        Application(application_id="A021", customer_id="C008", application_date=date(2025, 11, 5),
                    contract_amount=90000, requested_loan_amount=72000, down_payment_amount=18000,
                    loan_term_months=6, use_of_funds="equipment_purchase",
                    receivable_status="due", disbursement_status="disbursed",
                    application_status="approved", manual_decision="pass"),
        Application(application_id="A022", customer_id="C008", application_date=date(2026, 3, 5),
                    contract_amount=85000, requested_loan_amount=68000, down_payment_amount=17000,
                    loan_term_months=6, use_of_funds="inventory_purchase",
                    application_status="pending"),

        # ═══ C009: 2 apps (2 approved, fully paid) — Low Risk, clean history ═══
        Application(application_id="A023", customer_id="C009", application_date=date(2025, 4, 1),
                    contract_amount=180000, requested_loan_amount=90000, down_payment_amount=90000,
                    loan_term_months=3, use_of_funds="inventory_purchase",
                    receivable_status="paid", disbursement_status="disbursed",
                    application_status="approved", manual_decision="pass"),
        Application(application_id="A024", customer_id="C009", application_date=date(2025, 9, 1),
                    contract_amount=220000, requested_loan_amount=110000, down_payment_amount=110000,
                    loan_term_months=3, use_of_funds="inventory_purchase",
                    receivable_status="paid", disbursement_status="disbursed",
                    application_status="approved", manual_decision="pass"),

        # ═══ C010: 1 app (pending + manual review) — High Risk, minimal history ═══
        Application(application_id="A025", customer_id="C010", application_date=date(2026, 3, 11),
                    contract_amount=40000, requested_loan_amount=36000, down_payment_amount=4000,
                    loan_term_months=6, use_of_funds="working_capital",
                    application_status="pending", manual_review_required=True),
    ]
    db.add_all(applications)

    # Trade Logistics
    trade_logistics = [
        # C001
        TradeLogistics(application_id="A001", etd=date(2025, 3, 20), eta=date(2025, 4, 15),
                       actual_arrival_date=date(2025, 4, 16), goods_type="brake_parts", goods_liquidity_level="high"),
        TradeLogistics(application_id="A002", etd=date(2025, 7, 25), eta=date(2025, 8, 18),
                       actual_arrival_date=date(2025, 8, 19), goods_type="engine_parts", goods_liquidity_level="high"),
        TradeLogistics(application_id="A003", etd=date(2025, 11, 15), eta=date(2025, 12, 10),
                       actual_arrival_date=date(2025, 12, 12), goods_type="mixed_parts", goods_liquidity_level="medium"),
        TradeLogistics(application_id="A004", etd=date(2026, 3, 5), eta=date(2026, 3, 28),
                       actual_arrival_date=None, goods_type="suspension_parts", goods_liquidity_level="high"),

        # C002
        TradeLogistics(application_id="A005", etd=date(2025, 6, 15), eta=date(2025, 7, 8),
                       actual_arrival_date=date(2025, 7, 9), goods_type="body_parts", goods_liquidity_level="medium"),
        TradeLogistics(application_id="A006", etd=date(2025, 9, 10), eta=date(2025, 10, 5),
                       actual_arrival_date=date(2025, 10, 6), goods_type="engine_parts", goods_liquidity_level="high"),
        TradeLogistics(application_id="A007", etd=date(2026, 3, 5), eta=date(2026, 3, 30),
                       actual_arrival_date=None, goods_type="mixed_parts", goods_liquidity_level="high"),

        # C003
        TradeLogistics(application_id="A008", etd=date(2025, 12, 5), eta=date(2025, 12, 28),
                       actual_arrival_date=date(2025, 12, 30), goods_type="accessories", goods_liquidity_level="low"),
        TradeLogistics(application_id="A009", etd=date(2026, 3, 10), eta=date(2026, 4, 5),
                       actual_arrival_date=date(2026, 4, 7), goods_type="accessories", goods_liquidity_level="low"),

        # C005
        TradeLogistics(application_id="A026", etd=date(2025, 10, 15), eta=date(2025, 11, 8),
                       actual_arrival_date=date(2025, 11, 10), goods_type="accessories", goods_liquidity_level="low"),

        # C004
        TradeLogistics(application_id="A010", etd=date(2025, 1, 25), eta=date(2025, 2, 18),
                       actual_arrival_date=date(2025, 2, 18), goods_type="brake_parts", goods_liquidity_level="high"),
        TradeLogistics(application_id="A011", etd=date(2025, 5, 18), eta=date(2025, 6, 10),
                       actual_arrival_date=date(2025, 6, 11), goods_type="engine_parts", goods_liquidity_level="high"),
        TradeLogistics(application_id="A012", etd=date(2025, 8, 20), eta=date(2025, 9, 12),
                       actual_arrival_date=date(2025, 9, 13), goods_type="mixed_parts", goods_liquidity_level="medium"),
        TradeLogistics(application_id="A013", etd=date(2026, 3, 12), eta=date(2026, 4, 5),
                       actual_arrival_date=None, goods_type="engine_parts", goods_liquidity_level="high"),

        # C006
        TradeLogistics(application_id="A016", etd=date(2025, 7, 5), eta=date(2025, 7, 28),
                       actual_arrival_date=date(2025, 7, 29), goods_type="brake_parts", goods_liquidity_level="high"),
        TradeLogistics(application_id="A017", etd=date(2025, 10, 5), eta=date(2025, 10, 28),
                       actual_arrival_date=date(2025, 10, 30), goods_type="suspension_parts", goods_liquidity_level="medium"),
        TradeLogistics(application_id="A018", etd=date(2026, 3, 15), eta=date(2026, 4, 8),
                       actual_arrival_date=None, goods_type="body_parts", goods_liquidity_level="medium"),

        # C007
        TradeLogistics(application_id="A019", etd=date(2025, 10, 25), eta=date(2025, 11, 18),
                       actual_arrival_date=date(2025, 11, 19), goods_type="mixed_parts", goods_liquidity_level="medium"),

        # C008
        TradeLogistics(application_id="A021", etd=date(2025, 11, 10), eta=date(2025, 12, 3),
                       actual_arrival_date=date(2025, 12, 5), goods_type="engine_parts", goods_liquidity_level="medium"),

        # C009
        TradeLogistics(application_id="A023", etd=date(2025, 4, 5), eta=date(2025, 4, 28),
                       actual_arrival_date=date(2025, 4, 28), goods_type="brake_parts", goods_liquidity_level="high"),
        TradeLogistics(application_id="A024", etd=date(2025, 9, 5), eta=date(2025, 9, 28),
                       actual_arrival_date=date(2025, 9, 29), goods_type="mixed_parts", goods_liquidity_level="high"),
    ]
    db.add_all(trade_logistics)

    # Pickup Records
    pickup_records = [
        # A001 — single fast pickup
        PickupRecord(application_id="A001", pickup_date=date(2025, 4, 18), pickup_percentage=100, note="Full pickup"),
        # A002 — single fast pickup
        PickupRecord(application_id="A002", pickup_date=date(2025, 8, 20), pickup_percentage=100, note="Full pickup"),
        # A003 — batch pickup, normal pace
        PickupRecord(application_id="A003", pickup_date=date(2025, 12, 14), pickup_percentage=60, note="First batch"),
        PickupRecord(application_id="A003", pickup_date=date(2025, 12, 20), pickup_percentage=40, note="Second batch"),

        # A005 — single
        PickupRecord(application_id="A005", pickup_date=date(2025, 7, 12), pickup_percentage=100, note="Full pickup"),
        # A006 — batch
        PickupRecord(application_id="A006", pickup_date=date(2025, 10, 10), pickup_percentage=40, note="First batch"),
        PickupRecord(application_id="A006", pickup_date=date(2025, 10, 18), pickup_percentage=35, note="Second batch"),
        PickupRecord(application_id="A006", pickup_date=date(2025, 10, 25), pickup_percentage=25, note="Final batch"),

        # A008 — slow pickup (C003, High Risk)
        PickupRecord(application_id="A008", pickup_date=date(2026, 1, 15), pickup_percentage=20, note="Delayed first pickup"),
        PickupRecord(application_id="A008", pickup_date=date(2026, 1, 28), pickup_percentage=30, note="Second pickup"),
        PickupRecord(application_id="A008", pickup_date=date(2026, 2, 10), pickup_percentage=25, note="Third pickup"),
        PickupRecord(application_id="A008", pickup_date=date(2026, 2, 25), pickup_percentage=25, note="Final pickup"),

        # A009 — slow pickup (C003)
        PickupRecord(application_id="A009", pickup_date=date(2026, 4, 25), pickup_percentage=30, note="Delayed start"),
        PickupRecord(application_id="A009", pickup_date=date(2026, 5, 10), pickup_percentage=40, note="Second batch"),
        PickupRecord(application_id="A009", pickup_date=date(2026, 5, 25), pickup_percentage=30, note="Final batch"),

        # A026 — slow pickup (C005, overdue)
        PickupRecord(application_id="A026", pickup_date=date(2025, 11, 25), pickup_percentage=30, note="Delayed first pickup"),
        PickupRecord(application_id="A026", pickup_date=date(2025, 12, 10), pickup_percentage=40, note="Second batch"),
        PickupRecord(application_id="A026", pickup_date=date(2025, 12, 28), pickup_percentage=30, note="Final batch"),

        # A010 — instant (C004)
        PickupRecord(application_id="A010", pickup_date=date(2025, 2, 19), pickup_percentage=100, note="Full pickup"),
        # A011 — fast (C004)
        PickupRecord(application_id="A011", pickup_date=date(2025, 6, 12), pickup_percentage=100, note="Full pickup"),
        # A012 — batch fast (C004)
        PickupRecord(application_id="A012", pickup_date=date(2025, 9, 14), pickup_percentage=70, note="Main batch"),
        PickupRecord(application_id="A012", pickup_date=date(2025, 9, 18), pickup_percentage=30, note="Remainder"),

        # A016 — single (C006)
        PickupRecord(application_id="A016", pickup_date=date(2025, 7, 31), pickup_percentage=100, note="Full pickup"),
        # A017 — batch (C006)
        PickupRecord(application_id="A017", pickup_date=date(2025, 11, 3), pickup_percentage=50, note="First batch"),
        PickupRecord(application_id="A017", pickup_date=date(2025, 11, 15), pickup_percentage=50, note="Second batch"),

        # A019 — batch (C007)
        PickupRecord(application_id="A019", pickup_date=date(2025, 11, 22), pickup_percentage=60, note="First batch"),
        PickupRecord(application_id="A019", pickup_date=date(2025, 11, 28), pickup_percentage=40, note="Second batch"),

        # A021 — batch (C008)
        PickupRecord(application_id="A021", pickup_date=date(2025, 12, 10), pickup_percentage=50, note="First batch"),
        PickupRecord(application_id="A021", pickup_date=date(2025, 12, 20), pickup_percentage=50, note="Second batch"),

        # A023 — instant (C009)
        PickupRecord(application_id="A023", pickup_date=date(2025, 4, 29), pickup_percentage=100, note="Full pickup"),
        # A024 — fast (C009)
        PickupRecord(application_id="A024", pickup_date=date(2025, 9, 30), pickup_percentage=100, note="Full pickup"),
    ]
    db.add_all(pickup_records)
    db.commit()

    # Generate AI outputs for all applications
    from crud import generate_ai_output
    for app_id in [f"A{i:03d}" for i in range(1, 27)]:
        generate_ai_output(db, app_id)

    # Set override + governance records to populate Governance section
    from models import AIOutput

    # A014 (C005 rejected) — full governance lifecycle
    ao_014 = db.query(AIOutput).filter(AIOutput.application_id == "A014").first()
    if ao_014:
        ao_014.override_flag = True
        ao_014.override_reason = "Senior review: customer lacks sufficient track record. High financing ratio (90%) with only 10% down payment on first application. Reject and require minimum 6 months additional cooperation history."
        ao_014.governance_follow_up = "Customer appealed on 2026-01-28. Credit committee reviewed and upheld rejection. Customer advised to build 6-month track record with smaller orders and higher down payments before reapplying."
        ao_014.governance_outcome = "Customer subsequently applied with A015 (reduced amount R20,000, 20% down payment). Currently pending manual review."

    # A026 (C005 overdue) — overdue governance
    ao_026 = db.query(AIOutput).filter(AIOutput.application_id == "A026").first()
    if ao_026:
        ao_026.override_flag = True
        ao_026.override_reason = "Post-disbursement review: buyer payment delayed beyond 25 days. Collateral recovery initiated for slow-moving accessories inventory."
        ao_026.governance_follow_up = "Collection notice sent to buyer on 2026-01-20. Partial collateral liquidation of R12,000 completed on 2026-02-05. Customer credit limit reduced from R500,000 to R300,000."
        ao_026.governance_outcome = "Partial recovery achieved (R12,000 of R28,000 = 43%). Remaining R16,000 outstanding. Customer downgraded to Grade D, status suspended."

    # A008 (C003 overdue 30 days) — overdue governance for another customer
    ao_008 = db.query(AIOutput).filter(AIOutput.application_id == "A008").first()
    if ao_008:
        ao_008.override_flag = True
        ao_008.override_reason = "Post-disbursement review: buyer overdue 30 days on low-liquidity accessories. Pickup pattern was abnormally slow (41 days across 4 batches)."
        ao_008.governance_follow_up = "Formal demand letter sent 2026-01-15. Collateral seized and partial liquidation completed. Legal counsel notified for potential recovery action."
        ao_008.governance_outcome = "R18,000 recovered from collateral sale (33% recovery rate). Low goods liquidity limited recovery. Customer suspended, all new applications require senior approval."

    db.commit()

    print("v2.0 Seed data loaded: 10 customers, 26 applications, trade logistics, pickup records, AI outputs generated.")
