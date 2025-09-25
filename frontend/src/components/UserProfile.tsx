'use client';

import { useState, useRef, useEffect } from 'react';
import { User } from '@/shared/types';
import { authService } from '@/services/authService';

interface UserProfileProps {
  user: User;
  onLogout: () => void;
}

export default function UserProfile({ user, onLogout }: UserProfileProps) {
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleLogout = () => {
    setIsOpen(false);
    onLogout();
  };

  const getInitials = (name: string) => {
    return name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2);
  };

  return (
    <div className="user-profile" ref={dropdownRef}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="profile-trigger"
        title="User menu"
      >
        <div className="avatar">
          {getInitials(user.name)}
        </div>
        <span className="username">{user.name}</span>
        <svg
          className={`chevron ${isOpen ? 'open' : ''}`}
          width="20"
          height="20"
          viewBox="0 0 20 20"
          fill="currentColor"
        >
          <path fillRule="evenodd" d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z" clipRule="evenodd" />
        </svg>
      </button>

      {isOpen && (
        <div className="profile-dropdown">
          <div className="profile-header">
            <div className="avatar-large">
              {getInitials(user.name)}
            </div>
            <div className="user-info">
              <div className="name">{user.name}</div>
              <div className="email">{user.email}</div>
            </div>
          </div>

          <div className="dropdown-divider" />

          <button onClick={handleLogout} className="logout-button">
            <svg width="16" height="16" viewBox="0 0 20 20" fill="currentColor">
              <path fillRule="evenodd" d="M3 3a1 1 0 00-1 1v12a1 1 0 001 1h12a1 1 0 001-1V4a1 1 0 00-1-1H3zm11 4.414l-4.293 4.293a1 1 0 01-1.414-1.414L10.586 8H5a1 1 0 110-2h5.586L8.293 3.707a1 1 0 011.414-1.414L14 6.586z" clipRule="evenodd" />
            </svg>
            Logout
          </button>
        </div>
      )}

      <style jsx>{`
        .user-profile {
          position: relative;
        }

        .profile-trigger {
          display: flex;
          align-items: center;
          gap: 0.75rem;
          background: rgba(255, 255, 255, 0.1);
          backdrop-filter: blur(10px);
          -webkit-backdrop-filter: blur(10px);
          border: 1px solid rgba(255, 255, 255, 0.2);
          border-radius: 12px;
          padding: 0.5rem 0.75rem;
          cursor: pointer;
          transition: all 0.3s ease;
          color: var(--text-primary);
        }

        .profile-trigger:hover {
          background: rgba(255, 255, 255, 0.2);
          border-color: var(--ocean-accent);
          transform: translateY(-1px);
        }

        .avatar {
          width: 32px;
          height: 32px;
          border-radius: 50%;
          background: linear-gradient(135deg, var(--ocean-medium) 0%, var(--navy) 100%);
          color: white;
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 0.75rem;
          font-weight: 600;
        }

        .username {
          font-size: 0.875rem;
          font-weight: 500;
          color: var(--text-primary);
        }

        .chevron {
          transition: transform 0.2s ease;
          color: var(--text-secondary);
        }

        .chevron.open {
          transform: rotate(180deg);
        }

        .profile-dropdown {
          position: absolute;
          top: calc(100% + 0.75rem);
          right: 0;
          min-width: 300px;
          background: rgba(255, 255, 255, 0.95);
          backdrop-filter: blur(25px);
          -webkit-backdrop-filter: blur(25px);
          border: 1px solid rgba(255, 255, 255, 0.2);
          border-radius: 20px;
          box-shadow: var(--shadow-large), 0 0 0 1px rgba(96, 165, 250, 0.05);
          z-index: 1000;
          animation: dropdownAppear 0.3s cubic-bezier(0.4, 0, 0.2, 1);
          overflow: hidden;
          transform-origin: top right;
        }

        @keyframes dropdownAppear {
          from {
            opacity: 0;
            transform: translateY(-8px) scale(0.95);
          }
          to {
            opacity: 1;
            transform: translateY(0) scale(1);
          }
        }

        .profile-header {
          display: flex;
          align-items: center;
          gap: 1rem;
          padding: 1.25rem;
        }

        .avatar-large {
          width: 48px;
          height: 48px;
          border-radius: 50%;
          background: linear-gradient(135deg, var(--ocean-medium) 0%, var(--navy) 100%);
          color: white;
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 1rem;
          font-weight: 600;
        }

        .user-info {
          flex: 1;
        }

        .name {
          font-size: 1rem;
          font-weight: 600;
          color: var(--text-primary);
          margin-bottom: 0.25rem;
        }

        .email {
          font-size: 0.875rem;
          color: var(--text-secondary);
        }

        .dropdown-divider {
          height: 1px;
          background: var(--border);
          margin: 0 1rem;
        }


        .logout-button {
          display: flex;
          align-items: center;
          gap: 0.75rem;
          width: 100%;
          background: none;
          border: none;
          padding: 1rem 1.25rem;
          cursor: pointer;
          font-size: 0.875rem;
          font-weight: 500;
          color: var(--text-secondary);
          transition: all 0.2s ease;
          border-radius: 0 0 16px 16px;
        }

        .logout-button:hover {
          background: linear-gradient(135deg, rgba(96, 165, 250, 0.1) 0%, rgba(96, 165, 250, 0.05) 100%);
          color: var(--ocean-accent);
        }

        /* Dark mode styles */
        @media (prefers-color-scheme: dark) {
          .profile-dropdown {
            background: rgba(26, 35, 50, 0.95);
            border: 1px solid rgba(226, 232, 240, 0.1);
            box-shadow: var(--shadow-large), 0 0 0 1px rgba(96, 165, 250, 0.1);
          }
        }

        @media (max-width: 768px) {
          .username {
            display: none;
          }

          .profile-dropdown {
            min-width: 280px;
            right: -1rem;
          }

          .profile-header {
            padding: 1rem;
          }
        }
      `}</style>
    </div>
  );
}