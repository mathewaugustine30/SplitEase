
import React, { useState } from 'react';
import { useLocalStorage } from './hooks/useLocalStorage';
import { Person, Group, Expense } from './types';
import Sidebar from './components/Sidebar';
import Dashboard from './components/Dashboard';
import GroupView from './components/GroupView';
import AddFriendModal from './components/modals/AddFriendModal';
import AddGroupModal from './components/modals/AddGroupModal';
import AddExpenseModal from './components/modals/AddExpenseModal';
import AddMembersModal from './components/modals/AddMembersModal';
import SettleUpModal from './components/modals/SettleUpModal';
import { calculateBalances, simplifyDebts } from './services/balanceService';

type ModalType = 'addFriend' | 'addGroup' | 'addExpense' | 'addMembers' | 'settleUp' | null;
type ViewType = { view: 'dashboard' | 'group'; id: string | null };

function App() {
  const [friends, setFriends] = useLocalStorage<Person[]>('friends', []);
  const [groups, setGroups] = useLocalStorage<Group[]>('groups', []);
  const [expenses, setExpenses] = useLocalStorage<Expense[]>('expenses', []);
  
  const [activeModal, setActiveModal] = useState<ModalType>(null);
  const [activeView, setActiveView] = useState<ViewType>({ view: 'dashboard', id: null });

  const handleAddFriend = (friend: Omit<Person, 'id'>) => {
    setFriends(prev => [...prev, { ...friend, id: crypto.randomUUID() }]);
  };

  const handleAddGroup = (group: Group) => {
    setGroups(prev => [...prev, group]);
  };

  const handleAddExpense = (expense: Omit<Expense, 'id'>) => {
    setExpenses(prev => [...prev, { ...expense, id: crypto.randomUUID() }]);
  };

  const handleAddMembersToGroup = (groupId: string, newMemberIds: string[]) => {
    setGroups(prevGroups =>
      prevGroups.map(group =>
        group.id === groupId
          ? { ...group, memberIds: [...new Set([...group.memberIds, ...newMemberIds])] }
          : group
      )
    );
  };
  
  const selectedGroup = groups.find(g => g.id === activeView.id);

  const handleSettleUp = () => {
    if (!selectedGroup) return;

    const groupExpenses = expenses.filter(e => e.groupId === selectedGroup.id);
    const groupMembers = friends.filter(f => selectedGroup.memberIds.includes(f.id));
    const balances = calculateBalances(groupMembers, groupExpenses);
    const simplifiedDebts = simplifyDebts(balances);

    if (simplifiedDebts.length === 0) {
        setActiveModal(null);
        return;
    }

    const getPersonName = (id: string) => friends.find(f => f.id === id)?.name || 'Unknown';

    const settlementExpenses: Omit<Expense, 'id'>[] = simplifiedDebts.map(debt => ({
      groupId: selectedGroup.id,
      description: `Settle up: ${getPersonName(debt.from)} paid ${getPersonName(debt.to)}`,
      amount: debt.amount,
      paidById: debt.from,
      split: [{ personId: debt.to, amount: debt.amount }],
      date: new Date().toISOString(),
      categoryId: 'settle',
    }));
    
    const newExpensesWithId = settlementExpenses.map(exp => ({ ...exp, id: crypto.randomUUID() }));

    setExpenses(prev => [...prev, ...newExpensesWithId]);
    setActiveModal(null);
  };

  const renderView = () => {
    if (activeView.view === 'group' && activeView.id) {
      const group = groups.find(g => g.id === activeView.id);
      if (group) {
        return <GroupView 
                  group={group} 
                  friends={friends} 
                  expenses={expenses} 
                  onAddExpense={() => setActiveModal('addExpense')} 
                  onAddMembers={() => setActiveModal('addMembers')}
                  onSettleUp={() => setActiveModal('settleUp')}
                />;
      }
    }
    return <Dashboard friends={friends} expenses={expenses} />;
  };

  const selectedGroupMembers = friends.filter(f => selectedGroup?.memberIds.includes(f.id));

  return (
    <div className="flex flex-col md:flex-row min-h-screen bg-gray-100 font-sans">
      <Sidebar
        friends={friends}
        groups={groups}
        onAddFriend={() => setActiveModal('addFriend')}
        onAddGroup={() => setActiveModal('addGroup')}
        onSelectView={(view, id) => setActiveView({ view, id })}
        activeView={activeView}
      />
      <main className="flex-1 overflow-y-auto">
        {renderView()}
      </main>

      <AddFriendModal
        isOpen={activeModal === 'addFriend'}
        onClose={() => setActiveModal(null)}
        onAddFriend={handleAddFriend}
      />
      <AddGroupModal
        isOpen={activeModal === 'addGroup'}
        onClose={() => setActiveModal(null)}
        onAddGroup={handleAddGroup}
        friends={friends}
      />
      {selectedGroup && (
        <AddExpenseModal
          isOpen={activeModal === 'addExpense'}
          onClose={() => setActiveModal(null)}
          onAddExpense={handleAddExpense}
          groupMembers={selectedGroupMembers}
          groupId={selectedGroup.id}
        />
      )}
      {selectedGroup && (
        <AddMembersModal
          isOpen={activeModal === 'addMembers'}
          onClose={() => setActiveModal(null)}
          onAddMembers={(memberIds) => handleAddMembersToGroup(selectedGroup.id, memberIds)}
          friends={friends}
          group={selectedGroup}
        />
      )}
      {selectedGroup && (
        <SettleUpModal
          isOpen={activeModal === 'settleUp'}
          onClose={() => setActiveModal(null)}
          onConfirm={handleSettleUp}
          group={selectedGroup}
          friends={friends}
          expenses={expenses}
        />
      )}
    </div>
  );
}

export default App;