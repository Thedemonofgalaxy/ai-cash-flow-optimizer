/**
 * CashPulse AI - Minimalist Cash Flow Optimizer Controller (Indian Rupee ₹ Edition)
 * Works seamlessly both with Python FastAPI backend and directly in browser (GitHub Pages zero-install)
 */

let state = {
    currentCash: 380000.0,
    safetyBuffer: 150000.0,
    inflows: [],
    outflows: [],
    report: null,
    isBrowserMode: false,
    scenario: {
        earlyPay: false,
        deferVendor: false,
        trimCosts: false,
        delayDays: 0
    }
};

let cashChart = null;

// Currency Formatter for Indian Rupees (₹)
function formatINR(val, includeSymbol = true) {
    if (isNaN(val) || val === null || val === undefined) return includeSymbol ? "₹0" : "0";
    const sign = val < 0 ? "-" : "";
    const absVal = Math.round(Math.abs(val));
    const formatted = absVal.toLocaleString('en-IN');
    return (includeSymbol ? (val < 0 ? "-₹" : "₹") : sign) + formatted;
}

// Initial Seed Data in Indian Rupees (₹)
const DEFAULT_INFLOWS = [
    { id: "INF-01", source: "Enterprise SaaS Contract (Acme India)", amount: 285000.0, due_date_offset: 12, delay: 5 },
    { id: "INF-02", source: "Monthly Retainer (Tech Advisory)", amount: 142000.0, due_date_offset: 5, delay: 2 },
    { id: "INF-03", source: "Licensing Milestone (FinTech Ltd)", amount: 180000.0, due_date_offset: 22, delay: 8 },
    { id: "INF-04", source: "Online Razorpay / UPI Marketplace Sales", amount: 98000.0, due_date_offset: 15, delay: 0 }
];

const DEFAULT_OUTFLOWS = [
    { id: "OUT-01", recipient: "Core Team & Engineering Payroll", amount: 360000.0, due_date_offset: 10, category: "Payroll", essential: true, can_defer: 0 },
    { id: "OUT-02", recipient: "Cloud Infrastructure (AWS India / Vercel)", amount: 42000.0, due_date_offset: 7, category: "SaaS", essential: true, can_defer: 7 },
    { id: "OUT-03", recipient: "Office Lease & Utilities", amount: 85000.0, due_date_offset: 14, category: "Rent", essential: true, can_defer: 3 },
    { id: "OUT-04", recipient: "Hardware & Component Supplier", amount: 155000.0, due_date_offset: 9, category: "Supplier", essential: false, can_defer: 14 },
    { id: "OUT-05", recipient: "Quarterly Advance Tax / GST", amount: 62000.0, due_date_offset: 20, category: "Taxes", essential: true, can_defer: 0 },
    { id: "OUT-06", recipient: "Performance Marketing & Digital Ads", amount: 54000.0, due_date_offset: 8, category: "Marketing", essential: false, can_defer: 10 }
];

document.addEventListener('DOMContentLoaded', () => {
    initApp();
});

async function initApp() {
    loadLocalStore();

    // Check if backend API is reachable
    try {
        const res = await fetch('/api/forecast', { signal: AbortSignal.timeout(1500) });
        if (res.ok) {
            state.isBrowserMode = false;
        } else {
            state.isBrowserMode = true;
        }
    } catch (e) {
        state.isBrowserMode = true;
    }

    renderForecast();
}

