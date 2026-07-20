/* =========================================================
   CashFlow Dashboard - script.js
   Vanilla JS. No frameworks, no backend.
========================================================= */

/* ---------------------
   DOM References
--------------------- */

const welcomeModal   = document.getElementById("welcomeModal");
const userNameInput  = document.getElementById("userNameInput");
const saveNameBtn    = document.getElementById("saveNameBtn");
const avatar         = document.getElementById("avatar");
const profileName    = document.getElementById("profileName");
const greeting       = document.getElementById("greeting");
const currentDateEl  = document.getElementById("currentDate");
const themeBtn       = document.getElementById("themeBtn");
const searchInput    = document.getElementById("search");
const downloadPdfBtn = document.getElementById("downloadPdf");
const currencySelect = document.getElementById("currency");
const liveClock      = document.getElementById("liveClock");
const financialTip   = document.getElementById("financialTip");
const clearDataBtn   = document.getElementById("clearData");
const expenseCountEl = document.getElementById("expenseCount");

const salaryForm      = document.getElementById("salaryForm");
const salaryAmountIn  = document.getElementById("salaryAmount");
const salaryError     = document.getElementById("salaryError");
const currentMonthLabelEl = document.getElementById("currentMonthLabel");
const salaryHistoryList   = document.getElementById("salaryHistoryList");
const salaryEmptyState    = document.getElementById("salaryEmptyState");

const expenseForm       = document.getElementById("expenseForm");
const expenseNameInput  = document.getElementById("expenseName");
const expenseAmountInput = document.getElementById("expenseAmount");
const expenseError      = document.getElementById("expenseError");
const expenseList       = document.getElementById("expenseList");
const expenseEmptyState = document.getElementById("expenseEmptyState");

const salaryDisplay  = document.getElementById("salaryDisplay");
const expenseDisplay = document.getElementById("expenseDisplay");
const balanceDisplay = document.getElementById("balanceDisplay");
const warning        = document.getElementById("warning");
const chartEmptyState = document.getElementById("chartEmptyState");

/* ---------------------
   State
--------------------- */

// Approximate fallback rates (used until/unless the live API responds).
// This prevents "NaN" from showing if the network request fails or is
// still in flight when the user switches currency.
let exchangeRates = {
    INR: 1,
    USD: 0.012,
    EUR: 0.011,
    GBP: 0.0095
};
let currentCurrency = "INR";
let chart;
let userName = localStorage.getItem("userName");

let salaryHistory = loadSalaryHistory();
let expenses = JSON.parse(localStorage.getItem("expenses")) || [];

/* =========================================================
   Welcome / Name
========================================================= */

if (userName) {
    welcomeModal.classList.add("hidden");
    showGreeting();
} else {
    welcomeModal.classList.remove("hidden");
}

saveNameBtn.addEventListener("click", () => {
    const name = userNameInput.value.trim();

    if (name === "") {
        alert("Please enter your name");
        return;
    }

    localStorage.setItem("userName", name);
    userName = name;
    welcomeModal.classList.add("hidden");
    showGreeting();
});

function showGreeting() {
    const hour = new Date().getHours();
    let text = "";

    if (hour < 12) text = "🌞 Good Morning";
    else if (hour < 17) text = "☀ Good Afternoon";
    else if (hour < 21) text = "🌇 Good Evening";
    else text = "🌙 Good Night";

    greeting.innerText = `${text} ❤️`;
    avatar.innerText = userName.charAt(0).toUpperCase();
    profileName.innerText = userName;
}

/* =========================================================
   Date / Clock
========================================================= */

function showDate() {
    const today = new Date();
    currentDateEl.innerText = today.toLocaleDateString("en-IN", {
        weekday: "long",
        day: "numeric",
        month: "long",
        year: "numeric"
    });
}

function updateClock() {
    liveClock.innerText = new Date().toLocaleTimeString("en-IN");
}

showDate();
updateClock();
setInterval(updateClock, 1000);

/* =========================================================
   Theme
========================================================= */

