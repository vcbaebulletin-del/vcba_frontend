import React, { useState, useEffect } from 'react';
import { useComments } from '../../hooks/useComments';
import type { Comment, CreateCommentData } from '../../services/commentService';
import { Heart, Shield, Edit3, Flag } from 'lucide-react';
import { getImageUrl } from '../../config/constants';
import ServerTimeDisplay from '../common/ServerTimeDisplay';
import {
  shouldShowReplyButton,
  calculateIndentation
} from '../../utils/commentDepth';

interface CommentSectionProps {
  announcementId?: number;
  calendarId?: number;
  allowComments?: boolean;
  currentUserId?: number;
  currentUserType?: 'admin' | 'student';
}

interface CommentItemProps {
  comment: Comment;
  onReply: (parentId: number) => void;
  onLike: (id: number) => void;
  onUnlike: (id: number) => void;
  onFlag: (id: number, reason: string) => void;
  onEdit: (id: number, newText: string) => void;
  onRefresh?: () => void;
  currentUserId?: number;
  currentUserType?: 'admin' | 'student';
  depth?: number;
}

const CommentItem: React.FC<CommentItemProps> = ({
  comment,
  onReply,
  onLike,
  onUnlike,
  onFlag,
  onEdit,
  onRefresh,
  currentUserId,
  currentUserType,
  depth = 0
}) => {
  const [showReplyForm, setShowReplyForm] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [editText, setEditText] = useState(comment.comment_text);
  const [isMobile, setIsMobile] = useState(false);
  const hasUserReacted = comment.user_reaction !== undefined && comment.user_reaction !== null;

  // Enhanced mobile detection with better breakpoint
  useEffect(() => {
    const handleResize = () => {
      setIsMobile(window.innerWidth <= 768); // Increased breakpoint for better mobile experience
    };

    handleResize();
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  // Calculate depth-related properties
  const canReply = shouldShowReplyButton(depth);
  const indentation = calculateIndentation(depth);

  const handleReactionToggle = () => {
    if (hasUserReacted) {
      onUnlike(comment.comment_id);
    } else {
      onLike(comment.comment_id);
    }
  };

  const handleReplyClick = () => {
    setShowReplyForm(true);
  };

  const handleEditClick = () => {
    setIsEditing(true);
    setEditText(comment.comment_text);
  };

  const handleEditSave = async () => {
    if (editText.trim() && editText.trim() !== comment.comment_text) {
      try {
        await onEdit(comment.comment_id, editText.trim());
        setIsEditing(false);
      } catch (error) {
        console.error('Error editing comment:', error);
      }
    } else {
      setIsEditing(false);
    }
  };

  const handleEditCancel = () => {
    setIsEditing(false);
    setEditText(comment.comment_text);
  };

  // Check if current user can edit this comment
  const canEdit = currentUserId === comment.user_id && currentUserType === comment.user_type;

  return (
    <div
      id={`comment-${comment.comment_id}`}
      style={{
        marginLeft: isMobile ? `${Math.min(indentation, 20)}px` : `${indentation}px`,
        marginBottom: isMobile ? '1rem' : '0.75rem',
        position: 'relative'
      }}>
      {/* Facebook-style comment bubble layout */}
      <div style={{ display: 'flex', alignItems: 'flex-start', gap: isMobile ? '0.75rem' : '0.5rem' }}>
        {/* Avatar */}
        <div style={{
          width: isMobile ? '2.25rem' : '2rem', // 36px mobile, 32px desktop
          height: isMobile ? '2.25rem' : '2rem',
          borderRadius: '50%',
          backgroundColor: comment.user_type === 'admin' ? '#1877f2' : '#42b883',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          color: 'white',
          fontWeight: '600',
          fontSize: isMobile ? '0.875rem' : '0.75rem',
          flexShrink: 0,
          position: 'relative',
          overflow: 'hidden',
          boxShadow: '0 1px 3px rgba(0, 0, 0, 0.12)'
        }}>
          {comment.author_picture ? (
            <img
              src={getImageUrl(comment.author_picture) || ''}
              alt={comment.author_name || 'User'}
              style={{
                width: '100%',
                height: '100%',
                objectFit: 'cover',
                borderRadius: '50%'
              }}
              onError={(e) => {
                const target = e.target as HTMLImageElement;
                target.style.display = 'none';
                const parent = target.parentElement;
                if (parent) {
                  parent.style.backgroundColor = comment.user_type === 'admin' ? '#3b82f6' : '#22c55e';
                  parent.innerHTML = `
                    ${comment.author_name ? comment.author_name.charAt(0).toUpperCase() : '?'}
                    ${comment.user_type === 'admin' ? `
                      <div style="
                        position: absolute;
                        bottom: -2px;
                        right: -2px;
                        width: 1rem;
                        height: 1rem;
                        background-color: #facc15;
                        border-radius: 50%;
                        display: flex;
                        align-items: center;
                        justify-content: center;
                        border: 2px solid white;
                      ">
                        <svg width="8" height="8" viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="2">
                          <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/>
                        </svg>
                      </div>
                    ` : ''}
                  `;
                }
              }}
            />
          ) : (
            <>
              {comment.author_name ? comment.author_name.charAt(0).toUpperCase() : '?'}
            </>
          )}
          {comment.user_type === 'admin' && (
            <div style={{
              position: 'absolute',
              bottom: '-2px',
              right: '-2px',
              width: '1rem',
              height: '1rem',
              backgroundColor: '#facc15',
              borderRadius: '50%',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              border: '2px solid white'
            }}>
              <Shield size={8} color="white" />
            </div>
          )}
        </div>

        {/* Facebook-style comment bubble container */}
        <div style={{ flex: 1, minWidth: 0 }}>
          {/* Comment bubble */}
          <div style={{
            backgroundColor: 'rgba(0, 100, 0, 0.1)', // Light transparent dark green
            borderRadius: isMobile ? '1.125rem' : '1rem', // 18px mobile, 16px desktop
            padding: isMobile ? '0.75rem 1rem' : '0.625rem 0.875rem', // 12px 16px mobile, 10px 14px desktop
            position: 'relative',
            maxWidth: 'fit-content',
            minHeight: 'auto',
            boxShadow: '0 1px 3px rgba(0, 0, 0, 0.08)', // Slightly stronger shadow
            border: '1px solid rgba(0, 100, 0, 0.2)', // Light green border for better definition
            wordWrap: 'break-word',
            wordBreak: 'break-word'
          }}>
            {/* Author name and badges */}
            <div style={{
              display: 'flex',
              alignItems: 'center',
              gap: '0.375rem',
              marginBottom: '0.25rem',
              flexWrap: 'wrap'
            }}>
              <span style={{
                fontWeight: '600',
                color: '#050505',
                fontSize: isMobile ? '0.8125rem' : '0.75rem', // 13px mobile, 12px desktop
                lineHeight: '1.3'
              }}>
                {comment.is_anonymous ? 'Anonymous' : (comment.author_name || 'Unknown User')}
              </span>

              {comment.user_type === 'admin' && (
                <span style={{
                  backgroundColor: '#1877f2',
                  color: 'white',
                  fontSize: isMobile ? '0.625rem' : '0.5625rem', // 10px mobile, 9px desktop
                  fontWeight: '500',
                  padding: '0.125rem 0.375rem',
                  borderRadius: '0.75rem',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.1875rem',
                  whiteSpace: 'nowrap'
                }}>
                  <Shield size={isMobile ? 8 : 7} />
                  Admin
                </span>
              )}
            </div>

            {/* Comment text content or edit form */}
            {isEditing ? (
              <div style={{ marginTop: '0.5rem' }}>
                <textarea
                  value={editText}
                  onChange={(e) => setEditText(e.target.value)}
                  style={{
                    width: '100%',
                    minHeight: '60px',
                    padding: '0.5rem',
                    border: '1px solid #d1d5db',
                    borderRadius: '0.375rem',
                    fontSize: isMobile ? '0.875rem' : '0.8125rem',
                    fontFamily: 'inherit',
                    resize: 'vertical'
                  }}
                />
                <div style={{
                  display: 'flex',
                  gap: '0.5rem',
                  marginTop: '0.5rem'
                }}>
                  <button
                    onClick={handleEditSave}
                    style={{
                      padding: '0.25rem 0.75rem',
                      backgroundColor: '#22c55e',
                      color: 'white',
                      border: 'none',
                      borderRadius: '0.375rem',
                      fontSize: '0.75rem',
                      fontWeight: '500',
                      cursor: 'pointer'
                    }}
                  >
                    Save
                  </button>
                  <button
                    onClick={handleEditCancel}
                    style={{
                      padding: '0.25rem 0.75rem',
                      backgroundColor: '#6b7280',
                      color: 'white',
                      border: 'none',
                      borderRadius: '0.375rem',
                      fontSize: '0.75rem',
                      fontWeight: '500',
                      cursor: 'pointer'
                    }}
                  >
                    Cancel
                  </button>
                </div>
              </div>
            ) : (
              <div style={{
                color: '#050505',
                fontSize: isMobile ? '0.875rem' : '0.8125rem', // 14px mobile, 13px desktop
                lineHeight: '1.4',
                wordBreak: 'break-word',
                whiteSpace: 'pre-wrap'
              }}>
                {comment.comment_text}
              </div>
            )}
          </div>

          {/* Timestamp and actions outside bubble */}
          <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: '0.75rem',
            marginTop: '0.25rem',
            marginLeft: '0.5rem'
          }}>
            <ServerTimeDisplay
              timestamp={comment.created_at}
              style={{
                color: '#65676b',
                fontSize: isMobile ? '0.75rem' : '0.6875rem', // 12px mobile, 11px desktop
                fontWeight: '400'
              }}
            />

            {/* Like action */}
            <button
              onClick={handleReactionToggle}
              style={{
                background: 'none',
                border: 'none',
                color: hasUserReacted ? '#ef4444' : '#65676b',
                cursor: 'pointer',
                padding: '0.25rem 0.5rem',
                borderRadius: '0.375rem',
                fontSize: 'inherit',
                fontWeight: '600',
                transition: 'color 0.2s ease',
                display: 'flex',
                alignItems: 'center',
                gap: '0.25rem'
              }}
              onMouseEnter={(e) => {
                if (!isMobile) {
                  e.currentTarget.style.backgroundColor = '#f0f2f5';
                }
              }}
              onMouseLeave={(e) => {
                if (!isMobile) {
                  e.currentTarget.style.backgroundColor = 'transparent';
                }
              }}
            >
              <Heart
                size={isMobile ? 14 : 12}
                fill={hasUserReacted ? '#ef4444' : 'none'}
              />
              {comment.reaction_count > 0 && <span>{comment.reaction_count}</span>}
            </button>

            {/* Reply action */}
            {canReply && !isEditing && (
              <button
                onClick={handleReplyClick}
                style={{
                  background: 'none',
                  border: 'none',
                  color: '#65676b',
                  cursor: 'pointer',
                  padding: '0.25rem 0.5rem',
                  borderRadius: '0.375rem',
                  fontSize: 'inherit',
                  fontWeight: '600',
                  transition: 'color 0.2s ease'
                }}
                onMouseEnter={(e) => {
                  if (!isMobile) {
                    e.currentTarget.style.backgroundColor = '#f0f2f5';
                  }
                }}
                onMouseLeave={(e) => {
                  if (!isMobile) {
                    e.currentTarget.style.backgroundColor = 'transparent';
                  }
                }}
              >
                Reply
              </button>
            )}

            {/* Edit action - Commented out per professor's request: students cannot edit their comments */}
            {/* {canEdit && !isEditing && (
              <button
                onClick={handleEditClick}
                style={{
                  background: 'none',
                  border: 'none',
                  color: '#65676b',
                  cursor: 'pointer',
                  padding: '0.25rem 0.5rem',
                  borderRadius: '0.375rem',
                  fontSize: 'inherit',
                  fontWeight: '600',
                  transition: 'color 0.2s ease',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.25rem'
                }}
                onMouseEnter={(e) => {
                  if (!isMobile) {
                    e.currentTarget.style.backgroundColor = '#f0f2f5';
                    e.currentTarget.style.color = '#22c55e';
                  }
                }}
                onMouseLeave={(e) => {
                  if (!isMobile) {
                    e.currentTarget.style.backgroundColor = 'transparent';
                    e.currentTarget.style.color = '#65676b';
                  }
                }}
              >
                <Edit3 size={isMobile ? 12 : 10} />
                Edit
              </button>
            )} */}
          </div>
        </div>
      </div>

      {/* Reply Form */}
      {showReplyForm && (
        <div style={{ marginTop: '0.75rem', marginLeft: isMobile ? '2.25rem' : '2rem' }}>
          <CommentForm
            announcementId={comment.announcement_id}
            calendarId={comment.calendar_id}
            parentCommentId={comment.comment_id}
            onSubmit={() => {
              if (onRefresh) {
                onRefresh();
              }
            }}
            onCancel={() => setShowReplyForm(false)}
            placeholder="Write a reply..."
          />
        </div>
      )}

      {/* Replies */}
      {comment.replies && comment.replies.length > 0 && (
        <div style={{ marginTop: '0.75rem' }}>
          {comment.replies.map((reply) => (
            <CommentItem
              key={reply.comment_id}
              comment={reply}
              onReply={onReply}
              onLike={onLike}
              onUnlike={onUnlike}
              onFlag={onFlag}
              onEdit={onEdit}
              onRefresh={onRefresh}
              currentUserId={currentUserId}
              currentUserType={currentUserType}
              depth={depth + 1}
            />
          ))}
        </div>
      )}
    </div>
  );
};

