"""
Automated Tests for the Agentic AI Framework & Multi-Agent Collaboration
"""

import sys
import os
from datetime import datetime

# Add project root to path
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from fastapi.testclient import TestClient
from app import app
from optimizer import get_default_inflows, get_default_outflows
from agent_framework import (
    CashFlowAgentOrchestrator,
    LLMClient,
    GLOBAL_TOOL_REGISTRY
)
from agent_framework.tools import (
    analyze_liquidity_risk,
    evaluate_early_settlement,
    reschedule_vendor_bills,
    audit_discretionary_spend,
    draft_communication_action,
    synthesize_liquidity_plan
)

client = TestClient(app)

def test_tool_registry():
    tools = GLOBAL_TOOL_REGISTRY.list_tools()
    tool_names = [t.name for t in tools]
    assert "analyze_liquidity_risk" in tool_names
    assert "evaluate_early_settlement" in tool_names
    assert "reschedule_vendor_bills" in tool_names
    assert "audit_discretionary_spend" in tool_names
    assert "draft_communication_action" in tool_names
    assert "synthesize_liquidity_plan" in tool_names

def test_analyze_liquidity_risk_tool():
    base_date = datetime.now()
    inflows = [i.model_dump() for i in get_default_inflows(base_date)]
    outflows = [o.model_dump() for o in get_default_outflows(base_date)]

    res = analyze_liquidity_risk(
        current_cash=380000.0,
        safety_buffer=150000.0,
        inflows=inflows,
        outflows=outflows,
        days=30
    )
    assert "lowest_projected_balance_inr" in res
    assert "runway_months" in res
    assert res["current_cash_inr"] == 380000.0

def test_evaluate_early_settlement_tool():
    base_date = datetime.now()
    inflows = [i.model_dump() for i in get_default_inflows(base_date)]

    res = evaluate_early_settlement(inflows=inflows, min_amount=100000.0, discount_pct=2.0)
    assert res["candidate_count"] > 0
    assert res["total_accelerated_liquidity_inr"] > 0
    assert res["total_discount_cost_inr"] > 0

def test_reschedule_vendor_bills_tool():
    base_date = datetime.now()
    outflows = [o.model_dump() for o in get_default_outflows(base_date)]

    res = reschedule_vendor_bills(outflows=outflows, target_deferral_days=14)
    assert res["deferrable_count"] > 0
    assert res["total_relief_inr"] > 0
    for b in res["deferrable_bills"]:
        assert b["category"] != "Payroll"  # Payroll must never be deferred

def test_audit_discretionary_spend_tool():
    base_date = datetime.now()
    outflows = [o.model_dump() for o in get_default_outflows(base_date)]

    res = audit_discretionary_spend(outflows=outflows, trim_percentage=15.0)
    assert res["discretionary_item_count"] > 0
    assert res["projected_savings_inr"] > 0

def test_draft_communication_action_tool():
    res_discount = draft_communication_action(
        scenario_type="EARLY_DISCOUNT",
        recipient_name="Acme India Pvt Ltd",
        amount_inr=285000.0,
        due_date="2026-11-15",
        proposal_details="2% cash discount"
    )
    assert "₹285,000" in res_discount["subject"] or "Acme" in res_discount["subject"]
    assert "2% early settlement discount" in res_discount["body"]

    res_defer = draft_communication_action(
        scenario_type="VENDOR_DEFERRAL",
        recipient_name="Hardware Supplies Ltd",
        amount_inr=155000.0,
        due_date="2026-11-10",
        proposal_details="14-day deferral"
    )
    assert "14-day" in res_defer["body"]

def test_multi_agent_orchestration_run():
    base_date = datetime.now()
    inflows = [i.model_dump() for i in get_default_inflows(base_date)]
    outflows = [o.model_dump() for o in get_default_outflows(base_date)]

    orchestrator = CashFlowAgentOrchestrator()
    report = orchestrator.run_team_optimization(
        current_cash=380000.0,
        safety_buffer=150000.0,
        inflows=inflows,
        outflows=outflows
    )

    assert len(report.agent_results) == 4
    agent_names = [r.agent_name for r in report.agent_results]
    assert "AuditorAgent" in agent_names
    assert "ReceivablesAgent" in agent_names
    assert "PayablesAgent" in agent_names
    assert "CFOAgent" in agent_names

    assert report.total_cash_relief_inr > 0
    assert len(report.master_actions) > 0
    assert len(report.communication_artifacts) > 0

def test_api_agent_tools_endpoint():
    res = client.get("/api/agents/tools")
    assert res.status_code == 200
    data = res.json()
    assert data["count"] >= 5
    assert len(data["tools"]) >= 5

def test_api_agent_optimize_endpoint():
    res = client.post("/api/agents/optimize", json={
        "provider": "local",
        "custom_cash": 350000.0,
        "custom_buffer": 150000.0
    })
    assert res.status_code == 200
    data = res.json()
    assert "total_cash_relief_inr" in data
    assert len(data["agent_results"]) == 4
    assert len(data["master_actions"]) > 0

def test_api_agent_chat_endpoint():
    res = client.post("/api/agents/chat", json={
        "message": "How do we handle our upcoming payroll crunch without borrowing?",
        "provider": "local"
    })
    assert res.status_code == 200
    data = res.json()
    assert "reply" in data
    assert "Payroll" in data["reply"] or "₹" in data["reply"]