const savedTheme = localStorage.getItem("theme");

if (savedTheme === "dark") {
    document.body.classList.add("dark");
    themeBtn.setAttribute("aria-pressed", "true");
}

themeBtn.addEventListener("click", () => {
    document.body.classList.toggle("dark");

    const isDark = document.body.classList.contains("dark");

    localStorage.setItem("theme", isDark ? "dark" : "light");
    themeBtn.setAttribute("aria-pressed", String(isDark));
});

/* =========================================================
   Salary History
   ---------------------------------------------------------
   Each entry: { id, amount, month, year, label, timestamp }
   Total Salary = sum of all entries.
   Balance = Total Salary - Total Expenses.
========================================================= */

function loadSalaryHistory() {
    const stored = JSON.parse(localStorage.getItem("salaryHistory")) || [];

    // One-time migration from the old single "salary" value, if present.
    const legacySalary = Number(localStorage.getItem("salary"));

    if (legacySalary > 0 && stored.length === 0) {
        const now = new Date();

        stored.push({
            id: Date.now(),
            amount: legacySalary,
            month: now.getMonth(),
            year: now.getFullYear(),
            label: getMonthLabel(now),
            timestamp: now.getTime()
        });

        localStorage.setItem("salaryHistory", JSON.stringify(stored));
    }

    localStorage.removeItem("salary");

    return stored;
}

function getMonthLabel(date) {
    return date.toLocaleDateString("en-US", {
        month: "long",
        year: "numeric"
    });
}

function saveSalaryHistory() {
    localStorage.setItem("salaryHistory", JSON.stringify(salaryHistory));
}

function addSalaryEntry(amount) {
    const now = new Date();

    salaryHistory.push({
        id: Date.now(),
        amount,
        month: now.getMonth(),
        year: now.getFullYear(),
        label: getMonthLabel(now),
        timestamp: now.getTime()
    });

    saveSalaryHistory();
}

function deleteSalaryEntry(id) {
    const ok = confirm("Delete this salary entry?");
    if (!ok) return;

    salaryHistory = salaryHistory.filter(entry => entry.id !== id);
    saveSalaryHistory();
    render();
    showToast("Salary Entry Deleted");
}

function getTotalSalary() {
    return salaryHistory.reduce((sum, entry) => sum + entry.amount, 0);
}

function renderSalaryHistory() {
    const rate = exchangeRates[currentCurrency];

    salaryHistoryList.innerHTML = "";

    const sorted = [...salaryHistory].sort((a, b) => b.timestamp - a.timestamp);

    sorted.forEach(entry => {
        const li = document.createElement("li");

        li.innerHTML = `
            <span>
                <span class="salary-month">${escapeHtml(entry.label)}</span>
                <span class="salary-amount">${currentCurrency} ${(entry.amount * rate).toFixed(2)}</span>
            </span>
            <button type="button" data-id="${entry.id}" class="delete-salary-btn" aria-label="Delete salary entry for ${escapeHtml(entry.label)}">
                🗑 Delete
            </button>
        `;

        salaryHistoryList.appendChild(li);
    });

    salaryEmptyState.classList.toggle("hidden", salaryHistory.length > 0);
}

salaryHistoryList.addEventListener("click", (e) => {
    const btn = e.target.closest(".delete-salary-btn");
    if (!btn) return;
    deleteSalaryEntry(Number(btn.dataset.id));
});

function updateCurrentMonthLabel() {
    currentMonthLabelEl.innerText = `This entry will be recorded for ${getMonthLabel(new Date())}`;
}

updateCurrentMonthLabel();

salaryForm.addEventListener("submit", (e) => {
    e.preventDefault();

    const amount = Number(salaryAmountIn.value);

    if (!salaryAmountIn.value || amount <= 0) {
        salaryError.innerText = "Please enter a valid salary amount.";
        return;
    }

    salaryError.innerText = "";

    addSalaryEntry(amount);
    salaryForm.reset();
    render();
    showToast("Salary Added Successfully");
});

/* =========================================================
   Expenses
========================================================= */

