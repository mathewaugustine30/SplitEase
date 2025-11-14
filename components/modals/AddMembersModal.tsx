import React, { useState } from 'react';
import Modal from '../ui/Modal';
import Avatar from '../ui/Avatar';
import { Person, Group } from '../../types';

interface AddMembersModalProps {
  isOpen: boolean;
  onClose: () => void;
  onAddMembers: (memberUids: string[]) => void;
  users: Person[];
  group: Group;
}

const AddMembersModal: React.FC<AddMembersModalProps> = ({ isOpen, onClose, onAddMembers, users, group }) => {
  const [selectedUsers, setSelectedUsers] = useState<Set<string>>(new Set());

  const usersToAdd = users.filter(user => !group.memberUids.includes(user.uid));

  const handleUserToggle = (uid: string) => {
    setSelectedUsers(prev => {
      const newSet = new Set(prev);
      if (newSet.has(uid)) {
        newSet.delete(uid);
      } else {
        newSet.add(uid);
      }
      return newSet;
    });
  };
  
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (selectedUsers.size > 0) {
      onAddMembers(Array.from(selectedUsers));
      setSelectedUsers(new Set());
      onClose();
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title={`Add Members to ${group.name}`}>
      <form onSubmit={handleSubmit}>
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700">Select Users to Add</label>
            <div className="mt-2 max-h-48 overflow-y-auto border border-gray-200 rounded-md p-2 space-y-2">
              {usersToAdd.length > 0 ? usersToAdd.map(user => (
                <div key={user.uid} className="flex items-center">
                  <input
                    id={`add-member-${user.uid}`}
                    type="checkbox"
                    checked={selectedUsers.has(user.uid)}
                    onChange={() => handleUserToggle(user.uid)}
                    className="h-4 w-4 text-brand-primary border-gray-300 rounded focus:ring-brand-primary"
                  />
                  <label htmlFor={`add-member-${user.uid}`} className="ml-3 flex items-center text-sm text-gray-900 cursor-pointer">
                    <Avatar person={user} className="w-6 h-6 mr-2" />
                    {user.name}
                  </label>
                </div>
              )) : (
                <p className="text-sm text-gray-500">All registered users are already in this group.</p>
              )}
            </div>
          </div>
          <div className="flex justify-end pt-2">
            <button
              type="submit"
              disabled={usersToAdd.length === 0 || selectedUsers.size === 0}
              className="bg-brand-primary text-white px-4 py-2 rounded-md hover:bg-brand-secondary disabled:bg-gray-400 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-brand-primary"
            >
              Add Members
            </button>
          </div>
        </div>
      </form>
    </Modal>
  );
};

export default AddMembersModal;