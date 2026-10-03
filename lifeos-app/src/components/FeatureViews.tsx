"use client";

import { Component, useEffect, useState, type FormEvent, type ReactNode } from "react";
import * as ds from "@/lib/data-service";
import type { Account, Category, Goal, Habit, Task, Transaction } from "@/lib/types";
import { formatCurrency, formatDate, getLastNDays, getToday } from "@/lib/utils";

type ViewProps = { onNotify: (message: string) => void };
type DashboardProps = ViewProps & { onNavigate: (page: string) => void };

function Panel({ title, children }: { title: string; children: React.ReactNode }) {
  return <section className="panel"><div className="panel-heading"><h2>{title}</h2></div>{children}</section>;
}

function Empty({ children = "No entries yet." }: { children?: string }) {
  return <p className="data-empty">{children}</p>;
}

function ErrorMessage(error: unknown, fallback: string): string {
  return error instanceof Error ? error.message : fallback;
}

export class DataErrorBoundary extends Component<{ children: ReactNode }, { failed: boolean }> {
  state = { failed: false };

  static getDerivedStateFromError() {
    return { failed: true };
  }

  render() {
    if (this.state.failed) {
      return <div className="panel data-error"><h2>Local data could not be loaded</h2><p>Check browser storage, then retry this section.</p><button className="secondary-button" onClick={() => this.setState({ failed: false })}>Retry</button></div>;
    }
    return this.props.children;
  }
}

