// LifeOS — Data Service
// Central API for all data operations. Components import from here.

import { LocalStore, getItem, hydrateCollections, sendDataAction, setItem } from './storage';
import type { UserProfile, Account, Category, Transaction, IncomeDistribution, Goal, Task, TrackingEntry, TrackingModule } from './types';
import { generateId, getToday, getStartOfMonth, getEndOfMonth } from './utils';

// ── Store instances ──
const accountStore = new LocalStore<Account>('accounts');
const categoryStore = new LocalStore<Category>('categories');
const transactionStore = new LocalStore<Transaction>('transactions');
const goalStore = new LocalStore<Goal>('goals');
const taskStore = new LocalStore<Task>('tasks');
const trackingEntryStore = new LocalStore<TrackingEntry>('tracking_entries');

export async function loadUserData(): Promise<void> {
  const response = await fetch('/api/data', { credentials: 'same-origin', cache: 'no-store' });
  const result = await response.json() as { error?: string; records?: Record<string, Record<string, unknown>[]> };
  if (!response.ok || !result.records) throw new Error(result.error || 'Unable to load your saved records.');
  hydrateCollections(result.records as Record<string, { id: string }[]>);
}

// ════════════════════════════════════════════
// USER PROFILE
// ════════════════════════════════════════════

export function getProfile(): UserProfile | null {
  return getItem<UserProfile>('profile');
}

export async function saveProfile(data: Partial<UserProfile>): Promise<UserProfile> {
  const existing = getProfile();
  const now = new Date().toISOString();
  const profile: UserProfile = {
    id: existing?.id || 'profile',
    name: existing?.name || '',
    currency: existing?.currency || 'BDT',
    currencySymbol: existing?.currencySymbol || '৳',
    theme: existing?.theme || 'light',
    isSetupComplete: existing?.isSetupComplete || false,
    createdAt: existing?.createdAt || now,
    updatedAt: now,
    ...data,
  };
  await setItem('profile', profile);
  return profile;
}

export function isFirstRun(): boolean {
  const profile = getProfile();
  return !profile || !profile.isSetupComplete;
}

export async function completeSetup(name: string): Promise<UserProfile> {
  const profile = await saveProfile({ name, isSetupComplete: true });
  await initializeDefaults();
  return profile;
}

// ════════════════════════════════════════════
// ACCOUNTS
// ════════════════════════════════════════════

export function getAccounts(): Account[] {
  return accountStore.getAll().filter(a => a.isActive);
}

export function getAllAccounts(): Account[] {
  return accountStore.getAll();
}

export async function addAccount(data: { name: string; type: Account['type']; openingBalance: number }): Promise<Account> {
  const now = new Date().toISOString();
  return accountStore.create({
    id: generateId(),
    name: data.name,
    type: data.type,
    openingBalance: data.openingBalance,
    isActive: true,
    createdAt: now,
    updatedAt: now,
  });
}

export async function updateAccount(id: string, data: Partial<Account>): Promise<Account | undefined> {
  return accountStore.update(id, { ...data, updatedAt: new Date().toISOString() });
}

export async function deleteAccount(id: string): Promise<boolean> {
  return await accountStore.update(id, { isActive: false, updatedAt: new Date().toISOString() }) !== undefined;
}

export function getAccountBalance(accountId: string): number {
  const account = accountStore.getById(accountId);
  if (!account) return 0;
  let balance = account.openingBalance;
  for (const t of transactionStore.getAll()) {
    if (t.type === 'income' && t.accountId === accountId) {
      balance += t.amount;
      if (t.distributions?.length) {
        balance -= t.distributions.reduce((sum, item) => sum + item.amount, 0);
      }
    }
    if (t.type === 'expense' && t.accountId === accountId) balance -= t.amount;
    if (t.type === 'income' && t.distributions?.length) {
      for (const allocation of t.distributions) {
        if (allocation.accountId === accountId) balance += allocation.amount;
      }
    }
  }
  return balance;
}

export function getTotalBalance(): number {
  const accounts = getAccounts();
  return accounts.reduce((sum, acc) => sum + getAccountBalance(acc.id), 0);
}

// ════════════════════════════════════════════
// CATEGORIES
// ════════════════════════════════════════════

export function getCategories(type?: 'income' | 'expense'): Category[] {
  const all = categoryStore.getAll();
  return type ? all.filter(c => c.type === type) : all;
}

