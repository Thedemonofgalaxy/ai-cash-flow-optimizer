"""
Agentic AI Framework - Tools & Action Registry
Defines the @tool decorator and financial tools for working capital optimization.
All currency operations are standardized in Indian Rupees (₹ INR).
"""

import inspect
import json
from typing import Callable, Any, Dict, List, Optional
from datetime import datetime, timedelta

class Tool:
    def __init__(self, name: str, description: str, func: Callable):
        self.name = name
        self.description = description.strip()
        self.func = func
        self.signature = inspect.signature(func)
        self.parameters = self._extract_parameters()

    def _extract_parameters(self) -> Dict[str, Any]:
        params = {}
        for param_name, param in self.signature.parameters.items():
            param_type = "string"
            if param.annotation == int:
                param_type = "integer"
            elif param.annotation == float:
                param_type = "number"
            elif param.annotation == bool:
                param_type = "boolean"
            elif param.annotation in (list, List):
                param_type = "array"
            elif param.annotation in (dict, Dict):
                param_type = "object"

            default_val = None if param.default == inspect.Parameter.empty else param.default
            params[param_name] = {
                "type": param_type,
                "required": param.default == inspect.Parameter.empty,
                "default": default_val
            }
        return params

    def execute(self, **kwargs) -> Any:
        try:
            return self.func(**kwargs)
        except Exception as e:
            return {"error": f"Tool '{self.name}' execution failed: {str(e)}"}

    def __call__(self, *args, **kwargs) -> Any:
        return self.func(*args, **kwargs)

    def to_schema(self) -> Dict[str, Any]:
        return {
            "name": self.name,
            "description": self.description,
            "parameters": self.parameters
        }


class ToolRegistry:
    def __init__(self):
        self._tools: Dict[str, Tool] = {}

    def register(self, tool_instance: Tool):
        self._tools[tool_instance.name] = tool_instance

    def get(self, name: str) -> Optional[Tool]:
        return self._tools.get(name)

    def list_tools(self) -> List[Tool]:
        return list(self._tools.values())

    def to_schemas(self) -> List[Dict[str, Any]]:
        return [t.to_schema() for t in self._tools.values()]


# Global tool registry
GLOBAL_TOOL_REGISTRY = ToolRegistry()


def tool(name: Optional[str] = None, description: Optional[str] = None):
    """
    Decorator to register a function as an Agent Tool.
    """
    def decorator(func: Callable):
        tool_name = name or func.__name__
        tool_desc = description or func.__doc__ or "No description provided."
        tool_obj = Tool(name=tool_name, description=tool_desc, func=func)
        GLOBAL_TOOL_REGISTRY.register(tool_obj)
        return tool_obj
    return decorator


# =====================================================================
# Financial Agent Tools (₹ INR)
# =====================================================================

