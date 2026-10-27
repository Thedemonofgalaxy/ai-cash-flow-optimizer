# CashPulse AI
### Minimalist AI-Powered Working Capital & Cash Flow Optimizer

[![Python 3.12](https://img.shields.io/badge/Python-3.12-3776AB.svg?style=flat&logo=python&logoColor=white)](https://www.python.org/)
[![FastAPI](https://img.shields.io/badge/FastAPI-0.110+-009688.svg?style=flat&logo=fastapi&logoColor=white)](https://fastapi.tiangolo.com/)
[![Tailwind CSS](https://img.shields.io/badge/Tailwind_CSS-3.4-38B2AC.svg?style=flat&logo=tailwind-css&logoColor=white)](https://tailwindcss.com/)
[![CI/CD](https://img.shields.io/badge/GitHub_Actions-Automated_Tests-2088FF.svg?style=flat&logo=github-actions&logoColor=white)](https://github.com/)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)

---

## 🌐 Direct Live Web Demo (Zero Installation Required!)

> **No `git clone`, no `pip install`, and no local setup required!**
> Click the direct links below to open and interact with the Cash Flow Optimizer right in your browser on desktop or mobile:

### 🚀 **[Open Live CashPulse AI Dashboard (GitHub Pages)](https://thedemonofgalaxy.github.io/ai-cash-flow-optimizer/)**

[![Open in GitHub Pages](https://img.shields.io/badge/Live%20Demo-GitHub%20Pages-10b981?style=for-the-badge&logo=github&logoColor=white)](https://thedemonofgalaxy.github.io/ai-cash-flow-optimizer/)
[![Open in GitHub Codespaces](https://img.shields.io/badge/1--Click%20Cloud%20Sandbox-GitHub%20Codespaces-blue?style=for-the-badge&logo=github&logoColor=white)](https://codespaces.new/Thedemonofgalaxy/ai-cash-flow-optimizer)

- **Direct GitHub Pages Link:** `https://<YOUR_USERNAME>.github.io/ai-cash-flow-optimizer/`
- **1-Click Cloud Codespace:** [Launch in GitHub Codespaces](https://codespaces.new/Thedemonofgalaxy/ai-cash-flow-optimizer) (launches Python FastAPI environment in the cloud)

---

## 1. Problem Statement & Overview

Many growing startups, freelancers, and businesses are **profitable on paper, but cash-poor in practice**:
- Invoices are issued with Net-30 terms, but clients frequently pay 10–20 days late.
- Critical outflows (payroll, rent, supplier invoices) must be paid on exact dates.
- Result: **Cash crunches, overdraft fees, and unnecessary emergency borrowing**.

**CashPulse AI** is a minimalist, intelligent cash flow optimization tool that projects daily cash balances, identifies upcoming shortfall pinch points, and provides **quantified, actionable optimization levers** to preserve liquidity without taking on debt.

---

## 2. Key Capabilities

| Feature | Description |
| :--- | :--- |
| **30-Day Liquidity Horizon** | Projects daily rolling bank balance against a configurable safety reserve buffer (e.g., ₹1,50,000). |
| **Shortfall Sentinel** | Pinpoints the exact calendar day cash falls below the safety buffer or risks overdraft. |
| **AI Optimization Levers** | Automatically recommends dynamic early-payment discounts (2/10 Net 30), vendor payment smoothing, and discretionary spending freezes. |
| **Interactive "What-If" Sandbox** | Live toggles and sliders to simulate client delays, bill deferrals, and immediate cash trajectory shifts. |
| **Health Scoring & Runway** | Computes monthly burn rate, runway in months, and an objective cash health grade (A+ through F). |
| **Dual-Mode Engine** | Runs 100% in browser on GitHub Pages without a backend, or connects to a high-speed Python FastAPI service. |

---

## 3. Quickstart Guide (Run Locally in 5 Seconds)

### Option A: Windows (1-Click)
Double-click [`run.bat`](run.bat) or run:
```cmd
python app.py
```

### Option B: macOS / Linux
```bash
chmod +x run.sh
./run.sh
```

Open your browser to:
- **Web Dashboard:** [http://127.0.0.1:8050](http://127.0.0.1:8050)
- **Interactive OpenAPI Docs:** [http://127.0.0.1:8050/docs](http://127.0.0.1:8050/docs)

---

## 4. How to Deploy to GitHub

### Method 1: Using the Automated Setup Script (Windows)
Double-click [`setup_github.bat`](setup_github.bat) and enter your GitHub repository URL (e.g. `https://github.com/Thedemonofgalaxy/ai-cash-flow-optimizer.git`).

### Method 2: Command Line
```bash
# 1. Initialize Git repository
git init -b main

# 2. Stage all files
git add .

# 3. Create initial commit
git commit -m "feat: initial commit of CashPulse AI cash flow optimizer"

# 4. Link to your GitHub repository (create an empty repo on GitHub first)
git remote add origin https://github.com/YOUR_USERNAME/ai-cash-flow-optimizer.git

# 5. Push to GitHub
git push -u origin main
```

### Enabling the Direct GitHub Pages Web Link:
1. Go to your repository on GitHub: `https://github.com/YOUR_USERNAME/ai-cash-flow-optimizer/settings/pages`
2. Under **Build and deployment > Source**, select **GitHub Actions** (it uses the included `.github/workflows/pages.yml`).
3. Your live link will be accessible at:
   `https://<YOUR_USERNAME>.github.io/ai-cash-flow-optimizer/`

---

## 5. REST API Endpoints Overview

| Method | Endpoint | Description |
| :--- | :--- | :--- |
| `GET` | `/health` | Health check & system diagnostics |
| `GET` | `/api/forecast` | Returns 30-day daily forecast, metrics, and AI recommendations |
| `POST` | `/api/simulate` | Simulates custom what-if scenarios (discounts, deferrals, delays) |
| `GET` | `/api/inflows` | List all scheduled incoming revenues and invoices |
| `POST` | `/api/inflows` | Add a new invoice or income stream |
| `GET` | `/api/outflows` | List all scheduled outgoing expenses |
| `POST` | `/api/outflows` | Add a new expense or bill |
| `POST` | `/api/settings/balance`| Update starting cash balance and minimum safety buffer |

---

## 6. Automated Tests

Execute the automated test suite with:
```bash
python -m pytest tests/ -v
```

All tests validate:
- System health and API availability
- 30-day baseline cash trajectory calculation
- Liquidity shortfall & safety buffer breach detection
- Optimization recommendation generation and impact
- Scenario recalculation accuracy

---

## 7. License
Distributed under the **MIT License**. See `LICENSE` for details.
