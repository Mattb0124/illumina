import type { StudyRequest } from '../schemas/studySchemas.js';

/**
 * Factory class for generating study-style-specific prompts
 * Each study style has its own unique focus and content structure
 */
export class PromptTemplateFactory {
  /**
   * Get the appropriate planning prompt based on study style
   */
  static getPlanningPrompt(request: StudyRequest): string {
    const baseInfo = `
STUDY REQUIREMENTS:
- Title: ${request.title}
- Topic: ${request.topic}
- Duration: ${request.duration_days} days
- Difficulty: ${request.difficulty}
- Audience: ${request.audience}
- Study Style: ${request.study_style}
- Special Requirements: ${request.special_requirements || 'None'}`;

    switch (request.study_style) {
      case 'devotional':
        return this.getDevotionalPlanningPrompt(baseInfo, request);

      case 'topical':
        return this.getTopicalPlanningPrompt(baseInfo, request);

      case 'book-study':
        return this.getBookStudyPlanningPrompt(baseInfo, request);

      case 'marriage':
        return this.getMarriagePlanningPrompt(baseInfo, request);

      default:
        return this.getDevotionalPlanningPrompt(baseInfo, request); // Default fallback
    }
  }

  /**
   * Get content generation prompt based on study style
   */
  static getContentPrompt(studyPlan: any, dayPlan: any): string {
    const baseContext = `
STUDY CONTEXT:
- Overall Study: ${studyPlan.title}
- Theme: ${studyPlan.theme}
- Difficulty: ${studyPlan.difficulty}
- Audience: ${studyPlan.audience}
- Estimated Time: ${studyPlan.estimatedTimePerSession}

DAY ${dayPlan.day} REQUIREMENTS:
- Title: ${dayPlan.title}
- Theme: ${dayPlan.theme}
- Focus Passage: ${dayPlan.focusPassage}
- Learning Objective: ${dayPlan.learningObjective}
- Key Points: ${dayPlan.keyPoints.join(', ')}`;

    switch (studyPlan.studyStyle) {
      case 'devotional':
        return this.getDevotionalContentPrompt(baseContext, studyPlan, dayPlan);

      case 'topical':
        return this.getTopicalContentPrompt(baseContext, studyPlan, dayPlan);

      case 'book-study':
        return this.getBookStudyContentPrompt(baseContext, studyPlan, dayPlan);

      case 'marriage':
        return this.getMarriageContentPrompt(baseContext, studyPlan, dayPlan);

      default:
        return this.getDevotionalContentPrompt(baseContext, studyPlan, dayPlan);
    }
  }

  // DEVOTIONAL STYLE PROMPTS
  private static getDevotionalPlanningPrompt(baseInfo: string, request: StudyRequest): string {
    return `You are a Bible study curriculum planning expert specializing in personal devotional studies. Create a comprehensive ${request.duration_days}-day devotional Bible study plan.
${baseInfo}

Create a structured DEVOTIONAL plan that includes:
1. Daily personal application themes
2. Focus on spiritual growth and encouragement
3. Brief, meaningful daily passages (1-3 verses)
4. Reflection and prayer emphasis
5. Personal transformation objectives

IMPORTANT: Respond with valid JSON in this exact format:
{
  "title": "Study title",
  "theme": "Main devotional theme",
  "description": "Study description focusing on personal growth (2-3 sentences)",
  "duration": ${request.duration_days},
  "estimatedTimePerSession": "15-20 minutes",
  "pastorMessage": "Encouraging message about personal spiritual growth",
  "tags": ["devotional", "personal", "spiritual-growth"],
  "dailyPlan": [
    {
      "day": 1,
      "title": "Day 1 devotional title",
      "theme": "Personal application theme",
      "focusPassage": "Single verse or small passage",
      "learningObjective": "Personal spiritual growth objective",
      "keyPoints": ["Devotional insight 1", "Application point 2", "Prayer focus 3"]
    }
  ]
}

Ensure each day provides practical, personal application for individual spiritual growth at the ${request.difficulty} level.`;
  }

