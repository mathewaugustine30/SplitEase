import React, { useState } from 'react';
import { Group, Person, Expense, EXPENSE_CATEGORIES, SimplifiedDebt } from '../types';
import { DocumentAddIcon, UserPlusIcon, CategoryIcon, SettleUpIcon } from './ui/Icons';
import { calculateBalances, simplifyDebts } from '../services/balanceService';
import Avatar from './ui/Avatar';
import LineChart from './ui/LineChart';
import DonutChart from './ui/DonutChart';

interface GroupViewProps {
  group: Group;
  persons: Person[];
  expenses: Expense[];
  onAddExpense: () => void;
  onAddMembers: () => void;
  onSettleUp: () => void;
  onSettleIndividualDebt: (debt: SimplifiedDebt) => void;
}

const formatCurrency = (amount: number): string => {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
  }).format(amount);
};

const GroupView: React.FC<GroupViewProps> = ({ group, persons, expenses, onAddExpense, onAddMembers, onSettleUp, onSettleIndividualDebt }) => {
  const [filterCategoryId, setFilterCategoryId] = useState<string>('all');

  const groupMembers = persons.filter(p => group.memberIds.includes(p.id));
  const groupExpenses = expenses.filter(e => e.groupId === group.id);
  const balances = calculateBalances(groupMembers, groupExpenses);
  const simplifiedDebts = simplifyDebts(balances);
  const getPerson = (id: string) => persons.find(p => p.id === id);
  const getPersonName = (id: string) => getPerson(id)?.name || 'Unknown';
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
  
  const categoryTotals = spendingExpenses.reduce((acc, expense) => {
    const categoryId = expense.categoryId || 'other';
    acc[categoryId] = (acc[categoryId] || 0) + expense.amount;
    return acc;
  }, {} as Record<string, number>);

  const categoryColors: { [key: string]: string } = {
    food: '#F59E0B',
    travel: '#3B82F6',
    utilities: '#10B981',
    entertainment: '#EC4899',
    settle: '#6B7280',
    other: '#8B5CF6',
  };

  // FIX: Use Object.keys to avoid type inference issues with Object.entries that caused a compile error on the sort method.
  const donutChartData = Object.keys(categoryTotals)
    .map((categoryId) => {
        const total = categoryTotals[categoryId];
        const category = EXPENSE_CATEGORIES.find(c => c.id === categoryId);
        return {
            name: category?.name || 'Other',
            value: total,
            color: categoryColors[categoryId] || categoryColors.other,
        };
    })
    .sort((a, b) => b.value - a.value);

  return (
    <div className="p-4 md:p-8 space-y-6">
      <header className="flex flex-col md:flex-row justify-between md:items-center gap-4">
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
        <div className="flex flex-col sm:flex-row gap-2 w-full sm:w-auto">
          <button
            onClick={onSettleUp}
            disabled={simplifiedDebts.length === 0}
            className="flex items-center justify-center space-x-2 bg-green-500 text-white px-4 py-2 rounded-md hover:bg-green-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500 disabled:bg-gray-400 disabled:cursor-not-allowed"
          >
            <SettleUpIcon className="w-5 h-5"/>
            <span>Settle Up</span>
          </button>
          <button
            onClick={onAddMembers}
            className="flex items-center justify-center space-x-2 bg-brand-accent text-white px-4 py-2 rounded-md hover:bg-blue-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-brand-accent"
          >
            <UserPlusIcon className="w-5 h-5"/>
            <span>Add Members</span>
          </button>
          <button
            onClick={onAddExpense}
            className="flex items-center justify-center space-x-2 bg-brand-primary text-white px-4 py-2 rounded-md hover:bg-brand-secondary focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-brand-primary"
          >
            <DocumentAddIcon className="w-5 h-5"/>
            <span>Add Expense</span>
          </button>
        </div>
      </header>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-white p-4 rounded-lg shadow-md">
            <h3 className="text-sm font-semibold text-gray-500">Group Spending</h3>
            <p className="text-2xl font-bold text-brand-dark">{formatCurrency(groupTotalSpending)}</p>
        </div>
        <div className="bg-white p-4 rounded-lg shadow-md">
            <h3 className="text-sm font-semibold text-green-600">Total Owed in Group</h3>
            <p className="text-2xl font-bold text-green-600">{formatCurrency(totalOwed)}</p>
        </div>
        <div className="bg-white p-4 rounded-lg shadow-md">
            <h3 className="text-sm font-semibold text-red-600">Total Debt in Group</h3>
            <p className="text-2xl font-bold text-red-600">{formatCurrency(Math.abs(totalDebt))}</p>
        </div>
      </div>
      
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white p-4 md:p-6 rounded-lg shadow-md">
          <h2 className="text-xl font-bold text-brand-dark mb-4">Total Expense Over Time</h2>
          <div className="h-64">
            <LineChart data={chartData} />
          </div>
        </div>
        <div className="bg-white p-4 md:p-6 rounded-lg shadow-md">
          <h2 className="text-xl font-bold text-brand-dark mb-4">Expense Breakdown</h2>
          <div className="h-64">
            <DonutChart data={donutChartData} />
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div>
            <h2 className="text-2xl font-bold text-brand-dark mb-4">Who Owes Whom</h2>
            <div className="bg-white p-4 md:p-6 rounded-lg shadow-md">
                {simplifiedDebts.length > 0 ? (
                <ul className="space-y-4">
                    {simplifiedDebts.map((debt, index) => {
                    const fromPerson = getPerson(debt.from);
                    const toPerson = getPerson(debt.to);
                    if (!fromPerson || !toPerson) return null;

                    return (
                        <li key={index} className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between p-3 bg-gray-50 rounded-md gap-2">
                            <div className="flex items-center space-x-3">
                                <Avatar person={fromPerson} className="w-8 h-8" />
                                <div className="flex items-center space-x-2 text-sm">
                                    <span className="font-semibold text-brand-accent">{fromPerson.name}</span>
                                    <span className="text-gray-500">→</span>
                                    <span className="font-semibold text-brand-primary">{toPerson.name}</span>
                                </div>
                            </div>
                            <div className="flex items-center justify-between sm:justify-end sm:space-x-3">
                                <span className="font-bold text-md text-brand-dark">{formatCurrency(debt.amount)}</span>
                                <button
                                    onClick={() => onSettleIndividualDebt(debt)}
                                    className="px-3 py-1 text-xs font-semibold text-white bg-brand-primary rounded-md hover:bg-brand-secondary focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-brand-primary"
                                >
                                    Settle
                                </button>
                            </div>
                        </li>
                    );
                    })}
                </ul>
                ) : (
                <p className="text-gray-500 text-center py-4">All settled up in this group!</p>
                )}
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
                    <span className="font-bold text-lg text-brand-dark">{formatCurrency(expense.amount)}</span>
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
    </div>
  );
};

export default GroupView;