interface CommentFormProps {
  announcementId?: number;
  calendarId?: number;
  parentCommentId?: number;
  onSubmit: () => void;
  onCancel?: () => void;
  placeholder?: string;
}

const CommentForm: React.FC<CommentFormProps> = ({
  announcementId,
  calendarId,
  parentCommentId,
  onSubmit,
  onCancel,
  placeholder = "Write a comment..."
}) => {
  const [commentText, setCommentText] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isMobile, setIsMobile] = useState(false);
  const { createComment } = useComments(announcementId, calendarId, 'student'); // Student service

  // Mobile detection
  useEffect(() => {
    const handleResize = () => {
      setIsMobile(window.innerWidth <= 600);
    };

    handleResize();
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!commentText.trim()) return;

    try {
      setIsSubmitting(true);
      
      const commentData: CreateCommentData = {
        announcement_id: announcementId,
        calendar_id: calendarId,
        comment_text: commentText.trim(),
        is_anonymous: false // Students cannot post anonymously
      };

      if (parentCommentId) {
        commentData.parent_comment_id = parentCommentId;
      }

      await createComment(commentData);
      setCommentText('');
      onSubmit();
    } catch (error) {
      console.error('Error creating comment:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} style={{
      padding: isMobile ? '0.75rem' : '1rem', // 12px mobile, 16px desktop
      backgroundColor: '#f9fafb',
      borderRadius: isMobile ? '0.5rem' : '0.5rem', // 8px consistent
      border: '1px solid #e5e7eb'
    }}>
      <textarea
        value={commentText}
        onChange={(e) => setCommentText(e.target.value)}
        placeholder={placeholder}
        rows={isMobile ? 3 : 3}
        style={{
          width: '100%',
          padding: isMobile ? '0.75rem' : '0.75rem',
          border: '1px solid #d1d5db',
          borderRadius: '0.375rem', // 6px
          fontSize: isMobile ? '1rem' : '0.875rem', // 16px mobile (prevents zoom), 14px desktop
          outline: 'none',
          resize: 'vertical',
          marginBottom: '0.75rem',
          lineHeight: '1.6',
          fontFamily: 'inherit'
        }}
        onFocus={(e) => {
          e.currentTarget.style.borderColor = '#22c55e';
          e.currentTarget.style.boxShadow = '0 0 0 3px rgba(34, 197, 94, 0.1)';
        }}
        onBlur={(e) => {
          e.currentTarget.style.borderColor = '#d1d5db';
          e.currentTarget.style.boxShadow = 'none';
        }}
      />
      
      <div style={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: isMobile ? 'flex-start' : 'center',
        flexDirection: isMobile ? 'column' : 'row',
        gap: isMobile ? '0.75rem' : '0'
      }}>

        {/* student must not able to comment annonymous */}
        {/* <label style={{
          display: 'flex',
          alignItems: 'center',
          fontSize: isMobile ? '0.875rem' : '0.75rem', // 14px mobile, 12px desktop
          color: '#6b7280',
          cursor: 'pointer',
          lineHeight: '1.5'
        }}>
          <input
            type="checkbox"
            checked={isAnonymous}
            onChange={(e) => setIsAnonymous(e.target.checked)}
            style={{
              marginRight: '0.5rem',
              transform: isMobile ? 'scale(1.2)' : 'scale(1)' // Larger checkbox on mobile
            }}
          />
          Post anonymously
        </label> */}

        <div style={{
          display: 'flex',
          gap: '0.5rem',
          width: isMobile ? '100%' : 'auto'
        }}>
          {onCancel && (
            <button
              type="button"
              onClick={onCancel}
              style={{
                padding: isMobile ? '0.75rem 1rem' : '0.5rem 1rem',
                backgroundColor: '#f3f4f6',
                color: '#374151',
                border: 'none',
                borderRadius: '0.375rem', // 6px
                cursor: 'pointer',
                fontSize: isMobile ? '0.875rem' : '0.75rem', // 14px mobile, 12px desktop
                fontWeight: '500',
                minHeight: isMobile ? '2.75rem' : 'auto', // 44px touch target
                flex: isMobile ? '1' : 'none'
              }}
            >
              Cancel
            </button>
          )}
          <button
            type="submit"
            disabled={!commentText.trim() || isSubmitting}
            style={{
              padding: isMobile ? '0.75rem 1rem' : '0.5rem 1rem',
              background: (!commentText.trim() || isSubmitting) ? '#9ca3af' : 'linear-gradient(135deg, #22c55e 0%, #facc15 100%)',
              color: 'white',
              border: 'none',
              borderRadius: '0.375rem', // 6px
              cursor: (!commentText.trim() || isSubmitting) ? 'not-allowed' : 'pointer',
              fontSize: isMobile ? '0.875rem' : '0.75rem', // 14px mobile, 12px desktop
              fontWeight: '600',
              minHeight: isMobile ? '2.75rem' : 'auto', // 44px touch target
              flex: isMobile ? '2' : 'none' // Larger submit button on mobile
            }}
          >
            {isSubmitting ? 'Posting...' : 'Post'}
          </button>
        </div>
      </div>
    </form>
  );
};