function loadLocalStore() {
    const today = new Date();
    
    const savedCash = localStorage.getItem('cashpulse_currentCash_inr');
    if (savedCash) {
        state.currentCash = parseFloat(savedCash);
    } else {
        state.currentCash = 380000.0;
        localStorage.setItem('cashpulse_currentCash_inr', '380000');
    }

    const savedBuffer = localStorage.getItem('cashpulse_safetyBuffer_inr');
    if (savedBuffer) {
        state.safetyBuffer = parseFloat(savedBuffer);
    } else {
        state.safetyBuffer = 150000.0;
        localStorage.setItem('cashpulse_safetyBuffer_inr', '150000');
    }

    const savedInflows = localStorage.getItem('cashpulse_inflows_inr');
    if (savedInflows) {
        state.inflows = JSON.parse(savedInflows);
    } else {
        state.inflows = DEFAULT_INFLOWS.map(i => {
            const d = new Date(today);
            d.setDate(today.getDate() + i.due_date_offset);
            return {
                id: i.id,
                source: i.source,
                amount: i.amount,
                due_date: d.toISOString().split('T')[0],
                delay: i.delay
            };
        });
        localStorage.setItem('cashpulse_inflows_inr', JSON.stringify(state.inflows));
    }

    const savedOutflows = localStorage.getItem('cashpulse_outflows_inr');
    if (savedOutflows) {
        state.outflows = JSON.parse(savedOutflows);
    } else {
        state.outflows = DEFAULT_OUTFLOWS.map(o => {
            const d = new Date(today);
            d.setDate(today.getDate() + o.due_date_offset);
            return {
                id: o.id,
                recipient: o.recipient,
                amount: o.amount,
                due_date: d.toISOString().split('T')[0],
                category: o.category,
                essential: o.essential,
                can_defer: o.can_defer
            };
        });
        localStorage.setItem('cashpulse_outflows_inr', JSON.stringify(state.outflows));
    }
}

// -------------------------------------------------------------
// Forecast Simulation Engine (Pure JS in ₹ INR)
// -------------------------------------------------------------
function calculateForecast() {
    const today = new Date();
    const days = 30;
    
    function buildInflowMap(isOptimized) {
        const map = {};
        state.inflows.forEach(i => {
            const due = new Date(i.due_date);
            let effectiveDate = new Date(due);
            let amt = i.amount;

            if (isOptimized && state.scenario.earlyPay && i.amount >= 150000) {
                effectiveDate.setDate(due.getDate() - 5);
                amt = amt * 0.98;
            } else {
                effectiveDate.setDate(due.getDate() + (i.delay || 0) + (state.scenario.delayDays || 0));
            }

            const key = effectiveDate.toISOString().split('T')[0];
            map[key] = (map[key] || 0) + amt;
        });
        return map;
    }

    function buildOutflowMap(isOptimized) {
        const map = {};
        state.outflows.forEach(o => {
            const due = new Date(o.due_date);
            let effectiveDate = new Date(due);
            let amt = o.amount;

            if (isOptimized && state.scenario.trimCosts && !o.essential) {
                amt = amt * 0.85; // 15% reduction
            }

            if (isOptimized && state.scenario.deferVendor && o.can_defer > 0) {
                effectiveDate.setDate(due.getDate() + o.can_defer);
            }

            const key = effectiveDate.toISOString().split('T')[0];
            map[key] = (map[key] || 0) + amt;
        });
        return map;
    }

    const baselineIn = buildInflowMap(false);
    const baselineOut = buildOutflowMap(false);
    const optIn = buildInflowMap(true);
    const optOut = buildOutflowMap(true);

    const timelineBaseline = [];
    const timelineOptimized = [];

    let balBase = state.currentCash;
    let balOpt = state.currentCash;

    for (let d = 0; d <= days; d++) {
        const cur = new Date(today);
        cur.setDate(today.getDate() + d);
        const dateStr = cur.toISOString().split('T')[0];
        const label = `Day ${d}`;

        balBase = balBase + (baselineIn[dateStr] || 0) - (baselineOut[dateStr] || 0);
        balOpt = balOpt + (optIn[dateStr] || 0) - (optOut[dateStr] || 0);

        timelineBaseline.push({
            date: dateStr,
            label: label,
            balance: Math.round(balBase),
            isDanger: balBase < state.safetyBuffer
        });

        timelineOptimized.push({
            date: dateStr,
            label: label,
            balance: Math.round(balOpt),
            isDanger: balOpt < state.safetyBuffer
        });
    }

    const lowestBase = Math.min(...timelineBaseline.map(t => t.balance));
    const lowestBaseDay = timelineBaseline.find(t => t.balance === lowestBase);
    const lowestOpt = Math.min(...timelineOptimized.map(t => t.balance));

    const totalInflow = state.inflows.reduce((sum, i) => sum + i.amount, 0);
    const totalOutflow = state.outflows.reduce((sum, o) => sum + o.amount, 0);
    const netFlow = totalInflow - totalOutflow;

    const essentialOut = state.outflows.filter(o => o.essential).reduce((sum, o) => sum + o.amount, 0);
    const burnRate = Math.max(1000, totalOutflow > totalInflow ? totalOutflow - totalInflow : essentialOut * 0.4);
    const runwayMonths = (state.currentCash / burnRate).toFixed(1);

    const bufferRatio = Math.max(0, Math.min(1, lowestBase / state.safetyBuffer));
    const runwayFactor = Math.min(1, runwayMonths / 6.0);
    const flowRatio = Math.min(1, totalInflow / totalOutflow);
    const healthScore = Math.min(100, Math.max(10, Math.round((bufferRatio * 35) + (runwayFactor * 35) + (flowRatio * 30))));

    let grade = "C";
    if (healthScore >= 88) grade = "A+";
    else if (healthScore >= 78) grade = "A";
    else if (healthScore >= 65) grade = "B";
    else if (healthScore >= 50) grade = "C";
    else if (healthScore >= 35) grade = "D";
    else grade = "F";

    return {
        lowestBase,
        lowestBaseDay,
        lowestOpt,
        totalInflow,
        totalOutflow,
        netFlow,
        runwayMonths,
        burnRate,
        healthScore,
        grade,
        timelineBaseline,
        timelineOptimized
    };
}

