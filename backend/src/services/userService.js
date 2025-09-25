import bcrypt from 'bcryptjs';
import { query, getClient } from '../config/database.ts';
import { generateToken } from '../middleware/auth.ts';

class UserService {
  /**
   * Register a new user
   */
  async register(email, name, password) {
    const client = await getClient();

    try {
      await client.query('BEGIN');

      // Check if user already exists
      const existingUser = await client.query(
        'SELECT id FROM users WHERE email = $1',
        [email.toLowerCase()]
      );

      if (existingUser.rows.length > 0) {
        throw new Error('User already exists with this email');
      }

      // Hash password
      const saltRounds = 12;
      const passwordHash = await bcrypt.hash(password, saltRounds);

      // Create user
      const result = await client.query(
        `INSERT INTO users (email, name, password_hash)
         VALUES ($1, $2, $3)
         RETURNING id, email, name, created_at`,
        [email.toLowerCase(), name, passwordHash]
      );

      await client.query('COMMIT');

      const user = result.rows[0];
      const token = generateToken(user.id);

      return {
        user,
        token
      };
    } catch (error) {
      await client.query('ROLLBACK');
      throw error;
    } finally {
      client.release();
    }
  }

  /**
   * Login user
   */
  async login(email, password) {
    try {
      // Get user with password hash
      const result = await query(
        'SELECT id, email, name, password_hash, created_at FROM users WHERE email = $1',
        [email.toLowerCase()]
      );

      if (result.rows.length === 0) {
        throw new Error('Invalid email or password');
      }

      const user = result.rows[0];

      // Verify password
      const isValidPassword = await bcrypt.compare(password, user.password_hash);

      if (!isValidPassword) {
        throw new Error('Invalid email or password');
      }

      // Generate token
      const token = generateToken(user.id);

      // Return user without password hash
      const { password_hash, ...userWithoutPassword } = user;

      return {
        user: userWithoutPassword,
        token
      };
    } catch (error) {
      throw error;
    }
  }

  /**
   * Get user by ID
   */
  async getUserById(userId) {
    try {
      const result = await query(
        'SELECT id, email, name, created_at FROM users WHERE id = $1',
        [userId]
      );

      if (result.rows.length === 0) {
        throw new Error('User not found');
      }

      return result.rows[0];
    } catch (error) {
      throw error;
    }
  }

  /**
   * Update user profile
   */
  async updateProfile(userId, updates) {
    const client = await getClient();

    try {
      await client.query('BEGIN');

      const allowedFields = ['name', 'email'];
      const updateFields = [];
      const values = [];
      let valueIndex = 1;

      // Build dynamic update query
      for (const field of allowedFields) {
        if (updates[field] !== undefined) {
          updateFields.push(`${field} = $${valueIndex}`);
          values.push(field === 'email' ? updates[field].toLowerCase() : updates[field]);
          valueIndex++;
        }
      }

      if (updateFields.length === 0) {
        throw new Error('No valid fields to update');
      }

      // Check email uniqueness if updating email
      if (updates.email) {
        const emailCheck = await client.query(
          'SELECT id FROM users WHERE email = $1 AND id != $2',
          [updates.email.toLowerCase(), userId]
        );

        if (emailCheck.rows.length > 0) {
          throw new Error('Email already exists');
        }
      }

      // Add updated_at and user ID
      updateFields.push(`updated_at = $${valueIndex}`);
      values.push(new Date());
      valueIndex++;

      values.push(userId);

      const result = await client.query(
        `UPDATE users SET ${updateFields.join(', ')}
         WHERE id = $${valueIndex}
         RETURNING id, email, name, created_at`,
        values
      );

      if (result.rows.length === 0) {
        throw new Error('User not found');
      }

      await client.query('COMMIT');
      return result.rows[0];
    } catch (error) {
      await client.query('ROLLBACK');
      throw error;
    } finally {
      client.release();
    }
  }

  /**
   * Change user password
   */
  async changePassword(userId, currentPassword, newPassword) {
    const client = await getClient();

    try {
      await client.query('BEGIN');

      // Get current password hash
      const result = await client.query(
        'SELECT password_hash FROM users WHERE id = $1',
        [userId]
      );

      if (result.rows.length === 0) {
        throw new Error('User not found');
      }

      // Verify current password
      const isValidPassword = await bcrypt.compare(currentPassword, result.rows[0].password_hash);

      if (!isValidPassword) {
        throw new Error('Current password is incorrect');
      }

      // Hash new password
      const saltRounds = 12;
      const newPasswordHash = await bcrypt.hash(newPassword, saltRounds);

      // Update password
      await client.query(
        'UPDATE users SET password_hash = $1, updated_at = $2 WHERE id = $3',
        [newPasswordHash, new Date(), userId]
      );

      await client.query('COMMIT');

      return { success: true };
    } catch (error) {
      await client.query('ROLLBACK');
      throw error;
    } finally {
      client.release();
    }
  }

  /**
   * Delete user account
   */
  async deleteAccount(userId, password) {
    const client = await getClient();

    try {
      await client.query('BEGIN');

      // Get user and verify password
      const result = await client.query(
        'SELECT password_hash FROM users WHERE id = $1',
        [userId]
      );

      if (result.rows.length === 0) {
        throw new Error('User not found');
      }

      // Verify password
      const isValidPassword = await bcrypt.compare(password, result.rows[0].password_hash);

      if (!isValidPassword) {
        throw new Error('Password is incorrect');
      }

      // Delete user (cascade will handle related records)
      await client.query('DELETE FROM users WHERE id = $1', [userId]);

      await client.query('COMMIT');

      return { success: true };
    } catch (error) {
      await client.query('ROLLBACK');
      throw error;
    } finally {
      client.release();
    }
  }
}

export default new UserService();