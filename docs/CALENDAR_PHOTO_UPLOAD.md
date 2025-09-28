# Calendar Photo Upload Feature

## Overview

The Calendar Photo Upload feature enables administrators to attach multiple images to calendar events, providing rich visual content for school announcements and activities. This feature follows Google-level engineering standards with comprehensive security, performance optimization, and scalability considerations.

## Features

### Core Functionality
- **Multiple Image Upload**: Support for up to 10 images per calendar event
- **Drag & Drop Interface**: Intuitive file upload with drag-and-drop support
- **Image Management**: Individual image removal, replacement, and reordering
- **Primary Image Selection**: Designate a primary image for event previews
- **Soft Deletion**: Mark images for deletion without immediate removal
- **Publish/Unpublish Controls**: Manage event visibility to students

### Security Features
- **File Type Validation**: Strict whitelist for image formats (JPEG, PNG, GIF, WebP)
- **MIME Type Verification**: Server-side validation of file signatures
- **File Size Limits**: 5MB per image, 50MB total upload size
- **Malicious Pattern Detection**: Protection against directory traversal and executable files
- **Secure File Storage**: Images stored outside web root with controlled access

### Performance Optimizations
- **Lazy Loading**: Images loaded on demand
- **Optimized Storage**: Efficient file organization and naming
- **Database Indexing**: Optimized queries for attachment retrieval
- **Caching Strategy**: Browser caching for uploaded images

## Database Schema

### New Tables

#### `calendar_attachments`
```sql
CREATE TABLE `calendar_attachments` (
  `attachment_id` int(11) NOT NULL AUTO_INCREMENT,
  `calendar_id` int(11) NOT NULL,
  `file_name` varchar(255) NOT NULL,
  `file_path` varchar(500) NOT NULL,
  `file_type` enum('image','video','document') NOT NULL DEFAULT 'image',
  `file_size` int(11) NOT NULL,
  `mime_type` varchar(100) NOT NULL,
  `display_order` tinyint(3) UNSIGNED NOT NULL DEFAULT 0,
  `is_primary` tinyint(1) NOT NULL DEFAULT 0,
  `uploaded_at` timestamp NOT NULL DEFAULT current_timestamp(),
  `deleted_at` timestamp NULL DEFAULT NULL,
  PRIMARY KEY (`attachment_id`),
  KEY `fk_calendar_attachment` (`calendar_id`),
  CONSTRAINT `fk_calendar_attachment` FOREIGN KEY (`calendar_id`) REFERENCES `school_calendar` (`calendar_id`) ON DELETE CASCADE
);
```

### Modified Tables

#### `school_calendar` (Updated)
- Added `is_published` column for publish/unpublish functionality
- Added `deleted_at` column for soft deletion support

## API Endpoints

### Calendar Attachments
- `GET /api/calendar/:eventId/attachments` - Get event attachments
- `POST /api/calendar/:eventId/attachments` - Upload event attachments
- `DELETE /api/calendar/attachments/:attachmentId` - Delete attachment
- `PUT /api/calendar/:eventId/attachments/:attachmentId/primary` - Set primary attachment

### Event Management
- `PUT /api/calendar/:eventId/publish` - Publish event
- `PUT /api/calendar/:eventId/unpublish` - Unpublish event
- `PUT /api/calendar/:eventId/soft-delete` - Soft delete event
- `PUT /api/calendar/:eventId/restore` - Restore deleted event

## Frontend Components

### CalendarImageUpload
A reusable component for handling multiple image uploads with the following features:
- Drag & drop interface
- Image preview grid
- Individual image controls (delete, set primary)
- Validation and error handling
- Pending deletion management

### useCalendarImageUpload Hook
Custom hook providing:
- Image upload functionality
- Existing image management
- Error handling and loading states
- Soft deletion logic
- State management for pending operations

### Enhanced Calendar.tsx
Updated calendar component with:
- Event management interface
- Image preview integration
- Publish/unpublish controls
- Soft deletion capabilities