  // TOPICAL STYLE PROMPTS
  private static getTopicalPlanningPrompt(baseInfo: string, request: StudyRequest): string {
    return `You are a Bible study curriculum planning expert specializing in comprehensive topical studies. Create a ${request.duration_days}-day topical Bible study plan that explores "${request.topic}" across the entire Bible.
${baseInfo}

Create a structured TOPICAL plan that includes:
1. Systematic exploration of the topic throughout Scripture
2. Cross-references from multiple books of the Bible
3. Theological depth and biblical doctrine
4. Comprehensive biblical perspective on the topic
5. Connection between Old and New Testament teachings

IMPORTANT: Respond with valid JSON in this exact format:
{
  "title": "Study title",
  "theme": "Comprehensive biblical theme",
  "description": "Study description emphasizing thorough biblical exploration of the topic (2-3 sentences)",
  "duration": ${request.duration_days},
  "estimatedTimePerSession": "25-30 minutes",
  "pastorMessage": "Message about understanding God's full counsel on this topic",
  "tags": ["topical", "theology", "comprehensive", "doctrine"],
  "dailyPlan": [
    {
      "day": 1,
      "title": "Day 1 topical exploration",
      "theme": "Specific aspect of the topic",
      "focusPassage": "Primary passage (include book, chapter:verses)",
      "learningObjective": "Theological understanding to be gained",
      "keyPoints": ["Biblical principle 1", "Cross-reference insight 2", "Doctrinal truth 3"]
    }
  ]
}

Each day should explore different biblical perspectives on "${request.topic}", drawing from various books to build a complete theological understanding at the ${request.difficulty} level.`;
  }

  // BOOK STUDY STYLE PROMPTS
  private static getBookStudyPlanningPrompt(baseInfo: string, request: StudyRequest): string {
    // Check if the topic contains a book name
    const bookName = this.extractBookName(request.topic);
    const isBookStudy = bookName !== null;

    const targetAudience = request.special_requirements?.includes('teenage') || request.special_requirements?.includes('athlete')
      ? request.special_requirements
      : request.audience;

    // Get chapter count for known books (simplified list - expand as needed)
    const BOOK_CHAPTERS: { [key: string]: number } = {
      'philippians': 4,
      'ephesians': 6,
      'galatians': 6,
      'colossians': 4,
      'james': 5,
      '1 peter': 5,
      '2 peter': 3,
      '1 john': 5,
      'jude': 1,
      'philemon': 1,
      'titus': 3,
      'romans': 16,
      'matthew': 28,
      'mark': 16,
      'luke': 24,
      'john': 21
    };

    const chapterCount = bookName ? BOOK_CHAPTERS[bookName.toLowerCase()] || 0 : 0;

    // Create duration-specific instructions
    let durationInstructions = '';
    if (isBookStudy && chapterCount > 0) {
      if (request.duration_days === 1) {
        durationInstructions = `CRITICAL: This is a 1-day study. Focus ONLY on Chapter 1 of ${bookName} with deep, comprehensive exposition. Do NOT attempt to cover the entire book.`;
      } else if (request.duration_days < chapterCount) {
        durationInstructions = `This ${request.duration_days}-day study must cover ${chapterCount} chapters. Group chapters thoughtfully (e.g., combine shorter chapters, focus on key sections).`;
      } else if (request.duration_days === chapterCount) {
        durationInstructions = `Perfect match: ${request.duration_days} days for ${chapterCount} chapters. Dedicate one day to each chapter for thorough exposition.`;
      } else {
        durationInstructions = `With ${request.duration_days} days for ${chapterCount} chapters, include introduction, review, and application days alongside chapter studies.`;
      }
    }

    return `You are a Bible study curriculum planning expert specializing in book-by-book expository studies. Create a ${request.duration_days}-day study plan for "${request.topic}" specifically designed for ${targetAudience}.
${baseInfo}

${isBookStudy ? `This is a study of the book of ${bookName} which has ${chapterCount} chapters.` : 'Determine the most appropriate biblical book to study for this topic.'}

${durationInstructions}

Create a structured BOOK STUDY plan that includes:
1. Sequential chapter-by-chapter progression (respecting the duration constraints)
2. Historical and cultural context
3. Literary structure and author's intent
4. Original audience and application
5. Verse-by-verse exposition approach
6. Content specifically tailored to ${targetAudience} with relevant examples and applications

DURATION HANDLING RULES:
- For 1-day studies: Deep dive into Chapter 1 ONLY
- For studies shorter than chapter count: Group chapters logically
- For studies matching chapter count: One chapter per day
- For studies longer than chapter count: Add intro, review, or application days

IMPORTANT: Respond with valid JSON in this exact format:
{
  "title": "Study title",
  "theme": "Book's main theme and message",
  "description": "Study description emphasizing systematic exposition of the book (2-3 sentences)",
  "duration": ${request.duration_days},
  "estimatedTimePerSession": "30-40 minutes",
  "pastorMessage": "Message about the value of studying this book verse-by-verse",
  "tags": ["book-study", "expository", "systematic", "${bookName || 'biblical-book'}"],
  "dailyPlan": [
    {
      "day": 1,
      "title": "${request.duration_days === 1 ? 'Chapter 1:' : 'Day 1:'} [Title/Theme]",
      "theme": "Chapter's main message",
      "focusPassage": "${bookName || '[Book]'} ${request.duration_days === 1 ? '1:1-[end of chapter 1]' : '[appropriate passage]'}",
      "learningObjective": "Understanding the ${request.duration_days === 1 ? 'chapter' : 'passage'} in context",
      "keyPoints": ["Historical context", "Main teaching", "Application today"]
    }
  ]
}

${request.duration_days === 1 ?
  `REMEMBER: This 1-day study must focus ONLY on Chapter 1 with deep exposition. The focusPassage should be "${bookName || '[Book]'} 1:1-[end]" only.` :
  `Ensure the ${request.duration_days} days appropriately cover the content with proper pacing.`
} Target the ${request.difficulty} level with appropriate depth of exposition.`;
  }