function saveExpenses() {
    localStorage.setItem("expenses", JSON.stringify(expenses));
}

function getTotalExpense() {
    return expenses.reduce((sum, item) => sum + item.amount, 0);
}

function renderExpenses() {
    const rate = exchangeRates[currentCurrency];
    const searchText = searchInput.value.toLowerCase();

    expenseList.innerHTML = "";

    const filtered = expenses.filter(expense =>
        expense.name.toLowerCase().includes(searchText)
    );

    filtered.forEach(expense => {
        const li = document.createElement("li");

        li.innerHTML = `
            <span>
                <strong>${escapeHtml(expense.name)}</strong><br>
                ${currentCurrency} ${(expense.amount * rate).toFixed(2)}
            </span>
            <button type="button" data-id="${expense.id}" class="delete-expense-btn" aria-label="Delete expense ${escapeHtml(expense.name)}">
                🗑 Delete
            </button>
        `;

        expenseList.appendChild(li);
    });

    expenseCountEl.innerText = `Total Expenses : ${expenses.length}`;
    expenseEmptyState.classList.toggle("hidden", expenses.length > 0);
}

expenseList.addEventListener("click", (e) => {
    const btn = e.target.closest(".delete-expense-btn");
    if (!btn) return;
    deleteExpense(Number(btn.dataset.id));
});

function deleteExpense(id) {
    const ok = confirm("Delete this expense?");
    if (!ok) return;

    expenses = expenses.filter(item => item.id !== id);
    saveExpenses();
    render();
    showToast("Expense Deleted");
}

expenseForm.addEventListener("submit", (e) => {
    e.preventDefault();

    const expenseName = expenseNameInput.value.trim();
    const expenseAmount = Number(expenseAmountInput.value);

    if (expenseName === "" || !expenseAmountInput.value || expenseAmount <= 0) {
        expenseError.innerText = "Please enter a valid expense name and amount.";
        return;
    }

    expenseError.innerText = "";

    expenses.push({
        id: Date.now(),
        name: expenseName,
        amount: expenseAmount
    });

    saveExpenses();
    expenseForm.reset();
    render();
    showToast("Expense Added Successfully");
});

searchInput.addEventListener("input", renderExpenses);

/* =========================================================
   Summary + Chart
========================================================= */

function renderSummary() {
    const rate = exchangeRates[currentCurrency];

    const totalSalary = getTotalSalary();
    const totalExpense = getTotalExpense();
    const balance = totalSalary - totalExpense;

    salaryDisplay.innerText = currentCurrency + " " + (totalSalary * rate).toFixed(2);
    expenseDisplay.innerText = currentCurrency + " " + (totalExpense * rate).toFixed(2);
    balanceDisplay.innerText = currentCurrency + " " + (balance * rate).toFixed(2);

    if (totalSalary > 0 && balance <= totalSalary * 0.10) {
        warning.innerText = "⚠ Low Balance Alert";
        balanceDisplay.classList.add("low-balance");
    } else {
        warning.innerText = "";
        balanceDisplay.classList.remove("low-balance");
    }

    updateChart(totalExpense, balance, totalSalary);
}

function updateChart(totalExpense, balance, totalSalary) {
    const ctx = document.getElementById("expenseChart").getContext("2d");

    if (totalSalary === 0 && totalExpense === 0) {
        if (chart) {
            chart.destroy();
            chart = null;
        }
        chartEmptyState.classList.remove("hidden");
        return;
    }

    chartEmptyState.classList.add("hidden");

    if (chart) {
        chart.destroy();
    }

    chart = new Chart(ctx, {
        type: "pie",
        data: {
            labels: ["Total Expenses", "Remaining Balance"],
            datasets: [
                {
                    data: [totalExpense, balance < 0 ? 0 : balance],
                    backgroundColor: ["#dc2626", "#2563eb"]
                }
            ]
        },
        options: {
            plugins: {
                tooltip: {
                    callbacks: {
                        label: (context) => `${context.label}: ${currentCurrency} ${context.raw.toFixed(2)}`
                    }
                }
            }
        }
    });
}

