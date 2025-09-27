import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import '@testing-library/jest-dom';
import Calendar from '../pages/admin/Calendar';
import CalendarEventModal from '../components/admin/modals/CalendarEventModal';
import CalendarImageUpload from '../components/admin/CalendarImageUpload';

// Mock the hooks and services
jest.mock('../hooks/useCalendar', () => ({
  useCalendar: () => ({
    events: [
      {
        calendar_id: 1,
        title: 'Test Event',
        description: 'Test Description',
        event_date: '2025-07-15',
        end_date: null,
        holiday_type_id: 1,
        holiday_type_name: 'School Event',
        is_recurring: false,
        is_active: true,
        is_published: false,
        created_by: 1,
        created_at: '2025-07-12T00:00:00Z',
        updated_at: '2025-07-12T00:00:00Z'
      }
    ],
    loading: false,
    error: null,
    createEvent: jest.fn(),
    updateEvent: jest.fn(),
    getEventsForDate: jest.fn(() => []),
    refresh: jest.fn()
  }),
  useHolidayTypes: () => ({
    holidayTypes: [
      { type_id: 1, type_name: 'School Event', color_code: '#22c55e' },
      { type_id: 2, type_name: 'Holiday', color_code: '#dc3545' }
    ]
  }),
  getCalendarDays: jest.fn(() => {
    const days = [];
    for (let i = 1; i <= 31; i++) {
      days.push(new Date(2025, 6, i)); // July 2025
    }
    return days;
  }),
  isToday: jest.fn(() => false),
  isSameMonth: jest.fn(() => true),
  getMonthName: jest.fn(() => 'July')
}));

jest.mock('../hooks/useCalendarImageUpload', () => ({
  useCalendarImageUpload: () => ({
    existingImages: [
      {
        attachment_id: 1,
        calendar_id: 1,
        file_name: 'test-image.jpg',
        file_path: '/uploads/calendar/test-image.jpg',
        file_url: 'http://localhost:5000/uploads/calendar/test-image.jpg',
        file_type: 'image',
        file_size: 1024000,
        mime_type: 'image/jpeg',
        display_order: 0,
        is_primary: true,
        uploaded_at: '2025-07-12T00:00:00Z'
      }
    ],
    loading: false,
    error: null,
    uploadImages: jest.fn(),
    deleteImage: jest.fn(),
    setPrimaryImage: jest.fn(),
    refreshImages: jest.fn(),
    clearError: jest.fn(),
    pendingDeletes: [],
    markForDeletion: jest.fn(),
    unmarkForDeletion: jest.fn(),
    applyPendingDeletes: jest.fn(),
    clearPendingDeletes: jest.fn(),
    clearAllImageState: jest.fn()
  })
}));

jest.mock('../services/calendarService', () => ({
  calendarService: {
    publishEvent: jest.fn(),
    unpublishEvent: jest.fn(),
    softDeleteEvent: jest.fn(),
    getEventAttachments: jest.fn(),
    uploadEventAttachments: jest.fn(),
    deleteEventAttachment: jest.fn(),
    setPrimaryAttachment: jest.fn()
  }
}));