// -------------------------------------------------------------
// Render UI Components
// -------------------------------------------------------------
function renderForecast() {
    const report = calculateForecast();
    state.report = report;

    // 1. Update Hero KPI Cards (₹ INR)
    document.getElementById('kpi-current-cash').innerText = formatINR(state.currentCash);
    document.getElementById('kpi-safety-buffer').innerText = formatINR(state.safetyBuffer);
    document.getElementById('chart-buffer-lbl').innerText = formatINR(state.safetyBuffer);

    const lowestElem = document.getElementById('kpi-lowest-cash');
    lowestElem.innerText = formatINR(report.lowestBase);
    if (report.lowestBase < state.safetyBuffer) {
        lowestElem.className = "mt-2 text-2xl font-bold font-mono text-rose-400";
        document.getElementById('kpi-margin-text').innerText = `Danger: -${formatINR(state.safetyBuffer - report.lowestBase)}`;
        document.getElementById('kpi-margin-text').className = "font-semibold text-rose-400";
    } else {
        lowestElem.className = "mt-2 text-2xl font-bold font-mono text-emerald-400";
        document.getElementById('kpi-margin-text').innerText = `Safe: +${formatINR(report.lowestBase - state.safetyBuffer)}`;
        document.getElementById('kpi-margin-text').className = "font-semibold text-emerald-400";
    }

    document.getElementById('kpi-lowest-date').innerText = report.lowestBaseDay ? report.lowestBaseDay.date.slice(5) : "--";

    const netElem = document.getElementById('kpi-net-flow');
    netElem.innerText = (report.netFlow >= 0 ? "+" : "-") + formatINR(Math.abs(report.netFlow));
    netElem.className = `mt-2 text-2xl font-bold font-mono ${report.netFlow >= 0 ? 'text-emerald-400' : 'text-rose-400'}`;

    document.getElementById('kpi-total-in').innerText = formatINR(report.totalInflow);
    document.getElementById('kpi-total-out').innerText = formatINR(report.totalOutflow);
    document.getElementById('kpi-runway').innerText = `${report.runwayMonths} Mo`;
    document.getElementById('kpi-burn-rate').innerText = `${formatINR(report.burnRate)}/mo`;

    // 2. Health Score
    document.getElementById('health-score-val').innerText = `${report.healthScore}/100`;
    const gradeBadge = document.getElementById('health-grade-val');
    gradeBadge.innerText = report.grade;
    if (['A+', 'A'].includes(report.grade)) gradeBadge.className = "px-1.5 py-0.2 rounded bg-emerald-500/20 text-emerald-400 text-[10px] font-black";
    else if (report.grade === 'B') gradeBadge.className = "px-1.5 py-0.2 rounded bg-blue-500/20 text-blue-400 text-[10px] font-black";
    else if (report.grade === 'C') gradeBadge.className = "px-1.5 py-0.2 rounded bg-amber-500/20 text-amber-400 text-[10px] font-black";
    else gradeBadge.className = "px-1.5 py-0.2 rounded bg-rose-500/20 text-rose-400 text-[10px] font-black";

    // 3. Shortfall Alert Banner
    const banner = document.getElementById('shortfall-alert-banner');
    if (report.lowestBase < state.safetyBuffer) {
        banner.classList.remove('hidden');
        document.getElementById('shortfall-desc').innerText = 
            `Cash drops to ${formatINR(report.lowestBase)} on ${report.lowestBaseDay.date}, breaching your ${formatINR(state.safetyBuffer)} safety reserve buffer.`;
    } else {
        banner.classList.add('hidden');
    }

    // 4. Render Chart (₹ INR)
    renderChart(report.timelineBaseline, report.timelineOptimized);

    // 5. Render AI Recommendations & Ledger
    renderRecommendations();
    renderLedger();

    // 6. Impact Delta
    const delta = report.lowestOpt - report.lowestBase;
    document.getElementById('optimization-impact-delta').innerText = delta > 0 ? `+${formatINR(delta)} liquidity floor preserved` : `₹0`;
}

