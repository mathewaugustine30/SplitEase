import React from 'react';
import { Person, Expense, SimplifiedDebt, EXPENSE_CATEGORIES } from '../types';
import { calculateBalances, simplifyDebts } from '../services/balanceService';
import Avatar from './ui/Avatar';
import { CategoryIcon } from './ui/Icons';

interface DashboardProps {
  persons: Person[];
  expenses: Expense[];
}

const formatCurrency = (amount: number): string => {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
  }).format(amount);
};

const Dashboard: React.FC<DashboardProps> = ({ persons, expenses }) => {
  // Balance calculations must include settlements to be accurate
  const balances = calculateBalances(persons, expenses);
  const simplifiedDebts = simplifyDebts(balances);

  // Spending calculations should exclude settlements for a true spending overview
  const spendingExpenses = expenses.filter(e => e.categoryId !== 'settle');

  const getPerson = (id: string) => persons.find(f => f.id === id);

  const totalOwed = Array.from(balances.values()).filter(v => v > 0).reduce((sum, v) => sum + v, 0);
  const totalDebt = Array.from(balances.values()).filter(v => v < 0).reduce((sum, v) => sum + v, 0);
  const totalSpending = spendingExpenses.reduce((sum, expense) => sum + expense.amount, 0);
  
  const categoryTotals = spendingExpenses.reduce((acc, expense) => {
    const categoryId = expense.categoryId || 'other';
    const currentTotal = acc[categoryId] || 0;
    acc[categoryId] = currentTotal + expense.amount;
    return acc;
  }, {} as Record<string, number>);

  const categoryData = EXPENSE_CATEGORIES
      .map(category => ({
          ...category,
          total: categoryTotals[category.id] || 0,
      }))
      .filter(category => category.total > 0 && category.icon !== 'settle')
      .sort((a, b) => b.total - a.total);


  return (
    <div className="p-4 md:p-8 space-y-8">
      <header>
        <h1 className="text-3xl font-bold text-brand-dark">Dashboard</h1>
        <p className="text-gray-600">A summary of your shared expenses.</p>
      </header>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white p-6 rounded-lg shadow-md">
          <h3 className="text-lg font-semibold text-brand-accent">Total Spending</h3>
          <p className="text-3xl font-bold text-brand-accent">{formatCurrency(totalSpending)}</p>
        </div>
        <div className="bg-white p-6 rounded-lg shadow-md">
          <h3 className="text-lg font-semibold text-green-600">Total you are owed</h3>
          <p className="text-3xl font-bold text-green-600">{formatCurrency(totalOwed)}</p>
        </div>
        <div className="bg-white p-6 rounded-lg shadow-md">
          <h3 className="text-lg font-semibold text-red-600">Total you owe</h3>
          <p className="text-3xl font-bold text-red-600">{formatCurrency(Math.abs(totalDebt))}</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <div>
          <h2 className="text-2xl font-bold text-brand-dark mb-4">Who Owes Whom</h2>
          <div className="bg-white p-6 rounded-lg shadow-md">
            {simplifiedDebts.length > 0 ? (
              <ul className="space-y-4">
                {simplifiedDebts.map((debt, index) => {
                  const fromPerson = getPerson(debt.from);
                  const toPerson = getPerson(debt.to);
                  if (!fromPerson || !toPerson) return null;

                  return (
                    <li key={index} className="flex items-center justify-between p-3 bg-gray-50 rounded-md">
                      <div className="flex items-center space-x-3">
                        <Avatar person={fromPerson} className="w-10 h-10" />
                        <div className="flex items-center space-x-2">
                          <span className="font-semibold text-brand-accent">{fromPerson.name}</span>
                          <span className="text-gray-500">→</span>
                          <span className="font-semibold text-brand-primary">{toPerson.name}</span>
                        </div>
                      </div>
                      <span className="font-bold text-lg text-brand-dark">{formatCurrency(debt.amount)}</span>
                    </li>
                  );
                })}
              </ul>
            ) : (
              <p className="text-gray-500 text-center py-4">All settled up! No outstanding debts.</p>
            )}
          </div>
        </div>
        <div>
            <h2 className="text-2xl font-bold text-brand-dark mb-4">Spending by Category</h2>
            <div className="bg-white p-6 rounded-lg shadow-md">
              {categoryData.length > 0 ? (
                  <ul className="space-y-4">
                      {categoryData.map(category => {
                          const percentage = totalSpending > 0 ? (category.total / totalSpending) * 100 : 0;
                          return (
                              <li key={category.id}>
                                  <div className="flex justify-between items-center mb-1 text-sm">
                                      <div className="flex items-center space-x-2">
                                          <CategoryIcon categoryId={category.id} className="w-5 h-5 text-gray-500" />
                                          <span className="font-medium text-gray-700">{category.name}</span>
                                      </div>
                                      <span className="font-semibold text-brand-dark">{formatCurrency(category.total)}</span>
                                  </div>
                                  <div className="w-full h-2 bg-gray-200 rounded-full">
                                      <div className="h-2 bg-brand-primary rounded-full" style={{ width: `${percentage}%` }}></div>
                                  </div>
                              </li>
                          )
                      })}
                  </ul>
              ) : (
                  <p className="text-gray-500 text-center py-4">No spending data available yet.</p>
              )}
            </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;