
import React, { useState } from 'react';
import Modal from '../ui/Modal';
import Avatar from '../ui/Avatar';
import { Person, Group } from '../../types';

interface AddMembersModalProps {
  isOpen: boolean;
  onClose: () => void;
  onAddMembers: (memberIds: string[]) => void;
  friends: Person[];
  group: Group;
}

const AddMembersModal: React.FC<AddMembersModalProps> = ({ isOpen, onClose, onAddMembers, friends, group }) => {
  const [selectedFriends, setSelectedFriends] = useState<Set<string>>(new Set());

  const friendsToAdd = friends.filter(friend => !group.memberIds.includes(friend.id));

  const handleFriendToggle = (friendId: string) => {
    setSelectedFriends(prev => {
      const newSet = new Set(prev);
      if (newSet.has(friendId)) {
        newSet.delete(friendId);
      } else {
        newSet.add(friendId);
      }
      return newSet;
    });
  };
  
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (selectedFriends.size > 0) {
      onAddMembers(Array.from(selectedFriends));
      setSelectedFriends(new Set());
      onClose();
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title={`Add Members to ${group.name}`}>
      <form onSubmit={handleSubmit}>
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700">Select Friends to Add</label>
            <div className="mt-2 max-h-48 overflow-y-auto border border-gray-200 rounded-md p-2 space-y-2">
              {friendsToAdd.length > 0 ? friendsToAdd.map(friend => (
                <div key={friend.id} className="flex items-center">
                  <input
                    id={`add-member-${friend.id}`}
                    type="checkbox"
                    checked={selectedFriends.has(friend.id)}
                    onChange={() => handleFriendToggle(friend.id)}
                    className="h-4 w-4 text-brand-primary border-gray-300 rounded focus:ring-brand-primary"
                  />
                  <label htmlFor={`add-member-${friend.id}`} className="ml-3 flex items-center text-sm text-gray-900 cursor-pointer">
                    <Avatar person={friend} className="w-6 h-6 mr-2" />
                    {friend.name}
                  </label>
                </div>
              )) : (
                <p className="text-sm text-gray-500">All your friends are already in this group.</p>
              )}
            </div>
          </div>
          <div className="flex justify-end pt-2">
            <button
              type="submit"
              disabled={friendsToAdd.length === 0 || selectedFriends.size === 0}
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