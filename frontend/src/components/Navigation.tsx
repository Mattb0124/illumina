'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { authService } from '@/services/authService';
import { User } from '@/shared/types';
import UserProfile from './UserProfile';
import ThemeToggle from './ThemeToggle';

export default function Navigation() {
  const router = useRouter();
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

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

  useEffect(() => {
    checkAuth();

    // Listen for auth state changes (custom event)
    const handleAuthChange = () => {
      checkAuth();
    };

    window.addEventListener('auth-state-changed', handleAuthChange);

    // Listen for route changes to refresh auth state
    const handleRouteChange = () => {
      // Small delay to ensure the route change is complete
      setTimeout(checkAuth, 100);
    };

    // Check auth on focus (when user returns to tab)
    const handleFocus = () => {
      checkAuth();
    };

    window.addEventListener('focus', handleFocus);

    return () => {
      window.removeEventListener('auth-state-changed', handleAuthChange);
      window.removeEventListener('focus', handleFocus);
    };
  }, []);

  const handleLogout = () => {
    authService.logout();
    setUser(null);
    router.push('/');
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

          <div style={{ display: 'flex', gap: '1rem', alignItems: 'center' }}>
            <ThemeToggle />
            {!loading && (
              user ? (
                <UserProfile user={user} onLogout={handleLogout} />
              ) : (
                <div style={{ display: 'flex', gap: '0.75rem', alignItems: 'center' }}>
                  <div className="guest-profile">
                    <div className="guest-avatar">
                      <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor" style={{ color: 'var(--text-secondary)' }}>
                        <path d="M12 12c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm0 2c-2.67 0-8 1.34-8 4v2h16v-2c0-2.66-5.33-4-8-4z"/>
                      </svg>
                    </div>
                    <span className="guest-text">Guest</span>
                  </div>
                  <Link
                    href="/login"
                    className="button button-primary"
                    style={{
                      fontSize: '0.8rem',
                      padding: '0.5rem 0.875rem'
                    }}
                  >
                    Login
                  </Link>
                </div>
              )
            )}
          </div>

          <style jsx>{`
            .guest-profile {
              display: flex;
              align-items: center;
              gap: 0.5rem;
              background: rgba(255, 255, 255, 0.05);
              backdrop-filter: blur(10px);
              -webkit-backdrop-filter: blur(10px);
              border: 1px solid rgba(255, 255, 255, 0.1);
              border-radius: 8px;
              padding: 0.5rem 0.75rem;
              transition: all 0.3s ease;
            }

            .guest-profile:hover {
              background: rgba(255, 255, 255, 0.08);
              border-color: rgba(96, 165, 250, 0.2);
            }

            .guest-avatar {
              width: 24px;
              height: 24px;
              border-radius: 50%;
              background: rgba(255, 255, 255, 0.1);
              display: flex;
              align-items: center;
              justify-content: center;
            }

            .guest-text {
              font-size: 0.875rem;
              font-weight: 500;
              color: var(--text-secondary);
            }

            @media (max-width: 768px) {
              .guest-text {
                display: none;
              }
            }
          `}</style>
        </div>
      </div>
    </nav>
  );
}