  // MARRIAGE STYLE PROMPTS
  private static getMarriagePlanningPrompt(baseInfo: string, request: StudyRequest): string {
    return `You are a Bible study curriculum planning expert specializing in marriage and couples' studies. Create a ${request.duration_days}-day Bible study plan for married couples.
${baseInfo}

Create a structured MARRIAGE study plan that includes:
1. Biblical principles for godly marriages
2. Practical relationship applications
3. Discussion questions for couples to do together
4. Both individual and couple reflection times
5. Building stronger marriages through Scripture

IMPORTANT: Respond with valid JSON in this exact format:
{
  "title": "Study title",
  "theme": "Biblical marriage theme",
  "description": "Study description focusing on strengthening marriages through biblical principles (2-3 sentences)",
  "duration": ${request.duration_days},
  "estimatedTimePerSession": "30-40 minutes (as a couple)",
  "pastorMessage": "Encouraging message about God's design for marriage and growing together",
  "tags": ["marriage", "couples", "relationships", "family"],
  "dailyPlan": [
    {
      "day": 1,
      "title": "Day 1 marriage topic",
      "theme": "Relationship principle",
      "focusPassage": "Marriage-related passage",
      "learningObjective": "How this strengthens the marriage relationship",
      "keyPoints": ["Biblical principle", "Practical application", "Couple's exercise"]
    }
  ]
}

Each day should help couples grow closer to God and each other, with practical exercises they can do together at the ${request.difficulty} level.`;
  }

  // CONTENT GENERATION PROMPTS
  private static getDevotionalContentPrompt(baseContext: string, studyPlan: any, dayPlan: any): string {
    return `You are a Bible study content creation expert specializing in personal devotionals. Create detailed devotional content for individual spiritual growth.
${baseContext}

Create comprehensive DEVOTIONAL content with:
1. Personal, encouraging teaching that speaks to the heart
2. Focus on individual application and spiritual growth
3. Simple but meaningful discussion questions for self-reflection
4. Personal prayer focus
5. Practical life application

IMPORTANT: Respond with valid JSON in this exact format:
{
  "day": ${dayPlan.day},
  "title": "${dayPlan.title}",
  "estimatedTime": "${studyPlan.estimatedTimePerSession}",
  "passages": [
    {
      "reference": "Bible Reference",
      "verses": [
        {
          "verse": 1,
          "content": "Full verse text here"
        }
      ]
    }
  ],
  "studyFocus": "Brief devotional focus for personal growth",
  "teachingPoint": "2-3 paragraphs of devotional teaching with personal application and encouragement. THIS FIELD IS REQUIRED - DO NOT OMIT.",
  "discussionQuestions": ["Personal reflection 1", "Self-examination 2", "Application question 3"],
  "reflectionQuestion": "Deep personal reflection question",
  "applicationPoints": ["Practical step 1", "Personal action 2"],
  "prayerFocus": "Personal prayer guide for this devotion"
}

Make it warm, personal, and encouraging for individual daily devotion time.`;
  }