export function Dashboard({ onNavigate, onNotify }: DashboardProps) {
  const [revision, setRevision] = useState(0);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [habits, setHabits] = useState<Habit[]>([]);
  const [tasks, setTasks] = useState<Task[]>([]);
  const [goals, setGoals] = useState<Goal[]>([]);

  useEffect(() => {
    async function loadOverview() {
      try {
        await ds.initializeDefaults();
        setTransactions(ds.getRecentTransactions(5));
        setHabits(ds.getHabits());
        setTasks(ds.getTasks({ date: getToday() }));
        setGoals(ds.getGoals("active").slice(0, 3));
      } catch (error) { onNotify(ErrorMessage(error, "Unable to load the overview.")); }
    }
    void loadOverview();
  }, [revision]);

  const currency = ds.getProfile()?.currencySymbol || "৳";
  const income = ds.getMonthlyIncome();
  const expenses = ds.getMonthlyExpenses();
  const savings = income - expenses;
  const expensesByDay = getLastNDays(7).map(date => ({
    date,
    amount: ds.getTransactions({ startDate: date, endDate: date, type: "expense" }).reduce((sum, transaction) => sum + transaction.amount, 0),
  }));
  const maxDailyExpense = Math.max(...expensesByDay.map(day => day.amount), 1);
  const spendingPoints = expensesByDay.map((day, index) => ({
    ...day,
    x: 24 + index * 95.3,
    y: 132 - day.amount / maxDailyExpense * 96,
  }));
  const spendingLine = spendingPoints.map((point, index) => {
    if (index === 0) return `M ${point.x} ${point.y}`;
    const previous = spendingPoints[index - 1];
    const middle = (previous.x + point.x) / 2;
    return `C ${middle} ${previous.y}, ${middle} ${point.y}, ${point.x} ${point.y}`;
  }).join(" ");
  const spendingArea = `${spendingLine} L ${spendingPoints[spendingPoints.length - 1].x} 148 L ${spendingPoints[0].x} 148 Z`;

  return (
    <div>
      <div className="welcome-row">
        <div><p className="eyebrow">YOUR LIFE, IN PERSPECTIVE</p><h1>{new Date().toLocaleDateString("en-US", { weekday: "long" })}<span>.</span></h1><p className="subheading">A clear view of what you have recorded this month.</p></div>
        <button className="primary-button" onClick={() => onNavigate("Finance")}>Add transaction <span>+</span></button>
      </div>
      <div className="metric-grid">
        <div className="metric-card"><p>MONTHLY INCOME</p><strong className="metric-value">{formatCurrency(income, currency)}</strong><div className="metric-change">From recorded income</div></div>
        <div className="metric-card"><p>MONTHLY EXPENSES</p><strong className="metric-value">{formatCurrency(expenses, currency)}</strong><div className="metric-change orange">From recorded expenses</div></div>
        <div className="metric-card"><p>MONTHLY SAVINGS</p><strong className="metric-value">{formatCurrency(savings, currency)}</strong><div className="metric-change">Income minus expenses</div></div>
        <div className="metric-card"><p>HABITS COMPLETED TODAY</p><strong className="metric-value">{habits.length ? `${ds.getOverallHabitCompletion()}%` : "0%"}</strong><div className="metric-change">{habits.length ? `${habits.filter(habit => ds.isHabitCompletedToday(habit.id)).length} of ${habits.length} habits` : "No habits created"}</div></div>
      </div>
      <div className="dashboard-grid">
        <Panel title="Spending this week">
          {expensesByDay.every(day => day.amount === 0) ? <Empty>No expense records for this week.</Empty> : <>
            <div className="trend-chart-summary"><span>Daily outflow</span><b>{formatCurrency(expensesByDay.reduce((sum, day) => sum + day.amount, 0), currency)}<small> this week</small></b></div>
            <div className="trend-chart-wrap"><svg className="trend-chart" viewBox="0 0 620 170" role="img" aria-label="Daily expense trend for the last seven days" preserveAspectRatio="none"><defs><linearGradient id="spending-fill" x1="0" x2="0" y1="0" y2="1"><stop offset="0%" stopColor="#e8754f" stopOpacity=".3" /><stop offset="100%" stopColor="#e8754f" stopOpacity="0" /></linearGradient></defs><path className="trend-grid-line" d="M 20 36 H 600 M 20 82 H 600 M 20 128 H 600" /><path className="trend-area" d={spendingArea} /><path className="trend-line" d={spendingLine} />{spendingPoints.map(point => <circle className="trend-point" key={point.date} cx={point.x} cy={point.y} r="4"><title>{point.date}: {formatCurrency(point.amount, currency)}</title></circle>)}</svg></div>
            <div className="trend-chart-labels">{expensesByDay.map(day => <span key={day.date}>{new Date(`${day.date}T00:00:00`).toLocaleDateString("en-US", { weekday: "short" })}</span>)}</div>
          </>}
        </Panel>
        <Panel title="Today">
          <p className="data-summary">{tasks.filter(task => task.status === "completed").length} of {tasks.length} tasks completed</p>
          {tasks.length ? <div className="data-list">{tasks.slice(0, 5).map(task => <div className="data-list-row" key={task.id}><span>{task.title}</span><small>{task.status.replace("_", " ")}</small></div>)}</div> : <Empty>No tasks recorded.</Empty>}
          <button className="text-button" onClick={() => onNavigate("Productivity")}>View tasks <span>→</span></button>
        </Panel>
      </div>
      <div className="lower-grid">
        <Panel title="Recent transactions">
          {transactions.length ? <div className="data-list">{transactions.map(transaction => <div className="data-list-row" key={transaction.id}><span><b>{transaction.description}</b><small>{formatDate(transaction.date)} · {transaction.categoryName}</small></span><strong className={transaction.type === "expense" ? "amount-expense" : "amount-income"}>{transaction.type === "expense" ? "−" : "+"}{formatCurrency(transaction.amount, currency)}</strong></div>)}</div> : <Empty>No transactions recorded.</Empty>}
          <button className="text-button" onClick={() => onNavigate("Finance")}>Open finance <span>→</span></button>
        </Panel>
        <Panel title="Active goals">
          {goals.length ? <div className="data-list">{goals.map(goal => <div className="data-list-row" key={goal.id}><span><b>{goal.title}</b><small>{ds.getGoalProgress(goal)}% complete · due {formatDate(goal.targetDate)}</small></span></div>)}</div> : <Empty>No active goals.</Empty>}
          <button className="text-button" onClick={() => onNavigate("Goals")}>View goals <span>→</span></button>
        </Panel>
      </div>
      <button className="data-refresh" onClick={() => setRevision(value => value + 1)} aria-label="Refresh overview">Refresh overview</button>
    </div>
  );
}

