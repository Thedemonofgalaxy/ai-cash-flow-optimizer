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
    updateModelBadge();

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

// =====================================================================
// AI Agentic War Room & CFO Co-Pilot Controller (₹ INR)
// =====================================================================

let currentAgentArtifacts = [];
let cfoChatHistory = [];

function switchWarRoomTab(tab) {
    const btnTrace = document.getElementById('tab-btn-trace');
    const btnDrafts = document.getElementById('tab-btn-drafts');
    const panelTrace = document.getElementById('warroom-panel-trace');
    const panelDrafts = document.getElementById('warroom-panel-drafts');

    if (tab === 'trace') {
        btnTrace.className = "px-3 py-1 rounded-md text-xs font-bold bg-indigo-600/20 text-indigo-400 border border-indigo-500/30";
        btnDrafts.className = "px-3 py-1 rounded-md text-xs font-semibold text-slate-400 hover:text-slate-200";
        panelTrace.classList.remove('hidden');
        panelDrafts.classList.add('hidden');
    } else {
        btnDrafts.className = "px-3 py-1 rounded-md text-xs font-bold bg-indigo-600/20 text-indigo-400 border border-indigo-500/30";
        btnTrace.className = "px-3 py-1 rounded-md text-xs font-semibold text-slate-400 hover:text-slate-200";
        panelDrafts.classList.remove('hidden');
        panelTrace.classList.add('hidden');
    }
}

// Model Configuration Modal
function openModelConfigModal() {
    const modal = document.getElementById('modal-model-config');
    if (!modal) return;
    modal.classList.remove('hidden');

    const savedProvider = localStorage.getItem('cashpulse_ai_provider') || 'local';
    const radios = document.getElementsByName('ai-provider');
    radios.forEach(r => {
        if (r.value === savedProvider) r.checked = true;
    });

    const apiKey = localStorage.getItem('cashpulse_ai_key') || '';
    const keyInput = document.getElementById('input-api-key');
    if (keyInput) keyInput.value = apiKey;
}

function closeModelConfigModal() {
    const modal = document.getElementById('modal-model-config');
    if (modal) modal.classList.add('hidden');
}

function toggleApiKeyVisibility() {
    const input = document.getElementById('input-api-key');
    const icon = document.getElementById('icon-api-eye');
    if (input.type === 'password') {
        input.type = 'text';
        icon.className = 'fa-solid fa-eye-slash';
    } else {
        input.type = 'password';
        icon.className = 'fa-solid fa-eye';
    }
}

function handleSaveModelConfig(e) {
    e.preventDefault();
    const radios = document.getElementsByName('ai-provider');
    let selectedProvider = 'local';
    radios.forEach(r => {
        if (r.checked) selectedProvider = r.value;
    });

    const key = document.getElementById('input-api-key').value.trim();
    localStorage.setItem('cashpulse_ai_provider', selectedProvider);
    if (key) {
        localStorage.setItem('cashpulse_ai_key', key);
    } else {
        localStorage.removeItem('cashpulse_ai_key');
    }

    updateModelBadge();
    closeModelConfigModal();
    showToast(`AI Model set to: ${getModelDisplayName(selectedProvider)}`);
}

function getModelDisplayName(provider) {
    if (provider === 'openai') return 'OpenAI (GPT-4o)';
    if (provider === 'gemini') return 'Google Gemini 1.5';
    return 'Local Heuristic AI';
}

function updateModelBadge() {
    const provider = localStorage.getItem('cashpulse_ai_provider') || 'local';
    const badgeName = document.getElementById('badge-model-name');
    if (badgeName) {
        badgeName.innerText = getModelDisplayName(provider);
    }
}

