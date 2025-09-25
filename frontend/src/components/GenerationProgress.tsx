'use client';

import { useState, useEffect } from 'react';
import { aiService, GenerationStatus } from '@/services/aiService';

interface GenerationProgressProps {
  requestId: string;
  onCompleted: (status: GenerationStatus) => void;
  onError: (error: string) => void;
}

export default function GenerationProgress({ requestId, onCompleted, onError }: GenerationProgressProps) {
  const [status, setStatus] = useState<GenerationStatus | null>(null);
  const [isPolling, setIsPolling] = useState(true);
  const [elapsedTime, setElapsedTime] = useState(0);

  useEffect(() => {
    let timeInterval: NodeJS.Timeout | null = null;

    if (isPolling) {
      // Start polling for status updates
      aiService.pollGenerationStatus(
        requestId,
        (updatedStatus) => {
          setStatus(updatedStatus);
        },
        5000, // Poll every 5 seconds
        1800000 // 30 minute timeout
      )
        .then((finalStatus) => {
          setIsPolling(false);
          if (finalStatus.status === 'completed') {
            onCompleted(finalStatus);
          } else if (finalStatus.status === 'failed') {
            onError(finalStatus.errorMessage || 'Study generation failed');
          }
        })
        .catch((error) => {
          setIsPolling(false);
          onError(error.message);
        });

      // Track elapsed time
      const startTime = Date.now();
      timeInterval = setInterval(() => {
        setElapsedTime(Math.floor((Date.now() - startTime) / 1000));
      }, 1000);
    }

    return () => {
      if (timeInterval) clearInterval(timeInterval);
    };
  }, [requestId, isPolling, onCompleted, onError]);

  const handleCancel = async () => {
    try {
      await aiService.cancelGeneration(requestId);
      setIsPolling(false);
      onError('Generation cancelled by user');
    } catch (error) {
      console.error('Error cancelling generation:', error);
    }
  };

  const formatTime = (seconds: number): string => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const getStatusMessage = (status: GenerationStatus): string => {
    switch (status.status) {
      case 'pending':
        return 'Preparing to generate your study...';
      case 'processing':
        return 'Analyzing your request and planning the study...';
      case 'content_generation':
        return 'Creating study content and lessons...';
      case 'validation':
        return 'Reviewing content for accuracy and quality...';
      case 'completed':
        return 'Your study is ready!';
      case 'failed':
        return 'Generation encountered an issue';
      default:
        return 'Generating your Bible study...';
    }
  };

  const getProgressColor = (progress: number): string => {
    if (progress >= 90) return 'var(--ocean-dark)';
    if (progress >= 60) return 'var(--ocean-medium)';
    if (progress >= 30) return 'var(--ocean-light)';
    return 'var(--ocean-accent)';
  };

  // Loading state
  if (!status) {
    return (
      <div className="card glass-earth" style={{
        maxWidth: '600px',
        margin: '0 auto',
        textAlign: 'center',
        padding: '3rem 2rem'
      }}>
        <div style={{ marginBottom: '2rem' }}>
          <div style={{
            width: '60px',
            height: '60px',
            border: '4px solid var(--sage-medium)',
            borderTop: '4px solid var(--ocean-accent)',
            borderRadius: '50%',
            animation: 'spin 1.2s linear infinite',
            margin: '0 auto 1.5rem'
          }}></div>
          <h2 style={{
            color: 'var(--ocean-dark)',
            marginBottom: '0.5rem',
            fontSize: '1.5rem'
          }}>
            Initializing Generation
          </h2>
          <p style={{ color: 'var(--text-secondary)', fontSize: '1rem' }}>
            Setting up your personalized Bible study...
          </p>
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

  return (
    <div className="card glass-earth" style={{ maxWidth: '600px', margin: '0 auto' }}>
      {/* Header */}
      <div style={{ textAlign: 'center', marginBottom: '2.5rem' }}>
        <h1 style={{
          color: 'var(--ocean-dark)',
          marginBottom: '0.5rem',
          fontSize: '1.875rem',
          fontWeight: '700'
        }}>
          {status.title}
        </h1>
        <p style={{
          color: 'var(--text-secondary)',
          fontSize: '1.1rem',
          margin: 0
        }}>
          {getStatusMessage(status)}
        </p>
      </div>

      {/* Progress Section */}
      <div style={{ marginBottom: '2.5rem' }}>
        {/* Progress Bar */}
        <div style={{ marginBottom: '1rem' }}>
          <div style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            marginBottom: '0.75rem'
          }}>
            <span style={{
              fontSize: '1rem',
              fontWeight: '600',
              color: 'var(--ocean-dark)'
            }}>
              Progress
            </span>
            <span style={{
              fontSize: '1.25rem',
              fontWeight: '700',
              color: 'var(--ocean-dark)'
            }}>
              {status.progress}%
            </span>
          </div>
          <div style={{
            width: '100%',
            height: '16px',
            backgroundColor: 'var(--sage-light)',
            borderRadius: '8px',
            overflow: 'hidden',
            border: '1px solid var(--sage-medium)'
          }}>
            <div style={{
              width: `${status.progress}%`,
              height: '100%',
              background: `linear-gradient(90deg, ${getProgressColor(status.progress)}, var(--ocean-accent))`,
              transition: 'width 0.5s ease-in-out',
              borderRadius: '7px'
            }}></div>
          </div>
        </div>

        {/* Status Info */}
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))',
          gap: '1rem',
          padding: '1.25rem',
          backgroundColor: 'var(--sage-light)',
          borderRadius: '12px',
          border: '1px solid var(--sage-medium)'
        }}>
          <div style={{ textAlign: 'center' }}>
            <div style={{
              fontSize: '0.875rem',
              color: 'var(--text-secondary)',
              marginBottom: '0.25rem'
            }}>
              Days Generated
            </div>
            <div style={{
              fontSize: '1.125rem',
              fontWeight: '600',
              color: 'var(--ocean-dark)'
            }}>
              {status.generatedDays} of {status.totalDays}
            </div>
          </div>

          <div style={{ textAlign: 'center' }}>
            <div style={{
              fontSize: '0.875rem',
              color: 'var(--text-secondary)',
              marginBottom: '0.25rem'
            }}>
              Time Elapsed
            </div>
            <div style={{
              fontSize: '1.125rem',
              fontWeight: '600',
              color: 'var(--ocean-dark)'
            }}>
              {formatTime(elapsedTime)}
            </div>
          </div>

          <div style={{ textAlign: 'center' }}>
            <div style={{
              fontSize: '0.875rem',
              color: 'var(--text-secondary)',
              marginBottom: '0.25rem'
            }}>
              Estimated Time Left
            </div>
            <div style={{
              fontSize: '1.125rem',
              fontWeight: '600',
              color: 'var(--ocean-dark)'
            }}>
              {aiService.calculateEstimatedCompletion(status)}
            </div>
          </div>
        </div>
      </div>

      {/* Error Display */}
      {status.errorMessage && (
        <div style={{
          padding: '1rem 1.25rem',
          backgroundColor: '#fef2f2',
          border: '1px solid #fecaca',
          borderRadius: '8px',
          color: '#dc2626',
          marginBottom: '2rem',
          fontSize: '0.925rem'
        }}>
          <strong>Issue:</strong> {status.errorMessage}
        </div>
      )}

      {/* Actions */}
      <div style={{
        display: 'flex',
        justifyContent: 'center',
        gap: '1rem',
        marginBottom: '1.5rem'
      }}>
        {(status.status === 'pending' || status.status === 'processing' || status.status === 'content_generation') && (
          <button
            onClick={handleCancel}
            className="button button-secondary"
            style={{
              padding: '0.875rem 1.75rem',
              fontSize: '0.925rem'
            }}
          >
            Cancel Generation
          </button>
        )}

        {status.status === 'completed' && (
          <button
            onClick={() => onCompleted(status)}
            className="button button-primary"
            style={{
              padding: '0.875rem 1.75rem',
              fontSize: '0.925rem'
            }}
          >
            View Your Study
          </button>
        )}
      </div>

      {/* Simple Info */}
      <div style={{
        backgroundColor: 'var(--warm-cream)',
        padding: '1rem 1.25rem',
        borderRadius: '8px',
        fontSize: '0.875rem',
        color: 'var(--text-secondary)',
        textAlign: 'center',
        border: '1px solid var(--sage-medium)'
      }}>
        <p style={{ margin: 0 }}>
          Our AI is carefully crafting your personalized Bible study with theologically sound content and engaging discussion questions.
        </p>
      </div>
    </div>
  );
}