export function FinanceView({ onNotify }: ViewProps) {
  const [revision, setRevision] = useState(0);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [accounts, setAccounts] = useState<Account[]>([]);
  const [editingId, setEditingId] = useState("");
  const [date, setDate] = useState(getToday());
  const [type, setType] = useState<"expense" | "income">("expense");
  const [categoryId, setCategoryId] = useState("");
  const [accountId, setAccountId] = useState("");
  const [description, setDescription] = useState("");
  const [amount, setAmount] = useState("");
  const [newAccountName, setNewAccountName] = useState("");
  const [newAccountType, setNewAccountType] = useState<Account["type"]>("bank");
  const [newAccountBalance, setNewAccountBalance] = useState("0");

  useEffect(() => {
    async function loadFinance() {
      try {
        await ds.initializeDefaults();
        setTransactions(ds.getTransactions());
        setCategories(ds.getCategories());
        setAccounts(ds.getAccounts());
      } catch (error) { onNotify(ErrorMessage(error, "Unable to load finance records.")); }
    }
    void loadFinance();
  }, [revision]);

  const currency = ds.getProfile()?.currencySymbol || "৳";
  const filteredCategories = categories.filter(category => category.type === type);
  const refresh = () => setRevision(value => value + 1);

  function editTransaction(transaction: Transaction) {
    if (transaction.type === "transfer") return;
    setEditingId(transaction.id);
    setDate(transaction.date);
    setType(transaction.type);
    setCategoryId(transaction.categoryId);
    setAccountId(transaction.accountId);
    setDescription(transaction.description);
    setAmount(String(transaction.amount));
  }

  function resetForm() {
    setEditingId(""); setDate(getToday()); setType("expense"); setCategoryId(""); setAccountId(""); setDescription(""); setAmount("");
  }

  async function submitAccount(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const openingBalance = Number(newAccountBalance);
    if (!newAccountName.trim() || !Number.isFinite(openingBalance)) {
      onNotify("Enter an account name and a valid opening balance.");
      return;
    }
    try {
      await ds.addAccount({ name: newAccountName.trim(), type: newAccountType, openingBalance });
      setNewAccountName(""); setNewAccountBalance("0");
      refresh(); onNotify("Account added.");
    } catch (error) { onNotify(ErrorMessage(error, "Unable to add the account.")); }
  }

  async function removeAccount(account: Account) {
    if (!window.confirm(`Remove “${account.name}” from your active accounts? Existing transactions will remain.`)) return;
    try {
      if (!await ds.deleteAccount(account.id)) throw new Error("That account no longer exists.");
      refresh(); onNotify("Account removed.");
    } catch (error) { onNotify(ErrorMessage(error, "Unable to remove the account.")); }
  }

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const numericAmount = Number(amount);
    const category = categories.find(item => item.id === categoryId);
    if (!Number.isFinite(numericAmount) || numericAmount <= 0 || !category || !accountId || !date || !description.trim()) {
      onNotify("Enter a valid amount and complete every transaction field.");
      return;
    }
    try {
      const data = { date, type, categoryId, categoryName: category.name, description: description.trim(), amount: numericAmount, accountId };
      if (editingId) {
        if (!await ds.updateTransaction(editingId, data)) throw new Error("That transaction no longer exists.");
        onNotify("Transaction updated.");
      } else {
        await ds.addTransaction(data);
        onNotify("Transaction saved.");
      }
      resetForm(); refresh();
    } catch (error) { onNotify(ErrorMessage(error, "Unable to save the transaction.")); }
  }

  async function removeTransaction(id: string) {
    if (!window.confirm("Delete this transaction? This cannot be undone.")) return;
    try {
      if (!await ds.deleteTransaction(id)) throw new Error("That transaction no longer exists.");
      if (editingId === id) resetForm();
      refresh(); onNotify("Transaction deleted.");
    } catch (error) { onNotify(ErrorMessage(error, "Unable to delete the transaction.")); }
  }

  const income = ds.getMonthlyIncome();
  const expenses = ds.getMonthlyExpenses();
  return <div>
    <div className="welcome-row"><div><p className="eyebrow">MONEY, MADE VISIBLE</p><h1>Finance<span>.</span></h1><p className="subheading">Every figure here comes from your saved transactions.</p></div></div>
    <div className="metric-grid"><div className="metric-card"><p>THIS MONTH INCOME</p><strong className="metric-value">{formatCurrency(income, currency)}</strong></div><div className="metric-card"><p>THIS MONTH EXPENSES</p><strong className="metric-value">{formatCurrency(expenses, currency)}</strong></div><div className="metric-card"><p>THIS MONTH SAVINGS</p><strong className="metric-value">{formatCurrency(income - expenses, currency)}</strong></div><div className="metric-card"><p>ACCOUNT BALANCE</p><strong className="metric-value">{formatCurrency(ds.getTotalBalance(), currency)}</strong></div></div>
    <div className="feature-grid">
      <Panel title={editingId ? "Edit transaction" : "Add transaction"}>
        {!accounts.length ? <Empty>No active account available. Review setup or reset local data from Settings.</Empty> : <form className="data-form" onSubmit={submit}>
          <label>Type<select value={type} onChange={event => { setType(event.target.value as "expense" | "income"); setCategoryId(""); }}><option value="expense">Expense</option><option value="income">Income</option></select></label>
          <label>Amount<input type="number" inputMode="decimal" min="0.01" step="0.01" required value={amount} onChange={event => setAmount(event.target.value)} placeholder="0.00" /></label>
          <label>Description<input required maxLength={100} value={description} onChange={event => setDescription(event.target.value)} placeholder="What was this for?" /></label>
          <label>Category<select required value={categoryId} onChange={event => setCategoryId(event.target.value)}><option value="">Choose a category</option>{filteredCategories.map(category => <option key={category.id} value={category.id}>{category.name}</option>)}</select></label>
          <label>Account<select required value={accountId} onChange={event => setAccountId(event.target.value)}><option value="">Choose an account</option>{accounts.map(account => <option key={account.id} value={account.id}>{account.name}</option>)}</select></label>
          <label>Date<input required type="date" value={date} onChange={event => setDate(event.target.value)} /></label>
          <div className="data-form-actions"><button className="primary-button" type="submit">{editingId ? "Save changes" : "Save transaction"}</button>{editingId && <button type="button" className="secondary-button" onClick={resetForm}>Cancel</button>}</div>
        </form>}
      </Panel>
      <Panel title="Spending by category">
        {ds.getExpensesByCategory().length ? <div className="data-list">{ds.getExpensesByCategory().map(item => <div className="data-list-row" key={item.categoryName}><span>{item.categoryName}</span><strong>{formatCurrency(item.amount, currency)}</strong></div>)}</div> : <Empty>No expenses recorded this month.</Empty>}
      </Panel>
    </div>
    <div className="data-panel-gap"><Panel title={`Your accounts (${accounts.length})`}>
      <form className="data-form account-form" onSubmit={submitAccount}>
        <div className="form-row"><label>Account name<input required maxLength={60} value={newAccountName} onChange={event => setNewAccountName(event.target.value)} placeholder="e.g. Main bank" /></label><label>Type<select value={newAccountType} onChange={event => setNewAccountType(event.target.value as Account["type"])}><option value="cash">Cash</option><option value="bank">Bank</option><option value="mobile_wallet">Mobile wallet</option><option value="credit_card">Credit card</option><option value="investment">Investment</option><option value="other">Other</option></select></label><label>Opening balance<input type="number" step="0.01" value={newAccountBalance} onChange={event => setNewAccountBalance(event.target.value)} /></label></div>
        <button className="primary-button" type="submit">Add account</button>
      </form>
      {accounts.length ? <div className="data-list">{accounts.map(account => <div className="data-list-row" key={account.id}><span><b>{account.name}</b><small>{account.type.replace("_", " ")} · {formatCurrency(ds.getAccountBalance(account.id), currency)} current balance</small></span><button type="button" className="danger-button" onClick={() => void removeAccount(account)}>Remove</button></div>)}</div> : <Empty>No finance accounts yet.</Empty>}
    </Panel></div>
    <div className="data-panel-gap"><Panel title={`Transactions (${transactions.length})`}>
      {transactions.length ? <div className="data-list">{transactions.map(transaction => <div className="data-list-row" key={transaction.id}><span><b>{transaction.description}</b><small>{formatDate(transaction.date)} · {transaction.categoryName} · {accounts.find(account => account.id === transaction.accountId)?.name || "Account removed"}</small></span><strong className={transaction.type === "expense" ? "amount-expense" : "amount-income"}>{transaction.type === "expense" ? "−" : "+"}{formatCurrency(transaction.amount, currency)}</strong><span className="data-row-actions"><button type="button" onClick={() => editTransaction(transaction)} disabled={transaction.type === "transfer"}>Edit</button><button type="button" onClick={() => removeTransaction(transaction.id)}>Delete</button></span></div>)}</div> : <Empty>No transactions yet. Add your first income or expense above.</Empty>}
    </Panel></div>
  </div>;
}