// Multi-Agent Autonomous Optimization
async function runAgenticOptimization() {
    const btn = document.getElementById('btn-run-agents');
    const origHtml = btn.innerHTML;
    btn.innerHTML = `<i class="fa-solid fa-circle-notch fa-spin"></i> Agents Reasoning...`;
    btn.disabled = true;

    // Visual state updates across agent cards
    setAgentStatus('auditor', 'RUNNING', 'text-amber-400');
    setAgentStatus('receivables', 'QUEUED', 'text-slate-400');
    setAgentStatus('payables', 'QUEUED', 'text-slate-400');
    setAgentStatus('cfo', 'QUEUED', 'text-slate-400');

    const provider = localStorage.getItem('cashpulse_ai_provider') || 'local';
    const apiKey = localStorage.getItem('cashpulse_ai_key') || null;

    try {
        let report = null;

        if (!state.isBrowserMode) {
            try {
                const res = await fetch('/api/agents/optimize', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        provider: provider,
                        api_key: apiKey,
                        custom_cash: state.currentCash,
                        custom_buffer: state.safetyBuffer
                    }),
                    signal: AbortSignal.timeout(6000)
                });
                if (res.ok) {
                    report = await res.json();
                }
            } catch (err) {
                console.warn("Backend optimization call failed, falling back to client agentic runtime", err);
            }
        }

        // Fallback client-side agentic runtime for GitHub Pages
        if (!report) {
            await simulateAgentProgress();
            report = runClientSideAgenticOptimization();
        } else {
            await simulateAgentProgress();
        }

        renderAgentResults(report);
        showToast(`Multi-Agent Run Complete: ${formatINR(report.total_cash_relief_inr)} Liquidity Unlocked!`);

    } catch (e) {
        console.error("Agent run failed:", e);
        showToast("Agent run encountered an issue.");
    } finally {
        btn.innerHTML = origHtml;
        btn.disabled = false;
        setAgentStatus('auditor', 'DONE', 'text-emerald-400');
        setAgentStatus('receivables', 'DONE', 'text-emerald-400');
        setAgentStatus('payables', 'DONE', 'text-emerald-400');
        setAgentStatus('cfo', 'DONE', 'text-indigo-400');
    }
}

function setAgentStatus(agent, text, colorClass) {
    const el = document.getElementById(`status-agent-${agent}`);
    if (el) {
        el.innerText = text;
        el.className = `text-[9px] font-mono px-1.5 py-0.5 rounded bg-slate-800 ${colorClass}`;
    }
}

async function simulateAgentProgress() {
    setAgentStatus('auditor', 'ACTIVE', 'text-rose-400');
    await new Promise(r => setTimeout(r, 200));
    setAgentStatus('auditor', 'DONE', 'text-emerald-400');

    setAgentStatus('receivables', 'ACTIVE', 'text-emerald-400');
    await new Promise(r => setTimeout(r, 200));
    setAgentStatus('receivables', 'DONE', 'text-emerald-400');

    setAgentStatus('payables', 'ACTIVE', 'text-amber-400');
    await new Promise(r => setTimeout(r, 200));
    setAgentStatus('payables', 'DONE', 'text-emerald-400');

    setAgentStatus('cfo', 'SYNTHESIZING', 'text-indigo-400');
    await new Promise(r => setTimeout(r, 200));
}

