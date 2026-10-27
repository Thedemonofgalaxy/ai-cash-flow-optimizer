"""
AI Cash Flow Optimizer - Minimalist FastAPI Application
"""

import os
import sys
from datetime import datetime
from typing import List, Optional
from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from fastapi.responses import FileResponse
from pydantic import BaseModel
from mangum import Mangum

# Ensure project root is in path
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

if hasattr(sys.stdout, "reconfigure"):
    sys.stdout.reconfigure(encoding="utf-8", errors="replace")

from models import (
    CashInflow,
    CashOutflow,
    OptimizationScenario,
    CashFlowReport
)
from optimizer import (
    CashFlowOptimizerEngine,
    get_default_inflows,
    get_default_outflows
)
from agent_framework import (
    CashFlowAgentOrchestrator,
    LLMClient,
    GLOBAL_TOOL_REGISTRY
)
from agent_framework.orchestrator import MultiAgentOptimizationReport

app = FastAPI(
    title="AI Cash Flow Optimizer",
    version="1.0.0",
    description="Minimalist, Intelligent Working Capital & Cash Flow Optimization Engine"
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# In-memory storage with default realistic data (Rupees ₹)
base_date = datetime.now()
current_balance = 380000.0
safety_buffer = 150000.0
stored_inflows = get_default_inflows(base_date)
stored_outflows = get_default_outflows(base_date)

# Static and Web UI Mounting
BASE_DIR = os.path.dirname(os.path.abspath(__file__))
STATIC_DIR = os.path.join(BASE_DIR, "static")

if os.path.exists(STATIC_DIR):
    app.mount("/static", StaticFiles(directory=STATIC_DIR), name="static")

@app.get("/", include_in_schema=False)
def serve_dashboard():
    index_path = os.path.join(BASE_DIR, "index.html")
    if os.path.exists(index_path):
        return FileResponse(index_path)
    return {"message": "AI Cash Flow Optimizer API is running. Visit /docs for OpenAPI documentation."}

@app.get("/health", tags=["System"])
def health_check():
    return {
        "status": "HEALTHY",
        "service": "AI Cash Flow Optimizer",
        "version": "1.0.0"
    }

@app.get("/api/forecast", response_model=CashFlowReport, tags=["Cash Flow Forecast"])
def get_forecast():
    engine = CashFlowOptimizerEngine(current_cash=current_balance, safety_buffer=safety_buffer)
    report = engine.analyze_and_optimize(stored_inflows, stored_outflows)
    return report

class SimulationRequest(BaseModel):
    current_cash: Optional[float] = None
    safety_buffer: Optional[float] = None
    scenario: OptimizationScenario

@app.post("/api/simulate", response_model=CashFlowReport, tags=["Scenario Simulation"])
def simulate_scenario(req: SimulationRequest):
    cash = req.current_cash if req.current_cash is not None else current_balance
    buffer = req.safety_buffer if req.safety_buffer is not None else safety_buffer
    engine = CashFlowOptimizerEngine(current_cash=cash, safety_buffer=buffer)
    
    # Run optimization
    report = engine.analyze_and_optimize(stored_inflows, stored_outflows)

    # Overwrite baseline with user's specific scenario
    custom_timeline = engine.forecast_timeline(
        stored_inflows, stored_outflows, datetime.now(), days=30, scenario=req.scenario
    )
    report.timeline_baseline = custom_timeline
    return report

@app.get("/api/inflows", response_model=List[CashInflow], tags=["Transactions"])
def list_inflows():
    return stored_inflows

@app.post("/api/inflows", response_model=CashInflow, tags=["Transactions"])
def add_inflow(inflow: CashInflow):
    stored_inflows.append(inflow)
    return inflow

@app.get("/api/outflows", response_model=List[CashOutflow], tags=["Transactions"])
def list_outflows():
    return stored_outflows

@app.post("/api/outflows", response_model=CashOutflow, tags=["Transactions"])
def add_outflow(outflow: CashOutflow):
    stored_outflows.append(outflow)
    return outflow

class UpdateBalanceRequest(BaseModel):
    current_cash: float
    safety_buffer: float

@app.post("/api/settings/balance", tags=["Settings"])
def update_balance(req: UpdateBalanceRequest):
    global current_balance, safety_buffer
    current_balance = req.current_cash
    safety_buffer = req.safety_buffer
    return {
        "message": "Balances updated successfully",
        "current_cash": current_balance,
        "safety_buffer": safety_buffer
    }

class AgentOptimizeRequest(BaseModel):
    provider: Optional[str] = "auto"
    model: Optional[str] = "gpt-4o-mini"
    api_key: Optional[str] = None
    custom_cash: Optional[float] = None
    custom_buffer: Optional[float] = None

class AgentChatRequest(BaseModel):
    message: str
    history: Optional[List[dict]] = None
    provider: Optional[str] = "auto"
    model: Optional[str] = "gpt-4o-mini"
    api_key: Optional[str] = None

@app.get("/api/agents/tools", tags=["Agentic AI"])
def get_agent_tools():
    """List all registered agentic tools and schemas."""
    return {
        "count": len(GLOBAL_TOOL_REGISTRY.list_tools()),
        "tools": GLOBAL_TOOL_REGISTRY.to_schemas()
    }

@app.post("/api/agents/optimize", response_model=MultiAgentOptimizationReport, tags=["Agentic AI"])
def run_agentic_optimization(req: Optional[AgentOptimizeRequest] = None):
    """Triggers the full collaborative multi-agent optimization pipeline."""
    req = req or AgentOptimizeRequest()
    cash = req.custom_cash if req.custom_cash is not None else current_balance
    buffer = req.custom_buffer if req.custom_buffer is not None else safety_buffer

    llm = LLMClient(provider=req.provider or "auto", model=req.model or "gpt-4o-mini", api_key=req.api_key)
    orchestrator = CashFlowAgentOrchestrator(llm_client=llm)

    inflow_dicts = [inf.model_dump() for inf in stored_inflows]
    outflow_dicts = [out.model_dump() for out in stored_outflows]

    report = orchestrator.run_team_optimization(
        current_cash=cash,
        safety_buffer=buffer,
        inflows=inflow_dicts,
        outflows=outflow_dicts
    )
    return report

@app.post("/api/agents/chat", tags=["Agentic AI"])
def chat_with_cfo(req: AgentChatRequest):
    """Interactive consultation with the CFO Synthesizer Co-Pilot."""
    llm = LLMClient(provider=req.provider or "auto", model=req.model or "gpt-4o-mini", api_key=req.api_key)
    orchestrator = CashFlowAgentOrchestrator(llm_client=llm)

    inflow_dicts = [inf.model_dump() for inf in stored_inflows]
    outflow_dicts = [out.model_dump() for out in stored_outflows]

    result = orchestrator.chat_with_cfo(
        message=req.message,
        current_cash=current_balance,
        safety_buffer=safety_buffer,
        inflows=inflow_dicts,
        outflows=outflow_dicts,
        history=req.history
    )
    return result

# AWS Lambda / Serverless Mangum handler
handler = Mangum(app)

if __name__ == "__main__":
    import uvicorn
    port = int(os.getenv("PORT", 8050))
    print(f"\n=======================================================")
    print(f"[*] AI Cash Flow Optimizer - Starting Server")
    print(f"    Dashboard: http://127.0.0.1:{port}")
    print(f"    API Docs:  http://127.0.0.1:{port}/docs")
    print(f"=======================================================\n")
    uvicorn.run("app:app", host="0.0.0.0", port=port, reload=True)
