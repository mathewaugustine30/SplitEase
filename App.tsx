import React, { useState } from 'react';
import { Person, Group, Expense, SimplifiedDebt } from './types';
import Sidebar from './components/Sidebar';
import Dashboard from './components/Dashboard';
import GroupView from './components/GroupView';
import AddFriendModal from './components/modals/AddFriendModal';
import AddGroupModal from './components/modals/AddGroupModal';
import AddExpenseModal from './components/modals/AddExpenseModal';
import AddMembersModal from './components/modals/AddMembersModal';
import SettleUpModal from './components/modals/SettleUpModal';
import { calculateBalances, simplifyDebts } from './services/balanceService';
import AuthLayout from './components/auth/AuthLayout';
import LoginPage from './components/auth/LoginPage';
import SignupPage from './components/auth/SignupPage';
import ForgotPasswordPage from './components/auth/ForgotPasswordPage';

// Firebase imports
import { auth, db } from './firebaseConfig';
import { useAuthState } from 'react-firebase-hooks/auth';
import { useCollectionData } from 'react-firebase-hooks/firestore';
import { User as FirebaseUser, signOut } from 'firebase/auth';
import { collection, addDoc, doc, updateDoc, query, orderBy } from 'firebase/firestore';


type ModalType = 'addFriend' | 'addGroup' | 'addExpense' | 'addMembers' | 'settleUp' | null;
type ViewType = { view: 'dashboard' | 'group'; id: string | null };
type AuthPageType = 'login' | 'signup' | 'forgot';

