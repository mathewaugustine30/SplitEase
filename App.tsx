import React, { useState, useEffect } from 'react';
import { Person, Group, Expense, SimplifiedDebt } from './types';
import Sidebar from './components/Sidebar';
import Dashboard from './components/Dashboard';
import GroupView from './components/GroupView';
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
import { collection, addDoc, doc, updateDoc, query, where, getDocs, orderBy } from 'firebase/firestore';


type ModalType = 'addGroup' | 'addExpense' | 'addMembers' | 'settleUp' | null;
type ViewType = { view: 'dashboard' | 'group'; id: string | null };
type AuthPageType = 'login' | 'signup' | 'forgot';

// Main application component, rendered after successful login
function MainApp({ user }: { user: FirebaseUser }) {
  // Queries for top-level collections
  const usersRef = collection(db, 'users');
  const groupsQuery = query(collection(db, 'groups'), where('memberUids', 'array-contains', user.uid));
  
  const [usersData, usersLoading] = useCollectionData<Person>(usersRef, { idField: 'uid' });
  const [groupsData, groupsLoading] = useCollectionData<Group>(groupsQuery, { idField: 'id' });
  
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [expensesLoading, setExpensesLoading] = useState(true);

  const allUsers = usersData || [];
  const groups = groupsData || [];
  
  // Fetch expenses for all groups the user is a member of
  useEffect(() => {
    if (!groupsData || groupsLoading) return;

    const fetchExpenses = async () => {
        setExpensesLoading(true);
        if (groupsData.length === 0) {
            setExpenses([]);
            setExpensesLoading(false);
            return;
        }

        const expensePromises = groupsData.map(group => {
            const groupExpensesRef = collection(db, 'groups', group.id, 'expenses');
            return getDocs(query(groupExpensesRef));
        });

        try {
            const groupExpenseSnapshots = await Promise.all(expensePromises);
            const allExpenses: Expense[] = [];
            groupExpenseSnapshots.forEach(snapshot => {
                snapshot.forEach(doc => {
                    allExpenses.push({ id: doc.id, ...doc.data() } as Expense);
                });
            });
            // Sort all expenses by date descending
            allExpenses.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
            setExpenses(allExpenses);
        } catch (error) {
            console.error("Error fetching expenses:", error);
        } finally {
            setExpensesLoading(false);
        }
    };

    fetchExpenses();
  }, [groupsData, groupsLoading]);


  const [activeModal, setActiveModal] = useState<ModalType>(null);
  const [activeView, setActiveView] = useState<ViewType>({ view: 'dashboard', id: null });

  const currentUser = allUsers.find(u => u.uid === user.uid) || { uid: user.uid, name: user.email?.split('@')[0] || "You", email: user.email! };

  const handleAddGroup = async (group: Omit<Group, 'id'>) => {
    await addDoc(collection(db, 'groups'), group);
  };

  const handleAddExpense = async (expense: Omit<Expense, 'id'>) => {
    await addDoc(collection(db, 'groups', expense.groupId, 'expenses'), expense);
  };

  const handleAddMembersToGroup = async (groupId: string, newMemberUids: string[]) => {
    const groupDocRef = doc(db, 'groups', groupId);
    const group = groups.find(g => g.id === groupId);
    if(group) {
        const updatedMemberUids = Array.from(new Set([...group.memberUids, ...newMemberUids]));
        await updateDoc(groupDocRef, { memberUids: updatedMemberUids });
    }
  };
  
  const selectedGroup = groups.find(g => g.id === activeView.id);

  const handleSettleUp = async () => {
    if (!selectedGroup) return;

    const groupExpenses = expenses.filter(e => e.groupId === selectedGroup.id);
    const groupMembers = allUsers.filter(f => selectedGroup.memberUids.includes(f.uid));
    const balances = calculateBalances(groupMembers, groupExpenses);
    const simplifiedDebts = simplifyDebts(balances);

    if (simplifiedDebts.length === 0) {
        setActiveModal(null);
        return;
    }

    const getPersonName = (uid: string) => allUsers.find(f => f.uid === uid)?.name || 'Unknown';

    const settlementPromises = simplifiedDebts.map(debt => {
        const newExpense: Omit<Expense, 'id'> = {
            groupId: selectedGroup.id,
            description: `Settle up: ${getPersonName(debt.from)} paid ${getPersonName(debt.to)}`,
            amount: debt.amount,
            paidByUid: debt.from,
            split: [{ uid: debt.to, amount: debt.amount }],
            date: new Date().toISOString(),
            categoryId: 'settle',
        };
        return addDoc(collection(db, 'groups', selectedGroup.id, 'expenses'), newExpense);
    });
    
    await Promise.all(settlementPromises);
    setActiveModal(null);
  };

  const handleSettleIndividualDebt = async (groupId: string, debt: SimplifiedDebt) => {
    const getPersonName = (uid: string) => allUsers.find(p => p.uid === uid)?.name || 'Unknown';

    const settlementExpense: Omit<Expense, 'id'> = {
      groupId: groupId,
      description: `Settle up: ${getPersonName(debt.from)} paid ${getPersonName(debt.to)}`,
      amount: debt.amount,
      paidByUid: debt.from,
      split: [{ uid: debt.to, amount: debt.amount }],
      date: new Date().toISOString(),
      categoryId: 'settle',
    };
    
    await addDoc(collection(db, 'groups', groupId, 'expenses'), settlementExpense);
  };
  
  const handleLogout = async () => {
    await signOut(auth);
  };

  if (usersLoading || groupsLoading || expensesLoading) {
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
                  persons={allUsers} 
                  expenses={expenses} 
                  onAddExpense={() => setActiveModal('addExpense')} 
                  onAddMembers={() => setActiveModal('addMembers')}
                  onSettleUp={() => setActiveModal('settleUp')}
                  onSettleIndividualDebt={(debt) => handleSettleIndividualDebt(group.id, debt)}
                />;
      }
    }
    return <Dashboard persons={allUsers} expenses={expenses} />;
  };

  const selectedGroupMembers = allUsers.filter(f => selectedGroup?.memberUids.includes(f.uid));

  return (
    <div className="flex flex-col md:flex-row min-h-screen bg-brand-light font-sans">
      <Sidebar
        groups={groups}
        onAddGroup={() => setActiveModal('addGroup')}
        onSelectView={(view, id) => setActiveView({ view, id })}
        activeView={activeView}
        currentUserEmail={user.email || "User"}
        onLogout={handleLogout}
      />
      <main className="flex-1 overflow-y-auto">
        {renderView()}
      </main>

      <AddGroupModal
        isOpen={activeModal === 'addGroup'}
        onClose={() => setActiveModal(null)}
        onAddGroup={handleAddGroup}
        users={allUsers}
        currentUserUid={currentUser.uid}
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
          onAddMembers={(memberUids) => handleAddMembersToGroup(selectedGroup.id, memberUids)}
          users={allUsers}
          group={selectedGroup}
        />
      )}
      {selectedGroup && (
        <SettleUpModal
          isOpen={activeModal === 'settleUp'}
          onClose={() => setActiveModal(null)}
          onConfirm={handleSettleUp}
          group={selectedGroup}
          persons={allUsers}
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