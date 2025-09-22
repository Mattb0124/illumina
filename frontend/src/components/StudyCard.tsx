import Link from 'next/link';
import { StudySeries } from '@/data/studySeries';

interface StudyCardProps {
  study: StudySeries;
  type: 'active' | 'completed' | 'template';
}

export default function StudyCard({ study, type }: StudyCardProps) {
  if (!study) return null;

  const isTemplate = type === 'template';
  const isCompleted = type === 'completed';
  const isActive = type === 'active';

  return (
    <div className="card">
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '1rem' }}>
        <div style={{ flex: 1 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.5rem' }}>
            <h3 style={{ margin: 0, fontSize: '1.125rem' }}>{study.title}</h3>
            {isActive && (
              <span style={{
                fontSize: '0.75rem',
                color: 'var(--rich-mahogany)',
                fontWeight: '600',
                textTransform: 'uppercase',
                letterSpacing: '0.5px',
                backgroundColor: 'var(--deep-cream)',
                padding: '0.25rem 0.5rem',
                borderRadius: '4px'
              }}>
                In Progress
              </span>
            )}
            {isCompleted && (
              <span style={{
                fontSize: '0.75rem',
                color: 'var(--warm-gray)',
                fontWeight: '600',
                textTransform: 'uppercase',
                letterSpacing: '0.5px'
              }}>
                Completed ✓
              </span>
            )}
          </div>

          <p style={{
            fontSize: '0.875rem',
            color: 'var(--text-secondary)',
            marginBottom: '0.75rem',
            lineHeight: '1.5'
          }}>
            {study.description}
          </p>

          <div style={{ display: 'flex', gap: '1rem', fontSize: '0.75rem', color: 'var(--text-light)', marginBottom: '1rem', flexWrap: 'wrap' }}>
            <span>{study.duration} days</span>
            <span>•</span>
            <span>{study.theme}</span>
            <span>•</span>
            <span>{study.audience}</span>
            <span>•</span>
            <span>{study.estimatedTimePerSession}</span>
            {study.studyStructure === 'weekly' && (
              <>
                <span>•</span>
                <span>{study.weeks?.length || 0} weeks</span>
              </>
            )}
          </div>

          {/* Progress bar for active studies */}
          {isActive && (
            <div style={{ marginBottom: '1rem' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.5rem' }}>
                <span style={{ fontSize: '0.75rem', fontWeight: '500' }}>
                  Day {study.progress.currentDay} of {study.progress.totalDays}
                  {study.progress.currentWeek && ` • Week ${study.progress.currentWeek}`}
                </span>
                <span style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>
                  {study.progress.percentComplete}% complete
                </span>
              </div>
              <div style={{
                width: '100%',
                height: '6px',
                backgroundColor: 'var(--border)',
                borderRadius: '3px',
                overflow: 'hidden'
              }}>
                <div style={{
                  width: `${study.progress.percentComplete}%`,
                  height: '100%',
                  backgroundColor: 'var(--rich-mahogany)',
                  transition: 'width 0.3s ease'
                }} />
              </div>
            </div>
          )}

          {/* Pastor message preview */}
          <div style={{
            backgroundColor: 'var(--soft-blue)',
            padding: '0.75rem',
            borderRadius: '6px',
            fontSize: '0.875rem',
            fontStyle: 'italic',
            color: 'var(--deep-coffee)',
            borderLeft: '3px solid var(--rich-mahogany)'
          }}>
            "{study.pastorMessage}"
          </div>
        </div>
      </div>

      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
          <span style={{
            fontSize: '0.75rem',
            padding: '0.25rem 0.5rem',
            backgroundColor: 'var(--parchment)',
            color: 'var(--deep-coffee)',
            borderRadius: '4px',
            fontWeight: '500'
          }}>
            {study.difficulty}
          </span>
          <span style={{
            fontSize: '0.75rem',
            padding: '0.25rem 0.5rem',
            backgroundColor: 'var(--deep-cream)',
            color: 'var(--rich-mahogany)',
            borderRadius: '4px',
            fontWeight: '500'
          }}>
            {study.studyStyle}
          </span>
        </div>

        <div style={{ display: 'flex', gap: '0.5rem' }}>
          {isActive && (
            <Link href={`/studies/${study.id}`} className="button button-primary">
              Continue Study
            </Link>
          )}
          {isCompleted && (
            <Link href={`/studies/${study.id}`} className="button button-secondary">
              Review
            </Link>
          )}
          {isTemplate && (
            <Link href={`/studies/${study.id}`} className="button button-accent">
              Start Study
            </Link>
          )}
        </div>
      </div>
    </div>
  );
}