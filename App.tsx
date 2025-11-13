import React, { useState } from 'react';
import { useLocalStorage } from './hooks/useLocalStorage';
import { Person, Group, Expense, User } from './types';
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

type ModalType = 'addFriend' | 'addGroup' | 'addExpense' | 'addMembers' | 'settleUp' | null;
type ViewType = { view: 'dashboard' | 'group'; id: string | null };
type AuthPageType = 'login' | 'signup' | 'forgot';

// Main application component, rendered after successful login
function MainApp({ user, onLogout }: { user: User; onLogout: () => void; }) {
  const userKey = user.email;
  const [friends, setFriends] = useLocalStorage<Person[]>(`friends_${userKey}`, []);
  const [groups, setGroups] = useLocalStorage<Group[]>(`groups_${userKey}`, []);
  const [expenses, setExpenses] = useLocalStorage<Expense[]>(`expenses_${userKey}`, []);
  
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
    <div className="flex flex-col md:flex-row min-h-screen bg-brand-light font-sans">
      <Sidebar
        friends={friends}
        groups={groups}
        onAddFriend={() => setActiveModal('addFriend')}
        onAddGroup={() => setActiveModal('addGroup')}
        onSelectView={(view, id) => setActiveView({ view, id })}
        activeView={activeView}
        currentUserEmail={user.email}
        onLogout={onLogout}
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

// Top-level App component handles authentication routing
function App() {
  const [users, setUsers] = useLocalStorage<User[]>('splitease_users', []);
  const [currentUser, setCurrentUser] = useLocalStorage<User | null>('splitease_currentUser', null);
  
  const [authPage, setAuthPage] = useState<AuthPageType>('login');
  const [error, setError] = useState('');
  const [message, setMessage] = useState('');

  const resetMessages = () => {
      setError('');
      setMessage('');
  }

  const handleNavigate = (page: AuthPageType) => {
      resetMessages();
      setAuthPage(page);
  }

  const handleLogin = (email: string, pass: string) => {
    resetMessages();
    const user = users.find(u => u.email.toLowerCase() === email.toLowerCase());
    if (user && user.password === pass) {
      setCurrentUser(user);
    } else {
      setError('Invalid email or password.');
    }
  };

  const handleSignup = (email: string, pass: string) => {
    resetMessages();
    if (users.some(u => u.email.toLowerCase() === email.toLowerCase())) {
      setError('An account with this email already exists.');
    } else {
      const newUser = { email, password: pass };
      setUsers(prev => [...prev, newUser]);
      setCurrentUser(newUser);
    }
  };
  
  const handleForgotPassword = (email: string) => {
    resetMessages();
    // This is a simulation for a frontend-only app
    if(users.some(u => u.email.toLowerCase() === email.toLowerCase())) {
        setMessage(`If an account exists for ${email}, a password reset link has been sent.`);
    } else {
        setError("No account found with that email address.");
    }
  };

  const handleLogout = () => {
    setCurrentUser(null);
    handleNavigate('login');
  };

  if (!currentUser) {
    let page;
    switch (authPage) {
        case 'signup':
            page = <SignupPage onSignup={handleSignup} onNavigate={handleNavigate} error={error} />;
            break;
        case 'forgot':
            page = <ForgotPasswordPage onReset={handleForgotPassword} onNavigate={handleNavigate} error={error} message={message} />;
            break;
        default:
            page = <LoginPage onLogin={handleLogin} onNavigate={handleNavigate} error={error} />;
    }
    return <AuthLayout>{page}</AuthLayout>;
  }

  return <MainApp user={currentUser} onLogout={handleLogout} />;
}

export default App;
