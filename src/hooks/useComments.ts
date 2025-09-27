import { useState, useEffect, useCallback, useRef } from 'react';
import { commentService } from '../services';
import {
  adminCommentServiceWithToken,
  studentCommentServiceWithToken
} from '../services/commentService';
import { useWebSocket } from './useWebSocket';
import { ADMIN_AUTH_TOKEN_KEY, STUDENT_AUTH_TOKEN_KEY } from '../config/constants';
import { timeService } from '../services/timeService';
import type {
  Comment,
  CreateCommentData,
  UpdateCommentData,
  CommentFilters,
  PaginatedCommentsResponse
} from '../services/commentService';

// Hook return type
export interface UseCommentsReturn {
  comments: Comment[];
  loading: boolean;
  error?: string;
  pagination: {
    page: number;
    totalPages: number;
    total: number;
    hasNext: boolean;
    hasPrev: boolean;
  };
  refresh: () => Promise<void>;
  createComment: (data: CreateCommentData) => Promise<void>;
  createReply: (parentCommentId: number, data: Omit<CreateCommentData, 'parent_comment_id'>) => Promise<void>;
  updateComment: (id: number, data: UpdateCommentData) => Promise<void>;
  deleteComment: (id: number) => Promise<void>;
  likeComment: (id: number, reactionId?: number) => Promise<void>;
  unlikeComment: (id: number) => Promise<void>;
  flagComment: (id: number, reason: string) => Promise<void>;
}