function renderChart(baseline, optimized) {
    const ctx = document.getElementById('cashForecastChart').getContext('2d');
    const labels = baseline.map((b, idx) => idx % 3 === 0 ? `Day ${idx}` : '');
    const bufferLine = baseline.map(() => state.safetyBuffer);

    if (cashChart) cashChart.destroy();

    cashChart = new Chart(ctx, {
        type: 'line',
        data: {
            labels: labels,
            datasets: [
                {
                    label: 'Baseline Trajectory',
                    data: baseline.map(b => b.balance),
                    borderColor: '#f43f5e',
                    borderDash: [5, 5],
                    borderWidth: 2,
                    pointRadius: 0,
                    tension: 0.3
                },
                {
                    label: 'AI-Optimized Trajectory',
                    data: optimized.map(o => o.balance),
                    borderColor: '#10b981',
                    backgroundColor: 'rgba(16, 185, 129, 0.08)',
                    fill: true,
                    borderWidth: 2.5,
                    pointRadius: 0,
                    tension: 0.3
                },
                {
                    label: `Safety Buffer (${formatINR(state.safetyBuffer)})`,
                    data: bufferLine,
                    borderColor: '#f59e0b',
                    borderDash: [2, 2],
                    borderWidth: 1.5,
                    pointRadius: 0,
                    fill: false
                }
            ]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                legend: { display: false },
                tooltip: {
                    mode: 'index',
                    intersect: false,
                    callbacks: {
                        label: function(context) {
                            return `${context.dataset.label}: ${formatINR(context.parsed.y)}`;
                        }
                    }
                }
            },
            scales: {
                x: {
                    grid: { display: false },
                    ticks: { color: '#64748b', font: { size: 10 } }
                },
                y: {
                    grid: { color: 'rgba(255, 255, 255, 0.05)' },
                    ticks: {
                        color: '#64748b',
                        font: { size: 10 },
                        callback: val => {
                            if (val >= 100000) return `₹${(val / 100000).toFixed(1)}L`;
                            return `₹${(val / 1000).toFixed(0)}k`;
                        }
                    }
                }
            }
        }
    });
}

