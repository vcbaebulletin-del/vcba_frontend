import React, { useState } from 'react';
import { MessageCircle, AlertCircle } from 'lucide-react';

interface CalendarCommentSectionProps {
  eventId: number;
  allowComments?: boolean;
  currentUserId?: number;
  currentUserType?: 'admin' | 'student';
}

const CalendarCommentSection: React.FC<CalendarCommentSectionProps> = ({
  eventId,
  allowComments = true,
  currentUserId,
  currentUserType = 'student'
}) => {
  const [comments, setComments] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | undefined>();
  const [newComment, setNewComment] = useState('');
  const [submitting, setSubmitting] = useState(false);

  // TODO: Implement calendar comment hooks and services
  // For now, this is a placeholder component

  if (!allowComments) {
    return (
      <div style={{
        padding: '1rem',
        textAlign: 'center',
        color: '#6b7280',
        fontSize: '0.875rem',
        fontStyle: 'italic',
        backgroundColor: '#f9fafb',
        borderRadius: '0.5rem',
        border: '1px solid #e5e7eb'
      }}>
        <MessageCircle size={16} style={{ marginBottom: '0.5rem' }} />
        <div>Comments are disabled for this event.</div>
      </div>
    );
  }

  return (
    <div style={{
      backgroundColor: '#ffffff',
      borderRadius: '0.5rem',
      border: '1px solid #e5e7eb',
      overflow: 'hidden'
    }}>
      {/* Header */}
      <div style={{
        padding: '1rem',
        borderBottom: '1px solid #e5e7eb',
        backgroundColor: '#f9fafb'
      }}>
        <h3 style={{
          margin: 0,
          fontSize: '1rem',
          fontWeight: '600',
          color: '#374151',
          display: 'flex',
          alignItems: 'center',
          gap: '0.5rem'
        }}>
          <MessageCircle size={16} />
          Comments ({comments.length})
        </h3>
      </div>

      {/* Comment Form */}
      <div style={{ padding: '1rem', borderBottom: '1px solid #e5e7eb' }}>
        <textarea
          value={newComment}
          onChange={(e) => setNewComment(e.target.value)}
          placeholder="Share your thoughts about this event..."
          style={{
            width: '100%',
            minHeight: '80px',
            padding: '0.75rem',
            border: '1px solid #d1d5db',
            borderRadius: '0.375rem',
            fontSize: '0.875rem',
            resize: 'vertical',
            fontFamily: 'inherit'
          }}
        />
        <div style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          marginTop: '0.75rem'
        }}>
          <div style={{
            fontSize: '0.75rem',
            color: '#6b7280'
          }}>
            {newComment.length}/500 characters
          </div>
          <button
            onClick={() => {
              // TODO: Implement comment submission
              console.log('Submit comment:', newComment);
            }}
            disabled={!newComment.trim() || submitting}
            style={{
              padding: '0.5rem 1rem',
              backgroundColor: newComment.trim() ? '#22c55e' : '#e5e7eb',
              color: newComment.trim() ? '#ffffff' : '#9ca3af',
              border: 'none',
              borderRadius: '0.375rem',
              fontSize: '0.875rem',
              fontWeight: '500',
              cursor: newComment.trim() ? 'pointer' : 'not-allowed',
              transition: 'all 0.2s ease-in-out'
            }}
          >
            {submitting ? 'Posting...' : 'Post Comment'}
          </button>
        </div>
      </div>

      {/* Comments List */}
      <div style={{ padding: '1rem' }}>
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
        ) : error ? (
          <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: '0.5rem',
            padding: '1rem',
            backgroundColor: '#fef2f2',
            border: '1px solid #fecaca',
            borderRadius: '0.375rem',
            color: '#dc2626',
            fontSize: '0.875rem'
          }}>
            <AlertCircle size={16} />
            {error}
          </div>
        ) : comments.length === 0 ? (
          <div style={{
            textAlign: 'center',
            padding: '2rem',
            color: '#6b7280',
            fontSize: '0.875rem'
          }}>
            <MessageCircle size={24} style={{ marginBottom: '0.5rem', opacity: 0.5 }} />
            <div>No comments yet. Be the first to share your thoughts!</div>
          </div>
        ) : (
          <div>
            {/* TODO: Render actual comments */}
            <div style={{
              padding: '1rem',
              backgroundColor: '#f9fafb',
              borderRadius: '0.375rem',
              fontSize: '0.875rem',
              color: '#6b7280',
              textAlign: 'center'
            }}>
              Comment functionality will be implemented soon...
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default CalendarCommentSection;
