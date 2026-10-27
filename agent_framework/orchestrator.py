"""
Agentic AI Framework - Multi-Agent Collaborative Orchestrator
Coordinates the specialized agents:
1. Auditor Agent (Financial Sentinel)
2. Receivables Strategist Agent (Inflow Accelerator)
3. Payables Optimizer Agent (Vendor Relations & Runway Guard)
4. CFO Synthesizer Agent (Executive Co-Pilot & Master Planner)
All amounts and recommendations are standardized in Indian Rupees (₹ INR).
"""

from typing import Dict, Any, List, Optional
from pydantic import BaseModel
from datetime import datetime

from .tools import (
    GLOBAL_TOOL_REGISTRY,
    analyze_liquidity_risk,
    evaluate_early_settlement,
    reschedule_vendor_bills,
    audit_discretionary_spend,
    draft_communication_action,
    synthesize_liquidity_plan
)
from .agent import Agent, AgentResult, AgentTraceStep
from .llm import LLMClient

class MultiAgentOptimizationReport(BaseModel):
    timestamp: str
    status: str
    executive_summary: str
    total_cash_relief_inr: float
    original_lowest_balance_inr: float
    optimized_lowest_balance_inr: float
    safety_buffer_inr: float
    is_buffer_restored: bool
    agent_results: List[AgentResult]
    master_actions: List[Dict[str, Any]]
    communication_artifacts: List[Dict[str, Any]]

class AuditorAgent(Agent):
    def __init__(self, llm: Optional[LLMClient] = None):
        super().__init__(
            name="AuditorAgent",
            role="Financial Sentinel & Liquidity Auditor",
            system_prompt="Analyze bank balances, detect liquidity crunches, monitor the minimum safety buffer, and pinpoint the exact day of lowest balance.",
            tools=[analyze_liquidity_risk],
            llm=llm
        )

    def run(self, task: str, context: Optional[Dict[str, Any]] = None) -> AgentResult:
        context = context or {}
        trace: List[AgentTraceStep] = []

        # Step 1: Trace thought & invoke liquidity analysis tool
        thought_1 = "Auditing current cash reserves against scheduled 30-day inflows and outflows to identify buffer breaches."
        tool_input_1 = {
            "current_cash": context.get("current_cash", 380000.0),
            "safety_buffer": context.get("safety_buffer", 150000.0),
            "inflows": context.get("inflows", []),
            "outflows": context.get("outflows", []),
            "days": 30
        }
        tool_res_1 = self.invoke_tool("analyze_liquidity_risk", **tool_input_1)
        trace.append(AgentTraceStep(
            step_number=1,
            thought=thought_1,
            tool_name="analyze_liquidity_risk",
            tool_input={"current_cash": tool_input_1["current_cash"], "safety_buffer": tool_input_1["safety_buffer"]},
            tool_output=tool_res_1
        ))

        is_breach = tool_res_1.get("is_buffer_breached", False)
        lowest_bal = tool_res_1.get("lowest_projected_balance_inr", 0.0)
        deficit = tool_res_1.get("deficit_to_safety_buffer_inr", 0.0)

        if is_breach:
            summary = (
                f"ALERT: Liquidity crunch detected. Projected balance drops to ₹{lowest_bal:,.0f} "
                f"on {tool_res_1.get('lowest_balance_date')}, breaching the ₹{tool_res_1.get('safety_buffer_inr'):,.0f} "
                f"safety buffer by ₹{deficit:,.0f}."
            )
            status = "WARNING"
        else:
            summary = (
                f"HEALTHY: Projected lowest cash floor is ₹{lowest_bal:,.0f}, "
                f"comfortably remaining above the ₹{tool_res_1.get('safety_buffer_inr'):,.0f} safety reserve."
            )
            status = "SUCCESS"

        return AgentResult(
            agent_name=self.name,
            role=self.role,
            status=status,
            trace=trace,
            summary=summary,
            data=tool_res_1
        )

