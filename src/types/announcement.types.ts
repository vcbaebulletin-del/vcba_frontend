// Import and re-export types from services for consistency
import type {
  Announcement,
  CreateAnnouncementData,
  UpdateAnnouncementData,
  AnnouncementFilters,
  Category,
  ReactionType,
  UserReaction,
  ReactionSummary,
  PaginatedResponse
} from '../services/announcementService';

export type {
  Announcement,
  CreateAnnouncementData,
  UpdateAnnouncementData,
  AnnouncementFilters,
  Category,
  ReactionType,
  UserReaction,
  ReactionSummary,
  PaginatedResponse
};

// Additional frontend-specific types
export interface AnnouncementFormData {
  title: string;
  content: string;
  category_id: string;
  status: 'draft' | 'scheduled' | 'published';
  is_pinned: boolean;
  is_alert: boolean;
  allow_comments: boolean;
  allow_sharing: boolean;
  scheduled_publish_at?: string;
  visibility_start_at?: string;
  visibility_end_at?: string;
}

export interface AnnouncementModalProps {
  isOpen: boolean;
  onClose: () => void;
  announcement?: Announcement;
  onSave: (data: CreateAnnouncementData | UpdateAnnouncementData) => Promise<void>;
  categories: Category[];
}

export interface AnnouncementCardProps {
  announcement: Announcement;
  onEdit: (announcement: Announcement) => void;
  onDelete: (id: number) => void;
  onView: (id: number) => void;
  onPublish?: (id: number) => void;
  onUnpublish?: (id: number) => void;
}

export interface AnnouncementListProps {
  announcements: Announcement[];
  loading: boolean;
  onEdit: (announcement: Announcement) => void;
  onDelete: (id: number) => void;
  onView: (id: number) => void;
  onPublish?: (id: number) => void;
  onUnpublish?: (id: number) => void;
}

export interface AnnouncementFiltersProps {
  filters: AnnouncementFilters;
  onFiltersChange: (filters: AnnouncementFilters) => void;
  categories: Category[];
}

export interface AnnouncementStatsProps {
  totalCount: number;
  publishedCount: number;
  draftCount: number;
  scheduledCount: number;
}

// Form validation types
export interface AnnouncementFormErrors {
  title?: string;
  content?: string;
  category_id?: string;
  scheduled_publish_at?: string;
}

// UI state types
export interface AnnouncementUIState {
  activeTab: 'all' | 'published' | 'draft' | 'scheduled';
  showCreateModal: boolean;
  showEditModal: boolean;
  editingAnnouncement?: Announcement;
  loading: boolean;
  error?: string;
  success?: string;
}

// Pagination types
export interface PaginationProps {
  currentPage: number;
  totalPages: number;
  totalItems: number;
  itemsPerPage: number;
  onPageChange: (page: number) => void;
  onItemsPerPageChange: (itemsPerPage: number) => void;
}

// Search and filter types
export interface SearchFilters {
  query: string;
  category: string;
  status: string;
  dateRange: {
    start?: string;
    end?: string;
  };
}

// Action types for state management
export type AnnouncementAction =
  | { type: 'SET_LOADING'; payload: boolean }
  | { type: 'SET_ERROR'; payload: string }
  | { type: 'SET_SUCCESS'; payload: string }
  | { type: 'CLEAR_MESSAGES' }
  | { type: 'SET_ANNOUNCEMENTS'; payload: Announcement[] }
  | { type: 'ADD_ANNOUNCEMENT'; payload: Announcement }
  | { type: 'UPDATE_ANNOUNCEMENT'; payload: Announcement }
  | { type: 'DELETE_ANNOUNCEMENT'; payload: number }
  | { type: 'SET_ACTIVE_TAB'; payload: 'all' | 'published' | 'draft' | 'scheduled' }
  | { type: 'SHOW_CREATE_MODAL' }
  | { type: 'HIDE_CREATE_MODAL' }
  | { type: 'SHOW_EDIT_MODAL'; payload: Announcement }
  | { type: 'HIDE_EDIT_MODAL' };

// Hook return types
export interface UseAnnouncementsReturn {
  announcements: Announcement[];
  loading: boolean;
  error?: string;
  pagination: {
    page: number;
    totalPages: number;
    total: number;
    hasNext: boolean;
    hasPrev: boolean;
  };
  filters: AnnouncementFilters;
  setFilters: (filters: AnnouncementFilters) => void;
  refresh: () => Promise<void>;
  createAnnouncement: (data: CreateAnnouncementData | FormData) => Promise<void>;
  updateAnnouncement: (id: number, data: UpdateAnnouncementData | FormData) => Promise<void>;
  deleteAnnouncement: (id: number) => Promise<void>;
  publishAnnouncement: (id: number) => Promise<void>;
  unpublishAnnouncement: (id: number) => Promise<void>;
  likeAnnouncement: (id: number, reactionId?: number) => Promise<void>;
  unlikeAnnouncement: (id: number) => Promise<void>;
}

export interface UseCategoriesReturn {
  categories: Category[];
  loading: boolean;
  error?: string;
  refresh: () => Promise<void>;
}

export interface UseHierarchicalCategoriesReturn {
  categories: Category[];
  loading: boolean;
  error?: string;
  refresh: () => Promise<void>;
}

export interface UseReactionTypesReturn {
  reactionTypes: ReactionType[];
  loading: boolean;
  error?: string;
  refresh: () => Promise<void>;
}
