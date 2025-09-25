/* eslint-disable camelcase */

exports.shorthands = undefined;

exports.up = pgm => {
  // Add unique constraint to workflow_state table for ON CONFLICT operations
  pgm.addConstraint('workflow_state', 'workflow_state_request_step_unique', {
    unique: ['request_id', 'current_step']
  });
};

exports.down = pgm => {
  // Remove the unique constraint
  pgm.dropConstraint('workflow_state', 'workflow_state_request_step_unique');
};