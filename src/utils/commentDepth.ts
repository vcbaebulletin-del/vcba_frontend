/**
 * Comment Depth Management Utilities
 * 
 * This module provides utilities for managing comment threading depth
 * to prevent infinite reply loops, following industry best practices.
 * 
 * Depth Levels:
 * - Level 0: Original comment (top-level)
 * - Level 1: Reply to original comment
 * - Level 2: Reply to reply (maximum allowed depth)
 * - Level 3+: Should be flattened or redirected
 */

import type { Comment } from '../services/commentService';

// Configuration constants
export const COMMENT_DEPTH_CONFIG = {
  MAX_DEPTH: 2,           // Maximum allowed depth (0-based)
  MAX_VISUAL_DEPTH: 3,    // Maximum visual indentation depth
  FLATTEN_THRESHOLD: 3,   // Depth at which to start flattening
  INDENT_SIZE: 20,        // Pixels per depth level
  MAX_INDENT: 60          // Maximum indentation in pixels
} as const;

/**
 * Calculate the depth of a comment in the thread hierarchy
 */
export function calculateCommentDepth(comment: Comment, allComments: Comment[]): number {
  let depth = 0;
  let currentComment = comment;

  // Traverse up the parent chain to calculate depth
  while (currentComment.parent_comment_id) {
    depth++;
    const parentComment = allComments.find(c => c.comment_id === currentComment.parent_comment_id);
    if (!parentComment) break;
    currentComment = parentComment;
    
    // Safety check to prevent infinite loops
    if (depth > 10) {
      console.warn('Comment depth calculation exceeded safety limit');
      break;
    }
  }

  return depth;
}

/**
 * Check if a comment can have replies based on depth limits
 */
export function canCommentHaveReplies(depth: number): boolean {
  return depth < COMMENT_DEPTH_CONFIG.MAX_DEPTH;
}

/**
 * Check if a comment should show the reply button
 */
export function shouldShowReplyButton(depth: number): boolean {
  return canCommentHaveReplies(depth);
}

/**
 * Check if a comment thread should be flattened
 */
export function shouldFlattenThread(depth: number): boolean {
  return depth >= COMMENT_DEPTH_CONFIG.FLATTEN_THRESHOLD;
}

/**
 * Calculate visual indentation for a comment based on depth
 */
export function calculateIndentation(depth: number): number {
  const visualDepth = Math.min(depth, COMMENT_DEPTH_CONFIG.MAX_VISUAL_DEPTH);
  const indentation = visualDepth * COMMENT_DEPTH_CONFIG.INDENT_SIZE;
  return Math.min(indentation, COMMENT_DEPTH_CONFIG.MAX_INDENT);
}

/**
 * Get the appropriate parent comment ID for a new reply
 * If depth limit is reached, redirect to the root comment
 */
export function getReplyParentId(
  targetComment: Comment, 
  allComments: Comment[]
): number {
  const currentDepth = calculateCommentDepth(targetComment, allComments);
  
  if (currentDepth < COMMENT_DEPTH_CONFIG.MAX_DEPTH) {
    // Normal reply - use the target comment as parent
    return targetComment.comment_id;
  } else {
    // Depth limit reached - find the root comment of this thread
    let rootComment = targetComment;
    while (rootComment.parent_comment_id) {
      const parentComment = allComments.find(c => c.comment_id === rootComment.parent_comment_id);
      if (!parentComment) break;
      rootComment = parentComment;
    }
    return rootComment.comment_id;
  }
}

/**
 * Build a hierarchical comment tree with depth limits
 */
