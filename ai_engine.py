"""
AI Risk Summary & Credit Recommendation Generator — v3.0

Underwriting-oriented risk analysis:
- Concise English summary (3-5 sentences) for fast credit review
- Behavioral comparison: current app vs historical patterns
- Separated summary (analytical) from recommendation (prescriptive)
- Portfolio-level AI insight for dashboard
"""

import os
import json
from sqlalchemy.orm import Session
from models import Customer, Application, TradeLogistics, PickupRecord
import risk_policy


# ══════════════════════════════════════════════════════════════
# Portfolio-level AI Insight (English, for Dashboard)
# ══════════════════════════════════════════════════════════════

def generate_portfolio_insight(metrics: dict) -> str:
    """Generate a concise English portfolio-level AI narrative (90-170 words).

    Three parts:
      1) Portfolio Overview — utilization & broad health
      2) Risk Focus — where risk is concentrated
      3) Financial View — AR/AP, collections, exposure trajectory
    """
    api_key = os.environ.get("OPENAI_API_KEY")
    if api_key:
        result = _portfolio_insight_openai(metrics, api_key)
        if result:
            return result
    return _portfolio_insight_template(metrics)


def _portfolio_insight_template(m: dict) -> str:
    """Template-based portfolio insight generator."""
    util = m.get("utilization_ratio", 0)
    outstanding = m.get("current_outstanding", 0)
    capacity = m.get("remaining_capacity", 0)
    limit = m.get("project_total_limit", 1)
    total_apps = m.get("total_applications", 0)
    total_custs = m.get("total_customers", 0)
    avg_score = m.get("avg_risk_score", 0)
    total_loan = m.get("total_loan_amount", 0)
    overdue_count = m.get("overdue_count", 0)
    overdue_amount = m.get("overdue_amount", 0)
    collection_rate = m.get("collection_rate", 1.0)
    ar = m.get("total_accounts_receivable", 0)
    ap = m.get("total_accounts_payable", 0)
    risk_dist = m.get("risk_distribution", {})
    high_risk = risk_dist.get("high", 0)
    medium_risk = risk_dist.get("medium", 0)
    low_risk = risk_dist.get("low", 0)
    overdue_ratio = overdue_count / total_apps if total_apps > 0 else 0

    # ── Part 1: Portfolio Overview ──
    if util < 0.3:
        p1 = (f"The portfolio is operating at a conservative utilization level of {util:.0%}, "
              f"with substantial headroom remaining against the project limit.")
    elif util < 0.6:
        p1 = (f"Portfolio utilization stands at {util:.0%}, indicating a moderate deployment of capacity "
              f"with adequate room for selective new originations.")
    elif util < 0.8:
        p1 = (f"Utilization has reached {util:.0%}, approaching a level where new approvals should be "
              f"evaluated more carefully to preserve portfolio flexibility.")
    else:
        p1 = (f"The portfolio is running at {util:.0%} utilization, leaving limited spare capacity. "
              f"New originations should be highly selective until outstanding balances reduce.")

    # Health qualifier based on avg score
    if avg_score >= 80:
        p1 += f" The average risk score of {avg_score:.0f} signals a broadly healthy book."
    elif avg_score >= 65:
        p1 += f" With an average risk score of {avg_score:.0f}, overall credit quality is acceptable but warrants monitoring."
    else:
        p1 += f" The average risk score of {avg_score:.0f} indicates elevated credit stress across the portfolio."

    # ── Part 2: Risk Focus ──
    total_scored = high_risk + medium_risk + low_risk
    if total_scored > 0 and high_risk == 0 and overdue_count == 0:
        p2 = ("Risk concentration is minimal — no high-risk applications are on the books "
              "and no overdue exposure exists at this time.")
    elif high_risk > 0 and overdue_count == 0:
        high_pct = high_risk / total_scored
        p2 = (f"High-risk applications account for {high_pct:.0%} of scored cases "
              f"({high_risk} of {total_scored}), though none are currently overdue, "
              f"suggesting the pressure remains latent rather than realized.")
    elif overdue_count > 0 and high_risk <= 2:
        p2 = (f"Overdue exposure totals R{overdue_amount:,.0f} across {overdue_count} "
              f"{'loan' if overdue_count == 1 else 'loans'} ({overdue_ratio:.0%} of the book). "
              f"The concentration appears limited to a small number of weaker accounts "
              f"rather than reflecting broad deterioration.")
    elif overdue_count > 0 and high_risk > 2:
        p2 = (f"Overdue exposure of R{overdue_amount:,.0f} across {overdue_count} loans, "
              f"combined with {high_risk} high-risk applications, suggests risk pressure "
              f"is building and may require proactive portfolio-level intervention.")
    else:
        p2 = (f"Risk is distributed across {medium_risk} medium-risk and {high_risk} high-risk "
              f"applications. Current overdue exposure is R{overdue_amount:,.0f}.")

    # ── Part 3: Financial View ──
    parts3 = []
    if ar > 0 and ap > 0:
        parts3.append(
            f"From a financial perspective, accounts receivable of R{ar:,.0f} against payables "
            f"of R{ap:,.0f} reflects the portfolio's net funding structure."
        )
    elif ar > 0:
        parts3.append(
            f"From a financial perspective, outstanding receivables of R{ar:,.0f} form the "
            f"primary cash recovery pipeline for the program."
        )
    else:
        parts3.append("From a financial perspective,")

    if collection_rate >= 0.95:
        parts3.append(
            "Collection efficiency is strong, supporting stable cash flow recovery "
            "and providing confidence for continued origination."
        )
    elif collection_rate >= 0.85:
        parts3.append(
            f"Collection efficiency at {collection_rate:.0%} is adequate, "
            f"though any further slippage could begin to pressure liquidity and reduce "
            f"flexibility for new disbursements."
        )
    else:
        parts3.append(
            f"Collection efficiency of {collection_rate:.0%} is below target and warrants "
            f"close attention — persistent underperformance here could constrain future "
            f"lending capacity and increase liquidity risk."
        )

    if overdue_amount > 0 and outstanding > 0:
        overdue_share = overdue_amount / outstanding
        if overdue_share > 0.15:
            parts3.append(
                f"Overdue balances represent {overdue_share:.0%} of current outstanding, "
                f"a level that could slow overall cash recovery if not addressed."
            )
        elif overdue_share > 0.05:
            parts3.append(
                f"While overdue exposure remains a manageable share of the book, "
                f"further deterioration should be closely watched."
            )
    elif outstanding > 0 and total_loan > outstanding * 2:
        parts3.append(
            "Total loan volume suggests the program has been actively cycling capital, "
            "which is a positive sign of portfolio turnover."
        )

    p3 = " ".join(parts3)

    return f"{p1}\n\n{p2}\n\n{p3}"


