import React, { useState, useEffect } from 'react';
import Modal from '../ui/Modal';
import Avatar from '../ui/Avatar';
import { Person, Expense, EXPENSE_CATEGORIES } from '../../types';

interface AddExpenseModalProps {
  isOpen: boolean;
  onClose: () => void;
  onAddExpense: (expense: Omit<Expense, 'id'>) => void;
  groupMembers: Person[];
  groupId: string;
}

const AddExpenseModal: React.FC<AddExpenseModalProps> = ({ isOpen, onClose, onAddExpense, groupMembers, groupId }) => {
  const [description, setDescription] = useState('');
  const [amount, setAmount] = useState<number | ''>('');
  const [paidByUid, setPaidByUid] = useState<string>('');
  const [categoryId, setCategoryId] = useState<string>('');
  const [date, setDate] = useState<string>('');
  const [splitMethod, setSplitMethod] = useState<'equal' | 'percentage'>('equal');
  const [splitWith, setSplitWith] = useState<Set<string>>(new Set());
  const [percentages, setPercentages] = useState<Record<string, string>>({});

  useEffect(() => {
    if (isOpen) {
      // Reset state to defaults when modal opens
      setDescription('');
      setAmount('');
      setDate(new Date().toISOString().split('T')[0]); // Default to today's date
      setSplitMethod('equal');
      const defaultCategory = EXPENSE_CATEGORIES.find(c => c.icon !== 'settle');
      setCategoryId(defaultCategory ? defaultCategory.id : 'other');

      if (groupMembers.length > 0) {
        setPaidByUid(groupMembers[0].uid);
        setSplitWith(new Set(groupMembers.map(m => m.uid)));
        const initialPercentages: Record<string, string> = {};
        groupMembers.forEach(m => {
            initialPercentages[m.uid] = '';
        });
        setPercentages(initialPercentages);
      } else {
        setPaidByUid('');
        setSplitWith(new Set());
        setPercentages({});
      }
    }
  }, [isOpen, groupMembers]);

  const handleSplitToggle = (memberId: string) => {
    setSplitWith(prev => {
      const newSet = new Set(prev);
      if (newSet.has(memberId)) {
        newSet.delete(memberId);
      } else {
        newSet.add(memberId);
      }
      return newSet;
    });
  };

  const handlePercentageChange = (memberId: string, value: string) => {
    setPercentages(prev => ({ ...prev, [memberId]: value }));
  };
  
  // FIX: Use Object.keys to ensure proper type inference for object keys.
  const totalPercentage = Object.keys(percentages)
    .filter((uid) => splitWith.has(uid))
    .reduce((sum, uid) => sum + (parseFloat(percentages[uid]) || 0), 0);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!description || !amount || amount <= 0 || !paidByUid || splitWith.size === 0) {
      return;
    }

    let split: { uid: string; amount: number }[] = [];

    if (splitMethod === 'equal') {
      const splitAmount = Number(amount) / splitWith.size;
      split = Array.from(splitWith).map((personUid: string) => ({
        uid: personUid,
        amount: splitAmount,
      }));
    } else {
      if (Math.abs(totalPercentage - 100) > 0.01) {
        alert('Total percentage for selected members must be 100%.');
        return;
      }
      split = Array.from(splitWith).map((personUid: string) => {
        const percentage = parseFloat(percentages[personUid]) || 0;
        return {
          uid: personUid,
          amount: (Number(amount) * percentage) / 100,
        };
      });
      
      const totalSplitAmount = split.reduce((sum, s) => sum + s.amount, 0);
      const difference = Number(amount) - totalSplitAmount;
      if (Math.abs(difference) > 0.001 && split.length > 0) {
        split.sort((a,b) => b.amount - a.amount);
        split[0].amount += difference;
      }
    }

    onAddExpense({
      groupId,
      description,
      amount: Number(amount),
      paidByUid,
      split,
      date: new Date(date).toISOString(),
      categoryId,
    });
    
    onClose();
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Add an Expense">
      <form onSubmit={handleSubmit}>
        <div className="space-y-4">
          <div>
            <label htmlFor="description" className="block text-sm font-medium text-gray-700">Description</label>
            <input
              type="text"
              id="description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-brand-primary focus:border-brand-primary sm:text-sm"
              placeholder="e.g., Dinner"
              required
            />
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label htmlFor="amount" className="block text-sm font-medium text-gray-700">Amount</label>
              <input
                type="number"
                id="amount"
                value={amount}
                onChange={(e) => setAmount(e.target.value === '' ? '' : parseFloat(e.target.value))}
                className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-brand-primary focus:border-brand-primary sm:text-sm"
                placeholder="0.00"
                min="0.01"
                step="0.01"
                required
              />
            </div>
             <div>
                <label htmlFor="category" className="block text-sm font-medium text-gray-700">Category</label>
                <select
                id="category"
                value={categoryId}
                onChange={(e) => setCategoryId(e.target.value)}
                className="mt-1 block w-full pl-3 pr-10 py-2 text-base border-gray-300 focus:outline-none focus:ring-brand-primary focus:border-brand-primary sm:text-sm rounded-md"
                >
                {EXPENSE_CATEGORIES.filter(c => c.icon !== 'settle').map(category => (
                    <option key={category.id} value={category.id}>{category.name}</option>
                ))}
                </select>
            </div>
          </div>
           <div>
            <label htmlFor="date" className="block text-sm font-medium text-gray-700">Date</label>
            <input
              type="date"
              id="date"
              value={date}
              onChange={(e) => setDate(e.target.value)}
              className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-brand-primary focus:border-brand-primary sm:text-sm"
              required
            />
          </div>
          <div>
            <label htmlFor="paidBy" className="block text-sm font-medium text-gray-700">Paid by</label>
            <select
              id="paidBy"
              value={paidByUid}
              onChange={(e) => setPaidByUid(e.target.value)}
              className="mt-1 block w-full pl-3 pr-10 py-2 text-base border-gray-300 focus:outline-none focus:ring-brand-primary focus:border-brand-primary sm:text-sm rounded-md"
            >
              {groupMembers.map(member => (
                <option key={member.uid} value={member.uid}>{member.name}</option>
              ))}
            </select>
          </div>
          <div className="flex items-center space-x-6">
            <span className="text-sm font-medium text-gray-700">Split Method:</span>
            <div className="flex items-center">
              <input id="split-equal" type="radio" value="equal" name="split-method" checked={splitMethod === 'equal'} onChange={() => setSplitMethod('equal')} className="h-4 w-4 text-brand-primary border-gray-300 focus:ring-brand-primary" />
              <label htmlFor="split-equal" className="ml-2 block text-sm text-gray-900">Equally</label>
            </div>
            <div className="flex items-center">
              <input id="split-percentage" type="radio" value="percentage" name="split-method" checked={splitMethod === 'percentage'} onChange={() => setSplitMethod('percentage')} className="h-4 w-4 text-brand-primary border-gray-300 focus:ring-brand-primary" />
              <label htmlFor="split-percentage" className="ml-2 block text-sm text-gray-900">By Percentage</label>
            </div>
          </div>
          {splitMethod === 'equal' && (
            <div>
              <label className="block text-sm font-medium text-gray-700">Split between</label>
              <div className="mt-2 max-h-40 overflow-y-auto border border-gray-200 rounded-md p-2 space-y-2">
                {groupMembers.map(member => (
                  <div key={member.uid} className="flex items-center">
                    <input id={`split-equal-${member.uid}`} type="checkbox" checked={splitWith.has(member.uid)} onChange={() => handleSplitToggle(member.uid)} className="h-4 w-4 text-brand-primary border-gray-300 rounded focus:ring-brand-primary"/>
                    <label htmlFor={`split-equal-${member.uid}`} className="ml-3 flex items-center text-sm text-gray-900 cursor-pointer">
                      <Avatar person={member} className="w-6 h-6 mr-2" />
                      {member.name}
                    </label>
                  </div>
                ))}
              </div>
            </div>
          )}
          {splitMethod === 'percentage' && (
            <div>
              <div className="flex justify-between items-center mb-1">
                <label className="block text-sm font-medium text-gray-700">Split by percentage</label>
                <span className={`text-sm font-medium ${Math.abs(totalPercentage - 100) < 0.01 ? 'text-green-600' : 'text-red-600'}`}>
                    Total: {totalPercentage.toFixed(2)}%
                </span>
              </div>
              <div className="mt-2 max-h-40 overflow-y-auto border border-gray-200 rounded-md p-2 space-y-2">
                {groupMembers.map(member => (
                  <div key={member.uid} className="flex items-center justify-between space-x-2">
                      <div className="flex items-center flex-grow">
                          <input id={`split-perc-${member.uid}`} type="checkbox" checked={splitWith.has(member.uid)} onChange={() => handleSplitToggle(member.uid)} className="h-4 w-4 text-brand-primary border-gray-300 rounded focus:ring-brand-primary" />
                          <label htmlFor={`split-perc-${member.uid}`} className="ml-3 flex items-center text-sm text-gray-900 cursor-pointer truncate">
                             <Avatar person={member} className="w-6 h-6 mr-2" />
                            {member.name}
                          </label>
                      </div>
                      <div className="relative w-24">
                          <input type="number" placeholder="0" min="0" max="100" step="0.01" value={percentages[member.uid]} onChange={(e) => handlePercentageChange(member.uid, e.target.value)} disabled={!splitWith.has(member.uid)} className="w-full text-right pr-6 block px-2 py-1 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-brand-primary focus:border-brand-primary sm:text-sm disabled:bg-gray-100" />
                          <span className="absolute inset-y-0 right-0 pr-2 flex items-center text-gray-500 text-sm">%</span>
                      </div>
                  </div>
                ))}
              </div>
              {Math.abs(totalPercentage - 100) > 0.01 && splitWith.size > 0 && <p className="text-xs text-red-500 mt-1">Total percentage for selected members must be 100%.</p>}
            </div>
          )}
          <div className="flex justify-end pt-2">
            <button
              type="submit"
              className="bg-brand-primary text-white px-4 py-2 rounded-md hover:bg-brand-secondary focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-brand-primary"
            >
              Add Expense
            </button>
          </div>
        </div>
      </form>
    </Modal>
  );
};

export default AddExpenseModal;