// Client-side agent runtime mirroring Python framework for GitHub Pages
function runClientSideAgenticOptimization() {
    const currentCash = state.currentCash;
    const buffer = state.safetyBuffer;

    // 1. Auditor logic
    const lowestBal = state.report ? state.report.projected_lowest_balance : 44000;
    const isBreach = lowestBal < buffer;
    const deficit = Math.max(0, buffer - lowestBal);

    // 2. Receivables logic (2% early discount)
    const largeInflows = state.inflows.filter(i => i.amount >= 100000);
    const accelCandidates = largeInflows.map(i => ({
        id: i.id,
        source: i.source,
        invoice_amount_inr: i.amount,
        proposed_discount_pct: 2.0,
        discount_cost_inr: Math.round(i.amount * 0.02),
        net_accelerated_cash_inr: Math.round(i.amount * 0.98),
        due_date: i.due_date
    }));
    const totalAccelerated = accelCandidates.reduce((s, c) => s + c.net_accelerated_cash_inr, 0);

    // 3. Payables logic (+14d vendor deferral & 15% trim)
    const deferrableOutflows = state.outflows.filter(o => 
        o.category !== 'Payroll' && !o.recipient.toLowerCase().includes('salary') && o.category !== 'Taxes' && o.can_defer_days > 0
    );
    const totalDeferred = deferrableOutflows.reduce((s, o) => s + o.amount, 0);

    const discretionary = state.outflows.filter(o => !o.is_essential);
    const totalTrimmed = Math.round(discretionary.reduce((s, o) => s + o.amount, 0) * 0.15);

    const totalRelief = totalAccelerated + totalDeferred + totalTrimmed;
    const improvedLowest = Math.round(lowestBal + totalDeferred + (totalAccelerated * 0.85));

    // Master actions
    const actions = [
        {
            priority: 1,
            title: "Reschedule Flexible Hardware & Vendor Bills (+14 Days)",
            impact_inr: totalDeferred,
            category: "OUTFLOW_DEFERRAL",
            summary: `Preserves ${formatINR(totalDeferred)} without impacting core team payroll.`
        },
        {
            priority: 2,
            title: "Dispatch 2% Early-Settlement Discount to Enterprise Debtors",
            impact_inr: totalAccelerated,
            category: "INFLOW_ACCELERATION",
            summary: `Accelerates ${formatINR(totalAccelerated)} in immediate customer collections.`
        },
        {
            priority: 3,
            title: "Freeze 15% Discretionary Marketing & SaaS Spend",
            impact_inr: totalTrimmed,
            category: "COST_TRIMMING",
            summary: `Conserves ${formatINR(totalTrimmed)} in auxiliary operational costs.`
        }
    ];

    // Outreach drafts
    const topDebtor = accelCandidates.length > 0 ? accelCandidates[0] : { source: "Enterprise Client", invoice_amount_inr: 285000, due_date: "15 Nov 2026" };
    const topVendor = deferrableOutflows.length > 0 ? deferrableOutflows[0] : { recipient: "Hardware & Component Supplier", amount: 155000, due_date: "12 Nov 2026" };

    const emailDraft = {
        scenario_type: "EARLY_DISCOUNT",
        recipient: topDebtor.source,
        amount_inr: topDebtor.invoice_amount_inr,
        subject: `Special Early Settlement Incentive: Invoice ${topDebtor.source} (${formatINR(topDebtor.invoice_amount_inr)})`,
        body: `Dear ${topDebtor.source} Accounts Payable Team,\n\nWe hope this email finds you well.\n\nAs part of our mid-quarter treasury optimization, we are pleased to offer an immediate 2% early settlement discount on our pending invoice of ${formatINR(topDebtor.invoice_amount_inr)}.\n\n• Original Due Date: ${topDebtor.due_date}\n• Net Payable Amount: ${formatINR(topDebtor.invoice_amount_inr * 0.98)} (Saving ${formatINR(topDebtor.invoice_amount_inr * 0.02)})\n• Valid If Remitted By: 5 Days from today via UPI / NEFT.\n\nPlease remit directly to our registered bank account to claim the rebate.\n\nWarm regards,\nFinance & Treasury Team`
    };

    const vendorDraft = {
        scenario_type: "VENDOR_DEFERRAL",
        recipient: topVendor.recipient,
        amount_inr: topVendor.amount,
        subject: `Scheduled Billing Alignment & Payment Schedule Update - ${topVendor.recipient}`,
        body: `Dear ${topVendor.recipient} Finance & Billing Team,\n\nWe greatly value our ongoing business relationship with your organization.\n\nWe are conducting our standard monthly reconciliation across vendor disbursements. In accordance with our contractual 14-day payment flexibility terms, our invoice of ${formatINR(topVendor.amount)} (originally scheduled for ${topVendor.due_date}) has been scheduled for disbursement in 14 days.\n\nAll banking and invoice parameters remain unchanged, ensuring prompt clearance.\n\nThank you for your partnership and cooperation.\n\nWarm regards,\nAccounts Payable & Operations`
    };

    // Collaborative Trace
    const trace = [
        {
            step_number: 1,
            thought: "AuditorAgent scanned 30-day cash timeline against ₹1,50,000 buffer.",
            tool_name: "analyze_liquidity_risk",
            tool_output: { lowest_balance: lowestBal, is_breached: isBreach, deficit: deficit }
        },
        {
            step_number: 2,
            thought: `ReceivablesAgent identified ${accelCandidates.length} large invoice(s) qualifying for dynamic 2% discounting.`,
            tool_name: "evaluate_early_settlement",
            tool_output: { total_accelerated: totalAccelerated, candidates: accelCandidates.length }
        },
        {
            step_number: 3,
            thought: `PayablesAgent isolated ₹${totalDeferred.toLocaleString('en-IN')} in deferrable supplier disbursements and formulated 14-day grace window.`,
            tool_name: "reschedule_vendor_bills",
            tool_output: { total_deferred: totalDeferred }
        },
        {
            step_number: 4,
            thought: "CFO Synthesizer unified all agent findings into Master Working Capital Roadmap.",
            tool_name: "synthesize_liquidity_plan",
            tool_output: { combined_relief: totalRelief, restored: improvedLowest >= buffer }
        }
    ];

    return {
        total_cash_relief_inr: totalRelief,
        original_lowest_balance_inr: lowestBal,
        optimized_lowest_balance_inr: improvedLowest,
        safety_buffer_inr: buffer,
        is_buffer_restored: improvedLowest >= buffer,
        executive_summary: `Executing this multi-agent action plan unlocks ${formatINR(totalRelief)} in combined liquidity relief, raising your projected cash floor from ${formatINR(lowestBal)} to ${formatINR(improvedLowest)} (${improvedLowest >= buffer ? 'safely restoring' : 'reinforcing'} the ${formatINR(buffer)} safety buffer).`,
        master_actions: actions,
        communication_artifacts: [emailDraft, vendorDraft],
        agent_results: [
            { agent_name: "AuditorAgent", trace: [trace[0]], summary: `Detected lowest point ${formatINR(lowestBal)}.` },
            { agent_name: "ReceivablesAgent", trace: [trace[1]], summary: `Unlocked ${formatINR(totalAccelerated)} via early settlement.` },
            { agent_name: "PayablesAgent", trace: [trace[2]], summary: `Preserved ${formatINR(totalDeferred)} via vendor rescheduling.` },
            { agent_name: "CFOAgent", trace: [trace[3]], summary: `Master roadmap compiled successfully.` }
        ]
    };
}