export function HabitsView({ onNotify }: ViewProps) {
  const [revision, setRevision] = useState(0);
  const [habits, setHabits] = useState<Habit[]>([]);
  const [name, setName] = useState("");
  const [category, setCategory] = useState("Personal");
  const [frequency, setFrequency] = useState<"daily" | "weekly">("daily");
  const [target, setTarget] = useState("7");
  useEffect(() => { try { setHabits(ds.getHabits()); } catch (error) { onNotify(ErrorMessage(error, "Unable to load habits.")); } }, [revision]);
  const refresh = () => setRevision(value => value + 1);

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const targetPerWeek = Number(target);
    if (!name.trim() || !Number.isInteger(targetPerWeek) || targetPerWeek < 1 || targetPerWeek > 7) { onNotify("Enter a habit name and a weekly target from 1 to 7."); return; }
    try { await ds.addHabit({ name: name.trim(), category, frequency, targetPerWeek }); setName(""); refresh(); onNotify("Habit added."); }
    catch (error) { onNotify(ErrorMessage(error, "Unable to add the habit.")); }
  }

  return <div>
    <div className="welcome-row"><div><p className="eyebrow">SMALL PROMISES, KEPT</p><h1>Habits<span>.</span></h1><p className="subheading">Track consistency with dated completion records.</p></div></div>
    <div className="feature-grid"><Panel title="Create a habit"><form className="data-form" onSubmit={submit}><label>Habit name<input required maxLength={80} value={name} onChange={event => setName(event.target.value)} placeholder="e.g. Walk outside" /></label><label>Category<input value={category} onChange={event => setCategory(event.target.value)} maxLength={40} /></label><label>Frequency<select value={frequency} onChange={event => setFrequency(event.target.value as "daily" | "weekly")}><option value="daily">Daily</option><option value="weekly">Weekly</option></select></label><label>Target per week<input type="number" min="1" max="7" step="1" required value={target} onChange={event => setTarget(event.target.value)} /></label><button className="primary-button" type="submit">Add habit</button></form></Panel><Panel title="Today’s progress"><strong className="metric-value">{habits.length ? `${ds.getOverallHabitCompletion()}%` : "0%"}</strong><p className="subheading">{habits.filter(habit => ds.isHabitCompletedToday(habit.id)).length} of {habits.length} habits completed today</p></Panel></div>
    <div className="data-panel-gap"><Panel title={`Your habits (${habits.length})`}>{habits.length ? <div className="data-list">{habits.map(habit => { const completed = ds.isHabitCompletedToday(habit.id); return <div className="data-list-row" key={habit.id}><span><b>{habit.name}</b><small>{habit.category} · {habit.frequency} · {ds.getHabitStreak(habit.id)} day streak</small></span><button type="button" className={completed ? "secondary-button" : "primary-button"} onClick={async () => { try { await ds.toggleHabit(habit.id); refresh(); onNotify(completed ? "Completion removed." : "Habit marked complete."); } catch (error) { onNotify(ErrorMessage(error, "Unable to update habit.")); } }}>{completed ? "Undo today" : "Complete today"}</button><button type="button" className="danger-button" onClick={async () => { if (!window.confirm(`Delete ${habit.name} and its completion history?`)) return; try { if (!await ds.deleteHabit(habit.id)) throw new Error("That habit no longer exists."); refresh(); onNotify("Habit deleted."); } catch (error) { onNotify(ErrorMessage(error, "Unable to delete habit.")); } }}>Delete</button></div>; })}</div> : <Empty>No habits created yet.</Empty>}</Panel></div>
  </div>;
}

