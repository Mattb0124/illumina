'use client';

import { useState } from 'react';
import { authService, RegisterData, LoginData } from '@/services/authService';

interface AuthFormProps {
  onSuccess?: () => void;
}

export default function AuthForm({ onSuccess }: AuthFormProps) {
  const [mode, setMode] = useState<'login' | 'register'>('login');
  const [formData, setFormData] = useState({
    email: '',
    password: '',
    name: '',
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      if (mode === 'register') {
        const registerData: RegisterData = {
          email: formData.email,
          password: formData.password,
          name: formData.name,
        };
        await authService.register(registerData);
      } else {
        const loginData: LoginData = {
          email: formData.email,
          password: formData.password,
        };
        await authService.login(loginData);
      }

      if (onSuccess) {
        onSuccess();
      }
    } catch (error) {
      setError(error instanceof Error ? error.message : 'An error occurred');
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData(prev => ({
      ...prev,
      [e.target.name]: e.target.value,
    }));
  };

  const toggleMode = () => {
    setMode(prev => prev === 'login' ? 'register' : 'login');
    setError('');
    setFormData({ email: '', password: '', name: '' });
  };

  return (
    <div className="card-elevated" style={{ maxWidth: '400px', margin: '0 auto' }}>
      <h2 style={{ textAlign: 'center', marginBottom: '1.5rem' }}>
        {mode === 'login' ? 'Welcome Back' : 'Create Account'}
      </h2>

      {error && (
        <div style={{
          background: 'linear-gradient(135deg, #fee 0%, #fdd 100%)',
          border: '1px solid #f87171',
          borderRadius: '6px',
          padding: '0.75rem',
          marginBottom: '1rem',
          color: '#dc2626',
          fontSize: '0.875rem'
        }}>
          {error}
        </div>
      )}

      <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
        {mode === 'register' && (
          <div>
            <label htmlFor="name" style={{
              display: 'block',
              marginBottom: '0.5rem',
              fontSize: '0.875rem',
              fontWeight: '600',
              color: 'var(--text-primary)'
            }}>
              Full Name
            </label>
            <input
              type="text"
              id="name"
              name="name"
              value={formData.name}
              onChange={handleInputChange}
              required={mode === 'register'}
              style={{
                width: '100%',
                padding: '0.75rem',
                border: '1px solid var(--border)',
                borderRadius: '6px',
                fontSize: '1rem',
                fontFamily: 'var(--font-ui)',
                background: 'white',
                transition: 'border-color 0.2s ease',
              }}
              placeholder="Enter your full name"
            />
          </div>
        )}

        <div>
          <label htmlFor="email" style={{
            display: 'block',
            marginBottom: '0.5rem',
            fontSize: '0.875rem',
            fontWeight: '600',
            color: 'var(--text-primary)'
          }}>
            Email Address
          </label>
          <input
            type="email"
            id="email"
            name="email"
            value={formData.email}
            onChange={handleInputChange}
            required
            style={{
              width: '100%',
              padding: '0.75rem',
              border: '1px solid var(--border)',
              borderRadius: '6px',
              fontSize: '1rem',
              fontFamily: 'var(--font-ui)',
              background: 'white',
              transition: 'border-color 0.2s ease',
            }}
            placeholder="Enter your email"
          />
        </div>

        <div>
          <label htmlFor="password" style={{
            display: 'block',
            marginBottom: '0.5rem',
            fontSize: '0.875rem',
            fontWeight: '600',
            color: 'var(--text-primary)'
          }}>
            Password
          </label>
          <input
            type="password"
            id="password"
            name="password"
            value={formData.password}
            onChange={handleInputChange}
            required
            style={{
              width: '100%',
              padding: '0.75rem',
              border: '1px solid var(--border)',
              borderRadius: '6px',
              fontSize: '1rem',
              fontFamily: 'var(--font-ui)',
              background: 'white',
              transition: 'border-color 0.2s ease',
            }}
            placeholder="Enter your password"
            minLength={8}
          />
          {mode === 'register' && (
            <p style={{
              fontSize: '0.75rem',
              color: 'var(--text-secondary)',
              marginTop: '0.25rem'
            }}>
              Password must contain at least 8 characters with uppercase, lowercase, number, and special character
            </p>
          )}
        </div>

        <button
          type="submit"
          disabled={loading}
          className="button button-primary"
          style={{
            width: '100%',
            marginTop: '0.5rem',
            opacity: loading ? 0.7 : 1,
            cursor: loading ? 'not-allowed' : 'pointer',
          }}
        >
          {loading ? 'Please wait...' : mode === 'login' ? 'Sign In' : 'Create Account'}
        </button>
      </form>

      <div className="ornamental-divider" style={{ margin: '1.5rem 0 1rem 0' }}>
        <span style={{
          padding: '0 1rem',
          fontSize: '0.875rem',
          color: 'var(--text-secondary)',
          background: 'white'
        }}>
          or
        </span>
      </div>

      <button
        type="button"
        onClick={toggleMode}
        className="button button-tertiary"
        style={{ width: '100%' }}
      >
        {mode === 'login'
          ? "Don't have an account? Sign up"
          : 'Already have an account? Sign in'}
      </button>
    </div>
  );
}