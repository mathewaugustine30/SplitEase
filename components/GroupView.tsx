
import React, { useState } from 'react';
import { Group, Person, Expense, EXPENSE_CATEGORIES } from '../types';
import { DocumentAddIcon, UserPlusIcon, FoodIcon, TravelIcon, UtilitiesIcon, EntertainmentIcon, TagIcon, SettleUpIcon } from './ui/Icons';
import { calculateBalances, simplifyDebts } from '../services/balanceService';
import Avatar from './ui/Avatar';

interface GroupViewProps {
  group: Group;
  friends: Person[];
  expenses: Expense[];
  onAddExpense: () => void;
  onAddMembers: () => void;
  onSettleUp: () => void;
}

const CategoryIcon: React.FC<{ categoryId?: string, className?: string }> = ({ categoryId, className="w-5 h-5" }) => {
    const category = EXPENSE_CATEGORIES.find(c => c.id === categoryId);
    if (!category) return <TagIcon className={className} />;

    switch(category.icon) {
        case 'food': return <FoodIcon className={className} />;
        case 'travel': return <TravelIcon className={className} />;
        case 'utilities': return <UtilitiesIcon className={className} />;
        case 'entertainment': return <EntertainmentIcon className={className} />;
        case 'settle': return <SettleUpIcon className={className} />;
        default: return <TagIcon className={className} />;
    }
}


const GroupView: React.FC<GroupViewProps> = ({ group, friends, expenses, onAddExpense, onAddMembers, onSettleUp }) => {
  const [filterCategoryId, setFilterCategoryId] = useState<string>('all');

  const groupMembers = friends.filter(f => group.memberIds.includes(f.id));
  const groupExpenses = expenses.filter(e => e.groupId === group.id);
  const balances = calculateBalances(groupMembers, groupExpenses);
  const simplifiedDebts = simplifyDebts(balances);
  const getPersonName = (id: string) => friends.find(f => f.id === id)?.name || 'Unknown';
  const getCategoryName = (id?: string) => EXPENSE_CATEGORIES.find(c => c.id === id)?.name || 'Other';

  const filteredExpenses = groupExpenses.filter(expense => {
      if (filterCategoryId === 'all') return true;
      return expense.categoryId === filterCategoryId;
  });

  return (
    <div className="p-4 md:p-8 space-y-6">
      <header className="flex justify-between items-start">
        <div>
          <h1 className="text-3xl font-bold text-brand-dark">{group.name}</h1>
          <div className="flex -space-x-2 overflow-hidden mt-2">
            {groupMembers.map(m => (
                <Avatar key={m.id} person={m} className="inline-block h-8 w-8 rounded-full ring-2 ring-white" />
            ))}
            <div className="inline-block h-8 w-8 rounded-full ring-2 ring-white bg-gray-200 flex items-center justify-center text-xs font-medium text-gray-600">
                +{groupMembers.length}
            </div>
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