import React, { useState } from 'react';
import { Group, Person, Expense, EXPENSE_CATEGORIES } from '../types';
import { DocumentAddIcon, UserPlusIcon, CategoryIcon, SettleUpIcon } from './ui/Icons';
import { calculateBalances, simplifyDebts } from '../services/balanceService';
import Avatar from './ui/Avatar';
import LineChart from './ui/LineChart';

interface GroupViewProps {
  group: Group;
  persons: Person[];
  expenses: Expense[];
  onAddExpense: () => void;
  onAddMembers: () => void;
  onSettleUp: () => void;
}

const GroupView: React.FC<GroupViewProps> = ({ group, persons, expenses, onAddExpense, onAddMembers, onSettleUp }) => {
  const [filterCategoryId, setFilterCategoryId] = useState<string>('all');

  const groupMembers = persons.filter(p => group.memberIds.includes(p.id));
  const groupExpenses = expenses.filter(e => e.groupId === group.id);
  const balances = calculateBalances(groupMembers, groupExpenses);
  const simplifiedDebts = simplifyDebts(balances);
  const getPersonName = (id: string) => persons.find(p => p.id === id)?.name || 'Unknown';
  const getCategoryName = (id?: string) => EXPENSE_CATEGORIES.find(c => c.id === id)?.name || 'Other';

  const totalOwed = Array.from(balances.values()).filter(v => v > 0).reduce((sum, v) => sum + v, 0);
  const totalDebt = Array.from(balances.values()).filter(v => v < 0).reduce((sum, v) => sum + v, 0);
  const spendingExpenses = groupExpenses.filter(e => e.categoryId !== 'settle');
  const groupTotalSpending = spendingExpenses.reduce((sum, expense) => sum + expense.amount, 0);

  const filteredExpenses = groupExpenses.filter(expense => {
      if (filterCategoryId === 'all') return true;
      return expense.categoryId === filterCategoryId;
  });

  const chartSpendingExpenses = groupExpenses
    .filter(e => e.categoryId !== 'settle')
    .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());

  let cumulativeAmount = 0;
  const chartData = chartSpendingExpenses.map(expense => {
    cumulativeAmount += expense.amount;
    return {
      date: new Date(expense.date),
      value: cumulativeAmount,
    };
  });

  if (chartData.length > 0) {
    const firstExpenseDate = chartData[0].date;
    const dayBeforeFirstExpense = new Date(firstExpenseDate.getTime());
    dayBeforeFirstExpense.setDate(firstExpenseDate.getDate() - 1);
    
    chartData.unshift({
      date: dayBeforeFirstExpense,
      value: 0
    });
  } else {
    const today = new Date();
    const yesterday = new Date();
    yesterday.setDate(today.getDate() - 1);
    chartData.push({ date: yesterday, value: 0 }, { date: today, value: 0 });
  }

  return (
    <div className="p-4 md:p-8 space-y-6">
      <header className="flex justify-between items-start">
        <div>
          <h1 className="text-3xl font-bold text-brand-dark">{group.name}</h1>
          <div className="flex -space-x-2 overflow-hidden mt-2">
            {groupMembers.map(m => (
                <Avatar key={m.id} person={m} className="inline-block h-8 w-8 rounded-full ring-2 ring-white" />
            ))}
            {groupMembers.length > 0 && <div className="inline-block h-8 w-8 rounded-full ring-2 ring-white bg-gray-200 flex items-center justify-center text-xs font-medium text-gray-600">
                +{groupMembers.length}
            </div>}
          </div>
        </div>
        <div className="flex items-center space-x-2 flex-shrink-0">
          <button
            onClick={onSettleUp}
            disabled={simplifiedDebts.length === 0}
            className="flex items-center space-x-2 bg-green-500 text-white px-4 py-2 rounded-md hover:bg-green-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500 disabled:bg-gray-400 disabled:cursor-not-allowed"
          >
            <SettleUpIcon className="w-5 h-5"/>
            <span>Settle Up</span>
          </button>
          <button
            onClick={onAddMembers}
            className="flex items-center space-x-2 bg-brand-accent text-white px-4 py-2 rounded-md hover:bg-blue-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-brand-accent"
          >
            <UserPlusIcon className="w-5 h-5"/>
            <span>Add Members</span>
          </button>
          <button
            onClick={onAddExpense}
            className="flex items-center space-x-2 bg-brand-primary text-white px-4 py-2 rounded-md hover:bg-brand-secondary focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-brand-primary"
          >
            <DocumentAddIcon className="w-5 h-5"/>
            <span>Add Expense</span>
          </button>
        </div>
      </header>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-white p-4 rounded-lg shadow-md">
            <h3 className="text-sm font-semibold text-gray-500">Group Spending</h3>
            <p className="text-2xl font-bold text-brand-dark">${groupTotalSpending.toFixed(2)}</p>
        </div>
        <div className="bg-white p-4 rounded-lg shadow-md">
            <h3 className="text-sm font-semibold text-green-600">Total Owed in Group</h3>
            <p className="text-2xl font-bold text-green-600">${totalOwed.toFixed(2)}</p>
        </div>
        <div className="bg-white p-4 rounded-lg shadow-md">
            <h3 className="text-sm font-semibold text-red-600">Total Debt in Group</h3>
            <p className="text-2xl font-bold text-red-600">${Math.abs(totalDebt).toFixed(2)}</p>
        </div>
      </div>
      
      <div className="bg-white p-4 md:p-6 rounded-lg shadow-md">
        <h2 className="text-xl font-bold text-brand-dark mb-4">Total Expense Over Time</h2>
        <div className="h-64">
          <LineChart data={chartData} />
        </div>
      </div>

      <div>
        <div className="flex justify-between items-center mb-4">
            <h2 className="text-2xl font-bold text-brand-dark">Expenses</h2>
            <div>
                <select
                    value={filterCategoryId}
                    onChange={(e) => setFilterCategoryId(e.target.value)}
                    className="block w-full pl-3 pr-10 py-2 text-base border-gray-300 focus:outline-none focus:ring-brand-primary focus:border-brand-primary sm:text-sm rounded-md"
                >
                    <option value="all">All Categories</option>
                    {EXPENSE_CATEGORIES.map(cat => (
                        <option key={cat.id} value={cat.id}>{cat.name}</option>
                    ))}
                </select>
            </div>
        </div>
        <div className="bg-white rounded-lg shadow-md">
          {filteredExpenses.length > 0 ? (
            <ul className="divide-y divide-gray-200">
              {filteredExpenses.sort((a,b) => new Date(b.date).getTime() - new Date(a.date).getTime()).map(expense => (
                <li key={expense.id} className="p-4 flex items-center">
                  <div className="mr-4 p-2 bg-brand-light rounded-full">
                     <CategoryIcon categoryId={expense.categoryId} className="w-6 h-6 text-brand-primary" />
                  </div>
                  <div className="flex-grow">
                    <p className="font-semibold text-gray-800">{expense.description}</p>
                    <div className="text-sm text-gray-500 flex items-center space-x-2">
                        <span>{getCategoryName(expense.categoryId)}</span>
                        <span>&bull;</span>
                        <span>Paid by {getPersonName(expense.paidById)}</span>
                         <span>&bull;</span>
                        <span>{new Date(expense.date).toLocaleDateString()}</span>
                    </div>
                  </div>
                  <span className="font-bold text-lg text-brand-dark">${expense.amount.toFixed(2)}</span>
                </li>
              ))}
            </ul>
          ) : (
             <div className="text-center py-10">
                <h3 className="text-xl font-semibold text-gray-700">{groupExpenses.length > 0 ? 'No Expenses in this Category' : 'No Expenses Yet'}</h3>
                <p className="text-gray-500 mt-2">{groupExpenses.length > 0 ? 'Select another category to see more.' : 'Add an expense to get started with this group.'}</p>
                 {groupExpenses.length === 0 && (
                    <button
                        onClick={onAddExpense}
                        className="mt-4 flex mx-auto items-center space-x-2 bg-brand-primary text-white px-4 py-2 rounded-md hover:bg-brand-secondary focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-brand-primary"
                    >
                        <DocumentAddIcon className="w-5 h-5"/>
                        <span>Add First Expense</span>
                    </button>
                 )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default GroupView;
