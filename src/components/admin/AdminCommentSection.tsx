import React, { useState, useEffect } from 'react';
import { useComments } from '../../hooks/useComments';
import type { Comment, CreateCommentData } from '../../services/commentService';
import { Heart, MessageCircle, Shield, Trash2, Flag, AlertCircle, ArrowRight, Edit3 } from 'lucide-react';
import { getImageUrl } from '../../config/constants';
import ServerTimeDisplay from '../common/ServerTimeDisplay';
import {
  shouldShowReplyButton,
  calculateIndentation
} from '../../utils/commentDepth';

interface AdminCommentSectionProps {
  announcementId?: number;
  calendarId?: number;
  allowComments?: boolean;
  currentUserId?: number;
  currentUserType?: 'admin' | 'student';
}

interface AdminCommentItemProps {
  comment: Comment;
  onReply: (parentId: number) => void;
  onLike: (id: number) => void;
  onUnlike: (id: number) => void;
  onDelete: (id: number) => void;
  onFlag: (id: number, reason: string) => void;
  onEdit: (id: number, newText: string) => void;
  onRefresh?: () => void;
  currentUserId?: number;
  currentUserType?: 'admin' | 'student';
  depth?: number;
}

const AdminCommentItem: React.FC<AdminCommentItemProps> = ({
  comment,
  onReply,
  onLike,
  onUnlike,
  onDelete,
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
  const [showFlagDialog, setShowFlagDialog] = useState(false);
  const [flagReason, setFlagReason] = useState('');
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

  const handleDelete = () => {
    if (window.confirm('Are you sure you want to delete this comment? This action cannot be undone.')) {
      onDelete(comment.comment_id);
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

  const handleFlagClick = () => {
    setShowFlagDialog(true);
  };

  const handleFlagSubmit = async () => {
    if (flagReason.trim()) {
      try {
        await onFlag(comment.comment_id, flagReason.trim());
        setShowFlagDialog(false);
        setFlagReason('');
      } catch (error) {
        console.error('Error flagging comment:', error);
      }
    }
  };

  const handleFlagCancel = () => {
    setShowFlagDialog(false);
    setFlagReason('');
  };

  // Check if current user can edit this comment
  const canEdit = currentUserId === comment.user_id && currentUserType === comment.user_type;

  // Check if current user can flag this comment (admin can flag student comments)
  const canFlag = currentUserType === 'admin' && comment.user_type === 'student' && !comment.is_flagged;

  return (
    <div
      id={`comment-${comment.comment_id}`}
      style={{
        marginLeft: isMobile ? `${Math.min(indentation, 20)}px` : `${indentation}px`,
        marginBottom: isMobile ? '1rem' : '0.75rem',
        position: 'relative'
      }}
    >
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
                {comment.is_anonymous ? 'Anonymous Admin' : (comment.author_name || 'Anonymous')}
              </span>

              {comment.user_type === 'admin' && !comment.is_anonymous && (
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

                            {comment.is_flagged ? (
                <span style={{
                  backgroundColor: '#e74c3c',
                  color: 'white',
                  fontSize: isMobile ? '0.625rem' : '0.5625rem',
                  fontWeight: '500',
                  padding: '0.125rem 0.375rem',
                  borderRadius: '0.75rem',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.1875rem',
                  whiteSpace: 'nowrap'
                }}>
                  <Flag size={isMobile ? 8 : 7} />
                  Flagged
                </span>
              ) : null}
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

            {/* Edit action */}
            {canEdit && !isEditing && (
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
                    e.currentTarget.style.color = '#3b82f6';
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
            )}

            {/* Flag action (admin can flag student comments) */}
            {canFlag && !isEditing && (
              <button
                onClick={handleFlagClick}
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
                    e.currentTarget.style.color = '#f59e0b';
                  }
                }}
                onMouseLeave={(e) => {
                  if (!isMobile) {
                    e.currentTarget.style.backgroundColor = 'transparent';
                    e.currentTarget.style.color = '#65676b';
                  }
                }}
              >
                <Flag size={isMobile ? 12 : 10} />
                Flag
              </button>
            )}

            {/* Admin delete action */}
            {currentUserType === 'admin' && !isEditing && (
              <button
                onClick={handleDelete}
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
                    e.currentTarget.style.color = '#e74c3c';
                  }
                }}
                onMouseLeave={(e) => {
                  if (!isMobile) {
                    e.currentTarget.style.backgroundColor = 'transparent';
                    e.currentTarget.style.color = '#65676b';
                  }
                }}
              >
                Delete
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Flag Dialog */}
      {showFlagDialog && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          backgroundColor: 'rgba(0, 0, 0, 0.5)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 1000
        }}>
          <div style={{
            backgroundColor: 'white',
            borderRadius: '0.5rem',
            padding: '1.5rem',
            maxWidth: '400px',
            width: '90%',
            boxShadow: '0 10px 25px rgba(0, 0, 0, 0.15)'
          }}>
            <h3 style={{
              margin: '0 0 1rem 0',
              fontSize: '1.125rem',
              fontWeight: '600',
              color: '#374151',
              display: 'flex',
              alignItems: 'center',
              gap: '0.5rem'
            }}>
              <Flag size={20} color="#f59e0b" />
              Flag Comment
            </h3>
            <p style={{
              margin: '0 0 1rem 0',
              fontSize: '0.875rem',
              color: '#6b7280'
            }}>
              Please provide a reason for flagging this comment:
            </p>
            <textarea
              value={flagReason}
              onChange={(e) => setFlagReason(e.target.value)}
              placeholder="Enter reason for flagging..."
              style={{
                width: '100%',
                minHeight: '80px',
                padding: '0.75rem',
                border: '1px solid #d1d5db',
                borderRadius: '0.375rem',
                fontSize: '0.875rem',
                fontFamily: 'inherit',
                resize: 'vertical',
                marginBottom: '1rem'
              }}
            />
            <div style={{
              display: 'flex',
              gap: '0.75rem',
              justifyContent: 'flex-end'
            }}>
              <button
                onClick={handleFlagCancel}
                style={{
                  padding: '0.5rem 1rem',
                  backgroundColor: '#f3f4f6',
                  color: '#374151',
                  border: 'none',
                  borderRadius: '0.375rem',
                  fontSize: '0.875rem',
                  fontWeight: '500',
                  cursor: 'pointer'
                }}
              >
                Cancel
              </button>
              <button
                onClick={handleFlagSubmit}
                disabled={!flagReason.trim()}
                style={{
                  padding: '0.5rem 1rem',
                  backgroundColor: flagReason.trim() ? '#f59e0b' : '#e5e7eb',
                  color: flagReason.trim() ? 'white' : '#9ca3af',
                  border: 'none',
                  borderRadius: '0.375rem',
                  fontSize: '0.875rem',
                  fontWeight: '500',
                  cursor: flagReason.trim() ? 'pointer' : 'not-allowed'
                }}
              >
                Flag Comment
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Reply Form */}
      {showReplyForm && (
        <div style={{ marginTop: '0.75rem', marginLeft: isMobile ? '2.25rem' : '2rem' }}>
          <AdminCommentForm
            announcementId={comment.announcement_id}
            calendarId={comment.calendar_id}
            parentCommentId={comment.comment_id}
            onSubmit={() => {
              setShowReplyForm(false);
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
            <AdminCommentItem
              key={reply.comment_id}
              comment={reply}
              onReply={onReply}
              onLike={onLike}
              onUnlike={onUnlike}
              onDelete={onDelete}
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

// Admin Comment Form Component will be added in the next chunk
interface AdminCommentFormProps {
  announcementId?: number;
  calendarId?: number;
  parentCommentId?: number;
  onSubmit: () => void;
  onCancel?: () => void;
  placeholder?: string;
}

const AdminCommentForm: React.FC<AdminCommentFormProps> = ({
  announcementId,
  calendarId,
  parentCommentId,
  onSubmit,
  onCancel,
  placeholder = "Write a comment..."
}) => {
  const [commentText, setCommentText] = useState('');
  const [isAnonymous, setIsAnonymous] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isMobile, setIsMobile] = useState(false);
  const { createComment } = useComments(announcementId, calendarId, 'admin'); // Admin service

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

    if (!commentText.trim() || isSubmitting) return;

    try {
      setIsSubmitting(true);

      const commentData: CreateCommentData = {
        announcement_id: announcementId,
        calendar_id: calendarId,
        comment_text: commentText.trim(),
        parent_comment_id: parentCommentId,
        is_anonymous: isAnonymous
      };

      // Debug logging for anonymous comment functionality
      console.log('🔍 AdminCommentForm - Submitting comment:', {
        isAnonymous,
        isAnonymousType: typeof isAnonymous,
        commentData,
        checkboxChecked: isAnonymous
      });

      await createComment(commentData);
      setCommentText('');
      onSubmit();
    } catch (error) {
      console.error('Error submitting comment:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} style={{
      padding: isMobile ? '0.75rem' : '1rem', // 12px mobile, 16px desktop
      backgroundColor: '#f8fafc',
      borderRadius: isMobile ? '0.5rem' : '0.5rem', // 8px consistent
      border: '1px solid #e2e8f0'
    }}>
      <div style={{ marginBottom: '0.75rem' }}>
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
            fontFamily: 'inherit',
            lineHeight: '1.6'
          }}
          onFocus={(e) => {
            e.currentTarget.style.borderColor = '#3b82f6';
            e.currentTarget.style.boxShadow = '0 0 0 3px rgba(59, 130, 246, 0.1)';
          }}
          onBlur={(e) => {
            e.currentTarget.style.borderColor = '#d1d5db';
            e.currentTarget.style.boxShadow = 'none';
          }}
        />
      </div>

      <div style={{
        display: 'flex',
        alignItems: isMobile ? 'flex-start' : 'center',
        justifyContent: 'space-between',
        gap: '0.75rem',
        flexDirection: isMobile ? 'column' : 'row'
      }}>
        <label style={{
          display: 'flex',
          alignItems: 'center',
          gap: '0.5rem',
          fontSize: isMobile ? '0.875rem' : '0.875rem', // 14px consistent
          color: '#6b7280',
          cursor: 'pointer',
          lineHeight: '1.5'
        }}>
          <input
            type="checkbox"
            checked={isAnonymous}
            onChange={(e) => setIsAnonymous(e.target.checked)}
            style={{
              width: isMobile ? '1.125rem' : '1rem', // 18px mobile, 16px desktop
              height: isMobile ? '1.125rem' : '1rem',
              accentColor: '#3b82f6'
            }}
          />
          Post as Anonymous Admin
        </label>

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
                border: '1px solid #d1d5db',
                borderRadius: '0.375rem', // 6px
                backgroundColor: 'white',
                color: '#6b7280',
                fontSize: isMobile ? '0.875rem' : '0.875rem', // 14px consistent
                fontWeight: '500',
                cursor: 'pointer',
                transition: 'all 0.2s ease',
                minHeight: isMobile ? '2.75rem' : 'auto', // 44px touch target
                flex: isMobile ? '1' : 'none'
              }}
              onMouseEnter={(e) => {
                if (!isMobile) {
                  e.currentTarget.style.backgroundColor = '#f9fafb';
                  e.currentTarget.style.borderColor = '#9ca3af';
                }
              }}
              onMouseLeave={(e) => {
                if (!isMobile) {
                  e.currentTarget.style.backgroundColor = 'white';
                  e.currentTarget.style.borderColor = '#d1d5db';
                }
              }}
              onTouchStart={(e) => {
                e.currentTarget.style.backgroundColor = '#f9fafb';
                e.currentTarget.style.borderColor = '#9ca3af';
              }}
              onTouchEnd={(e) => {
                e.currentTarget.style.backgroundColor = 'white';
                e.currentTarget.style.borderColor = '#d1d5db';
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
              border: 'none',
              borderRadius: '0.375rem', // 6px
              backgroundColor: !commentText.trim() || isSubmitting ? '#9ca3af' : '#3b82f6',
              color: 'white',
              fontSize: isMobile ? '0.875rem' : '0.875rem', // 14px consistent
              fontWeight: '500',
              cursor: !commentText.trim() || isSubmitting ? 'not-allowed' : 'pointer',
              transition: 'all 0.2s ease',
              minHeight: isMobile ? '2.75rem' : 'auto', // 44px touch target
              flex: isMobile ? '2' : 'none' // Larger submit button on mobile
            }}
            onMouseEnter={(e) => {
              if (!isMobile && !isSubmitting && commentText.trim()) {
                e.currentTarget.style.backgroundColor = '#2563eb';
              }
            }}
            onMouseLeave={(e) => {
              if (!isMobile && !isSubmitting && commentText.trim()) {
                e.currentTarget.style.backgroundColor = '#3b82f6';
              }
            }}
            onTouchStart={(e) => {
              if (!isSubmitting && commentText.trim()) {
                e.currentTarget.style.backgroundColor = '#2563eb';
              }
            }}
            onTouchEnd={(e) => {
              if (!isSubmitting && commentText.trim()) {
                e.currentTarget.style.backgroundColor = '#3b82f6';
              }
            }}
          >
            {isSubmitting ? 'Posting...' : (isMobile ? 'Post' : 'Post Comment')}
          </button>
        </div>
      </div>
    </form>
  );
};