class ReceivablesAgent(Agent):
    def __init__(self, llm: Optional[LLMClient] = None):
        super().__init__(
            name="ReceivablesAgent",
            role="Inflow Acceleration & Debtors Strategist",
            system_prompt="Analyze customer receivables, detect payment delays, evaluate 2% dynamic early settlement discounts, and draft client communication.",
            tools=[evaluate_early_settlement, draft_communication_action],
            llm=llm
        )

    def run(self, task: str, context: Optional[Dict[str, Any]] = None) -> AgentResult:
        context = context or {}
        trace: List[AgentTraceStep] = []
        inflows = context.get("inflows", [])

        # Step 1: Evaluate Early Settlement for large pending invoices
        thought_1 = "Scanning debtor aging and pending invoices >= ₹1,00,000 for 2% early settlement discount eligibility."
        tool_res_1 = self.invoke_tool("evaluate_early_settlement", inflows=inflows, min_amount=100000.0, discount_pct=2.0)
        trace.append(AgentTraceStep(
            step_number=1,
            thought=thought_1,
            tool_name="evaluate_early_settlement",
            tool_input={"min_amount": 100000.0, "discount_pct": 2.0},
            tool_output=tool_res_1
        ))

        # Step 2: Draft communication for the top qualifying debtor
        artifacts = {}
        top_candidates = tool_res_1.get("candidates", [])
        if top_candidates:
            target = top_candidates[0]
            thought_2 = f"Drafting formal early-settlement incentive letter for enterprise client '{target.get('source')}'."
            draft_res = self.invoke_tool(
                "draft_communication_action",
                scenario_type="EARLY_DISCOUNT",
                recipient_name=target.get("source"),
                amount_inr=target.get("invoice_amount_inr"),
                due_date=target.get("due_date", "Upcoming"),
                proposal_details="2% discount for 5-day early settlement via UPI/NEFT"
            )
            trace.append(AgentTraceStep(
                step_number=2,
                thought=thought_2,
                tool_name="draft_communication_action",
                tool_input={"recipient": target.get("source"), "amount_inr": target.get("invoice_amount_inr")},
                tool_output={"subject": draft_res.get("subject")}
            ))
            artifacts["outreach_email"] = draft_res

        total_accel = tool_res_1.get("total_accelerated_liquidity_inr", 0.0)
        summary = (
            f"Identified {tool_res_1.get('candidate_count')} high-value invoice(s). "
            f"Offering a 2% early-settlement incentive unlocks ₹{total_accel:,.0f} in accelerated cash."
            if total_accel > 0 else "No high-value invoices required early discounting."
        )

        return AgentResult(
            agent_name=self.name,
            role=self.role,
            status="SUCCESS",
            trace=trace,
            summary=summary,
            data=tool_res_1,
            artifacts=artifacts
        )