/* =========================================================
   Master render
========================================================= */

function render() {
    renderSalaryHistory();
    renderExpenses();
    renderSummary();
}

render();

/* =========================================================
   Currency Conversion
========================================================= */

async function loadRates() {
    currencySelect.disabled = true;

    try {
        const response = await fetch("https://api.frankfurter.app/latest?from=INR");
        const data = await response.json();

        if (data && data.rates && data.rates.USD && data.rates.EUR && data.rates.GBP) {
            exchangeRates = {
                INR: 1,
                USD: data.rates.USD,
                EUR: data.rates.EUR,
                GBP: data.rates.GBP
            };
        } else {
            throw new Error("Unexpected rates response");
        }
    } catch {
        console.log("Currency API failed. Using approximate fallback rates.");
    } finally {
        currencySelect.disabled = false;
        render();
    }
}

loadRates();

currencySelect.addEventListener("change", () => {
    currentCurrency = currencySelect.value;
    render();
});

/* =========================================================
   PDF Report
   ---------------------------------------------------------
   jsPDF's built-in fonts (Helvetica/Times/Courier) do not
   contain a glyph for "₹", which is why it used to render
   as garbled text (e.g. "¹0.00"). To avoid that entirely,
   amounts use ISO currency codes ("INR 1,234.00") instead
   of symbols -- this stays correct for every currency the
   dashboard supports (INR/USD/EUR/GBP).
========================================================= */

const BRAND_BLUE = [37, 99, 235];
const BRAND_RED  = [220, 38, 38];
const LOGO_PATH  = "assets/logo.png";

// Try to load the brand logo as a data URL for embedding in the PDF.
// Resolves to null (never rejects) if the image is missing or the
// canvas read-back is blocked, so PDF generation always continues.
function loadLogoForPdf() {
    return new Promise((resolve) => {
        const img = new Image();

        img.onload = () => {
            try {
                const canvas = document.createElement("canvas");
                canvas.width = img.naturalWidth;
                canvas.height = img.naturalHeight;
                canvas.getContext("2d").drawImage(img, 0, 0);

                resolve({
                    dataUrl: canvas.toDataURL("image/png"),
                    width: img.naturalWidth,
                    height: img.naturalHeight
                });
            } catch {
                resolve(null);
            }
        };

        img.onerror = () => resolve(null);
        img.src = LOGO_PATH;
    });
}

function formatPdfAmount(amount, currency, rate) {
    return currency + " " + (amount * rate).toLocaleString("en-US", {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2
    });
}

// Lightweight fallback table renderer, used only if the AutoTable CDN
// script failed to load (e.g. no internet access). Keeps the report
// generator working even without the plugin, just without styling.
function drawSimpleTable(doc, startY, head, rows, margin, pageWidth) {
    let y = startY;
    const pageHeight = doc.internal.pageSize.getHeight();
    const col2X = pageWidth - margin;

    doc.setFont("helvetica", "bold");
    doc.setFontSize(10);
    doc.text(head[0], margin, y);
    doc.text(head[1], col2X, y, { align: "right" });
    y += 6;
    doc.setDrawColor(225, 225, 225);
    doc.line(margin, y - 3, pageWidth - margin, y - 3);

    doc.setFont("helvetica", "normal");

    rows.forEach(([label, value]) => {
        if (y > pageHeight - 25) {
            doc.addPage();
            y = 20;
        }
        doc.text(String(label), margin, y);
        doc.text(String(value), col2X, y, { align: "right" });
        y += 7;
    });

    doc.lastAutoTable = { finalY: y };
}

downloadPdfBtn.addEventListener("click", async () => {
    try {
        await generateCashFlowPdf();
        showToast("Report Downloaded");
    } catch (err) {
        console.error("PDF generation failed:", err);
        showToast("Could not generate report. Please try again.", "error");
    }
});

