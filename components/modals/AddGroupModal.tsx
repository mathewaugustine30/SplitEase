
import React, { useState } from 'react';
import Modal from '../ui/Modal';
import Avatar from '../ui/Avatar';
import { Person, Group } from '../../types';

interface AddGroupModalProps {
  isOpen: boolean;
  onClose: () => void;
  onAddGroup: (group: Group) => void;
  friends: Person[];
  currentUserId: string;
}

const AddGroupModal: React.FC<AddGroupModalProps> = ({ isOpen, onClose, onAddGroup, friends, currentUserId }) => {
  const [name, setName] = useState('');
  const [selectedFriends, setSelectedFriends] = useState<Set<string>>(new Set());

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
    if (name.trim()) {
      onAddGroup({
        id: crypto.randomUUID(),
        name: name.trim(),
        memberIds: Array.from(new Set([currentUserId, ...Array.from(selectedFriends)])),
      });
      setName('');
      setSelectedFriends(new Set());
      onClose();
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Create a New Group">
      <form onSubmit={handleSubmit}>
        <div className="space-y-4">
          <div>
            <label htmlFor="groupName" className="block text-sm font-medium text-gray-700">Group Name</label>
            <input
              type="text"
              id="groupName"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-brand-primary focus:border-brand-primary sm:text-sm"
              placeholder="e.g., Trip to Alps"
              required
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700">Select Members</label>
            <div className="mt-2 max-h-48 overflow-y-auto border border-gray-200 rounded-md p-2 space-y-2">
              <div className="flex items-center opacity-75">
                <input
                  id={`friend-${currentUserId}`}
                  type="checkbox"
                  checked={true}
                  disabled
                  className="h-4 w-4 text-brand-primary border-gray-300 rounded focus:ring-brand-primary"
                />
                <label htmlFor={`friend-${currentUserId}`} className="ml-3 flex items-center text-sm text-gray-900 cursor-not-allowed">
                    <Avatar person={{ id: currentUserId, name: 'You' }} className="w-6 h-6 mr-2" />
                    You
                </label>
              </div>

              {friends.length > 0 && <hr className="my-1" />}
              
              {friends.map(friend => (
                <div key={friend.id} className="flex items-center">
                  <input
                    id={`friend-${friend.id}`}
                    type="checkbox"
                    checked={selectedFriends.has(friend.id)}
                    onChange={() => handleFriendToggle(friend.id)}
                    className="h-4 w-4 text-brand-primary border-gray-300 rounded focus:ring-brand-primary"
                  />
                  <label htmlFor={`friend-${friend.id}`} className="ml-3 flex items-center text-sm text-gray-900 cursor-pointer">
                    <Avatar person={friend} className="w-6 h-6 mr-2" />
                    {friend.name}
                  </label>
                </div>
              ))}
               {friends.length === 0 && (
                <p className="text-sm text-gray-500 pl-3 pt-1">You can add friends to this group later.</p>
              )}
            </div>
          </div>
          <div className="flex justify-end pt-2">
            <button
              type="submit"
              disabled={!name.trim()}
              className="bg-brand-primary text-white px-4 py-2 rounded-md hover:bg-brand-secondary disabled:bg-gray-400 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-brand-primary"
            >
              Create Group
            </button>
          </div>
        </div>
      </form>
    </Modal>
  );
};

export default AddGroupModal;
