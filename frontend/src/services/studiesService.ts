import { authService } from './authService';

const API_BASE_URL = 'http://localhost:3001/api';

export interface Study {
  id: string;
  title: string;
  theme: string;
  description: string;
  duration_days: number;
  study_style: 'devotional' | 'topical' | 'book-study' | 'couples' | 'marriage';
  difficulty: 'beginner' | 'intermediate' | 'advanced';
  audience: 'individual' | 'couples' | 'group' | 'family';
  study_structure: 'daily' | 'weekly';
  estimated_time_per_session: string;
  pastor_message: string;
  generated_by: 'AI' | 'Manual' | 'Hybrid';
  generation_prompt?: string;
  popularity: number;
  tags: string[];
  status: 'Published' | 'Draft' | 'In Review';
  created_at: string;
  updated_at: string;
}

export interface ApiResponse<T = any> {
  success: boolean;
  data?: T;
  message?: string;
  error?: string;
}

class StudiesService {
  private getHeaders(): Record<string, string> {
    const token = authService.getToken();
    return {
      'Content-Type': 'application/json',
      ...(token && { Authorization: `Bearer ${token}` }),
    };
  }

  async getAllStudies(): Promise<Study[]> {
    try {
      const response = await fetch(`${API_BASE_URL}/studies`, {
        headers: this.getHeaders(),
      });

      const result: ApiResponse<Study[]> = await response.json();

      if (!result.success) {
        throw new Error(result.error || 'Failed to fetch studies');
      }

      return result.data || [];
    } catch (error) {
      console.error('Error fetching studies:', error);
      throw error;
    }
  }

  async getStudyById(id: string): Promise<Study> {
    try {
      const response = await fetch(`${API_BASE_URL}/studies/${id}`, {
        headers: this.getHeaders(),
      });

      const result: ApiResponse<Study> = await response.json();

      if (!result.success) {
        throw new Error(result.error || 'Failed to fetch study');
      }

      if (!result.data) {
        throw new Error('Study not found');
      }

      return result.data;
    } catch (error) {
      console.error('Error fetching study:', error);
      throw error;
    }
  }

  async enrollInStudy(studyId: string): Promise<any> {
    try {
      const response = await fetch(`${API_BASE_URL}/studies/${studyId}/enroll`, {
        method: 'POST',
        headers: this.getHeaders(),
      });

      const result: ApiResponse = await response.json();

      if (!result.success) {
        throw new Error(result.error || 'Failed to enroll in study');
      }

      return result.data;
    } catch (error) {
      console.error('Error enrolling in study:', error);
      throw error;
    }
  }

  async getUserStudies(): Promise<Study[]> {
    try {
      const response = await fetch(`${API_BASE_URL}/studies/user/enrolled`, {
        headers: this.getHeaders(),
      });

      const result: ApiResponse<Study[]> = await response.json();

      if (!result.success) {
        throw new Error(result.error || 'Failed to fetch user studies');
      }

      return result.data || [];
    } catch (error) {
      console.error('Error fetching user studies:', error);
      throw error;
    }
  }
}

export const studiesService = new StudiesService();