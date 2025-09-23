/**
 * @type {import('node-pg-migrate').ColumnDefinitions | undefined}
 */
export const shorthands = undefined;

/**
 * @param pgm {import('node-pg-migrate').MigrationBuilder}
 * @param run {() => void | undefined}
 * @returns {Promise<void> | void}
 */
export const up = (pgm) => {
  // Study generation requests table
  pgm.createTable('study_generation_requests', {
    id: {
      type: 'uuid',
      primaryKey: true,
      default: pgm.func('gen_random_uuid()')
    },
    user_id: {
      type: 'uuid',
      notNull: true,
      references: 'users(id)',
      onDelete: 'CASCADE'
    },
    title: {
      type: 'varchar(255)',
      notNull: true
    },
    topic: {
      type: 'varchar(255)',
      notNull: true
    },
    duration: {
      type: 'varchar(50)',
      notNull: true
    },
    duration_days: {
      type: 'integer',
      notNull: true
    },
    study_style: {
      type: 'varchar(50)',
      notNull: true,
      check: "study_style IN ('devotional', 'topical', 'book-study', 'couples', 'marriage')"
    },
    difficulty: {
      type: 'varchar(20)',
      notNull: true,
      check: "difficulty IN ('beginner', 'intermediate', 'advanced')"
    },
    audience: {
      type: 'varchar(50)',
      notNull: true,
      check: "audience IN ('individual', 'couples', 'group', 'family')"
    },
    special_requirements: {
      type: 'text'
    },
    request_details: {
      type: 'jsonb',
      notNull: true
    },
    status: {
      type: 'varchar(50)',
      notNull: true,
      default: "'pending'",
      check: "status IN ('pending', 'processing', 'content_generation', 'validation', 'completed', 'failed', 'cancelled')"
    },
    progress_percentage: {
      type: 'integer',
      default: 0,
      check: 'progress_percentage >= 0 AND progress_percentage <= 100'
    },
    error_message: {
      type: 'text'
    },
    completion_date: {
      type: 'timestamp'
    },
    created_at: {
      type: 'timestamp',
      default: pgm.func('NOW()'),
      notNull: true
    },
    updated_at: {
      type: 'timestamp',
      default: pgm.func('NOW()'),
      notNull: true
    }
  });

  // Generated study content table
  pgm.createTable('generated_study_content', {
    id: {
      type: 'uuid',
      primaryKey: true,
      default: pgm.func('gen_random_uuid()')
    },
    request_id: {
      type: 'uuid',
      notNull: true,
      references: 'study_generation_requests(id)',
      onDelete: 'CASCADE'
    },
    day_number: {
      type: 'integer',
      notNull: true
    },
    week_number: {
      type: 'integer'
    },
    title: {
      type: 'varchar(255)',
      notNull: true
    },
    theme: {
      type: 'varchar(255)'
    },
    opening_prayer: {
      type: 'text'
    },
    study_focus: {
      type: 'text'
    },
    teaching_content: {
      type: 'text'
    },
    bible_passages: {
      type: 'jsonb',
      default: '[]'
    },
    discussion_questions: {
      type: 'jsonb',
      default: '[]'
    },
    reflection_question: {
      type: 'text'
    },
    application_points: {
      type: 'jsonb',
      default: '[]'
    },
    prayer_focus: {
      type: 'text'
    },
    estimated_time: {
      type: 'varchar(50)'
    },
    content_data: {
      type: 'jsonb',
      notNull: true
    },
    generation_status: {
      type: 'varchar(50)',
      notNull: true,
      default: "'pending'",
      check: "generation_status IN ('pending', 'generating', 'validating', 'completed', 'failed')"
    },
    validation_status: {
      type: 'varchar(50)',
      default: "'pending'",
      check: "validation_status IN ('pending', 'validating', 'approved', 'rejected', 'needs_review')"
    },
    validation_notes: {
      type: 'text'
    },
    created_at: {
      type: 'timestamp',
      default: pgm.func('NOW()'),
      notNull: true
    },
    updated_at: {
      type: 'timestamp',
      default: pgm.func('NOW()'),
      notNull: true
    }
  });

  // Workflow state tracking table
  pgm.createTable('workflow_state', {
    id: {
      type: 'uuid',
      primaryKey: true,
      default: pgm.func('gen_random_uuid()')
    },
    request_id: {
      type: 'uuid',
      notNull: true,
      references: 'study_generation_requests(id)',
      onDelete: 'CASCADE'
    },
    current_step: {
      type: 'varchar(100)',
      notNull: true
    },
    step_status: {
      type: 'varchar(50)',
      notNull: true,
      check: "step_status IN ('pending', 'in_progress', 'completed', 'failed', 'skipped')"
    },
    step_data: {
      type: 'jsonb',
      default: '{}'
    },
    error_details: {
      type: 'jsonb'
    },
    retry_count: {
      type: 'integer',
      default: 0
    },
    started_at: {
      type: 'timestamp'
    },
    completed_at: {
      type: 'timestamp'
    },
    created_at: {
      type: 'timestamp',
      default: pgm.func('NOW()'),
      notNull: true
    },
    updated_at: {
      type: 'timestamp',
      default: pgm.func('NOW()'),
      notNull: true
    }
  });

  // Bible verse validation cache table
  pgm.createTable('bible_verse_validations', {
    id: {
      type: 'uuid',
      primaryKey: true,
      default: pgm.func('gen_random_uuid()')
    },
    reference: {
      type: 'varchar(255)',
      notNull: true,
      unique: true
    },
    normalized_reference: {
      type: 'varchar(255)',
      notNull: true
    },
    validation_status: {
      type: 'varchar(50)',
      notNull: true,
      check: "validation_status IN ('valid', 'invalid', 'not_found', 'api_error')"
    },
    api_response: {
      type: 'jsonb'
    },
    verse_text: {
      type: 'text'
    },
    translation: {
      type: 'varchar(50)',
      default: "'KJV'"
    },
    error_message: {
      type: 'text'
    },
    last_validated_at: {
      type: 'timestamp',
      default: pgm.func('NOW()'),
      notNull: true
    },
    cache_expires_at: {
      type: 'timestamp'
    },
    created_at: {
      type: 'timestamp',
      default: pgm.func('NOW()'),
      notNull: true
    }
  });

  // Create indexes for better performance
  pgm.createIndex('study_generation_requests', 'user_id');
  pgm.createIndex('study_generation_requests', 'status');
  pgm.createIndex('study_generation_requests', 'created_at');

  pgm.createIndex('generated_study_content', 'request_id');
  pgm.createIndex('generated_study_content', ['request_id', 'day_number']);
  pgm.createIndex('generated_study_content', 'generation_status');
  pgm.createIndex('generated_study_content', 'validation_status');

  pgm.createIndex('workflow_state', 'request_id');
  pgm.createIndex('workflow_state', ['request_id', 'current_step']);
  pgm.createIndex('workflow_state', 'step_status');

  pgm.createIndex('bible_verse_validations', 'normalized_reference');
  pgm.createIndex('bible_verse_validations', 'validation_status');
  pgm.createIndex('bible_verse_validations', 'last_validated_at');
  pgm.createIndex('bible_verse_validations', 'cache_expires_at');
};

/**
 * @param pgm {import('node-pg-migrate').MigrationBuilder}
 * @param run {() => void | undefined}
 * @returns {Promise<void> | void}
 */
export const down = (pgm) => {
  // Drop tables in reverse order due to foreign key dependencies
  pgm.dropTable('bible_verse_validations');
  pgm.dropTable('workflow_state');
  pgm.dropTable('generated_study_content');
  pgm.dropTable('study_generation_requests');
};
