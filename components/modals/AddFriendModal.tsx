import React, { useState } from 'react';
import Modal from '../ui/Modal';
import { Person } from '../../types';
import { generateAvatar } from '../ui/Avatar';

interface AddFriendModalProps {
  isOpen: boolean;
  onClose: () => void;
  onAddFriend: (friend: Omit<Person, 'id'>) => void;
}

const AddFriendModal: React.FC<AddFriendModalProps> = ({ isOpen, onClose, onAddFriend }) => {
  const [name, setName] = useState('');
  const [avatarUrl, setAvatarUrl] = useState<string | null>(null);

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setAvatarUrl(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleGenerateAvatar = () => {
    if (name.trim()) {
      setAvatarUrl(generateAvatar(name.trim()));
    } else {
      alert("Please enter a name first to generate an avatar.");
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (name.trim()) {
      onAddFriend({ name: name.trim(), avatarUrl: avatarUrl || generateAvatar(name.trim()) });
      setName('');
      setAvatarUrl(null);
      onClose();
    }
  };
  
  const resetState = () => {
    setName('');
    setAvatarUrl(null);
    onClose();
  }

  return (
    <Modal isOpen={isOpen} onClose={resetState} title="Add a New Friend">
      <form onSubmit={handleSubmit}>
        <div className="space-y-4">
          <div>
            <label htmlFor="friendName" className="block text-sm font-medium text-gray-700">Friend's Name</label>
            <input
              type="text"
              id="friendName"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-brand-primary focus:border-brand-primary sm:text-sm"
              placeholder="e.g., Jane Doe"
              required
            />
          </div>
          
          <div>
             <label className="block text-sm font-medium text-gray-700">Profile Picture (Optional)</label>
             <div className="mt-2 flex flex-col sm:flex-row items-center gap-4">
                <img 
                    src={avatarUrl || generateAvatar(name || '?')} 
                    alt="Avatar preview" 
                    className="w-16 h-16 rounded-full object-cover bg-gray-200 flex-shrink-0"
                />
                <div className="flex flex-col space-y-2">
                     <label htmlFor="avatarUpload" className="cursor-pointer bg-white py-2 px-3 border border-gray-300 rounded-md shadow-sm text-sm leading-4 font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-brand-primary">
                        <span>Upload Image</span>
                        <input id="avatarUpload" name="avatarUpload" type="file" className="sr-only" accept="image/*" onChange={handleImageUpload} />
                    </label>
                     <button type="button" onClick={handleGenerateAvatar} className="bg-white py-2 px-3 border border-gray-300 rounded-md shadow-sm text-sm leading-4 font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-brand-primary">
                        Generate
                    </button>
                </div>
             </div>
          </div>

          <div className="flex justify-end pt-2">
            <button
              type="submit"
              className="bg-brand-primary text-white px-4 py-2 rounded-md hover:bg-brand-secondary focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-brand-primary"
            >
              Add Friend
            </button>
          </div>
        </div>
      </form>
    </Modal>
  );
};

export default AddFriendModal;