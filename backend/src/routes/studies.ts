import express, { Request, Response } from 'express';
import { optionalAuth } from '../middleware/auth.js';
import { query } from '../config/database.js';
import fs from 'fs/promises';
import path from 'path';

const router = express.Router();

// Get all studies from database
router.get('/', optionalAuth, async (req: Request, res: Response) => {
  try {
    // Query actual studies from database
    const result = await query(
      `SELECT
        id, title, theme, description, duration_days, study_style,
        difficulty, audience, study_structure, estimated_time_per_session,
        pastor_message, generated_by, generation_prompt, popularity,
        tags, status, created_at, updated_at
      FROM studies
      WHERE status = 'Published' OR status = 'Generated'
      ORDER BY created_at DESC`
    );

    res.json({
      success: true,
      data: result.rows
    });
  } catch (error) {
    console.error('Get studies error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch studies'
    });
  }
});

// Get study by ID from database
router.get('/:id', optionalAuth, async (req: Request, res: Response) => {
  try {
    const { id } = req.params;

    const result = await query(
      `SELECT
        id, title, theme, description, duration_days, study_style,
        difficulty, audience, study_structure, estimated_time_per_session,
        pastor_message, generated_by, generation_prompt, popularity,
        tags, status, created_at, updated_at
      FROM studies
      WHERE id = $1 AND (status = 'Published' OR status = 'Generated')`,
      [id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({
        success: false,
        error: 'Study not found'
      });
    }

    res.json({
      success: true,
      data: result.rows[0]
    });
  } catch (error) {
    console.error('Get study by ID error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch study'
    });
  }
});

// Get study content overview (manifest + day list)
router.get('/:id/content', optionalAuth, async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const studiesPath = process.env.STUDIES_PATH || './studies';
    const studyDir = path.join(process.cwd(), studiesPath, id);

    // Check if study directory exists
    try {
      await fs.access(studyDir);
    } catch {
      return res.status(404).json({
        success: false,
        error: 'Study content not found'
      });
    }

    // Read manifest
    const manifestPath = path.join(studyDir, 'manifest.json');
    let manifest = null;
    try {
      const manifestData = await fs.readFile(manifestPath, 'utf8');
      manifest = JSON.parse(manifestData);
    } catch {
      // Manifest not found - that's okay, we'll get data from database
    }

    // Get study metadata from database
    const result = await query(
      `SELECT
        id, title, theme, description, duration_days, study_style,
        difficulty, audience, study_structure, estimated_time_per_session,
        pastor_message, generated_by, generation_prompt, popularity,
        tags, status, created_at, updated_at
      FROM studies
      WHERE id = $1 AND (status = 'Published' OR status = 'Generated')`,
      [id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({
        success: false,
        error: 'Study not found'
      });
    }

    // Get list of available days
    const files = await fs.readdir(studyDir);
    const dayFiles = files
      .filter(file => file.startsWith('day-') && file.endsWith('.md'))
      .map(file => {
        const dayNumber = parseInt(file.replace('day-', '').replace('.md', ''));
        return dayNumber;
      })
      .filter(num => !isNaN(num))
      .sort((a, b) => a - b);

    res.json({
      success: true,
      data: {
        study: result.rows[0],
        manifest,
        availableDays: dayFiles,
        totalDays: dayFiles.length
      }
    });
  } catch (error) {
    console.error('Get study content error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch study content'
    });
  }
});

// Get specific day content
router.get('/:id/day/:dayNumber', optionalAuth, async (req: Request, res: Response) => {
  try {
    const { id, dayNumber } = req.params;
    const day = parseInt(dayNumber);

    if (isNaN(day) || day < 1) {
      return res.status(400).json({
        success: false,
        error: 'Invalid day number'
      });
    }

    const studiesPath = process.env.STUDIES_PATH || './studies';
    const studyDir = path.join(process.cwd(), studiesPath, id);
    const dayFile = path.join(studyDir, `day-${day}.md`);

    try {
      const content = await fs.readFile(dayFile, 'utf8');

      // Parse frontmatter and content
      const lines = content.split('\n');
      let frontmatterEnd = -1;
      let frontmatter = {};

      if (lines[0] === '---') {
        // Find end of frontmatter
        for (let i = 1; i < lines.length; i++) {
          if (lines[i] === '---') {
            frontmatterEnd = i;
            break;
          }
        }

        if (frontmatterEnd > 0) {
          // Parse YAML frontmatter (simple parsing)
          const frontmatterLines = lines.slice(1, frontmatterEnd);
          frontmatter = parseFrontmatter(frontmatterLines.join('\n'));
        }
      }

      // Extract markdown content (after frontmatter)
      const markdownContent = frontmatterEnd > 0
        ? lines.slice(frontmatterEnd + 1).join('\n').trim()
        : content.trim();

      res.json({
        success: true,
        data: {
          day,
          frontmatter,
          content: markdownContent,
          rawContent: content
        }
      });
    } catch (error) {
      if ((error as any).code === 'ENOENT') {
        return res.status(404).json({
          success: false,
          error: `Day ${day} not found for this study`
        });
      }
      throw error;
    }
  } catch (error) {
    console.error('Get day content error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch day content'
    });
  }
});

// Simple YAML frontmatter parser for basic key-value pairs
function parseFrontmatter(yamlContent: string): any {
  const result: any = {};
  const lines = yamlContent.split('\n');

  for (const line of lines) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith('#')) continue;

    const colonIndex = trimmed.indexOf(':');
    if (colonIndex > 0) {
      const key = trimmed.substring(0, colonIndex).trim();
      const value = trimmed.substring(colonIndex + 1).trim();

      // Remove quotes if present
      const cleanValue = value.replace(/^["']|["']$/g, '');

      // Try to parse as number or keep as string
      result[key] = isNaN(Number(cleanValue)) ? cleanValue : Number(cleanValue);
    }
  }

  return result;
}

export default router;