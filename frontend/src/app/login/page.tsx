'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import AuthForm from '@/components/AuthForm';
import { authService } from '@/services/authService';

export default function LoginPage() {
  const router = useRouter();

  useEffect(() => {
    // If user is already authenticated, redirect to home
    if (authService.isAuthenticated()) {
      router.push('/');
    }
  }, [router]);

  const handleAuthSuccess = () => {
    // Redirect to home page after successful authentication
    router.push('/');
  };

  return (
    <div className="container" style={{
      minHeight: 'calc(100vh - 200px)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      paddingTop: '2rem',
      paddingBottom: '2rem'
    }}>
      <div style={{ width: '100%', maxWidth: '500px' }}>
        <div style={{ textAlign: 'center', marginBottom: '2rem' }}>
          <h1 style={{
            color: 'var(--charcoal-black)',
            marginBottom: '0.5rem',
            fontSize: '2.5rem',
            fontFamily: 'var(--font-decorative)'
          }}>
            Illumina
          </h1>
          <p style={{
            color: 'var(--text-secondary)',
            fontSize: '1.125rem',
            fontWeight: '400'
          }}>
            Your AI-powered Bible study companion
          </p>
        </div>

        <AuthForm onSuccess={handleAuthSuccess} />

        <div style={{
          textAlign: 'center',
          marginTop: '2rem',
          padding: '1.5rem',
          background: 'linear-gradient(135deg, var(--champagne) 0%, var(--deep-cream) 100%)',
          borderRadius: '12px',
          border: '1px solid rgba(212, 175, 55, 0.2)'
        }}>
          <h3 style={{
            margin: '0 0 0.75rem 0',
            color: 'var(--text-primary)',
            fontSize: '1.125rem'
          }}>
            Welcome to Illumina
          </h3>
          <p style={{
            margin: 0,
            color: 'var(--text-secondary)',
            fontSize: '0.9375rem',
            lineHeight: '1.5'
          }}>
            Create an account to start your personalized Bible study journey.
            Track your progress, access curated studies, and deepen your faith
            with AI-powered insights.
          </p>
        </div>
      </div>
    </div>
  );
}