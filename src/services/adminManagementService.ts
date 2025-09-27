import { apiClient } from './api';
import {
  AdminAccount,
  CreateAdminData,
  GetAdminsParams,
  GetAdminsResponse,
  AdminResponse
} from '../types/admin.types';

class AdminManagementService {
  private baseUrl = '/api/admin-management/admins';

  /**
   * Get all admin accounts with optional filtering and pagination
   */
  async getAdmins(params: GetAdminsParams = {}): Promise<GetAdminsResponse> {
    try {
      const queryParams = new URLSearchParams();
      
      if (params.page) queryParams.append('page', params.page.toString());
      if (params.limit) queryParams.append('limit', params.limit.toString());
      if (params.search) queryParams.append('search', params.search);
      if (params.position) queryParams.append('position', params.position);
      if (params.status) queryParams.append('status', params.status);

      const response = await apiClient.get(`${this.baseUrl}?${queryParams.toString()}`);
      return response.data;
    } catch (error: any) {
      throw new Error(error.response?.data?.message || 'Failed to fetch admin accounts');
    }
  }

  /**
   * Get a specific admin account by ID
   */
  async getAdmin(adminId: number): Promise<AdminResponse> {
    try {
      const response = await apiClient.get(`${this.baseUrl}/${adminId}`);
      return response.data;
    } catch (error: any) {
      throw new Error(error.response?.data?.message || 'Failed to fetch admin account');
    }
  }

  /**
   * Create a new admin account
   */
  async createAdmin(adminData: CreateAdminData): Promise<AdminResponse> {
    try {
      // Transform the nested profile structure to flat structure expected by backend
      const transformedData = {
        email: adminData.email,
        password: (adminData as any).password,
        is_active: adminData.is_active,
        first_name: adminData.profile.first_name,
        last_name: adminData.profile.last_name,
        middle_name: adminData.profile.middle_name,
        suffix: adminData.profile.suffix,
        phone_number: adminData.profile.phone_number,
        position: adminData.profile.position,
        grade_level: adminData.profile.grade_level,
      };

      const response = await apiClient.post(this.baseUrl, transformedData);
      return response.data;
    } catch (error: any) {
      throw new Error(error.response?.data?.message || 'Failed to create admin account');
    }
  }

  /**
   * Update an existing admin account
   */
  async updateAdmin(adminId: number, adminData: Partial<AdminAccount>): Promise<AdminResponse> {
    try {
      // Transform the nested profile structure to flat structure expected by backend
      const transformedData: any = {
        email: adminData.email,
        is_active: adminData.is_active,
      };

      // Add profile fields at root level if profile exists
      if (adminData.profile) {
        transformedData.first_name = adminData.profile.first_name;
        transformedData.last_name = adminData.profile.last_name;
        transformedData.middle_name = adminData.profile.middle_name;
        transformedData.suffix = adminData.profile.suffix;
        transformedData.phone_number = adminData.profile.phone_number;
        transformedData.position = adminData.profile.position;
        transformedData.grade_level = adminData.profile.grade_level;
      }

      // Remove undefined values to avoid sending unnecessary data
      Object.keys(transformedData).forEach(key => {
        if (transformedData[key] === undefined) {
          delete transformedData[key];
        }
      });

      const response = await apiClient.put(`${this.baseUrl}/${adminId}`, transformedData);
      return response.data;
    } catch (error: any) {
      throw new Error(error.response?.data?.message || 'Failed to update admin account');
    }
  }

  /**
   * Delete (deactivate) an admin account
   */
  async deleteAdmin(adminId: number): Promise<AdminResponse> {
    try {
      const response = await apiClient.put(`${this.baseUrl}/${adminId}/deactivate`);
      return response.data;
    } catch (error: any) {
      throw new Error(error.response?.data?.message || 'Failed to delete admin account');
    }
  }

  /**
   * Toggle admin account status (active/inactive)
   */
  async toggleAdminStatus(adminId: number, isActive: boolean): Promise<AdminResponse> {
    try {
      const endpoint = isActive ? 'activate' : 'deactivate';
      const response = await apiClient.put(`${this.baseUrl}/${adminId}/${endpoint}`);
      return response.data;
    } catch (error: any) {
      throw new Error(error.response?.data?.message || 'Failed to update admin status');
    }
  }

