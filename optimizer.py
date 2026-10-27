"""
AI Cash Flow Optimizer - Core Simulation & Recommendation Engine (Indian Rupee ₹ Edition)
"""

from datetime import datetime, timedelta
from typing import List, Dict, Any, Tuple, Optional
from models import (
    CashInflow,
    CashOutflow,
    OptimizationScenario,
    CashFlowForecastDay,
    AIOptimizationRecommendation,
    CashFlowReport
)

def get_default_inflows(base_date: datetime) -> List[CashInflow]:
    return [
        CashInflow(
            id="INF-01",
            source="Enterprise SaaS Annual Contract (Acme India)",
            amount=285000.0,
            due_date=(base_date + timedelta(days=12)).strftime("%Y-%m-%d"),
            expected_delay_days=5,
            reliability_score=0.88,
            is_recurring=False
        ),
        CashInflow(
            id="INF-02",
            source="Monthly Retainer Invoices (Tech Advisory)",
            amount=142000.0,
            due_date=(base_date + timedelta(days=5)).strftime("%Y-%m-%d"),
            expected_delay_days=2,
            reliability_score=0.95,
            is_recurring=True,
            recurring_interval="monthly"
        ),
        CashInflow(
            id="INF-03",
            source="Product Licensing Milestone (FinTech Solutions)",
            amount=180000.0,
            due_date=(base_date + timedelta(days=22)).strftime("%Y-%m-%d"),
            expected_delay_days=8,
            reliability_score=0.75,
            is_recurring=False
        ),
        CashInflow(
            id="INF-04",
            source="Direct Razorpay / UPI Online Marketplace Sales",
            amount=98000.0,
            due_date=(base_date + timedelta(days=15)).strftime("%Y-%m-%d"),
            expected_delay_days=0,
            reliability_score=0.99,
            is_recurring=True,
            recurring_interval="monthly"
        )
    ]

def get_default_outflows(base_date: datetime) -> List[CashOutflow]:
    return [
        CashOutflow(
            id="OUT-01",
            recipient="Core Team & Engineering Payroll",
            amount=360000.0,
            due_date=(base_date + timedelta(days=10)).strftime("%Y-%m-%d"),
            category="Payroll",
            is_essential=True,
            can_defer_days=0,
            is_recurring=True
        ),
        CashOutflow(
            id="OUT-02",
            recipient="Cloud Infrastructure & Hosting (AWS India)",
            amount=42000.0,
            due_date=(base_date + timedelta(days=7)).strftime("%Y-%m-%d"),
            category="SaaS",
            is_essential=True,
            can_defer_days=7,
            is_recurring=True
        ),
        CashOutflow(
            id="OUT-03",
            recipient="Office Lease & Physical Utilities",
            amount=85000.0,
            due_date=(base_date + timedelta(days=14)).strftime("%Y-%m-%d"),
            category="Rent",
            is_essential=True,
            can_defer_days=3,
            is_recurring=True
        ),
        CashOutflow(
            id="OUT-04",
            recipient="Hardware Supply & Component Vendor",
            amount=155000.0,
            due_date=(base_date + timedelta(days=9)).strftime("%Y-%m-%d"),
            category="Supplier",
            is_essential=False,
            can_defer_days=14,
            is_recurring=False
        ),
        CashOutflow(
            id="OUT-05",
            recipient="Quarterly Advance Corporate Tax / GST",
            amount=62000.0,
            due_date=(base_date + timedelta(days=20)).strftime("%Y-%m-%d"),
            category="Taxes",
            is_essential=True,
            can_defer_days=0,
            is_recurring=False
        ),
        CashOutflow(
            id="OUT-06",
            recipient="Performance Marketing & Digital Ads",
            amount=54000.0,
            due_date=(base_date + timedelta(days=8)).strftime("%Y-%m-%d"),
            category="Marketing",
            is_essential=False,
            can_defer_days=10,
            is_recurring=True
        )
    ]