const CommentSection: React.FC<CommentSectionProps> = ({
  announcementId,
  calendarId,
  allowComments = true,
  currentUserId,
  currentUserType = 'student'
}) => {
  // Ensure either announcementId or calendarId is provided, but not both
  if (!announcementId && !calendarId) {
    throw new Error('Either announcementId or calendarId must be provided');
  }
  if (announcementId && calendarId) {
    throw new Error('Cannot provide both announcementId and calendarId');
  }

  const {
    comments,
    loading,
    error,
    refresh,
    likeComment,
    unlikeComment,
    flagComment,
    updateComment
  } = useComments(announcementId, calendarId, 'student'); // Pass both IDs to hook

  const handleReply = (parentId: number) => {
    // This could trigger a scroll to the reply form or other UI feedback
    console.log('Reply to comment:', parentId);
  };

  const handleFlag = async (commentId: number, reason: string) => {
    try {
      await flagComment(commentId, reason);
      await refresh();
    } catch (error) {
      console.error('Error flagging comment:', error);
    }
  };

  const handleEdit = async (commentId: number, newText: string) => {
    try {
      await updateComment(commentId, { comment_text: newText });
      await refresh();
    } catch (error) {
      console.error('Error editing comment:', error);
    }
  };

  if (!allowComments) {
    return (
      <div style={{
        padding: '1rem',
        textAlign: 'center',
        color: '#6b7280',
        fontSize: '0.875rem',
        fontStyle: 'italic'
      }}>
        Comments are disabled for this announcement.
      </div>
    );
  }

  return (
    <div style={{ marginTop: '1.5rem' }}>
      <h3 style={{
        fontSize: '1.125rem',
        fontWeight: '600',
        color: '#374151',
        marginBottom: '1rem'
      }}>
        Comments ({comments.length})
      </h3>

      {error && (
        <div style={{
          padding: '0.75rem',
          backgroundColor: '#fef2f2',
          border: '1px solid #fecaca',
          color: '#dc2626',
          borderRadius: '6px',
          marginBottom: '1rem',
          fontSize: '0.875rem'
        }}>
          {error}
        </div>
      )}

      {/* Comment Form */}
      <div style={{ marginBottom: '1.5rem' }}>
        <CommentForm
          announcementId={announcementId}
          calendarId={calendarId}
          onSubmit={refresh}
          placeholder="Share your thoughts..."
        />
      </div>

      {/* Comments List */}
      {loading ? (
        <div style={{
          display: 'flex',
          justifyContent: 'center',
          padding: '2rem'
        }}>
          <div style={{
            width: '1.5rem',
            height: '1.5rem',
            border: '2px solid #e5e7eb',
            borderTop: '2px solid #22c55e',
            borderRadius: '50%',
            animation: 'spin 1s linear infinite'
          }}></div>
        </div>
      ) : comments.length === 0 ? (
        <div style={{
          textAlign: 'center',
          padding: '2rem',
          color: '#6b7280',
          fontSize: '0.875rem'
        }}>
          No comments yet. Be the first to share your thoughts!
        </div>
      ) : (
        <div>
          {comments.map((comment) => (
            <CommentItem
              key={comment.comment_id}
              comment={comment}
              onReply={handleReply}
              onLike={likeComment}
              onUnlike={unlikeComment}
              onFlag={handleFlag}
              onEdit={handleEdit}
              onRefresh={refresh}
              currentUserId={currentUserId}
              currentUserType={currentUserType}
            />
          ))}
        </div>
      )}
    </div>
  );
};

export default CommentSection;
