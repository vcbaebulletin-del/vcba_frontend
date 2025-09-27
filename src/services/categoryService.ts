import { apiClient } from './api';

// Custom error class for category deletion issues
export class CategoryDeletionError extends Error {
  public details: any;

  constructor(message: string, details?: any) {
    super(message);
    this.name = 'CategoryDeletionError';
    this.details = details;
  }
}

interface Subcategory {
  subcategory_id?: number;
  category_id?: number;
  name: string;
  description?: string;
  color_code: string;
  is_active: boolean;
  display_order: number;
  created_at?: string;
  updated_at?: string;
}

interface Category {
  category_id?: number;
  name: string;
  description?: string;
  color_code: string;
  is_active: boolean;
  created_at?: string;
  updated_at?: string;
  subcategories?: Subcategory[];
}

interface CategoryResponse {
  success: boolean;
  data?: {
    category?: Category;
    categories?: Category[];
    categoryId?: number;
    deletedSubcategories?: number;
    subcategoriesDeleted?: string[];
  };
  message: string;
}

interface SubcategoryResponse {
  success: boolean;
  data?: {
    subcategory?: Subcategory;
    subcategories?: Subcategory[];
  };
  message: string;
}

class CategoryService {
  private baseUrl = '/api/categories';

  /**
   * Get all categories with their subcategories (includes inactive for management)
   */
  async getCategoriesWithSubcategories(): Promise<CategoryResponse> {
    try {
      const response = await apiClient.get(`${this.baseUrl}/with-subcategories`);
      return response.data;
    } catch (error: any) {
      throw new Error(error.response?.data?.message || 'Failed to fetch categories');
    }
  }

  /**
   * Get active categories with their active subcategories (for public use)
   */
  async getActiveCategoriesWithSubcategories(): Promise<CategoryResponse> {
    try {
      const response = await apiClient.get(`${this.baseUrl}/active/with-subcategories`);
      return response.data;
    } catch (error: any) {
      throw new Error(error.response?.data?.message || 'Failed to fetch active categories');
    }
  }

  /**
   * Get all categories (without subcategories)
   */
  async getCategories(): Promise<CategoryResponse> {
    try {
      const response = await apiClient.get(this.baseUrl);
      return response.data;
    } catch (error: any) {
      throw new Error(error.response?.data?.message || 'Failed to fetch categories');
    }
  }

  /**
   * Get a specific category by ID
   */
  async getCategory(categoryId: number): Promise<CategoryResponse> {
    try {
      const response = await apiClient.get(`${this.baseUrl}/${categoryId}`);
      return response.data;
    } catch (error: any) {
      throw new Error(error.response?.data?.message || 'Failed to fetch category');
    }
  }

  /**
   * Create a new category
   */
  async createCategory(categoryData: Omit<Category, 'category_id'>): Promise<CategoryResponse> {
    try {
      const response = await apiClient.post(this.baseUrl, categoryData);
      return response.data;
    } catch (error: any) {
      console.error('❌ CategoryService.createCategory - Error details:', {
        status: error.response?.status,
        statusText: error.response?.statusText,
        data: error.response?.data,
        message: error.message
      });
      throw new Error(error.response?.data?.message || 'Failed to create category');
    }
  }

  /**
   * Update an existing category
   */
  async updateCategory(categoryId: number, categoryData: Partial<Category>): Promise<CategoryResponse> {
    try {
      const response = await apiClient.put(`${this.baseUrl}/${categoryId}`, categoryData);
      return response.data;
    } catch (error: any) {
      console.error('❌ CategoryService.updateCategory - Error details:', {
        status: error.response?.status,
        statusText: error.response?.statusText,
        data: error.response?.data,
        message: error.message
      });
      throw new Error(error.response?.data?.message || 'Failed to update category');
    }
  }

