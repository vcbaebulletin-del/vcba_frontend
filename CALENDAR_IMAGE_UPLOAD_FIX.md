# Calendar Event Image Upload Fix

## Problem Description
Image uploads were failing during **calendar event creation** but working perfectly during **calendar event editing**.

## Root Cause Analysis

### The Issue
The problem was in the `CalendarEventModal.tsx` file, specifically in the `handleSubmit` function's `onComplete` callback (lines 272-292).

**CREATE MODE (Failed):**
```javascript
// This condition was the problem:
if (event && selectedImages.length > 0) {
  // Upload images - THIS NEVER EXECUTED for new events!
}
```
- When creating a new event, `event` is `null/undefined`
- The image upload logic was completely skipped because `event` didn't exist
- Images were never uploaded to the server

**EDIT MODE (Worked):**
- When editing, `event` exists with a valid `calendar_id`
- The same `onComplete` callback executed the image upload logic successfully
- Images were uploaded without issues

## Solution Implemented

### 1. Modified CalendarEventModal.tsx

**Enhanced the `onComplete` callback** to handle both create and edit modes:

```javascript
const onComplete = async (createdEventId?: number) => {
  // Upload images if we have any selected (works for both create and edit modes)
  if (selectedImages.length > 0) {
    try {
      // For create mode, we need the newly created event ID
      // For edit mode, we use the existing event's calendar_id
      const eventIdForUpload = createdEventId || event?.calendar_id;
      
      if (eventIdForUpload) {
        if (createdEventId && !event) {
          // CREATE MODE: Use calendarService directly with new event ID
          const formData = new FormData();
          selectedImages.forEach((file) => {
            formData.append('images', file);
          });
          
          const response = await calendarService.uploadEventAttachments(createdEventId, formData);
          // Handle response...
        } else {
          // EDIT MODE: Use existing hook function
          await uploadImages(selectedImages);
        }
        
        setSelectedImages([]); // Clear selected images after upload
      }
    } catch (uploadError) {
      // Error handling for both modes...
    }
  }
  
  // Rest of the completion logic...
};
```

**Key Changes:**
- Added `createdEventId?: number` parameter to `onComplete` callback
- Removed the `event &&` condition that was blocking create mode uploads
- Added separate logic for create mode vs edit mode image uploads
- For create mode: Use `calendarService.uploadEventAttachments()` directly with the new event ID
- For edit mode: Continue using the existing `uploadImages()` hook function

### 2. Modified Calendar.tsx

**Updated `handleSaveEvent`** to capture and pass the created event ID:

```javascript
const handleSaveEvent = useCallback(async (
  data: CreateEventData | UpdateEventData,
  applyPendingDeletes?: () => Promise<void>,
  onComplete?: (createdEventId?: number) => Promise<void>  // Added parameter
) => {
  setSaving(true);
  try {
    let createdEventId: number | undefined;
    
    if (editingEvent) {
      // EDIT MODE: Same as before
      await updateEvent(editingEvent.calendar_id, data as UpdateEventData);
      // ...
    } else {
      // CREATE MODE: Capture the created event ID
      const createResponse = await calendarService.createEvent(data as CreateEventData);
      if (createResponse.success && createResponse.data?.event) {
        createdEventId = createResponse.data.event.calendar_id;
        console.log(`✅ Event created with ID: ${createdEventId}`);
      }
      setSuccessMessage('Event created successfully! Calendar refreshed.');
    }

    // Execute completion callback with the created event ID
    if (onComplete) {
      await onComplete(createdEventId);  // Pass the ID for create mode
    }
    
    // Rest of the function...
  }
}, [editingEvent, updateEvent, createEvent, refresh]);
```

**Key Changes:**
- Added `createdEventId?: number` parameter to `onComplete` callback type
- Capture the created event ID from `calendarService.createEvent()` response
- Pass the `createdEventId` to the `onComplete` callback for image upload

## Files Modified

1. **`src/components/admin/modals/CalendarEventModal.tsx`**
   - Enhanced `onComplete` callback to handle both create and edit modes
   - Added import for `calendarService`
   - Added proper error handling and success messages for both modes

2. **`src/pages/admin/Calendar.tsx`**
   - Modified `handleSaveEvent` to capture and pass created event ID
   - Updated callback type signature

## Testing Results

✅ **Build Status**: Successful compilation with no TypeScript errors
✅ **Create Mode**: Image uploads now work during event creation
✅ **Edit Mode**: Image uploads continue to work during event editing
✅ **Error Handling**: Proper error messages for both modes
✅ **User Experience**: Clear success/error feedback

## How It Works Now

### Create Mode Flow:
1. User creates new calendar event with images
2. Event data is submitted and event is created in database
3. `calendarService.createEvent()` returns the new event with `calendar_id`
4. `onComplete` callback receives the `createdEventId`
5. Images are uploaded using `calendarService.uploadEventAttachments(createdEventId, formData)`
6. Success message shows event creation and image upload status

### Edit Mode Flow:
1. User edits existing calendar event and adds/changes images
2. Event data is updated in database
3. `onComplete` callback uses existing `event.calendar_id`
4. Images are uploaded using the existing `uploadImages()` hook function
5. Success message shows event update and image upload status

## Benefits

- ✅ **Consistent Behavior**: Image uploads work the same way in both create and edit modes
- ✅ **Better UX**: Users get clear feedback about both event creation/update and image upload status
- ✅ **Error Resilience**: If image upload fails, the event is still created/updated successfully
- ✅ **Maintainable Code**: Clean separation between create and edit logic
- ✅ **Type Safety**: Proper TypeScript types for all callback parameters

## Future Improvements

- Consider refactoring the image upload logic into a shared utility function
- Add progress indicators for image uploads
- Implement retry logic for failed image uploads
- Add image compression before upload to improve performance
