'use client';

import { useState, useEffect } from 'react';
import { aiService, GenerationStatus, WorkflowStep } from '@/services/aiService';

interface GenerationProgressProps {
  requestId: string;
  onCompleted: (status: GenerationStatus) => void;
  onError: (error: string) => void;
}

export default function GenerationProgress({ requestId, onCompleted, onError }: GenerationProgressProps) {
  const [status, setStatus] = useState<GenerationStatus | null>(null);
  const [isPolling, setIsPolling] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [elapsedTime, setElapsedTime] = useState(0);

  useEffect(() => {
    let pollInterval: NodeJS.Timeout | null = null;
    let timeInterval: NodeJS.Timeout | null = null;

    if (isPolling) {
      // Start polling for status updates
      aiService.pollGenerationStatus(
        requestId,
        (updatedStatus) => {
          setStatus(updatedStatus);
          setError(null);
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
          setError(error.message);
          onError(error.message);
        });

      // Track elapsed time
      const startTime = Date.now();
      timeInterval = setInterval(() => {
        setElapsedTime(Math.floor((Date.now() - startTime) / 1000));
      }, 1000);
    }

    return () => {
      if (pollInterval) clearInterval(pollInterval);
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

  const getStepIcon = (step: WorkflowStep): string => {
    switch (step.status) {
      case 'completed': return '✅';
      case 'in_progress': return '⏳';
      case 'failed': return '❌';
      default: return '⭕';
    }
  };

  const getProgressColor = (progress: number): string => {
    if (progress >= 90) return 'var(--deep-green)';
    if (progress >= 60) return 'var(--golden-bronze)';
    if (progress >= 30) return 'var(--ultra-fine-gold)';
    return 'var(--soft-blue)';
  };

  if (!status) {
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
        <p>Loading generation status...</p>
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
    <div className="card" style={{ maxWidth: '800px', margin: '0 auto' }}>
      {/* Header */}
      <div style={{ marginBottom: '2rem' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
          <div>
            <h2 style={{ margin: 0, color: 'var(--navy)' }}>Generating Study</h2>
            <p style={{ margin: '0.25rem 0 0 0', color: 'var(--text-secondary)' }}>{status.title}</p>
          </div>
          <div style={{ textAlign: 'right' }}>
            <div style={{ fontSize: '0.875rem', color: 'var(--text-secondary)' }}>
              Elapsed: {formatTime(elapsedTime)}
            </div>
            <div style={{ fontSize: '0.875rem', color: 'var(--text-secondary)' }}>
              ETA: {aiService.calculateEstimatedCompletion(status)}
            </div>
          </div>
        </div>

        {/* Progress Bar */}
        <div style={{ marginBottom: '1rem' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.5rem' }}>
            <span style={{ fontSize: '0.875rem', fontWeight: '600', color: 'var(--navy)' }}>
              Overall Progress
            </span>
            <span style={{ fontSize: '0.875rem', fontWeight: '600', color: 'var(--navy)' }}>
              {status.progress}%
            </span>
          </div>
          <div style={{
            width: '100%',
            height: '12px',
            backgroundColor: 'var(--border)',
            borderRadius: '6px',
            overflow: 'hidden'
          }}>
            <div style={{
              width: `${status.progress}%`,
              height: '100%',
              backgroundColor: getProgressColor(status.progress),
              transition: 'width 0.3s ease-in-out'
            }}></div>
          </div>
        </div>

        {/* Status Badge */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
          <span style={{
            padding: '0.25rem 0.75rem',
            borderRadius: '20px',
            fontSize: '0.875rem',
            fontWeight: '600',
            backgroundColor: aiService.getStatusColor(status.status),
            color: 'white'
          }}>
            {status.status.replace(/_/g, ' ').toUpperCase()}
          </span>
          <span style={{ fontSize: '0.875rem', color: 'var(--text-secondary)' }}>
            {status.generatedDays} of {status.totalDays} days generated
          </span>
        </div>
      </div>

      {/* Workflow Steps */}
      <div style={{ marginBottom: '2rem' }}>
        <h3 style={{ marginBottom: '1rem', color: 'var(--navy)' }}>Workflow Progress</h3>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
          {status.workflowSteps.map((step, index) => (
            <div key={index} style={{
              display: 'flex',
              alignItems: 'center',
              gap: '1rem',
              padding: '0.75rem',
              backgroundColor: step.status === 'in_progress' ? 'var(--soft-blue)' : 'transparent',
              borderRadius: '6px',
              border: step.status === 'in_progress' ? '1px solid var(--golden-bronze)' : '1px solid transparent'
            }}>
              <span style={{ fontSize: '1.25rem' }}>{getStepIcon(step)}</span>
              <div style={{ flex: 1 }}>
                <div style={{ fontWeight: '600', color: 'var(--navy)' }}>
                  {aiService.formatWorkflowStep(step.step)}
                </div>
                {step.startedAt && (
                  <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>
                    {step.status === 'completed' && step.completedAt
                      ? `Completed at ${new Date(step.completedAt).toLocaleTimeString()}`
                      : `Started at ${new Date(step.startedAt).toLocaleTimeString()}`
                    }
                  </div>
                )}
              </div>
              <div style={{
                padding: '0.25rem 0.5rem',
                borderRadius: '4px',
                fontSize: '0.75rem',
                fontWeight: '600',
                backgroundColor:
                  step.status === 'completed' ? 'var(--deep-green)' :
                  step.status === 'in_progress' ? 'var(--golden-bronze)' :
                  step.status === 'failed' ? 'var(--rich-mahogany)' :
                  'var(--warm-gray)',
                color: 'white'
              }}>
                {step.status.replace(/_/g, ' ')}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Study Details */}
      <div style={{ marginBottom: '2rem' }}>
        <h3 style={{ marginBottom: '1rem', color: 'var(--navy)' }}>Study Details</h3>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1rem' }}>
          <div>
            <strong>Topic:</strong> {status.topic}
          </div>
          <div>
            <strong>Duration:</strong> {status.duration} ({status.durationDays} days)
          </div>
          <div>
            <strong>Started:</strong> {new Date(status.createdAt).toLocaleString()}
          </div>
          <div>
            <strong>Request ID:</strong> {status.requestId.slice(0, 8)}...
          </div>
        </div>
      </div>

      {/* Error Display */}
      {status.errorMessage && (
        <div style={{
          padding: '1rem',
          backgroundColor: '#FEF2F2',
          border: '1px solid #FECACA',
          borderRadius: '6px',
          color: '#DC2626',
          marginBottom: '2rem'
        }}>
          <strong>Error:</strong> {status.errorMessage}
        </div>
      )}

      {/* Actions */}
      <div style={{ display: 'flex', justifyContent: 'center', gap: '1rem' }}>
        {(status.status === 'pending' || status.status === 'processing') && (
          <button
            onClick={handleCancel}
            className="button button-secondary"
            style={{ padding: '0.75rem 1.5rem' }}
          >
            Cancel Generation
          </button>
        )}

        {status.status === 'completed' && (
          <button
            onClick={() => onCompleted(status)}
            className="button button-primary"
            style={{ padding: '0.75rem 1.5rem' }}
          >
            View Generated Study
          </button>
        )}
      </div>

      {/* Info Section */}
      <div style={{
        backgroundColor: 'var(--soft-lavender)',
        padding: '1rem',
        borderRadius: '6px',
        fontSize: '0.875rem',
        color: 'var(--deep-coffee)',
        marginTop: '2rem'
      }}>
        <p style={{ margin: 0 }}>
          <strong>Note:</strong> Study generation involves multiple AI agents working together to ensure
          theological accuracy and biblical soundness. The process includes content generation,
          Bible verse validation, and theological review by AI experts.
        </p>
      </div>
    </div>
  );
}