  private static getTopicalContentPrompt(baseContext: string, studyPlan: any, dayPlan: any): string {
    return `You are a Bible study content creation expert specializing in comprehensive topical studies. Create detailed content exploring this topic across Scripture.
${baseContext}

Create comprehensive TOPICAL content with:
1. Systematic theological teaching on the topic
2. Multiple Scripture cross-references (include 3-5 passages)
3. Discussion questions that explore biblical doctrine
4. Synthesis of Old and New Testament perspectives
5. Theological depth and biblical scholarship

IMPORTANT: Respond with valid JSON in this exact format:
{
  "day": ${dayPlan.day},
  "title": "${dayPlan.title}",
  "estimatedTime": "${studyPlan.estimatedTimePerSession}",
  "passages": [
    {
      "reference": "Primary passage",
      "verses": [{"verse": 1, "content": "Full verse text"}]
    },
    {
      "reference": "Cross-reference 1",
      "verses": [{"verse": 1, "content": "Supporting verse"}]
    }
  ],
  "studyFocus": "Theological aspect being explored today",
  "teachingPoint": "2-3 paragraphs exploring this aspect of the topic with theological depth, cross-references, and biblical synthesis. THIS FIELD IS REQUIRED - DO NOT OMIT.",
  "discussionQuestions": ["Theological question 1", "Doctrine exploration 2", "Biblical comparison 3", "Application question 4"],
  "reflectionQuestion": "How does this biblical truth impact your understanding of God/faith?",
  "applicationPoints": ["Theological insight 1", "Doctrinal application 2", "Biblical principle 3"],
  "prayerFocus": "Prayer incorporating this biblical truth"
}

Provide thorough biblical scholarship while remaining accessible.`;
  }

  private static getBookStudyContentPrompt(baseContext: string, studyPlan: any, dayPlan: any): string {
    const targetAudience = studyPlan.specialRequirements?.includes('teenage') || studyPlan.specialRequirements?.includes('athlete')
      ? studyPlan.specialRequirements
      : studyPlan.audience;

    return `You are a Bible study content creation expert specializing in expository book studies. Create comprehensive verse-by-verse exposition tailored specifically for ${targetAudience}.
${baseContext}

Create comprehensive EXPOSITORY BOOK STUDY content with:
1. **Comprehensive Verse Coverage**: Include 8-12 key verses from the chapter for thorough exposition (NOT just representative themes)
2. **Sequential Verse-by-verse Commentary**: Provide exposition that follows the text's natural flow and progression
3. **Historical and Cultural Context**: Deep background explanations that illuminate the original setting
4. **Greek/Hebrew Word Studies**: Include original language insights that enhance understanding
5. **Literary Structure Analysis**: Explain how this passage fits within the book's overall argument
6. **Theological Depth**: Seminary-level exposition with doctrinal implications
7. **Original Audience Application**: How the original recipients would have understood this
8. **Modern Contextual Application**: Specific applications tailored to ${targetAudience}

CRITICAL BIBLICAL TEXT REQUIREMENTS:
- **PRESERVE EXACT VERSE TEXT**: Never paraphrase, summarize, or alter biblical content in any way
- Include 8-12 verses that provide comprehensive chapter coverage (not just thematic highlights)
- Choose verses that represent the chapter's natural progression and key turning points
- Every verse must be complete and accurate - NO abbreviations or shortcuts
- NO ellipsis (...), comments, or explanatory insertions within verses

CRITICAL JSON REQUIREMENTS - VIOLATION WILL CAUSE SYSTEM FAILURE:
- Respond ONLY with valid JSON - NO comments, explanations, or additional text
- Include 8-12 verses for comprehensive expository coverage
- ABSOLUTELY FORBIDDEN: "...", "/* */", "//", or ANY abbreviation tokens
- Every listed verse must have complete, unaltered biblical content
- ALL FIELDS ARE REQUIRED: teachingPoint, studyFocus, discussionQuestions, reflectionQuestion, applicationPoints, prayerFocus
- SYSTEM WILL FAIL if you include any abbreviation patterns or omit required fields

IMPORTANT: Respond with valid JSON in this exact format:
{
  "day": ${dayPlan.day},
  "title": "${dayPlan.title}",
  "estimatedTime": "${studyPlan.estimatedTimePerSession}",
  "passages": [
    {
      "reference": "${dayPlan.focusPassage}",
      "verses": [
        {
          "verse": 1,
          "content": "Complete, unaltered biblical text of verse 1"
        },
        {
          "verse": 2,
          "content": "Complete, unaltered biblical text of verse 2"
        }
      ]
    }
  ],
  "studyFocus": "Comprehensive chapter overview with expository focus and main theological themes",
  "teachingPoint": "2-3 substantial paragraphs providing: (1) Historical and cultural background with verse-by-verse exposition including Greek/Hebrew insights, (2) Literary structure and author's theological argument with original audience implications, (3) Modern application with specific examples for ${targetAudience}. This should be seminary-level exposition that is comprehensive and meaty, NOT devotional in nature. THIS FIELD IS REQUIRED - DO NOT OMIT.",
  "discussionQuestions": ["Historical context question", "Textual interpretation question", "Theological implication question", "Original audience question", "Modern application question"],
  "reflectionQuestion": "Based on the verse-by-verse exposition, how does this passage advance the book's overall theological argument?",
  "applicationPoints": ["Exegetical insight 1", "Historical parallel 2", "Theological principle 3", "Practical application 4"],
  "prayerFocus": "Prayer incorporating the theological truths revealed through expository analysis"
}

Provide comprehensive, seminary-level expository commentary that clearly distinguishes this as a book study rather than devotional content, while remaining accessible for the ${studyPlan.difficulty} level.`;
  }