  /**
   * Delete a category
   */
  async deleteCategory(categoryId: number, options?: { cascadeSubcategories?: boolean }): Promise<CategoryResponse> {
    try {
      const params = new URLSearchParams();
      if (options?.cascadeSubcategories) {
        params.append('cascadeSubcategories', 'true');
      }

      const url = params.toString() ? `${this.baseUrl}/${categoryId}?${params.toString()}` : `${this.baseUrl}/${categoryId}`;
      const response = await apiClient.delete(url);
      return response.data;
    } catch (error: any) {
      // Enhanced error handling with detailed information
      if (error.response?.data?.error?.code === 'CATEGORY_HAS_ACTIVE_SUBCATEGORIES') {
        const errorData = error.response.data.error;
        const subcategoryList = errorData.activeSubcategories?.map((sub: any) => sub.name).join(', ') || '';

        throw new CategoryDeletionError(
          `Cannot delete category "${errorData.categoryName}" because it has ${errorData.totalActiveSubcategories} active subcategories: ${subcategoryList}`,
          {
            code: errorData.code,
            categoryId: errorData.categoryId,
            categoryName: errorData.categoryName,
            activeSubcategories: errorData.activeSubcategories,
            totalActiveSubcategories: errorData.totalActiveSubcategories,
            totalInactiveSubcategories: errorData.totalInactiveSubcategories,
            suggestions: errorData.suggestions
          }
        );
      }

      throw new Error(error.response?.data?.message || 'Failed to delete category');
    }
  }

  /**
   * Toggle category status (active/inactive)
   */
  async toggleCategoryStatus(categoryId: number, isActive: boolean): Promise<CategoryResponse> {
    try {
      const response = await apiClient.patch(`${this.baseUrl}/${categoryId}/status`, {
        is_active: isActive
      });
      return response.data;
    } catch (error: any) {
      throw new Error(error.response?.data?.message || 'Failed to update category status');
    }
  }

  // Subcategory methods

  /**
   * Get subcategories for a specific category
   */
  async getSubcategories(categoryId: number): Promise<SubcategoryResponse> {
    try {
      const response = await apiClient.get(`${this.baseUrl}/${categoryId}/subcategories`);
      return response.data;
    } catch (error: any) {
      throw new Error(error.response?.data?.message || 'Failed to fetch subcategories');
    }
  }

  /**
   * Get a specific subcategory by ID
   */
  async getSubcategory(categoryId: number, subcategoryId: number): Promise<SubcategoryResponse> {
    try {
      const response = await apiClient.get(`${this.baseUrl}/${categoryId}/subcategories/${subcategoryId}`);
      return response.data;
    } catch (error: any) {
      throw new Error(error.response?.data?.message || 'Failed to fetch subcategory');
    }
  }

  /**
   * Create a new subcategory
   */
  async createSubcategory(subcategoryData: Omit<Subcategory, 'subcategory_id'>): Promise<SubcategoryResponse> {
    try {
      const response = await apiClient.post(`${this.baseUrl}/subcategories`, subcategoryData);
      return response.data;
    } catch (error: any) {
      console.error('❌ CategoryService.createSubcategory - Error details:', {
        status: error.response?.status,
        statusText: error.response?.statusText,
        data: error.response?.data,
        message: error.message
      });
      throw new Error(error.response?.data?.message || 'Failed to create subcategory');
    }
  }

  /**
   * Update an existing subcategory
   */
  async updateSubcategory(subcategoryId: number, subcategoryData: Partial<Subcategory>): Promise<SubcategoryResponse> {
    try {
      const response = await apiClient.put(`${this.baseUrl}/subcategories/${subcategoryId}`, subcategoryData);
      return response.data;
    } catch (error: any) {
      console.error('❌ CategoryService.updateSubcategory - Error details:', {
        status: error.response?.status,
        statusText: error.response?.statusText,
        data: error.response?.data,
        message: error.message
      });
      throw new Error(error.response?.data?.message || 'Failed to update subcategory');
    }
  }

  /**
   * Delete a subcategory
   */
  async deleteSubcategory(subcategoryId: number): Promise<SubcategoryResponse> {
    try {
      const response = await apiClient.delete(`${this.baseUrl}/subcategories/${subcategoryId}`);
      return response.data;
    } catch (error: any) {
      throw new Error(error.response?.data?.message || 'Failed to delete subcategory');
    }
  }

  /**
   * Toggle subcategory status (active/inactive)
   */
  async toggleSubcategoryStatus(categoryId: number, subcategoryId: number, isActive: boolean): Promise<SubcategoryResponse> {
    try {
      const response = await apiClient.patch(`${this.baseUrl}/${categoryId}/subcategories/${subcategoryId}/status`, {
        is_active: isActive
      });
      return response.data;
    } catch (error: any) {
      throw new Error(error.response?.data?.message || 'Failed to update subcategory status');
    }
  }

