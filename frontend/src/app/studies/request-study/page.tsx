'use client';

import Link from 'next/link';
import StudyRequestForm, { StudyRequest } from '@/components/StudyRequestForm';

export default function RequestStudyPage() {
  const handleStudyRequest = (request: StudyRequest) => {
    console.log('Study request:', request);
    // TODO: Implement actual study generation/creation
    alert(`Study request submitted: "${request.topic}" (${request.duration} days). This will be implemented with AI generation.`);
  };

  return (
    <main className="container">
      {/* Header with Navigation */}
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

        <h1 style={{ marginBottom: '0.5rem', fontSize: '1.75rem' }}>Request Custom Study</h1>
        <p style={{
          color: 'var(--text-secondary)',
          fontSize: '1rem',
          margin: '0',
          lineHeight: '1.5'
        }}>
          Create a personalized Bible study tailored to your specific topic and needs.
        </p>
      </div>

      {/* Study Request Form */}
      <div style={{ maxWidth: '600px' }}>
        <StudyRequestForm onSubmit={handleStudyRequest} />
      </div>
    </main>
  );
}