export async function addCategory(data: { name: string; type: 'income' | 'expense' }): Promise<Category> {
  return categoryStore.create({
    id: generateId(),
    name: data.name,
    type: data.type,
    isDefault: false,
  });
}

export async function deleteCategory(id: string): Promise<boolean> {
  const cat = categoryStore.getById(id);
  if (cat?.isDefault) return false; // Prevent deleting default categories
  return categoryStore.delete(id);
}

// ════════════════════════════════════════════
// TRANSACTIONS
// ════════════════════════════════════════════

export function getTransactions(filters?: {
  startDate?: string;
  endDate?: string;
  type?: 'income' | 'expense' | 'transfer';
  categoryId?: string;
  accountId?: string;
}): Transaction[] {
  let items = transactionStore.getAll();

  if (filters?.startDate) {
    items = items.filter(t => t.date >= filters.startDate!);
  }
  if (filters?.endDate) {
    items = items.filter(t => t.date <= filters.endDate!);
  }
  if (filters?.type) {
    items = items.filter(t => t.type === filters.type);
  }
  if (filters?.categoryId) {
    items = items.filter(t => t.categoryId === filters.categoryId);
  }
  if (filters?.accountId) {
    items = items.filter(t => t.accountId === filters.accountId);
  }

  // Sort by date descending, then by creation time descending
  items.sort((a, b) => {
    const dateDiff = b.date.localeCompare(a.date);
    if (dateDiff !== 0) return dateDiff;
    return b.createdAt.localeCompare(a.createdAt);
  });

  return items;
}

function validateIncomeDistributions(amount: number, distributions?: IncomeDistribution[]): IncomeDistribution[] {
  if (!distributions?.length) return [];
  let total = 0;
  const seen = new Set<string>();
  for (const allocation of distributions) {
    if (!Number.isFinite(allocation.amount) || allocation.amount <= 0) throw new Error('Each distribution amount must be greater than zero.');
    if (!accountStore.getById(allocation.accountId)?.isActive) throw new Error('Choose an active account for each distribution.');
    if (seen.has(allocation.accountId)) throw new Error('Allocate each account only once.');
    seen.add(allocation.accountId);
    total += allocation.amount;
  }
  if (total > amount + 0.000001) throw new Error('The distributed amount cannot exceed the income amount.');
  return distributions.map(allocation => ({ ...allocation, amount: Number(allocation.amount.toFixed(2)) }));
}

export async function addTransaction(data: {
  date: string;
  type: 'income' | 'expense' | 'transfer';
  categoryId: string;
  categoryName: string;
  description: string;
  amount: number;
  accountId: string;
  distributions?: IncomeDistribution[];
  notes?: string;
}): Promise<Transaction> {
  if (data.type === 'income') data.distributions = validateIncomeDistributions(data.amount, data.distributions);
  const now = new Date().toISOString();
  return transactionStore.create({
    id: generateId(),
    date: data.date,
    type: data.type,
    categoryId: data.categoryId,
    categoryName: data.categoryName,
    description: data.description,
    amount: data.amount,
    accountId: data.accountId,
    ...(data.type === 'income' && data.distributions?.length ? { distributions: data.distributions } : {}),
    notes: data.notes || '',
    createdAt: now,
    updatedAt: now,
  });
}

export async function updateTransaction(id: string, data: Partial<Transaction>): Promise<Transaction | undefined> {
  const current = transactionStore.getById(id);
  if (!current) return undefined;
  const merged = { ...current, ...data };
  if (merged.type === 'income') {
    merged.distributions = validateIncomeDistributions(merged.amount, merged.distributions);
  }
  return transactionStore.update(id, { ...merged, updatedAt: new Date().toISOString() });
}

export async function deleteTransaction(id: string): Promise<boolean> {
  return transactionStore.delete(id);
}

export function getMonthlyIncome(startDate?: string, endDate?: string): number {
  const start = startDate || getStartOfMonth();
  const end = endDate || getEndOfMonth();
  const txs = getTransactions({ startDate: start, endDate: end, type: 'income' });
  return txs.reduce((sum, t) => sum + t.amount, 0);
}

export function getMonthlyExpenses(startDate?: string, endDate?: string): number {
  const start = startDate || getStartOfMonth();
  const end = endDate || getEndOfMonth();
  const txs = getTransactions({ startDate: start, endDate: end, type: 'expense' });
  return txs.reduce((sum, t) => sum + t.amount, 0);
}

