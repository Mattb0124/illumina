import { query } from '../src/config/database.js';
import fs from 'fs/promises';
import path from 'path';

async function insertExistingStudy() {
  try {
    // Read the manifest file
    const manifestPath = path.join(process.cwd(), 'studies', 'test-1758770550732', 'manifest.json');
    const manifestData = await fs.readFile(manifestPath, 'utf8');
    const manifest = JSON.parse(manifestData);

    console.log('📖 Inserting study:', manifest.title);

    // Insert into studies table
    await query(
      `INSERT INTO studies (
        id, title, theme, description, duration_days, study_style,
        difficulty, audience, study_structure, estimated_time_per_session,
        pastor_message, generated_by, generation_prompt, popularity,
        tags, status, created_at, updated_at
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, $18)
      ON CONFLICT (id) DO UPDATE SET
        title = EXCLUDED.title,
        theme = EXCLUDED.theme,
        description = EXCLUDED.description,
        updated_at = NOW()`,
      [
        manifest.id,
        manifest.title,
        manifest.theme,
        manifest.description,
        manifest.duration,
        manifest.studyStyle,
        manifest.difficulty,
        manifest.audience,
        manifest.studyStructure,
        manifest.estimatedTimePerSession,
        manifest.pastorMessage,
        'AI', // Fix: Database only accepts 'AI', 'Manual', or 'Hybrid'
        manifest.generationPrompt,
        manifest.popularity,
        manifest.tags,
        'Published', // Fix: Database only accepts 'Published', 'Draft', or 'In Review'
        new Date(manifest.createdDate),
        new Date(manifest.lastModified)
      ]
    );

    console.log('✅ Study inserted successfully!');
    console.log('🎉 Study ID:', manifest.id);
    console.log('📚 Title:', manifest.title);

    // Verify it was inserted
    const result = await query('SELECT id, title FROM studies WHERE id = $1', [manifest.id]);
    if (result.rows.length > 0) {
      console.log('✔️ Verified: Study is now in the database');
    }

    process.exit(0);
  } catch (error) {
    console.error('❌ Error inserting study:', error);
    process.exit(1);
  }
}

insertExistingStudy();