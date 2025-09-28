/**
 * Test script to demonstrate the archival display logic
 * This shows how the component will display different types of archived announcements
 */

// Mock function that mimics the getArchivalInfo function from the component
const getArchivalInfo = (announcement) => {
  // If archived_at exists, it was auto-archived by the system
  if (announcement.archived_at) {
    return {
      label: 'Auto-archived',
      date: announcement.archived_at,
      isSystemArchived: true
    };
  }
  // Otherwise, it was manually deleted by a user
  return {
    label: 'Deleted',
    date: announcement.deleted_at,
    isSystemArchived: false
  };
};

// Mock formatDate function
const formatDate = (dateString) => {
  return new Date(dateString).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  });
};

// Test cases
const testAnnouncements = [
  {
    announcement_id: 1,
    title: "System Auto-Archived Announcement",
    deleted_at: "2025-09-26T10:00:00Z",
    archived_at: "2025-09-26T10:00:00Z", // Has archived_at - system archived
    description: "This announcement was automatically archived by the system due to expiration"
  },
  {
    announcement_id: 2,
    title: "User Deleted Announcement",
    deleted_at: "2025-09-26T11:00:00Z",
    archived_at: null, // No archived_at - manually deleted
    description: "This announcement was manually deleted by a user"
  },
  {
    announcement_id: 3,
    title: "Another User Deleted Announcement",
    deleted_at: "2025-09-26T12:00:00Z",
    // archived_at is undefined - manually deleted
    description: "This announcement was also manually deleted by a user"
  }
];

console.log('🧪 Testing Archival Display Logic');
console.log('==================================\n');

testAnnouncements.forEach((announcement, index) => {
  const archivalInfo = getArchivalInfo(announcement);
  
  console.log(`📄 Test Case ${index + 1}: ${announcement.title}`);
  console.log(`   Description: ${announcement.description}`);
  console.log(`   deleted_at: ${announcement.deleted_at}`);
  console.log(`   archived_at: ${announcement.archived_at || 'null/undefined'}`);
  console.log(`   
   🎯 Display Result:`);
  console.log(`   Label: "${archivalInfo.label}"`);
  console.log(`   Date: ${formatDate(archivalInfo.date)}`);
  console.log(`   Is System Archived: ${archivalInfo.isSystemArchived}`);
  console.log(`   Color: ${archivalInfo.isSystemArchived ? 'Green (#059669)' : 'Red (#dc2626)'}`);
  console.log(`   Icon: ${archivalInfo.isSystemArchived ? 'Archive' : 'UserX'}`);
  console.log(`   Full Display: "${archivalInfo.label}: ${formatDate(archivalInfo.date)}"`);
  console.log('');
});

console.log('✅ Logic Summary:');
console.log('================');
console.log('• If archived_at exists → "Auto-archived" (Green, Archive icon)');
console.log('• If only deleted_at exists → "Deleted" (Red, UserX icon)');
console.log('• This provides clear visual distinction between system and user actions');
console.log('');
console.log('🎨 Visual Legend in UI:');
console.log('=======================');
console.log('📦 Auto-archived: System archived due to expiration (Green)');
console.log('👤 Deleted: Manually deleted by user (Red)');
