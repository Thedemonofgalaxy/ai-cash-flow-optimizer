"""
AI Cash Flow Optimizer - Automated Test Suite
"""

import sys
import os
from datetime import datetime

# Add project root to path
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from models import CashInflow, CashOutflow, OptimizationScenario
from optimizer import (
    CashFlowOptimizerEngine,
    get_default_inflows,
    get_default_outflows
)
from fastapi.testclient import TestClient
from app import app

client = TestClient(app)

def test_health_check():
    res = client.get("/health")
    assert res.status_code == 200
    assert res.json()["status"] == "HEALTHY"

def test_engine_baseline_forecast():
    base_date = datetime.now()
    inflows = get_default_inflows(base_date)
    outflows = get_default_outflows(base_date)

    engine = CashFlowOptimizerEngine(current_cash=380000.0, safety_buffer=150000.0)
    report = engine.analyze_and_optimize(inflows, outflows, start_date=base_date)

    assert report.current_cash == 380000.0
    assert report.minimum_safety_buffer == 150000.0
    assert len(report.timeline_baseline) == 31  # 30 days + day 0
    assert report.total_30d_inflow > 0
    assert report.total_30d_outflow > 0
    assert len(report.recommendations) > 0

def test_ai_recommendations_trigger_on_crunch():
    base_date = datetime.now()
    inflows = get_default_inflows(base_date)
    outflows = get_default_outflows(base_date)

    # Tight cash where buffer is breached
    engine = CashFlowOptimizerEngine(current_cash=200000.0, safety_buffer=180000.0)
    report = engine.analyze_and_optimize(inflows, outflows, start_date=base_date)

    # Verify recommendations are generated
    categories = [r.category for r in report.recommendations]
    assert "OUTFLOW_DEFERRAL" in categories
    assert "INFLOW_ACCELERATION" in categories

def test_optimization_scenario_improves_cash_floor():
    base_date = datetime.now()
    inflows = get_default_inflows(base_date)
    outflows = get_default_outflows(base_date)

    engine = CashFlowOptimizerEngine(current_cash=380000.0, safety_buffer=150000.0)
    report = engine.analyze_and_optimize(inflows, outflows, start_date=base_date)

    lowest_baseline = report.projected_lowest_balance
    lowest_optimized = min(day.ending_balance for day in report.timeline_optimized)

    # Optimized cash floor must be higher than baseline cash floor
    assert lowest_optimized > lowest_baseline

def test_api_forecast_and_simulate():
    res = client.get("/api/forecast")
    assert res.status_code == 200
    data = res.json()
    assert "health_score" in data
    assert "recommendations" in data

    # Test simulation endpoint
    sim_payload = {
        "scenario": {
            "apply_early_discount": True,
            "defer_vendor_payments": True,
            "trim_discretionary": True,
            "custom_inflow_delay_days": 0
        }
    }
    res_sim = client.post("/api/simulate", json=sim_payload)
    assert res_sim.status_code == 200
    sim_data = res_sim.json()
    assert len(sim_data["timeline_baseline"]) > 0