// Main application component, rendered after successful login
function MainApp({ user }: { user: FirebaseUser }) {
  const friendsRef = collection(db, 'users', user.uid, 'friends');
  const groupsRef = collection(db, 'users', user.uid, 'groups');
  const expensesRef = collection(db, 'users', user.uid, 'expenses');

  const [friendsData, friendsLoading] = useCollectionData<Person>(friendsRef, { idField: 'id' });
  const [groupsData, groupsLoading] = useCollectionData<Group>(groupsRef, { idField: 'id' });
  const [expensesData, expensesLoading] = useCollectionData<Expense>(query(expensesRef, orderBy('date', 'desc')), { idField: 'id' });

  const friends = friendsData || [];
  const groups = groupsData || [];
  const expenses = expensesData || [];
  
  const [activeModal, setActiveModal] = useState<ModalType>(null);
  const [activeView, setActiveView] = useState<ViewType>({ view: 'dashboard', id: null });

  const currentUserPerson: Person = { id: user.uid, name: 'You', avatarUrl: user.photoURL || undefined };
  const allPersons = [currentUserPerson, ...friends];

  const handleAddFriend = async (friend: Omit<Person, 'id'>) => {
    await addDoc(friendsRef, friend);
  };

  const handleAddGroup = async (group: Omit<Group, 'id'>) => {
    await addDoc(groupsRef, group);
  };

  const handleAddExpense = async (expense: Omit<Expense, 'id'>) => {
    await addDoc(expensesRef, expense);
  };

  const handleAddMembersToGroup = async (groupId: string, newMemberIds: string[]) => {
    const groupDocRef = doc(db, 'users', user.uid, 'groups', groupId);
    const group = groups.find(g => g.id === groupId);
    if(group) {
        const updatedMemberIds = Array.from(new Set([...group.memberIds, ...newMemberIds]));
        await updateDoc(groupDocRef, { memberIds: updatedMemberIds });
    }
  };
  
  const selectedGroup = groups.find(g => g.id === activeView.id);

  const handleSettleUp = async () => {
    if (!selectedGroup) return;

    const groupExpenses = expenses.filter(e => e.groupId === selectedGroup.id);
    const groupMembers = allPersons.filter(f => selectedGroup.memberIds.includes(f.id));
    const balances = calculateBalances(groupMembers, groupExpenses);
    const simplifiedDebts = simplifyDebts(balances);

    if (simplifiedDebts.length === 0) {
        setActiveModal(null);
        return;
    }

    const getPersonName = (id: string) => allPersons.find(f => f.id === id)?.name || 'Unknown';

    const settlementPromises = simplifiedDebts.map(debt => {
        const newExpense: Omit<Expense, 'id'> = {
            groupId: selectedGroup.id,
            description: `Settle up: ${getPersonName(debt.from)} paid ${getPersonName(debt.to)}`,
            amount: debt.amount,
            paidById: debt.from,
            split: [{ personId: debt.to, amount: debt.amount }],
            date: new Date().toISOString(),
            categoryId: 'settle',
        };
        return addDoc(expensesRef, newExpense);
    });
    
    await Promise.all(settlementPromises);
    setActiveModal(null);
  };

  const handleSettleIndividualDebt = async (groupId: string, debt: SimplifiedDebt) => {
    const getPersonName = (id: string) => allPersons.find(p => p.id === id)?.name || 'Unknown';

    const settlementExpense: Omit<Expense, 'id'> = {
      groupId: groupId,
      description: `Settle up: ${getPersonName(debt.from)} paid ${getPersonName(debt.to)}`,
      amount: debt.amount,
      paidById: debt.from,
      split: [{ personId: debt.to, amount: debt.amount }],
      date: new Date().toISOString(),
      categoryId: 'settle',
    };
    
    await addDoc(expensesRef, settlementExpense);
  };
  
  const handleLogout = async () => {
    await signOut(auth);
  };

  if (friendsLoading || groupsLoading || expensesLoading) {
      return (
          <div className="flex h-screen w-screen items-center justify-center bg-brand-light text-brand-dark">
              Loading your data...
          </div>
      );
  }

  const renderView = () => {
    if (activeView.view === 'group' && activeView.id) {
      const group = groups.find(g => g.id === activeView.id);
      if (group) {
        return <GroupView 
                  group={group} 
                  persons={allPersons} 
                  expenses={expenses} 
                  onAddExpense={() => setActiveModal('addExpense')} 
                  onAddMembers={() => setActiveModal('addMembers')}
                  onSettleUp={() => setActiveModal('settleUp')}
                  onSettleIndividualDebt={(debt) => handleSettleIndividualDebt(group.id, debt)}
                />;
      }
    }
    return <Dashboard persons={allPersons} expenses={expenses} />;
  };

  const selectedGroupMembers = allPersons.filter(f => selectedGroup?.memberIds.includes(f.id));

  return (
    <div className="flex flex-col md:flex-row min-h-screen bg-brand-light font-sans">
      <Sidebar
        friends={friends}
        groups={groups}
        onAddFriend={() => setActiveModal('addFriend')}
        onAddGroup={() => setActiveModal('addGroup')}
        onSelectView={(view, id) => setActiveView({ view, id })}
        activeView={activeView}
        currentUserEmail={user.email || "User"}
        onLogout={handleLogout}
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
        currentUserId={currentUserPerson.id}
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
          persons={allPersons}
          expenses={expenses}
        />
      )}
    </div>
  );
}

// Top-level App component handles authentication routing
function App() {
  const [user, loading] = useAuthState(auth);
  const [authPage, setAuthPage] = useState<AuthPageType>('login');

  if (loading) {
    return <div className="flex h-screen w-screen items-center justify-center bg-brand-light text-brand-dark">Authenticating...</div>
  }
  
  if (!user) {
    let page;
    switch (authPage) {
        case 'signup':
            page = <SignupPage onNavigate={setAuthPage} />;
            break;
        case 'forgot':
            page = <ForgotPasswordPage onNavigate={setAuthPage} />;
            break;
        default:
            page = <LoginPage onNavigate={setAuthPage} />;
    }
    return <AuthLayout>{page}</AuthLayout>;
  }

  return <MainApp user={user} />;
}

export default App;
