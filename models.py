"""
AI Cash Flow Optimizer - Data Models & Schemas
"""

from typing import List, Optional, Dict
from pydantic import BaseModel, Field
from datetime import date, datetime

class CashInflow(BaseModel):
    id: str
    source: str
    amount: float
    due_date: str  # YYYY-MM-DD
    expected_delay_days: int = 0
    reliability_score: float = 0.90  # 0.0 to 1.0 probability of on-time payment
    is_recurring: bool = False
    recurring_interval: Optional[str] = None  # monthly, biweekly

class CashOutflow(BaseModel):
    id: str
    recipient: str
    amount: float
    due_date: str  # YYYY-MM-DD
    category: str  # Payroll, Rent, SaaS, Supplier, Taxes, Marketing
    is_essential: bool = True
    can_defer_days: int = 0
    is_recurring: bool = False

class OptimizationScenario(BaseModel):
    apply_early_discount: bool = False  # 2% discount for 10-day early settlement
    defer_vendor_payments: bool = False  # Shift flexible bills by 14 days
    trim_discretionary: bool = False    # Trim 15% non-essential spend
    custom_inflow_delay_days: int = 0

class CashFlowForecastDay(BaseModel):
    date: str
    starting_balance: float
    inflows: float
    outflows: float
    ending_balance: float
    is_danger_zone: bool = False

class AIOptimizationRecommendation(BaseModel):
    id: str
    category: str  # INFLOW_ACCELERATION, OUTFLOW_DEFERRAL, COST_TRIMMING, BUFFER_MANAGEMENT
    title: str
    description: str
    action: str
    cash_impact: float
    runway_impact_days: int
    confidence_score: float  # e.g., 0.95
    implemented: bool = False

class CashFlowReport(BaseModel):
    current_cash: float
    minimum_safety_buffer: float
    projected_lowest_balance: float
    lowest_balance_date: Optional[str]
    days_to_shortfall: Optional[int]
    total_30d_inflow: float
    total_30d_outflow: float
    net_30d_cash_flow: float
    burn_rate_monthly: float
    runway_months: float
    health_score: int  # 0 to 100
    health_grade: str   # A+, A, B, C, D, F
    timeline_baseline: List[CashFlowForecastDay]
    timeline_optimized: List[CashFlowForecastDay]
    recommendations: List[AIOptimizationRecommendation]