function renderRecommendations() {
    const container = document.getElementById('recommendations-container');
    if (!container) return;

    const recs = [
        {
            id: "rec-1",
            category: "INFLOW ACCELERATION",
            categoryColor: "bg-emerald-500/10 text-emerald-400 border-emerald-500/20",
            title: "Offer 2% Early Settlement on Acme India Invoice (₹2,85,000)",
            desc: "Invoice due on Day 12 averages 5 days late. Offering a 2% early-settlement incentive pulls ₹2,79,300 cash forward by ~7 days, preventing the Day 11 dip.",
            impact: "+₹2,79,300 cash unlocked early",
            actionKey: "earlyPay"
        },
        {
            id: "rec-2",
            category: "OUTFLOW DEFERRAL",
            categoryColor: "bg-indigo-500/10 text-indigo-400 border-indigo-500/20",
            title: "Shift Hardware Supplier Payment (+14 Days)",
            desc: "Vendor payment of ₹1,55,000 is due on Day 9 right before payroll. Utilizing standard 14-day grace terms pushes this outflow safely past payroll.",
            impact: "+₹1,55,000 liquidity retained over payroll",
            actionKey: "deferVendor"
        },
        {
            id: "rec-3",
            category: "DISCRETIONARY TRIMMING",
            categoryColor: "bg-amber-500/10 text-amber-400 border-amber-500/20",
            title: "Trim Non-Essential Ad Spend & Optional SaaS (-15%)",
            desc: "Temporarily trimming ad campaigns and pausing unassigned software seats saves cash without impacting core business operations.",
            impact: "+₹16,200 monthly savings",
            actionKey: "trimCosts"
        }
    ];

    container.innerHTML = recs.map(r => {
        const isActive = state.scenario[r.actionKey];
        return `
            <div class="p-3.5 rounded-xl bg-slate-900/60 border ${isActive ? 'border-emerald-500/40 bg-emerald-950/10' : 'border-slate-800'} transition flex items-start justify-between gap-3">
                <div>
                    <span class="text-[9px] font-bold tracking-wider px-2 py-0.5 rounded border ${r.categoryColor}">${r.category}</span>
                    <h4 class="text-xs font-bold text-white mt-1.5">${r.title}</h4>
                    <p class="text-[11px] text-slate-400 mt-1 leading-snug">${r.desc}</p>
                    <div class="text-[11px] font-mono text-emerald-400 font-bold mt-2 flex items-center gap-1">
                        <i class="fa-solid fa-arrow-trend-up text-[10px]"></i> Impact: ${r.impact}
                    </div>
                </div>
                <button onclick="toggleScenarioKey('${r.actionKey}')" class="px-3 py-1.5 rounded-lg text-xs font-bold shrink-0 transition ${isActive ? 'bg-emerald-600 text-white shadow-md shadow-emerald-600/30' : 'bg-slate-800 text-slate-300 hover:bg-slate-700 border border-slate-700'}">
                    ${isActive ? 'Applied ✓' : 'Apply'}
                </button>
            </div>
        `;
    }).join('');
}

function renderLedger() {
    const container = document.getElementById('ledger-container');
    if (!container) return;

    const items = [];
    state.inflows.forEach(i => items.push({ type: 'IN', name: i.source, amount: i.amount, date: i.due_date }));
    state.outflows.forEach(o => items.push({ type: 'OUT', name: o.recipient, amount: o.amount, date: o.due_date, cat: o.category }));

    items.sort((a, b) => new Date(a.date) - new Date(b.date));

    if (items.length === 0) {
        container.innerHTML = `<div class="text-slate-500 text-center py-6 italic">No transactions scheduled. Click "Add Entry" above!</div>`;
        return;
    }

    container.innerHTML = items.map(item => {
        const isIncome = item.type === 'IN';
        return `
            <div class="p-2.5 rounded-lg bg-slate-900/60 border border-slate-800/80 flex items-center justify-between">
                <div class="flex items-center gap-2.5">
                    <div class="w-6 h-6 rounded-md ${isIncome ? 'bg-emerald-500/10 text-emerald-400' : 'bg-rose-500/10 text-rose-400'} flex items-center justify-center text-[10px]">
                        <i class="fa-solid ${isIncome ? 'fa-arrow-down' : 'fa-arrow-up'}"></i>
                    </div>
                    <div>
                        <div class="font-medium text-slate-200 text-xs">${item.name}</div>
                        <div class="text-[10px] text-slate-500 font-mono">Due: ${item.date} ${item.cat ? '• ' + item.cat : ''}</div>
                    </div>
                </div>
                <div class="font-mono font-bold ${isIncome ? 'text-emerald-400' : 'text-slate-300'} text-xs">
                    ${isIncome ? '+' : '-'}${formatINR(item.amount)}
                </div>
            </div>
        `;
    }).join('');
}