// Hook for managing comments
export const useComments = (
  announcementId?: number,
  calendarId?: number,
  currentUserType?: 'admin' | 'student'
): UseCommentsReturn => {
  // Ensure either announcementId or calendarId is provided, but not both
  if (!announcementId && !calendarId) {
    throw new Error('Either announcementId or calendarId must be provided');
  }
  if (announcementId && calendarId) {
    throw new Error('Cannot provide both announcementId and calendarId');
  }
  // Determine the appropriate service based on current user context
  const getService = useCallback(() => {
    // If user type is explicitly provided, use that
    if (currentUserType === 'admin') {
      console.log('🎯 useComments - Using admin service (explicit)');
      return adminCommentServiceWithToken;
    }
    if (currentUserType === 'student') {
      console.log('🎯 useComments - Using student service (explicit)');
      return studentCommentServiceWithToken;
    }

    // Auto-detect based on current page context and available tokens
    const currentPath = window.location.pathname;
    const isAdminPage = currentPath.includes('/admin');
    const isStudentPage = currentPath.includes('/student');

    const adminToken = localStorage.getItem(ADMIN_AUTH_TOKEN_KEY);
    const studentToken = localStorage.getItem(STUDENT_AUTH_TOKEN_KEY);

    if (isAdminPage && adminToken) {
      console.log('🎯 useComments - Using admin service (admin page context)');
      return adminCommentServiceWithToken;
    }

    if (isStudentPage && studentToken) {
      console.log('🎯 useComments - Using student service (student page context)');
      return studentCommentServiceWithToken;
    }

    // Fallback: prioritize student service if student token exists
    if (studentToken) {
      console.log('🎯 useComments - Using student service (fallback)');
      return studentCommentServiceWithToken;
    }

    // Last resort: use admin service
    console.log('🎯 useComments - Using admin service (fallback)');
    return adminCommentServiceWithToken;
  }, [currentUserType]);

  const service = getService();
  const [comments, setComments] = useState<Comment[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | undefined>();
  const [pagination, setPagination] = useState({
    page: 1,
    totalPages: 0,
    total: 0,
    hasNext: false,
    hasPrev: false
  });

  // WebSocket for real-time updates
  const { isConnected, on, off } = useWebSocket();

  // Track current user context to detect changes
  const currentUserContextRef = useRef<string>('');

  // Function to get current user context identifier
  const getCurrentUserContext = useCallback(() => {
    const adminToken = localStorage.getItem(ADMIN_AUTH_TOKEN_KEY);
    const studentToken = localStorage.getItem(STUDENT_AUTH_TOKEN_KEY);

    // Create a unique identifier for the current user context
    if (adminToken) {
      return `admin:${adminToken.substring(0, 10)}`;
    } else if (studentToken) {
      return `student:${studentToken.substring(0, 10)}`;
    }
    return 'anonymous';
  }, []);

  // Function to clear cache when user context changes
  const clearCacheIfUserChanged = useCallback(() => {
    const currentContext = getCurrentUserContext();
    if (currentUserContextRef.current && currentUserContextRef.current !== currentContext) {
      console.log('🔄 User context changed, clearing comment cache', {
        previous: currentUserContextRef.current,
        current: currentContext,
        announcementId
      });
      setComments([]);
      setPagination({
        page: 1,
        totalPages: 0,
        total: 0,
        hasNext: false,
        hasPrev: false
      });
    }
    currentUserContextRef.current = currentContext;
  }, [getCurrentUserContext, announcementId, calendarId]);

  const fetchComments = useCallback(async () => {
    if (!announcementId && !calendarId) return;

    try {
      // Clear cache if user context changed
      clearCacheIfUserChanged();

      setLoading(true);
      setError(undefined);

      let response;
      if (announcementId) {
        response = await service.getCommentsByAnnouncement(announcementId, {
          page: 1,
          limit: 50,
          sort_by: 'created_at',
          sort_order: 'ASC'
        });
      } else if (calendarId) {
        response = await service.getCommentsByCalendar(calendarId, {
          page: 1,
          limit: 50,
          sort_by: 'created_at',
          sort_order: 'ASC'
        });
      } else {
        // This should never happen due to validation above, but handle it gracefully
        setError('No valid ID provided for fetching comments');
        return;
      }

      if (response && response.success && response.data) {
        setComments(response.data.comments || []);
        setPagination(response.data.pagination);
      } else {
        setError(response?.message || 'Failed to fetch comments');
      }
    } catch (err: any) {
      setError(err.message || 'An error occurred while fetching comments');
    } finally {
      setLoading(false);
    }
  }, [announcementId, calendarId, clearCacheIfUserChanged, service]);

  const refresh = useCallback(async () => {
    await fetchComments();
  }, [fetchComments]);

  const createComment = useCallback(async (data: CreateCommentData) => {
    try {
      setLoading(true);
      setError(undefined);

      console.log('💬 Creating comment with optimistic update:', data);
      console.log('🔍 useComments - Anonymous flag details:', {
        is_anonymous: data.is_anonymous,
        is_anonymous_type: typeof data.is_anonymous,
        is_anonymous_value: data.is_anonymous,
        boolean_check: data.is_anonymous === true,
        string_conversion: String(data.is_anonymous)
      });

      // Create optimistic comment for immediate UI feedback
      // Use server time to prevent client-side time manipulation
      const serverTime = await timeService.getCurrentTime();
      const optimisticComment: Comment & { is_pending?: boolean } = {
        comment_id: serverTime.unix, // Use server timestamp as temporary ID
        comment_text: data.comment_text,
        announcement_id: data.announcement_id,
        calendar_id: data.calendar_id,
        parent_comment_id: data.parent_comment_id,
        user_id: 0, // Will be set by server
        user_type: currentUserType || 'student',
        author_name: 'You',
        author_picture: undefined,
        is_anonymous: data.is_anonymous || false,
        is_flagged: false,
        is_deleted: false,
        created_at: serverTime.timestamp,
        updated_at: serverTime.timestamp,
        reaction_count: 0,
        user_reaction: undefined,
        replies: [],
        is_pending: true // Mark as pending
      };

      // Add optimistic comment to local state
      if (data.parent_comment_id) {
        // This is a reply - add to parent's replies
        setComments(prevComments =>
          prevComments.map(comment => {
            if (comment.comment_id === data.parent_comment_id) {
              return {
                ...comment,
                replies: [...(comment.replies || []), optimisticComment]
              };
            }
            return comment;
          })
        );
      } else {
        // This is a top-level comment
        setComments(prevComments => [optimisticComment, ...prevComments]);
      }

      const response = await service.createComment(data);

      if (response.success) {
        console.log('💬 Comment created successfully, refreshing to get server data');
        // Refresh comments to replace optimistic comment with server data
        await fetchComments();
      } else {
        throw new Error(response.message || 'Failed to create comment');
      }
    } catch (err: any) {
      console.error('💬 Error creating comment, removing optimistic update:', err);
      setError(err.message || 'An error occurred while creating comment');

      // Remove optimistic comment on error
      if (data.parent_comment_id) {
        setComments(prevComments =>
          prevComments.map(comment => {
            if (comment.comment_id === data.parent_comment_id) {
              return {
                ...comment,
                replies: (comment.replies || []).filter(reply => !(reply as any).is_pending)
              };
            }
            return comment;
          })
        );
      } else {
        setComments(prevComments => prevComments.filter(comment => !(comment as any).is_pending));
      }

      throw err;
    } finally {
      setLoading(false);
    }
  }, [fetchComments, service, currentUserType]);

  const createReply = useCallback(async (parentCommentId: number, data: Omit<CreateCommentData, 'parent_comment_id'>) => {
    try {
      setLoading(true);
      setError(undefined);

      const response = await service.createReply(parentCommentId, data);

      if (response.success) {
        // Refresh the list to get the new reply
        await fetchComments();
      } else {
        throw new Error(response.message || 'Failed to create reply');
      }
    } catch (err: any) {
      setError(err.message || 'An error occurred while creating reply');
      throw err;
    } finally {
      setLoading(false);
    }
  }, [fetchComments, service]);

  const updateComment = useCallback(async (id: number, data: UpdateCommentData) => {
    try {
      setLoading(true);
      setError(undefined);
      
      const response = await service.updateComment(id, data);
      
      if (response.success && response.data) {
        // Update the comment in the local state
        setComments(prev =>
          prev.map(comment =>
            comment.comment_id === id
              ? { ...comment, ...response.data?.comment }
              : comment
          )
        );
      } else {
        throw new Error(response.message || 'Failed to update comment');
      }
    } catch (err: any) {
      setError(err.message || 'An error occurred while updating comment');
      throw err;
    } finally {
      setLoading(false);
    }
  }, [service]);

  const deleteComment = useCallback(async (id: number) => {
    try {
      setLoading(true);
      setError(undefined);
      
      const response = await service.deleteComment(id);
      
      if (response.success) {
        // Remove the comment from local state
        setComments(prev => 
          prev.filter(comment => comment.comment_id !== id)
        );
      } else {
        throw new Error(response.message || 'Failed to delete comment');
      }
    } catch (err: any) {
      setError(err.message || 'An error occurred while deleting comment');
      throw err;
    } finally {
      setLoading(false);
    }
  }, [service]);

  const likeComment = useCallback(async (id: number, reactionId: number = 1) => {
    // Store original state for rollback
    const originalComments = comments;

    try {
      setError(undefined);

      console.log('💬 Liking comment with optimistic update:', id);

      // Optimistic update - update UI immediately
      setComments(prev =>
        prev.map(comment => {
          if (comment.comment_id === id) {
            // Only increment count if user hasn't reacted before
            const newCount = comment.user_reaction
              ? comment.reaction_count || 0  // Already reacted, don't change count
              : (comment.reaction_count || 0) + 1;  // New reaction, increment count

            return {
              ...comment,
              reaction_count: newCount,
              user_reaction: { reaction_id: reactionId, reaction_name: 'like', reaction_emoji: '❤️' }
            };
          }
          // Also check replies
          if (comment.replies) {
            return {
              ...comment,
              replies: comment.replies.map(reply => {
                if (reply.comment_id === id) {
                  const newCount = reply.user_reaction
                    ? reply.reaction_count || 0
                    : (reply.reaction_count || 0) + 1;
                  return {
                    ...reply,
                    reaction_count: newCount,
                    user_reaction: { reaction_id: reactionId, reaction_name: 'like', reaction_emoji: '❤️' }
                  };
                }
                return reply;
              })
            };
          }
          return comment;
        })
      );

      const response = await service.addReaction(id, reactionId);

      if (response.success) {
        console.log('💬 Comment liked successfully');
        // The optimistic update should already be correct
      } else {
        throw new Error(response.message || 'Failed to like comment');
      }
    } catch (err: any) {
      console.error('💬 Error liking comment, rolling back:', err);
      setError(err.message || 'An error occurred while liking comment');

      // Rollback optimistic update
      setComments(originalComments);
      throw err;
    }
  }, [service, comments]);

  const unlikeComment = useCallback(async (id: number) => {
    // Store original state for rollback
    const originalComments = comments;

    try {
      setError(undefined);

      console.log('💬 Unliking comment with optimistic update:', id);

      // Optimistic update - update UI immediately
      setComments(prev =>
        prev.map(comment => {
          if (comment.comment_id === id) {
            // Only decrement count if user had reacted before
            const newCount = comment.user_reaction
              ? Math.max((comment.reaction_count || 0) - 1, 0)  // Had reaction, decrement count
              : comment.reaction_count || 0;  // No reaction, don't change count

            return {
              ...comment,
              reaction_count: newCount,
              user_reaction: undefined
            };
          }
          // Also check replies
          if (comment.replies) {
            return {
              ...comment,
              replies: comment.replies.map(reply => {
                if (reply.comment_id === id) {
                  const newCount = reply.user_reaction
                    ? Math.max((reply.reaction_count || 0) - 1, 0)
                    : reply.reaction_count || 0;
                  return {
                    ...reply,
                    reaction_count: newCount,
                    user_reaction: undefined
                  };
                }
                return reply;
              })
            };
          }
          return comment;
        })
      );

      const response = await service.removeReaction(id);

      if (response.success) {
        console.log('💬 Comment unliked successfully');
        // The optimistic update should already be correct
      } else {
        throw new Error(response.message || 'Failed to unlike comment');
      }
    } catch (err: any) {
      console.error('💬 Error unliking comment, rolling back:', err);
      setError(err.message || 'An error occurred while unliking comment');

      // Rollback optimistic update
      setComments(originalComments);
      throw err;
    }
  }, [service, comments]);

  const flagComment = useCallback(async (id: number, reason: string) => {
    try {
      setError(undefined);
      
      const response = await service.flagComment(id, reason);
      
      if (response.success) {
        // Update the comment flag status in local state
        setComments(prev =>
          prev.map(comment =>
            comment.comment_id === id
              ? { ...comment, is_flagged: true }
              : comment
          )
        );
      } else {
        throw new Error(response.message || 'Failed to flag comment');
      }
    } catch (err: any) {
      setError(err.message || 'An error occurred while flagging comment');
      throw err;
    }
  }, [service]);

  // Real-time WebSocket event listeners for comments
  useEffect(() => {
    if (!isConnected) return;

    console.log('🔌 Setting up WebSocket listeners for comments:', { announcementId, calendarId });

    // Listen for new comments
    const handleNewComment = (data: any) => {
      console.log('💬 Real-time new comment:', data);

      // Check if this comment belongs to our announcement/calendar
      const isRelevantComment =
        (announcementId && data.announcementId === announcementId) ||
        (calendarId && data.calendarId === calendarId);

      if (isRelevantComment) {
        console.log('💬 Adding new comment to local state');
        // Refresh comments to get the new comment with proper structure
        fetchComments();
      }
    };

    // Listen for comment updates
    const handleCommentUpdate = (data: any) => {
      console.log('💬 Real-time comment update:', data);

      // Update the specific comment in local state
      setComments(prevComments =>
        prevComments.map(comment => {
          if (comment.comment_id === data.commentId) {
            return { ...comment, ...data.updates };
          }
          // Also check replies
          if (comment.replies) {
            return {
              ...comment,
              replies: comment.replies.map(reply =>
                reply.comment_id === data.commentId
                  ? { ...reply, ...data.updates }
                  : reply
              )
            };
          }
          return comment;
        })
      );
    };

    // Listen for comment deletions
    const handleCommentDelete = (data: any) => {
      console.log('💬 Real-time comment deletion:', data);

      // Remove the comment from local state
      setComments(prevComments =>
        prevComments.filter(comment => {
          if (comment.comment_id === data.commentId) {
            return false;
          }
          // Also filter replies
          if (comment.replies) {
            comment.replies = comment.replies.filter(reply =>
              reply.comment_id !== data.commentId
            );
          }
          return true;
        })
      );
    };

    // Listen for comment reactions
    const handleCommentReaction = (data: any) => {
      console.log('💬 Real-time comment reaction:', data);

      // Update comment reaction in local state
      setComments(prevComments =>
        prevComments.map(comment => {
          if (comment.comment_id === data.commentId) {
            const countChange = data.action === 'added' ? 1 : -1;
            return {
              ...comment,
              reaction_count: Math.max(0, (comment.reaction_count || 0) + countChange),
              // Update user_reaction if it's the current user
              ...(data.isCurrentUser && {
                user_reaction: data.action === 'added'
                  ? { reaction_id: data.reactionId, reaction_name: 'like', reaction_emoji: '❤️' }
                  : undefined
              })
            };
          }
          // Also check replies
          if (comment.replies) {
            return {
              ...comment,
              replies: comment.replies.map(reply => {
                if (reply.comment_id === data.commentId) {
                  const countChange = data.action === 'added' ? 1 : -1;
                  return {
                    ...reply,
                    reaction_count: Math.max(0, (reply.reaction_count || 0) + countChange),
                    ...(data.isCurrentUser && {
                      user_reaction: data.action === 'added'
                        ? { reaction_id: data.reactionId, reaction_name: 'like', reaction_emoji: '❤️' }
                        : undefined
                    })
                  };
                }
                return reply;
              })
            };
          }
          return comment;
        })
      );
    };

    // Register event listeners
    on('comment-added', handleNewComment);
    on('comment-updated', handleCommentUpdate);
    on('comment-deleted', handleCommentDelete);
    on('comment-reaction-updated', handleCommentReaction);

    // Cleanup listeners
    return () => {
      console.log('🔌 Cleaning up WebSocket listeners for comments');
      off('comment-added', handleNewComment);
      off('comment-updated', handleCommentUpdate);
      off('comment-deleted', handleCommentDelete);
      off('comment-reaction-updated', handleCommentReaction);
    };
  }, [isConnected, on, off, announcementId, calendarId, fetchComments]);

  useEffect(() => {
    fetchComments();
  }, [fetchComments]);

  return {
    comments,
    loading,
    error,
    pagination,
    refresh,
    createComment,
    createReply,
    updateComment,
    deleteComment,
    likeComment,
    unlikeComment,
    flagComment
  };
};

// Utility functions for comment operations
export const formatCommentDate = async (dateString: string): Promise<string> => {
  try {
    // Use server time to prevent client-side time manipulation
    return await timeService.getRelativeTime(dateString);
  } catch (error) {
    console.error('Failed to format comment date with server time:', error);
    // Fallback to basic date formatting without relative time
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  }
};

// Synchronous version for backward compatibility (deprecated - use async version)
export const formatCommentDateSync = (dateString: string): string => {
  console.warn('formatCommentDateSync is deprecated. Use formatCommentDate (async) instead.');
  const date = new Date(dateString);
  return date.toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric'
  });
};

export const getCommentDepth = (comment: Comment, allComments: Comment[]): number => {
  let depth = 0;
  let currentComment = comment;
  
  while (currentComment.parent_comment_id) {
    depth++;
    const parentComment = allComments.find(c => c.comment_id === currentComment.parent_comment_id);
    if (!parentComment) break;
    currentComment = parentComment;
  }
  
  return depth;
};

export const buildCommentTree = (comments: Comment[]): Comment[] => {
  const commentMap = new Map<number, Comment & { replies: Comment[] }>();
  const rootComments: (Comment & { replies: Comment[] })[] = [];

  // Initialize all comments with empty replies array
  comments.forEach(comment => {
    commentMap.set(comment.comment_id, { ...comment, replies: [] });
  });

  // Build the tree structure
  comments.forEach(comment => {
    const commentWithReplies = commentMap.get(comment.comment_id)!;
    
    if (comment.parent_comment_id) {
      const parent = commentMap.get(comment.parent_comment_id);
      if (parent) {
        parent.replies.push(commentWithReplies);
      }
    } else {
      rootComments.push(commentWithReplies);
    }
  });

  return rootComments;
};