export function GoalsView({ onNotify }: ViewProps) {
  const [revision, setRevision] = useState(0);
  const [goals, setGoals] = useState<Goal[]>([]);
  const [title, setTitle] = useState("");
  const [category, setCategory] = useState("Personal");
  const [targetDate, setTargetDate] = useState("");
  const [targetValue, setTargetValue] = useState("1");
  const [unit, setUnit] = useState("complete");
  const [priority, setPriority] = useState<Goal["priority"]>("medium");
  useEffect(() => { try { setGoals(ds.getGoals()); } catch (error) { onNotify(ErrorMessage(error, "Unable to load goals.")); } }, [revision]);
  const refresh = () => setRevision(value => value + 1);

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const numericTarget = Number(targetValue);
    if (!title.trim() || !targetDate || !Number.isFinite(numericTarget) || numericTarget <= 0) { onNotify("Enter a title, target date, and positive target value."); return; }
    try { await ds.addGoal({ title: title.trim(), category, targetDate, startValue: 0, currentValue: 0, targetValue: numericTarget, unit: unit.trim() || "complete", priority }); setTitle(""); refresh(); onNotify("Goal created."); }
    catch (error) { onNotify(ErrorMessage(error, "Unable to create goal.")); }
  }

  return <div>
    <div className="welcome-row"><div><p className="eyebrow">MAKE ROOM FOR WHAT MATTERS</p><h1>Goals<span>.</span></h1><p className="subheading">Record a target, then update progress as it changes.</p></div></div>
    <div className="feature-grid"><Panel title="New goal"><form className="data-form" onSubmit={submit}><label>Goal<input required maxLength={100} value={title} onChange={event => setTitle(event.target.value)} placeholder="What are you working toward?" /></label><label>Category<input value={category} onChange={event => setCategory(event.target.value)} maxLength={40} /></label><label>Target date<input type="date" required value={targetDate} onChange={event => setTargetDate(event.target.value)} /></label><div className="form-row"><label>Target value<input type="number" min="0.01" step="any" required value={targetValue} onChange={event => setTargetValue(event.target.value)} /></label><label>Unit<input required maxLength={20} value={unit} onChange={event => setUnit(event.target.value)} /></label></div><label>Priority<select value={priority} onChange={event => setPriority(event.target.value as Goal["priority"])}><option value="low">Low</option><option value="medium">Medium</option><option value="high">High</option></select></label><button className="primary-button" type="submit">Create goal</button></form></Panel><Panel title="Progress overview">{goals.length ? <div className="data-list">{goals.filter(goal => goal.status === "active").slice(0, 4).map(goal => <div className="data-list-row" key={goal.id}><span><b>{goal.title}</b><small>{ds.getGoalProgress(goal)}% · due {formatDate(goal.targetDate)}</small></span></div>)}</div> : <Empty>No goals recorded.</Empty>}</Panel></div>
    <div className="data-panel-gap"><Panel title={`All goals (${goals.length})`}>{goals.length ? <div className="data-list">{goals.map(goal => <GoalRow key={goal.id} goal={goal} onNotify={onNotify} refresh={refresh} />)}</div> : <Empty>Create your first goal above.</Empty>}</Panel></div>
  </div>;
}