  /**
   * Reorder subcategories
   */
  async reorderSubcategories(categoryId: number, subcategoryOrders: { subcategory_id: number; display_order: number }[]): Promise<SubcategoryResponse> {
    try {
      const response = await apiClient.patch(`${this.baseUrl}/${categoryId}/subcategories/reorder`, {
        subcategory_orders: subcategoryOrders
      });
      return response.data;
    } catch (error: any) {
      throw new Error(error.response?.data?.message || 'Failed to reorder subcategories');
    }
  }

  // Archive and restore methods

  /**
   * Get archived categories
   */
  async getArchivedCategories(page: number = 1, limit: number = 10): Promise<any> {
    try {
      const response = await apiClient.get(`${this.baseUrl}/archive`, {
        params: { page, limit }
      });
      return response.data;
    } catch (error: any) {
      throw new Error(error.response?.data?.message || 'Failed to fetch archived categories');
    }
  }

  /**
   * Get archived subcategories
   */
  async getArchivedSubcategories(page: number = 1, limit: number = 10): Promise<any> {
    try {
      const response = await apiClient.get(`${this.baseUrl}/subcategories/archive`, {
        params: { page, limit }
      });
      return response.data;
    } catch (error: any) {
      throw new Error(error.response?.data?.message || 'Failed to fetch archived subcategories');
    }
  }

  /**
   * Restore archived category
   */
  async restoreCategory(categoryId: number): Promise<CategoryResponse> {
    try {
      const response = await apiClient.patch(`${this.baseUrl}/${categoryId}/restore`);
      return response.data;
    } catch (error: any) {
      throw new Error(error.response?.data?.message || 'Failed to restore category');
    }
  }

  /**
   * Restore archived subcategory
   */
  async restoreSubcategory(subcategoryId: number): Promise<SubcategoryResponse> {
    try {
      const response = await apiClient.patch(`${this.baseUrl}/subcategories/${subcategoryId}/restore`);
      return response.data;
    } catch (error: any) {
      throw new Error(error.response?.data?.message || 'Failed to restore subcategory');
    }
  }

  // Bulk operations

  /**
   * Bulk update category status
   */
  async bulkUpdateCategoryStatus(categoryIds: number[], isActive: boolean): Promise<CategoryResponse> {
    try {
      const response = await apiClient.patch(`${this.baseUrl}/bulk/status`, {
        category_ids: categoryIds,
        is_active: isActive
      });
      return response.data;
    } catch (error: any) {
      throw new Error(error.response?.data?.message || 'Failed to bulk update category status');
    }
  }

  /**
   * Bulk delete categories
   */
  async bulkDeleteCategories(categoryIds: number[]): Promise<CategoryResponse> {
    try {
      const response = await apiClient.delete(`${this.baseUrl}/bulk`, {
        data: { category_ids: categoryIds }
      });
      return response.data;
    } catch (error: any) {
      throw new Error(error.response?.data?.message || 'Failed to bulk delete categories');
    }
  }

  /**
   * Export categories data
   */
  async exportCategories(format: 'csv' | 'xlsx' | 'json' = 'csv'): Promise<Blob> {
    try {
      const response = await apiClient.get(`${this.baseUrl}/export`, {
        params: { format },
        responseType: 'blob'
      });
      return response.data;
    } catch (error: any) {
      throw new Error(error.response?.data?.message || 'Failed to export categories data');
    }
  }

  /**
   * Import categories data
   */
  async importCategories(file: File): Promise<CategoryResponse> {
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
      throw new Error(error.response?.data?.message || 'Failed to import categories data');
    }
  }

  /**
   * Get category usage statistics
   */
  async getCategoryStats(): Promise<any> {
    try {
      const response = await apiClient.get(`${this.baseUrl}/stats`);
      return response.data;
    } catch (error: any) {
      throw new Error(error.response?.data?.message || 'Failed to fetch category statistics');
    }
  }
}

export const categoryService = new CategoryService();
export default categoryService;
