# NewsFeed Sorting Logic Update

## Overview
Updated the sorting logic in `NewsFeed.tsx` to sort both **school calendar posts** and **announcement posts** by their end dates, with posts ending sooner appearing at the top.

## Changes Made

### 1. Updated Calendar Posts Sorting
**Before:**
```javascript
const calendarPosts = filteredCalendarEvents.map(item => ({ 
  ...item, 
  type: 'event', 
  sortDate: new Date(item.event_date),  // Used start date
  displayDate: item.event_date
}));
```

**After:**
```javascript
const calendarPosts = filteredCalendarEvents.map(item => ({ 
  ...item, 
  type: 'event', 
  // Use end_date for sorting, fallback to event_date if no end_date
  sortDate: new Date(item.end_date || item.event_date),
  displayDate: item.event_date
}));
```

### 2. Updated Announcement Posts Sorting
**Before:**
```javascript
const announcementPosts = filteredAnnouncements.map(item => ({ 
  ...item, 
  type: 'announcement', 
  sortDate: new Date(item.visibility_start_at || item.created_at),  // Used start date
  displayDate: item.visibility_start_at || item.created_at
}));
```

**After:**
```javascript
const announcementPosts = filteredAnnouncements.map(item => ({ 
  ...item, 
  type: 'announcement', 
  // Use visibility_end_at for sorting, fallback to visibility_start_at or created_at
  sortDate: new Date(item.visibility_end_at || item.visibility_start_at || item.created_at),
  displayDate: item.visibility_start_at || item.created_at
}));
```

### 3. Updated Sort Order
**Before:**
```javascript
// Sort promoted posts by date descending (most recent first)
promoted.sort((a, b) => {
  const dateComparison = b.sortDate.getTime() - a.sortDate.getTime();
  return dateComparison;
});
```

**After:**
```javascript
// Sort promoted posts by end date ascending (posts ending sooner appear at the top)
promoted.sort((a, b) => {
  const dateComparison = a.sortDate.getTime() - b.sortDate.getTime();
  return dateComparison;
});
```

### 4. Updated Debug Logging
Enhanced the console logging to show the end dates being used for sorting:

```javascript
console.log('📅 Promoted posts order (sorted by end date - ending sooner first):', promoted.map(item => ({
  title: item.title,
  type: item.type,
  displayDate: item.displayDate,
  endDate: item.type === 'event' 
    ? ((item as any).end_date || (item as any).event_date)
    : ((item as any).visibility_end_at || (item as any).visibility_start_at || (item as any).created_at),
  sortDate: item.sortDate.toISOString(),
  is_alert: item.is_alert
})));
```

## Sorting Logic Details

### For School Calendar Events:
- **Primary Sort Field**: `event.end_date`
- **Fallback**: `event.event_date` (if no end_date)
- **Sort Order**: Ascending (events ending sooner appear first)

### For Announcement Posts:
- **Primary Sort Field**: `announcement.visibility_end_at`
- **Fallback 1**: `announcement.visibility_start_at`
- **Fallback 2**: `announcement.created_at`
- **Sort Order**: Ascending (announcements ending sooner appear first)

## Behavior

### Promoted Posts Section (Current Implementation):
- ✅ All calendar events and announcements are sorted by end date
- ✅ Posts ending sooner appear at the top
- ✅ Posts ending later appear below
- ✅ Works for both alert and non-alert posts

### Normal Posts Section (Future Implementation):
- 📝 Added documentation for when normal posts are implemented
- 📝 Same sorting logic should be applied:
  - Calendar events: sort by `event.end_date` (or `event.event_date`)
  - Announcements: sort by `announcement.visibility_end_at` (or fallback dates)
  - Posts ending sooner should appear at the top (ascending sort)

## Examples

### Example Sorting Result:
```
1. Event A (ends: 2024-01-15) ← Ending soonest
2. Announcement B (ends: 2024-01-20)
3. Event C (ends: 2024-01-25)
4. Announcement D (ends: 2024-02-01) ← Ending latest
```

### Fallback Logic:
- **Calendar Event with no end_date**: Uses `event_date` for sorting
- **Announcement with no visibility_end_at**: Uses `visibility_start_at` or `created_at`

## Files Modified

- **`src/components/common/NewsFeed.tsx`**
  - Updated calendar posts mapping to use `end_date`
  - Updated announcement posts mapping to use `visibility_end_at`
  - Changed sort order from descending to ascending
  - Enhanced debug logging
  - Added documentation for future normal posts implementation

## Testing Results

✅ **Build Status**: Successful compilation with no TypeScript errors
✅ **Sort Logic**: Posts are now sorted by end date (ascending)
✅ **Fallback Logic**: Proper fallback dates when primary sort fields are missing
✅ **Debug Logging**: Enhanced console output shows end dates used for sorting
✅ **Type Safety**: Proper type assertions for debug logging

## Benefits

- ✅ **User Experience**: Posts ending sooner are prioritized and appear first
- ✅ **Logical Ordering**: Users see time-sensitive content at the top
- ✅ **Consistent Behavior**: Same sorting logic for both calendar events and announcements
- ✅ **Robust Fallbacks**: Handles missing end dates gracefully
- ✅ **Future-Ready**: Documentation for normal posts implementation

## Verification

To verify the sorting is working correctly:

1. **Check Browser Console**: Look for the debug log showing sorted posts with end dates
2. **Visual Inspection**: Confirm posts ending sooner appear at the top of the feed
3. **Test Edge Cases**: Verify fallback logic works when end dates are missing
4. **Alert Posts**: Confirm alert posts also follow the same sorting logic

The sorting logic now ensures that both calendar events and announcements are properly ordered by their end dates, with the most time-sensitive content (ending soonest) appearing first in the feed.