function GoalRow({ goal, onNotify, refresh }: { goal: Goal; onNotify: ViewProps["onNotify"]; refresh: () => void }) {
  const [value, setValue] = useState(String(goal.currentValue));
  async function updateProgress() {
    const currentValue = Number(value);
    if (!Number.isFinite(currentValue)) { onNotify("Progress must be a valid number."); return; }
    try { if (!await ds.updateGoal(goal.id, { currentValue, status: currentValue >= goal.targetValue ? "completed" : goal.status === "completed" ? "active" : goal.status })) throw new Error("That goal no longer exists."); refresh(); onNotify("Goal progress updated."); }
    catch (error) { onNotify(ErrorMessage(error, "Unable to update goal.")); }
  }
  return <div className="data-list-row goal-row"><span><b>{goal.title}</b><small>{goal.category} · due {formatDate(goal.targetDate)} · {goal.status} · {ds.getGoalProgress(goal)}%</small></span><label className="inline-field">Progress<input type="number" step="any" value={value} onChange={event => setValue(event.target.value)} /></label><button type="button" className="secondary-button" onClick={updateProgress}>Update</button><button type="button" className="danger-button" onClick={async () => { if (!window.confirm(`Delete goal “${goal.title}”?`)) return; try { if (!await ds.deleteGoal(goal.id)) throw new Error("That goal no longer exists."); refresh(); onNotify("Goal deleted."); } catch (error) { onNotify(ErrorMessage(error, "Unable to delete goal.")); } }}>Delete</button></div>;
}

