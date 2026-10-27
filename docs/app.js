
const money = (n) =>
    new Intl.NumberFormat("en-US", {
        style: "currency",
        currency: "USD",
        maximumFractionDigits: 0
    }).format(Number(n) || 0);

const fmtDate = (s) => {
    if (!s) return "â€”";

    const date = new Date(s + "T00:00:00");

    if (Number.isNaN(date.getTime())) return "â€”";

    return date.toLocaleDateString("en-US", {
        month: "short",
        day: "numeric",
        year: "2-digit"
    });
};

const SNAPSHOT_DATE = "2025-12-31";

// Calculate the total of all positive open balances.
const sumOpenBalances = (items) =>
    (Array.isArray(items) ? items : []).reduce(
        (total, item) =>
            total + Math.max(0, Number(item.open_balance) || 0),
        0
    );

// Compare annual dashboard figures against detailed open balances.
function auditOpenBalances(data) {
    const checks = [
        {
            metric: "Accounts receivable",
            dashboard: Number(data.annual.arOpen) || 0,
            calculated: sumOpenBalances(data.accountsReceivable)
        },
        {
            metric: "Accounts payable",
            dashboard: Number(data.annual.apOpen) || 0,
            calculated: sumOpenBalances(data.accountsPayable)
        }
    ].map((item) => ({
        ...item,
        difference: item.calculated - item.dashboard,
        matches: Math.abs(item.calculated - item.dashboard) < 0.01
    }));

    console.group("Financial Data Integrity Check");
    console.table(checks);
    console.info(
        checks.every((item) => item.matches)
            ? "AR/AP totals match the annual dashboard figures."
            : "AR/AP mismatch detected. Review the JSON data before changing the annual totals."
    );
    console.groupEnd();

    return checks;
}

// Render open AR/AP items, ordered by earliest due date.
function renderOpenItems(items, name) {
    const openItems = (Array.isArray(items) ? items : [])
        .filter((item) => Number(item.open_balance) > 0)
        .slice()
        .sort((a, b) =>
            String(a.due_date || "").localeCompare(
                String(b.due_date || "")
            )
        )
        ;

    if (openItems.length === 0) {
        return '<tr><td colspan="4">No open items</td></tr>';
    }

    const snapshot = new Date(SNAPSHOT_DATE + "T00:00:00");

    return openItems.map((item) => {
        const dueDate = new Date(item.due_date + "T00:00:00");

        const validDueDate = !Number.isNaN(dueDate.getTime());

        const daysOverdue = validDueDate
            ? Math.max(
                0,
                Math.floor((snapshot - dueDate) / 86400000)
            )
            : 0;

        const status = !validDueDate
            ? "Unknown"
            : daysOverdue > 0
                ? "Overdue"
                : "Open";

        return `
            <tr>
                <td>${escapeHtml(item[name] || "â€”")}</td>
                <td>${fmtDate(item.due_date)}</td>
                <td class="amount">${money(item.open_balance)}</td>
                <td>
                    <span
                        class="status ${status.toLowerCase()}"
                        title="${
                            validDueDate
                                ? `${daysOverdue} days overdue as of ${SNAPSHOT_DATE}`
                                : "Due date unavailable or invalid"
                        }"
                    >${status}</span>
                </td>
            </tr>
        `;
    }).join("");
}

// Escape text from JSON before inserting it into HTML.
function escapeHtml(value) {
    return String(value).replace(/[&<>"']/g, (character) => ({
        "&": "&amp;",
        "<": "&lt;",
        ">": "&gt;",
        '"': "&quot;",
        "'": "&#39;"
    })[character]);
}


