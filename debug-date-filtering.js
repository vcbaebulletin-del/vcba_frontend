// Debug script to test the date filtering logic used in NewsFeed component

// Simulate the target events from the database
const targetEvents = [
  {
    calendar_id: 1564,
    title: 'Earthquake',
    event_date: '2025-09-23T16:00:00.000Z',
    end_date: '2025-09-29T16:00:00.000Z',
    is_active: 1,
    is_alert: 1
  },
  {
    calendar_id: 1565,
    title: 'Marsquake',
    event_date: '2025-09-24T16:00:00.000Z',
    end_date: '2025-09-28T16:00:00.000Z',
    is_active: 1,
    is_alert: 0
  }
];

// Simulate current server time (Philippines timezone +08:00)
const serverTime = new Date(); // Current time
console.log('🕐 Current Server Time:', serverTime.toISOString());
console.log('🌏 Server Time (Local):', serverTime.toString());

// Test the exact filtering logic from NewsFeed component
function testDateFiltering(event, serverTime) {
  console.log(`\n📅 Testing Event: ${event.title} (ID: ${event.calendar_id})`);
  
  // Replicate the exact logic from NewsFeed.tsx lines 802-844
  const todayDateString = serverTime.getFullYear() + '-' +
    String(serverTime.getMonth() + 1).padStart(2, '0') + '-' +
    String(serverTime.getDate()).padStart(2, '0');

  const eventStartDate = new Date(event.event_date);
  const eventStartDateString = eventStartDate.getFullYear() + '-' +
    String(eventStartDate.getMonth() + 1).padStart(2, '0') + '-' +
    String(eventStartDate.getDate()).padStart(2, '0');

  // If event has an end date, use it; otherwise, show for the event date only
  const eventEndDateString = event.end_date ? (() => {
    const endDate = new Date(event.end_date);
    return endDate.getFullYear() + '-' +
      String(endDate.getMonth() + 1).padStart(2, '0') + '-' +
      String(endDate.getDate()).padStart(2, '0');
  })() : eventStartDateString;

  // Event is active if server date is between start and end date (inclusive)
  const isEventActive = todayDateString >= eventStartDateString && todayDateString <= eventEndDateString;
  const isActive = Boolean(event.is_active);

  console.log('📊 Date Analysis:');
  console.log('  Server Time:', serverTime.toISOString());
  console.log('  Today Date String:', todayDateString);
  console.log('  Event Start Date:', event.event_date);
  console.log('  Event Start Date String:', eventStartDateString);
  console.log('  Event End Date:', event.end_date);
  console.log('  Event End Date String:', eventEndDateString);
  console.log('  Is Event Active (date range):', isEventActive);
  console.log('  Is Active (database flag):', isActive);
  console.log('  Final Result:', isEventActive && isActive);
  
  // Additional debugging
  console.log('📈 String Comparisons:');
  console.log('  todayDateString >= eventStartDateString:', todayDateString >= eventStartDateString, `(${todayDateString} >= ${eventStartDateString})`);
  console.log('  todayDateString <= eventEndDateString:', todayDateString <= eventEndDateString, `(${todayDateString} <= ${eventEndDateString})`);
  
  // Test with different timezone interpretations
  console.log('🌍 Timezone Analysis:');
  console.log('  Event Start (UTC):', new Date(event.event_date).toISOString());
  console.log('  Event Start (Local):', new Date(event.event_date).toString());
  console.log('  Event End (UTC):', new Date(event.end_date).toISOString());
  console.log('  Event End (Local):', new Date(event.end_date).toString());
  
  return isEventActive && isActive;
}

console.log('🔍 DEBUGGING DATE FILTERING LOGIC');
console.log('=====================================');

targetEvents.forEach(event => {
  const shouldShow = testDateFiltering(event, serverTime);
  console.log(`\n✅ Event ${event.calendar_id} (${event.title}) should show: ${shouldShow ? 'YES' : 'NO'}`);
});

// Test with different server times to understand the issue
console.log('\n\n🧪 TESTING WITH DIFFERENT SERVER TIMES');
console.log('=====================================');

// Test with Manila timezone (UTC+8)
const manilaTime = new Date();
manilaTime.setHours(manilaTime.getHours() + 8); // Simulate Manila time
console.log('\n🇵🇭 Testing with Manila Time (+8 hours):');
targetEvents.forEach(event => {
  const shouldShow = testDateFiltering(event, manilaTime);
  console.log(`Event ${event.calendar_id} should show: ${shouldShow ? 'YES' : 'NO'}`);
});

// Test with specific dates
console.log('\n📅 Testing with specific dates:');
const testDates = [
  new Date('2025-09-22T12:00:00.000Z'), // Before events
  new Date('2025-09-23T12:00:00.000Z'), // Start of first event
  new Date('2025-09-25T12:00:00.000Z'), // Middle of events (today)
  new Date('2025-09-28T12:00:00.000Z'), // End of second event
  new Date('2025-09-30T12:00:00.000Z')  // After events
];

testDates.forEach(testDate => {
  console.log(`\n🗓️ Testing with date: ${testDate.toISOString()}`);
  targetEvents.forEach(event => {
    const shouldShow = testDateFiltering(event, testDate);
    console.log(`  Event ${event.calendar_id} should show: ${shouldShow ? 'YES' : 'NO'}`);
  });
});