// Render Multi-Agent Report onto War Room UI
function renderAgentResults(report) {
    if (!report) return;

    // 1. Executive Summary & Relief Badge
    const reliefBadge = document.getElementById('master-relief-badge');
    if (reliefBadge) reliefBadge.innerText = `+${formatINR(report.total_cash_relief_inr)} Relief`;

    const summaryText = document.getElementById('agent-summary-text');
    if (summaryText) summaryText.innerText = report.executive_summary;

    // 2. Master Action Cards
    const actionsContainer = document.getElementById('master-actions-container');
    if (actionsContainer && report.master_actions) {
        actionsContainer.innerHTML = report.master_actions.map(act => `
            <div class="p-3 rounded-xl bg-slate-900 border border-slate-800 hover:border-indigo-500/40 transition flex items-center justify-between gap-3">
                <div class="flex items-start gap-2.5">
                    <span class="w-5 h-5 rounded-md bg-indigo-500/20 text-indigo-400 flex items-center justify-center font-mono font-bold text-[10px] shrink-0 mt-0.5">
                        #${act.priority}
                    </span>
                    <div>
                        <div class="font-bold text-white text-xs">${act.title}</div>
                        <div class="text-[11px] text-slate-400 mt-0.5">${act.summary}</div>
                    </div>
                </div>
                <div class="text-right shrink-0">
                    <div class="font-mono font-bold text-emerald-400 text-xs">+${formatINR(act.impact_inr)}</div>
                    <span class="text-[9px] px-1.5 py-0.2 rounded bg-slate-800 text-slate-400 font-mono">${act.category}</span>
                </div>
            </div>
        `).join('');
    }

    // 3. Execution Trace Steps
    const traceContainer = document.getElementById('agent-trace-container');
    if (traceContainer) {
        let allTraceSteps = [];
        if (report.agent_results) {
            report.agent_results.forEach(agent => {
                if (agent.trace) {
                    agent.trace.forEach(t => {
                        allTraceSteps.push({
                            agentName: agent.agent_name,
                            stepNumber: t.step_number,
                            thought: t.thought,
                            tool: t.tool_name,
                            output: t.tool_output
                        });
                    });
                }
            });
        }

        if (allTraceSteps.length > 0) {
            traceContainer.innerHTML = allTraceSteps.map(step => `
                <div class="p-2.5 rounded-lg bg-slate-900/80 border border-slate-800 text-xs space-y-1">
                    <div class="flex items-center justify-between">
                        <span class="font-bold text-indigo-300 flex items-center gap-1.5">
                            <i class="fa-solid fa-gear text-[10px] text-indigo-400"></i> ${step.agentName}
                        </span>
                        <span class="font-mono text-[9px] px-1.5 py-0.5 rounded bg-slate-800 text-emerald-400">
                            Tool: ${step.tool || 'reasoning'}
                        </span>
                    </div>
                    <p class="text-slate-300 text-[11px]">${step.thought}</p>
                </div>
            `).join('');
        }
    }

    // 4. Communication Artifacts
    currentAgentArtifacts = report.communication_artifacts || [];
    const countBadge = document.getElementById('drafts-count-badge');
    if (countBadge) countBadge.innerText = currentAgentArtifacts.length.toString();

    const draftsContainer = document.getElementById('drafts-container');
    if (draftsContainer && currentAgentArtifacts.length > 0) {
        draftsContainer.innerHTML = currentAgentArtifacts.map((art, idx) => `
            <div class="p-3.5 rounded-xl bg-slate-900 border border-slate-800 space-y-2">
                <div class="flex items-center justify-between">
                    <div class="font-bold text-white flex items-center gap-1.5">
                        <i class="fa-solid fa-paper-plane text-emerald-400 text-xs"></i>
                        <span>${art.subject}</span>
                    </div>
                    <button onclick="copyLetterToClipboard(this, ${idx})" class="px-2.5 py-1 rounded bg-slate-800 hover:bg-slate-700 text-slate-300 text-[11px] font-semibold transition flex items-center gap-1">
                        <i class="fa-solid fa-copy"></i> Copy Letter
                    </button>
                </div>
                <div class="text-[10px] text-slate-400 font-mono">Recipient: <span class="text-slate-200">${art.recipient}</span></div>
                <div class="p-2.5 rounded-lg bg-slate-950 font-mono text-[11px] text-slate-300 whitespace-pre-wrap leading-relaxed border border-slate-850 select-all">
${art.body}
                </div>
            </div>
        `).join('');
    }
}

