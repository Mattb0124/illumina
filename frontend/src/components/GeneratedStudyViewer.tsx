'use client';

import { useState, useEffect } from 'react';
import { aiService, GeneratedStudy, StudyDayContent } from '@/services/aiService';

interface GeneratedStudyViewerProps {
  requestId: string;
  onBack: () => void;
}

export default function GeneratedStudyViewer({ requestId, onBack }: GeneratedStudyViewerProps) {
  const [study, setStudy] = useState<GeneratedStudy | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedDay, setSelectedDay] = useState<number | null>(null);
  const [expandedSections, setExpandedSections] = useState<Set<string>>(new Set());

  useEffect(() => {
    const fetchStudy = async () => {
      try {
        setLoading(true);
        const studyData = await aiService.getGeneratedStudy(requestId);
        setStudy(studyData);
        setError(null);
      } catch (error) {
        setError(error instanceof Error ? error.message : 'Failed to load generated study');
      } finally {
        setLoading(false);
      }
    };

    fetchStudy();
  }, [requestId]);

  const toggleSection = (section: string) => {
    const newExpanded = new Set(expandedSections);
    if (newExpanded.has(section)) {
      newExpanded.delete(section);
    } else {
      newExpanded.add(section);
    }
    setExpandedSections(newExpanded);
  };

  const renderDayContent = (day: StudyDayContent) => {
    const sections = [
      { id: 'prayer', title: 'Opening Prayer', content: day.openingPrayer },
      { id: 'focus', title: 'Study Focus', content: day.studyFocus },
      { id: 'teaching', title: 'Teaching Content', content: day.teachingContent },
      { id: 'passages', title: 'Bible Passages', content: day.biblePassages },
      { id: 'questions', title: 'Discussion Questions', content: day.discussionQuestions },
      { id: 'reflection', title: 'Reflection', content: day.reflectionQuestion },
      { id: 'application', title: 'Application Points', content: day.applicationPoints },
      { id: 'closingPrayer', title: 'Closing Prayer', content: day.prayerFocus }
    ];

    return (
      <div style={{ marginTop: '1rem' }}>
        {sections.map((section) => (
          <div key={section.id} style={{ marginBottom: '1rem' }}>
            <button
              onClick={() => toggleSection(`${day.dayNumber}-${section.id}`)}
              style={{
                width: '100%',
                textAlign: 'left',
                padding: '0.75rem',
                backgroundColor: 'var(--soft-blue)',
                border: '1px solid var(--border)',
                borderRadius: '6px',
                fontWeight: '600',
                cursor: 'pointer',
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center'
              }}
            >
              {section.title}
              <span style={{ fontSize: '1.2rem' }}>
                {expandedSections.has(`${day.dayNumber}-${section.id}`) ? '−' : '+'}
              </span>
            </button>
            {expandedSections.has(`${day.dayNumber}-${section.id}`) && (
              <div style={{
                padding: '1rem',
                backgroundColor: 'white',
                border: '1px solid var(--border)',
                borderTop: 'none',
                borderBottomLeftRadius: '6px',
                borderBottomRightRadius: '6px'
              }}>
                {renderSectionContent(section.content)}
              </div>
            )}
          </div>
        ))}
      </div>
    );
  };

  const renderSectionContent = (content: any) => {
    if (!content) return <p style={{ color: 'var(--text-secondary)', fontStyle: 'italic' }}>Content not available</p>;

    if (typeof content === 'string') {
      return <p style={{ margin: 0, lineHeight: '1.6' }}>{content}</p>;
    }

    if (Array.isArray(content)) {
      return (
        <ul style={{ margin: 0, paddingLeft: '1.5rem' }}>
          {content.map((item, index) => (
            <li key={index} style={{ marginBottom: '0.5rem' }}>
              {typeof item === 'string' ? item : JSON.stringify(item)}
            </li>
          ))}
        </ul>
      );
    }

    if (typeof content === 'object') {
      return (
        <div>
          {Object.entries(content).map(([key, value]) => (
            <div key={key} style={{ marginBottom: '0.5rem' }}>
              <strong>{key.replace(/([A-Z])/g, ' $1').replace(/^./, str => str.toUpperCase())}:</strong>
              <div style={{ marginLeft: '1rem', marginTop: '0.25rem' }}>
                {renderSectionContent(value)}
              </div>
            </div>
          ))}
        </div>
      );
    }

    return <p>{String(content)}</p>;
  };

  const getValidationBadge = (status: string) => {
    const colors = {
      'approved': { bg: 'var(--deep-green)', text: 'white' },
      'pending': { bg: 'var(--golden-bronze)', text: 'white' },
      'rejected': { bg: 'var(--rich-mahogany)', text: 'white' },
      'needs_review': { bg: 'var(--ultra-fine-gold)', text: 'var(--deep-coffee)' }
    };

    const color = colors[status as keyof typeof colors] || { bg: 'var(--warm-gray)', text: 'white' };

    return (
      <span style={{
        padding: '0.25rem 0.5rem',
        borderRadius: '4px',
        fontSize: '0.75rem',
        fontWeight: '600',
        backgroundColor: color.bg,
        color: color.text
      }}>
        {status.replace(/_/g, ' ').toUpperCase()}
      </span>
    );
  };

  if (loading) {
    return (
      <div className="card" style={{ textAlign: 'center', padding: '2rem' }}>
        <div style={{ marginBottom: '1rem' }}>
          <div className="spinner" style={{
            width: '40px',
            height: '40px',
            border: '4px solid var(--border)',
            borderTop: '4px solid var(--golden-bronze)',
            borderRadius: '50%',
            animation: 'spin 1s linear infinite',
            margin: '0 auto'
          }}></div>
        </div>
        <p>Loading generated study...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="card" style={{ textAlign: 'center', padding: '2rem' }}>
        <h2 style={{ color: 'var(--rich-mahogany)' }}>Error</h2>
        <p>{error}</p>
        <button onClick={onBack} className="button button-secondary">
          Go Back
        </button>
      </div>
    );
  }

  if (!study) return null;

  return (
    <div style={{ maxWidth: '1000px', margin: '0 auto' }}>
      {/* Header */}
      <div className="card" style={{ marginBottom: '2rem' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
          <button
            onClick={onBack}
            style={{
              color: 'var(--text-secondary)',
              fontSize: '0.875rem',
              textDecoration: 'none',
              display: 'inline-flex',
              alignItems: 'center',
              gap: '0.5rem',
              background: 'none',
              border: 'none',
              cursor: 'pointer'
            }}
          >
            ← Back to Generation
          </button>
          <div style={{ textAlign: 'right', fontSize: '0.875rem', color: 'var(--text-secondary)' }}>
            Completed: {new Date(study.request.completedAt).toLocaleString()}
          </div>
        </div>

        <h1 style={{ marginBottom: '1rem', fontSize: '2rem', color: 'var(--navy)' }}>
          {study.request.title}
        </h1>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1rem', marginBottom: '1rem' }}>
          <div><strong>Topic:</strong> {study.request.topic}</div>
          <div><strong>Duration:</strong> {study.request.duration} ({study.request.durationDays} days)</div>
          <div><strong>Style:</strong> {study.request.studyStyle}</div>
          <div><strong>Difficulty:</strong> {study.request.difficulty}</div>
          <div><strong>Audience:</strong> {study.request.audience}</div>
        </div>

        {study.request.specialRequirements && (
          <div style={{ marginTop: '1rem', padding: '1rem', backgroundColor: 'var(--champagne)', borderRadius: '6px' }}>
            <strong>Special Requirements:</strong> {study.request.specialRequirements}
          </div>
        )}
      </div>

      {/* Summary */}
      <div className="card" style={{ marginBottom: '2rem' }}>
        <h2 style={{ marginBottom: '1rem', color: 'var(--navy)' }}>Study Summary</h2>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))', gap: '1rem' }}>
          <div style={{ textAlign: 'center', padding: '1rem', backgroundColor: 'var(--soft-blue)', borderRadius: '6px' }}>
            <div style={{ fontSize: '2rem', fontWeight: 'bold', color: 'var(--navy)' }}>
              {study.summary.totalDays}
            </div>
            <div style={{ fontSize: '0.875rem', color: 'var(--text-secondary)' }}>Total Days</div>
          </div>
          <div style={{ textAlign: 'center', padding: '1rem', backgroundColor: 'var(--deep-cream)', borderRadius: '6px' }}>
            <div style={{ fontSize: '2rem', fontWeight: 'bold', color: 'var(--navy)' }}>
              {study.summary.completedDays}
            </div>
            <div style={{ fontSize: '0.875rem', color: 'var(--text-secondary)' }}>Generated</div>
          </div>
          <div style={{ textAlign: 'center', padding: '1rem', backgroundColor: 'var(--soft-lavender)', borderRadius: '6px' }}>
            <div style={{ fontSize: '2rem', fontWeight: 'bold', color: 'var(--navy)' }}>
              {study.summary.approvedDays}
            </div>
            <div style={{ fontSize: '0.875rem', color: 'var(--text-secondary)' }}>Approved</div>
          </div>
        </div>
      </div>

      {/* Day List */}
      <div className="card">
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
          <h2 style={{ margin: 0, color: 'var(--navy)' }}>Study Content</h2>
          <button
            onClick={() => {
              if (expandedSections.size === 0) {
                // Expand all
                const allSections = new Set<string>();
                study.studyContent.forEach(day => {
                  ['prayer', 'focus', 'teaching', 'passages', 'questions', 'reflection', 'application', 'closingPrayer'].forEach(section => {
                    allSections.add(`${day.dayNumber}-${section}`);
                  });
                });
                setExpandedSections(allSections);
              } else {
                // Collapse all
                setExpandedSections(new Set());
              }
            }}
            className="button button-secondary"
            style={{ fontSize: '0.875rem', padding: '0.5rem 1rem' }}
          >
            {expandedSections.size === 0 ? 'Expand All' : 'Collapse All'}
          </button>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          {study.studyContent.map((day) => (
            <div key={day.dayNumber} style={{
              border: '1px solid var(--border)',
              borderRadius: '8px',
              overflow: 'hidden'
            }}>
              <div style={{
                padding: '1rem',
                backgroundColor: 'var(--parchment)',
                borderBottom: '1px solid var(--border)',
                cursor: 'pointer'
              }}
              onClick={() => setSelectedDay(selectedDay === day.dayNumber ? null : day.dayNumber)}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <div>
                    <h3 style={{ margin: 0, color: 'var(--navy)' }}>
                      Day {day.dayNumber}: {day.title}
                    </h3>
                    <p style={{ margin: '0.25rem 0 0 0', color: 'var(--text-secondary)' }}>
                      {day.theme} • {day.estimatedTime}
                    </p>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                    {getValidationBadge(day.validationStatus)}
                    <span style={{ fontSize: '1.2rem' }}>
                      {selectedDay === day.dayNumber ? '−' : '+'}
                    </span>
                  </div>
                </div>
              </div>

              {selectedDay === day.dayNumber && (
                <div style={{ padding: '1rem' }}>
                  {renderDayContent(day)}
                </div>
              )}
            </div>
          ))}
        </div>
      </div>

      <style jsx>{`
        @keyframes spin {
          0% { transform: rotate(0deg); }
          100% { transform: rotate(360deg); }
        }
      `}</style>
    </div>
  );
}