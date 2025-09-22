'use client';

import { useState } from 'react';

interface StudyRequestFormProps {
  onSubmit: (request: StudyRequest) => void;
  className?: string;
}

export interface StudyRequest {
  topic: string;
  duration: number;
  studyType: 'devotional' | 'topical' | 'book-study';
  audience: 'individual' | 'couples' | 'group';
  specificFocus?: string;
}

export default function StudyRequestForm({ onSubmit, className = '' }: StudyRequestFormProps) {
  const [formData, setFormData] = useState<StudyRequest>({
    topic: '',
    duration: 7,
    studyType: 'devotional',
    audience: 'individual',
    specificFocus: ''
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (formData.topic.trim()) {
      onSubmit(formData);
    }
  };

  const handleInputChange = (field: keyof StudyRequest, value: string | number) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  return (
    <div className={`card ${className}`} style={{ padding: '2rem' }}>
      <h2 style={{
        marginBottom: '1.5rem',
        fontSize: '1.5rem',
        color: 'var(--navy)',
        textAlign: 'center'
      }}>
        Request a Personal Bible Study
      </h2>

      <form onSubmit={handleSubmit}>
        <div style={{ marginBottom: '1.5rem' }}>
          <label style={{
            display: 'block',
            marginBottom: '0.5rem',
            fontWeight: '600',
            color: 'var(--text-primary)'
          }}>
            What would you like to study?
          </label>
          <input
            type="text"
            value={formData.topic}
            onChange={(e) => handleInputChange('topic', e.target.value)}
            placeholder="e.g., 'Forgiveness', 'Anxiety and Peace', 'Philippians Chapter 4'"
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

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', marginBottom: '1.5rem' }}>
          <div>
            <label style={{
              display: 'block',
              marginBottom: '0.5rem',
              fontWeight: '600',
              color: 'var(--text-primary)'
            }}>
              Duration
            </label>
            <select
              value={formData.duration}
              onChange={(e) => handleInputChange('duration', parseInt(e.target.value))}
              style={{
                width: '100%',
                padding: '0.75rem',
                border: '1px solid var(--border)',
                borderRadius: '6px',
                fontSize: '1rem'
              }}
            >
              <option value={3}>3 days</option>
              <option value={5}>5 days</option>
              <option value={7}>7 days</option>
              <option value={14}>2 weeks</option>
              <option value={21}>3 weeks</option>
              <option value={30}>30 days</option>
            </select>
          </div>

          <div>
            <label style={{
              display: 'block',
              marginBottom: '0.5rem',
              fontWeight: '600',
              color: 'var(--text-primary)'
            }}>
              Study Style
            </label>
            <select
              value={formData.studyType}
              onChange={(e) => handleInputChange('studyType', e.target.value)}
              style={{
                width: '100%',
                padding: '0.75rem',
                border: '1px solid var(--border)',
                borderRadius: '6px',
                fontSize: '1rem'
              }}
            >
              <option value="devotional">Devotional</option>
              <option value="topical">Topical Study</option>
              <option value="book-study">Book Study</option>
            </select>
          </div>
        </div>

        <div style={{ marginBottom: '1.5rem' }}>
          <label style={{
            display: 'block',
            marginBottom: '0.5rem',
            fontWeight: '600',
            color: 'var(--text-primary)'
          }}>
            Audience
          </label>
          <select
            value={formData.audience}
            onChange={(e) => handleInputChange('audience', e.target.value)}
            style={{
              width: '100%',
              padding: '0.75rem',
              border: '1px solid var(--border)',
              borderRadius: '6px',
              fontSize: '1rem'
            }}
          >
            <option value="individual">Individual</option>
            <option value="couples">Couples</option>
            <option value="group">Group</option>
          </select>
        </div>

        <div style={{ marginBottom: '2rem' }}>
          <label style={{
            display: 'block',
            marginBottom: '0.5rem',
            fontWeight: '600',
            color: 'var(--text-primary)'
          }}>
            Specific Focus (Optional)
          </label>
          <textarea
            value={formData.specificFocus}
            onChange={(e) => handleInputChange('specificFocus', e.target.value)}
            placeholder="Any specific aspects you'd like to focus on or questions you want answered?"
            style={{
              width: '100%',
              minHeight: '80px',
              padding: '0.75rem',
              border: '1px solid var(--border)',
              borderRadius: '6px',
              fontSize: '1rem',
              resize: 'vertical'
            }}
          />
        </div>

        <button
          type="submit"
          className="button button-accent"
          style={{
            width: '100%',
            padding: '1rem',
            fontSize: '1.1rem',
            fontWeight: '600'
          }}
        >
          Create My Study
        </button>
      </form>

      <div style={{
        marginTop: '1.5rem',
        padding: '1rem',
        backgroundColor: 'var(--soft-blue)',
        borderRadius: '6px',
        fontSize: '0.875rem',
        color: 'var(--deep-coffee)',
        textAlign: 'center'
      }}>
        Your personalized study will be created and added to your study library
      </div>
    </div>
  );
}