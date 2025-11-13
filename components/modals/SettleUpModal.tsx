
import React from 'react';
import Modal from '../ui/Modal';
import { Person, Group, Expense } from '../../types';
import { calculateBalances, simplifyDebts } from '../../services/balanceService';
import Avatar from '../ui/Avatar';

interface SettleUpModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  group?: Group;
  friends: Person[];
  expenses: Expense[];
}

const SettleUpModal: React.FC<SettleUpModalProps> = ({ isOpen, onClose, onConfirm, group, friends, expenses }) => {
    if (!group) return null;

    const groupExpenses = expenses.filter(e => e.groupId === group.id);
    const groupMembers = friends.filter(f => group.memberIds.includes(f.id));
    const balances = calculateBalances(groupMembers, groupExpenses);
    const simplifiedDebts = simplifyDebts(balances);
    const getPerson = (id: string) => friends.find(f => f.id === id);

    return (
        <Modal isOpen={isOpen} onClose={onClose} title={`Settle debts in ${group.name}`}>
            <div className="space-y-4">
                <p className="text-sm text-gray-600">
                    This will add settlement transactions to the expense list to balance all debts. This action cannot be easily undone.
                </p>
                <div>
                    <h4 className="font-semibold text-gray-800 mb-2">Debts to be settled:</h4>
                    {simplifiedDebts.length > 0 ? (
                        <ul className="space-y-2">
                            {simplifiedDebts.map((debt, index) => {
                                const fromPerson = getPerson(debt.from);
                                const toPerson = getPerson(debt.to);
                                if (!fromPerson || !toPerson) return null;
                                
                                return (
                                <li key={index} className="flex items-center justify-between p-2 bg-gray-100 rounded">
                                    <div className="flex items-center space-x-2">
                                        <Avatar person={fromPerson} className="w-6 h-6" />
                                        <span className="font-medium text-brand-accent">{fromPerson.name}</span>
                                        <span>→</span>
                                        <Avatar person={toPerson} className="w-6 h-6" />
                                        <span className="font-medium text-brand-primary">{toPerson.name}</span>
                                    </div>
                                    <span className="font-bold text-gray-800">${debt.amount.toFixed(2)}</span>
                                </li>
                            )})}
                        </ul>
                    ) : (
                        <p className="text-gray-500">There are no outstanding debts to settle in this group.</p>
                    )}
                </div>
                <div className="flex justify-end pt-2 space-x-2">
                    <button
                        onClick={onClose}
                        className="bg-gray-200 text-gray-800 px-4 py-2 rounded-md hover:bg-gray-300 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-400"
                    >
                        Cancel
                    </button>
                    <button
                        onClick={onConfirm}
                        disabled={simplifiedDebts.length === 0}
                        className="bg-brand-primary text-white px-4 py-2 rounded-md hover:bg-brand-secondary disabled:bg-gray-400 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-brand-primary"
                    >
                        Settle Up
                    </button>
                </div>
            </div>
        </Modal>
    );
};

export default SettleUpModal;