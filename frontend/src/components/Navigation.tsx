'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { authService } from '@/services/authService';
import { User } from '@/shared/types';

export default function Navigation() {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const checkAuth = async () => {
      try {
        const currentUser = await authService.getCurrentUser();
        setUser(currentUser);
      } catch (error) {
        setUser(null);
      } finally {
        setLoading(false);
      }
    };

    checkAuth();
  }, []);

  const handleLogout = () => {
    authService.logout();
    setUser(null);
    window.location.href = '/';
  };

  const navLinkStyle = {
    textDecoration: 'none',
    color: 'var(--text-secondary)',
    fontSize: '0.875rem',
    fontWeight: '500',
    transition: 'color 0.2s'
  };

  return (
    <nav className="nav">
      <div className="nav-container">
        <Link href="/" className="nav-title">
          Illumina
        </Link>
        <div style={{ display: 'flex', gap: '1.5rem', alignItems: 'center', marginLeft: 'auto' }}>
          <Link
            href="/"
            style={navLinkStyle}
            onMouseEnter={(e) => (e.target as HTMLElement).style.color = 'var(--navy)'}
            onMouseLeave={(e) => (e.target as HTMLElement).style.color = 'var(--text-secondary)'}
          >
            Dashboard
          </Link>
          <Link
            href="/studies"
            style={navLinkStyle}
            onMouseEnter={(e) => (e.target as HTMLElement).style.color = 'var(--navy)'}
            onMouseLeave={(e) => (e.target as HTMLElement).style.color = 'var(--text-secondary)'}
          >
            Studies
          </Link>

          {!loading && (
            user ? (
              <div style={{ display: 'flex', gap: '1rem', alignItems: 'center' }}>
                <span style={{
                  fontSize: '0.875rem',
                  color: 'var(--text-primary)',
                  fontWeight: '500'
                }}>
                  {user.name}
                </span>
                <button
                  onClick={handleLogout}
                  style={{
                    background: 'none',
                    border: 'none',
                    ...navLinkStyle,
                    cursor: 'pointer'
                  }}
                  onMouseEnter={(e) => (e.target as HTMLElement).style.color = 'var(--navy)'}
                  onMouseLeave={(e) => (e.target as HTMLElement).style.color = 'var(--text-secondary)'}
                >
                  Logout
                </button>
              </div>
            ) : (
              <Link
                href="/login"
                className="button button-primary"
                style={{
                  fontSize: '0.875rem',
                  padding: '0.5rem 1rem'
                }}
              >
                Login
              </Link>
            )
          )}
        </div>
      </div>
    </nav>
  );
}