function copyLetterToClipboard(btn, index) {
    if (!currentAgentArtifacts[index]) return;
    const letter = currentAgentArtifacts[index];
    const fullText = `Subject: ${letter.subject}\n\n${letter.body}`;

    navigator.clipboard.writeText(fullText).then(() => {
        const origHtml = btn.innerHTML;
        btn.innerHTML = `<i class="fa-solid fa-check text-emerald-400"></i> Copied!`;
        showToast("Letter copied to clipboard!");
        setTimeout(() => { btn.innerHTML = origHtml; }, 2000);
    }).catch(() => {
        showToast("Failed to copy automatically.");
    });
}

// Interactive CFO Co-Pilot Chat
async function handleCfoChatSubmit(e) {
    e.preventDefault();
    const input = document.getElementById('cfo-chat-input');
    const msg = input.value.trim();
    if (!msg) return;

    input.value = '';
    appendChatMessage('user', msg);

    const sendBtn = document.getElementById('btn-chat-send');
    sendBtn.disabled = true;

    // Show temporary typing indicator
    const typingId = appendChatTyping();

    const provider = localStorage.getItem('cashpulse_ai_provider') || 'local';
    const apiKey = localStorage.getItem('cashpulse_ai_key') || null;

    try {
        let reply = null;

        if (!state.isBrowserMode) {
            try {
                const res = await fetch('/api/agents/chat', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        message: msg,
                        provider: provider,
                        api_key: apiKey,
                        history: cfoChatHistory
                    }),
                    signal: AbortSignal.timeout(6000)
                });
                if (res.ok) {
                    const data = await res.json();
                    reply = data.reply;
                }
            } catch (err) {
                console.warn("Backend chat failed, using client-side CFO logic", err);
            }
        }

        if (!reply) {
            // Client-side intelligent CFO heuristic reasoning
            reply = generateClientSideCfoReply(msg);
        }

        removeChatTyping(typingId);
        appendChatMessage('cfo', reply);
        cfoChatHistory.push({ role: 'user', content: msg });
        cfoChatHistory.push({ role: 'assistant', content: reply });

    } catch (e) {
        removeChatTyping(typingId);
        appendChatMessage('cfo', "I apologize, but I encountered an error formulating this financial advice. Please try again.");
    } finally {
        sendBtn.disabled = false;
    }
}