export function getMonthlySavings(startDate?: string, endDate?: string): number {
  return getMonthlyIncome(startDate, endDate) - getMonthlyExpenses(startDate, endDate);
}

export function getSavingsRate(startDate?: string, endDate?: string): number {
  const income = getMonthlyIncome(startDate, endDate);
  if (income === 0) return 0;
  const savings = getMonthlySavings(startDate, endDate);
  return Math.round((savings / income) * 100);
}

export function getExpensesByCategory(startDate?: string, endDate?: string): { categoryName: string; amount: number }[] {
  const start = startDate || getStartOfMonth();
  const end = endDate || getEndOfMonth();
  const txs = getTransactions({ startDate: start, endDate: end, type: 'expense' });

  const map = new Map<string, number>();
  for (const t of txs) {
    map.set(t.categoryName, (map.get(t.categoryName) || 0) + t.amount);
  }

  return Array.from(map.entries())
    .map(([categoryName, amount]) => ({ categoryName, amount }))
    .sort((a, b) => b.amount - a.amount);
}

export function getRecentTransactions(limit: number = 10): Transaction[] {
  return getTransactions().slice(0, limit);
}

// ════════════════════════════════════════════
// GOALS
// ════════════════════════════════════════════

export function getGoals(status?: Goal['status']): Goal[] {
  const all = goalStore.getAll();
  const filtered = status ? all.filter(g => g.status === status) : all;
  return filtered.sort((a, b) => {
    const priorityOrder = { high: 0, medium: 1, low: 2 };
    return priorityOrder[a.priority] - priorityOrder[b.priority];
  });
}

export async function addGoal(data: {
  title: string;
  category: string;
  targetDate: string;
  startValue: number;
  currentValue: number;
  targetValue: number;
  unit: string;
  priority: Goal['priority'];
  notes?: string;
}): Promise<Goal> {
  const now = new Date().toISOString();
  return goalStore.create({
    id: generateId(),
    title: data.title,
    category: data.category,
    targetDate: data.targetDate,
    startValue: data.startValue,
    currentValue: data.currentValue,
    targetValue: data.targetValue,
    unit: data.unit,
    priority: data.priority,
    status: 'active',
    notes: data.notes || '',
    createdAt: now,
    updatedAt: now,
  });
}

export async function updateGoal(id: string, data: Partial<Goal>): Promise<Goal | undefined> {
  return goalStore.update(id, { ...data, updatedAt: new Date().toISOString() });
}

export async function deleteGoal(id: string): Promise<boolean> {
  return goalStore.delete(id);
}

export function getGoalProgress(goal: Goal): number {
  if (goal.targetValue === goal.startValue) return 0;
  const progress = ((goal.currentValue - goal.startValue) / (goal.targetValue - goal.startValue)) * 100;
  return Math.min(100, Math.max(0, Math.round(progress)));
}

// ════════════════════════════════════════════
// TASKS
// ════════════════════════════════════════════

export function getTasks(filters?: {
  status?: Task['status'];
  date?: string;
  priority?: Task['priority'];
}): Task[] {
  let items = taskStore.getAll();

  if (filters?.status) {
    items = items.filter(t => t.status === filters.status);
  }
  if (filters?.date) {
    items = items.filter(t => t.date === filters.date);
  }
  if (filters?.priority) {
    items = items.filter(t => t.priority === filters.priority);
  }

  // Sort: not_started/in_progress first, then by priority, then by deadline
  const statusOrder: Record<string, number> = { in_progress: 0, not_started: 1, completed: 2, cancelled: 3 };
  const priorityOrder: Record<string, number> = { high: 0, medium: 1, low: 2 };

  items.sort((a, b) => {
    const statusDiff = (statusOrder[a.status] ?? 9) - (statusOrder[b.status] ?? 9);
    if (statusDiff !== 0) return statusDiff;
    const prioDiff = (priorityOrder[a.priority] ?? 9) - (priorityOrder[b.priority] ?? 9);
    if (prioDiff !== 0) return prioDiff;
    return (a.deadline || '9999').localeCompare(b.deadline || '9999');
  });

  return items;
}