// -------------------------------------------------------------
// Interactive Sandbox Controls
// -------------------------------------------------------------
function runSimulation() {
    state.scenario.earlyPay = document.getElementById('scen-early-pay').checked;
    state.scenario.deferVendor = document.getElementById('scen-defer-vendor').checked;
    state.scenario.trimCosts = document.getElementById('scen-trim-costs').checked;
    renderForecast();
}

function updateDelaySlider(val) {
    document.getElementById('delay-val').innerText = `+${val} days`;
    state.scenario.delayDays = parseInt(val, 10);
    renderForecast();
}

function toggleScenarioKey(key) {
    state.scenario[key] = !state.scenario[key];
    const checkboxMap = {
        earlyPay: 'scen-early-pay',
        deferVendor: 'scen-defer-vendor',
        trimCosts: 'scen-trim-costs'
    };
    if (checkboxMap[key]) {
        document.getElementById(checkboxMap[key]).checked = state.scenario[key];
    }
    renderForecast();
}

function applyAllOptimizations() {
    state.scenario.earlyPay = true;
    state.scenario.deferVendor = true;
    state.scenario.trimCosts = true;
    document.getElementById('scen-early-pay').checked = true;
    document.getElementById('scen-defer-vendor').checked = true;
    document.getElementById('scen-trim-costs').checked = true;
    renderForecast();
    showToast("AI Optimization levers applied!");
}

function toggleAllScenarios() {
    applyAllOptimizations();
}

// -------------------------------------------------------------
// Toast Notifications
// -------------------------------------------------------------
function showToast(msg) {
    const toast = document.getElementById('toast');
    const msgElem = document.getElementById('toast-msg');
    if (!toast || !msgElem) return;

    msgElem.innerText = msg;
    toast.classList.remove('-translate-y-16', 'opacity-0');
    toast.classList.add('translate-y-0', 'opacity-100');

    setTimeout(() => {
        toast.classList.remove('translate-y-0', 'opacity-100');
        toast.classList.add('-translate-y-16', 'opacity-0');
    }, 2800);
}

// -------------------------------------------------------------
// Modals & Storage Handlers (Add Entry & Edit Balance)
// -------------------------------------------------------------
function openTransactionModal() {
    const modal = document.getElementById('modal-transaction');
    modal.classList.remove('hidden');

    // Automatically set default date to today's date YYYY-MM-DD
    const dateInput = document.getElementById('tx-date');
    if (dateInput && !dateInput.value) {
        dateInput.value = new Date().toISOString().split('T')[0];
    }
    
    // Focus on name input
    const nameInput = document.getElementById('tx-name');
    if (nameInput) {
        nameInput.value = '';
        setTimeout(() => nameInput.focus(), 100);
    }
    const amtInput = document.getElementById('tx-amount');
    if (amtInput) amtInput.value = '';
}

function closeTransactionModal() {
    document.getElementById('modal-transaction').classList.add('hidden');
}

function setTxAmount(amt) {
    const input = document.getElementById('tx-amount');
    if (input) input.value = amt;
}

