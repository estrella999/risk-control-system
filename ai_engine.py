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

def generate_portfolio_insight(metrics: dict) -> dict:
    """Generate bilingual portfolio-level AI narrative.

    Returns dict with 'en' and 'zh' keys.
    """
    api_key = os.environ.get("OPENAI_API_KEY")
    en_text = None
    if api_key:
        en_text = _portfolio_insight_openai(metrics, api_key)
    if not en_text:
        en_text = _portfolio_insight_template(metrics)
    zh_text = _portfolio_insight_template_zh(metrics)
    return {"en": en_text, "zh": zh_text}


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


def _portfolio_insight_template_zh(m: dict) -> str:
    """Chinese template-based portfolio insight generator."""
    util = m.get("utilization_ratio", 0)
    outstanding = m.get("current_outstanding", 0)
    avg_score = m.get("avg_risk_score", 0)
    total_apps = m.get("total_applications", 0)
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

    if util < 0.3:
        p1 = f"组合额度使用率为{util:.0%}，处于保守水平，剩余额度充裕。"
    elif util < 0.6:
        p1 = f"组合额度使用率为{util:.0%}，资金配置适中，仍有空间进行选择性新增放款。"
    elif util < 0.8:
        p1 = f"额度使用率已达{util:.0%}，新增审批应更加审慎以保持组合灵活性。"
    else:
        p1 = f"组合额度使用率已达{util:.0%}，剩余空间有限。新增放款应高度筛选，待在贷余额下降后再行扩展。"

    if avg_score >= 80:
        p1 += f" 平均风险评分{avg_score:.0f}分，整体信用质量良好。"
    elif avg_score >= 65:
        p1 += f" 平均风险评分{avg_score:.0f}分，信用质量尚可但需持续监控。"
    else:
        p1 += f" 平均风险评分{avg_score:.0f}分，组合整体信用压力偏高。"

    total_scored = high_risk + medium_risk + low_risk
    if total_scored > 0 and high_risk == 0 and overdue_count == 0:
        p2 = "风险集中度极低——无高风险申请在册，亦无逾期敞口。"
    elif high_risk > 0 and overdue_count == 0:
        high_pct = high_risk / total_scored
        p2 = f"高风险申请占已评分案例的{high_pct:.0%}（{high_risk}/{total_scored}），但暂无逾期，风险尚处于潜伏状态。"
    elif overdue_count > 0 and high_risk <= 2:
        p2 = f"逾期敞口共计R{overdue_amount:,.0f}，涉及{overdue_count}笔贷款（占比{overdue_ratio:.0%}）。集中于少数较弱账户，尚未呈现广泛恶化趋势。"
    elif overdue_count > 0 and high_risk > 2:
        p2 = f"逾期敞口R{overdue_amount:,.0f}，涉及{overdue_count}笔贷款，叠加{high_risk}笔高风险申请，风险压力正在积聚，可能需要组合层面的主动干预。"
    else:
        p2 = f"风险分布于{medium_risk}笔中风险和{high_risk}笔高风险申请中。当前逾期敞口为R{overdue_amount:,.0f}。"

    parts3 = []
    if ar > 0 and ap > 0:
        parts3.append(f"财务方面，应收账款R{ar:,.0f}对应应付账款R{ap:,.0f}，反映了组合的净融资结构。")
    elif ar > 0:
        parts3.append(f"财务方面，在途应收R{ar:,.0f}构成主要的现金回收管道。")
    else:
        parts3.append("财务方面，")

    if collection_rate >= 0.95:
        parts3.append("回收效率良好，现金流回收稳定，支撑持续放款。")
    elif collection_rate >= 0.85:
        parts3.append(f"回收效率{collection_rate:.0%}尚可，但进一步下滑可能影响流动性和新增放款空间。")
    else:
        parts3.append(f"回收效率{collection_rate:.0%}低于目标，需密切关注——持续欠佳将制约未来放款能力并增加流动性风险。")

    if overdue_amount > 0 and outstanding > 0:
        overdue_share = overdue_amount / outstanding
        if overdue_share > 0.15:
            parts3.append(f"逾期余额占在贷余额的{overdue_share:.0%}，若不及时处理可能拖累整体资金回收。")
        elif overdue_share > 0.05:
            parts3.append("逾期敞口尚在可控范围，但需警惕进一步恶化。")

    p3 = "".join(parts3)
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
                          scores: dict, anomaly_flags: list,
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


