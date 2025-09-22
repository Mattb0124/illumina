'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { getStudyById, StudySeries, StudyDay, StudyWeek } from '@/data/studySeries';
import { bibleService, BiblePassage } from '@/services/BibleService';

interface StudyPageProps {
  params: { id: string };
}

export default function StudyPage({ params }: StudyPageProps) {
  const study = getStudyById(params.id);
  const [notes, setNotes] = useState('');
  const [reflectionAnswer, setReflectionAnswer] = useState('');
  const [passages, setPassages] = useState<BiblePassage[]>([]);
  const [isLoadingPassages, setIsLoadingPassages] = useState(false);

  if (!study) {
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

  // Get current day from appropriate structure
  let currentDay: StudyDay | undefined;
  let currentWeek: StudyWeek | undefined;
  let completedDays = 0;

  if (study.studyStructure === 'weekly' && study.weeks) {
    // For weekly studies, find current week and day
    currentWeek = study.weeks.find(week =>
      week.days.some(day => day.day === study.progress.currentDay)
    );
    currentDay = currentWeek?.days.find(day => day.day === study.progress.currentDay);
    completedDays = study.weeks.flatMap(w => w.days).filter(day => day.completed).length;
  } else if (study.days) {
    // For daily studies
    currentDay = study.days.find(day => day.day === study.progress.currentDay);
    completedDays = study.days.filter(day => day.completed).length;
  }

  // Load Bible passages when component mounts or currentDay changes
  useEffect(() => {
    if (currentDay?.passages) {
      setIsLoadingPassages(true);
      Promise.all(
        currentDay.passages.map(passage =>
          bibleService.getPassage(passage.reference)
        )
      ).then(results => {
        setPassages(results);
        setIsLoadingPassages(false);
      }).catch(error => {
        console.error('Failed to load passages:', error);
        setPassages(currentDay.passages);
        setIsLoadingPassages(false);
      });
    }
  }, [currentDay]);

  const canGoToPrevious = study.progress.currentDay > 1;
  const canGoToNext = study.progress.currentDay < study.duration;

  if (!currentDay) {
    return (
      <main className="container">
        <div style={{ textAlign: 'center', padding: '2rem' }}>
          <h2>Study Complete!</h2>
          <p>You've finished this study. Great work!</p>
          <Link href="/studies" className="button button-primary">
            Back to Studies
          </Link>
        </div>
      </main>
    );
  }

  return (
    <main className="container">
      {/* Professional Header */}
      <div style={{ marginBottom: '2.5rem' }}>
        <Link
          href="/studies"
          style={{
            color: 'var(--text-secondary)',
            fontSize: '0.875rem',
            textDecoration: 'none',
            marginBottom: '1.5rem',
            display: 'inline-flex',
            alignItems: 'center',
            gap: '0.5rem'
          }}
        >
          ← Back to Studies
        </Link>

        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '2rem' }}>
          <div style={{ flex: 1 }}>
            <h1 style={{ marginBottom: '0.5rem', fontSize: '1.75rem' }}>{study.title}</h1>
            {currentWeek && (
              <div style={{ marginBottom: '0.5rem' }}>
                <span style={{
                  fontSize: '1rem',
                  fontWeight: '600',
                  color: 'var(--rich-mahogany)',
                  display: 'block'
                }}>
                  Week {currentWeek.week}: {currentWeek.title}
                </span>
                <span style={{ fontSize: '0.875rem', color: 'var(--text-secondary)' }}>
                  {currentWeek.theme}
                </span>
              </div>
            )}
            <div style={{ display: 'flex', gap: '1rem', fontSize: '0.875rem', color: 'var(--text-secondary)', marginBottom: '0.5rem' }}>
              <span>Day {study.progress.currentDay}</span>
              <span>•</span>
              <span>{currentDay.estimatedTime}</span>
              <span>•</span>
              <span>{study.audience}</span>
            </div>

          </div>
          <div style={{ display: 'flex', gap: '0.75rem' }}>
            <button
              disabled={!canGoToPrevious}
              className="button button-secondary"
              style={{
                fontSize: '0.875rem',
                padding: '0.5rem 1rem',
                opacity: canGoToPrevious ? 1 : 0.4,
                cursor: canGoToPrevious ? 'pointer' : 'not-allowed'
              }}
            >
              ← Previous
            </button>
            <button
              disabled={!canGoToNext}
              className="button button-primary"
              style={{
                fontSize: '0.875rem',
                padding: '0.5rem 1rem',
                opacity: canGoToNext ? 1 : 0.4,
                cursor: canGoToNext ? 'pointer' : 'not-allowed'
              }}
            >
              Next →
            </button>
          </div>
        </div>

        {/* Progress indicator */}
        <div style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          padding: '1rem',
          backgroundColor: 'var(--deep-cream)',
          borderRadius: '8px',
          border: '1px solid var(--border)'
        }}>
          <div style={{ fontSize: '0.875rem', fontWeight: '500' }}>
            Progress: {completedDays} of {study.duration} days completed
          </div>
          <div style={{ fontSize: '0.875rem', color: 'var(--text-secondary)' }}>
            {Math.round((completedDays / study.duration) * 100)}%
          </div>
        </div>
      </div>


      {/* Opening Prayer (for couples studies) */}
      {currentDay.openingPrayer && (
        <div style={{ marginBottom: '2.5rem' }}>
          <h3 style={{
            margin: '0 0 1rem 0',
            fontSize: '1.2rem',
            fontWeight: '600',
            color: 'var(--navy)'
          }}>
            Opening Prayer
          </h3>
          <p style={{
            margin: '0',
            fontSize: '1rem',
            fontStyle: 'italic',
            color: 'var(--text-primary)',
            lineHeight: '1.7'
          }}>
            {currentDay.openingPrayer}
          </p>
        </div>
      )}

      {/* Scripture Reading Section */}
      <div style={{ marginBottom: '3rem' }}>
          <h2 style={{
            margin: '0 0 1.5rem 0',
            fontSize: '1.5rem',
            fontWeight: '600',
            color: 'var(--navy)'
          }}>
            Today's Scripture
          </h2>

          {isLoadingPassages ? (
            <div style={{ textAlign: 'center', padding: '2rem', color: 'var(--text-secondary)' }}>
              Loading passages...
            </div>
          ) : (
            (passages.length > 0 ? passages : currentDay.passages).map((passage, passageIndex) => (
              <div key={passageIndex} style={{ marginBottom: passageIndex < passages.length - 1 ? '2rem' : '0' }}>
                <div style={{
                  fontSize: '0.875rem',
                  fontWeight: '600',
                  color: 'var(--rich-mahogany)',
                  letterSpacing: '1px',
                  textTransform: 'uppercase',
                  marginBottom: '1rem'
                }}>
                  {passage.reference}
                </div>

                <div style={{ marginBottom: '1rem' }}>
                  {passage.text.map((verse, index) => (
                    <p
                      key={verse.verse}
                      style={{
                        marginBottom: index < passage.text.length - 1 ? '1rem' : '0',
                        fontSize: '1.1rem',
                        lineHeight: '1.7',
                        fontFamily: 'var(--font-scripture)',
                        color: 'var(--text-primary)'
                      }}
                    >
                      <span style={{
                        fontSize: '0.9rem',
                        color: 'var(--golden-bronze)',
                        fontWeight: '600',
                        marginRight: '0.75rem',
                        fontFamily: 'var(--font-decorative)'
                      }}>
                        {verse.verse}
                      </span>
                      {verse.content}
                    </p>
                  ))}
                </div>
              </div>
            ))
          )}
      </div>

      {/* Study Focus */}
      <div style={{ marginBottom: '2.5rem' }}>
          <h3 style={{
            margin: '0 0 1rem 0',
            fontSize: '1.2rem',
            fontWeight: '600',
            color: 'var(--navy)'
          }}>
            Study Focus
          </h3>
          <p style={{
            margin: '0',
            fontSize: '1rem',
            color: 'var(--text-primary)',
            lineHeight: '1.7'
          }}>
            {currentDay.studyFocus}
          </p>
      </div>

      {/* Key Teaching */}
      <div style={{ marginBottom: '2.5rem' }}>
          <h3 style={{
            margin: '0 0 1rem 0',
            fontSize: '1.2rem',
            fontWeight: '600',
            color: 'var(--navy)'
          }}>
            Key Teaching
          </h3>
          <p style={{
            fontSize: '1rem',
            lineHeight: '1.7',
            margin: '0',
            color: 'var(--text-primary)'
          }}>
            {currentDay.teachingPoint}
          </p>
      </div>

      {/* Discussion Questions (for couples/group studies) */}
      {currentDay.discussionQuestions && currentDay.discussionQuestions.length > 0 && (
        <div style={{ marginBottom: '2.5rem' }}>
            <h3 style={{
              margin: '0 0 1rem 0',
              fontSize: '1.2rem',
              fontWeight: '600',
              color: 'var(--navy)'
            }}>
              Discussion Questions
            </h3>
            <div style={{ marginBottom: '1rem' }}>
              {currentDay.discussionQuestions.map((question, index) => (
                <div key={index} style={{ marginBottom: '1rem' }}>
                  <p style={{
                    margin: '0',
                    fontSize: '1rem',
                    color: 'var(--text-primary)',
                    lineHeight: '1.7'
                  }}>
                    <strong>{index + 1}.</strong> {question}
                  </p>
                </div>
              ))}
            </div>
        </div>
      )}

      {/* Application Points */}
      {currentDay.applicationPoints && currentDay.applicationPoints.length > 0 && (
        <div style={{ marginBottom: '2.5rem' }}>
            <h3 style={{
              margin: '0 0 1rem 0',
              fontSize: '1.2rem',
              fontWeight: '600',
              color: 'var(--navy)'
            }}>
              This Week's Application
            </h3>
            <div>
              {currentDay.applicationPoints.map((point, index) => (
                <div key={index} style={{ marginBottom: '1rem' }}>
                  <p style={{
                    margin: '0',
                    fontSize: '1rem',
                    color: 'var(--text-primary)',
                    lineHeight: '1.7'
                  }}>
                    <strong>{index + 1}.</strong> {point}
                  </p>
                </div>
              ))}
            </div>
        </div>
      )}

      {/* Personal Reflection */}
      <div style={{ marginBottom: '2.5rem' }}>
          <h3 style={{
            margin: '0 0 1rem 0',
            fontSize: '1.2rem',
            fontWeight: '600',
            color: 'var(--navy)'
          }}>
            Personal Reflection
          </h3>
          <p style={{
            fontSize: '1rem',
            fontStyle: 'italic',
            color: 'var(--text-primary)',
            lineHeight: '1.7',
            margin: '0 0 1rem 0'
          }}>
            {currentDay.reflectionQuestion}
          </p>
          <textarea
            value={reflectionAnswer}
            onChange={(e) => setReflectionAnswer(e.target.value)}
            placeholder="Take time to reflect and respond to this question. What is God speaking to you today?"
            style={{
              width: '100%',
              minHeight: '100px',
              padding: '0.75rem',
              border: '1px solid var(--border)',
              borderRadius: '6px',
              fontSize: '0.95rem',
              lineHeight: '1.6',
              resize: 'vertical',
              fontFamily: 'inherit'
            }}
          />
      </div>

      {/* Prayer Focus */}
      <div style={{ marginBottom: '2.5rem' }}>
          <h3 style={{
            margin: '0 0 1rem 0',
            fontSize: '1.2rem',
            fontWeight: '600',
            color: 'var(--navy)'
          }}>
            Prayer Focus
          </h3>
          <p style={{
            fontSize: '1rem',
            lineHeight: '1.7',
            margin: '0 0 1rem 0',
            color: 'var(--text-primary)'
          }}>
            {currentDay.prayerFocus}
          </p>
      </div>

      {/* Personal Notes */}
      <div style={{ marginBottom: '2.5rem' }}>
          <h3 style={{
            margin: '0 0 1rem 0',
            fontSize: '1.2rem',
            fontWeight: '600',
            color: 'var(--navy)'
          }}>
            Notes & Insights
          </h3>
          <textarea
            value={currentDay.notes || notes}
            onChange={(e) => setNotes(e.target.value)}
            placeholder="Record your thoughts, insights, questions, or commitments from today's study..."
            style={{
              width: '100%',
              minHeight: '120px',
              padding: '0.75rem',
              border: '1px solid var(--border)',
              borderRadius: '6px',
              fontSize: '0.95rem',
              lineHeight: '1.6',
              resize: 'vertical',
              fontFamily: 'inherit'
            }}
          />
      </div>

      {/* Action Bar */}
      <div style={{ marginBottom: '2rem' }}>
        <div style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          padding: '1.5rem',
          backgroundColor: 'var(--parchment)',
          borderRadius: '8px',
          border: '1px solid var(--border)'
        }}>
          <div style={{ display: 'flex', gap: '1rem', alignItems: 'center' }}>
            <button
              onClick={() => {/* Save progress */}}
              className="button button-secondary"
              style={{ fontSize: '0.875rem', padding: '0.5rem 1rem' }}
            >
              Save Progress
            </button>
            {study.audience === 'couples' && (
              <div style={{ fontSize: '0.875rem', color: 'var(--text-secondary)' }}>
                Share this study with your spouse
              </div>
            )}
          </div>
          <button
            onClick={() => {/* Mark as complete */}}
            className="button button-accent"
            style={{ fontSize: '0.95rem', padding: '0.75rem 1.5rem' }}
          >
            Complete Day {currentDay.day}
          </button>
        </div>
      </div>

    </main>
  );
}