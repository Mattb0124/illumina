/* eslint-disable camelcase */

exports.shorthands = undefined;

exports.up = pgm => {
  // Enable UUID extension
  pgm.createExtension('uuid-ossp', { ifNotExists: true });

  // Users table
  pgm.createTable('users', {
    id: {
      type: 'uuid',
      primaryKey: true,
      default: pgm.func('uuid_generate_v4()')
    },
    email: {
      type: 'varchar(255)',
      notNull: true,
      unique: true
    },
    name: {
      type: 'varchar(255)',
      notNull: true
    },
    password_hash: {
      type: 'varchar(255)',
      notNull: true
    },
    created_at: {
      type: 'timestamp',
      notNull: true,
      default: pgm.func('current_timestamp')
    },
    updated_at: {
      type: 'timestamp',
      notNull: true,
      default: pgm.func('current_timestamp')
    }
  });

  // Studies table - metadata only, content stored in files
  pgm.createTable('studies', {
    id: {
      type: 'varchar(255)',
      primaryKey: true // e.g. "marriage-foundations-8w"
    },
    title: {
      type: 'varchar(255)',
      notNull: true
    },
    theme: {
      type: 'varchar(255)',
      notNull: true
    },
    description: {
      type: 'text',
      notNull: true
    },
    duration_days: {
      type: 'integer',
      notNull: true
    },
    study_style: {
      type: 'varchar(50)',
      notNull: true // 'devotional' | 'topical' | 'book-study' | 'couples' | 'marriage'
    },
    difficulty: {
      type: 'varchar(50)',
      notNull: true // 'beginner' | 'intermediate' | 'advanced'
    },
    audience: {
      type: 'varchar(50)',
      notNull: true // 'individual' | 'couples' | 'group' | 'family'
    },
    study_structure: {
      type: 'varchar(50)',
      notNull: true // 'daily' | 'weekly'
    },
    estimated_time_per_session: {
      type: 'varchar(50)',
      notNull: true
    },
    pastor_message: {
      type: 'text',
      notNull: true
    },
    generated_by: {
      type: 'varchar(50)',
      notNull: true, // 'AI' | 'Manual' | 'Hybrid'
      default: "'Manual'"
    },
    generation_prompt: {
      type: 'text'
    },
    popularity: {
      type: 'decimal(3,1)',
      notNull: true,
      default: 0
    },
    tags: {
      type: 'text[]'
    },
    status: {
      type: 'varchar(50)',
      notNull: true,
      default: "'Published'" // 'Published' | 'Draft' | 'In Review'
    },
    created_at: {
      type: 'timestamp',
      notNull: true,
      default: pgm.func('current_timestamp')
    },
    updated_at: {
      type: 'timestamp',
      notNull: true,
      default: pgm.func('current_timestamp')
    }
  });

  // User study enrollments
  pgm.createTable('user_studies', {
    id: {
      type: 'uuid',
      primaryKey: true,
      default: pgm.func('uuid_generate_v4()')
    },
    user_id: {
      type: 'uuid',
      notNull: true,
      references: '"users"',
      onDelete: 'cascade'
    },
    study_id: {
      type: 'varchar(255)',
      notNull: true,
      references: '"studies"',
      onDelete: 'cascade'
    },
    started_at: {
      type: 'timestamp',
      notNull: true,
      default: pgm.func('current_timestamp')
    },
    current_day: {
      type: 'integer',
      notNull: true,
      default: 1
    },
    current_week: {
      type: 'integer' // nullable for daily-only studies
    },
    completed_at: {
      type: 'timestamp'
    },
    status: {
      type: 'varchar(50)',
      notNull: true,
      default: "'active'" // 'active' | 'completed' | 'paused'
    }
  });

  // Daily progress tracking
  pgm.createTable('study_progress', {
    id: {
      type: 'uuid',
      primaryKey: true,
      default: pgm.func('uuid_generate_v4()')
    },
    user_study_id: {
      type: 'uuid',
      notNull: true,
      references: '"user_studies"',
      onDelete: 'cascade'
    },
    day_number: {
      type: 'integer',
      notNull: true
    },
    week_number: {
      type: 'integer' // nullable for daily-only studies
    },
    completed_at: {
      type: 'timestamp'
    },
    notes: {
      type: 'text'
    },
    reflection_answers: {
      type: 'jsonb' // Store Q&A pairs
    },
    created_at: {
      type: 'timestamp',
      notNull: true,
      default: pgm.func('current_timestamp')
    }
  });

  // Create indexes
  pgm.createIndex('users', 'email');
  pgm.createIndex('studies', 'study_style');
  pgm.createIndex('studies', 'difficulty');
  pgm.createIndex('studies', 'audience');
  pgm.createIndex('studies', 'status');
  pgm.createIndex('user_studies', 'user_id');
  pgm.createIndex('user_studies', 'study_id');
  pgm.createIndex('user_studies', 'status');
  pgm.createIndex('study_progress', 'user_study_id');
  pgm.createIndex('study_progress', 'day_number');

  // Add unique constraints
  pgm.addConstraint('user_studies', 'unique_user_study', 'UNIQUE(user_id, study_id)');
  pgm.addConstraint('study_progress', 'unique_user_study_day', 'UNIQUE(user_study_id, day_number)');

  // Add check constraints
  pgm.addConstraint('studies', 'valid_study_style', 'CHECK (study_style IN (\'devotional\', \'topical\', \'book-study\', \'couples\', \'marriage\'))');
  pgm.addConstraint('studies', 'valid_difficulty', 'CHECK (difficulty IN (\'beginner\', \'intermediate\', \'advanced\'))');
  pgm.addConstraint('studies', 'valid_audience', 'CHECK (audience IN (\'individual\', \'couples\', \'group\', \'family\'))');
  pgm.addConstraint('studies', 'valid_structure', 'CHECK (study_structure IN (\'daily\', \'weekly\'))');
  pgm.addConstraint('studies', 'valid_generated_by', 'CHECK (generated_by IN (\'AI\', \'Manual\', \'Hybrid\'))');
  pgm.addConstraint('studies', 'valid_status', 'CHECK (status IN (\'Published\', \'Draft\', \'In Review\'))');
  pgm.addConstraint('user_studies', 'valid_user_study_status', 'CHECK (status IN (\'active\', \'completed\', \'paused\'))');
};

exports.down = pgm => {
  pgm.dropTable('study_progress');
  pgm.dropTable('user_studies');
  pgm.dropTable('studies');
  pgm.dropTable('users');
  pgm.dropExtension('uuid-ossp');
};