class CashFlowOptimizerEngine:
    def __init__(self, current_cash: float = 380000.0, safety_buffer: float = 150000.0):
        self.current_cash = current_cash
        self.safety_buffer = safety_buffer

    def forecast_timeline(
        self,
        inflows: List[CashInflow],
        outflows: List[CashOutflow],
        start_date: datetime,
        days: int = 30,
        scenario: Optional[OptimizationScenario] = None
    ) -> List[CashFlowForecastDay]:
        scenario = scenario or OptimizationScenario()
        timeline: List[CashFlowForecastDay] = []
        running_balance = self.current_cash

        # Map dates to inflows and outflows
        inflow_by_date: Dict[str, float] = {}
        for inf in inflows:
            due = datetime.strptime(inf.due_date, "%Y-%m-%d")
            delay = inf.expected_delay_days + scenario.custom_inflow_delay_days
            if scenario.apply_early_discount and inf.amount >= 150000:
                actual_date = due - timedelta(days=5)
                amt = inf.amount * 0.98
            else:
                actual_date = due + timedelta(days=delay)
                amt = inf.amount

            d_str = actual_date.strftime("%Y-%m-%d")
            inflow_by_date[d_str] = inflow_by_date.get(d_str, 0.0) + amt

        outflow_by_date: Dict[str, float] = {}
        for out in outflows:
            due = datetime.strptime(out.due_date, "%Y-%m-%d")
            amt = out.amount

            if scenario.trim_discretionary and not out.is_essential:
                amt = amt * 0.85  # 15% reduction

            if scenario.defer_vendor_payments and out.can_defer_days > 0:
                actual_date = due + timedelta(days=out.can_defer_days)
            else:
                actual_date = due

            d_str = actual_date.strftime("%Y-%m-%d")
            outflow_by_date[d_str] = outflow_by_date.get(d_str, 0.0) + amt

        for i in range(days + 1):
            cur_d = start_date + timedelta(days=i)
            d_str = cur_d.strftime("%Y-%m-%d")
            start_bal = running_balance

            day_in = inflow_by_date.get(d_str, 0.0)
            day_out = outflow_by_date.get(d_str, 0.0)
            end_bal = start_bal + day_in - day_out
            running_balance = end_bal

            timeline.append(CashFlowForecastDay(
                date=d_str,
                starting_balance=round(start_bal, 2),
                inflows=round(day_in, 2),
                outflows=round(day_out, 2),
                ending_balance=round(end_bal, 2),
                is_danger_zone=(end_bal < self.safety_buffer)
            ))

        return timeline

    def analyze_and_optimize(
        self,
        inflows: List[CashInflow],
        outflows: List[CashOutflow],
        start_date: Optional[datetime] = None
    ) -> CashFlowReport:
        start_date = start_date or datetime.now()
        
        # 1. Baseline timeline
        baseline_timeline = self.forecast_timeline(
            inflows, outflows, start_date, days=30, scenario=OptimizationScenario()
        )

        lowest_balance = min(day.ending_balance for day in baseline_timeline)
        lowest_day = next(day for day in baseline_timeline if day.ending_balance == lowest_balance)

        days_to_shortfall = None
        for idx, day in enumerate(baseline_timeline):
            if day.ending_balance < self.safety_buffer:
                days_to_shortfall = idx
                break

        total_inflow = sum(i.amount for i in inflows)
        total_outflow = sum(o.amount for o in outflows)
        net_flow = total_inflow - total_outflow

        essential_outflows = sum(o.amount for o in outflows if o.is_essential)
        burn_rate = max(1000.0, total_outflow - total_inflow if total_outflow > total_inflow else essential_outflows * 0.4)
        runway_months = round(max(0.1, self.current_cash / burn_rate), 1)

        # 2. AI Recommendation Generation (₹ INR)
        recommendations: List[AIOptimizationRecommendation] = []

        if lowest_balance < self.safety_buffer:
            flexible_outflows = [o for o in outflows if o.can_defer_days >= 7]
            if flexible_outflows:
                total_deferrable = sum(o.amount for o in flexible_outflows)
                recommendations.append(AIOptimizationRecommendation(
                    id="REC-01",
                    category="OUTFLOW_DEFERRAL",
                    title="Reschedule Flexible Vendor Payments (+14 Days)",
                    description=(
                        f"Hardware and marketing invoices totaling ₹{total_deferrable:,.0f} "
                        f"fall right before payroll. Exercising graceful 14-day terms pushes bills past the low-liquidity dip."
                    ),
                    action="Shift flexible supplier bills by 14 days",
                    cash_impact=total_deferrable,
                    runway_impact_days=18,
                    confidence_score=0.96
                ))

            large_invoices = [i for i in inflows if i.amount >= 150000]
            if large_invoices:
                target = large_invoices[0]
                accelerated_cash = target.amount * 0.98
                recommendations.append(AIOptimizationRecommendation(
                    id="REC-02",
                    category="INFLOW_ACCELERATION",
                    title=f"Offer 2% Early-Settlement Incentive to {target.source[:20]}...",
                    description=(
                        f"Invoice of ₹{target.amount:,.0f} has an expected delay of {target.expected_delay_days} days. "
                        f"Offering a 2/10 Net 30 discount unlocks ₹{accelerated_cash:,.0f} up to 7 days earlier, avoiding the overdraft zone."
                    ),
                    action="Send automated dynamic early-payment link",
                    cash_impact=accelerated_cash,
                    runway_impact_days=24,
                    confidence_score=0.92
                ))

            discretionary_outflows = [o for o in outflows if not o.is_essential]
            if discretionary_outflows:
                discretionary_total = sum(o.amount for o in discretionary_outflows)
                savings = discretionary_total * 0.15
                recommendations.append(AIOptimizationRecommendation(
                    id="REC-03",
                    category="COST_TRIMMING",
                    title="Pause / Trim Discretionary SaaS & Ad Spend (-15%)",
                    description=(
                        f"Temporarily optimizing non-essential subscriptions and ad budgets saves ₹{savings:,.0f}/mo "
                        f"without impacting core operations or payroll."
                    ),
                    action="Enact 15% discretionary freeze",
                    cash_impact=savings,
                    runway_impact_days=12,
                    confidence_score=0.89
                ))
        else:
            recommendations.append(AIOptimizationRecommendation(
                id="REC-GROWTH",
                category="BUFFER_MANAGEMENT",
                title="Deploy Idle Cash into High-Yield Liquid Reserve",
                description="Your cash buffer is strong. Consider allocating surplus cash into an automated liquid debt fund earning 7.2% p.a.",
                action="Enable automated yield sweep",
                cash_impact=self.current_cash * 0.072 / 12,
                runway_impact_days=30,
                confidence_score=0.98
            ))

        # 3. Optimized Timeline
        optimized_scenario = OptimizationScenario(
            apply_early_discount=True,
            defer_vendor_payments=True,
            trim_discretionary=True
        )
        optimized_timeline = self.forecast_timeline(
            inflows, outflows, start_date, days=30, scenario=optimized_scenario
        )

        buffer_ratio = max(0.0, min(1.0, lowest_balance / self.safety_buffer if self.safety_buffer > 0 else 1.0))
        runway_factor = min(1.0, runway_months / 6.0)
        flow_ratio = min(1.0, total_inflow / total_outflow if total_outflow > 0 else 1.0)

        health_score = int((buffer_ratio * 35) + (runway_factor * 35) + (flow_ratio * 30))
        health_score = max(5, min(100, health_score))

        if health_score >= 88:
            health_grade = "A+"
        elif health_score >= 78:
            health_grade = "A"
        elif health_score >= 65:
            health_grade = "B"
        elif health_score >= 50:
            health_grade = "C"
        elif health_score >= 35:
            health_grade = "D"
        else:
            health_grade = "F"

        return CashFlowReport(
            current_cash=round(self.current_cash, 2),
            minimum_safety_buffer=round(self.safety_buffer, 2),
            projected_lowest_balance=round(lowest_balance, 2),
            lowest_balance_date=lowest_day.date,
            days_to_shortfall=days_to_shortfall,
            total_30d_inflow=round(total_inflow, 2),
            total_30d_outflow=round(total_outflow, 2),
            net_30d_cash_flow=round(net_flow, 2),
            burn_rate_monthly=round(burn_rate, 2),
            runway_months=runway_months,
            health_score=health_score,
            health_grade=health_grade,
            timeline_baseline=baseline_timeline,
            timeline_optimized=optimized_timeline,
            recommendations=recommendations
        )
