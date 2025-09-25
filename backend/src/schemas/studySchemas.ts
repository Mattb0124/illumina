import { z } from 'zod';

// Input validation schemas
export const StudyRequestSchema = z.object({
  title: z.string().min(1, 'Title is required'),
  topic: z.string().min(1, 'Topic is required'),
  duration_days: z.number().int().min(1).max(30, 'Duration must be between 1 and 30 days'),
  difficulty: z.enum(['beginner', 'intermediate', 'advanced']).default('intermediate'),
  audience: z.string().min(1, 'Audience is required'),
  study_style: z.enum(['devotional', 'topical', 'book-study', 'marriage']).default('devotional'),
  special_requirements: z.string().optional()
});

// AI Study Plan Response Schema (output from AI, before enrichment)
export const AIStudyPlanResponseSchema = z.object({
  title: z.string(),
  theme: z.string(),
  description: z.string(),
  duration: z.number(),
  estimatedTimePerSession: z.string(),
  pastorMessage: z.string(),
  tags: z.array(z.string()),
  dailyPlan: z.array(z.object({
    day: z.number(),
    title: z.string(),
    theme: z.string(),
    focusPassage: z.string(),
    learningObjective: z.string(),
    keyPoints: z.array(z.string())
  }))
});

// Study Plan Schema (output from Planning Agent, after enrichment)
export const StudyPlanSchema = z.object({
  studyId: z.string(),
  title: z.string(),
  theme: z.string(),
  description: z.string(),
  duration: z.number(),
  studyStyle: z.string(),
  difficulty: z.string(),
  audience: z.string(),
  estimatedTimePerSession: z.string(),
  pastorMessage: z.string(),
  tags: z.array(z.string()),
  dailyPlan: z.array(z.object({
    day: z.number(),
    title: z.string(),
    theme: z.string(),
    focusPassage: z.string(),
    learningObjective: z.string(),
    keyPoints: z.array(z.string())
  }))
});

// Bible Verse Schema
export const BibleVerseSchema = z.object({
  verse: z.number(),
  content: z.string()
});

// Bible Passage Schema  
export const BiblePassageSchema = z.object({
  reference: z.string(),
  verses: z.array(BibleVerseSchema)
});

// Daily Study Content Schema (output from Content Generation Agent)
export const DailyStudyContentSchema = z.object({
  day: z.number(),
  title: z.string(),
  estimatedTime: z.string(),
  passages: z.array(BiblePassageSchema),
  studyFocus: z.string().optional(),
  teachingPoint: z.string().optional(), // Optional - can be empty if AI fails to provide
  discussionQuestions: z.array(z.string()).optional(),
  reflectionQuestion: z.string().optional(),
  applicationPoints: z.array(z.string()).optional(),
  prayerFocus: z.string().optional()
});

// Complete Study Content Schema
export const CompleteStudyContentSchema = z.object({
  manifest: StudyPlanSchema,
  dailyContent: z.array(DailyStudyContentSchema)
});

// File generation schemas
export const StudyManifestSchema = z.object({
  id: z.string(),
  title: z.string(),
  theme: z.string(),
  description: z.string(),
  duration: z.number(),
  studyStyle: z.string(),
  difficulty: z.string(),
  audience: z.string(),
  studyStructure: z.string().default('daily'),
  estimatedTimePerSession: z.string(),
  pastorMessage: z.string(),
  generatedBy: z.string().default('AI'),
  generationPrompt: z.string(),
  popularity: z.number().default(0),
  tags: z.array(z.string()),
  status: z.string().default('Generated'),
  createdDate: z.string(),
  lastModified: z.string()
});

export type StudyRequest = z.infer<typeof StudyRequestSchema>;
export type AIStudyPlanResponse = z.infer<typeof AIStudyPlanResponseSchema>;
export type StudyPlan = z.infer<typeof StudyPlanSchema>;
export type BibleVerse = z.infer<typeof BibleVerseSchema>;
export type BiblePassage = z.infer<typeof BiblePassageSchema>;
export type DailyStudyContent = z.infer<typeof DailyStudyContentSchema>;
export type CompleteStudyContent = z.infer<typeof CompleteStudyContentSchema>;
export type StudyManifest = z.infer<typeof StudyManifestSchema>;