export function buildCommentTree(comments: Comment[]): Comment[] {
  const commentMap = new Map<number, Comment>();
  const rootComments: Comment[] = [];

  // Create a map of all comments
  comments.forEach(comment => {
    commentMap.set(comment.comment_id, { ...comment, replies: [] });
  });

  // Build the tree structure
  comments.forEach(comment => {
    const commentWithReplies = commentMap.get(comment.comment_id)!;
    
    if (comment.parent_comment_id) {
      const parent = commentMap.get(comment.parent_comment_id);
      if (parent) {
        const parentDepth = calculateCommentDepth(parent, comments);
        const currentDepth = parentDepth + 1;
        
        // Only add as reply if within depth limits
        if (currentDepth <= COMMENT_DEPTH_CONFIG.MAX_DEPTH) {
          parent.replies = parent.replies || [];
          parent.replies.push(commentWithReplies);
        } else {
          // If depth limit exceeded, add as root comment
          rootComments.push(commentWithReplies);
        }
      } else {
        // Parent not found, add as root comment
        rootComments.push(commentWithReplies);
      }
    } else {
      // Top-level comment
      rootComments.push(commentWithReplies);
    }
  });

  return rootComments;
}

/**
 * Get a user-friendly message for depth limit reached
 */
export function getDepthLimitMessage(depth: number): string {
  if (depth >= COMMENT_DEPTH_CONFIG.MAX_DEPTH) {
    return "Reply depth limit reached. Your reply will be added as a new comment in this thread.";
  }
  return "";
}

/**
 * Get thread continuation message
 */
export function getThreadContinuationMessage(commentCount: number): string {
  if (commentCount > 0) {
    return `Continue this thread (${commentCount} more ${commentCount === 1 ? 'reply' : 'replies'})`;
  }
  return "Continue this thread";
}

/**
 * Validate comment depth before creation (for backend validation)
 */
export function validateCommentDepth(
  parentCommentId: number | null,
  allComments: Comment[]
): { isValid: boolean; message?: string; suggestedParentId?: number } {
  if (!parentCommentId) {
    // Top-level comment is always valid
    return { isValid: true };
  }

  const parentComment = allComments.find(c => c.comment_id === parentCommentId);
  if (!parentComment) {
    return { 
      isValid: false, 
      message: "Parent comment not found" 
    };
  }

  const parentDepth = calculateCommentDepth(parentComment, allComments);
  const newCommentDepth = parentDepth + 1;

  if (newCommentDepth > COMMENT_DEPTH_CONFIG.MAX_DEPTH) {
    const suggestedParentId = getReplyParentId(parentComment, allComments);
    return {
      isValid: false,
      message: `Comment depth limit (${COMMENT_DEPTH_CONFIG.MAX_DEPTH + 1} levels) exceeded. Reply will be added to thread root.`,
      suggestedParentId
    };
  }

  return { isValid: true };
}

/**
 * Get CSS classes for comment depth styling
 */
export function getCommentDepthClasses(depth: number): string[] {
  const classes = [`comment-depth-${depth}`];
  
  if (depth === 0) {
    classes.push('comment-root');
  } else if (depth === 1) {
    classes.push('comment-reply');
  } else if (depth >= 2) {
    classes.push('comment-deep-reply');
  }

  if (shouldFlattenThread(depth)) {
    classes.push('comment-flattened');
  }

  return classes;
}

/**
 * Format depth information for debugging
 */
export function formatDepthInfo(comment: Comment, allComments: Comment[]): string {
  const depth = calculateCommentDepth(comment, allComments);
  const canReply = canCommentHaveReplies(depth);
  const shouldFlatten = shouldFlattenThread(depth);
  
  return `Depth: ${depth}, CanReply: ${canReply}, ShouldFlatten: ${shouldFlatten}`;
}

export default {
  COMMENT_DEPTH_CONFIG,
  calculateCommentDepth,
  canCommentHaveReplies,
  shouldShowReplyButton,
  shouldFlattenThread,
  calculateIndentation,
  getReplyParentId,
  buildCommentTree,
  getDepthLimitMessage,
  getThreadContinuationMessage,
  validateCommentDepth,
  getCommentDepthClasses,
  formatDepthInfo
};
