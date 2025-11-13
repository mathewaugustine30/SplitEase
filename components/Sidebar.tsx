
import React from 'react';
import { Person, Group } from '../types';
import { UserPlusIcon, CollectionIcon, PlusCircleIcon } from './ui/Icons';
import Avatar from './ui/Avatar';

interface SidebarProps {
  friends: Person[];
  groups: Group[];
  onAddFriend: () => void;
  onAddGroup: () => void;
  onSelectView: (view: 'dashboard' | 'group', id: string | null) => void;
  activeView: { view: 'dashboard' | 'group', id: string | null };
}

const Sidebar: React.FC<SidebarProps> = ({ friends, groups, onAddFriend, onAddGroup, onSelectView, activeView }) => {
  return (
    <div className="w-full md:w-64 bg-brand-dark text-white p-4 flex flex-col h-screen">
      <h1 className="text-2xl font-bold text-brand-primary mb-6">SplitEase</h1>
      
      <nav className="flex-grow">
        <ul>
          <li
            className={`flex items-center space-x-2 p-2 rounded cursor-pointer mb-2 ${activeView.view === 'dashboard' ? 'bg-brand-secondary' : 'hover:bg-gray-700'}`}
            onClick={() => onSelectView('dashboard', null)}
          >
            <span>📊</span>
            <span>Dashboard</span>
          </li>
        </ul>

        <div className="mt-6">
          <div className="flex justify-between items-center mb-2">
            <h2 className="text-lg font-semibold text-gray-400">Groups</h2>
            <button onClick={onAddGroup} className="text-gray-400 hover:text-white">
              <PlusCircleIcon className="w-5 h-5" />
            </button>
          </div>
          <ul className="space-y-1">
            {groups.map(group => (
              <li 
                key={group.id} 
                className={`flex items-center space-x-2 p-2 rounded cursor-pointer ${activeView.view === 'group' && activeView.id === group.id ? 'bg-brand-secondary' : 'hover:bg-gray-700'}`}
                onClick={() => onSelectView('group', group.id)}
              >
                <CollectionIcon className="w-5 h-5"/>
                <span>{group.name}</span>
              </li>
            ))}
          </ul>
        </div>

        <div className="mt-6">
          <div className="flex justify-between items-center mb-2">
            <h2 className="text-lg font-semibold text-gray-400">Friends</h2>
            <button onClick={onAddFriend} className="text-gray-400 hover:text-white">
              <UserPlusIcon className="w-5 h-5" />
            </button>
          </div>
          <ul className="space-y-1">
            {friends.map(friend => (
              <li key={friend.id} className="flex items-center space-x-2 p-2 rounded">
                 <Avatar person={friend} className="w-6 h-6"/>
                <span>{friend.name}</span>
              </li>
            ))}
          </ul>
        </div>
      </nav>
    </div>
  );
};

export default Sidebar;