  private static getMarriageContentPrompt(baseContext: string, studyPlan: any, dayPlan: any): string {
    return `You are a Bible study content creation expert specializing in marriage enrichment. Create detailed content for couples to study together.
${baseContext}

Create comprehensive MARRIAGE content with:
1. Biblical teaching on marriage and relationships
2. Practical exercises couples can do together
3. Discussion questions designed for couple conversation
4. Both individual and shared application points
5. Building intimacy and unity through God's Word

IMPORTANT: Respond with valid JSON in this exact format:
{
  "day": ${dayPlan.day},
  "title": "${dayPlan.title}",
  "estimatedTime": "${studyPlan.estimatedTimePerSession}",
  "passages": [
    {
      "reference": "Marriage/relationship passage",
      "verses": [
        {
          "verse": 1,
          "content": "Full verse text"
        }
      ]
    }
  ],
  "studyFocus": "Marriage principle being explored",
  "teachingPoint": "2-3 paragraphs on biblical marriage principles, God's design for relationships, and practical wisdom for couples. THIS FIELD IS REQUIRED - DO NOT OMIT.",
  "discussionQuestions": [
    "Question for couples to discuss together 1",
    "Relationship reflection question 2",
    "Practical application for your marriage 3",
    "Share with your spouse question 4"
  ],
  "reflectionQuestion": "As a couple, how can you apply this to strengthen your marriage?",
  "applicationPoints": [
    "Exercise to do together this week",
    "Individual commitment to make",
    "Couple's prayer or activity"
  ],
  "prayerFocus": "Prayer for your marriage and spouse"
}

Make it practical, intimate, and designed to bring couples closer to God and each other.`;
  }

  /**
   * Extract biblical book name from topic string
   */
  private static extractBookName(topic: string): string | null {
    const books = [
      'Genesis', 'Exodus', 'Leviticus', 'Numbers', 'Deuteronomy',
      'Joshua', 'Judges', 'Ruth', '1 Samuel', '2 Samuel', '1 Kings', '2 Kings',
      '1 Chronicles', '2 Chronicles', 'Ezra', 'Nehemiah', 'Esther',
      'Job', 'Psalms', 'Proverbs', 'Ecclesiastes', 'Song of Solomon',
      'Isaiah', 'Jeremiah', 'Lamentations', 'Ezekiel', 'Daniel',
      'Hosea', 'Joel', 'Amos', 'Obadiah', 'Jonah', 'Micah', 'Nahum',
      'Habakkuk', 'Zephaniah', 'Haggai', 'Zechariah', 'Malachi',
      'Matthew', 'Mark', 'Luke', 'John', 'Acts', 'Romans',
      '1 Corinthians', '2 Corinthians', 'Galatians', 'Ephesians',
      'Philippians', 'Colossians', '1 Thessalonians', '2 Thessalonians',
      '1 Timothy', '2 Timothy', 'Titus', 'Philemon', 'Hebrews', 'James',
      '1 Peter', '2 Peter', '1 John', '2 John', '3 John', 'Jude', 'Revelation'
    ];

    const topicLower = topic.toLowerCase();
    for (const book of books) {
      if (topicLower.includes(book.toLowerCase())) {
        return book;
      }
    }

    return null;
  }
}