# Northstar Financial Performance Report

Fictional portfolio project demonstrating HTML, CSS, JavaScript, financial data presentation, responsive layout and print styling.

**Important:** All company details and financial records are invented. This is not audited accounting information, tax advice, or a real company's financial statement. Validate calculations and accounting treatment before adapting it for real use.

## Files
- `index.html` — report structure
- `styles.css` — screen and responsive styles
- `print.css` — print/PDF styling
- `app.js` — renders KPIs, monthly chart and working-capital tables
- `data/dashboard-data.json` — dashboard data source
- `data/*.csv` — monthly financials, chart of accounts, AR, AP, balance sheet, cash flow and general ledger

## Run locally
The dashboard loads JSON using `fetch()`, so use a local server rather than opening `index.html` directly:
```bash
python -m http.server 8000
```
Then visit `http://localhost:8000`.

## Day 1 checks
1. Confirm dashboard loads without console errors.
2. Compare KPI totals with `data/monthly_financials.csv`.
3. Resize to 375px, 768px and 1440px.
4. Open print preview and inspect page breaks.
5. Record issues to improve on Days 2–3.


## Reconciliation notes (illustrative dataset)

- The monthly financial summary totals **$506,000 revenue**, **$459,006 expenses**, and **$46,994 net profit** for 2025.
- AR and AP open balances are calculated from the rows in their respective illustrative schedules and synchronized to the dashboard and balance-sheet CSV.
- The year-end balance sheet is made to balance by deriving retained earnings as the residual after the other listed assets, liabilities, and owner equity. This produces **$83,630 retained earnings**. This is a modeling assumption for the portfolio dataset, not evidence of a real retained-earnings roll-forward.
- The general ledger is a **monthly summary-level demonstration** of revenue and expense categories. It balances debits and credits and matches the monthly profit-and-loss totals, but it is not a transaction-complete ledger and does not substantiate all year-end balance-sheet or cash-flow balances.
- Cash-flow figures are illustrative and should not be treated as fully reconciled to a complete opening-to-closing cash ledger.
- All amounts, entities, customers, vendors, and records are fictional. This is a frontend/data-validation portfolio demonstration, not audited or tax-ready accounting.

