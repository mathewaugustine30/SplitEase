export interface Person {
  id: string;
  name: string;
  avatarUrl?: string;
}

export interface Group {
  id: string;
  name: string;
  memberIds: string[];
}

export interface SplitDetail {
  personId: string;
  amount: number;
}

export interface Expense {
  id:string;
  groupId: string;
  description: string;
  amount: number;
  paidById: string;
  split: SplitDetail[];
  date: string; // ISO string
  categoryId?: string;
}

export interface SimplifiedDebt {
  from: string; // personId
  to: string; // personId
  amount: number;
}

export interface Category {
    id: string;
    name: string;
    icon: 'food' | 'travel' | 'utilities' | 'entertainment' | 'other' | 'settle';
}

export const EXPENSE_CATEGORIES: Category[] = [
    { id: 'food', name: 'Food & Dining', icon: 'food' },
    { id: 'travel', name: 'Travel', icon: 'travel' },
    { id: 'utilities', name: 'Utilities', icon: 'utilities' },
    { id: 'entertainment', name: 'Entertainment', icon: 'entertainment' },
    { id: 'settle', name: 'Settle Up', icon: 'settle' },
    { id: 'other', name: 'Other', icon: 'other' },
];

export interface User {
  email: string;
  password: string;
}
