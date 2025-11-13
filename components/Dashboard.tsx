
import React from 'react';
import { Person, Expense, SimplifiedDebt } from '../types';
import { calculateBalances, simplifyDebts } from '../services/balanceService';
import Avatar from './ui/Avatar';

interface DashboardProps {
  friends: Person[];
  expenses: Expense[];
}

const Dashboard: React.FC<DashboardProps> = ({ friends, expenses }) => {
  const balances = calculateBalances(friends, expenses);
  const simplifiedDebts = simplifyDebts(balances);

  const getPerson = (id: string) => friends.find(f => f.id === id);

  const totalOwed = Array.from(balances.values()).filter(v => v > 0).reduce((sum, v) => sum + v, 0);
  const totalDebt = Array.from(balances.values()).filter(v => v < 0).reduce((sum, v) => sum + v, 0);
  const totalExpenses = expenses.reduce((sum, expense) => sum + expense.amount, 0);

  return (
    <div className="p-4 md:p-8 space-y-8">
      <header>
        <h1 className="text-3xl font-bold text-brand-dark">Dashboard</h1>
        <p className="text-gray-600">A summary of your shared expenses.</p>
      </header>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white p-6 rounded-lg shadow-md">
          <h3 className="text-lg font-semibold text-brand-accent">Total Spending</h3>
          <p className="text-3xl font-bold text-brand-accent">${totalExpenses.toFixed(2)}</p>
        </div>
        <div className="bg-white p-6 rounded-lg shadow-md">
          <h3 className="text-lg font-semibold text-green-600">Total you are owed</h3>
          <p className="text-3xl font-bold text-green-600">${totalOwed.toFixed(2)}</p>
        </div>
        <div className="bg-white p-6 rounded-lg shadow-md">
          <h3 className="text-lg font-semibold text-red-600">Total you owe</h3>
          <p className="text-3xl font-bold text-red-600">${Math.abs(totalDebt).toFixed(2)}</p>
        </div>
      </div>

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
                    <span className="font-bold text-lg text-brand-dark">${debt.amount.toFixed(2)}</span>
                  </li>
                );
              })}
            </ul>
          ) : (
            <p className="text-gray-500 text-center py-4">All settled up! No outstanding debts.</p>
          )}
        </div>
      </div>
    </div>
  );
};

export default Dashboard;