/* eslint-disable camelcase */

exports.shorthands = undefined;

exports.up = pgm => {
  // Expand VARCHAR(255) fields that are too small for enhanced book-study content

  // In generated_study_content table
  pgm.alterColumn('generated_study_content', 'title', {
    type: 'text',
    notNull: true
  });

  pgm.alterColumn('generated_study_content', 'theme', {
    type: 'text'
  });

  // In study_generation_requests table (for longer study titles)
  pgm.alterColumn('study_generation_requests', 'title', {
    type: 'text',
    notNull: true
  });

  pgm.alterColumn('study_generation_requests', 'topic', {
    type: 'text',
    notNull: true
  });
};

exports.down = pgm => {
  // Revert back to VARCHAR(255) - note: this may fail if data exceeds 255 chars
  pgm.alterColumn('generated_study_content', 'title', {
    type: 'varchar(255)',
    notNull: true
  });

  pgm.alterColumn('generated_study_content', 'theme', {
    type: 'varchar(255)'
  });

  pgm.alterColumn('study_generation_requests', 'title', {
    type: 'varchar(255)',
    notNull: true
  });

  pgm.alterColumn('study_generation_requests', 'topic', {
    type: 'varchar(255)',
    notNull: true
  });
};