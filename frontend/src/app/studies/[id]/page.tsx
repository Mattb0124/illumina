'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { studiesService, type Study } from '@/services/studiesService';

interface StudyPageProps {
  params: { id: string };
}

export default function StudyPage({ params }: StudyPageProps) {
  const [study, setStudy] = useState<Study | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchStudy = async () => {
      try {
        setLoading(true);
        const data = await studiesService.getStudyById(params.id);
        setStudy(data);
      } catch (error) {
        setError(error instanceof Error ? error.message : 'Failed to load study');
      } finally {
        setLoading(false);
      }
    };

    fetchStudy();
  }, [params.id]);

  if (loading) {
    return (
      <main className="container">
        <div style={{ textAlign: 'center', padding: '2rem' }}>
          <p>Loading study...</p>
        </div>
      </main>
    );
  }

  if (error || !study) {
    return (
      <main className="container">
        <div style={{ textAlign: 'center', padding: '2rem' }}>
          <h2>Study not found</h2>
          <p>The requested study could not be found.</p>
          <Link href="/studies" className="button button-primary">
            Back to Studies
          </Link>
        </div>
      </main>
    );
  }


  return (
    <main className="container">
      {/* Header */}
      <div style={{ marginBottom: '1.5rem' }}>
        <Link
          href="/studies"
          style={{
            color: 'var(--text-secondary)',
            fontSize: '0.875rem',
            textDecoration: 'none',
            marginBottom: '1rem',
            display: 'inline-flex',
            alignItems: 'center',
            gap: '0.5rem'
          }}
        >
          ← Back to Studies
        </Link>

        <h1 style={{ marginBottom: '0.5rem', fontSize: '1.5rem', lineHeight: '1.3' }}>{study.title}</h1>

        <div style={{
          display: 'flex',
          gap: '0.75rem',
          fontSize: '0.8rem',
          color: 'var(--text-secondary)',
          marginBottom: '0.75rem',
          flexWrap: 'wrap',
          alignItems: 'center'
        }}>
          <span>{study.duration_days} days</span>
          <span>•</span>
          <span>{study.difficulty}</span>
          <span>•</span>
          <span>{study.audience}</span>
          <span>•</span>
          <span>{study.estimated_time_per_session}</span>
        </div>

        <div style={{ display: 'flex', gap: '0.375rem', flexWrap: 'wrap' }}>
          {study.tags.map(tag => (
            <span
              key={tag}
              style={{
                fontSize: '0.7rem',
                padding: '0.2rem 0.4rem',
                backgroundColor: 'var(--sage-light)',
                color: 'var(--ocean-dark)',
                borderRadius: '3px',
                fontWeight: '500'
              }}
            >
              {tag}
            </span>
          ))}
        </div>
      </div>

      {/* Study Description */}
      <div className="card" style={{ marginBottom: '1.5rem', padding: '1.25rem' }}>
        <h2 style={{ marginBottom: '0.75rem', fontSize: '1.2rem', color: 'var(--navy)' }}>About This Study</h2>
        <p style={{ lineHeight: '1.5', marginBottom: '1rem', fontSize: '0.95rem', color: 'var(--text-primary)' }}>
          {study.description}
        </p>

        <div style={{
          padding: '0.75rem',
          backgroundColor: 'var(--sage-light)',
          borderRadius: '4px',
          borderLeft: '3px solid var(--ocean-medium)',
          fontSize: '0.9rem'
        }}>
          <h4 style={{ margin: '0 0 0.5rem 0', fontSize: '0.95rem', color: 'var(--ocean-dark)' }}>Pastor's Message</h4>
          <p style={{ margin: 0, fontStyle: 'italic', color: 'var(--text-secondary)', lineHeight: '1.4' }}>
            {study.pastor_message}
          </p>
        </div>
      </div>

      {/* Study Metadata */}
      <div className="card" style={{ marginBottom: '1.5rem', padding: '1rem' }}>
        <h3 style={{ marginBottom: '0.75rem', fontSize: '1.1rem', color: 'var(--navy)' }}>Study Information</h3>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '0.75rem', fontSize: '0.9rem' }}>
          <div style={{ color: 'var(--text-secondary)' }}>
            <strong style={{ color: 'var(--text-primary)' }}>Style:</strong> {study.study_style}
          </div>
          <div style={{ color: 'var(--text-secondary)' }}>
            <strong style={{ color: 'var(--text-primary)' }}>Structure:</strong> {study.study_structure}
          </div>
          <div style={{ color: 'var(--text-secondary)' }}>
            <strong style={{ color: 'var(--text-primary)' }}>Created:</strong> {new Date(study.created_at).toLocaleDateString()}
          </div>
        </div>
      </div>

      {/* Study Actions */}
      <div className="card" style={{ textAlign: 'center', padding: '1.5rem' }}>
        <div style={{ display: 'flex', gap: '1rem', justifyContent: 'center', flexWrap: 'wrap' }}>
          <Link href="/studies" className="button button-secondary" style={{ fontSize: '0.9rem' }}>
            Browse Studies
          </Link>
          <Link href={`/studies/${study.id}/day/1`} className="button button-primary" style={{ fontSize: '0.9rem', fontWeight: '600' }}>
            Start Day 1 →
          </Link>
        </div>
      </div>

    </main>
  );
}