async function generateCashFlowPdf() {
    const { jsPDF } = window.jspdf;
    const doc = new jsPDF();
    const hasAutoTable = typeof doc.autoTable === "function";

    const pageWidth = doc.internal.pageSize.getWidth();
    const pageHeight = doc.internal.pageSize.getHeight();
    const margin = 15;

    const rate = exchangeRates[currentCurrency];
    const totalSalary = getTotalSalary();
    const totalExpense = getTotalExpense();
    const balance = totalSalary - totalExpense;

    const fmt = (amount) => formatPdfAmount(amount, currentCurrency, rate);

    /* ---- Header band ---- */

    doc.setFillColor(...BRAND_BLUE);
    doc.rect(0, 0, pageWidth, 32, "F");

    const logo = await loadLogoForPdf();

    if (logo) {
        const logoHeight = 18;
        const logoWidth = (logo.width / logo.height) * logoHeight;
        doc.addImage(logo.dataUrl, "PNG", margin, 7, logoWidth, logoHeight);
    } else {
        doc.setFillColor(255, 255, 255);
        doc.circle(margin + 9, 16, 9, "F");
        doc.setTextColor(...BRAND_BLUE);
        doc.setFont("helvetica", "bold");
        doc.setFontSize(11);
        doc.text("CF", margin + 9, 19, { align: "center" });
    }

    doc.setTextColor(255, 255, 255);
    doc.setFont("helvetica", "bold");
    doc.setFontSize(18);
    doc.text("CashFlow", margin + 26, 20);

    doc.setFont("helvetica", "normal");
    doc.setFontSize(11);
    doc.text("Cash Flow Report", pageWidth - margin, 20, { align: "right" });

    /* ---- Meta info ---- */

    let y = 44;

    doc.setFont("helvetica", "bold");
    doc.setFontSize(10);
    doc.setTextColor(90, 90, 90);
    doc.text("PREPARED FOR", margin, y);
    doc.text("GENERATED ON", pageWidth / 2, y);

    doc.setFont("helvetica", "normal");
    doc.setFontSize(11);
    doc.setTextColor(30, 30, 30);
    doc.text(userName || "-", margin, y + 6);
    doc.text(new Date().toLocaleString(), pageWidth / 2, y + 6);

    y += 16;
    doc.setDrawColor(225, 225, 225);
    doc.line(margin, y, pageWidth - margin, y);
    y += 10;

    /* ---- Salary History table ---- */

    doc.setFont("helvetica", "bold");
    doc.setFontSize(13);
    doc.setTextColor(...BRAND_BLUE);
    doc.text("Salary History", margin, y);
    y += 5;

    const salaryRows = salaryHistory.length
        ? [...salaryHistory]
            .sort((a, b) => a.timestamp - b.timestamp)
            .map(entry => [entry.label, fmt(entry.amount)])
        : [["--", "No salary entries recorded."]];

    if (hasAutoTable) {
        doc.autoTable({
            startY: y,
            head: [["Month", "Amount"]],
            body: salaryRows,
            margin: { left: margin, right: margin },
            theme: "striped",
            headStyles: { fillColor: BRAND_BLUE, textColor: 255, fontStyle: "bold" },
            styles: { fontSize: 10, cellPadding: 4 },
            columnStyles: { 1: { halign: "right" } }
        });
    } else {
        drawSimpleTable(doc, y, ["Month", "Amount"], salaryRows, margin, pageWidth);
    }

    y = doc.lastAutoTable.finalY + 8;
    doc.setFont("helvetica", "bold");
    doc.setFontSize(11);
    doc.setTextColor(30, 30, 30);
    doc.text("Total Salary: " + fmt(totalSalary), pageWidth - margin, y, { align: "right" });

    y += 14;

    /* ---- Expenses table ---- */

    if (y > pageHeight - 60) {
        doc.addPage();
        y = 20;
    }

    doc.setFont("helvetica", "bold");
    doc.setFontSize(13);
    doc.setTextColor(...BRAND_BLUE);
    doc.text("Expenses", margin, y);
    y += 5;

    const expenseRows = expenses.length
        ? expenses.map(item => [item.name, fmt(item.amount)])
        : [["--", "No expenses recorded."]];

    if (hasAutoTable) {
        doc.autoTable({
            startY: y,
            head: [["Expense", "Amount"]],
            body: expenseRows,
            margin: { left: margin, right: margin },
            theme: "striped",
            headStyles: { fillColor: BRAND_RED, textColor: 255, fontStyle: "bold" },
            styles: { fontSize: 10, cellPadding: 4 },
            columnStyles: { 1: { halign: "right" } }
        });
    } else {
        drawSimpleTable(doc, y, ["Expense", "Amount"], expenseRows, margin, pageWidth);
    }

    y = doc.lastAutoTable.finalY + 8;
    doc.setFont("helvetica", "bold");
    doc.setFontSize(11);
    doc.setTextColor(30, 30, 30);
    doc.text("Total Expenses: " + fmt(totalExpense), pageWidth - margin, y, { align: "right" });

    y += 16;

    /* ---- Summary box ---- */

    const boxHeight = 26;

    if (y + boxHeight > pageHeight - 20) {
        doc.addPage();
        y = 20;
    }

    doc.setFillColor(238, 244, 255);
    doc.roundedRect(margin, y, pageWidth - margin * 2, boxHeight, 3, 3, "F");

    doc.setFont("helvetica", "normal");
    doc.setFontSize(12);
    doc.setTextColor(60, 60, 60);
    doc.text("Remaining Balance", margin + 8, y + 11);

    const balanceColor = balance < 0 ? BRAND_RED : BRAND_BLUE;
    doc.setFont("helvetica", "bold");
    doc.setFontSize(16);
    doc.setTextColor(...balanceColor);
    doc.text(fmt(balance), pageWidth - margin - 8, y + 18, { align: "right" });

    /* ---- Footer (every page) ---- */

    const pageCount = doc.internal.getNumberOfPages();

    for (let i = 1; i <= pageCount; i++) {
        doc.setPage(i);
        const footerY = pageHeight - 12;

        doc.setDrawColor(230, 230, 230);
        doc.line(margin, footerY - 6, pageWidth - margin, footerY - 6);

        doc.setFont("helvetica", "normal");
        doc.setFontSize(8);
        doc.setTextColor(150, 150, 150);
        doc.text("Generated by CashFlow", margin, footerY);
        doc.text(`Page ${i} of ${pageCount}`, pageWidth - margin, footerY, { align: "right" });
    }

    doc.save("CashFlow_Report.pdf");
}

