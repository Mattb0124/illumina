'use client';

import { useState } from 'react';
import { aiService, StudyGenerationFormData, parseDurationToDays } from '@/services/aiService';

interface StudyGenerationFormProps {
  onGenerationStarted: (requestId: string) => void;
}

export default function StudyGenerationForm({ onGenerationStarted }: StudyGenerationFormProps) {
  const [formData, setFormData] = useState<StudyGenerationFormData>({
    userRequest: '',
    title: '',
    topic: '',
    duration: '',
    studyStyle: 'devotional',
    difficulty: 'beginner',
    audience: 'individual',
    specialRequirements: ''
  });

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
    setError(null);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    e.stopPropagation(); // Prevent event bubbling

    console.log('🚀 Form submission started', { formData });
    setIsSubmitting(true);
    setError(null);

    try {
      // Validate required fields
      if (!formData.title.trim() || !formData.topic.trim() || !formData.duration.trim()) {
        const errorMsg = 'Please fill in all required fields (title, topic, duration)';
        console.error('❌ Validation failed:', errorMsg);
        throw new Error(errorMsg);
      }

      // Validate duration format
      try {
        const durationDays = parseDurationToDays(formData.duration);
        console.log('✅ Duration parsed successfully:', { duration: formData.duration, days: durationDays });
      } catch (durationError) {
        console.error('❌ Duration parsing failed:', durationError);
        throw new Error(durationError instanceof Error ? durationError.message : 'Invalid duration format');
      }

      console.log('📡 Calling aiService.generateStudy...');
      const result = await aiService.generateStudy(formData);
      console.log('📡 API Response received:', result);

      if (!result || !result.requestId) {
        console.error('❌ Invalid API response structure:', result);
        throw new Error('Invalid response from server - missing requestId');
      }

      console.log('✅ Valid response with requestId:', result.requestId);
      console.log('🔄 Calling onGenerationStarted callback...');

      onGenerationStarted(result.requestId);
      console.log('✅ onGenerationStarted callback completed');

    } catch (error) {
      console.error('❌ Error in study generation:', error);

      // Provide user-friendly error messages based on error type
      let userFriendlyMessage = 'An unexpected error occurred. Please try again.';

      if (error instanceof Error) {
        const errorMessage = error.message.toLowerCase();

        if (errorMessage.includes('network') || errorMessage.includes('fetch')) {
          userFriendlyMessage = 'Unable to connect to our servers. Please check your internet connection and try again.';
        } else if (errorMessage.includes('unauthorized') || errorMessage.includes('401')) {
          userFriendlyMessage = 'Your session has expired. Please refresh the page and login again.';
        } else if (errorMessage.includes('validation') || errorMessage.includes('invalid')) {
          userFriendlyMessage = error.message; // Show validation errors as-is
        } else if (errorMessage.includes('duration')) {
          userFriendlyMessage = error.message; // Show duration parsing errors as-is
        } else if (errorMessage.includes('required')) {
          userFriendlyMessage = error.message; // Show required field errors as-is
        } else if (errorMessage.includes('server') || errorMessage.includes('500')) {
          userFriendlyMessage = 'Our servers are experiencing issues. Please try again in a few minutes.';
        } else if (errorMessage.includes('timeout')) {
          userFriendlyMessage = 'The request took too long to process. Please try again with a shorter study or check your connection.';
        } else if (errorMessage.includes('requestid')) {
          userFriendlyMessage = 'Study generation started but we lost track of it. Please try again or contact support.';
        } else {
          // Use the original error message for other cases
          userFriendlyMessage = error.message;
        }
      }

      setError(userFriendlyMessage);
    } finally {
      setIsSubmitting(false);
      console.log('🏁 Form submission completed');
    }
  };

  const exampleRequests = [
    "Create an 8-week marriage Bible study for couples focusing on communication and biblical foundations",
    "Design a 21-day devotional study on prayer for individual believers, beginner level",
    "Build a 6-week topical study on overcoming anxiety through biblical principles for small groups",
    "Generate a 30-day family devotional study on the Fruits of the Spirit for parents and children"
  ];

  return (
    <div className="card" style={{ maxWidth: '800px', margin: '0 auto' }}>
      <div style={{ marginBottom: '2rem' }}>
        <h2 style={{ marginBottom: '0.5rem', color: 'var(--navy)' }}>Generate AI Bible Study</h2>
        <p style={{ color: 'var(--text-secondary)' }}>
          Describe your Bible study vision and our AI will create a comprehensive, theologically sound study plan.
        </p>
      </div>

      <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
        {/* User Request */}
        <div>
          <label htmlFor="userRequest" style={{ display: 'block', marginBottom: '0.5rem', fontWeight: '600', color: 'var(--navy)' }}>
            Study Description <span style={{ color: 'var(--rich-mahogany)' }}>*</span>
          </label>
          <textarea
            id="userRequest"
            name="userRequest"
            value={formData.userRequest}
            onChange={handleInputChange}
            placeholder="Describe the Bible study you'd like to create..."
            rows={4}
            style={{
              width: '100%',
              padding: '0.75rem',
              border: '1px solid var(--border)',
              borderRadius: '6px',
              fontSize: '1rem',
              fontFamily: 'inherit',
              resize: 'vertical'
            }}
            required
          />
          <div style={{ marginTop: '0.5rem' }}>
            <p style={{ fontSize: '0.875rem', color: 'var(--text-secondary)', marginBottom: '0.5rem' }}>
              Example requests:
            </p>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.25rem' }}>
              {exampleRequests.map((example, index) => (
                <button
                  key={index}
                  type="button"
                  onClick={() => setFormData(prev => ({ ...prev, userRequest: example }))}
                  style={{
                    textAlign: 'left',
                    padding: '0.5rem',
                    backgroundColor: 'var(--soft-blue)',
                    border: '1px solid var(--border)',
                    borderRadius: '4px',
                    fontSize: '0.8rem',
                    cursor: 'pointer',
                    transition: 'background-color 0.2s'
                  }}
                  onMouseEnter={(e) => e.currentTarget.style.backgroundColor = 'var(--deep-cream)'}
                  onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'var(--soft-blue)'}
                >
                  {example}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Basic Information */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: '1rem' }}>
          <div>
            <label htmlFor="title" style={{ display: 'block', marginBottom: '0.5rem', fontWeight: '600', color: 'var(--navy)' }}>
              Study Title <span style={{ color: 'var(--rich-mahogany)' }}>*</span>
            </label>
            <input
              type="text"
              id="title"
              name="title"
              value={formData.title}
              onChange={handleInputChange}
              placeholder="e.g., Marriage Foundations"
              style={{
                width: '100%',
                padding: '0.75rem',
                border: '1px solid var(--border)',
                borderRadius: '6px',
                fontSize: '1rem'
              }}
              required
            />
          </div>

          <div>
            <label htmlFor="topic" style={{ display: 'block', marginBottom: '0.5rem', fontWeight: '600', color: 'var(--navy)' }}>
              Main Topic <span style={{ color: 'var(--rich-mahogany)' }}>*</span>
            </label>
            <input
              type="text"
              id="topic"
              name="topic"
              value={formData.topic}
              onChange={handleInputChange}
              placeholder="e.g., Marriage, Prayer, Faith"
              style={{
                width: '100%',
                padding: '0.75rem',
                border: '1px solid var(--border)',
                borderRadius: '6px',
                fontSize: '1rem'
              }}
              required
            />
          </div>

          <div>
            <label htmlFor="duration" style={{ display: 'block', marginBottom: '0.5rem', fontWeight: '600', color: 'var(--navy)' }}>
              Duration <span style={{ color: 'var(--rich-mahogany)' }}>*</span>
            </label>
            <input
              type="text"
              id="duration"
              name="duration"
              value={formData.duration}
              onChange={handleInputChange}
              placeholder="e.g., 8 weeks, 30 days"
              style={{
                width: '100%',
                padding: '0.75rem',
                border: '1px solid var(--border)',
                borderRadius: '6px',
                fontSize: '1rem'
              }}
              required
            />
          </div>
        </div>

        {/* Study Configuration */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1rem' }}>
          <div>
            <label htmlFor="studyStyle" style={{ display: 'block', marginBottom: '0.5rem', fontWeight: '600', color: 'var(--navy)' }}>
              Study Style
            </label>
            <select
              id="studyStyle"
              name="studyStyle"
              value={formData.studyStyle}
              onChange={handleInputChange}
              style={{
                width: '100%',
                padding: '0.75rem',
                border: '1px solid var(--border)',
                borderRadius: '6px',
                fontSize: '1rem',
                backgroundColor: 'white'
              }}
            >
              <option value="devotional">Devotional</option>
              <option value="topical">Topical</option>
              <option value="book-study">Book Study</option>
              <option value="marriage">Marriage</option>
            </select>
          </div>

          <div>
            <label htmlFor="difficulty" style={{ display: 'block', marginBottom: '0.5rem', fontWeight: '600', color: 'var(--navy)' }}>
              Difficulty Level
            </label>
            <select
              id="difficulty"
              name="difficulty"
              value={formData.difficulty}
              onChange={handleInputChange}
              style={{
                width: '100%',
                padding: '0.75rem',
                border: '1px solid var(--border)',
                borderRadius: '6px',
                fontSize: '1rem',
                backgroundColor: 'white'
              }}
            >
              <option value="beginner">Beginner</option>
              <option value="intermediate">Intermediate</option>
              <option value="advanced">Advanced</option>
            </select>
          </div>

          <div>
            <label htmlFor="audience" style={{ display: 'block', marginBottom: '0.5rem', fontWeight: '600', color: 'var(--navy)' }}>
              Target Audience
            </label>
            <select
              id="audience"
              name="audience"
              value={formData.audience}
              onChange={handleInputChange}
              style={{
                width: '100%',
                padding: '0.75rem',
                border: '1px solid var(--border)',
                borderRadius: '6px',
                fontSize: '1rem',
                backgroundColor: 'white'
              }}
            >
              <option value="individual">Individual</option>
              <option value="couples">Couples</option>
              <option value="group">Small Group</option>
              <option value="family">Family</option>
            </select>
          </div>
        </div>

        {/* Special Requirements */}
        <div>
          <label htmlFor="specialRequirements" style={{ display: 'block', marginBottom: '0.5rem', fontWeight: '600', color: 'var(--navy)' }}>
            Special Requirements (Optional)
          </label>
          <textarea
            id="specialRequirements"
            name="specialRequirements"
            value={formData.specialRequirements}
            onChange={handleInputChange}
            placeholder="Any specific requirements, preferences, or constraints..."
            rows={3}
            style={{
              width: '100%',
              padding: '0.75rem',
              border: '1px solid var(--border)',
              borderRadius: '6px',
              fontSize: '1rem',
              fontFamily: 'inherit',
              resize: 'vertical'
            }}
          />
        </div>

        {/* Error Display */}
        {error && (
          <div style={{
            padding: '1.25rem',
            backgroundColor: '#fef2f2',
            border: '1px solid #fecaca',
            borderRadius: '8px',
            color: '#dc2626',
            fontSize: '0.925rem',
            display: 'flex',
            alignItems: 'center',
            gap: '0.75rem'
          }}>
            <span style={{ fontSize: '1.25rem' }}>⚠️</span>
            <div>
              <strong>Unable to Generate Study</strong>
              <div style={{ marginTop: '0.25rem' }}>{error}</div>
            </div>
          </div>
        )}

        {/* Submit Button */}
        <div style={{ display: 'flex', justifyContent: 'center', marginTop: '1rem' }}>
          <button
            type="submit"
            disabled={isSubmitting}
            className="button button-primary"
            style={{
              padding: '1rem 2rem',
              fontSize: '1.1rem',
              minWidth: '220px',
              opacity: isSubmitting ? 0.8 : 1,
              cursor: isSubmitting ? 'not-allowed' : 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '0.5rem'
            }}
          >
            {isSubmitting && (
              <div style={{
                width: '20px',
                height: '20px',
                border: '2px solid rgba(255, 255, 255, 0.3)',
                borderTop: '2px solid white',
                borderRadius: '50%',
                animation: 'spin 1s linear infinite'
              }}></div>
            )}
            {isSubmitting ? 'Creating Study...' : '✨ Generate Study'}
          </button>
          {isSubmitting && (
            <style jsx>{`
              @keyframes spin {
                0% { transform: rotate(0deg); }
                100% { transform: rotate(360deg); }
              }
            `}</style>
          )}
        </div>

        {/* Info Section */}
        <div style={{
          backgroundColor: 'var(--soft-lavender)',
          padding: '1rem',
          borderRadius: '6px',
          fontSize: '0.875rem',
          color: 'var(--deep-coffee)'
        }}>
          <h4 style={{ margin: '0 0 0.5rem 0', color: 'var(--navy)' }}>How it works:</h4>
          <ul style={{ margin: 0, paddingLeft: '1.2rem' }}>
            <li>AI analyzes your request and creates a detailed study plan</li>
            <li>Content is generated for each day with prayers, teaching, and discussion questions</li>
            <li>All Bible verses are validated for accuracy</li>
            <li>Content is reviewed for theological soundness</li>
            <li>You'll receive a complete, ready-to-use Bible study</li>
          </ul>
          <p style={{ margin: '0.5rem 0 0 0', fontStyle: 'italic' }}>
            Generation typically takes 5-30 minutes depending on study length.
          </p>
        </div>
      </form>
    </div>
  );
}