// Main AdminCommentSection Component
const AdminCommentSection: React.FC<AdminCommentSectionProps> = ({
  announcementId,
  calendarId,
  allowComments = true,
  currentUserId,
  currentUserType = 'admin'
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
    deleteComment,
    flagComment,
    updateComment
  } = useComments(announcementId, calendarId, 'admin'); // Pass both IDs to hook

  const handleReply = (parentId: number) => {
    // This could trigger a scroll to the reply form or other UI feedback
    console.log('Reply to comment:', parentId);
  };

  const handleDelete = async (commentId: number) => {
    try {
      await deleteComment(commentId);
      await refresh();
    } catch (error) {
      console.error('Error deleting comment:', error);
    }
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
        fontStyle: 'italic',
        backgroundColor: '#f9fafb',
        borderRadius: '8px',
        border: '1px solid #e5e7eb'
      }}>
        <MessageCircle size={20} style={{ marginBottom: '0.5rem', opacity: 0.5 }} />
        <div>Comments are disabled for this announcement.</div>
      </div>
    );
  }

  return (
    <div style={{ marginTop: '1.5rem' }}>
      <div style={{
        display: 'flex',
        alignItems: 'center',
        gap: '0.5rem',
        marginBottom: '1rem'
      }}>
        <Shield size={20} color="#3b82f6" />
        <h3 style={{
          fontSize: '1.125rem',
          fontWeight: '600',
          color: '#374151',
          margin: 0
        }}>
          Admin Comments ({comments.length})
        </h3>
      </div>

      {error && (
        <div style={{
          padding: '0.75rem',
          backgroundColor: '#fef2f2',
          border: '1px solid #fecaca',
          color: '#dc2626',
          borderRadius: '6px',
          marginBottom: '1rem',
          fontSize: '0.875rem',
          display: 'flex',
          alignItems: 'center',
          gap: '0.5rem'
        }}>
          <Flag size={16} />
          {error}
        </div>
      )}

      {/* Comment Form */}
      <div style={{ marginBottom: '1.5rem' }}>
        <AdminCommentForm
          announcementId={announcementId}
          calendarId={calendarId}
          onSubmit={refresh}
          placeholder="Share your admin insights..."
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
            borderTop: '2px solid #3b82f6',
            borderRadius: '50%',
            animation: 'spin 1s linear infinite'
          }}></div>
        </div>
      ) : comments.length === 0 ? (
        <div style={{
          textAlign: 'center',
          padding: '2rem',
          color: '#6b7280',
          fontSize: '0.875rem',
          backgroundColor: '#f8fafc',
          borderRadius: '8px',
          border: '1px solid #e2e8f0'
        }}>
          <MessageCircle size={24} style={{ marginBottom: '0.5rem', opacity: 0.5 }} />
          <div>No comments yet. Be the first admin to share insights!</div>
        </div>
      ) : (
        <div>
          {comments.map((comment) => (
            <AdminCommentItem
              key={comment.comment_id}
              comment={comment}
              onReply={handleReply}
              onLike={likeComment}
              onUnlike={unlikeComment}
              onDelete={handleDelete}
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

export default AdminCommentSection;