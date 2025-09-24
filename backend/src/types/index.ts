// User types
export interface User {
  id: string;
  email: string;
  password_hash: string;
  created_at: Date;
  updated_at: Date;
}

export interface AuthRequest {
  email: string;
  password: string;
}

export interface AuthResponse {
  success: boolean;
  user?: {
    id: string;
    email: string;
  };
  token?: string;
  message?: string;
}

// Study types
export interface Study {
  id: string;
  title: string;
  description: string;
  duration_days: number;
  difficulty_level: 'beginner' | 'intermediate' | 'advanced';
  tags: string[];
  created_at: Date;
  updated_at: Date;
}

export interface StudyDay {
  id: string;
  study_id: string;
  day_number: number;
  title: string;
  content: string;
  bible_passages: BiblePassage[];
  discussion_questions: string[];
  reflection_question: string;
  application_points: string[];
  prayer_focus: string;
  estimated_time: string;
}

export interface BiblePassage {
  reference: string;
  text?: string;
}

// AI Workflow types
export interface StudyGenerationRequest {
  id?: string;
  user_id: string;
  title: string;
  topic: string;
  duration_days: number;
  difficulty: 'beginner' | 'intermediate' | 'advanced';
  audience: string;
  study_style: string;
  special_requirements?: string;
  status: 'pending' | 'processing' | 'completed' | 'failed';
  progress_percentage: number;
  error_message?: string;
  created_at?: Date;
  updated_at?: Date;
}

export interface GeneratedStudyContent {
  id?: string;
  request_id: string;
  day_number: number;
  week_number: number;
  title: string;
  theme: string;
  opening_prayer: string;
  study_focus: string;
  teaching_content: string;
  bible_passages: BiblePassage[];
  discussion_questions: string[];
  reflection_question: string;
  application_points: string[];
  prayer_focus: string;
  estimated_time: string;
  content_data: any;
  generation_status: 'pending' | 'processing' | 'completed' | 'failed';
  validation_status: 'pending' | 'approved' | 'needs_review';
  created_at?: Date;
  updated_at?: Date;
}

export interface WorkflowState {
  id?: string;
  request_id: string;
  current_step: string;
  step_status: 'pending' | 'processing' | 'completed' | 'failed';
  step_data: any;
  started_at?: Date;
  completed_at?: Date;
  updated_at?: Date;
}

// API Response types
export interface ApiResponse<T = any> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
}

export interface PaginatedResponse<T> extends ApiResponse<T[]> {
  pagination?: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

// Request types with Express
import { Request } from 'express';

export interface AuthenticatedRequest extends Request {
  user?: {
    id: string;
    email: string;
    created_at: Date;
    name?: string;
  };
}

// OpenAI Agents types
export interface StudyGenerationTool {
  name: string;
  description: string;
  parameters: {
    title: string;
    topic: string;
    durationDays: number;
    studyStyle: string;
    difficulty: string;
    audience: string;
    specialRequirements?: string;
  };
}

export interface GeneratedDay {
  dayNumber: number;
  title: string;
  theme: string;
  openingPrayer: string;
  mainPassage: string;
  teachingContent: string;
  discussionQuestions: string[];
  reflectionQuestion: string;
  applicationPoints: string[];
  closingPrayer: string;
}