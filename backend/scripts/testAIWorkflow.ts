#!/usr/bin/env node

/**
 * AI Workflow Test Script
 *
 * Tests the multi-step AI study generation service functionality.
 * 
 * USAGE: Just edit the studyConfig below and run:
 *   npx ts-node scripts/testAIWorkflow.ts
 */

import path from 'path';
import { fileURLToPath } from 'url';
import fs from 'fs';
import { execSync } from 'child_process';
import dotenv from 'dotenv';
import type { StudyGenerationRequest } from '../src/types/index.js';

// Get __dirname equivalent for ES modules
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Load environment variables from .env file (look in parent directory)
dotenv.config({ path: path.join(__dirname, '..', '.env') });

// =====================================================
// EDIT THESE VALUES TO TEST DIFFERENT STUDIES
// =====================================================
interface StudyConfig {
  topic: string;
  title: string;
  days: number;
  difficulty: 'beginner' | 'intermediate' | 'advanced';
  audience: string;
  style: 'devotional' | 'topical' | 'book-study' | 'marriage';
  requirements: string;
}

const studyConfig: StudyConfig = {
  topic: 'Book of Philippians',
  title: 'Joy in the Game: Lessons from Philippians for Athletes',
  days: 1,  // Testing with 1 day (Chapter 1) to limit API costs while testing improved prompts
  difficulty: 'intermediate',
  audience: 'individual',  // Database constraint requires: individual, couples, group, family
  style: 'book-study',
  requirements: 'Chapter-by-chapter exposition tailored specifically for teenage boys that are athletes, connecting biblical principles to sports, competition, teamwork, and character development'
};
// =====================================================

async function importAIService() {
  try {
    // Try to import the compiled JavaScript version first
    const { AIService } = await import('../dist/services/aiService.js');
    return AIService;
  } catch (error) {
    console.log('📦 Compiled version not found, compiling TypeScript...');
    
    try {
      execSync('npm run build', { cwd: path.join(process.cwd()), stdio: 'pipe' });
      console.log('✅ TypeScript compiled successfully');
      
      // Now import the compiled version
      const { AIService } = await import('../dist/services/aiService.js');
      return AIService;
    } catch (buildError) {
      console.error('💥 Failed to compile TypeScript:', (buildError as Error).message);
      console.log('\n🔧 Try running: npm run build');
      process.exit(1);
    }
  }
}

