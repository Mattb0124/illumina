'use client';

import { useState, useMemo } from 'react';
import Link from 'next/link';
import { Study } from '@/services/studiesService';

interface StudiesTableProps {
  studies: Study[];
  onStudySelect?: (study: Study) => void;
}

export default function StudiesTable({ studies, onStudySelect }: StudiesTableProps) {
  const [searchTerm, setSearchTerm] = useState('');
  const [audienceFilter, setAudienceFilter] = useState<string>('all');
  const [sortBy, setSortBy] = useState<'title' | 'created_at' | 'duration_days'>('title');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');

  const filteredAndSortedStudies = useMemo(() => {
    let filtered = studies.filter(study => {
      const matchesSearch = study.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                           study.theme.toLowerCase().includes(searchTerm.toLowerCase()) ||
                           study.tags.some(tag => tag.toLowerCase().includes(searchTerm.toLowerCase()));

      const matchesAudience = audienceFilter === 'all' || study.audience === audienceFilter;

      return matchesSearch && matchesAudience;
    });

    // Sort
    filtered.sort((a, b) => {
      let comparison = 0;

      switch (sortBy) {
        case 'title':
          comparison = a.title.localeCompare(b.title);
          break;
        case 'created_at':
          comparison = new Date(a.created_at).getTime() - new Date(b.created_at).getTime();
          break;
        case 'duration_days':
          comparison = a.duration_days - b.duration_days;
          break;
      }

      return sortOrder === 'asc' ? comparison : -comparison;
    });

    return filtered;
  }, [studies, searchTerm, audienceFilter, sortBy, sortOrder]);

  const getStatusBadge = (study: Study) => {
    // For now, all studies from database are available
    // Later we can add user enrollment status
    return <span className="status-badge available">Available</span>;
  };


  return (
    <div>
      {/* Filters and Search */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: '2fr 1fr 1fr',
        gap: '1rem',
        marginBottom: '1.5rem',
        padding: '1rem',
        backgroundColor: 'var(--soft-blue)',
        borderRadius: '8px'
      }}>
        <input
          type="text"
          placeholder="Search studies, themes, or tags..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          style={{
            padding: '0.5rem',
            border: '1px solid var(--border)',
            borderRadius: '4px',
            fontSize: '0.9rem'
          }}
        />

        <select
          value={audienceFilter}
          onChange={(e) => setAudienceFilter(e.target.value)}
          style={{
            padding: '0.5rem',
            border: '1px solid var(--border)',
            borderRadius: '4px',
            fontSize: '0.9rem'
          }}
        >
          <option value="all">All Audiences</option>
          <option value="individual">Individual</option>
          <option value="couples">Couples</option>
          <option value="group">Group</option>
          <option value="family">Family</option>
        </select>



        <select
          value={`${sortBy}-${sortOrder}`}
          onChange={(e) => {
            const [field, order] = e.target.value.split('-');
            setSortBy(field as any);
            setSortOrder(order as 'asc' | 'desc');
          }}
          style={{
            padding: '0.5rem',
            border: '1px solid var(--border)',
            borderRadius: '4px',
            fontSize: '0.9rem'
          }}
        >
          <option value="title-asc">Title A-Z</option>
          <option value="title-desc">Title Z-A</option>
          <option value="created_at-desc">Newest First</option>
          <option value="created_at-asc">Oldest First</option>
          <option value="duration_days-asc">Duration ↑</option>
          <option value="duration_days-desc">Duration ↓</option>
        </select>
      </div>

      {/* Table */}
      <div style={{
        backgroundColor: 'white',
        borderRadius: '8px',
        border: '1px solid var(--border)',
        overflow: 'hidden',
        boxShadow: '0 1px 3px rgba(0,0,0,0.1)'
      }}>
        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
          <thead>
            <tr style={{ backgroundColor: 'var(--parchment)' }}>
              <th style={{ padding: '1rem', textAlign: 'left', fontSize: '0.875rem', fontWeight: '600', color: 'var(--navy)' }}>
                Study Details
              </th>
              <th style={{ padding: '1rem', textAlign: 'left', fontSize: '0.875rem', fontWeight: '600', color: 'var(--navy)' }}>
                Type & Audience
              </th>
              <th style={{ padding: '1rem', textAlign: 'left', fontSize: '0.875rem', fontWeight: '600', color: 'var(--navy)' }}>
                Metadata
              </th>
              <th style={{ padding: '1rem', textAlign: 'left', fontSize: '0.875rem', fontWeight: '600', color: 'var(--navy)' }}>
                Status
              </th>
              <th style={{ padding: '1rem', textAlign: 'center', fontSize: '0.875rem', fontWeight: '600', color: 'var(--navy)' }}>
                Action
              </th>
            </tr>
          </thead>
          <tbody>
            {filteredAndSortedStudies.map((study) => (
              <tr
                key={study.id}
                style={{
                  borderBottom: '1px solid var(--border)',
                  cursor: onStudySelect ? 'pointer' : 'default'
                }}
                onClick={() => onStudySelect?.(study)}
              >
                <td style={{ padding: '1rem' }}>
                  <div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.25rem' }}>
                      <h4 style={{ margin: 0, fontSize: '1rem', color: 'var(--navy)' }}>{study.title}</h4>
                    </div>
                    <p style={{ margin: 0, fontSize: '0.875rem', color: 'var(--text-secondary)', marginBottom: '0.5rem' }}>
                      {study.description}
                    </p>
                    <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
                      {study.tags.slice(0, 3).map(tag => (
                        <span
                          key={tag}
                          style={{
                            fontSize: '0.7rem',
                            padding: '0.2rem 0.4rem',
                            backgroundColor: 'var(--deep-cream)',
                            color: 'var(--deep-coffee)',
                            borderRadius: '3px'
                          }}
                        >
                          {tag}
                        </span>
                      ))}
                    </div>
                  </div>
                </td>
                <td style={{ padding: '1rem', fontSize: '0.875rem' }}>
                  <div>
                    <div style={{ marginBottom: '0.25rem' }}>
                      <strong>Duration:</strong> {study.duration_days} days
                    </div>
                    <div style={{ marginBottom: '0.25rem' }}>
                      <strong>Audience:</strong> {study.audience}
                    </div>
                    <div>
                      <strong>Style:</strong> {study.study_style}
                    </div>
                  </div>
                </td>
                <td style={{ padding: '1rem', fontSize: '0.875rem' }}>
                  <div>
                    <div style={{ marginBottom: '0.25rem' }}>
                      <strong>ID:</strong> {study.id}
                    </div>
                    <div style={{ marginBottom: '0.25rem' }}>
                      <strong>Created:</strong> {new Date(study.created_at).toLocaleDateString()}
                    </div>
                    <div style={{ marginBottom: '0.25rem' }}>
                      <strong>Modified:</strong> {new Date(study.updated_at).toLocaleDateString()}
                    </div>
                    <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>
                      Status: {study.status}
                    </div>
                  </div>
                </td>
                <td style={{ padding: '1rem' }}>
                  <div style={{ marginBottom: '0.5rem' }}>
                    {getStatusBadge(study)}
                  </div>
                </td>
                <td style={{ padding: '1rem', textAlign: 'center' }}>
                  <Link
                    href={`/studies/${study.id}`}
                    className="button button-primary"
                    style={{ fontSize: '0.8rem', padding: '0.5rem 1rem' }}
                  >
                    Start
                  </Link>
                </td>
              </tr>
            ))}
          </tbody>
        </table>

        {filteredAndSortedStudies.length === 0 && (
          <div style={{
            padding: '3rem',
            textAlign: 'center',
            color: 'var(--text-secondary)',
            fontSize: '1rem'
          }}>
            No studies found matching your criteria.
          </div>
        )}
      </div>

      {/* Results Summary */}
      <div style={{
        marginTop: '1rem',
        padding: '0.75rem',
        backgroundColor: 'var(--soft-lavender)',
        borderRadius: '6px',
        fontSize: '0.875rem',
        color: 'var(--deep-coffee)',
        textAlign: 'center'
      }}>
        Showing {filteredAndSortedStudies.length} of {studies.length} studies
      </div>

      <style jsx>{`
        .status-badge {
          font-size: 0.7rem;
          padding: 0.3rem 0.6rem;
          border-radius: 4px;
          font-weight: 600;
          text-transform: uppercase;
          letter-spacing: 0.5px;
        }

        .status-badge.available {
          background-color: var(--golden-bronze);
          color: white;
        }

        .status-badge.active {
          background-color: var(--rich-mahogany);
          color: white;
        }

        .status-badge.completed {
          background-color: var(--warm-gray);
          color: white;
        }

        table tbody tr:hover {
          background-color: var(--soft-blue);
        }
      `}</style>
    </div>
  );
}