def _build_chinese_summary(customer, application, trade_logi, pickup_records,
                           scores, anomaly_flags, hist) -> str:
    """Build a concise Chinese risk summary paralleling the English version."""
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
    level_zh = {"low": "低风险", "medium": "中风险", "high": "高风险"}[risk_level]

    # S1: 总体风险判断
    if risk_level == "low" and has_history and not is_aggressive:
        if coop >= 24:
            s1 = "该客户合作记录稳定，整体呈低风险特征。"
        else:
            s1 = "该客户表现良好，当前整体风险较低。"
    elif risk_level == "low" and is_aggressive:
        s1 = "该客户历史记录良好，但本次申请结构较以往更为激进。"
    elif risk_level == "medium" and has_history and not is_aggressive:
        s1 = "该客户历史记录尚可，整体为中等风险。"
    elif risk_level == "medium" and is_aggressive:
        s1 = "该客户基本面可接受，但本次申请较历史行为更激进，评估为中等风险。"
    elif risk_level == "medium" and not has_history:
        s1 = "该客户历史数据有限，需进一步验证行为表现；当前评估为中等风险。"
    elif risk_level == "high" and has_history:
        if hist["default_count"] > 0:
            s1 = "该客户存在逾期还款记录，风险水平较高。"
        else:
            s1 = "该客户被评估为高风险，主要源于基本面较弱或交易结构问题。"
    elif risk_level == "high":
        if coop <= 6:
            s1 = "该客户合作时间极短、记录有限，当前评估为高风险。"
        else:
            s1 = "该客户整体被评估为高风险。"
    else:
        s1 = f"该客户综合风险评分为{total}/100，评估为{level_zh}。"

    # S2: 关键支撑信号
    if has_history:
        approved = hist["approved_count"]
        rejected = hist["rejected_count"]
        default_count = hist["default_count"]
        if default_count == 0 and rejected == 0:
            if hist["past_avg_dp"] and hist["past_avg_dp"] >= 0.25:
                s2 = f"此前{approved}笔申请均获批准且无逾期记录，平均首付比例约{hist['past_avg_dp']:.0%}，还款纪律良好。"
            else:
                s2 = f"此前{approved}笔申请均获批准且无逾期记录，还款纪律可接受。"
        elif default_count > 0:
            total_def = hist["total_default_amount"]
            total_rec = hist["total_recovery"]
            max_overdue = max(d["days_overdue"] for d in hist["defaults"])
            if total_rec > 0:
                rec_rate = total_rec / total_def * 100 if total_def > 0 else 0
                s2 = f"历史有{default_count}笔逾期（最长{max_overdue}天），回收率约{rec_rate:.0f}%，还款能力存在明显不足。"
            else:
                s2 = f"历史有{default_count}笔逾期（最长{max_overdue}天），还款能力存在明显不足。"
        elif rejected > 0:
            s2 = f"此前{approved + rejected}笔申请中有{rejected}笔被拒——需确认此前拒绝原因是否已消除。"
        else:
            s2 = f"此前有{approved}笔已批准申请；还款表现仍需进一步验证。"
    else:
        if coop <= 6:
            s2 = "该客户为新客户，无历史融资记录；风险评估依赖于本次交易行为。"
        else:
            s2 = "该客户无历史融资记录，还款行为尚未验证。"

    # S3: 当前申请与历史对比
    if has_history and is_aggressive:
        changes = []
        if "term_longer" in aggressive_signals:
            t3 = hist["past_term_counts"].get(3, 0)
            t6 = hist["past_term_counts"].get(6, 0)
            if t3 > 0 and t6 == 0:
                changes.append(f"贷款期限从通常的3个月延长至{cur_term}个月")
            else:
                changes.append(f"贷款期限延长至{cur_term}个月（此前多为{hist['preferred_term']}个月）")
        if "higher_leverage" in aggressive_signals:
            changes.append(f"融资比例升至{cur_fin_ratio:.0%}（历史均值：{hist['past_avg_fin']:.0%}）")
        if "lower_dp" in aggressive_signals:
            changes.append(f"首付比例降至{cur_dp_ratio:.0%}（历史均值：{hist['past_avg_dp']:.0%}）")
        if "larger_amount" in aggressive_signals:
            changes.append("贷款金额显著高于历史均值")
        change_text = "，".join(changes)
        if is_clearly_outside:
            s3 = f"与历史行为相比，本次申请明显更激进：{change_text}——偏离幅度较大。"
        else:
            s3 = f"与此前融资模式相比，{change_text}，风险有所上升。"
    elif has_history:
        s3 = "本次申请的期限、首付和融资比例与历史行为基本一致，未见明显偏离。"
    else:
        s3 = ""

    # S4: 物流/提货
    s4 = ""
    pickups = pickup_records or []
    if has_history and hist["pickup_patterns"]:
        slow = hist["slow_pickups"]
        total_tracked = len(hist["pickup_patterns"])
        if slow > total_tracked / 2:
            s4 = "历史提货节奏偏慢，货物周转率低，抵押品处置能力令人担忧。"
        elif slow == 0 and scores.get("score_logistics", 0) >= 18:
            if hist["mostly_high_liq"]:
                s4 = "历史提货及时，货物流动性高，抵押品保障充分。"
            elif not hist["mostly_low_liq"]:
                s4 = "历史提货节奏正常，货物周转合理，抵押品流动性可接受。"
        elif hist["mostly_low_liq"]:
            s4 = "历史货物以低流动性品类为主，违约情况下抵押品处置将较为困难。"

    if trade_logi and pickups and scores.get("score_logistics", 25) < 10:
        s4 = "本次申请的提货行为异常缓慢，抵押品周转存在严重隐患。"

    # S5: 主要关注点
    s5 = ""
    watchpoints = []
    utilization = 0
    if customer.total_credit_limit and customer.total_credit_limit > 0:
        utilization = (customer.current_outstanding_amount or 0) / customer.total_credit_limit
    if utilization > risk_policy.customer_utilization_warning_threshold:
        watchpoints.append(("util", f"信用使用率已达{utilization:.0%}，接近授信上限——集中度风险上升。"))
    if (application.days_past_due or 0) > 0:
        watchpoints.append(("overdue", f"本笔申请当前逾期{application.days_past_due}天；买方还款能力是核心风险因素。"))
    if "term_longer" in aggressive_signals and risk_level != "high":
        watchpoints.append(("term", "主要关注点为较长贷款期限下的买方还款能力。"))
    if cur_fin_ratio >= 0.85:
        watchpoints.append(("leverage", f"融资比例达{cur_fin_ratio:.0%}，自有资金参与不足是主要风险驱动因素。"))
    if customer.credit_grade == "D":
        watchpoints.append(("grade", "内部信用等级为D，基本面偏弱是主要约束。"))
    if not has_history and coop <= 6:
        watchpoints.append(("new", "合作时间极短且缺乏行为数据是主要不确定性来源。"))
    if watchpoints:
        priority = ["overdue", "util", "leverage", "grade", "term", "new"]
        for key in priority:
            match = [w for w in watchpoints if w[0] == key]
            if match:
                s5 = match[0][1]
                break

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
            text = f["en"] if isinstance(f, dict) else f
            explanation_parts.append(f"  - {text}")

    ai_explanation = "\n".join(explanation_parts)

    # ── Chinese translations ──
    zh_risk_summary = _build_chinese_summary(
        customer, application, trade_logi, pickup_records,
        scores, anomaly_flags, hist
    )

    if risk_level == "low":
        zh_rec_text = (
            f"建议按标准流程审批。贷款金额在 {rec_band} 范围内，首付比例 {rec_dp} 合理。"
            f"鉴于当前表现良好，6个月期限可接受。"
        )
    elif risk_level == "medium":
        zh_rec_text = (
            f"客户处于观察名单。建议谨慎审批，采用保守结构。"
            f"建议首付不低于25%，优先选择3个月期限。"
            f"推荐贷款区间：{rec_band}。需人工审核。"
        )
    else:
        zh_rec_text = (
            f"客户为高风险（评分：{total}/100）。"
            f"不建议在标准方案下审批新融资。"
            f"任何例外需高级管理层批准并加强风险缓释措施。"
        )

    level_zh_map = {"low": "低风险", "medium": "中风险", "high": "高风险"}
    zh_level_label = level_zh_map.get(risk_level, risk_level)
    zh_explanation_parts = [
        f"评分明细：",
        f"  - 经营稳定性：{scores['score_stability']}/25",
        f"  - 还款记录：{scores['score_repayment']}/25",
        f"  - 融资结构：{scores['score_structure']}/25",
        f"  - 物流提货：{scores['score_logistics']}/25",
        f"  - 总分：{total}/100（{zh_level_label}）",
    ]
    if anomaly_flags:
        zh_explanation_parts.append(f"\n检测到异常（{len(anomaly_flags)}项）：")
        for f in anomaly_flags:
            text = f["zh"] if isinstance(f, dict) else f
            zh_explanation_parts.append(f"  - {text}")
    zh_explanation = "\n".join(zh_explanation_parts)

    return {
        "ai_risk_summary": ai_risk_summary,
        "ai_recommendation": rec_text,
        "ai_explanation": ai_explanation,
        "ai_risk_summary_zh": zh_risk_summary,
        "ai_recommendation_zh": zh_rec_text,
        "ai_explanation_zh": zh_explanation,
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

Anomaly flags: {json.dumps([f['en'] if isinstance(f, dict) else f for f in anomaly_flags]) if anomaly_flags else 'None'}
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
