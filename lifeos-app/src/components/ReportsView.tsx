"use client";

import { useMemo, useState } from "react";
import * as ds from "@/lib/data-service";
import { formatCurrency, formatDate, getToday } from "@/lib/utils";
import DateRangeFilter from "@/components/DateRangeFilter";
import { daysInclusive, dateRangeKey, getDateRange, type DateRangePeriod } from "@/lib/date-range";

type Tab = "Overview" | "Activity & trends" | "Goals & progress" | "Life areas" | "Insights" | "History";
type Activity = { id: string; date: string; module: string; activity: string; description: string; status: string; amount?: number };

const tabs: Tab[] = ["Overview", "Activity & trends", "Goals & progress", "Life areas", "Insights", "History"];
const modules = ["Finance", "Goals", "Productivity", "Learning", "Career", "Travel", "Shopping", "Calendar"];

function addDays(date: Date, days: number) { const copy = new Date(date); copy.setDate(copy.getDate() + days); return copy; }

function previousRange(start: Date, end: Date) {
  const length = daysInclusive(start, end);
  return { start: addDays(start, -length), end: addDays(start, -1) };
}

function escapeCsv(value: string | number | null | undefined) {
  return `"${String(value ?? "").replace(/\r?\n/g, " ").replace(/"/g, '""')}"`;
}

function downloadCsv(rows: Array<Array<string | number | null | undefined>>) {
  const csv = rows.map(row => row.map(escapeCsv).join(",")).join("\n");
  const url = URL.createObjectURL(new Blob([csv], { type: "text/csv;charset=utf-8;" }));
  const link = document.createElement("a");
  link.href = url; link.download = "lifeos-report.csv"; document.body.appendChild(link); link.click(); link.remove(); URL.revokeObjectURL(url);
}

function Empty({ children }: { children: string }) { return <p className="data-empty">{children}</p>; }
function inRange(date: string, start: Date, end: Date) { const key = date.slice(0, 10); return key >= dateRangeKey(start) && key <= dateRangeKey(end); }
function percentChange(current: number, previous: number) {
  if (!previous) return null;
  return Math.round(((current - previous) / previous) * 100);
}
function smoothPath(points: Array<{ x: number; y: number }>) {
  if (!points.length) return "";
  if (points.length === 1) return `M${points[0].x},${points[0].y}`;
  let path = `M${points[0].x},${points[0].y}`;
  for (let index = 1; index < points.length; index++) {
    const previous = points[index - 1]; const point = points[index];
    const middle = (previous.x + point.x) / 2;
    path += ` C${middle},${previous.y} ${middle},${point.y} ${point.x},${point.y}`;
  }
  return path;
}