  /**
   * Change admin password
   */
  async changePassword(adminId: number, currentPassword: string, newPassword: string): Promise<AdminResponse> {
    try {
      const response = await apiClient.patch(`${this.baseUrl}/${adminId}/password`, {
        current_password: currentPassword,
        new_password: newPassword
      });
      return response.data;
    } catch (error: any) {
      throw new Error(error.response?.data?.message || 'Failed to change password');
    }
  }

  /**
   * Reset admin password (super admin only)
   */
  async resetPassword(adminId: number, newPassword: string): Promise<AdminResponse> {
    try {
      const response = await apiClient.patch(`${this.baseUrl}/${adminId}/reset-password`, {
        new_password: newPassword
      });
      return response.data;
    } catch (error: any) {
      throw new Error(error.response?.data?.message || 'Failed to reset password');
    }
  }

  /**
   * Upload admin profile picture
   */
  async uploadProfilePicture(adminId: number, file: File): Promise<AdminResponse> {
    try {
      const formData = new FormData();
      formData.append('profilePicture', file);

      const response = await apiClient.post(`${this.baseUrl}/${adminId}/profile-picture`, formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });
      return response.data;
    } catch (error: any) {
      throw new Error(error.response?.data?.message || 'Failed to upload profile picture');
    }
  }

  /**
   * Remove admin profile picture
   */
  async removeProfilePicture(adminId: number): Promise<AdminResponse> {
    try {
      const response = await apiClient.delete(`${this.baseUrl}/${adminId}/profile-picture`);
      return response.data;
    } catch (error: any) {
      throw new Error(error.response?.data?.message || 'Failed to remove profile picture');
    }
  }

  /**
   * Get admin activity logs
   */
  async getAdminLogs(adminId: number, params: { page?: number; limit?: number } = {}): Promise<any> {
    try {
      const queryParams = new URLSearchParams();
      if (params.page) queryParams.append('page', params.page.toString());
      if (params.limit) queryParams.append('limit', params.limit.toString());

      const response = await apiClient.get(`${this.baseUrl}/${adminId}/logs?${queryParams.toString()}`);
      return response.data;
    } catch (error: any) {
      throw new Error(error.response?.data?.message || 'Failed to fetch admin logs');
    }
  }

  /**
   * Bulk operations
   */
  async bulkUpdateStatus(adminIds: number[], isActive: boolean): Promise<AdminResponse> {
    try {
      const response = await apiClient.patch(`${this.baseUrl}/bulk/status`, {
        admin_ids: adminIds,
        is_active: isActive
      });
      return response.data;
    } catch (error: any) {
      throw new Error(error.response?.data?.message || 'Failed to bulk update admin status');
    }
  }

  async bulkDelete(adminIds: number[]): Promise<AdminResponse> {
    try {
      const response = await apiClient.delete(`${this.baseUrl}/bulk`, {
        data: { admin_ids: adminIds }
      });
      return response.data;
    } catch (error: any) {
      throw new Error(error.response?.data?.message || 'Failed to bulk delete admins');
    }
  }

  /**
   * Export admin data
   */
  async exportAdmins(format: 'csv' | 'xlsx' | 'json' = 'csv'): Promise<Blob> {
    try {
      const response = await apiClient.get(`${this.baseUrl}/export`, {
        params: { format },
        responseType: 'blob'
      });
      return response.data;
    } catch (error: any) {
      throw new Error(error.response?.data?.message || 'Failed to export admin data');
    }
  }

  /**
   * Import admin data
   */
  async importAdmins(file: File): Promise<AdminResponse> {
    try {
      const formData = new FormData();
      formData.append('file', file);

      const response = await apiClient.post(`${this.baseUrl}/import`, formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });
      return response.data;
    } catch (error: any) {
      throw new Error(error.response?.data?.message || 'Failed to import admin data');
    }
  }
}

export const adminManagementService = new AdminManagementService();
export default adminManagementService;
