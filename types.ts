export interface Person {
  uid: string;
  name: string;
  email?: string;
  avatarUrl?: string;
}

export interface Group {
  id: string;
  name: string;
  memberUids: string[];
}

export interface SplitDetail {
  uid: string;
  amount: number;
}

export interface Expense {
  id:string;
  groupId: string;
  description: string;
  amount: number;
  paidByUid: string;
  split: SplitDetail[];
  date: string; // ISO string
  categoryId?: string;
}

export interface SimplifiedDebt {
  from: string; // person uid
  to: string; // person uid
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