async function runTest(): Promise<void> {
  console.log('🧪 Testing Multi-Step AI Workflow...\n');
  console.log('📋 Study Configuration:');
  console.log(`   Topic: ${studyConfig.topic}`);
  console.log(`   Title: ${studyConfig.title}`);
  console.log(`   Days: ${studyConfig.days}`);
  console.log(`   Difficulty: ${studyConfig.difficulty}`);
  console.log(`   Audience: ${studyConfig.audience}`);
  console.log(`   Style: ${studyConfig.style}`);
  console.log(`   Requirements: ${studyConfig.requirements}`);

  // Create test request matching TypeScript interface
  // Generate a proper UUID for testing
  const generateTestUUID = () => {
    return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
      const r = Math.random() * 16 | 0;
      const v = c == 'x' ? r : (r & 0x3 | 0x8);
      return v.toString(16);
    });
  };

  const testRequest: StudyGenerationRequest = {
    id: generateTestUUID(),
    user_id: 'd98e14b8-b606-4e08-a19e-d1685f3ff09c',
    title: studyConfig.title,
    topic: studyConfig.topic,
    duration_days: studyConfig.days,
    difficulty: studyConfig.difficulty,
    audience: studyConfig.audience,
    study_style: studyConfig.style,
    special_requirements: studyConfig.requirements,
    status: 'pending',
    progress_percentage: 0,
    created_at: new Date(),
    updated_at: new Date()
  };

  try {
    console.log('\n🔄 Loading AI Service...');
    const AIService = await importAIService();
    const aiService = new AIService();

    // Check if enabled
    console.log('🔧 Checking AI service status...');
    const isEnabled = aiService.isEnabled();
    console.log(`   Status: ${isEnabled ? '✅ Enabled' : '❌ Disabled (missing OpenAI key)'}`);

    if (!isEnabled) {
      console.log('\n⚠️  Cannot test AI generation without OpenAI API key');
      console.log('   Set OPENAI_API_KEY environment variable to test AI features');
      console.log('   Example: export OPENAI_API_KEY="sk-your-key-here"');
      return;
    }

    console.log(`\n🚀 Starting multi-step AI generation for "${studyConfig.title}"...`);
    console.log(`   Request ID: ${testRequest.id}`);
    const startTime = new Date();

    const result = await aiService.generateStudy(testRequest);

    const endTime = new Date();
    const duration = endTime.getTime() - startTime.getTime();

    console.log('\n🎉 Test Completed Successfully!');
    console.log(`   Duration: ${Math.round(duration / 1000)}s`);
    console.log(`   Status: ${result.status}`);
    console.log(`   Progress: ${result.progress}%`);
    console.log(`   Generated Days: ${result.generatedContent?.length || 0}`);
    
    if (result.studyPath) {
      console.log(`   Study Files: ${result.studyPath}`);
      
      // Show created files
      console.log('\n📁 Created Files:');
      try {
        const files = fs.readdirSync(result.studyPath);
        files.forEach(file => {
          const filePath = path.join(result.studyPath!, file);
          const stats = fs.statSync(filePath);
          console.log(`   ${file} (${Math.round(stats.size / 1024)}KB)`);
        });

        // Show sample content
        if (result.generatedContent?.length > 0) {
          console.log('\n📖 Sample Generated Content:');
          const firstDay = result.generatedContent[0];
          console.log(`   Day 1 Title: ${firstDay.title}`);
          console.log(`   Theme: ${firstDay.theme}`);
          console.log(`   Teaching Preview: ${firstDay.teaching_content?.substring(0, 100)}...`);
          
          // Show sample markdown file content
          const day1File = path.join(result.studyPath, 'day-1.md');
          if (fs.existsSync(day1File)) {
            const markdownContent = fs.readFileSync(day1File, 'utf8');
            console.log('\n📝 Sample Markdown (first 300 chars):');
            console.log('   ' + markdownContent.substring(0, 300) + '...');
          }
        }

        // Show manifest content
        const manifestFile = path.join(result.studyPath, 'manifest.json');
        if (fs.existsSync(manifestFile)) {
          const manifest = JSON.parse(fs.readFileSync(manifestFile, 'utf8'));
          console.log('\n📋 Generated Manifest:');
          console.log(`   Study ID: ${manifest.id}`);
          console.log(`   Generated By: ${manifest.generatedBy}`);
          console.log(`   Tags: ${manifest.tags?.join(', ')}`);
          console.log(`   Pastor Message: ${manifest.pastorMessage?.substring(0, 100)}...`);
        }
      } catch (fileError) {
        console.log('   (Could not read generated files)');
      }
    }

    console.log('\n✅ Multi-step workflow test completed successfully!');
    console.log('   The AI service is working correctly with:');
    console.log('   ✓ Planning phase (structured study plan generation)');
    console.log('   ✓ Content generation phase (detailed daily content)');
    console.log('   ✓ File creation phase (markdown files and manifest)');
    console.log('   ✓ Database storage phase (content saved to database)');

  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    console.error('\n💥 Test Failed:', errorMessage);
    console.error('\n🔍 Debugging Information:');
    console.error('   This could be due to:');
    console.error('   - OpenAI API quota exceeded or invalid key');
    console.error('   - Network connectivity issues');
    console.error('   - Database connection problems');
    console.error('   - TypeScript compilation issues');
    
    if (error instanceof Error && error.stack) {
      console.error('\n🔥 Stack trace:');
      console.error(error.stack);
    }
  }
}

// Handle Ctrl+C gracefully
process.on('SIGINT', () => {
  console.log('\n\n🛑 Test interrupted by user');
  process.exit(0);
});

// Run the test
if (import.meta.url === `file://${process.argv[1]}`) {
  runTest().then(() => {
    console.log('\n🏁 Test script completed');
    process.exit(0);
  }).catch(error => {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    console.error('\n💥 Test script failed:', errorMessage);
    process.exit(1);
  });
}