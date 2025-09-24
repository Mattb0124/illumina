'use client';

import { useState } from 'react';
import { aiService, StudyGenerationRequest } from '@/services/aiService';

interface StudyGenerationFormProps {
  onGenerationStarted: (requestId: string) => void;
}

export default function StudyGenerationForm({ onGenerationStarted }: StudyGenerationFormProps) {
  const [formData, setFormData] = useState<StudyGenerationRequest>({
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

    setIsSubmitting(true);
    setError(null);

    try {
      // Validate required fields
      if (!formData.userRequest.trim() || !formData.title.trim() || !formData.topic.trim() || !formData.duration.trim()) {
        throw new Error('Please fill in all required fields');
      }

      const result = await aiService.generateStudy(formData);

      if (!result || !result.requestId) {
        throw new Error('Invalid response from server');
      }

      onGenerationStarted(result.requestId);

    } catch (error) {
      console.error('Error in study generation:', error);
      setError(error instanceof Error ? error.message : 'Failed to start study generation');
    } finally {
      setIsSubmitting(false);
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
              <option value="couples">Couples</option>
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
            padding: '1rem',
            backgroundColor: '#FEF2F2',
            border: '1px solid #FECACA',
            borderRadius: '6px',
            color: '#DC2626'
          }}>
            {error}
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
              minWidth: '200px',
              opacity: isSubmitting ? 0.7 : 1,
              cursor: isSubmitting ? 'not-allowed' : 'pointer'
            }}
          >
            {isSubmitting ? 'Generating Study...' : 'Generate Study'}
          </button>
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