export async function addTask(data: {
  title: string;
  date?: string;
  deadline?: string;
  priority: Task['priority'];
  category?: string;
  notes?: string;
}): Promise<Task> {
  const now = new Date().toISOString();
  return taskStore.create({
    id: generateId(),
    title: data.title,
    date: data.date || getToday(),
    deadline: data.deadline || '',
    priority: data.priority,
    category: data.category || '',
    status: 'not_started',
    notes: data.notes || '',
    createdAt: now,
    updatedAt: now,
  });
}

export async function updateTask(id: string, data: Partial<Task>): Promise<Task | undefined> {
  return taskStore.update(id, { ...data, updatedAt: new Date().toISOString() });
}

export async function deleteTask(id: string): Promise<boolean> {
  return taskStore.delete(id);
}

export function getTodaysTasks(): Task[] {
  const today = getToday();
  return getTasks().filter(t =>
    t.date === today || (t.status !== 'completed' && t.status !== 'cancelled')
  );
}

export function getTaskStats(): { total: number; completed: number; inProgress: number; overdue: number } {
  const all = taskStore.getAll();
  const today = getToday();
  return {
    total: all.filter(t => t.status !== 'cancelled').length,
    completed: all.filter(t => t.status === 'completed').length,
    inProgress: all.filter(t => t.status === 'in_progress').length,
    overdue: all.filter(t => t.deadline && t.deadline < today && t.status !== 'completed' && t.status !== 'cancelled').length,
  };
}

// ════════════════════════════════════════════
// TRACKING MODULES
// ════════════════════════════════════════════

export function getTrackingEntries(module?: TrackingModule): TrackingEntry[] {
  const entries = trackingEntryStore.getAll();
  const removedModules: ReadonlySet<string> = new Set(["Health", "Habits", "Vehicle", "Entertainment", "Home"]);
  return entries
    .filter(entry => !removedModules.has(entry.module) && (!module || entry.module === module))
    .sort((a, b) => b.date.localeCompare(a.date) || b.createdAt.localeCompare(a.createdAt));
}

export async function addTrackingEntry(data: Omit<TrackingEntry, 'id' | 'createdAt' | 'updatedAt'>): Promise<TrackingEntry> {
  const now = new Date().toISOString();
  return trackingEntryStore.create({
    ...data,
    id: generateId(),
    createdAt: now,
    updatedAt: now,
  });
}

export async function updateTrackingEntry(
  id: string,
  data: Partial<Omit<TrackingEntry, 'id' | 'createdAt' | 'updatedAt'>>,
): Promise<TrackingEntry | undefined> {
  return trackingEntryStore.update(id, { ...data, updatedAt: new Date().toISOString() });
}

export async function deleteTrackingEntry(id: string): Promise<boolean> {
  return trackingEntryStore.delete(id);
}

// ════════════════════════════════════════════
// INITIALIZATION & DATA MANAGEMENT
// ════════════════════════════════════════════

const DEFAULT_EXPENSE_CATEGORIES = [
  'Food', 'Groceries', 'Transport', 'Housing', 'Utilities',
  'Shopping', 'Entertainment', 'Health', 'Education', 'Travel',
  'Family', 'Personal', 'Other',
];

const DEFAULT_INCOME_CATEGORIES = [
  'Salary', 'Freelance', 'Bonus', 'Investment', 'Gift', 'Other',
];

export async function initializeDefaults(): Promise<void> {
  // Only initialize if no categories exist
  if (categoryStore.count() === 0) {
    for (const name of DEFAULT_EXPENSE_CATEGORIES) {
      await categoryStore.create({ id: generateId(), name, type: 'expense', isDefault: true });
    }
    for (const name of DEFAULT_INCOME_CATEGORIES) {
      await categoryStore.create({ id: generateId(), name, type: 'income', isDefault: true });
    }
  }

  // Create default Cash account if none exist
  if (accountStore.count() === 0) {
    await addAccount({ name: 'Cash', type: 'cash', openingBalance: 0 });
  }
}

export async function clearAllData(): Promise<void> {
  await sendDataAction({ action: 'clear-all', collection: 'profile' });
  await loadUserData();
}

export function getDataSummary(): {
  transactions: number;
  goals: number;
  tasks: number;
  accounts: number;
  trackingEntries: number;
} {
  return {
    transactions: transactionStore.count(),
    goals: goalStore.count(),
    tasks: taskStore.count(),
    accounts: accountStore.count(),
    trackingEntries: getTrackingEntries().length,
  };
}