function auditExpenseCategories(data) {
    const categories = [
        "cost_of_services",
        "payroll",
        "marketing",
        "rent",
        "software",
        "admin"
    ];

    const monthlyChecks = data.monthly.map((month) => {
        const categoryTotal = categories.reduce(
            (total, key) => total + (Number(month[key]) || 0),
            0
        );

        const reportedExpenses = Number(month.total_expenses) || 0;

        return {
            month: month.month,
            categoryTotal,
            reportedExpenses,
            difference: categoryTotal - reportedExpenses,
            matches: Math.abs(categoryTotal - reportedExpenses) < 0.01
        };
    });

    const annualCategoryTotal = categories.reduce(
        (total, key) =>
            total + data.monthly.reduce(
                (monthTotal, month) =>
                    monthTotal + (Number(month[key]) || 0),
                0
            ),
        0
    );

    const annualCheck = {
        metric: "Annual expense categories",
        categoryTotal: annualCategoryTotal,
        reportedExpenses: Number(data.annual.expenses) || 0,
        difference:
            annualCategoryTotal - (Number(data.annual.expenses) || 0),
        matches:
            Math.abs(
                annualCategoryTotal - (Number(data.annual.expenses) || 0)
            ) < 0.01
    };

    console.group("Monthly Expense Category Integrity Check");
    console.table(monthlyChecks);
    console.log("Every month matches:", monthlyChecks.every(x => x.matches));
    console.groupEnd();

    console.group("Annual Expense Category Integrity Check");
    console.table([annualCheck]);
    console.groupEnd();

    return { monthlyChecks, annualCheck };
}



function auditBalanceSheet(data) {
    const accounts = Array.isArray(data.balanceSheet)
        ? data.balanceSheet
        : [];

    const totalFor = (section) =>
        accounts
            .filter((item) => item.section === section)
            .reduce(
                (total, item) =>
                    total + (Number(item.amount) || 0),
                0
            );

    const assets = totalFor("Assets");
    const liabilities = totalFor("Liabilities");
    const equity = totalFor("Equity");

    const liabilitiesAndEquity = liabilities + equity;
    const difference = assets - liabilitiesAndEquity;

    // Display the totals in the dashboard.
    document.getElementById("totalAssets").textContent =
        money(assets);

    document.getElementById("totalLiabilities").textContent =
        money(liabilities);

    document.getElementById("totalEquity").textContent =
        money(equity);

    document.getElementById("totalLiabilitiesEquity").textContent =
        money(liabilitiesAndEquity);

    document.getElementById("balanceDifference").textContent =
        money(difference);

    const statusElement =
        document.getElementById("balanceSheetStatus");

    if (Math.abs(difference) < 0.01) {
        statusElement.textContent =
            "PASS: Total assets equal total liabilities and equity.";

        statusElement.style.color = "green";
    } else {
        statusElement.textContent =
            `WARNING: The balance sheet is out of balance by ${money(
                Math.abs(difference)
            )}. Review the underlying figures.`;

        statusElement.style.color = "crimson";
    }

    // Also retain the diagnostic output in the browser console.
    const results = [
        { metric: "Total assets", amount: assets },
        { metric: "Total liabilities", amount: liabilities },
        { metric: "Total equity", amount: equity },
        {
            metric: "Liabilities + equity",
            amount: liabilitiesAndEquity
        },
        {
            metric: "Balance sheet difference",
            amount: difference
        }
    ];

    console.group("Balance Sheet Integrity Check");
    console.table(results);
    console.groupEnd();

    return {
        assets,
        liabilities,
        equity,
        liabilitiesAndEquity,
        difference
    };
}