def _portfolio_insight_openai(metrics: dict, api_key: str) -> str | None:
    """Generate portfolio insight using OpenAI API."""
    try:
        import openai
        client = openai.OpenAI(api_key=api_key)

        prompt = f"""You are an AI portfolio risk copilot for a supply chain finance program (auto parts reverse factoring). Generate a concise English portfolio-level narrative for a business head / risk manager.

== PORTFOLIO METRICS ==
- Project Limit: R{metrics.get('project_total_limit', 0):,.0f}
- Current Outstanding: R{metrics.get('current_outstanding', 0):,.0f}
- Remaining Capacity: R{metrics.get('remaining_capacity', 0):,.0f}
- Utilization: {metrics.get('utilization_ratio', 0):.1%}
- Total Customers: {metrics.get('total_customers', 0)}
- Total Applications: {metrics.get('total_applications', 0)}
- Total Loan Volume: R{metrics.get('total_loan_amount', 0):,.0f}
- Avg Risk Score: {metrics.get('avg_risk_score', 0):.1f}/100
- Risk Distribution: Low={metrics.get('risk_distribution', {}).get('low', 0)}, Medium={metrics.get('risk_distribution', {}).get('medium', 0)}, High={metrics.get('risk_distribution', {}).get('high', 0)}
- Overdue Count: {metrics.get('overdue_count', 0)}/{metrics.get('total_applications', 0)}
- Overdue Amount: R{metrics.get('overdue_amount', 0):,.0f}
- Collection Rate: {metrics.get('collection_rate', 0):.1%}
- Accounts Receivable: R{metrics.get('total_accounts_receivable', 0):,.0f}
- Accounts Payable: R{metrics.get('total_accounts_payable', 0):,.0f}

== OUTPUT STRUCTURE ==
Write exactly 3 short paragraphs (no headings, no bullet points):

1) Portfolio Overview — utilization, broad health, whether the book looks stable
2) Risk Focus — where risk is concentrated, whether overdue exposure is localized or systemic
3) Financial View — AR vs AP, collection efficiency, exposure trajectory

== RULES ==
- 90-170 words total
- English only
- Interpret, don't restate numbers mechanically
- No specific approval actions (this is portfolio-level)
- Tone: intelligent portfolio/risk copilot for management
- Do NOT use headings or labels like "Portfolio Overview:" — just write flowing paragraphs"""

        response = client.chat.completions.create(
            model="gpt-4o-mini",
            messages=[{"role": "user", "content": prompt}],
            temperature=0.4,
            max_tokens=300,
        )
        text = response.choices[0].message.content.strip()
        if len(text) > 50:
            return text
        return None
    except Exception as e:
        print(f"OpenAI portfolio insight error: {e}, falling back to template")
        return None


