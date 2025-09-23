'use client';

import { useState } from 'react';
import StudyGenerationForm from '@/components/StudyGenerationForm';
import GenerationProgress from '@/components/GenerationProgress';
import GeneratedStudyViewer from '@/components/GeneratedStudyViewer';
import { GenerationStatus } from '@/services/aiService';

type ViewState = 'form' | 'progress' | 'completed';

export default function RequestStudyPage() {
  const [currentView, setCurrentView] = useState<ViewState>('form');
  const [requestId, setRequestId] = useState<string | null>(null);
  const [completedStatus, setCompletedStatus] = useState<GenerationStatus | null>(null);

  const handleGenerationStarted = (newRequestId: string) => {
    setRequestId(newRequestId);
    setCurrentView('progress');
  };

  const handleGenerationCompleted = (status: GenerationStatus) => {
    setCompletedStatus(status);
    setCurrentView('completed');
  };

  const handleGenerationError = (error: string) => {
    console.error('Generation error:', error);
    // Could show error state or go back to form
    setCurrentView('form');
  };

  const handleBackToForm = () => {
    setCurrentView('form');
    setRequestId(null);
    setCompletedStatus(null);
  };

  const handleBackToProgress = () => {
    setCurrentView('progress');
  };

  return (
    <main className="container">
      {/* Page Header */}
      <div style={{ marginBottom: '2rem', textAlign: 'center' }}>
        <h1 style={{ marginBottom: '0.5rem', fontSize: '2.5rem', color: 'var(--navy)' }}>
          AI Study Generator
        </h1>
        <p style={{ color: 'var(--text-secondary)', fontSize: '1.1rem', maxWidth: '600px', margin: '0 auto' }}>
          Create comprehensive, theologically sound Bible studies powered by advanced AI technology
        </p>
      </div>

      {/* Navigation Breadcrumbs */}
      {currentView !== 'form' && (
        <div style={{ marginBottom: '2rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.875rem', color: 'var(--text-secondary)' }}>
            <button
              onClick={handleBackToForm}
              style={{
                color: 'var(--text-secondary)',
                background: 'none',
                border: 'none',
                cursor: 'pointer',
                textDecoration: 'underline'
              }}
            >
              Study Generator
            </button>
            <span>→</span>
            {currentView === 'progress' && <span>Generation Progress</span>}
            {currentView === 'completed' && (
              <>
                <button
                  onClick={handleBackToProgress}
                  style={{
                    color: 'var(--text-secondary)',
                    background: 'none',
                    border: 'none',
                    cursor: 'pointer',
                    textDecoration: 'underline'
                  }}
                >
                  Progress
                </button>
                <span>→</span>
                <span>Generated Study</span>
              </>
            )}
          </div>
        </div>
      )}

      {/* Main Content */}
      {currentView === 'form' && (
        <StudyGenerationForm onGenerationStarted={handleGenerationStarted} />
      )}

      {currentView === 'progress' && requestId && (
        <GenerationProgress
          requestId={requestId}
          onCompleted={handleGenerationCompleted}
          onError={handleGenerationError}
        />
      )}

      {currentView === 'completed' && requestId && (
        <GeneratedStudyViewer
          requestId={requestId}
          onBack={handleBackToProgress}
        />
      )}

      {/* Feature Highlights */}
      {currentView === 'form' && (
        <div style={{ marginTop: '3rem' }}>
          <div className="card" style={{ backgroundColor: 'var(--soft-blue)' }}>
            <h3 style={{ marginBottom: '1.5rem', textAlign: 'center', color: 'var(--navy)' }}>
              AI-Powered Study Generation Features
            </h3>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '2rem' }}>
              <div style={{ textAlign: 'center' }}>
                <div style={{ fontSize: '2rem', marginBottom: '0.5rem' }}>🤖</div>
                <h4 style={{ marginBottom: '0.5rem', color: 'var(--navy)' }}>Multi-Agent AI System</h4>
                <p style={{ fontSize: '0.875rem', color: 'var(--text-secondary)', margin: 0 }}>
                  Multiple specialized AI agents work together to parse requests, plan studies, generate content, and validate accuracy.
                </p>
              </div>

              <div style={{ textAlign: 'center' }}>
                <div style={{ fontSize: '2rem', marginBottom: '0.5rem' }}>📖</div>
                <h4 style={{ marginBottom: '0.5rem', color: 'var(--navy)' }}>Bible Verse Validation</h4>
                <p style={{ fontSize: '0.875rem', color: 'var(--text-secondary)', margin: 0 }}>
                  Every Bible reference is automatically validated using our integrated Bible API with intelligent caching.
                </p>
              </div>

              <div style={{ textAlign: 'center' }}>
                <div style={{ fontSize: '2rem', marginBottom: '0.5rem' }}>⛪</div>
                <h4 style={{ marginBottom: '0.5rem', color: 'var(--navy)' }}>Theological Review</h4>
                <p style={{ fontSize: '0.875rem', color: 'var(--text-secondary)', margin: 0 }}>
                  Advanced AI reviews all content for theological accuracy, doctrinal consistency, and biblical soundness.
                </p>
              </div>

              <div style={{ textAlign: 'center' }}>
                <div style={{ fontSize: '2rem', marginBottom: '0.5rem' }}>⚡</div>
                <h4 style={{ marginBottom: '0.5rem', color: 'var(--navy)' }}>Real-Time Progress</h4>
                <p style={{ fontSize: '0.875rem', color: 'var(--text-secondary)', margin: 0 }}>
                  Track generation progress in real-time with detailed workflow steps and status updates.
                </p>
              </div>

              <div style={{ textAlign: 'center' }}>
                <div style={{ fontSize: '2rem', marginBottom: '0.5rem' }}>🎯</div>
                <h4 style={{ marginBottom: '0.5rem', color: 'var(--navy)' }}>Customizable Content</h4>
                <p style={{ fontSize: '0.875rem', color: 'var(--text-secondary)', margin: 0 }}>
                  Tailored for different audiences, difficulty levels, and study styles with comprehensive content generation.
                </p>
              </div>

              <div style={{ textAlign: 'center' }}>
                <div style={{ fontSize: '2rem', marginBottom: '0.5rem' }}>✅</div>
                <h4 style={{ marginBottom: '0.5rem', color: 'var(--navy)' }}>Quality Assurance</h4>
                <p style={{ fontSize: '0.875rem', color: 'var(--text-secondary)', margin: 0 }}>
                  Multi-layer validation ensures high-quality, theologically sound, and educationally effective content.
                </p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Quick Start Examples */}
      {currentView === 'form' && (
        <div style={{ marginTop: '2rem' }}>
          <div className="card">
            <h3 style={{ marginBottom: '1rem', color: 'var(--navy)' }}>Example Study Requests</h3>
            <p style={{ marginBottom: '1rem', color: 'var(--text-secondary)' }}>
              Need inspiration? Here are some example study requests that work well with our AI generator:
            </p>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '1rem' }}>
              <div style={{ padding: '1rem', backgroundColor: 'var(--champagne)', borderRadius: '6px' }}>
                <h4 style={{ marginBottom: '0.5rem', color: 'var(--navy)' }}>Marriage Studies</h4>
                <p style={{ fontSize: '0.875rem', margin: 0 }}>
                  "Create an 8-week marriage Bible study for couples focusing on communication, biblical foundations, and strengthening relationships through God's design."
                </p>
              </div>

              <div style={{ padding: '1rem', backgroundColor: 'var(--deep-cream)', borderRadius: '6px' }}>
                <h4 style={{ marginBottom: '0.5rem', color: 'var(--navy)' }}>Personal Growth</h4>
                <p style={{ fontSize: '0.875rem', margin: 0 }}>
                  "Design a 21-day devotional study on overcoming anxiety through biblical principles, intermediate level for individuals seeking peace."
                </p>
              </div>

              <div style={{ padding: '1rem', backgroundColor: 'var(--soft-lavender)', borderRadius: '6px' }}>
                <h4 style={{ marginBottom: '0.5rem', color: 'var(--navy)' }}>Family Studies</h4>
                <p style={{ fontSize: '0.875rem', margin: 0 }}>
                  "Generate a 30-day family devotional study on the Fruits of the Spirit suitable for parents and children to do together."
                </p>
              </div>
            </div>
          </div>
        </div>
      )}
    </main>
  );
}