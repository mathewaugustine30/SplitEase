import { Person, Expense, SimplifiedDebt } from '../types';

export const calculateBalances = (persons: Person[], expenses: Expense[]): Map<string, number> => {
  const balances = new Map<string, number>();
  persons.forEach(p => balances.set(p.uid, 0));

  expenses.forEach(expense => {
    const paidBy = expense.paidByUid;
    const amount = expense.amount;
    
    const paidByBalance = balances.get(paidBy) || 0;
    balances.set(paidBy, paidByBalance + amount);

    expense.split.forEach(s => {
      const splitPersonBalance = balances.get(s.uid) || 0;
      balances.set(s.uid, splitPersonBalance - s.amount);
    });
  });

  return balances;
};

export const simplifyDebts = (balances: Map<string, number>): SimplifiedDebt[] => {
  const debtors: { uid: string; amount: number }[] = [];
  const creditors: { uid: string; amount: number }[] = [];

  balances.forEach((amount, uid) => {
    if (amount < 0) {
      debtors.push({ uid, amount: amount });
    } else if (amount > 0) {
      creditors.push({ uid, amount: amount });
    }
  });

  debtors.sort((a, b) => a.amount - b.amount);
  creditors.sort((a, b) => b.amount - a.amount);

  const transactions: SimplifiedDebt[] = [];

  let i = 0;
  let j = 0;

  while (i < debtors.length && j < creditors.length) {
    const debtor = debtors[i];
    const creditor = creditors[j];
    const amountToSettle = Math.min(-debtor.amount, creditor.amount);

    if (amountToSettle > 0.01) { // Threshold to avoid floating point issues
        transactions.push({
            from: debtor.uid,
            to: creditor.uid,
            amount: amountToSettle,
        });

        debtor.amount += amountToSettle;
        creditor.amount -= amountToSettle;
    }

    if (Math.abs(debtor.amount) < 0.01) {
      i++;
    }
    if (Math.abs(creditor.amount) < 0.01) {
      j++;
    }
  }

  return transactions;
};