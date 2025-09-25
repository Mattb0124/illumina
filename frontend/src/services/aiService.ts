import { authService } from './authService';

const API_BASE_URL = 'http://localhost:3001/api';

// Form data interface (what user fills in the form)
export interface StudyGenerationFormData {
  userRequest: string;
  title: string;
  topic: string;
  duration: string;
  studyStyle?: 'devotional' | 'topical' | 'book-study' | 'marriage';
  difficulty?: 'beginner' | 'intermediate' | 'advanced';
  audience?: 'individual' | 'couples' | 'group' | 'family';
  specialRequirements?: string;
}

// API request interface (what gets sent to backend)
export interface StudyGenerationRequest {
  title: string;
  topic: string;
  duration_days: number;
  difficulty?: 'beginner' | 'intermediate' | 'advanced';
  audience?: 'individual' | 'couples' | 'group' | 'family' | 'general';
  study_style?: 'devotional' | 'topical' | 'book-study' | 'marriage';
  special_requirements?: string;
}

export interface GenerationStatus {
  requestId: string;
  status: 'pending' | 'processing' | 'content_generation' | 'validation' | 'completed' | 'failed' | 'cancelled';
  progress: number;
  title: string;
  topic: string;
  duration: string;
  durationDays: number;
  errorMessage?: string;
  createdAt: string;
  updatedAt: string;
  completionDate?: string;
  workflowSteps: WorkflowStep[];
  generatedDays: number;
  totalDays: number;
}

export interface WorkflowStep {
  step: string;
  status: 'pending' | 'in_progress' | 'completed' | 'failed' | 'skipped';
  startedAt?: string;
  completedAt?: string;
  data?: any;
}

export interface GeneratedStudy {
  request: {
    id: string;
    title: string;
    topic: string;
    duration: string;
    durationDays: number;
    studyStyle: string;
    difficulty: string;
    audience: string;
    specialRequirements?: string;
    completedAt: string;
  };
  studyContent: StudyDayContent[];
  summary: {
    totalDays: number;
    completedDays: number;
    approvedDays: number;
  };
}

export interface StudyDayContent {
  dayNumber: number;
  weekNumber?: number;
  title: string;
  theme: string;
  openingPrayer: string;
  studyFocus: string;
  teachingContent: string;
  biblePassages: any[];
  discussionQuestions: any[];
  reflectionQuestion: string;
  applicationPoints: any[];
  prayerFocus: string;
  estimatedTime: string;
  fullContent: any;
  generationStatus: string;
  validationStatus: string;
  validationNotes?: string;
}

export interface UserRequest {
  id: string;
  title: string;
  topic: string;
  duration: string;
  studyStyle: string;
  difficulty: string;
  audience: string;
  status: string;
  progressPercentage: number;
  errorMessage?: string;
  createdAt: string;
  updatedAt: string;
  completionDate?: string;
}

export interface ApiResponse<T = any> {
  success: boolean;
  data?: T;
  message?: string;
  error?: string;
}

/**
 * Parse duration string to number of days
 * Supports formats like: "8 weeks", "30 days", "2 months", "1 week", etc.
 */
export function parseDurationToDays(duration: string): number {
  const cleanDuration = duration.trim().toLowerCase();

  // Extract number and unit
  const match = cleanDuration.match(/^(\d+)\s*(day|days|week|weeks|month|months)s?$/);

  if (!match) {
    throw new Error(`Invalid duration format: "${duration}". Please use formats like "30 days", "8 weeks", or "2 months".`);
  }

  const [, numberStr, unit] = match;
  const number = parseInt(numberStr, 10);

  if (isNaN(number) || number <= 0) {
    throw new Error(`Invalid duration number: "${numberStr}". Must be a positive integer.`);
  }

  switch (unit) {
    case 'day':
    case 'days':
      return number;
    case 'week':
    case 'weeks':
      return number * 7;
    case 'month':
    case 'months':
      return number * 30; // Approximate 30 days per month
    default:
      throw new Error(`Unsupported duration unit: "${unit}". Supported units: days, weeks, months.`);
  }
}

class AIService {
  private getHeaders(): Record<string, string> {
    const token = authService.getToken();
    return {
      'Content-Type': 'application/json',
      ...(token && { Authorization: `Bearer ${token}` }),
    };
  }

