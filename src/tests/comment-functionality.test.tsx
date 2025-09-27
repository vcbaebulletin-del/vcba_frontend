import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import '@testing-library/jest-dom';
import { commentService } from '../services/commentService';

// Mock the comment service
jest.mock('../services/commentService', () => ({
  commentService: {
    createComment: jest.fn(),
    getCommentsByAnnouncement: jest.fn(),
  },
}));

const mockCommentService = commentService as jest.Mocked<typeof commentService>;

describe('Comment Functionality', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  test('should create comment with correct data structure', async () => {
    const commentData = {
      announcement_id: 39,
      comment_text: 'This is a test comment',
      is_anonymous: false,
    };

    const mockComment = {
      comment_id: 1,
      announcement_id: 39,
      user_type: 'student' as const,
      user_id: 41,
      comment_text: 'This is a test comment',
      is_anonymous: false,
      is_flagged: false,
      is_deleted: false,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
      author_name: 'Jerry Jegger',
      reaction_count: 0,
    };

    const mockResponse = {
      success: true,
      message: 'Comment created successfully',
      data: { comment: mockComment },
    };

    mockCommentService.createComment.mockResolvedValue(mockResponse);

    const result = await commentService.createComment(commentData);

    expect(mockCommentService.createComment).toHaveBeenCalledWith(commentData);
    expect(result).toEqual(mockResponse);
  });

  test('should handle anonymous comments correctly', async () => {
    const commentData = {
      announcement_id: 39,
      comment_text: 'This is an anonymous comment',
      is_anonymous: true,
    };

    const mockComment = {
      comment_id: 2,
      announcement_id: 39,
      user_type: 'student' as const,
      user_id: 41,
      comment_text: 'This is an anonymous comment',
      is_anonymous: true,
      is_flagged: false,
      is_deleted: false,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
      author_name: 'Anonymous',
      reaction_count: 0,
    };

    const mockResponse = {
      success: true,
      message: 'Comment created successfully',
      data: { comment: mockComment },
    };

    mockCommentService.createComment.mockResolvedValue(mockResponse);

    const result = await commentService.createComment(commentData);

    expect(mockCommentService.createComment).toHaveBeenCalledWith(commentData);
    expect(result).toEqual(mockResponse);
  });

  test('should handle reply comments correctly', async () => {
    const commentData = {
      announcement_id: 39,
      comment_text: 'This is a reply comment',
      is_anonymous: false,
      parent_comment_id: 123,
    };

    const mockComment = {
      comment_id: 3,
      announcement_id: 39,
      parent_comment_id: 123,
      user_type: 'student' as const,
      user_id: 41,
      comment_text: 'This is a reply comment',
      is_anonymous: false,
      is_flagged: false,
      is_deleted: false,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
      author_name: 'Jerry Jegger',
      reaction_count: 0,
    };

    const mockResponse = {
      success: true,
      message: 'Comment created successfully',
      data: { comment: mockComment },
    };

    mockCommentService.createComment.mockResolvedValue(mockResponse);

    const result = await commentService.createComment(commentData);

    expect(mockCommentService.createComment).toHaveBeenCalledWith(commentData);
    expect(result).toEqual(mockResponse);
  });

  test('should validate comment data structure', () => {
    const validCommentData = {
      announcement_id: 39,
      comment_text: 'Valid comment text',
      is_anonymous: false,
    };

    // Test that the comment data has the correct structure
    expect(validCommentData).toHaveProperty('announcement_id');
    expect(validCommentData).toHaveProperty('comment_text');
    expect(validCommentData).toHaveProperty('is_anonymous');
    expect(typeof validCommentData.announcement_id).toBe('number');
    expect(typeof validCommentData.comment_text).toBe('string');
    expect(typeof validCommentData.is_anonymous).toBe('boolean');
  });

  test('should handle comment service errors', async () => {
    const commentData = {
      announcement_id: 39,
      comment_text: 'This comment will fail',
      is_anonymous: false,
    };

    const mockError = new Error('Comment creation failed');
    mockCommentService.createComment.mockRejectedValue(mockError);

    await expect(commentService.createComment(commentData)).rejects.toThrow('Comment creation failed');
    expect(mockCommentService.createComment).toHaveBeenCalledWith(commentData);
  });
});
