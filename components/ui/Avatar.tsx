
import React from 'react';
import { Person } from '../../types';
import { UserCircleIcon } from './Icons';

interface AvatarProps {
  person: Person;
  className?: string;
}

const generateAvatar = (name: string): string => {
  const getInitials = (name: string) => {
    const names = name.split(' ');
    const initials = names.map(n => n[0]).join('');
    return initials.slice(0, 2).toUpperCase();
  };

  const stringToColor = (str: string) => {
    let hash = 0;
    for (let i = 0; i < str.length; i++) {
      hash = str.charCodeAt(i) + ((hash << 5) - hash);
    }
    let color = '#';
    for (let i = 0; i < 3; i++) {
      const value = (hash >> (i * 8)) & 0xFF;
      color += ('00' + value.toString(16)).substr(-2);
    }
    return color;
  };

  const initials = getInitials(name);
  const bgColor = stringToColor(name);

  const svg = `
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100">
      <circle cx="50" cy="50" r="50" fill="${bgColor}" />
      <text x="50" y="50" font-family="Arial, sans-serif" font-size="40" fill="#ffffff" text-anchor="middle" dy=".3em">${initials}</text>
    </svg>
  `;

  return `data:image/svg+xml;base64,${btoa(svg)}`;
};

const Avatar: React.FC<AvatarProps> = ({ person, className = "w-8 h-8" }) => {
  const avatarSrc = person.avatarUrl || generateAvatar(person.name || '?');

  return (
    <img
      src={avatarSrc}
      alt={person.name}
      className={`${className} rounded-full object-cover bg-gray-200`}
      onError={(e) => {
        // Fallback for any image error
        const target = e.target as HTMLImageElement;
        target.onerror = null; // prevent infinite loop
        target.src = generateAvatar(person.name || '?');
      }}
    />
  );
};

export default Avatar;
export { generateAvatar };