function sendQuickPrompt(promptText) {
    const input = document.getElementById('cfo-chat-input');
    if (input) {
        input.value = promptText;
        document.getElementById('btn-chat-send').click();
    }
}

function appendChatMessage(sender, text) {
    const container = document.getElementById('cfo-chat-messages');
    if (!container) return;

    const isUser = sender === 'user';
    const msgDiv = document.createElement('div');
    msgDiv.className = `flex items-start gap-2.5 ${isUser ? 'flex-row-reverse' : ''}`;

    const iconHtml = isUser
        ? `<div class="w-6 h-6 rounded-md bg-emerald-500/20 text-emerald-400 flex items-center justify-center text-[10px] shrink-0 mt-0.5"><i class="fa-solid fa-user"></i></div>`
        : `<div class="w-6 h-6 rounded-md bg-indigo-500/20 text-indigo-400 flex items-center justify-center text-[10px] shrink-0 mt-0.5"><i class="fa-solid fa-user-tie"></i></div>`;

    const bubbleClass = isUser
        ? `p-2.5 rounded-lg bg-indigo-600/30 border border-indigo-500/30 text-white text-[11px] leading-relaxed max-w-[85%]`
        : `p-2.5 rounded-lg bg-slate-900 border border-slate-800 text-slate-300 text-[11px] leading-relaxed max-w-[85%] whitespace-pre-wrap`;

    msgDiv.innerHTML = `${iconHtml}<div class="${bubbleClass}">${formatChatText(text)}</div>`;
    container.appendChild(msgDiv);
    container.scrollTop = container.scrollHeight;
}

function formatChatText(text) {
    // Simple bolding and bullet formatter
    return text
        .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
        .replace(/\*(.*?)\*/g, '<em>$1</em>')
        .replace(/\n/g, '<br>');
}

function appendChatTyping() {
    const container = document.getElementById('cfo-chat-messages');
    const id = `typing-${Date.now()}`;
    const div = document.createElement('div');
    div.id = id;
    div.className = "flex items-start gap-2.5";
    div.innerHTML = `
        <div class="w-6 h-6 rounded-md bg-indigo-500/20 text-indigo-400 flex items-center justify-center text-[10px] shrink-0 mt-0.5">
            <i class="fa-solid fa-user-tie"></i>
        </div>
        <div class="p-2.5 rounded-lg bg-slate-900 border border-slate-800 text-slate-400 text-[11px] flex items-center gap-1.5">
            <i class="fa-solid fa-circle fa-beat text-[6px]"></i>
            <i class="fa-solid fa-circle fa-beat text-[6px]" style="animation-delay: 0.2s"></i>
            <i class="fa-solid fa-circle fa-beat text-[6px]" style="animation-delay: 0.4s"></i>
            <span class="text-[10px] text-slate-500 ml-1">CFO Agent analyzing ledger...</span>
        </div>
    `;
    container.appendChild(div);
    container.scrollTop = container.scrollHeight;
    return id;
}