function handleCreateTransaction(e) {
    e.preventDefault();
    const typeRadio = document.querySelector('input[name="tx-type"]:checked');
    const type = typeRadio ? typeRadio.value : 'INFLOW';
    const name = document.getElementById('tx-name').value.trim();
    const amtRaw = document.getElementById('tx-amount').value;
    const amt = parseFloat(amtRaw);
    let date = document.getElementById('tx-date').value;

    if (!date) {
        date = new Date().toISOString().split('T')[0];
    }

    if (!name || isNaN(amt) || amt <= 0) {
        alert("Please enter a valid description and positive amount.");
        return;
    }

    if (type === 'INFLOW') {
        const newInflow = {
            id: `INF-${Math.random().toString(36).substring(2, 6).toUpperCase()}`,
            source: name,
            amount: amt,
            due_date: date,
            delay: 0
        };
        state.inflows.push(newInflow);
        localStorage.setItem('cashpulse_inflows_inr', JSON.stringify(state.inflows));
        showToast(`Added Income: ${name} (${formatINR(amt)})`);
    } else {
        const newOutflow = {
            id: `OUT-${Math.random().toString(36).substring(2, 6).toUpperCase()}`,
            recipient: name,
            amount: amt,
            due_date: date,
            category: "General",
            essential: true,
            can_defer: 0
        };
        state.outflows.push(newOutflow);
        localStorage.setItem('cashpulse_outflows_inr', JSON.stringify(state.outflows));
        showToast(`Added Expense: ${name} (${formatINR(amt)})`);
    }

    closeTransactionModal();
    renderForecast();
}

function openBalanceModal() {
    const modal = document.getElementById('modal-balance');
    modal.classList.remove('hidden');

    const cashInput = document.getElementById('input-current-cash');
    const bufferInput = document.getElementById('input-safety-buffer');

    if (cashInput) cashInput.value = state.currentCash;
    if (bufferInput) bufferInput.value = state.safetyBuffer;
    if (cashInput) setTimeout(() => cashInput.focus(), 100);
}

function closeBalanceModal() {
    document.getElementById('modal-balance').classList.add('hidden');
}

function setCashBalancePreset(amt) {
    const cashInput = document.getElementById('input-current-cash');
    if (cashInput) cashInput.value = amt;
}

function handleUpdateBalance(e) {
    e.preventDefault();
    const newCash = parseFloat(document.getElementById('input-current-cash').value);
    const newBuffer = parseFloat(document.getElementById('input-safety-buffer').value);

    if (isNaN(newCash) || isNaN(newBuffer) || newCash < 0 || newBuffer < 0) {
        alert("Please enter valid positive cash and buffer amounts.");
        return;
    }

    state.currentCash = newCash;
    state.safetyBuffer = newBuffer;
    localStorage.setItem('cashpulse_currentCash_inr', state.currentCash.toString());
    localStorage.setItem('cashpulse_safetyBuffer_inr', state.safetyBuffer.toString());

    closeBalanceModal();
    renderForecast();
    showToast(`Updated Balance: ${formatINR(state.currentCash)} (Buffer: ${formatINR(state.safetyBuffer)})`);
}

function resetDefaults() {
    if (!confirm("Reset to default demonstration ₹ INR scenario?")) return;
    localStorage.removeItem('cashpulse_inflows_inr');
    localStorage.removeItem('cashpulse_outflows_inr');
    localStorage.removeItem('cashpulse_currentCash_inr');
    localStorage.removeItem('cashpulse_safetyBuffer_inr');
    state.currentCash = 380000.0;
    state.safetyBuffer = 150000.0;
    state.scenario = { earlyPay: false, deferVendor: false, trimCosts: false, delayDays: 0 };
    document.getElementById('scen-early-pay').checked = false;
    document.getElementById('scen-defer-vendor').checked = false;
    document.getElementById('scen-trim-costs').checked = false;
    document.getElementById('scen-delay-slider').value = 0;
    document.getElementById('delay-val').innerText = "+0 days";
    loadLocalStore();
    renderForecast();
    showToast("Reset to default ₹ INR cash flow model!");
}
