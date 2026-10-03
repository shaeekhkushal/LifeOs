// LifeOS — Core Data Types

export interface UserProfile {
  id: string;
  name: string;
  currency: string;
  currencySymbol: string;
  theme: 'light' | 'dark' | 'system';
  isSetupComplete: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface Account {
  id: string;
  name: string;
  type: 'cash' | 'bank' | 'mobile_wallet' | 'credit_card' | 'investment' | 'other';
  openingBalance: number;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface Category {
  id: string;
  name: string;
  type: 'income' | 'expense';
  isDefault: boolean;
}

export interface Transaction {
  id: string;
  date: string;          // YYYY-MM-DD
  type: 'income' | 'expense' | 'transfer';
  categoryId: string;
  categoryName: string;  // denormalized for display
  description: string;
  amount: number;
  accountId: string;
  notes: string;
  createdAt: string;
  updatedAt: string;
}

export interface Habit {
  id: string;
  name: string;
  category: string;
  frequency: 'daily' | 'weekly';
  targetPerWeek: number;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface HabitLog {
  id: string;
  habitId: string;
  date: string;          // YYYY-MM-DD
  completed: boolean;
  notes: string;
  createdAt: string;
}

export interface Goal {
  id: string;
  title: string;
  category: string;
  targetDate: string;
  startValue: number;
  currentValue: number;
  targetValue: number;
  unit: string;
  priority: 'low' | 'medium' | 'high';
  status: 'active' | 'completed' | 'paused' | 'cancelled';
  notes: string;
  createdAt: string;
  updatedAt: string;
}

export interface Task {
  id: string;
  title: string;
  date: string;
  deadline: string;
  priority: 'low' | 'medium' | 'high';
  category: string;
  status: 'not_started' | 'in_progress' | 'completed' | 'cancelled';
  notes: string;
  createdAt: string;
  updatedAt: string;
}

export type TrackingModule =
  | 'Health'
  | 'Learning'
  | 'Career'
  | 'Travel'
  | 'Shopping'
  | 'Vehicle'
  | 'Home'
  | 'Entertainment'
  | 'Calendar';

export interface TrackingEntry {
  id: string;
  module: TrackingModule;
  title: string;
  category: string;
  date: string;
  status: string;
  value: number | null;
  unit: string;
  amount: number | null;
  notes: string;
  createdAt: string;
  updatedAt: string;
}
