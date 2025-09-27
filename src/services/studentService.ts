import { API_ENDPOINTS } from '../config/constants';
import { httpClient } from './api.service';
import { ApiResponse } from '../types';

export interface CreateStudentRequest {
  // Account data
  student_number: string;
  email: string;
  password: string;
  is_active?: boolean;
  created_by: number;

  // Profile data
  first_name: string;
  middle_name?: string;
  last_name: string;
  suffix?: string | null; // Allow null to properly clear suffix in database
  phone_number: string;
  grade_level: number;
  parent_guardian_name?: string;
  parent_guardian_phone?: string;
  address?: string;
  profile_picture?: string;
}

export interface StudentAccount {
  student_id: number;
  student_number: string;
  email: string;
  is_active: boolean;
  last_login: string | null;
  created_at: string;
  updated_at: string;
}

export interface StudentProfile {
  profile_id: number;
  student_id: number;
  first_name: string;
  middle_name: string | null;
  last_name: string;
  suffix: string | null;
  full_name: string; // Computed field for backward compatibility
  phone_number: string;
  grade_level: number;
  parent_guardian_name: string | null;
  parent_guardian_phone: string | null;
  address: string | null;
  profile_picture: string | null;
  created_at: string;
  updated_at: string;
}

export interface Student extends StudentAccount {
  profile: StudentProfile;
}

export interface StudentsResponse {
  students: Student[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

class StudentService {
  async createStudent(studentData: CreateStudentRequest): Promise<Student> {
    try {
      const response = await httpClient.post<any>(API_ENDPOINTS.ADMIN.STUDENTS, studentData);

      // Handle the actual response structure from backend
      const responseData = response.data || response;
      if (responseData?.student) {
        return responseData.student;
      } else if (responseData?.success && responseData?.data?.student) {
        return responseData.data.student;
      } else {
        throw new Error('Invalid response from server');
      }
    } catch (error: any) {
      console.error('Error creating student:', error);

      // If it's a validation error, provide more specific details
      if (error.details && Array.isArray(error.details)) {
        const validationErrors = error.details.map((detail: any) =>
          `${detail.field}: ${detail.message}`
        ).join(', ');
        throw new Error(`Validation failed: ${validationErrors}`);
      }

      throw new Error(error.message || 'Failed to create student account');
    }
  }

  async getStudents(params?: {
    page?: number;
    limit?: number;
    search?: string;
    grade_level?: number;
    is_active?: boolean;
  }): Promise<StudentsResponse> {
    try {
      // Filter out undefined values to avoid sending "undefined" as string
      const cleanParams: any = {};
      if (params) {
        if (params.page !== undefined) cleanParams.page = params.page;
        if (params.limit !== undefined) cleanParams.limit = params.limit;
        if (params.search !== undefined && params.search !== '') cleanParams.search = params.search;
        if (params.grade_level !== undefined) cleanParams.grade_level = params.grade_level;
        if (params.is_active !== undefined) cleanParams.is_active = params.is_active.toString();
      }

      const response = await httpClient.get<any>(API_ENDPOINTS.ADMIN.STUDENTS, cleanParams);

      // Handle the actual response structure from backend
      const responseData = response.data || response;

      if (responseData?.success && responseData?.students && responseData?.pagination) {
        return {
          students: responseData.students,
          pagination: responseData.pagination
        };
      } else {
        throw new Error('Invalid response from server');
      }
    } catch (error: any) {
      console.error('Error fetching students:', error);
      throw new Error(error.message || 'Failed to fetch students');
    }
  }

  async getStudent(studentId: string): Promise<Student> {
    try {
      const response = await httpClient.get<ApiResponse<{ student: Student }>>(API_ENDPOINTS.ADMIN.STUDENT_BY_ID(studentId));
      if (!response.data?.data?.student) {
        throw new Error('Invalid response from server');
      }
      return response.data.data.student;
    } catch (error: any) {
      console.error('Error fetching student:', error);
      throw new Error(error.message || 'Failed to fetch student');
    }
  }

  async updateStudent(studentId: string, studentData: Partial<CreateStudentRequest>): Promise<Student> {
    try {
      const response = await httpClient.put<any>(API_ENDPOINTS.ADMIN.STUDENT_BY_ID(studentId), studentData);

      // Handle the actual response structure from backend
      const responseData = response.data || response;
      if (responseData?.student) {
        return responseData.student;
      } else if (responseData?.success && responseData?.data?.student) {
        return responseData.data.student;
      } else {
        throw new Error('Invalid response from server');
      }
    } catch (error: any) {
      console.error('Error updating student:', error);
      throw new Error(error.message || 'Failed to update student');
    }
  }

  async deleteStudent(studentId: string): Promise<void> {
    try {
      await httpClient.delete(API_ENDPOINTS.ADMIN.STUDENT_BY_ID(studentId));
    } catch (error: any) {
      console.error('Error deleting student:', error);
      throw new Error(error.message || 'Failed to delete student');
    }
  }

  async resetStudentPassword(studentId: string, newPassword: string = 'Student123'): Promise<void> {
    try {
      await httpClient.post(API_ENDPOINTS.ADMIN.RESET_STUDENT_PASSWORD(studentId), {
        newPassword: newPassword
      });
    } catch (error: any) {
      console.error('Error resetting student password:', error);
      throw new Error(error.message || 'Failed to reset student password');
    }
  }

  async uploadStudentProfilePicture(studentId: string, file: File): Promise<Student> {
    try {
      const formData = new FormData();
      formData.append('profilePicture', file);

      const response = await httpClient.post<any>(`${API_ENDPOINTS.ADMIN.STUDENTS}/${studentId}/profile/picture`, formData);

      const responseData = response.data || response;
      if (responseData?.student) {
        return responseData.student;
      } else if (responseData?.success && responseData?.data?.student) {
        return responseData.data.student;
      } else {
        throw new Error('Invalid response from server');
      }
    } catch (error: any) {
      console.error('Error uploading student profile picture:', error);
      throw new Error(error.message || 'Failed to upload student profile picture');
    }
  }

  async removeStudentProfilePicture(studentId: string): Promise<Student> {
    try {
      const response = await httpClient.post<any>(`${API_ENDPOINTS.ADMIN.STUDENTS}/${studentId}/profile/picture/remove`);

      const responseData = response.data || response;
      if (responseData?.student) {
        return responseData.student;
      } else if (responseData?.success && responseData?.data?.student) {
        return responseData.data.student;
      } else {
        throw new Error('Invalid response from server');
      }
    } catch (error: any) {
      console.error('Error removing student profile picture:', error);
      throw new Error(error.message || 'Failed to remove student profile picture');
    }
  }
}

export const studentService = new StudentService();