/* =========================================================
   Financial Tips
========================================================= */

const tips = [
    "Save at least 20% of your salary every month.",
    "Track every expense, even the small ones.",
    "Avoid unnecessary online shopping.",
    "Create an emergency fund.",
    "Invest regularly for long-term growth.",
    "Pay bills before spending on entertainment.",
    "Review your monthly expenses every weekend.",
    "Don't spend more than you earn.",
    "Separate needs from wants.",
    "Always keep a monthly budget."
];

function loadRandomTip() {
    const random = Math.floor(Math.random() * tips.length);
    financialTip.innerText = tips[random];
}

loadRandomTip();

/* =========================================================
   Clear All Data
========================================================= */

clearDataBtn.addEventListener("click", () => {
    const ok = confirm("Delete all data? This cannot be undone.");
    if (!ok) return;

    localStorage.removeItem("salaryHistory");
    localStorage.removeItem("expenses");

    salaryHistory = [];
    expenses = [];

    render();
    showToast("All Data Cleared");
});

/* =========================================================
   Toast Notifications
========================================================= */

function showToast(message, type = "success") {
    const toast = document.createElement("div");

    toast.className = "toast" + (type === "error" ? " error" : "");
    toast.innerText = message;

    document.body.appendChild(toast);

    setTimeout(() => {
        toast.remove();
    }, 2000);
}

/* =========================================================
   Utilities
========================================================= */

function escapeHtml(str) {
    const div = document.createElement("div");
    div.innerText = str;
    return div.innerHTML;
}