function removeChatTyping(id) {
    const el = document.getElementById(id);
    if (el) el.remove();
}

function clearCfoChat() {
    cfoChatHistory = [];
    const container = document.getElementById('cfo-chat-messages');
    if (container) {
        container.innerHTML = `
            <div class="flex items-start gap-2.5">
                <div class="w-6 h-6 rounded-md bg-indigo-500/20 text-indigo-400 flex items-center justify-center text-[10px] shrink-0 mt-0.5">
                    <i class="fa-solid fa-user-tie"></i>
                </div>
                <div class="p-2.5 rounded-lg bg-slate-900 border border-slate-800 text-slate-300 text-[11px] leading-relaxed max-w-[85%]">
                    Hello! I am your <strong>AI CFO Co-Pilot</strong>. Ask me anything about preserving cash, runway, or upcoming payroll.
                </div>
            </div>
        `;
    }
    showToast("Chat cleared");
}

function generateClientSideCfoReply(msg) {
    const p = msg.toLowerCase();
    const cash = state.currentCash;
    const buffer = state.safetyBuffer;
    const lowest = state.report ? state.report.projected_lowest_balance : 44000;
    const runway = state.report ? state.report.runway_months : 2.4;

    if (p.includes('payroll')) {
        return `**CFO Directive on Payroll Protection (₹ INR):**\n\nCore payroll is strictly essential and should not be delayed. With current bank balance at ${formatINR(cash)}, the upcoming payroll cycle dips your cash to ${formatINR(lowest)}.\n\n**Immediate Non-Debt Strategy:**\n1. Offer a 2% discount to your top enterprise client to accelerate ~₹2,79,300 before payroll day.\n2. Exercise 14-day vendor terms on hardware & component bills (saving ₹1,55,000 during the squeeze).\n3. Temporarily freeze non-essential ad spend (+₹8,100 savings).`;
    }
    if (p.includes('accelerate') || p.includes('invoice') || p.includes('debtor') || p.includes('client')) {
        return `**CFO Receivables Acceleration Strategy (₹ INR):**\n\n1. Target the largest delayed invoice (Enterprise SaaS Contract for ₹2,85,000).\n2. Dispatch our 2/10 Net 30 early discount offer from the War Room. For a minor ₹5,700 concession, you unlock ₹2,79,300 in immediate liquidity.\n3. For smaller invoices (<₹1,00,000), send direct UPI payment links to expedite NEFT approval cycles.`;
    }
    if (p.includes('runway') || p.includes('burn') || p.includes('health') || p.includes('lowest')) {
        return `**Working Capital & Runway Briefing:**\n\n• **Current Bank Balance:** ${formatINR(cash)}\n• **Minimum Safety Buffer:** ${formatINR(buffer)}\n• **Projected 30-Day Lowest Point:** ${formatINR(lowest)}\n• **Estimated Operational Runway:** ${runway} Months\n\n**CFO Verdict:** Activating multi-agent vendor staggering and receivables discounting elevates your cash floor safely above the buffer and extends runway by ~1.2 months.`;
    }

    return `**Executive CFO Advisory (₹ INR):**\n\nBased on your ledger (${formatINR(cash)} current cash vs ${formatINR(buffer)} target buffer):\n\n1. **Vendor Rescheduling:** Shift flexible hardware and supplier payments by 14 days to bridge the low cash trough.\n2. **Inflow Incentive:** A 2% discount incentive pulls forward large enterprise collections.\n3. **Runway Defense:** Run the Multi-Agent Team in the War Room above to inspect all automated tool actions.`;
}

