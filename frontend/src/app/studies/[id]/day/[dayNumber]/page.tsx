'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import ReactMarkdown from 'react-markdown';

interface StudyDayPageProps {
  params: {
    id: string;
    dayNumber: string;
  };
}

interface DayContent {
  day: number;
  frontmatter: {
    title?: string;
    estimatedTime?: string;
    passages?: Array<{ reference: string }>;
  };
  content: string;
  rawContent: string;
}

interface StudyInfo {
  title: string;
  duration_days: number;
  theme: string;
}

interface ApiResponse<T = any> {
  success: boolean;
  data?: T;
  message?: string;
  error?: string;
}

export default function StudyDayPage({ params }: StudyDayPageProps) {
  const [dayContent, setDayContent] = useState<DayContent | null>(null);
  const [studyInfo, setStudyInfo] = useState<StudyInfo | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const day = parseInt(params.dayNumber);
  const studyId = params.id;

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);

        // Fetch study info and day content in parallel
        const [studyResponse, dayResponse] = await Promise.all([
          fetch(`http://localhost:3001/api/studies/${studyId}`),
          fetch(`http://localhost:3001/api/studies/${studyId}/day/${day}`)
        ]);

        if (!studyResponse.ok || !dayResponse.ok) {
          throw new Error('Failed to fetch study content');
        }

        const studyResult: ApiResponse<StudyInfo> = await studyResponse.json();
        const dayResult: ApiResponse<DayContent> = await dayResponse.json();

        if (!studyResult.success || !dayResult.success) {
          throw new Error(studyResult.error || dayResult.error || 'Failed to load content');
        }

        setStudyInfo(studyResult.data!);
        setDayContent(dayResult.data!);
      } catch (error) {
        setError(error instanceof Error ? error.message : 'Failed to load study day');
      } finally {
        setLoading(false);
      }
    };

    if (!isNaN(day) && day >= 1) {
      fetchData();
    } else {
      setError('Invalid day number');
      setLoading(false);
    }
  }, [studyId, day]);

  if (loading) {
    return (
      <main className="container">
        <div style={{ textAlign: 'center', padding: '2rem' }}>
          <p>Loading study day...</p>
        </div>
      </main>
    );
  }

  if (error || !dayContent || !studyInfo) {
    return (
      <main className="container">
        <div style={{ textAlign: 'center', padding: '2rem' }}>
          <h2>Day not found</h2>
          <p>{error || 'The requested study day could not be found.'}</p>
          <Link href={`/studies/${studyId}`} className="button button-primary">
            Back to Study
          </Link>
        </div>
      </main>
    );
  }

  return (
    <main className="container">
      {/* Navigation Header */}
      <div style={{ marginBottom: '2rem', borderBottom: '1px solid var(--border)', paddingBottom: '1rem' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1rem' }}>
          <Link
            href={`/studies/${studyId}`}
            style={{
              color: 'var(--text-secondary)',
              fontSize: '0.875rem',
              textDecoration: 'none',
              display: 'inline-flex',
              alignItems: 'center',
              gap: '0.5rem'
            }}
          >
            ← Back to {studyInfo.title}
          </Link>

          <div style={{
            fontSize: '0.875rem',
            color: 'var(--text-secondary)',
            fontWeight: '500'
          }}>
            Day {day} of {studyInfo.duration_days}
          </div>
        </div>

        {/* Day Navigation */}
        <div style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          gap: '1rem'
        }}>
          <div>
            {day > 1 ? (
              <Link
                href={`/studies/${studyId}/day/${day - 1}`}
                className="button button-secondary"
                style={{ fontSize: '0.875rem', padding: '0.5rem 1rem' }}
              >
                ← Previous Day
              </Link>
            ) : (
              <span style={{ color: 'var(--text-secondary)', fontSize: '0.875rem' }}>
                First day
              </span>
            )}
          </div>

          <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: '0.5rem',
            fontSize: '0.875rem',
            color: 'var(--text-secondary)'
          }}>
            {dayContent.frontmatter.estimatedTime && (
              <>
                <span>⏱️ {dayContent.frontmatter.estimatedTime}</span>
              </>
            )}
          </div>

          <div>
            {day < studyInfo.duration_days ? (
              <Link
                href={`/studies/${studyId}/day/${day + 1}`}
                className="button button-secondary"
                style={{ fontSize: '0.875rem', padding: '0.5rem 1rem' }}
              >
                Next Day →
              </Link>
            ) : (
              <span style={{ color: 'var(--text-secondary)', fontSize: '0.875rem' }}>
                Final day
              </span>
            )}
          </div>
        </div>
      </div>

      {/* Day Content */}
      <div className="card" style={{ marginBottom: '2rem' }}>
        <article style={{ lineHeight: '1.7' }}>
          <ReactMarkdown
            components={{
              h1: ({ children }) => (
                <h1 style={{
                  color: 'var(--navy)',
                  marginBottom: '1.5rem',
                  fontSize: '2rem',
                  borderBottom: '2px solid var(--ultra-fine-gold)',
                  paddingBottom: '0.5rem'
                }}>
                  {children}
                </h1>
              ),
              h2: ({ children }) => (
                <h2 style={{
                  color: 'var(--deep-coffee)',
                  marginTop: '2rem',
                  marginBottom: '1rem',
                  fontSize: '1.5rem'
                }}>
                  {children}
                </h2>
              ),
              h3: ({ children }) => (
                <h3 style={{
                  color: 'var(--rich-mahogany)',
                  marginTop: '1.5rem',
                  marginBottom: '0.75rem',
                  fontSize: '1.25rem'
                }}>
                  {children}
                </h3>
              ),
              p: ({ children }) => (
                <p style={{ marginBottom: '1rem' }}>
                  {children}
                </p>
              ),
              strong: ({ children }) => (
                <strong style={{
                  color: 'var(--navy)',
                  fontWeight: '600'
                }}>
                  {children}
                </strong>
              ),
              blockquote: ({ children }) => (
                <blockquote style={{
                  borderLeft: '4px solid var(--ultra-fine-gold)',
                  paddingLeft: '1rem',
                  margin: '1.5rem 0',
                  fontStyle: 'italic',
                  color: 'var(--text-secondary)',
                  backgroundColor: 'var(--soft-blue)',
                  padding: '1rem'
                }}>
                  {children}
                </blockquote>
              ),
              ol: ({ children }) => (
                <ol style={{ marginBottom: '1rem', paddingLeft: '1.5rem' }}>
                  {children}
                </ol>
              ),
              ul: ({ children }) => (
                <ul style={{ marginBottom: '1rem', paddingLeft: '1.5rem' }}>
                  {children}
                </ul>
              ),
              li: ({ children }) => (
                <li style={{ marginBottom: '0.5rem' }}>
                  {children}
                </li>
              )
            }}
          >
            {dayContent.content}
          </ReactMarkdown>
        </article>
      </div>

      {/* Day Navigation Footer */}
      <div style={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        padding: '1rem 0',
        borderTop: '1px solid var(--border)',
        marginTop: '2rem'
      }}>
        <div>
          {day > 1 ? (
            <Link
              href={`/studies/${studyId}/day/${day - 1}`}
              className="button button-secondary"
            >
              ← Day {day - 1}
            </Link>
          ) : (
            <Link
              href={`/studies/${studyId}`}
              className="button button-secondary"
            >
              ← Study Overview
            </Link>
          )}
        </div>

        <div style={{ textAlign: 'center' }}>
          <div style={{ fontSize: '0.875rem', color: 'var(--text-secondary)' }}>
            Progress: {Math.round((day / studyInfo.duration_days) * 100)}% complete
          </div>
          <div style={{
            width: '200px',
            height: '4px',
            backgroundColor: 'var(--border)',
            borderRadius: '2px',
            margin: '0.5rem auto',
            overflow: 'hidden'
          }}>
            <div style={{
              width: `${(day / studyInfo.duration_days) * 100}%`,
              height: '100%',
              backgroundColor: 'var(--ultra-fine-gold)',
              borderRadius: '2px'
            }} />
          </div>
        </div>

        <div>
          {day < studyInfo.duration_days ? (
            <Link
              href={`/studies/${studyId}/day/${day + 1}`}
              className="button button-primary"
            >
              Day {day + 1} →
            </Link>
          ) : (
            <Link
              href="/studies"
              className="button button-primary"
            >
              Browse Studies →
            </Link>
          )}
        </div>
      </div>
    </main>
  );
}