## Usage Examples

### Basic Image Upload
```tsx
import CalendarImageUpload from '../components/admin/CalendarImageUpload';
import { useCalendarImageUpload } from '../hooks/useCalendarImageUpload';

const MyComponent = () => {
  const {
    existingImages,
    uploadImages,
    setPrimaryImage,
    markForDeletion
  } = useCalendarImageUpload({
    calendarId: eventId,
    onSuccess: (message) => console.log(message),
    onError: (error) => console.error(error)
  });

  return (
    <CalendarImageUpload
      onImagesChange={uploadImages}
      existingImages={existingImages}
      onSetPrimary={setPrimaryImage}
      onMarkForDeletion={markForDeletion}
      maxImages={10}
    />
  );
};
```

### Event Management
```tsx
// Publish an event
await calendarService.publishEvent(eventId);

// Unpublish an event
await calendarService.unpublishEvent(eventId);

// Soft delete an event
await calendarService.softDeleteEvent(eventId);
```

## File Structure

```
BACK-VCBA-E-BULLETIN-BOARD/
├── src/
│   ├── controllers/CalendarController.js (updated)
│   ├── models/CalendarModel.js (updated)
│   ├── routes/calendarRoutes.js (updated)
│   ├── middleware/calendarUpload.js (new)
│   └── migrations/add_calendar_photo_upload.sql (new)

FRONT-VCBA-E-BULLETIN-BOARD/
├── src/
│   ├── components/admin/CalendarImageUpload.tsx (new)
│   ├── hooks/useCalendarImageUpload.ts (new)
│   ├── pages/admin/Calendar.tsx (updated)
│   ├── services/calendarService.ts (updated)
│   └── tests/calendar-photo-upload.test.tsx (new)
```

## Security Considerations

1. **File Validation**: Multiple layers of validation including MIME type, file signature, and extension checking
2. **Upload Limits**: Strict limits on file size and count to prevent abuse
3. **Secure Storage**: Files stored with randomized names to prevent direct access
4. **Access Control**: Only authenticated administrators can upload/manage images
5. **SQL Injection Prevention**: Parameterized queries throughout
6. **XSS Protection**: Proper output encoding for file names and paths

## Performance Considerations

1. **Database Indexing**: Optimized indexes for fast attachment queries
2. **File Organization**: Structured file storage for efficient retrieval
3. **Lazy Loading**: Images loaded only when needed
4. **Caching**: Browser caching headers for uploaded images
5. **Batch Operations**: Efficient bulk operations for multiple images

## Testing

Comprehensive test suite covering:
- Component rendering and interaction
- File upload validation
- Image management operations
- Error handling scenarios
- Security edge cases

Run tests with:
```bash
npm test calendar-photo-upload.test.tsx
```

## Migration

To apply the database changes:

1. **Backup your database** before running migrations
2. Run the migration script:
   ```sql
   SOURCE BACK-VCBA-E-BULLETIN-BOARD/migrations/add_calendar_photo_upload.sql
   ```
3. Verify the new tables and columns are created correctly
4. Update existing events' publish status as needed

## Troubleshooting

### Common Issues

1. **Upload Fails**: Check file size limits and MIME type validation
2. **Images Not Displaying**: Verify file paths and server permissions
3. **Database Errors**: Ensure migration was applied correctly
4. **Permission Issues**: Check file system permissions for upload directory

### Debug Mode

Enable debug logging by setting:
```javascript
console.log('🧹 useCalendarImageUpload - Debug mode enabled');
```

## Future Enhancements

1. **Image Compression**: Automatic image optimization on upload
2. **Cloud Storage**: Integration with AWS S3 or similar services
3. **Image Editing**: Basic cropping and editing capabilities
4. **Bulk Operations**: Mass upload and management tools
5. **Analytics**: Upload and view statistics

## Support

For technical support or questions about this feature:
1. Check the troubleshooting section above
2. Review the test cases for usage examples
3. Consult the API documentation for endpoint details
4. Contact the development team for additional assistance
