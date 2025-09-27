// Comment-related types
export interface Comment {
  comment_id: number;
  announcement_id: number;
  parent_comment_id?: number | null;
  user_type: 'admin' | 'student';
  user_id: number;
  comment_text: string;
  is_anonymous: boolean;
  is_flagged: boolean;
  flagged_by?: number | null;
  flagged_reason?: string | null;
  flagged_at?: string | null;
  is_deleted: boolean;
  deleted_at?: string | null;
  created_at: string;
  updated_at: string;
  
  // Additional fields from joins
  author_name?: string;
  author_email?: string;
  reaction_count?: number;
  user_has_reacted?: boolean;
  replies?: Comment[];
}

export interface CreateCommentData {
  announcement_id: number;
  parent_comment_id?: number | null;
  comment_text: string;
  is_anonymous?: boolean;
}

export interface UpdateCommentData {
  comment_text?: string;
  is_anonymous?: boolean;
}

export interface CommentFilters {
  announcement_id: number;
  page?: number;
  limit?: number;
  sort_by?: 'created_at' | 'updated_at' | 'reaction_count';
  sort_order?: 'ASC' | 'DESC';
  user_type?: 'admin' | 'student';
  user_id?: number;
  is_flagged?: boolean;
  parent_comment_id?: number | null;
}

export interface CommentPagination {
  page: number;
  totalPages: number;
  total: number;
  hasNext: boolean;
  hasPrev: boolean;
}

export interface CommentResponse {
  success: boolean;
  message: string;
  data?: {
    comment: Comment;
  };
}

export interface CommentsResponse {
  success: boolean;
  message: string;
  data?: {
    data: Comment[];
    pagination: CommentPagination;
  };
}

export interface ReactionType {
  reaction_id: number;
  reaction_name: string;
  reaction_emoji: string;
  is_active: boolean;
}

export interface CommentReaction {
  reaction_log_id: number;
  comment_id: number;
  user_type: 'admin' | 'student';
  user_id: number;
  reaction_id: number;
  created_at: string;
  
  // Additional fields from joins
  reaction_name?: string;
  reaction_emoji?: string;
}

export interface CommentReactionStats {
  comment_id: number;
  total_reactions: number;
  reactions_by_type: {
    reaction_id: number;
    reaction_name: string;
    reaction_emoji: string;
    count: number;
  }[];
}

// Hook return types
export interface UseCommentsReturn {
  comments: Comment[];
  loading: boolean;
  error?: string;
  pagination: CommentPagination;
  refresh: () => Promise<void>;
  createComment: (data: CreateCommentData) => Promise<void>;
  updateComment: (id: number, data: UpdateCommentData) => Promise<void>;
  deleteComment: (id: number) => Promise<void>;
  likeComment: (id: number, reactionId?: number) => Promise<void>;
  unlikeComment: (id: number) => Promise<void>;
  flagComment: (id: number, reason: string) => Promise<void>;
}

// API Service types
export interface CommentService {
  getComments: (filters: CommentFilters) => Promise<CommentsResponse>;
  getComment: (id: number) => Promise<CommentResponse>;
  createComment: (data: CreateCommentData) => Promise<CommentResponse>;
  updateComment: (id: number, data: UpdateCommentData) => Promise<CommentResponse>;
  deleteComment: (id: number) => Promise<{ success: boolean; message: string }>;
  likeComment: (id: number, reactionId?: number) => Promise<{ success: boolean; message: string }>;
  unlikeComment: (id: number) => Promise<{ success: boolean; message: string }>;
  flagComment: (id: number, reason: string) => Promise<{ success: boolean; message: string }>;
  getCommentReactionStats: (id: number) => Promise<{
    success: boolean;
    message: string;
    data?: { stats: CommentReactionStats };
  }>;
}

// Component props types
export interface CommentItemProps {
  comment: Comment;
  onReply?: (parentId: number) => void;
  onEdit?: (comment: Comment) => void;
  onDelete?: (id: number) => void;
  onLike?: (id: number) => void;
  onUnlike?: (id: number) => void;
  onFlag?: (id: number, reason: string) => void;
  currentUserId?: number;
  currentUserType?: 'admin' | 'student';
  depth?: number;
  maxDepth?: number;
}

export interface CommentFormProps {
  announcementId: number;
  parentCommentId?: number | null;
  onSubmit: (data: CreateCommentData) => Promise<void>;
  onCancel?: () => void;
  placeholder?: string;
  loading?: boolean;
}

export interface CommentListProps {
  announcementId: number;
  allowComments?: boolean;
  currentUserId?: number;
  currentUserType?: 'admin' | 'student';
  maxDepth?: number;
}

export interface CommentModalProps {
  isOpen: boolean;
  onClose: () => void;
  comment?: Comment | null;
  onSave: (data: UpdateCommentData) => Promise<void>;
  loading?: boolean;
}
