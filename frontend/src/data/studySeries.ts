export interface StudyDay {
  day: number;
  title: string;
  passages: {
    reference: string;
    text: { verse: number; content: string }[];
  }[];
  openingPrayer?: string;
  studyFocus: string;
  teachingPoint: string;
  discussionQuestions: string[];
  reflectionQuestion: string;
  applicationPoints: string[];
  prayerFocus: string;
  estimatedTime: string;
  completed?: boolean;
  completedDate?: string;
  notes?: string;
}

export interface StudyWeek {
  week: number;
  title: string;
  theme: string;
  overview: string;
  days: StudyDay[];
}

export interface StudySeries {
  id: string;
  title: string;
  theme: string;
  description: string;
  duration: number; // days
  weeks?: StudyWeek[]; // For weekly studies
  days?: StudyDay[]; // For daily studies
  studyStyle: 'devotional' | 'topical' | 'book-study' | 'couples' | 'marriage';
  difficulty: 'beginner' | 'intermediate' | 'advanced';
  audience: 'individual' | 'couples' | 'group' | 'family';
  pastorMessage: string;
  studyStructure: 'daily' | 'weekly';
  estimatedTimePerSession: string;
  createdDate: string;
  startDate?: string;
  completedDate?: string;
  progress: {
    currentDay: number;
    currentWeek?: number;
    completedDays: number;
    totalDays: number;
    percentComplete: number;
  };
  // AI Generation Metadata
  generatedBy: 'AI' | 'Manual' | 'Hybrid';
  generationPrompt?: string;
  documentUrl?: string;
  lastModified: string;
  popularity: number;
  tags: string[];
  status: 'Published' | 'Draft' | 'In Review';
}

export interface StudyTemplate {
  id: string;
  title: string;
  theme: string;
  description: string;
  duration: number;
  studyStyle: 'devotional' | 'topical' | 'book-study';
  difficulty: 'beginner' | 'intermediate' | 'advanced';
  pastorMessage: string;
  estimatedTimePerDay: string;
  tags: string[];
}

export interface UserStudyProgress {
  studyId: string;
  userId: string; // For future user system
  currentDay: number;
  completedDays: number[];
  notes: { [dayNumber: number]: string };
  startDate: string;
  lastAccessDate: string;
  completed: boolean;
  completedDate?: string;
}

// Sample study series data removed - now using backend API
// Keep this file for type definitions but data comes from PostgreSQL

// Helper functions removed - use studiesService API instead