export function TasksView({ onNotify }: ViewProps) {
  const [revision, setRevision] = useState(0);
  const [tasks, setTasks] = useState<Task[]>([]);
  const [title, setTitle] = useState("");
  const [date, setDate] = useState(getToday());
  const [deadline, setDeadline] = useState("");
  const [priority, setPriority] = useState<Task["priority"]>("medium");
  useEffect(() => { try { setTasks(ds.getTasks()); } catch (error) { onNotify(ErrorMessage(error, "Unable to load tasks.")); } }, [revision]);
  const refresh = () => setRevision(value => value + 1);

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!title.trim() || !date || (deadline && deadline < date)) { onNotify("Enter a task title and a valid date or deadline."); return; }
    try { await ds.addTask({ title: title.trim(), date, deadline, priority }); setTitle(""); setDate(getToday()); setDeadline(""); refresh(); onNotify("Task added."); }
    catch (error) { onNotify(ErrorMessage(error, "Unable to add task.")); }
  }

  return <div>
    <div className="welcome-row"><div><p className="eyebrow">PUT THE NEXT THING IN VIEW</p><h1>Productivity<span>.</span></h1><p className="subheading">A task list grounded in the dates and priorities you set.</p></div></div>
    <div className="feature-grid"><Panel title="Add a task"><form className="data-form" onSubmit={submit}><label>Task<input required maxLength={120} value={title} onChange={event => setTitle(event.target.value)} placeholder="What needs doing?" /></label><div className="form-row"><label>Scheduled date<input type="date" required value={date} onChange={event => setDate(event.target.value)} /></label><label>Deadline<input type="date" min={date} value={deadline} onChange={event => setDeadline(event.target.value)} /></label></div><label>Priority<select value={priority} onChange={event => setPriority(event.target.value as Task["priority"])}><option value="low">Low</option><option value="medium">Medium</option><option value="high">High</option></select></label><button className="primary-button" type="submit">Add task</button></form></Panel><Panel title="Task summary"><strong className="metric-value">{ds.getTaskStats().completed} / {ds.getTaskStats().total}</strong><p className="subheading">Tasks completed · {ds.getTaskStats().overdue} overdue</p></Panel></div>
    <div className="data-panel-gap"><Panel title={`Tasks (${tasks.length})`}>{tasks.length ? <div className="data-list">{tasks.map(task => <div className="data-list-row task-row" key={task.id}><span><b>{task.title}</b><small>{formatDate(task.date)}{task.deadline ? ` · due ${formatDate(task.deadline)}` : ""} · {task.priority} priority</small></span><div className="task-row-controls"><select aria-label={`Status for ${task.title}`} value={task.status} onChange={async event => { try { if (!await ds.updateTask(task.id, { status: event.target.value as Task["status"] })) throw new Error("That task no longer exists."); refresh(); onNotify("Task status updated."); } catch (error) { onNotify(ErrorMessage(error, "Unable to update task.")); } }}><option value="not_started">Not started</option><option value="in_progress">In progress</option><option value="completed">Completed</option><option value="cancelled">Cancelled</option></select><button type="button" className="danger-button" onClick={async () => { if (!window.confirm(`Delete task “${task.title}”?`)) return; try { if (!await ds.deleteTask(task.id)) throw new Error("That task no longer exists."); refresh(); onNotify("Task deleted."); } catch (error) { onNotify(ErrorMessage(error, "Unable to delete task.")); } }}>Delete</button></div></div>)}</div> : <Empty>No tasks recorded yet.</Empty>}</Panel></div>
  </div>;
}