@tool(
    name="analyze_liquidity_risk",
    description="Analyzes bank balance, projected 30-day inflows/outflows, safety buffer breaches, lowest balance, and runway."
)
def analyze_liquidity_risk(
    current_cash: float,
    safety_buffer: float,
    inflows: List[Dict[str, Any]],
    outflows: List[Dict[str, Any]],
    days: int = 30
) -> Dict[str, Any]:
    """
    Simulates daily running balance over 30 days and pinpoints any cash dips below safety buffer.
    """
    running_balance = float(current_cash)
    safety_buffer = float(safety_buffer)
    today = datetime.now()

    # Map inflows by date
    inflow_map: Dict[str, float] = {}
    total_inflow = 0.0
    for inf in inflows:
        amt = float(inf.get("amount", 0.0))
        total_inflow += amt
        d_str = inf.get("due_date", today.strftime("%Y-%m-%d"))
        # Account for historical delay
        delay = int(inf.get("expected_delay_days", 0))
        try:
            d_dt = datetime.strptime(d_str, "%Y-%m-%d") + timedelta(days=delay)
            actual_key = d_dt.strftime("%Y-%m-%d")
        except Exception:
            actual_key = d_str
        inflow_map[actual_key] = inflow_map.get(actual_key, 0.0) + amt

    # Map outflows by date
    outflow_map: Dict[str, float] = {}
    total_outflow = 0.0
    essential_outflow = 0.0
    for out in outflows:
        amt = float(out.get("amount", 0.0))
        total_outflow += amt
        if out.get("is_essential", True):
            essential_outflow += amt
        d_str = out.get("due_date", today.strftime("%Y-%m-%d"))
        outflow_map[d_str] = outflow_map.get(d_str, 0.0) + amt

    lowest_balance = running_balance
    lowest_date = today.strftime("%Y-%m-%d")
    breach_day_index = None
    breach_date = None
    breach_amount = 0.0

    timeline = []
    for i in range(days + 1):
        cur_d = today + timedelta(days=i)
        d_str = cur_d.strftime("%Y-%m-%d")

        day_in = inflow_map.get(d_str, 0.0)
        day_out = outflow_map.get(d_str, 0.0)
        running_balance = running_balance + day_in - day_out

        if running_balance < lowest_balance:
            lowest_balance = running_balance
            lowest_date = d_str

        if running_balance < safety_buffer and breach_day_index is None:
            breach_day_index = i
            breach_date = d_str
            breach_amount = safety_buffer - running_balance

        timeline.append({
            "day": i,
            "date": d_str,
            "balance": round(running_balance, 2),
            "is_breached": running_balance < safety_buffer
        })

    net_burn_monthly = max(1000.0, total_outflow - total_inflow if total_outflow > total_inflow else essential_outflow * 0.4)
    runway_months = round(max(0.1, current_cash / net_burn_monthly), 1)

    is_critical = lowest_balance < safety_buffer
    deficit = max(0.0, safety_buffer - lowest_balance)

    return {
        "status": "CRITICAL_DEFICIT" if lowest_balance < 0 else ("BUFFER_BREACH" if is_critical else "HEALTHY"),
        "current_cash_inr": round(current_cash, 2),
        "safety_buffer_inr": round(safety_buffer, 2),
        "lowest_projected_balance_inr": round(lowest_balance, 2),
        "lowest_balance_date": lowest_date,
        "is_buffer_breached": is_critical,
        "days_to_breach": breach_day_index,
        "breach_date": breach_date,
        "deficit_to_safety_buffer_inr": round(deficit, 2),
        "total_30d_inflow_inr": round(total_inflow, 2),
        "total_30d_outflow_inr": round(total_outflow, 2),
        "net_flow_30d_inr": round(total_inflow - total_outflow, 2),
        "monthly_burn_rate_inr": round(net_burn_monthly, 2),
        "runway_months": runway_months
    }


@tool(
    name="evaluate_early_settlement",
    description="Evaluates pending invoices to identify candidates for early settlement discounts (e.g. 2/10 Net 30) to unlock early liquidity."
)
def evaluate_early_settlement(
    inflows: List[Dict[str, Any]],
    min_amount: float = 100000.0,
    discount_pct: float = 2.0
) -> Dict[str, Any]:
    """
    Identifies high-value delayed receivables and calculates cash acceleration.
    """
    qualifying_invoices = []
    total_accelerated_cash = 0.0
    total_discount_cost = 0.0

    for inf in inflows:
        amt = float(inf.get("amount", 0.0))
        if amt >= min_amount:
            discount_amount = amt * (discount_pct / 100.0)
            accelerated_amount = amt - discount_amount
            expected_delay = int(inf.get("expected_delay_days", 0))

            qualifying_invoices.append({
                "id": inf.get("id"),
                "source": inf.get("source"),
                "invoice_amount_inr": amt,
                "proposed_discount_pct": discount_pct,
                "discount_cost_inr": round(discount_amount, 2),
                "net_accelerated_cash_inr": round(accelerated_amount, 2),
                "expected_delay_days": expected_delay,
                "due_date": inf.get("due_date"),
                "recommended_acceleration_days": 7 + expected_delay
            })

            total_accelerated_cash += accelerated_amount
            total_discount_cost += discount_amount

    return {
        "candidate_count": len(qualifying_invoices),
        "candidates": qualifying_invoices,
        "total_accelerated_liquidity_inr": round(total_accelerated_cash, 2),
        "total_discount_cost_inr": round(total_discount_cost, 2),
        "recommendation": (
            f"Offer {discount_pct}% dynamic discount on {len(qualifying_invoices)} large invoice(s) "
            f"to pull forward ₹{total_accelerated_cash:,.0f} in immediate liquidity."
            if qualifying_invoices else "No large invoices qualify for early settlement."
        )
    }