export default function ReportsView({ onNotify }: { onNotify: (message: string) => void }) {
  const [period, setPeriod] = useState<DateRangePeriod>("month");
  const [customStart, setCustomStart] = useState(getToday().slice(0, 8) + "01");
  const [customEnd, setCustomEnd] = useState(getToday());
  const [tab, setTab] = useState<Tab>("Overview");
  const [search, setSearch] = useState("");
  const [moduleFilter, setModuleFilter] = useState("All");
  const [historyPage, setHistoryPage] = useState(1);

  const entries = ds.getTrackingEntries();
  const transactions = ds.getTransactions();
  const goals = ds.getGoals();
  const tasks = ds.getTasks();
  const { start, end } = getDateRange(period, customStart, customEnd);
  const previous = previousRange(start, end);
  const currency = ds.getProfile()?.currencySymbol || "৳";
  const dayCount = daysInclusive(start, end);

  const activities = useMemo<Activity[]>(() => {
    const result: Activity[] = entries.map(entry => ({ id: entry.id, date: entry.date, module: entry.module, activity: "Tracking record", description: entry.title, status: entry.status, amount: entry.amount ?? undefined }));
    transactions.forEach(transaction => result.push({ id: transaction.id, date: transaction.date, module: "Finance", activity: transaction.type === "expense" ? "Expense" : transaction.type === "income" ? "Income" : "Transfer", description: transaction.description || transaction.categoryName, status: transaction.type, amount: transaction.amount }));
    goals.filter(goal => goal.status === "completed" && goal.updatedAt).forEach(goal => result.push({ id: goal.id, date: goal.updatedAt.slice(0, 10), module: "Goals", activity: "Goal milestone", description: goal.title, status: "Completed" }));
    tasks.filter(task => task.status === "completed").forEach(task => result.push({ id: task.id, date: task.date || task.updatedAt.slice(0, 10), module: "Productivity", activity: "Task completed", description: task.title, status: "Completed" }));
    return result.sort((a, b) => b.date.localeCompare(a.date));
  }, [entries, transactions, goals, tasks]);

  const currentActivities = activities.filter(item => inRange(item.date, start, end));
  const previousActivities = activities.filter(item => inRange(item.date, previous.start, previous.end));
  const currentExpenses = transactions.filter(transaction => transaction.type === "expense" && inRange(transaction.date, start, end));
  const previousExpenses = transactions.filter(transaction => transaction.type === "expense" && inRange(transaction.date, previous.start, previous.end));
  const currentExpenseTotal = currentExpenses.reduce((sum, item) => sum + item.amount, 0);
  const previousExpenseTotal = previousExpenses.reduce((sum, item) => sum + item.amount, 0);
  const activeModules = new Set(currentActivities.map(item => item.module)).size;
  const trackedDays = new Set(currentActivities.map(item => item.date)).size;
  const completedGoals = goals.filter(goal => goal.status === "completed" && inRange(goal.updatedAt, start, end)).length;
  const activityChange = percentChange(currentActivities.length, previousActivities.length);
  const expenseChange = percentChange(currentExpenseTotal, previousExpenseTotal);

  const distribution = modules.map(module => ({ module, count: currentActivities.filter(item => item.module === module).length })).sort((a, b) => b.count - a.count || a.module.localeCompare(b.module));
  const maxDistribution = Math.max(...distribution.map(item => item.count), 1);

  const bucketCount = dayCount > 92 ? Math.min(12, Math.ceil(dayCount / 31)) : Math.min(dayCount, 12);
  const trend = Array.from({ length: bucketCount }, (_, index) => {
    const bucketStart = new Date(start); bucketStart.setDate(start.getDate() + Math.floor(index * dayCount / bucketCount));
    const nextIndex = index === bucketCount - 1 ? dayCount : Math.floor((index + 1) * dayCount / bucketCount);
    const bucketEnd = addDays(start, nextIndex - 1);
    const count = currentActivities.filter(item => inRange(item.date, bucketStart, bucketEnd)).length;
    return { key: dateRangeKey(bucketStart), label: bucketCount <= 12 ? bucketStart.toLocaleDateString("en-US", { month: "short", day: "numeric" }) : bucketStart.toLocaleDateString("en-US", { month: "short" }), count };
  });
  const maxTrend = Math.max(...trend.map(item => item.count), 1);
  const graphPoints = trend.map((item, index) => ({ ...item, x: trend.length === 1 ? 320 : 38 + index * 564 / Math.max(1, trend.length - 1), y: 168 - item.count / maxTrend * 112 }));
  const graphLine = smoothPath(graphPoints);
  const graphArea = graphPoints.length ? `${graphLine} L${graphPoints[graphPoints.length - 1].x},176 L${graphPoints[0].x},176 Z` : "";

  const insights: Array<{ title: string; detail: string; metric: string }> = [];
  if (previousActivities.length >= 3 && activityChange !== null) insights.push({ title: `Recorded activity is ${activityChange >= 0 ? "up" : "down"} ${Math.abs(activityChange)}%`, detail: `Compared with the equivalent previous period.`, metric: `${currentActivities.length} vs ${previousActivities.length}` });
  if (previousExpenses.length >= 1 && expenseChange !== null) insights.push({ title: `Expenses changed ${Math.abs(expenseChange)}%`, detail: `Recorded spending in this period compared with the previous equivalent period.`, metric: `${formatCurrency(currentExpenseTotal, currency)} vs ${formatCurrency(previousExpenseTotal, currency)}` });
  if (completedGoals) insights.push({ title: `${completedGoals} goal${completedGoals === 1 ? "" : "s"} completed`, detail: "Goals marked completed within the selected reporting period.", metric: `${completedGoals} completed` });
  if (!insights.length) insights.push({ title: "Not enough history for comparisons", detail: "Add records in more than one reporting period to unlock period-over-period observations.", metric: `${currentActivities.length} records available` });

  const filteredHistory = activities.filter(item => {
    const matchesModule = moduleFilter === "All" || item.module === moduleFilter;
    const matchesSearch = `${item.description} ${item.module} ${item.activity} ${item.status}`.toLowerCase().includes(search.toLowerCase());
    return matchesModule && matchesSearch && inRange(item.date, start, end);
  });
  const pageSize = 10;
  const pageCount = Math.max(1, Math.ceil(filteredHistory.length / pageSize));
  const safePage = Math.min(historyPage, pageCount);
  const visibleHistory = filteredHistory.slice((safePage - 1) * pageSize, safePage * pageSize);

  const exportReport = () => {
    downloadCsv([
      ["Date", "Module", "Activity", "Description", "Status", "Amount"],
      ...filteredHistory.map(item => [item.date, item.module, item.activity, item.description, item.status, item.amount ?? ""]),
    ]);
    onNotify("Filtered report CSV downloaded.");
  };

  const metricCards = [
    ["ACTIVITIES RECORDED", currentActivities.length, activityChange === null ? "Selected period" : activityChange + "% vs previous period"],
    ["ACTIVE TRACKING AREAS", activeModules, modules.length + " areas available"],
    ["DAYS TRACKED", trackedDays, dayCount + " days in this period"],
    ["GOALS COMPLETED", completedGoals, "Within selected period"],
    ["RECORDED EXPENSES", formatCurrency(currentExpenseTotal, currency), expenseChange === null ? "Selected period" : expenseChange + "% vs previous period"],
  ];

  return <div className="reports-enhanced">
    <div className="welcome-row"><div><p className="eyebrow">SEE WHAT THE RECORDS SAY</p><h1>Reports<span>.</span></h1><p className="subheading">Understand activity, consistency, progress, and change across your recorded life.</p></div><div className="top-actions"><button className="secondary-button" type="button" onClick={exportReport}>Export CSV</button><button className="secondary-button" type="button" onClick={() => window.print()}>Print / PDF</button></div></div>

    <div className="report-toolbar">
      <DateRangeFilter
        className="date-range-filter--report"
        label="Reporting period"
        period={period}
        customStart={customStart}
        customEnd={customEnd}
        onPeriodChange={value => { setPeriod(value); setHistoryPage(1); }}
        onCustomStartChange={value => { setCustomStart(value); if (value > customEnd) setCustomEnd(value); }}
        onCustomEndChange={value => { setCustomEnd(value); if (value < customStart) setCustomStart(value); }}
      />
      <span className="report-period-caption">{formatDate(dateRangeKey(start))} — {formatDate(dateRangeKey(end))}</span>
    </div>
    <nav className="report-tabs" aria-label="Report sections">{tabs.map(item => <button type="button" className={item === tab ? "active" : ""} key={item} onClick={() => setTab(item)}>{item}</button>)}</nav>

    {(tab === "Overview" || tab === "Activity & trends") && <>
      {tab === "Overview" && <div className="metric-grid report-metrics">{metricCards.map(([label, value, detail]) => <div className="metric-card" key={String(label)}><p>{label}</p><strong className="metric-value">{value}</strong><div className="metric-change">{detail}</div></div>)}</div>}
      <div className="dashboard-grid report-grid">
        <section className="panel"><div className="panel-heading"><h2>Recorded activity trend</h2></div>{currentActivities.length ? <div className="report-chart-wrap"><svg className="report-chart" viewBox="0 0 640 220" role="img" aria-label="Recorded activity trend"><defs><linearGradient id="activity-fill" x1="0" x2="0" y1="0" y2="1"><stop offset="0%" stopColor="#e8754f" stopOpacity=".28"/><stop offset="100%" stopColor="#e8754f" stopOpacity="0"/></linearGradient></defs><path className="report-chart-area" d={graphArea}/><path className="report-chart-line" d={graphLine}/>{graphPoints.map(point => <g key={point.key}><circle className="report-chart-point" cx={point.x} cy={point.y} r="4"><title>{point.label}: {point.count} records</title></circle><text className="report-chart-value" x={point.x} y={point.y - 12} textAnchor="middle">{point.count}</text><text className="report-chart-label" x={point.x} y="202" textAnchor="middle">{point.label}</text></g>)}</svg></div> : <Empty>No activity has been recorded in this period.</Empty>}</section>
        <section className="panel"><div className="panel-heading"><h2>Life-area activity</h2></div><div className="report-module-list">{distribution.map(item => <div className="report-module-row" key={item.module}><span>{item.module}</span><div className="report-bar-track"><i style={{ width: (item.count / maxDistribution * 100) + "%" }}/></div><b>{item.count}</b></div>)}</div></section>
      </div>
    </>}

    {tab === "Overview" && <div className="data-panel-gap"><section className="panel"><div className="panel-heading"><h2>Recent observations</h2></div><div className="report-insights-grid">{insights.slice(0, 4).map(insight => <article className="report-insight" key={insight.title}><strong>{insight.title}</strong><p>{insight.detail}</p><span>{insight.metric}</span></article>)}</div></section></div>}

    {tab === "Goals & progress" && <div className="dashboard-grid report-grid"><section className="panel"><div className="panel-heading"><h2>Goal progress</h2></div>{goals.length ? goals.map(goal => { const progress = goal.targetValue === goal.startValue ? 0 : Math.min(100, Math.max(0, (goal.currentValue - goal.startValue) / (goal.targetValue - goal.startValue) * 100)); return <div className="report-progress-row" key={goal.id}><div><strong>{goal.title}</strong><span>{goal.status} · {Math.round(progress)}%</span></div><div className="report-bar-track"><i style={{ width: progress + "%" }}/></div></div>; }) : <Empty>No goals have been created yet.</Empty>}</section><section className="panel"><div className="panel-heading"><h2>Goal status</h2></div>{["active", "completed", "paused", "cancelled"].map(status => <div className="report-module-row" key={status}><span>{status}</span><div className="report-bar-track"><i style={{ width: (goals.length ? goals.filter(goal => goal.status === status).length / Math.max(...["active", "completed", "paused", "cancelled"].map(value => goals.filter(goal => goal.status === value).length), 1) * 100 : 0) + "%" }}/></div><b>{goals.filter(goal => goal.status === status).length}</b></div>)}</section></div>}

    {tab === "Life areas" && <div className="report-life-grid">{distribution.filter(item => item.count > 0 || ["Finance", "Goals", "Productivity"].includes(item.module)).map(item => <article className="panel report-life-card" key={item.module}><p className="eyebrow">LIFE AREA</p><h2>{item.module}</h2><strong>{item.count}</strong><span>recorded activities</span></article>)}</div>}

    {tab === "Insights" && <section className="panel"><div className="panel-heading"><h2>Insights</h2></div><div className="report-insights-grid">{insights.map(insight => <article className="report-insight" key={insight.title}><strong>{insight.title}</strong><p>{insight.detail}</p><span>{insight.metric}</span></article>)}</div></section>}

    {(tab === "Overview" || tab === "History") && <section className="panel data-panel-gap"><div className="panel-heading report-history-heading"><h2>Activity history</h2><span>{filteredHistory.length} records</span></div><div className="report-history-controls"><input type="search" placeholder="Search activity…" value={search} onChange={event => { setSearch(event.target.value); setHistoryPage(1); }}/><select aria-label="Filter by module" value={moduleFilter} onChange={event => { setModuleFilter(event.target.value); setHistoryPage(1); }}><option>All</option>{modules.map(module => <option key={module}>{module}</option>)}</select></div>{visibleHistory.length ? <div className="report-history-table"><table><thead><tr><th>Date</th><th>Module</th><th>Activity</th><th>Description</th><th>Status</th><th>Amount</th></tr></thead><tbody>{visibleHistory.map(item => <tr key={item.module + "-" + item.id}><td>{formatDate(item.date)}</td><td>{item.module}</td><td>{item.activity}</td><td>{item.description}</td><td>{item.status}</td><td>{item.amount === undefined ? "—" : formatCurrency(item.amount, currency)}</td></tr>)}</tbody></table></div> : <Empty>No records match the selected period and filters.</Empty>}<div className="report-pagination"><button type="button" className="secondary-button" disabled={safePage === 1} onClick={() => setHistoryPage(safePage - 1)}>Previous</button><span>Page {safePage} of {pageCount}</span><button type="button" className="secondary-button" disabled={safePage === pageCount} onClick={() => setHistoryPage(safePage + 1)}>Next</button></div></section>}
  </div>;
}