class PayablesAgent(Agent):
    def __init__(self, llm: Optional[LLMClient] = None):
        super().__init__(
            name="PayablesAgent",
            role="Vendor Relations & Payables Optimizer",
            system_prompt="Safeguard core payroll, identify non-critical supplier/marketing bills that can be safely rescheduled by 14 days, and audit discretionary spend.",
            tools=[reschedule_vendor_bills, audit_discretionary_spend, draft_communication_action],
            llm=llm
        )

    def run(self, task: str, context: Optional[Dict[str, Any]] = None) -> AgentResult:
        context = context or {}
        trace: List[AgentTraceStep] = []
        outflows = context.get("outflows", [])

        # Step 1: Reschedule flexible vendor bills
        thought_1 = "Analyzing payables to protect payroll while isolating flexible supplier bills for +14 day deferral."
        resched_res = self.invoke_tool("reschedule_vendor_bills", outflows=outflows, target_deferral_days=14)
        trace.append(AgentTraceStep(
            step_number=1,
            thought=thought_1,
            tool_name="reschedule_vendor_bills",
            tool_input={"target_deferral_days": 14},
            tool_output=resched_res
        ))

        # Step 2: Audit discretionary spend
        thought_2 = "Auditing non-essential outflows for an immediate 15% efficiency freeze."
        audit_res = self.invoke_tool("audit_discretionary_spend", outflows=outflows, trim_percentage=15.0)
        trace.append(AgentTraceStep(
            step_number=2,
            thought=thought_2,
            tool_name="audit_discretionary_spend",
            tool_input={"trim_percentage": 15.0},
            tool_output=audit_res
        ))

        # Step 3: Draft vendor rescheduling letter for highest deferrable bill
        artifacts = {}
        deferrable_list = resched_res.get("deferrable_bills", [])
        if deferrable_list:
            top_bill = deferrable_list[0]
            thought_3 = f"Drafting respectful billing alignment notice for vendor '{top_bill.get('recipient')}'."
            draft_res = self.invoke_tool(
                "draft_communication_action",
                scenario_type="VENDOR_DEFERRAL",
                recipient_name=top_bill.get("recipient"),
                amount_inr=top_bill.get("amount_inr"),
                due_date=top_bill.get("original_due_date", "Upcoming"),
                proposal_details="14-day standard quarterly billing reconciliation"
            )
            trace.append(AgentTraceStep(
                step_number=3,
                thought=thought_3,
                tool_name="draft_communication_action",
                tool_input={"recipient": top_bill.get("recipient"), "amount_inr": top_bill.get("amount_inr")},
                tool_output={"subject": draft_res.get("subject")}
            ))
            artifacts["vendor_letter"] = draft_res

        total_relief = resched_res.get("total_relief_inr", 0.0) + audit_res.get("projected_savings_inr", 0.0)
        summary = (
            f"Preserved payroll intact. Identified ₹{resched_res.get('total_relief_inr', 0.0):,.0f} in deferrable vendor bills "
            f"and ₹{audit_res.get('projected_savings_inr', 0.0):,.0f}/mo in discretionary cost trims (Total Outflow Relief: ₹{total_relief:,.0f})."
        )

        return AgentResult(
            agent_name=self.name,
            role=self.role,
            status="SUCCESS",
            trace=trace,
            summary=summary,
            data={"reschedule": resched_res, "audit": audit_res},
            artifacts=artifacts
        )

class CFOAgent(Agent):
    def __init__(self, llm: Optional[LLMClient] = None):
        super().__init__(
            name="CFOAgent",
            role="Executive CFO Synthesizer & Co-Pilot",
            system_prompt="Orchestrate findings from specialized agents, synthesize a Master Action Plan, and formulate strategic directives.",
            tools=[synthesize_liquidity_plan],
            llm=llm
        )

    def run(self, task: str, context: Optional[Dict[str, Any]] = None) -> AgentResult:
        context = context or {}
        trace: List[AgentTraceStep] = []

        auditor_data = context.get("auditor_data", {})
        receivables_data = context.get("receivables_data", {})
        payables_data = context.get("payables_data", {})

        thought_1 = "Synthesizing multi-agent outputs into an executive Master Liquidity Roadmap."
        synth_res = self.invoke_tool(
            "synthesize_liquidity_plan",
            auditor_findings=auditor_data,
            receivables_strategy=receivables_data,
            payables_strategy=payables_data.get("reschedule", {}),
            discretionary_audit=payables_data.get("audit", {})
        )
        trace.append(AgentTraceStep(
            step_number=1,
            thought=thought_1,
            tool_name="synthesize_liquidity_plan",
            tool_input={"total_actions": len(synth_res.get("actions", []))},
            tool_output=synth_res
        ))

        return AgentResult(
            agent_name=self.name,
            role=self.role,
            status="SUCCESS",
            trace=trace,
            summary=synth_res.get("executive_verdict", "Optimization plan generated."),
            data=synth_res
        )


