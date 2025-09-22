'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import StudiesTable from '@/components/StudiesTable';
import { studiesService, type Study } from '@/services/studiesService';

export default function StudiesPage() {
  const [studies, setStudies] = useState<Study[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchStudies = async () => {
      try {
        setLoading(true);
        const data = await studiesService.getAllStudies();
        setStudies(data);
      } catch (error) {
        setError(error instanceof Error ? error.message : 'Failed to load studies');
      } finally {
        setLoading(false);
      }
    };

    fetchStudies();
  }, []);

  if (loading) {
    return (
      <main className="container">
        <div style={{ textAlign: 'center', padding: '2rem' }}>
          <p>Loading studies...</p>
        </div>
      </main>
    );
  }

  if (error) {
    return (
      <main className="container">
        <div style={{ textAlign: 'center', padding: '2rem' }}>
          <p style={{ color: 'red' }}>Error: {error}</p>
          <button
            onClick={() => window.location.reload()}
            className="button button-secondary"
            style={{ marginTop: '1rem' }}
          >
            Try Again
          </button>
        </div>
      </main>
    );
  }

  return (
    <main className="container">
      {/* Clean Header */}
      <div style={{ marginBottom: '2rem' }}>
        <h1 style={{ marginBottom: '0.5rem' }}>Study Library</h1>
        <p style={{ color: 'var(--text-secondary)' }}>
          {studies.length} {studies.length === 1 ? 'study' : 'studies'} available
        </p>
      </div>

      {/* Studies Table - Primary Focus */}
      <div style={{ marginBottom: '3rem' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
          <h2 style={{ margin: '0', fontSize: '1.25rem' }}>All Studies</h2>
          <Link
            href="/studies/request-study"
            className="button button-primary"
            style={{ fontSize: '0.875rem', padding: '0.5rem 1rem' }}
          >
            Request New Study
          </Link>
        </div>

        <StudiesTable studies={studies} />
      </div>
    </main>
  );
}