async function init() {
    // 1. Fetch the data
    const response = await fetch("dashboard-data.json");

    if (!response.ok) {
        throw new Error(`Could not load dashboard data: HTTP ${response.status}`);
    }

    const d = await response.json();

    // 2. Run Audits safely (so they don't crash the page if an ID is missing)
    try {
        auditOpenBalances(d);
        auditBalanceSheet(d);
        auditAnnualTotals(d);
        auditExpenseCategories(d);
    } catch (error) {
        console.warn("A background audit failed, but continuing to render data:", error);
    }

    if (!d.annual || !Array.isArray(d.monthly)) {
        throw new Error("dashboard-data.json is missing the annual or monthly data.");
    }

    // 3. Render KPI cards.
    document.getElementById("revenueKpi").textContent = money(d.annual.revenue);
    document.getElementById("expensesKpi").textContent = money(d.annual.expenses);
    document.getElementById("profitKpi").textContent = money(d.annual.profit);
    document.getElementById("marginKpi").textContent = `${Number(d.annual.margin) || 0}%`;
    document.getElementById("arKpi").textContent = money(d.annual.arOpen);
    document.getElementById("apKpi").textContent = money(d.annual.apOpen);

    // 4. Render the monthly revenue and expense chart.
    const max = Math.max(
        1,
        ...d.monthly.map((item) =>
            Math.max(Number(item.revenue) || 0, Number(item.total_expenses) || 0)
        )
    );

    document.getElementById("revenueChart").innerHTML = d.monthly.map((item) => {
        const revenue = Number(item.revenue) || 0;
        const expenses = Number(item.total_expenses) || 0;

        return `
            <div class="bar-group" title="${escapeHtml(item.month)}: revenue ${money(revenue)}, expenses ${money(expenses)}">
                <div class="bars">
                    <div class="bar rev" style="height:${revenue / max * 100}%"></div>
                    <div class="bar exp" style="height:${expenses / max * 100}%"></div>
                </div>
                <span class="month-label">${escapeHtml(item.month || "")}</span>
            </div>
        `;
    }).join("");

    // 5. Render monthly financial details beneath the chart.
    const monthlyDetailsTable = document.getElementById("monthlyDetailsTable");
    if (monthlyDetailsTable) {
        monthlyDetailsTable.innerHTML = d.monthly.map((item) => {
            const monthRevenue = Number(item.revenue) || 0;
            const monthExpenses = Number(item.total_expenses) || 0;
            const monthProfit = monthRevenue - monthExpenses;

            return `
                <tr>
                    <td>${escapeHtml(item.month || "")}</td>
                    <td>${money(monthRevenue)}</td>
                    <td>${money(monthExpenses)}</td>
                    <td class="${monthProfit < 0 ? "negative" : "positive"}">${money(monthProfit)}</td>
                </tr>
            `;
        }).join("");
    }

    // 6. Calculate annual P&L line items from monthly data.
    const sumMonthly = (key) =>
        d.monthly.reduce((total, item) => total + (Number(item[key]) || 0), 0);

    const revenue = Number(d.annual.revenue) || 0;

    const rows = [
        ["Service revenue", revenue],
        ["Cost of services", sumMonthly("cost_of_services")],
        ["Payroll expense", sumMonthly("payroll")],
        ["Marketing expense", sumMonthly("marketing")],
        ["Office rent", sumMonthly("rent")],
        ["Software & subscriptions", sumMonthly("software")],
        ["General & administrative", sumMonthly("admin")],
        ["Total expenses", Number(d.annual.expenses) || 0],
        ["Net operating profit", Number(d.annual.profit) || 0]
    ].map((row) => [
        row[0],
        row[1],
        revenue > 0 ? (row[1] / revenue) * 100 : 0
    ]);

    // 7. Render the P&L table, including percentages of revenue.
    document.getElementById("pnlTable").innerHTML = rows.map((row, index) => `
        <tr class="${index === 7 || index === 8 ? "total-row" : ""}">
            <td>${escapeHtml(row[0])}</td>
            <td class="amount">${money(row[1])}</td>
            <td>${row[2].toFixed(1)}%</td>
        </tr>
    `).join("");

    // 8. Render the AR and AP tables.
    document.getElementById("arTable").innerHTML = renderOpenItems(d.accountsReceivable, "customer");
    document.getElementById("apTable").innerHTML = renderOpenItems(d.accountsPayable, "supplier");

    // 9. Display the reporting snapshot date, if the element exists.
    const snapshotElement = document.getElementById("snapshotDate");
    if (snapshotElement) {
        snapshotElement.textContent = "As of December 31, 2025";
    }
}

init().catch((error) => {
    console.error("Could not initialize the financial dashboard.", error);
});
