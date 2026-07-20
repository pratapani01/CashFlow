# 💰 CashFlow Dashboard

A personal cash flow tracker built with **vanilla HTML, CSS, and JavaScript** — no frameworks, no backend. Track your monthly salary history, log expenses, visualize your spending, and export a professional PDF report, all stored locally in your browser.

---

## ✨ Features

- **Personalized welcome** — enter your name once (saved in LocalStorage), with a time-based greeting (Good Morning / Afternoon / Evening / Night)
- **Live date & clock** in the navbar
- **Dark / Light theme** with a sun–moon toggle switch, preference remembered across visits
- **Monthly Salary History** — every salary entry is recorded separately (not overwritten), auto-tagged with the current month/year, and individually deletable
- **Expense tracking** — add, search, and delete expenses
- **Automatic totals** — Total Salary, Total Expenses, and Remaining Balance, recalculated live
- **Low balance alert** when your remaining balance drops too low
- **Chart.js pie chart** — visual breakdown of Expenses vs. Remaining Balance
- **Multi-currency display** — switch between INR / USD / EUR / GBP from the navbar (live exchange rates, with safe offline fallback)
- **PDF report export** — invoice-style report with your logo, salary history table, expense table, and summary, generated via jsPDF + AutoTable
- **Financial tips** — a rotating tip on each visit
- **Toast notifications** for key actions
- **Responsive design** with animated cards and hover effects
- **Clear All Data** option to reset everything

---

## 🛠 Tech Stack

| Purpose            | Library                                                                 |
|---------------------|--------------------------------------------------------------------------|
| Charts              | [Chart.js](https://www.chartjs.org/)                                    |
| PDF generation      | [jsPDF](https://github.com/parallax/jsPDF) + [jsPDF-AutoTable](https://github.com/simonbengtsson/jsPDF-AutoTable) |
| Currency rates      | [Frankfurter API](https://www.frankfurter.app/) (with offline fallback rates) |
| Storage             | Browser `localStorage` (no backend/database) |

No build tools, no npm install required — pure static files.

---

## 📁 Project Structure

```
CashFlow/
├── index.html      # Markup and page structure
├── style.css       # Styling, theming, animations, responsive layout
├── script.js       # All app logic (state, rendering, PDF, chart, storage)
├── README.md        # This file
└── assets/
    ├── logo.png     # Logo shown in the navbar and embedded in the PDF report
    └── logo.ico     # Browser tab favicon
```

---

## 🚀 Getting Started

1. Make sure `logo.png` and `logo.ico` are placed inside the `assets/` folder.
2. Open `index.html` directly in a browser, **or** serve the folder with a local dev server for the best experience (e.g. the VS Code "Live Server" extension):
   ```
   Right-click index.html → "Open with Live Server"
   ```
   A local server is recommended because logo embedding in the PDF and some currency fetches work more reliably over `http://` than `file://`.
3. Enter your name on the welcome screen and start adding your salary and expenses.

No installation, no dependencies to manage — everything loads from CDNs (Chart.js, jsPDF, jsPDF-AutoTable) at runtime.

---

## 💾 Data & Privacy

All data (name, salary history, expenses, theme preference) is stored **only in your browser's LocalStorage**. Nothing is sent to a server. Clearing your browser data or using "Clear All Data" in the app will permanently remove it.

---

## 💱 Currency Conversion

Currency conversion uses live rates from the Frankfurter API. If the API is unreachable (e.g. no internet, or opened via `file://`), the app automatically falls back to approximate built-in rates so amounts always display correctly instead of showing `NaN`.

---

## 📄 PDF Report

Clicking **Download Report** generates a structured, invoice-style PDF including:
- Your logo and name
- Generated date/time
- Full salary history table with total
- Full expense table with total
- Remaining balance summary

Amounts are shown using currency codes (e.g. `INR 30,000.00`) rather than currency symbols, since PDF fonts don't reliably render symbols like ₹.

---

## 📌 Notes

- Built entirely in vanilla JS — easy to read, modify, and extend.
- No backend means it's fully portable: copy the folder anywhere and it works.
