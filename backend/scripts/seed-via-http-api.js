#!/usr/bin/env node

/**
 * Seed Studies via HTTP API
 * Uses HTTP requests to seed data through the working backend API
 * This avoids the password parsing issues in direct database connections
 */

const sampleStudies = [
  {
    id: "faith-foundations-7",
    title: "Foundations of Faith",
    theme: "Faith",
    description: "Explore the biblical foundations of faith through key passages that have strengthened believers for generations.",
    duration_days: 7,
    study_style: "devotional",
    difficulty: "beginner",
    audience: "individual",
    study_structure: "daily",
    estimated_time_per_session: "10-15 minutes",
    pastor_message: "This study is perfect for anyone wanting to deepen their understanding of what it means to have faith in God. Each day builds upon the previous, creating a strong foundation for your spiritual journey.",
    generated_by: "Hybrid",
    generation_prompt: "Create a 7-day study on the foundations of faith using key Bible passages",
    popularity: 8.7,
    tags: ["faith", "beginner", "foundational", "daily devotional", "spiritual growth"],
    status: "Published"
  },
  {
    id: "marriage-foundations-8w",
    title: "Marriage Foundations",
    theme: "Marriage",
    description: "An 8-week journey to strengthen your marriage through biblical principles, designed for couples to study together.",
    duration_days: 56,
    study_style: "marriage",
    difficulty: "intermediate",
    audience: "couples",
    study_structure: "weekly",
    estimated_time_per_session: "20-30 minutes",
    pastor_message: "Marriage is one of God's greatest gifts, designed to reflect His love for us. This study will strengthen your foundation and deepen your unity as you discover God's beautiful design for your relationship.",
    generated_by: "AI",
    generation_prompt: "Create an 8-week marriage study focusing on biblical foundations for couples",
    popularity: 9.2,
    tags: ["marriage", "couples", "biblical foundations", "relationship", "weekly study"],
    status: "Published"
  },
  {
    id: "prayer-power-5",
    title: "The Power of Prayer",
    theme: "Prayer",
    description: "A 5-day intensive study on developing a deeper prayer life and understanding prayer's role in spiritual warfare.",
    duration_days: 5,
    study_style: "devotional",
    difficulty: "intermediate",
    audience: "individual",
    study_structure: "daily",
    estimated_time_per_session: "20-25 minutes",
    pastor_message: "Prayer is the lifeline of every believer. This study will transform how you approach God in prayer and help you discover the power available to you through consistent, faith-filled prayer.",
    generated_by: "AI",
    generation_prompt: "Create a powerful 5-day study on prayer focusing on practical prayer life development",
    popularity: 8.9,
    tags: ["prayer", "spiritual warfare", "devotional", "faith", "daily practice"],
    status: "Published"
  },
  {
    id: "anxiety-peace-14",
    title: "From Anxiety to Peace",
    theme: "Mental Health",
    description: "A comprehensive 2-week study addressing anxiety from a biblical perspective and finding God's peace in difficult circumstances.",
    duration_days: 14,
    study_style: "topical",
    difficulty: "beginner",
    audience: "individual",
    study_structure: "daily",
    estimated_time_per_session: "15-20 minutes",
    pastor_message: "In our anxious world, God offers a peace that surpasses understanding. This study will help you discover biblical tools for managing anxiety and walking in God's peace daily.",
    generated_by: "AI",
    generation_prompt: "Create a biblical study addressing anxiety and finding peace in God for people struggling with worry",
    popularity: 9.5,
    tags: ["anxiety", "peace", "mental health", "worry", "biblical counseling", "emotional healing"],
    status: "Published"
  },
  {
    id: "parenting-wisdom-21",
    title: "Biblical Parenting Wisdom",
    theme: "Family",
    description: "A 3-week study for parents seeking biblical wisdom in raising children with love, discipline, and grace.",
    duration_days: 21,
    study_style: "topical",
    difficulty: "intermediate",
    audience: "family",
    study_structure: "daily",
    estimated_time_per_session: "25-30 minutes",
    pastor_message: "Parenting is one of life's greatest privileges and challenges. This study offers biblical wisdom for raising children who love God and follow His ways.",
    generated_by: "Manual",
    popularity: 8.1,
    tags: ["parenting", "family", "children", "discipline", "wisdom", "biblical guidance"],
    status: "Published"
  },
  {
    id: "ephesians-armor-god-7",
    title: "The Armor of God",
    theme: "Spiritual Warfare",
    description: "A week-long study of Ephesians 6:10-18, exploring each piece of spiritual armor and how to stand firm against evil.",
    duration_days: 7,
    study_style: "book-study",
    difficulty: "advanced",
    audience: "individual",
    study_structure: "daily",
    estimated_time_per_session: "30-35 minutes",
    pastor_message: "Every believer is in a spiritual battle. This study of Ephesians 6 will equip you with understanding and practical application of God's armor for spiritual warfare.",
    generated_by: "Hybrid",
    generation_prompt: "Create an in-depth study of Ephesians 6:10-18 focusing on spiritual warfare and the armor of God",
    popularity: 7.8,
    tags: ["spiritual warfare", "Ephesians", "armor of God", "Bible study", "advanced", "protection"],
    status: "Published"
  }
];

