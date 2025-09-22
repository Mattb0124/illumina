'use client';

import Link from 'next/link';

export default function Home() {

  return (
    <main className="container">
      {/* Welcome Section */}
      <div style={{ marginBottom: '3rem' }}>
        <h1 style={{ marginBottom: '0.75rem', fontSize: '2rem' }}>Welcome to Illumina</h1>
        <p style={{
          color: 'var(--text-secondary)',
          fontSize: '1.1rem',
          margin: '0',
          maxWidth: '600px'
        }}>
          Your personalized Bible study platform
        </p>
      </div>



      {/* Main Actions */}
      <div style={{ marginBottom: '3rem' }}>
        <h2 style={{ marginBottom: '2rem', fontSize: '1.5rem' }}>Get Started</h2>
        <div style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap' }}>
          <Link href="/studies" className="button button-primary" style={{ fontSize: '1rem', padding: '0.75rem 1.5rem' }}>
            Browse Study Library
          </Link>
          <Link href="/studies/request-study" className="button button-secondary" style={{ fontSize: '1rem', padding: '0.75rem 1.5rem' }}>
            Request Custom Study
          </Link>
        </div>
      </div>

    </main>
  );
}