  /**
   * Start a new study generation request
   */
  async generateStudy(formData: StudyGenerationFormData): Promise<{ requestId: string; status: string; message: string; estimatedTime: string }> {
    try {
      // Convert form data to backend API format
      const apiRequest: StudyGenerationRequest = {
        title: formData.title,
        topic: formData.topic,
        duration_days: parseDurationToDays(formData.duration),
        difficulty: formData.difficulty,
        audience: formData.audience,
        study_style: formData.studyStyle,
        special_requirements: formData.specialRequirements ?
          (formData.userRequest ? `${formData.userRequest}\n\n${formData.specialRequirements}` : formData.specialRequirements) :
          formData.userRequest
      };

      const response = await fetch(`${API_BASE_URL}/ai/generate-study`, {
        method: 'POST',
        headers: this.getHeaders(),
        body: JSON.stringify(apiRequest),
      });

      if (!response.ok) {
        const errorText = await response.text();
        console.error('AI generation API error:', response.status, errorText);
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const result: ApiResponse = await response.json();

      if (!result.success) {
        throw new Error(result.error || 'Failed to start study generation');
      }

      return result.data;
    } catch (error) {
      console.error('Error in study generation:', error);
      throw error;
    }
  }

  /**
   * Get the status of a study generation request
   */
  async getGenerationStatus(requestId: string): Promise<GenerationStatus> {
    try {
      const response = await fetch(`${API_BASE_URL}/ai/generation-status/${requestId}`, {
        headers: this.getHeaders(),
      });

      const result: ApiResponse<GenerationStatus> = await response.json();

      if (!result.success) {
        throw new Error(result.error || 'Failed to fetch generation status');
      }

      return result.data!;
    } catch (error) {
      console.error('Error fetching generation status:', error);
      throw error;
    }
  }

  /**
   * Get the generated study content
   */
  async getGeneratedStudy(requestId: string): Promise<GeneratedStudy> {
    try {
      const response = await fetch(`${API_BASE_URL}/ai/generated-study/${requestId}`, {
        headers: this.getHeaders(),
      });

      const result: ApiResponse<GeneratedStudy> = await response.json();

      if (!result.success) {
        throw new Error(result.error || 'Failed to fetch generated study');
      }

      return result.data!;
    } catch (error) {
      console.error('Error fetching generated study:', error);
      throw error;
    }
  }

  /**
   * Get all user's study generation requests
   */
  async getUserRequests(status?: string, limit = 20, offset = 0): Promise<{ requests: UserRequest[]; pagination: any }> {
    try {
      const params = new URLSearchParams();
      if (status) params.append('status', status);
      params.append('limit', limit.toString());
      params.append('offset', offset.toString());

      const response = await fetch(`${API_BASE_URL}/ai/user-requests?${params}`, {
        headers: this.getHeaders(),
      });

      const result: ApiResponse = await response.json();

      if (!result.success) {
        throw new Error(result.error || 'Failed to fetch user requests');
      }

      return result.data;
    } catch (error) {
      console.error('Error fetching user requests:', error);
      throw error;
    }
  }

  /**
   * Cancel a pending study generation request
   */
  async cancelGeneration(requestId: string): Promise<void> {
    try {
      const response = await fetch(`${API_BASE_URL}/ai/cancel-generation/${requestId}`, {
        method: 'DELETE',
        headers: this.getHeaders(),
      });

      const result: ApiResponse = await response.json();

      if (!result.success) {
        throw new Error(result.error || 'Failed to cancel generation');
      }
    } catch (error) {
      console.error('Error cancelling generation:', error);
      throw error;
    }
  }

  /**
   * Get AI workflow configuration status
   */
  async getConfigStatus(): Promise<{ enabled: boolean; features: any; limitations: any }> {
    try {
      const response = await fetch(`${API_BASE_URL}/ai/config-status`, {
        headers: this.getHeaders(),
      });

      const result: ApiResponse = await response.json();

      if (!result.success) {
        throw new Error(result.error || 'Failed to fetch config status');
      }

      return result.data;
    } catch (error) {
      console.error('Error fetching config status:', error);
      throw error;
    }
  }

  /**
   * Poll for generation status updates
   */
  async pollGenerationStatus(
    requestId: string,
    onUpdate: (status: GenerationStatus) => void,
    intervalMs = 5000,
    timeoutMs = 1800000 // 30 minutes
  ): Promise<GenerationStatus> {
    return new Promise((resolve, reject) => {
      const startTime = Date.now();

      const poll = async () => {
        try {
          const status = await this.getGenerationStatus(requestId);
          onUpdate(status);

          // Check if completed or failed
          if (status.status === 'completed' || status.status === 'failed' || status.status === 'cancelled') {
            resolve(status);
            return;
          }

          // Check timeout
          if (Date.now() - startTime > timeoutMs) {
            reject(new Error('Generation timeout'));
            return;
          }

          // Continue polling
          setTimeout(poll, intervalMs);
        } catch (error) {
          reject(error);
        }
      };

      poll();
    });
  }

  /**
   * Format workflow step name for display
   */
  formatWorkflowStep(step: string): string {
    const stepNames: Record<string, string> = {
      'parse_request': 'Parsing Request',
      'plan_study': 'Planning Study',
      'generate_content': 'Generating Content',
      'validate_verses': 'Validating Bible Verses',
      'theological_validation': 'Theological Review',
      'assembly': 'Finalizing Study',
      'completed': 'Completed'
    };

    return stepNames[step] || step.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase());
  }

  /**
   * Get status badge color
   */
  getStatusColor(status: string): string {
    const colors: Record<string, string> = {
      'pending': '#6B7280',
      'processing': '#3B82F6',
      'content_generation': '#8B5CF6',
      'validation': '#F59E0B',
      'completed': '#10B981',
      'failed': '#EF4444',
      'cancelled': '#6B7280'
    };

    return colors[status] || '#6B7280';
  }

  /**
   * Format duration for display
   */
  formatDuration(duration: string): string {
    return duration.replace(/(\d+)\s*(\w+)/, '$1 $2');
  }

  /**
   * Calculate estimated completion time
   */
  calculateEstimatedCompletion(status: GenerationStatus): string {
    if (status.status === 'completed') return 'Completed';
    if (status.status === 'failed' || status.status === 'cancelled') return 'N/A';

    // Rough estimate based on progress
    const remainingProgress = 100 - status.progress;
    const estimatedMinutes = Math.round((remainingProgress / 100) * status.durationDays * 2.5);

    if (estimatedMinutes < 5) return 'A few minutes';
    if (estimatedMinutes < 60) return `~${estimatedMinutes} minutes`;

    const hours = Math.round(estimatedMinutes / 60 * 10) / 10;
    return `~${hours} hours`;
  }
}

export const aiService = new AIService();