async function seedViaHttpApi() {
  console.log('🌱 Seeding studies via HTTP API...');

  // First check if backend is running
  try {
    const response = await fetch('http://localhost:3001/api/health');
    const health = await response.json();

    if (health.status !== 'OK') {
      throw new Error('Backend not healthy');
    }

    console.log('✅ Backend is running and healthy');
  } catch (error) {
    console.error('❌ Backend is not running. Please start it with: npm run dev');
    process.exit(1);
  }

  // Check existing studies via API
  try {
    const response = await fetch('http://localhost:3001/api/studies');
    const result = await response.json();

    if (result.success && result.data && result.data.length > 0) {
      console.log(`📚 Found ${result.data.length} existing studies in database.`);
      console.log('✅ Database already seeded');

      // Show existing studies
      console.log('\\n📊 Existing studies:');
      result.data.forEach(study => {
        console.log(`   - ${study.title} (${study.difficulty})`);
      });

      return;
    }
  } catch (error) {
    console.log('Continuing with seeding...');
  }

  console.log('📝 Adding studies via direct SQL insert...');

  // Since we don't have a POST endpoint for studies yet, we'll use a direct SQL approach
  // but execute it via a simple script that bypasses the connection pool issues
  try {
    const { execSync } = require('child_process');

    // Helper function to properly escape SQL strings
    const escapeSql = (str) => {
      if (!str) return 'NULL';
      return `'${str.replace(/'/g, "''").replace(/\\/g, '\\\\')}'`;
    };

    // Create individual insert statements that are properly escaped
    const sqlStatements = sampleStudies.map(study => {
      const tagsArray = study.tags.map(tag => escapeSql(tag)).join(', ');

      return `INSERT INTO studies (
        id, title, theme, description, duration_days, study_style,
        difficulty, audience, study_structure, estimated_time_per_session,
        pastor_message, generated_by, generation_prompt, popularity,
        tags, status
      ) VALUES (
        ${escapeSql(study.id)},
        ${escapeSql(study.title)},
        ${escapeSql(study.theme)},
        ${escapeSql(study.description)},
        ${study.duration_days},
        ${escapeSql(study.study_style)},
        ${escapeSql(study.difficulty)},
        ${escapeSql(study.audience)},
        ${escapeSql(study.study_structure)},
        ${escapeSql(study.estimated_time_per_session)},
        ${escapeSql(study.pastor_message)},
        ${escapeSql(study.generated_by)},
        ${study.generation_prompt ? escapeSql(study.generation_prompt) : 'NULL'},
        ${study.popularity},
        ARRAY[${tagsArray}],
        ${escapeSql(study.status)}
      ) ON CONFLICT (id) DO NOTHING;`;
    }).join('\\n\\n');

    // Write the SQL to a temporary file
    const fs = require('fs');
    const sqlFile = '/tmp/seed_studies.sql';
    fs.writeFileSync(sqlFile, sqlStatements);

    console.log('📄 Created SQL file with study data');

    // Execute the SQL using psql with the connection string
    const connectionString = 'postgresql://postgres:Rockyb%21234w1@localhost:5432/illumina_dev';
    const command = `/Library/PostgreSQL/17/bin/psql "${connectionString}" -f "${sqlFile}"`;

    execSync(command, { stdio: 'pipe' });

    console.log('✅ Studies inserted successfully');

    // Clean up
    fs.unlinkSync(sqlFile);

    // Verify via API
    const response = await fetch('http://localhost:3001/api/studies');
    const result = await response.json();

    if (result.success) {
      console.log(`🎉 Seeding complete! Database now has ${result.data.length} studies.`);

      // Show summary
      const byDifficulty = result.data.reduce((acc, study) => {
        acc[study.difficulty] = (acc[study.difficulty] || 0) + 1;
        return acc;
      }, {});

      console.log('\\n📊 Studies by difficulty:');
      Object.entries(byDifficulty).forEach(([difficulty, count]) => {
        console.log(`   ${difficulty}: ${count} studies`);
      });
    }

  } catch (error) {
    console.error('💥 Error seeding studies:', error.message);
    console.log('\\n💡 Manual alternative:');
    console.log('1. Open pgAdmin 4');
    console.log('2. Connect to illumina_dev database');
    console.log('3. Run the SQL from scripts/manual-seed.js');
    process.exit(1);
  }
}

seedViaHttpApi()
  .then(() => {
    console.log('🏁 Seeding process completed successfully!');
    process.exit(0);
  })
  .catch(error => {
    console.error('💥 Seeding process failed:', error);
    process.exit(1);
  });