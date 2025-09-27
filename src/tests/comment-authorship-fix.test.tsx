import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import '@testing-library/jest-dom';
import { commentService } from '../services/commentService';
import { httpClient } from '../services/api.service';
import { ADMIN_AUTH_TOKEN_KEY, STUDENT_AUTH_TOKEN_KEY, ADMIN_USER_DATA_KEY, STUDENT_USER_DATA_KEY } from '../config/constants';

// Mock fetch for testing authentication
global.fetch = jest.fn();

// Mock httpClient for admin authentication
jest.mock('../services/api.service', () => ({
  httpClient: {
    post: jest.fn()
  }
}));

const mockHttpClient = httpClient as jest.Mocked<typeof httpClient>;

describe('Comment Authorship Fix', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    localStorage.clear();
    (fetch as jest.Mock).mockClear();
    mockHttpClient.post.mockClear();
  });

  afterEach(() => {
    localStorage.clear();
  });

  test('should use admin authentication when admin token exists', async () => {
    // Setup admin authentication
    const adminToken = 'admin-token-123';
    const adminUser = {
      id: 1,
      email: 'admin@test.com',
      role: 'admin',
      firstName: 'Admin',
      lastName: 'User'
    };

    localStorage.setItem(ADMIN_AUTH_TOKEN_KEY, adminToken);
    localStorage.setItem(ADMIN_USER_DATA_KEY, JSON.stringify(adminUser));

    // Mock successful response for httpClient (admin uses httpClient)
    const mockResponse = {
      success: true,
      message: 'Comment created successfully',
      data: {
        comment: {
          comment_id: 1,
          announcement_id: 39,
          user_type: 'admin',
          user_id: 1,
          comment_text: 'Admin comment',
          author_name: 'Admin User'
        }
      }
    };

    mockHttpClient.post.mockResolvedValue(mockResponse);

    const commentData = {
      announcement_id: 39,
      comment_text: 'Admin comment',
      is_anonymous: false
    };

    await commentService.createComment(commentData);

    // Verify that httpClient.post was called (admin authentication path)
    expect(mockHttpClient.post).toHaveBeenCalledWith('/api/comments', commentData);

    // Verify that fetch was NOT called (student authentication path)
    expect(fetch).not.toHaveBeenCalled();
  });

  test('should use student authentication when only student token exists', async () => {
    // Setup student authentication only
    const studentToken = 'student-token-456';
    const studentUser = {
      id: 2,
      email: 'student@test.com',
      role: 'student',
      firstName: 'Student',
      lastName: 'User'
    };

    localStorage.setItem(STUDENT_AUTH_TOKEN_KEY, studentToken);
    localStorage.setItem(STUDENT_USER_DATA_KEY, JSON.stringify(studentUser));

    // Mock successful response
    const mockResponse = {
      success: true,
      message: 'Comment created successfully',
      data: {
        comment: {
          comment_id: 2,
          announcement_id: 39,
          user_type: 'student',
          user_id: 2,
          comment_text: 'Student comment',
          author_name: 'Student User'
        }
      }
    };

    (fetch as jest.Mock).mockResolvedValue({
      ok: true,
      json: () => Promise.resolve(mockResponse)
    });

    const commentData = {
      announcement_id: 39,
      comment_text: 'Student comment',
      is_anonymous: false
    };

    await commentService.createComment(commentData);

    // Verify that fetch was called with student token
    expect(fetch).toHaveBeenCalledWith(
      expect.stringContaining('/api/comments'),
      expect.objectContaining({
        method: 'POST',
        headers: expect.objectContaining({
          'Authorization': `Bearer ${studentToken}`
        })
      })
    );
  });

  test('should prioritize admin authentication when both tokens exist', async () => {
    // Setup both admin and student authentication
    const adminToken = 'admin-token-123';
    const studentToken = 'student-token-456';
    const adminUser = {
      id: 1,
      email: 'admin@test.com',
      role: 'admin',
      firstName: 'Admin',
      lastName: 'User'
    };
    const studentUser = {
      id: 2,
      email: 'student@test.com',
      role: 'student',
      firstName: 'Student',
      lastName: 'User'
    };

    localStorage.setItem(ADMIN_AUTH_TOKEN_KEY, adminToken);
    localStorage.setItem(ADMIN_USER_DATA_KEY, JSON.stringify(adminUser));
    localStorage.setItem(STUDENT_AUTH_TOKEN_KEY, studentToken);
    localStorage.setItem(STUDENT_USER_DATA_KEY, JSON.stringify(studentUser));

    // Mock successful response for httpClient (admin uses httpClient)
    const mockResponse = {
      success: true,
      message: 'Comment created successfully',
      data: {
        comment: {
          comment_id: 1,
          announcement_id: 39,
          user_type: 'admin',
          user_id: 1,
          comment_text: 'Admin comment should be prioritized',
          author_name: 'Admin User'
        }
      }
    };

    mockHttpClient.post.mockResolvedValue(mockResponse);

    const commentData = {
      announcement_id: 39,
      comment_text: 'Admin comment should be prioritized',
      is_anonymous: false
    };

    await commentService.createComment(commentData);

    // Verify that httpClient.post was called (admin authentication path)
    expect(mockHttpClient.post).toHaveBeenCalledWith('/api/comments', commentData);

    // Verify that fetch was NOT called (student authentication path)
    expect(fetch).not.toHaveBeenCalled();
  });

  test('should log authentication context for debugging', async () => {
    const consoleSpy = jest.spyOn(console, 'log').mockImplementation();

    // Setup admin authentication
    const adminToken = 'admin-token-123';
    const adminUser = {
      id: 1,
      email: 'admin@test.com',
      role: 'admin'
    };

    localStorage.setItem(ADMIN_AUTH_TOKEN_KEY, adminToken);
    localStorage.setItem(ADMIN_USER_DATA_KEY, JSON.stringify(adminUser));

    // Mock successful response for httpClient
    mockHttpClient.post.mockResolvedValue({
      success: true,
      message: 'Comment created successfully',
      data: { comment: {} }
    });

    const commentData = {
      announcement_id: 39,
      comment_text: 'Test comment',
      is_anonymous: false
    };

    await commentService.createComment(commentData);

    // Verify that authentication context is logged
    expect(consoleSpy).toHaveBeenCalledWith(
      'CommentService.createComment - Auth context:',
      expect.objectContaining({
        useStudentAuth: false,
        hasToken: true,
        userType: 'admin'
      })
    );

    consoleSpy.mockRestore();
  });
});
