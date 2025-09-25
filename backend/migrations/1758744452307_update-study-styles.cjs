/* eslint-disable camelcase */

exports.shorthands = undefined;

exports.up = pgm => {
  // Update the study_style constraint to remove 'couples' and align with backend schema
  pgm.dropConstraint('study_generation_requests', 'study_generation_requests_study_style_check');
  pgm.addConstraint('study_generation_requests', 'study_generation_requests_study_style_check', {
    check: "study_style IN ('devotional', 'topical', 'book-study', 'marriage')"
  });

  // Update any existing 'couples' entries to 'marriage'
  pgm.sql(`
    UPDATE study_generation_requests
    SET study_style = 'marriage'
    WHERE study_style = 'couples'
  `);

  // Also update the studies table if it exists
  pgm.sql(`
    DO $$
    BEGIN
      IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'studies') THEN
        -- Drop old constraint if it exists
        IF EXISTS (
          SELECT 1 FROM information_schema.table_constraints
          WHERE constraint_name = 'studies_study_style_check'
          AND table_name = 'studies'
        ) THEN
          ALTER TABLE studies DROP CONSTRAINT studies_study_style_check;
        END IF;

        -- Add new constraint
        ALTER TABLE studies ADD CONSTRAINT studies_study_style_check
        CHECK (study_style IN ('devotional', 'topical', 'book-study', 'marriage'));

        -- Update existing data
        UPDATE studies SET study_style = 'marriage' WHERE study_style = 'couples';
      END IF;
    END
    $$;
  `);
};

exports.down = pgm => {
  // Revert the constraint to the original
  pgm.dropConstraint('study_generation_requests', 'study_generation_requests_study_style_check');
  pgm.addConstraint('study_generation_requests', 'study_generation_requests_study_style_check', {
    check: "study_style IN ('devotional', 'topical', 'book-study', 'couples', 'marriage')"
  });

  // Note: We don't revert the data changes since 'marriage' is still valid in the old schema
};