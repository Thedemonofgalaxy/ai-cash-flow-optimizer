# CashPulse AI - Agentic Working Capital & Cash Flow Optimizer (₹ INR Edition)

[![Python 3.12](https://img.shields.io/badge/Python-3.12-3776AB.svg?style=flat&logo=python&logoColor=white)](https://www.python.org/)
[![FastAPI](https://img.shields.io/badge/FastAPI-0.110+-009688.svg?style=flat&logo=fastapi&logoColor=white)](https://fastapi.tiangolo.com/)
[![Agentic AI](https://img.shields.io/badge/Agentic_AI-Multi--Agent_ReAct-6366f1.svg?style=flat&logo=openai&logoColor=white)](https://github.com/Thedemonofgalaxy/ai-cash-flow-optimizer)
[![Currency](https://img.shields.io/badge/Currency-₹_INR-emerald.svg?style=flat)](https://github.com/Thedemonofgalaxy/ai-cash-flow-optimizer)
[![Tests Passing](https://img.shields.io/badge/Tests-15_Passed-success.svg?style=flat)](https://github.com/Thedemonofgalaxy/ai-cash-flow-optimizer)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)

---

## 🌐 Direct Live Web Demo (Zero Installation Required!)

> **No `git clone`, no `pip install`, and no local setup required!**
> Click the direct link below to open and interact with the AI Multi-Agent Cash Flow Optimizer right in your browser on desktop or mobile:

### 🚀 **[Open Live CashPulse AI Dashboard (GitHub Pages)](https://thedemonofgalaxy.github.io/ai-cash-flow-optimizer/)**

[![Open in GitHub Pages](https://img.shields.io/badge/Live%20Demo-GitHub%20Pages-10b981?style=for-the-badge&logo=github&logoColor=white)](https://thedemonofgalaxy.github.io/ai-cash-flow-optimizer/)
[![Open in GitHub Codespaces](https://img.shields.io/badge/1--Click%20Cloud%20Sandbox-GitHub%20Codespaces-blue?style=for-the-badge&logo=github&logoColor=white)](https://codespaces.new/Thedemonofgalaxy/ai-cash-flow-optimizer)

- **Direct GitHub Pages Link:** [https://thedemonofgalaxy.github.io/ai-cash-flow-optimizer/](https://thedemonofgalaxy.github.io/ai-cash-flow-optimizer/)
- **1-Click Cloud Codespace:** [Launch in GitHub Codespaces](https://codespaces.new/Thedemonofgalaxy/ai-cash-flow-optimizer) (launches Python FastAPI environment in the cloud)

---

## 🤖 1. Agentic AI Framework & Multi-Agent Architecture

CashPulse AI includes a modular **Autonomous Agentic Framework** (`agent_framework/`) utilizing the **ReAct (Reasoning + Action)** pattern. Four specialized autonomous agents collaborate sequentially to audit bank reserves, accelerate receivables, reschedule payables, and formulate an authoritative Master CFO Action Plan in Indian Rupees (₹ INR):

```
       +--------------------------------------------------------------+
       |                  Agentic AI Orchestrator                     |
       +--------------------------------------------------------------+
                                      |
         1. AUDIT                     |  2. ACCELERATE
            v                         v
+------------------------+  +-----------------------------------+
|     Auditor Agent      |  |     Receivables Strategist        |
|  - analyze_liquidity   |  |  - evaluate_early_settlement      |
|  - Pinpoint Dips (₹)   |  |  - 2/10 Net 30 Incentives         |
+------------------------+  +-----------------------------------+
            |                                 |
            +----------------+----------------+
                             |
         3. RESCHEDULE       |  4. SYNTHESIZE
            v                         v
+------------------------+  +-----------------------------------+
|    Payables Optimizer  |  |    CFO Synthesizer Co-Pilot       |
|  - reschedule_bills    |  |  - synthesize_liquidity_plan      |
|  - audit_discretionary |  |  - Interactive Chat & Outreach    |
+------------------------+  +-----------------------------------+
```

### Specialized Autonomous Agents:
1. 🛡️ **Auditor Agent (Financial Sentinel)**:
   - Tool: `analyze_liquidity_risk`
   - Role: Audits daily bank balance against the configured safety reserve (e.g. ₹1,50,000), detecting shortfall days, burn rate, and runway.
2. ⚡ **Receivables Strategist Agent (Inflow Accelerator)**:
   - Tool: `evaluate_early_settlement`, `draft_communication_action`
   - Role: Identifies pending enterprise invoices >= ₹1,00,000, evaluates dynamic 2% cash discounts (2/10 Net 30), and drafts professional settlement incentive emails.
3. ⏳ **Payables Optimizer Agent (Vendor & Runway Guard)**:
   - Tools: `reschedule_vendor_bills`, `audit_discretionary_spend`, `draft_communication_action`
   - Role: Safeguards core payroll while identifying deferrable supplier bills (+14 days) and auditing non-essential spend for a 15% freeze.
4. 👔 **CFO Synthesizer Agent (Executive Co-Pilot)**:
   - Tool: `synthesize_liquidity_plan`
   - Role: Combines findings into a prioritized Master Action Plan, calculates total cash relief (₹ INR), and answers executive questions interactively.

---

## 🛠️ 2. Agentic AI Tools

The framework provides specialized decorators and registered tools:

| Tool Name | Parameters | Output & Purpose |
| :--- | :--- | :--- |
| `analyze_liquidity_risk` | `current_cash`, `safety_buffer`, `inflows`, `outflows` | Identifies lowest cash point, breach date, and deficit (₹ INR). |
| `evaluate_early_settlement` | `inflows`, `min_amount`, `discount_pct` | Computes accelerated cash and discount cost from 2% incentive. |
| `reschedule_vendor_bills` | `outflows`, `target_deferral_days` | Isolates non-payroll deferrable bills and shifts payment dates. |
| `audit_discretionary_spend` | `outflows`, `trim_percentage` | Audits non-essential SaaS and marketing costs for 15% freeze. |
| `draft_communication_action` | `scenario_type`, `recipient_name`, `amount_inr` | Generates copyable, diplomatic business letters for clients and vendors. |
| `synthesize_liquidity_plan` | Agent findings | Produces master action roadmap with step-by-step ₹ relief. |

---

## 🧠 3. Multi-Provider AI Model Support

CashPulse AI is designed with a **fail-safe, zero-cost architecture**:
- **Built-in Local Heuristic Neural Engine (Default)**: Requires **zero API keys**, runs 100% offline, instantaneous, private, and works directly in GitHub Pages!
- **OpenAI Integration**: Plug-and-play support for `gpt-4o-mini` / `gpt-4o` using user-provided API key or `OPENAI_API_KEY`.
- **Google Gemini Integration**: Support for `gemini-1.5-flash` using `GEMINI_API_KEY`.
- **LiteLLM Bridge**: Seamlessly fallbacks between external LLM providers and local heuristic synthesis.

---

## 💡 4. Key Dashboard Features

- **Agentic War Room**: One-click execution of the 4 collaborative agents with live reasoning traces (`Thought -> Tool -> Observation`).
- **Generated Outreach Drafts**: Instant, one-click copyable email and letter drafts for clients (2% discount) and vendors (14-day deferral).
- **Interactive CFO Co-Pilot Chat**: Conversational AI assistant grounded in real bank ledger numbers with quick-ask prompt chips.
- **30-Day Liquidity Horizon Chart**: Interactive Chart.js visualizer comparing baseline vs. AI-optimized cash trajectories.
- **Dynamic Scenario Sandbox**: Instant sliders and toggles for client delay stress-testing and cash levers.
- **Add & Edit Transactions**: Intuitive modals with quick Rupee presets (₹10k, ₹50k, ₹1 Lakh, ₹2.5 Lakh).

---

## 🚀 5. Quickstart Guide (Local Development)

### 1-Click Launch:
```bash
# Windows
run.bat

# macOS / Linux
./run.sh
```

Or run via Python:
```bash
pip install -r requirements.txt
python app.py
```

Open your browser:
- **Dashboard:** [http://127.0.0.1:8050](http://127.0.0.1:8050)
- **OpenAPI Documentation:** [http://127.0.0.1:8050/docs](http://127.0.0.1:8050/docs)

---

## 🧪 6. Automated Test Suite

Run the full automated test suite covering all agent tools, multi-agent orchestration, and API endpoints:

```bash
python -m pytest tests/ -v
```

**Results:**
```
tests/test_agents.py::test_tool_registry PASSED
tests/test_agents.py::test_analyze_liquidity_risk_tool PASSED
tests/test_agents.py::test_evaluate_early_settlement_tool PASSED
tests/test_agents.py::test_reschedule_vendor_bills_tool PASSED
tests/test_agents.py::test_audit_discretionary_spend_tool PASSED
tests/test_agents.py::test_draft_communication_action_tool PASSED
tests/test_agents.py::test_multi_agent_orchestration_run PASSED
tests/test_agents.py::test_api_agent_tools_endpoint PASSED
tests/test_agents.py::test_api_agent_optimize_endpoint PASSED
tests/test_agents.py::test_api_agent_chat_endpoint PASSED
tests/test_optimizer.py::test_health_check PASSED
tests/test_optimizer.py::test_engine_baseline_forecast PASSED
tests/test_optimizer.py::test_ai_recommendations_trigger_on_crunch PASSED
tests/test_optimizer.py::test_optimization_scenario_improves_cash_floor PASSED
tests/test_optimizer.py::test_api_forecast_and_simulate PASSED
======================== 15 passed in 1.21s ========================
```

---

## 📄 License
MIT License. Built for startups, SMBs, freelancers, and growing businesses.
