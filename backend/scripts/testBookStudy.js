#!/usr/bin/env node

/**
 * Test Script for Book Study Style
 *
 * Tests the book-study style prompt templates with Matthew
 */

import path from 'path';
import dotenv from 'dotenv';
import { v4 as uuidv4 } from 'uuid';

// Load environment variables
dotenv.config({ path: path.join(path.dirname(new URL(import.meta.url).pathname), '..', '.env') });

// Test configurations for different study styles
const testConfigs = {
  // Book Study - Matthew
  bookStudy: {
    topic: 'Gospel of Matthew',
    title: 'Matthew: The King and His Kingdom',
    days: 28, // 28 chapters in Matthew
    difficulty: 'intermediate',
    audience: 'group',
    style: 'book-study',
    requirements: 'Chapter-by-chapter exposition with historical context'
  },

  // Topical Study
  topical: {
    topic: 'The Names of God',
    title: 'Knowing God Through His Names',
    days: 7,
    difficulty: 'intermediate',
    audience: 'individual',
    style: 'topical',
    requirements: 'Explore different names of God across Old and New Testament'
  },

  // Marriage Study
  marriage: {
    topic: 'Building a Godly Marriage',
    title: 'Two Becoming One',
    days: 7,
    difficulty: 'beginner',
    audience: 'couples',
    style: 'marriage',
    requirements: 'Practical exercises for couples to do together'
  },

  // Devotional Study (control test)
  devotional: {
    topic: 'Daily Hope',
    title: 'Finding Hope in Hard Times',
    days: 5,
    difficulty: 'beginner',
    audience: 'individual',
    style: 'devotional',
    requirements: 'Personal encouragement and application'
  }
};

// Select which study to test
const SELECTED_STUDY = 'bookStudy'; // Change this to test different styles

async function importAIService() {
  try {
    const { AIService } = await import('../dist/services/aiService.js');
    return AIService;
  } catch (error) {
    console.log('📦 Compiled version not found, please run: npm run build');
    process.exit(1);
  }
}

async function runTest() {
  const studyConfig = testConfigs[SELECTED_STUDY];

  console.log(`\n🧪 Testing ${studyConfig.style.toUpperCase()} Study Style\n`);
  console.log('📋 Study Configuration:');
  console.log(`   Topic: ${studyConfig.topic}`);
  console.log(`   Title: ${studyConfig.title}`);
  console.log(`   Days: ${studyConfig.days}`);
  console.log(`   Style: ${studyConfig.style}`);
  console.log(`   Requirements: ${studyConfig.requirements}`);

  const testRequest = {
    id: uuidv4(),
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

    // Use mock mode for faster testing (comment out to use real AI)
    // process.env.USE_MOCK_AI = 'true';
    const aiService = new AIService();

    const isEnabled = aiService.isEnabled();
    console.log(`   Status: ${isEnabled ? '✅ Enabled' : '❌ Disabled'}`);

    if (!isEnabled) {
      console.log('\n⚠️  AI Service is not enabled');
      return;
    }

    console.log(`\n🚀 Starting ${studyConfig.style} generation for "${studyConfig.title}"...`);
    const startTime = new Date();

    const result = await aiService.generateStudy(testRequest);

    const endTime = new Date();
    const duration = endTime.getTime() - startTime.getTime();

    console.log('\n🎉 Generation Completed Successfully!');
    console.log(`   Duration: ${Math.round(duration / 1000)}s`);
    console.log(`   Status: ${result.status}`);
    console.log(`   Progress: ${result.progress}%`);
    console.log(`   Generated Days: ${result.generatedContent?.length || 0}`);

    if (result.studyPath) {
      console.log(`   Study Files: ${result.studyPath}`);

      // Read and display a sample day
      const fs = await import('fs/promises');
      const dayPath = path.join(result.studyPath, 'day-1.md');

      try {
        const content = await fs.readFile(dayPath, 'utf8');
        console.log('\n📖 Sample Day 1 Content (first 500 chars):');
        console.log('   ' + content.substring(0, 500).replace(/\n/g, '\n   ') + '...');

        // Check for study-style specific content
        if (studyConfig.style === 'book-study') {
          const hasChapterRef = content.includes('Matthew 1') || content.includes('Chapter 1');
          console.log(`\n✓ Chapter reference found: ${hasChapterRef ? 'Yes' : 'No'}`);
        } else if (studyConfig.style === 'topical') {
          const hasCrossRefs = content.includes('reference') && content.split('reference').length > 2;
          console.log(`\n✓ Multiple references found: ${hasCrossRefs ? 'Yes' : 'No'}`);
        } else if (studyConfig.style === 'marriage') {
          const hasCouplesFocus = content.toLowerCase().includes('couple') || content.toLowerCase().includes('spouse');
          console.log(`\n✓ Marriage/couples focus found: ${hasCouplesFocus ? 'Yes' : 'No'}`);
        }
      } catch (error) {
        console.log('   Could not read day-1.md');
      }
    }

    console.log(`\n✅ ${studyConfig.style.toUpperCase()} study style test completed successfully!`);

  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    console.error('\n💥 Test Failed:', errorMessage);
  }
}

// Run the test
if (import.meta.url === `file://${process.argv[1]}`) {
  runTest().then(() => {
    console.log('\n🏁 Test completed');
    process.exit(0);
  }).catch(error => {
    console.error('\n💥 Test failed:', error);
    process.exit(1);
  });
}