export function SettingsView({ onNotify }: ViewProps) {
  const [name, setName] = useState("");
  const [currencySymbol, setCurrencySymbol] = useState("৳");
  const [summary, setSummary] = useState({ transactions: 0, habits: 0, goals: 0, tasks: 0, accounts: 0, trackingEntries: 0 });
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  useEffect(() => {
    try {
      const profile = ds.getProfile();
      setName(profile?.name || "");
      setCurrencySymbol(profile?.currencySymbol || "৳");
      setSummary(ds.getDataSummary());
    } catch (error) { onNotify(ErrorMessage(error, "Unable to load settings.")); }
  }, []);

  async function save(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!name.trim() || !currencySymbol.trim()) { onNotify("Name and currency symbol are required."); return; }
    try { await ds.saveProfile({ name: name.trim(), currencySymbol: currencySymbol.trim(), isSetupComplete: true }); onNotify("Settings saved."); }
    catch (error) { onNotify(ErrorMessage(error, "Unable to save settings.")); }
  }

  async function changePassword(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (newPassword.length < 6 || newPassword !== confirmPassword) {
      onNotify(newPassword.length < 6 ? "New password must be at least 6 characters." : "New passwords do not match.");
      return;
    }
    try {
      const response = await fetch("/api/auth", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "change-password", password: currentPassword, newPassword }),
      });
      const result = await response.json() as { error?: string };
      if (!response.ok) throw new Error(result.error || "Unable to change password.");
      setCurrentPassword(""); setNewPassword(""); setConfirmPassword("");
      onNotify("Password updated.");
    } catch (error) { onNotify(ErrorMessage(error, "Unable to change password.")); }
  }

  async function resetData() {
    if (!window.confirm("Permanently delete all local LifeOS data, including your profile? This cannot be undone.")) return;
    try { await ds.clearAllData(); window.location.reload(); }
    catch (error) { onNotify(ErrorMessage(error, "Unable to clear local data.")); }
  }

  return <div>
    <div className="welcome-row"><div><p className="eyebrow">YOUR LOCAL WORKSPACE</p><h1>Settings<span>.</span></h1><p className="subheading">Your account and records are saved by this LifeOS installation.</p></div></div>
    <div className="feature-grid"><Panel title="Personal profile"><form className="data-form" onSubmit={save}><label>Your name<input required maxLength={80} value={name} onChange={event => setName(event.target.value)} /></label><label>Currency symbol<input required maxLength={8} value={currencySymbol} onChange={event => setCurrencySymbol(event.target.value)} /></label><button className="primary-button" type="submit">Save settings</button></form></Panel><Panel title="Stored records"><div className="data-list">{Object.entries(summary).map(([key, count]) => <div className="data-list-row" key={key}><span>{key[0].toUpperCase() + key.slice(1)}</span><strong>{count}</strong></div>)}</div></Panel></div>
    <div className="data-panel-gap"><Panel title="Change password"><form className="data-form" onSubmit={changePassword}><label>Current password<input required type="password" autoComplete="current-password" value={currentPassword} onChange={event => setCurrentPassword(event.target.value)} /></label><div className="form-row"><label>New password<input required type="password" minLength={6} autoComplete="new-password" value={newPassword} onChange={event => setNewPassword(event.target.value)} /></label><label>Confirm new password<input required type="password" minLength={6} autoComplete="new-password" value={confirmPassword} onChange={event => setConfirmPassword(event.target.value)} /></label></div><button className="primary-button" type="submit">Update password</button></form></Panel></div>
    <div className="data-panel-gap"><Panel title="Local data"><p className="subheading">Reset removes this account’s saved records and restores its default categories and Cash account. This cannot be undone.</p><button className="danger-button" type="button" onClick={resetData}>Delete this account’s data</button><button type="button" className="secondary-button settings-refresh" onClick={() => setSummary(ds.getDataSummary())}>Refresh record counts</button></Panel></div>
  </div>;
}