@tool(
    name="reschedule_vendor_bills",
    description="Analyzes scheduled outflows for deferrable or non-essential vendor bills that can be gracefully shifted past a liquidity crunch."
)
def reschedule_vendor_bills(
    outflows: List[Dict[str, Any]],
    target_deferral_days: int = 14
) -> Dict[str, Any]:
    """
    Finds non-payroll, deferrable payables that can be safely rescheduled.
    """
    deferrable_bills = []
    total_deferred_amount = 0.0

    for out in outflows:
        is_payroll = out.get("category", "").lower() == "payroll" or "salary" in out.get("recipient", "").lower()
        is_tax = out.get("category", "").lower() == "taxes" or "gst" in out.get("recipient", "").lower()
        can_defer = int(out.get("can_defer_days", 0))

        # Do not defer payroll or statutory taxes
        if is_payroll or is_tax:
            continue

        amt = float(out.get("amount", 0.0))
        effective_defer_days = can_defer if can_defer > 0 else (target_deferral_days if not out.get("is_essential", True) else 0)

        if effective_defer_days > 0:
            deferrable_bills.append({
                "id": out.get("id"),
                "recipient": out.get("recipient"),
                "category": out.get("category"),
                "amount_inr": amt,
                "original_due_date": out.get("due_date"),
                "defer_by_days": effective_defer_days,
                "goodwill_risk": "LOW" if effective_defer_days <= 14 else "MODERATE"
            })
            total_deferred_amount += amt

    return {
        "deferrable_count": len(deferrable_bills),
        "deferrable_bills": deferrable_bills,
        "total_relief_inr": round(total_deferred_amount, 2),
        "recommendation": (
            f"Reschedule {len(deferrable_bills)} vendor bill(s) totaling ₹{total_deferred_amount:,.0f} "
            f"by 7-14 days to preserve liquidity during the cash trough."
            if deferrable_bills else "All scheduled outflows are strictly non-deferrable (payroll or mandatory taxes)."
        )
    }


@tool(
    name="audit_discretionary_spend",
    description="Audits non-essential expenses (SaaS, discretionary marketing, optional perks) and computes instant cost-trimming savings."
)
def audit_discretionary_spend(
    outflows: List[Dict[str, Any]],
    trim_percentage: float = 15.0
) -> Dict[str, Any]:
    """
    Scans for non-essential outflows and calculates savings from a temporary discretionary freeze.
    """
    discretionary_items = []
    total_discretionary = 0.0

    for out in outflows:
        if not out.get("is_essential", True):
            amt = float(out.get("amount", 0.0))
            savings = amt * (trim_percentage / 100.0)
            discretionary_items.append({
                "id": out.get("id"),
                "recipient": out.get("recipient"),
                "category": out.get("category"),
                "amount_inr": amt,
                "projected_savings_inr": round(savings, 2),
                "trimmed_amount_inr": round(amt - savings, 2)
            })
            total_discretionary += amt

    total_savings = total_discretionary * (trim_percentage / 100.0)

    return {
        "discretionary_item_count": len(discretionary_items),
        "items": discretionary_items,
        "total_discretionary_inr": round(total_discretionary, 2),
        "projected_savings_inr": round(total_savings, 2),
        "trim_percentage": trim_percentage,
        "recommendation": (
            f"Enact a temporary {trim_percentage}% trim across {len(discretionary_items)} discretionary items, "
            f"saving ₹{total_savings:,.0f}/month."
            if discretionary_items else "No discretionary outflows detected; spending is already lean."
        )
    }


@tool(
    name="draft_communication_action",
    description="Drafts professional, diplomatic business correspondence in Indian business context for client early-pay incentives or vendor deferral requests."
)
def draft_communication_action(
    scenario_type: str,
    recipient_name: str,
    amount_inr: float,
    due_date: str,
    proposal_details: str
) -> Dict[str, Any]:
    """
    Generates actionable, ready-to-send email copy for finance executives.
    """
    scenario_type = scenario_type.upper()
    formatted_amount = f"₹{amount_inr:,.0f}"

    if "DISCOUNT" in scenario_type or "INFLOW" in scenario_type or "EARLY" in scenario_type:
        subject = f"Special Early Settlement Incentive: Invoice {recipient_name} ({formatted_amount})"
        body = (
            f"Dear {recipient_name} Accounts Payable Team,\n\n"
            f"We hope this email finds you well.\n\n"
            f"As part of our mid-quarter working capital and treasury optimization initiative, "
            f"we are pleased to offer an immediate 2% early settlement discount on our pending invoice of {formatted_amount}.\n\n"
            f"• Original Due Date: {due_date}\n"
            f"• Net Payable Amount: ₹{(amount_inr * 0.98):,.0f} (Saving ₹{(amount_inr * 0.02):,.0f})\n"
            f"• Valid If Processed By: {(datetime.now() + timedelta(days=5)).strftime('%d %b %Y')}\n\n"
            f"To take advantage of this incentive, please let us know or remit directly to our registered UPI/NEFT account.\n\n"
            f"Warm regards,\nFinance & Treasury Team"
        )
    elif "DEFER" in scenario_type or "VENDOR" in scenario_type:
        subject = f"Scheduled Billing Alignment & Payment Schedule Update - {recipient_name}"
        body = (
            f"Dear {recipient_name} Finance & Billing Team,\n\n"
            f"We greatly value our ongoing business relationship with your organization.\n\n"
            f"We are conducting a standard monthly reconciliation across our vendor disbursements. "
            f"In accordance with our contractual 14-day payment flexibility terms, our invoice of {formatted_amount} "
            f"(originally scheduled for {due_date}) has been scheduled for disbursement on "
            f"{(datetime.now() + timedelta(days=14)).strftime('%d %b %Y')}.\n\n"
            f"All banking and billing parameters remain unchanged, and this ensures prompt, seamless clearance without discrepancy.\n\n"
            f"Thank you for your partnership and cooperation.\n\n"
            f"Warm regards,\nAccounts Payable & Operations"
        )
    else:
        subject = f"Executive Working Capital Memo: Budget Alignment"
        body = (
            f"Executive Memo:\n\n"
            f"Effective immediately, discretionary operational expenses totaling {formatted_amount} "
            f"are subject to a temporary 15% efficiency freeze to safeguard cash reserves.\n\n"
            f"Details: {proposal_details}\n\n"
            f"Regards,\nOffice of the CFO"
        )

    return {
        "scenario_type": scenario_type,
        "recipient": recipient_name,
        "amount_inr": amount_inr,
        "subject": subject,
        "body": body
    }