describe('Calendar Photo Upload Feature', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  test('renders calendar with event management section', () => {
    render(<Calendar />);
    
    expect(screen.getByText('Event Management')).toBeInTheDocument();
    expect(screen.getByText('Manage calendar events, images, and visibility')).toBeInTheDocument();
    expect(screen.getByText('Test Event')).toBeInTheDocument();
  });

  test('displays event with publish/unpublish controls', () => {
    render(<Calendar />);
    
    const editButton = screen.getByTitle('Edit event');
    const publishButton = screen.getByTitle('Publish event');
    const deleteButton = screen.getByTitle('Delete event');
    
    expect(editButton).toBeInTheDocument();
    expect(publishButton).toBeInTheDocument();
    expect(deleteButton).toBeInTheDocument();
  });

  test('opens modal when creating new event', () => {
    render(<Calendar />);
    
    const createButton = screen.getByText('Create Event');
    fireEvent.click(createButton);
    
    // Modal should open (would need to check for modal content)
    expect(screen.getByText('Create New Event')).toBeInTheDocument();
  });

  test('calendar image upload component handles file selection', () => {
    const mockOnImagesChange = jest.fn();
    const mockFile = new File(['test'], 'test.jpg', { type: 'image/jpeg' });
    
    render(
      <CalendarImageUpload
        onImagesChange={mockOnImagesChange}
        existingImages={[]}
        maxImages={10}
      />
    );
    
    const fileInput = screen.getByRole('button', { name: /click to upload/i });
    expect(fileInput).toBeInTheDocument();
  });

  test('displays existing images with primary indicator', () => {
    const existingImages = [
      {
        attachment_id: 1,
        calendar_id: 1,
        file_name: 'test-image.jpg',
        file_path: '/uploads/calendar/test-image.jpg',
        file_url: 'http://localhost:5000/uploads/calendar/test-image.jpg',
        file_type: 'image' as const,
        file_size: 1024000,
        mime_type: 'image/jpeg',
        display_order: 0,
        is_primary: true,
        uploaded_at: '2025-07-12T00:00:00Z'
      }
    ];
    
    render(
      <CalendarImageUpload
        onImagesChange={jest.fn()}
        existingImages={existingImages}
        maxImages={10}
      />
    );
    
    expect(screen.getByText('Primary')).toBeInTheDocument();
  });

  test('calendar event modal includes image upload section', () => {
    render(
      <CalendarEventModal
        isOpen={true}
        onClose={jest.fn()}
        onSave={jest.fn()}
        event={null}
        selectedDate={new Date()}
        loading={false}
      />
    );
    
    expect(screen.getByText('Event Images')).toBeInTheDocument();
    expect(screen.getByText('Published (Visible to Students)')).toBeInTheDocument();
  });

  test('handles image upload validation', () => {
    const mockOnImagesChange = jest.fn();
    
    render(
      <CalendarImageUpload
        onImagesChange={mockOnImagesChange}
        existingImages={[]}
        maxImages={2}
        maxFileSize={1024} // 1KB limit for testing
      />
    );
    
    // Test would involve simulating file drop with oversized file
    // and checking for error message
  });

  test('soft deletion marks images for deletion', () => {
    const mockMarkForDeletion = jest.fn();
    const mockUnmarkForDeletion = jest.fn();
    
    const existingImages = [
      {
        attachment_id: 1,
        calendar_id: 1,
        file_name: 'test-image.jpg',
        file_path: '/uploads/calendar/test-image.jpg',
        file_url: 'http://localhost:5000/uploads/calendar/test-image.jpg',
        file_type: 'image' as const,
        file_size: 1024000,
        mime_type: 'image/jpeg',
        display_order: 0,
        is_primary: false,
        uploaded_at: '2025-07-12T00:00:00Z'
      }
    ];
    
    render(
      <CalendarImageUpload
        onImagesChange={jest.fn()}
        existingImages={existingImages}
        pendingDeletes={[]}
        onMarkForDeletion={mockMarkForDeletion}
        onUnmarkForDeletion={mockUnmarkForDeletion}
        maxImages={10}
      />
    );
    
    const deleteButton = screen.getByTitle('Mark for deletion');
    fireEvent.click(deleteButton);
    
    expect(mockMarkForDeletion).toHaveBeenCalledWith(1);
  });

  test('displays pending deletion state correctly', () => {
    const existingImages = [
      {
        attachment_id: 1,
        calendar_id: 1,
        file_name: 'test-image.jpg',
        file_path: '/uploads/calendar/test-image.jpg',
        file_url: 'http://localhost:5000/uploads/calendar/test-image.jpg',
        file_type: 'image' as const,
        file_size: 1024000,
        mime_type: 'image/jpeg',
        display_order: 0,
        is_primary: false,
        uploaded_at: '2025-07-12T00:00:00Z'
      }
    ];
    
    render(
      <CalendarImageUpload
        onImagesChange={jest.fn()}
        existingImages={existingImages}
        pendingDeletes={[1]} // Image 1 is marked for deletion
        onMarkForDeletion={jest.fn()}
        onUnmarkForDeletion={jest.fn()}
        maxImages={10}
      />
    );
    
    expect(screen.getByText('Will be deleted')).toBeInTheDocument();
    expect(screen.getByTitle('Undo delete')).toBeInTheDocument();
  });
});
