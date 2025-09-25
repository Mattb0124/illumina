'use client';

import { useEffect, useState } from 'react';

export default function ThemeToggle() {
  const [theme, setTheme] = useState<'light' | 'dark'>('light');
  const [mounted, setMounted] = useState(false);

  // Only run after hydration to prevent SSR mismatch
  useEffect(() => {
    setMounted(true);

    // Check for stored theme preference or system preference
    const storedTheme = localStorage.getItem('theme') as 'light' | 'dark' | null;
    const systemPrefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;

    const initialTheme = storedTheme || (systemPrefersDark ? 'dark' : 'light');
    setTheme(initialTheme);
    applyTheme(initialTheme);
  }, []);

  const applyTheme = (newTheme: 'light' | 'dark') => {
    document.documentElement.setAttribute('data-theme', newTheme);
  };

  const toggleTheme = () => {
    const newTheme = theme === 'light' ? 'dark' : 'light';
    setTheme(newTheme);
    localStorage.setItem('theme', newTheme);
    applyTheme(newTheme);
  };

  // Prevent hydration mismatch
  if (!mounted) {
    return (
      <button className="theme-toggle" disabled>
        <span>🌙</span>
      </button>
    );
  }

  return (
    <button
      onClick={toggleTheme}
      className="theme-toggle"
      title={`Switch to ${theme === 'light' ? 'dark' : 'light'} mode`}
    >
      <div className="theme-icon">
        {theme === 'light' ? (
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"/>
          </svg>
        ) : (
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <circle cx="12" cy="12" r="5"/>
            <path d="M12 1v2m0 18v2M4.22 4.22l1.42 1.42m12.72 12.72 1.42 1.42M1 12h2m18 0h2M4.22 19.78l1.42-1.42M18.36 5.64l1.42-1.42"/>
          </svg>
        )}
      </div>
      <style jsx>{`
        .theme-toggle {
          width: 40px;
          height: 40px;
          border-radius: 12px;
          border: none;
          cursor: pointer;
          display: flex;
          align-items: center;
          justify-content: center;
          transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
          background: rgba(255, 255, 255, 0.1);
          backdrop-filter: blur(10px);
          -webkit-backdrop-filter: blur(10px);
          border: 1px solid rgba(255, 255, 255, 0.15);
          color: var(--text-secondary);
        }

        .theme-toggle:hover {
          background: rgba(255, 255, 255, 0.15);
          border-color: var(--ocean-accent);
          transform: translateY(-1px);
          color: var(--ocean-accent);
        }

        .theme-toggle:disabled {
          opacity: 0.5;
          cursor: not-allowed;
        }

        .theme-icon {
          display: flex;
          align-items: center;
          justify-content: center;
          transition: transform 0.3s ease;
        }

        .theme-toggle:hover .theme-icon {
          transform: rotate(15deg) scale(1.05);
        }

        .theme-toggle:active {
          transform: translateY(0) scale(0.98);
        }
      `}</style>
    </button>
  );
}