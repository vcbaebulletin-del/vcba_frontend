import { useState, useEffect, useCallback, useRef } from 'react';
import { announcementService } from '../services';
import {
  adminAnnouncementServiceWithToken,
  studentAnnouncementServiceWithToken
} from '../services/announcementService';
import { categoryService } from '../services/categoryService';
import { ADMIN_AUTH_TOKEN_KEY, STUDENT_AUTH_TOKEN_KEY } from '../config/constants';
import type {
  Announcement,
  CreateAnnouncementData,
  UpdateAnnouncementData,
  AnnouncementFilters,
  UseAnnouncementsReturn,
  Category,
  ReactionType,
  UseCategoriesReturn,
  UseHierarchicalCategoriesReturn,
  UseReactionTypesReturn
} from '../types/announcement.types';

// Hook for managing announcements
export const useAnnouncements = (initialFilters?: AnnouncementFilters, useAdminService: boolean = false): UseAnnouncementsReturn => {
  const [announcements, setAnnouncements] = useState<Announcement[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | undefined>();
  const [pagination, setPagination] = useState({
    page: 1,
    totalPages: 0,
    total: 0,
    hasNext: false,
    hasPrev: false
  });
  const [filters, setFilters] = useState<AnnouncementFilters>(initialFilters || {
    page: 1,
    limit: 20,
    sort_by: 'created_at',
    sort_order: 'DESC'
  });

  // Track current user context to detect changes
  const currentUserContextRef = useRef<string>('');

  // Choose the appropriate service based on the parameter - use role-specific services with proper tokens
  const service = useAdminService ? adminAnnouncementServiceWithToken : studentAnnouncementServiceWithToken;

  // Function to get current user context identifier
  const getCurrentUserContext = useCallback(() => {
    const adminToken = localStorage.getItem(ADMIN_AUTH_TOKEN_KEY);
    const studentToken = localStorage.getItem(STUDENT_AUTH_TOKEN_KEY);

    // Create a unique identifier for the current user context
    // Priority: if both tokens exist, determine which one is currently active
    // by checking which service we're using
    if (useAdminService && adminToken) {
      return `admin:${adminToken.substring(0, 10)}`;
    } else if (!useAdminService && studentToken) {
      return `student:${studentToken.substring(0, 10)}`;
    } else if (adminToken && !studentToken) {
      return `admin:${adminToken.substring(0, 10)}`;
    } else if (studentToken && !adminToken) {
      return `student:${studentToken.substring(0, 10)}`;
    }
    return 'anonymous';
  }, [useAdminService]);

  // Function to clear cache when user context changes
  const clearCacheIfUserChanged = useCallback(() => {
    const currentContext = getCurrentUserContext();
    if (currentUserContextRef.current && currentUserContextRef.current !== currentContext) {
      console.log('🔄 User context changed, clearing announcement cache', {
        previous: currentUserContextRef.current,
        current: currentContext
      });
      // Clear all cached data when user context changes
      setAnnouncements([]);
      setPagination({
        page: 1,
        totalPages: 0,
        total: 0,
        hasNext: false,
        hasPrev: false
      });
      setError(undefined);
    }
    currentUserContextRef.current = currentContext;
  }, [getCurrentUserContext]);

  const fetchAnnouncements = useCallback(async () => {
    try {
      // Clear cache if user context changed
      clearCacheIfUserChanged();

      setLoading(true);
      setError(undefined);

      console.log('🔍 Fetching announcements with context:', {
        useAdminService,
        currentContext: getCurrentUserContext(),
        filters
      });

      const response = await service.getAnnouncements(filters);

      if (response.success && response.data) {
        console.log('✅ Announcements fetched successfully:', {
          count: response.data.announcements?.length || 0,
          userContext: getCurrentUserContext()
        });
        setAnnouncements(response.data.announcements || []);
        setPagination(response.data.pagination);
      } else {
        setError(response.message || 'Failed to fetch announcements');
      }
    } catch (err: any) {
      console.error('❌ Error fetching announcements:', err);
      setError(err.message || 'An error occurred while fetching announcements');
    } finally {
      setLoading(false);
    }
  }, [JSON.stringify(filters), useAdminService, clearCacheIfUserChanged, getCurrentUserContext, service]);

  const refresh = useCallback(async () => {
    await fetchAnnouncements();
  }, [fetchAnnouncements]);

  const createAnnouncement = useCallback(async (data: CreateAnnouncementData | FormData) => {
    try {
      setLoading(true);
      setError(undefined);

      // Type assertion based on service type - admin service supports FormData
      const response = useAdminService
        ? await (service as any).createAnnouncement(data)
        : await service.createAnnouncement(data as CreateAnnouncementData);

      if (response.success) {
        // Refresh the list to get the new announcement
        await fetchAnnouncements();
      } else {
        throw new Error(response.message || 'Failed to create announcement');
      }
    } catch (err: any) {
      setError(err.message || 'An error occurred while creating announcement');
      throw err;
    } finally {
      setLoading(false);
    }
  }, [fetchAnnouncements, service, useAdminService]);

  const updateAnnouncement = useCallback(async (id: number, data: UpdateAnnouncementData | FormData) => {
    try {
      setLoading(true);
      setError(undefined);

      // Type assertion based on service type - admin service supports FormData
      const response = useAdminService
        ? await (service as any).updateAnnouncement(id, data)
        : await service.updateAnnouncement(id, data as UpdateAnnouncementData);

      if (response.success && response.data) {
        // Update the announcement in the local state
        setAnnouncements(prev =>
          prev.map(announcement =>
            announcement.announcement_id === id
              ? { ...announcement, ...response.data?.announcement }
              : announcement
          )
        );
      } else {
        throw new Error(response.message || 'Failed to update announcement');
      }
    } catch (err: any) {
      setError(err.message || 'An error occurred while updating announcement');
      throw err;
    } finally {
      setLoading(false);
    }
  }, [service, useAdminService]);

  const deleteAnnouncement = useCallback(async (id: number) => {
    try {
      setLoading(true);
      setError(undefined);
      
      const response = await service.deleteAnnouncement(id);
      
      if (response.success) {
        // Remove the announcement from local state
        setAnnouncements(prev => 
          prev.filter(announcement => announcement.announcement_id !== id)
        );
      } else {
        throw new Error(response.message || 'Failed to delete announcement');
      }
    } catch (err: any) {
      setError(err.message || 'An error occurred while deleting announcement');
      throw err;
    } finally {
      setLoading(false);
    }
  }, [service]);

  const publishAnnouncement = useCallback(async (id: number) => {
    try {
      setLoading(true);
      setError(undefined);
      
      const response = await service.publishAnnouncement(id);
      
      if (response.success && response.data) {
        // Update the announcement status in local state
        setAnnouncements(prev =>
          prev.map(announcement =>
            announcement.announcement_id === id
              ? { ...announcement, ...response.data?.announcement }
              : announcement
          )
        );
      } else {
        throw new Error(response.message || 'Failed to publish announcement');
      }
    } catch (err: any) {
      setError(err.message || 'An error occurred while publishing announcement');
      throw err;
    } finally {
      setLoading(false);
    }
  }, [service]);

  const unpublishAnnouncement = useCallback(async (id: number) => {
    try {
      setLoading(true);
      setError(undefined);

      const response = await service.unpublishAnnouncement(id);

      if (response.success && response.data) {
        // Update the announcement status in local state
        setAnnouncements(prev =>
          prev.map(announcement =>
            announcement.announcement_id === id
              ? { ...announcement, ...response.data?.announcement }
              : announcement
          )
        );
      } else {
        throw new Error(response.message || 'Failed to unpublish announcement');
      }
    } catch (err: any) {
      setError(err.message || 'An error occurred while unpublishing announcement');
      throw err;
    } finally {
      setLoading(false);
    }
  }, [service]);

  const likeAnnouncement = useCallback(async (id: number, reactionId: number = 1) => {
    // Store original state for rollback
    const originalAnnouncements = announcements;

    try {
      setError(undefined);

      console.log('📢 Liking announcement with optimistic update:', id);

      // Optimistic update - update UI immediately
      setAnnouncements(prev =>
        prev.map(announcement =>
          announcement.announcement_id === id
            ? {
                ...announcement,
                reaction_count: (announcement.reaction_count || 0) + 1,
                user_reaction: { reaction_id: reactionId, reaction_name: 'like', reaction_emoji: '❤️' }
              }
            : announcement
        )
      );

      const response = await service.addReaction(id, reactionId);

      if (response.success) {
        console.log('📢 Announcement liked successfully');
        // The optimistic update should already be correct, but we could sync with server if needed
      } else {
        throw new Error(response.message || 'Failed to like announcement');
      }
    } catch (err: any) {
      console.error('📢 Error liking announcement, rolling back:', err);
      setError(err.message || 'An error occurred while liking announcement');

      // Rollback optimistic update
      setAnnouncements(originalAnnouncements);
      throw err;
    }
  }, [service, announcements]);

  const unlikeAnnouncement = useCallback(async (id: number) => {
    // Store original state for rollback
    const originalAnnouncements = announcements;

    try {
      setError(undefined);

      console.log('📢 Unliking announcement with optimistic update:', id);

      // Optimistic update - update UI immediately
      setAnnouncements(prev =>
        prev.map(announcement =>
          announcement.announcement_id === id
            ? {
                ...announcement,
                reaction_count: Math.max(0, (announcement.reaction_count || 0) - 1),
                user_reaction: undefined
              }
            : announcement
        )
      );

      const response = await service.removeReaction(id);

      if (response.success) {
        console.log('📢 Announcement unliked successfully');
        // The optimistic update should already be correct
      } else {
        throw new Error(response.message || 'Failed to unlike announcement');
      }
    } catch (err: any) {
      console.error('📢 Error unliking announcement, rolling back:', err);
      setError(err.message || 'An error occurred while unliking announcement');

      // Rollback optimistic update
      setAnnouncements(originalAnnouncements);
      throw err;
    }
  }, [service, announcements]);

  // Update filters and refetch
  const updateFilters = useCallback((newFilters: AnnouncementFilters) => {
    setFilters(prev => ({ ...prev, ...newFilters }));
  }, []);

  // Force refresh when service type changes (admin vs student)
  useEffect(() => {
    console.log('🔄 Service type changed, forcing refresh:', { useAdminService });
    clearCacheIfUserChanged();
    fetchAnnouncements();
  }, [useAdminService, clearCacheIfUserChanged]);

  useEffect(() => {
    fetchAnnouncements();
  }, [fetchAnnouncements]);

  return {
    announcements,
    loading,
    error,
    pagination,
    filters,
    setFilters: updateFilters,
    refresh,
    createAnnouncement,
    updateAnnouncement,
    deleteAnnouncement,
    publishAnnouncement,
    unpublishAnnouncement,
    likeAnnouncement,
    unlikeAnnouncement
  };
};

// Hook for managing categories (returns only active categories and subcategories)
export const useCategories = (): UseCategoriesReturn => {
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | undefined>();

  // Helper function to filter out deactivated and soft-deleted categories and subcategories
  const filterActiveCategories = useCallback((categories: Category[]): Category[] => {
    return categories
      .filter(category =>
        // Filter out deactivated or soft-deleted categories
        category.is_active && !(category as any).deleted_at
      )
      .map(category => ({
        ...category,
        // Filter out deactivated or soft-deleted subcategories
        subcategories: category.subcategories?.filter(subcategory =>
          subcategory.is_active && !(subcategory as any).deleted_at
        ) || []
      }));
  }, []);

  const fetchCategories = useCallback(async () => {
    try {
      setLoading(true);
      setError(undefined);

      // Use the active categories endpoint for better performance
      const response = await categoryService.getActiveCategoriesWithSubcategories();

      if (response.success && response.data) {
        // Apply additional client-side filtering as a safety measure
        // Cast the categories to the correct type (categoryService returns optional category_id, but we know active categories have IDs)
        const categoriesWithIds = (response.data.categories || []).map(cat => ({
          ...cat,
          category_id: cat.category_id!,
          subcategories: cat.subcategories?.map(sub => ({
            ...sub,
            subcategory_id: sub.subcategory_id!,
            category_id: sub.category_id!
          })) || []
        })) as Category[];

        const filteredCategories = filterActiveCategories(categoriesWithIds);
        setCategories(filteredCategories);
      } else {
        setError(response.message || 'Failed to fetch categories');
      }
    } catch (err: any) {
      setError(err.message || 'An error occurred while fetching categories');
    } finally {
      setLoading(false);
    }
  }, [filterActiveCategories]);

  const refresh = useCallback(async () => {
    await fetchCategories();
  }, [fetchCategories]);

  useEffect(() => {
    fetchCategories();
  }, [fetchCategories]);

  return {
    categories,
    loading,
    error,
    refresh
  };
};

// Hook for managing hierarchical categories (categories with subcategories - returns only active ones)
export const useHierarchicalCategories = (): UseHierarchicalCategoriesReturn => {
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | undefined>();

  // Helper function to filter out deactivated and soft-deleted categories and subcategories
  const filterActiveCategories = useCallback((categories: any[]): Category[] => {
    return categories
      .filter(category =>
        // Filter out deactivated or soft-deleted categories
        category.is_active && !category.deleted_at
      )
      .map(category => ({
        ...category,
        category_id: category.category_id!,
        // Filter out deactivated or soft-deleted subcategories
        subcategories: (category.subcategories || [])
          .filter((subcategory: any) =>
            subcategory.is_active && !subcategory.deleted_at
          )
          .map((subcategory: any) => ({
            ...subcategory,
            subcategory_id: subcategory.subcategory_id!,
            category_id: subcategory.category_id!
          }))
      })) as Category[];
  }, []);

  const fetchCategories = useCallback(async () => {
    try {
      setLoading(true);
      setError(undefined);

      console.log('🔧 Fetching active categories with subcategories from API');

      // Use the active categories endpoint for better performance
      const categoriesResponse = await categoryService.getActiveCategoriesWithSubcategories();

      if (categoriesResponse.success && categoriesResponse.data) {
        // Apply additional client-side filtering as a safety measure
        const filteredCategories = filterActiveCategories(categoriesResponse.data.categories || []);
        setCategories(filteredCategories);

        console.log('✅ Active categories loaded with filtered subcategories:', {
          count: filteredCategories.length,
          categoriesWithSubcategories: filteredCategories.filter(cat => cat.subcategories && cat.subcategories.length > 0).length,
          categories: filteredCategories.map(cat => ({
            id: cat.category_id,
            name: cat.name,
            subcategoriesCount: cat.subcategories?.length || 0
          }))
        });

      } else {
        setError('Failed to fetch categories');
      }
    } catch (err: any) {
      console.error('Error fetching categories:', err);
      setError(err.message || 'An error occurred while fetching categories');
    } finally {
      setLoading(false);
    }
  }, [filterActiveCategories]);

  const refresh = useCallback(async () => {
    await fetchCategories();
  }, [fetchCategories]);

  useEffect(() => {
    fetchCategories();
  }, [fetchCategories]);

  return {
    categories,
    loading,
    error,
    refresh
  };
};

// Hook for managing reaction types
export const useReactionTypes = (): UseReactionTypesReturn => {
  const [reactionTypes, setReactionTypes] = useState<ReactionType[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | undefined>();

  const fetchReactionTypes = useCallback(async () => {
    try {
      setLoading(true);
      setError(undefined);
      
      const response = await announcementService.getReactionTypes();
      
      if (response.success && response.data) {
        setReactionTypes(response.data.reactionTypes);
      } else {
        setError(response.message || 'Failed to fetch reaction types');
      }
    } catch (err: any) {
      setError(err.message || 'An error occurred while fetching reaction types');
    } finally {
      setLoading(false);
    }
  }, []);

  const refresh = useCallback(async () => {
    await fetchReactionTypes();
  }, [fetchReactionTypes]);

  useEffect(() => {
    fetchReactionTypes();
  }, [fetchReactionTypes]);

  return {
    reactionTypes,
    loading,
    error,
    refresh
  };
};