@tool(
    name="synthesize_liquidity_plan",
    description="Synthesizes findings from the Auditor, Receivables Strategist, and Payables Optimizer into an authoritative Master CFO Action Plan."
)
def synthesize_liquidity_plan(
    auditor_findings: Dict[str, Any],
    receivables_strategy: Dict[str, Any],
    payables_strategy: Dict[str, Any],
    discretionary_audit: Dict[str, Any]
) -> Dict[str, Any]:
    """
    Calculates combined net cash relief, new runway, and prioritizes action sequence.
    """
    total_accelerated = receivables_strategy.get("total_accelerated_liquidity_inr", 0.0)
    total_deferred = payables_strategy.get("total_relief_inr", 0.0)
    total_trimmed = discretionary_audit.get("projected_savings_inr", 0.0)

    total_combined_relief = total_accelerated + total_deferred + total_trimmed
    lowest_orig = auditor_findings.get("lowest_projected_balance_inr", 0.0)
    safety_buffer = auditor_findings.get("safety_buffer_inr", 150000.0)

    # Calculate improved lowest balance
    improved_lowest = lowest_orig + total_deferred + (total_accelerated * 0.9)
    is_restored = improved_lowest >= safety_buffer

    actions = []
    priority = 1

    if total_deferred > 0:
        actions.append({
            "priority": priority,
            "title": "Exercise Graceful 14-Day Vendor Deferral",
            "impact_inr": total_deferred,
            "category": "OUTFLOW_DEFERRAL",
            "summary": f"Reschedule flexible supplier & marketing bills to protect cash balance during dip."
        })
        priority += 1

    if total_accelerated > 0:
        actions.append({
            "priority": priority,
            "title": "Dispatch 2% Early-Settlement Incentive to Enterprise Debtors",
            "impact_inr": total_accelerated,
            "category": "INFLOW_ACCELERATION",
            "summary": f"Pull forward high-value receivables before payroll date."
        })
        priority += 1

    if total_trimmed > 0:
        actions.append({
            "priority": priority,
            "title": "Freeze 15% Discretionary Spend",
            "impact_inr": total_trimmed,
            "category": "COST_TRIMMING",
            "summary": f"Trim non-essential ad spend and SaaS subscriptions."
        })
        priority += 1

    return {
        "status": "OPTIMIZATION_COMPLETE",
        "total_cash_relief_inr": round(total_combined_relief, 2),
        "original_lowest_balance_inr": round(lowest_orig, 2),
        "optimized_lowest_balance_inr": round(improved_lowest, 2),
        "safety_buffer_inr": round(safety_buffer, 2),
        "is_liquidity_restored": is_restored,
        "actions": actions,
        "executive_verdict": (
            f"Executing this multi-agent action plan unlocks ₹{total_combined_relief:,.0f} in combined liquidity relief, "
            f"raising your projected cash floor from ₹{lowest_orig:,.0f} to ₹{improved_lowest:,.0f} "
            f"({'safely exceeding' if is_restored else 'substantially reducing deficit against'} the ₹{safety_buffer:,.0f} safety buffer)."
        )
    }