def generate_risk_summary(customer: Customer, application: Application,
                          trade_logi: TradeLogistics | None,
                          pickup_records: list | None,
                          scores: dict, anomaly_flags: list[str],
                          db: Session = None) -> dict:
    """Generate AI risk summary, recommendation, and explanation."""
    api_key = os.environ.get("OPENAI_API_KEY")
    if api_key:
        result = _generate_with_openai(customer, application, trade_logi,
                                       pickup_records, scores, anomaly_flags, api_key, db)
        if result:
            return result

    return _generate_template_based(customer, application, trade_logi,
                                    pickup_records, scores, anomaly_flags, db)


def _build_historical_analysis(customer, application, db):
    """Analyze customer's full history for the AI summary."""
    if not db:
        return {}

    all_apps = db.query(Application).filter(
        Application.customer_id == customer.customer_id
    ).order_by(Application.application_date).all()

    past_apps = [a for a in all_apps if a.application_id != application.application_id]

    # --- Loan term preferences (past only) ---
    past_term_counts = {3: 0, 6: 0}
    for a in past_apps:
        t = a.loan_term_months or 3
        past_term_counts[t] = past_term_counts.get(t, 0) + 1
    preferred_term = max(past_term_counts, key=past_term_counts.get) if any(past_term_counts.values()) else 3

    # --- Past down payment ratios ---
    past_dp_ratios = []
    for a in past_apps:
        if a.contract_amount and a.contract_amount > 0:
            past_dp_ratios.append(round((a.down_payment_amount or 0) / a.contract_amount, 2))
    past_avg_dp = round(sum(past_dp_ratios) / len(past_dp_ratios), 2) if past_dp_ratios else None
    dp_trend = "stable"
    if len(past_dp_ratios) >= 3:
        first_half = sum(past_dp_ratios[:len(past_dp_ratios)//2]) / max(len(past_dp_ratios)//2, 1)
        second_half = sum(past_dp_ratios[len(past_dp_ratios)//2:]) / max(len(past_dp_ratios) - len(past_dp_ratios)//2, 1)
        if second_half > first_half + 0.05:
            dp_trend = "increasing"
        elif second_half < first_half - 0.05:
            dp_trend = "decreasing"

    # --- Past financing ratios ---
    past_fin_ratios = []
    for a in past_apps:
        if a.contract_amount and a.contract_amount > 0:
            past_fin_ratios.append(round((a.requested_loan_amount or 0) / a.contract_amount, 2))
    past_avg_fin = round(sum(past_fin_ratios) / len(past_fin_ratios), 2) if past_fin_ratios else None

    # --- Past average loan amounts ---
    past_loan_amounts = [a.requested_loan_amount or 0 for a in past_apps if a.requested_loan_amount]
    past_avg_loan = round(sum(past_loan_amounts) / len(past_loan_amounts)) if past_loan_amounts else None

    # --- Default / overdue history ---
    defaults = []
    for a in past_apps:
        if (a.days_past_due or 0) > 0:
            defaults.append({
                "app_id": a.application_id,
                "days_overdue": a.days_past_due,
                "loan_amount": a.requested_loan_amount or 0,
                "recovery_amount": a.recovery_amount or 0,
            })

    # --- Pickup behavior across past apps ---
    pickup_patterns = []
    slow_count = 0
    for a in past_apps:
        tl = db.query(TradeLogistics).filter(TradeLogistics.application_id == a.application_id).first()
        prs = db.query(PickupRecord).filter(
            PickupRecord.application_id == a.application_id
        ).order_by(PickupRecord.pickup_date).all()

        if prs:
            sorted_prs = sorted(prs, key=lambda r: r.pickup_date)
            first_date = sorted_prs[0].pickup_date
            last_date = sorted_prs[-1].pickup_date
            span_days = (last_date - first_date).days if len(prs) > 1 else 0

            days_from_arrival = None
            if tl and tl.actual_arrival_date:
                days_from_arrival = (first_date - tl.actual_arrival_date).days

            if len(prs) == 1 and span_days == 0:
                speed = "fast"
            elif span_days <= 14:
                speed = "fast"
            elif span_days <= 30:
                speed = "normal"
            else:
                speed = "slow"
                slow_count += 1

            pickup_patterns.append({
                "span_days": span_days,
                "days_from_arrival": days_from_arrival,
                "speed": speed,
            })

    # --- Goods liquidity across past apps ---
    liquidity_levels = []
    for a in past_apps:
        tl = db.query(TradeLogistics).filter(TradeLogistics.application_id == a.application_id).first()
        if tl and tl.goods_liquidity_level:
            liquidity_levels.append(tl.goods_liquidity_level)

    mostly_high_liq = liquidity_levels.count("high") > len(liquidity_levels) / 2 if liquidity_levels else False
    mostly_low_liq = liquidity_levels.count("low") > len(liquidity_levels) / 2 if liquidity_levels else False

    # --- Average approved term ---
    approved_terms = [a.loan_term_months or 3 for a in past_apps if a.application_status == "approved"]
    avg_term = round(sum(approved_terms) / len(approved_terms), 1) if approved_terms else None

    return {
        "past_apps_count": len(past_apps),
        "approved_count": sum(1 for a in past_apps if a.application_status == "approved"),
        "rejected_count": sum(1 for a in past_apps if a.application_status == "rejected"),
        "preferred_term": preferred_term,
        "past_term_counts": past_term_counts,
        "past_avg_dp": past_avg_dp,
        "dp_trend": dp_trend,
        "past_avg_fin": past_avg_fin,
        "past_avg_loan": past_avg_loan,
        "defaults": defaults,
        "default_count": len(defaults),
        "total_default_amount": sum(d["loan_amount"] for d in defaults),
        "total_recovery": sum(d["recovery_amount"] for d in defaults),
        "pickup_patterns": pickup_patterns,
        "slow_pickups": slow_count,
        "mostly_high_liq": mostly_high_liq,
        "mostly_low_liq": mostly_low_liq,
        "avg_term": avg_term,
    }


# ══════════════════════════════════════════════════════════════
# English underwriting summary builder (v3.0)
# ══════════════════════════════════════════════════════════════

def _build_english_summary(customer, application, trade_logi, pickup_records,
                           scores, anomaly_flags, hist) -> str:
    """Build a concise English risk summary for underwriting review.

    Target: 3-5 sentences.
    Structure:
      S1 — overall risk characterization
      S2 — key supporting signals (repayment, relationship)
      S3 — compare current app vs historical behavior
      S4 — logistics / pickup (only if meaningful)
      S5 — main watchpoint (optional)
    """
    risk_level = scores["risk_level"]
    total = scores["total_risk_score"]
    contract = application.contract_amount or 0
    loan = application.requested_loan_amount or 0
    down = application.down_payment_amount or 0
    cur_fin_ratio = loan / contract if contract > 0 else 0
    cur_dp_ratio = down / contract if contract > 0 else 0
    cur_term = application.loan_term_months or 3
    coop = customer.cooperation_months or 0
    has_history = hist and hist["past_apps_count"] > 0

    # ── Detect aggressiveness vs history ──
    aggressive_signals = []
    if has_history:
        if hist["avg_term"] and cur_term > hist["avg_term"]:
            t3 = hist["past_term_counts"].get(3, 0)
            if t3 > 0 and cur_term == 6:
                aggressive_signals.append("term_longer")
        if hist["past_avg_fin"] is not None and cur_fin_ratio > hist["past_avg_fin"] + 0.05:
            aggressive_signals.append("higher_leverage")
        if hist["past_avg_dp"] is not None and cur_dp_ratio < hist["past_avg_dp"] - 0.05:
            aggressive_signals.append("lower_dp")
        if hist["past_avg_loan"] and loan > hist["past_avg_loan"] * 1.5:
            aggressive_signals.append("larger_amount")

    is_aggressive = len(aggressive_signals) > 0
    is_clearly_outside = len(aggressive_signals) >= 2

    # ── Sentence 1: Overall risk characterization ──
    if risk_level == "low" and has_history and not is_aggressive:
        if coop >= 24:
            s1 = "This customer has a stable cooperation record and presents an overall low-risk profile."
        else:
            s1 = "This customer has performed well and currently presents low overall risk."
    elif risk_level == "low" and is_aggressive:
        s1 = "This customer has a good track record, but the current application structure is more aggressive than prior patterns."
    elif risk_level == "medium" and has_history and not is_aggressive:
        s1 = "This customer has a reasonably stable record and presents a medium-risk profile overall."
    elif risk_level == "medium" and is_aggressive:
        s1 = "This customer has an acceptable baseline, but the current application is more aggressive than historical behavior, resulting in a medium-risk assessment."
    elif risk_level == "medium" and not has_history:
        s1 = "This customer has limited history and requires behavioral verification; the current assessment is medium risk."
    elif risk_level == "high" and has_history:
        if hist["default_count"] > 0:
            s1 = "This customer has a history of overdue payments and presents an elevated risk profile."
        else:
            s1 = "This customer is assessed as high risk, primarily due to weaker fundamentals or transaction structure."
    elif risk_level == "high":
        if coop <= 6:
            s1 = "This customer has a very short cooperation history with limited records, and is currently assessed as high risk."
        else:
            s1 = "This customer is assessed as high risk overall."
    else:
        level_en = "low" if risk_level == "low" else "medium" if risk_level == "medium" else "high"
        s1 = f"This customer has a composite risk score of {total}/100 and is assessed as {level_en} risk."

    # ── Sentence 2: Key supporting signals ──
    if has_history:
        approved = hist["approved_count"]
        rejected = hist["rejected_count"]
        default_count = hist["default_count"]

        if default_count == 0 and rejected == 0:
            if hist["past_avg_dp"] and hist["past_avg_dp"] >= 0.25:
                s2 = f"All {approved} prior applications were approved with no overdue events, and down payments averaged around {hist['past_avg_dp']:.0%}, reflecting sound repayment discipline."
            else:
                s2 = f"All {approved} prior applications were approved with no overdue events, indicating acceptable repayment discipline."
        elif default_count > 0:
            total_def = hist["total_default_amount"]
            total_rec = hist["total_recovery"]
            max_overdue = max(d["days_overdue"] for d in hist["defaults"])
            if total_rec > 0:
                rec_rate = total_rec / total_def * 100 if total_def > 0 else 0
                s2 = f"There are {default_count} prior overdue events (longest: {max_overdue} days) with a recovery rate of approximately {rec_rate:.0f}%, indicating material repayment weaknesses."
            else:
                s2 = f"There are {default_count} prior overdue events (longest: {max_overdue} days), indicating material repayment weaknesses."
        elif rejected > 0:
            s2 = f"Of {approved + rejected} prior applications, {rejected} were rejected — it is important to verify whether the reasons for prior rejections have been resolved."
        else:
            s2 = f"There are {approved} prior approved applications; repayment performance still requires further validation."
    else:
        if coop <= 6:
            s2 = "This is a new customer with no prior financing history; risk assessment relies on the current transaction behavior."
        else:
            s2 = "This customer has no prior financing history, so repayment behavior remains unverified."

    # ── Sentence 3: Compare current app vs history ──
    if has_history and is_aggressive:
        changes = []
        if "term_longer" in aggressive_signals:
            t3 = hist["past_term_counts"].get(3, 0)
            t6 = hist["past_term_counts"].get(6, 0)
            if t3 > 0 and t6 == 0:
                changes.append(f"the loan term has been extended from the usual 3 months to {cur_term} months")
            else:
                changes.append(f"the loan term has been extended to {cur_term} months (previously mostly {hist['preferred_term']} months)")
        if "higher_leverage" in aggressive_signals:
            changes.append(f"the financing ratio has increased to {cur_fin_ratio:.0%} (historical average: {hist['past_avg_fin']:.0%})")
        if "lower_dp" in aggressive_signals:
            changes.append(f"the down payment ratio has dropped to {cur_dp_ratio:.0%} (historical average: {hist['past_avg_dp']:.0%})")
        if "larger_amount" in aggressive_signals:
            changes.append("the loan amount is significantly above the historical average")

        change_text = ", ".join(changes)
        if is_clearly_outside:
            s3 = f"Compared to historical behavior, this application is notably more aggressive: {change_text} — representing a significant deviation."
        else:
            s3 = f"Compared to prior financing patterns, {change_text}, which elevates the risk somewhat."
    elif has_history:
        s3 = "The term, down payment, and financing ratio of this application are broadly consistent with historical behavior, with no notable deviations."
    else:
        s3 = ""

    # ── Sentence 4: Logistics / pickup (only if meaningful) ──
    s4 = ""
    pickups = pickup_records or []
    if has_history and hist["pickup_patterns"]:
        slow = hist["slow_pickups"]
        total_tracked = len(hist["pickup_patterns"])
        if slow > total_tracked / 2:
            s4 = "Historical pickup pace has been slow, with low goods turnover, raising concerns about collateral disposal capacity."
        elif slow == 0 and scores.get("score_logistics", 0) >= 18:
            if hist["mostly_high_liq"]:
                s4 = "Historical pickups have been prompt and goods liquidity is high, providing positive collateral support."
            elif not hist["mostly_low_liq"]:
                s4 = "Historical pickup pace has been prompt, with reasonable goods turnover supporting collateral liquidity."
        elif hist["mostly_low_liq"]:
            s4 = "Historical goods have been predominantly low-liquidity items, meaning collateral disposal would be difficult in a default scenario."

    if trade_logi and pickups and scores.get("score_logistics", 25) < 10:
        s4 = "Pickup behavior on this application is abnormally slow, raising serious concerns about collateral turnover."
    elif not trade_logi and not has_history:
        pass

    # ── Sentence 5: Main watchpoint ──
    s5 = ""
    watchpoints = []

    utilization = 0
    if customer.total_credit_limit and customer.total_credit_limit > 0:
        utilization = (customer.current_outstanding_amount or 0) / customer.total_credit_limit
    if utilization > risk_policy.customer_utilization_warning_threshold:
        watchpoints.append(("util", f"Credit utilization has reached {utilization:.0%}, approaching the facility limit — concentration risk is elevated."))

    if (application.days_past_due or 0) > 0:
        watchpoints.append(("overdue", f"This application is currently {application.days_past_due} days past due; buyer repayment capacity is the key risk factor."))

    if "term_longer" in aggressive_signals and risk_level != "high":
        watchpoints.append(("term", "The primary concern is buyer repayment capacity over the extended loan tenor."))

    if cur_fin_ratio >= 0.85:
        watchpoints.append(("leverage", f"The financing ratio of {cur_fin_ratio:.0%} is very high, meaning insufficient own-funds participation is the main risk driver."))

    if customer.credit_grade == "D":
        watchpoints.append(("grade", "The internal credit grade of D indicates weak fundamentals as the primary constraint."))

    if not has_history and coop <= 6:
        watchpoints.append(("new", "The very short cooperation history and lack of behavioral data is the main source of uncertainty."))

    if watchpoints:
        priority = ["overdue", "util", "leverage", "grade", "term", "new"]
        for key in priority:
            match = [w for w in watchpoints if w[0] == key]
            if match:
                s5 = match[0][1]
                break

    # ── Assemble ──
    sentences = [s for s in [s1, s2, s3, s4, s5] if s]
    return " ".join(sentences)


def _generate_template_based(customer, application, trade_logi, pickup_records,
                             scores, anomaly_flags, db=None) -> dict:
    """Template-based AI summary generator — v2.0 underwriting-oriented."""

    risk_level = scores["risk_level"]
    total = scores["total_risk_score"]
    contract = application.contract_amount or 0
    loan = application.requested_loan_amount or 0
    down = application.down_payment_amount or 0
    fin_ratio = loan / contract if contract > 0 else 0
    dp_ratio = down / contract if contract > 0 else 0
    term = application.loan_term_months or 3

    hist = _build_historical_analysis(customer, application, db)

    # ── Build AI Risk Summary (English, concise, analytical) ──
    level_label = {"low": "Low Risk", "medium": "Medium Risk", "high": "High Risk"}[risk_level]

    ai_risk_summary = _build_english_summary(
        customer, application, trade_logi, pickup_records,
        scores, anomaly_flags, hist
    )

    # ── Credit Recommendation ──
    if risk_level == "low":
        rec_dp = "25%-30%"
        rec_term = "6 months"
        rec_band = f"R{loan * 0.9:,.0f} - R{loan * 1.05:,.0f}"
        rec_text = (
            f"Recommend proceeding under standard approval. "
            f"Loan amount within {rec_band} and down payment of {rec_dp} is appropriate. "
            f"A 6-month term is acceptable given current behavior."
        )
    elif risk_level == "medium":
        rec_dp = "25%-35%"
        rec_term = "3 months"
        rec_band = f"R{loan * 0.7:,.0f} - R{loan * 0.9:,.0f}"
        rec_text = (
            f"Customer is on Watchlist. Recommend cautious approval with conservative structure. "
            f"Suggest at least 25% down payment, prioritize 3-month term. "
            f"Recommended loan range: {rec_band}. Manual review required."
        )
    else:
        rec_dp = "N/A"
        rec_term = "N/A"
        rec_band = "N/A"
        rec_text = (
            f"Customer is High Risk (Score: {total}/100). "
            f"Do not approve new financing under standard program. "
            f"Any exception requires senior management approval and enhanced risk mitigation."
        )

    # ── Explanation ──
    explanation_parts = [
        f"Scoring Breakdown:",
        f"  - Business Stability: {scores['score_stability']}/25",
        f"  - Repayment History: {scores['score_repayment']}/25",
        f"  - Financing Structure: {scores['score_structure']}/25",
        f"  - Logistics & Pickup: {scores['score_logistics']}/25",
        f"  - Total: {total}/100 ({level_label})",
    ]
    if anomaly_flags:
        explanation_parts.append(f"\nAnomalies Detected ({len(anomaly_flags)}):")
        for f in anomaly_flags:
            explanation_parts.append(f"  - {f}")

    ai_explanation = "\n".join(explanation_parts)

    return {
        "ai_risk_summary": ai_risk_summary,
        "ai_recommendation": rec_text,
        "ai_explanation": ai_explanation,
        "recommended_loan_band": rec_band,
        "recommended_term": rec_term,
        "recommended_down_payment_ratio": rec_dp,
    }


def _generate_with_openai(customer, application, trade_logi, pickup_records,
                          scores, anomaly_flags, api_key, db=None) -> dict | None:
    """Generate AI summary using OpenAI API."""
    try:
        import openai
        client = openai.OpenAI(api_key=api_key)

        hist = _build_historical_analysis(customer, application, db)
        fin_ratio = (application.requested_loan_amount or 0) / (application.contract_amount or 1)
        dp_ratio = (application.down_payment_amount or 0) / (application.contract_amount or 1)

        hist_context = ""
        if hist and hist.get("past_apps_count", 0) > 0:
            t3 = hist["past_term_counts"].get(3, 0)
            t6 = hist["past_term_counts"].get(6, 0)
            hist_context = f"""
== Historical Analysis ==
- Past applications: {hist['past_apps_count']} ({hist['approved_count']} approved, {hist['rejected_count']} rejected)
- Term preference: {t3}x 3-month, {t6}x 6-month (avg approved term: {hist.get('avg_term', 'N/A')} months)
- Avg historical down payment ratio: {hist['past_avg_dp']:.0%}, trend: {hist['dp_trend']}
- Avg historical financing ratio: {hist['past_avg_fin']:.0%}
- Overdue history: {hist['default_count']} events, total overdue: R{hist['total_default_amount']:,.0f}, recovered: R{hist['total_recovery']:,.0f}
- Pickup pace: {len(hist['pickup_patterns'])} with pickup records, {hist['slow_pickups']} slow
- Goods liquidity: {'mostly high' if hist['mostly_high_liq'] else 'mostly low' if hist['mostly_low_liq'] else 'mixed'}
"""

        prompt = f"""You are a supply chain finance pre-loan AI analyst. Generate a concise English risk summary for credit underwriters.

== Role ==
You are a credit analyst. Compress the most decision-relevant signals into a brief narrative.

== Core Objective ==
The summary must quickly answer 3 questions:
1) What kind of customer is this? (overall quality judgement)
2) Is this application consistent with historical behavior, or more aggressive?
3) What is the single main risk factor to watch?

== Customer Info ==
Customer: {customer.customer_name}
Industry: {customer.industry_type}, {customer.years_in_auto_parts} years experience
Cooperation: {customer.cooperation_months} months
Key customer: {customer.is_key_customer}
Internal grade: {customer.credit_grade}
Status: {customer.customer_status}

== Current Application ==
Contract: R{application.contract_amount:,.0f}, Loan: R{application.requested_loan_amount:,.0f}
Down payment: R{application.down_payment_amount:,.0f} ({dp_ratio:.1%})
Financing ratio: {fin_ratio:.1%}, Term: {application.loan_term_months} months

== Scores ==
Stability {scores['score_stability']}/25, Repayment {scores['score_repayment']}/25, Structure {scores['score_structure']}/25, Logistics {scores['score_logistics']}/25, Total {scores['total_risk_score']}/100 ({scores['risk_level']})

Anomaly flags: {json.dumps(anomaly_flags) if anomaly_flags else 'None'}
{hist_context}

== Output Requirements ==
Generate JSON with these fields:

1. ai_risk_summary: English risk summary (3-5 sentences)
   - S1: Overall risk characterization
   - S2: Key supporting signals (repayment discipline, overdue history)
   - S3: Comparison vs historical behavior (term/leverage/down payment deviation)
   - S4: Logistics/pickup implications (only if meaningful)
   - S5 (optional): Key watchpoint

   Do NOT: restate fields mechanically, list percentile rankings, or give approval actions

   Good style example:
   "This customer has a reasonably stable record and presents a medium-risk profile overall. All prior applications were approved with no overdue events, and down payments have been broadly consistent, reflecting acceptable repayment discipline. Compared to prior financing patterns, the loan term has been extended from 3 to 6 months, with the primary risk coming from the longer tenor. Historical pickups have been prompt and goods liquidity provides reasonable collateral support. The key concern is buyer repayment capacity over the extended loan period."

2. ai_recommendation: English credit recommendation (approval guidance goes here)
3. ai_explanation: English scoring breakdown

Also provide: recommended_loan_band, recommended_term ("3 months"/"6 months"/"N/A"), recommended_down_payment_ratio
Format: JSON"""

        response = client.chat.completions.create(
            model="gpt-4o-mini",
            messages=[{"role": "user", "content": prompt}],
            response_format={"type": "json_object"},
            temperature=0.3,
        )
        return json.loads(response.choices[0].message.content)
    except Exception as e:
        print(f"OpenAI API error: {e}, falling back to template-based generation")
        return None