class CashFlowAgentOrchestrator:
    """
    Coordinates the autonomous multi-agent financial optimization workflow.
    """
    def __init__(self, llm_client: Optional[LLMClient] = None):
        self.llm = llm_client or LLMClient()
        self.auditor = AuditorAgent(self.llm)
        self.receivables = ReceivablesAgent(self.llm)
        self.payables = PayablesAgent(self.llm)
        self.cfo = CFOAgent(self.llm)

    def run_team_optimization(
        self,
        current_cash: float,
        safety_buffer: float,
        inflows: List[Dict[str, Any]],
        outflows: List[Dict[str, Any]]
    ) -> MultiAgentOptimizationReport:
        """
        Executes collaborative multi-agent reasoning pipeline.
        """
        shared_context = {
            "current_cash": current_cash,
            "safety_buffer": safety_buffer,
            "inflows": inflows,
            "outflows": outflows
        }

        # 1. Auditor Agent: Identify crunches & dips
        auditor_result = self.auditor.run("Audit 30-day cash flow horizon", shared_context)
        shared_context["auditor_data"] = auditor_result.data

        # 2. Receivables Agent: Discover early payment acceleration
        receivables_result = self.receivables.run("Optimize customer invoice collection", shared_context)
        shared_context["receivables_data"] = receivables_result.data

        # 3. Payables Agent: Reschedule non-critical bills & audit spend
        payables_result = self.payables.run("Optimize disbursements and preserve runway", shared_context)
        shared_context["payables_data"] = payables_result.data

        # 4. CFO Agent: Synthesize master roadmap
        cfo_result = self.cfo.run("Synthesize multi-agent master plan", shared_context)

        # Collect communication artifacts
        artifacts = []
        if receivables_result.artifacts and "outreach_email" in receivables_result.artifacts:
            artifacts.append(receivables_result.artifacts["outreach_email"])
        if payables_result.artifacts and "vendor_letter" in payables_result.artifacts:
            artifacts.append(payables_result.artifacts["vendor_letter"])

        synth_data = cfo_result.data
        report = MultiAgentOptimizationReport(
            timestamp=datetime.now().strftime("%Y-%m-%d %H:%M:%S"),
            status=synth_data.get("status", "SUCCESS"),
            executive_summary=synth_data.get("executive_verdict", ""),
            total_cash_relief_inr=synth_data.get("total_cash_relief_inr", 0.0),
            original_lowest_balance_inr=synth_data.get("original_lowest_balance_inr", 0.0),
            optimized_lowest_balance_inr=synth_data.get("optimized_lowest_balance_inr", 0.0),
            safety_buffer_inr=synth_data.get("safety_buffer_inr", safety_buffer),
            is_buffer_restored=synth_data.get("is_liquidity_restored", True),
            agent_results=[auditor_result, receivables_result, payables_result, cfo_result],
            master_actions=synth_data.get("actions", []),
            communication_artifacts=artifacts
        )
        return report

    def chat_with_cfo(
        self,
        message: str,
        current_cash: float,
        safety_buffer: float,
        inflows: List[Dict[str, Any]],
        outflows: List[Dict[str, Any]],
        history: Optional[List[Dict[str, str]]] = None
    ) -> Dict[str, Any]:
        """
        Interactive CFO Co-Pilot conversational consultation.
        """
        # Run a quick liquidity analysis to ground the response in real ledger data
        liquidity = analyze_liquidity_risk(current_cash, safety_buffer, inflows, outflows)
        
        context = {
            "current_cash": current_cash,
            "safety_buffer": safety_buffer,
            "lowest_balance": liquidity.get("lowest_projected_balance_inr", 0.0),
            "runway_months": liquidity.get("runway_months", 2.0),
            "is_breached": liquidity.get("is_buffer_breached", False)
        }

        system_prompt = (
            "You are an elite Chief Financial Officer (CFO) and Working Capital Advisor. "
            "You advise Indian SMBs, startups, and enterprises using Indian Rupees (₹ INR). "
            "Always be practical, concise, and provide clear step-by-step numbers."
        )

        response_text = self.llm.generate(
            prompt=message,
            system_prompt=system_prompt,
            context=context
        )

        return {
            "reply": response_text,
            "metrics": context,
            "model_used": self.llm.model
        }
