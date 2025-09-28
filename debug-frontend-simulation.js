// Simulate the exact frontend logic to debug the calendar filtering issue
const axios = require('axios');

const API_BASE_URL = 'http://localhost:5000';

async function simulateFrontendLogic() {
  try {
    console.log('🔍 SIMULATING FRONTEND LOGIC');
    console.log('============================');
    
    // Step 1: Fetch server time (like timeService.getCurrentTime())
    console.log('\n📅 Step 1: Fetching server time...');
    const timeResponse = await axios.get(`${API_BASE_URL}/api/time/current`);
    
    if (!timeResponse.data.success) {
      throw new Error('Failed to get server time');
    }
    
    const serverTimeData = timeResponse.data.data;
    const serverTime = new Date(serverTimeData.timestamp);
    
    console.log('✅ Server time fetched:', {
      timestamp: serverTimeData.timestamp,
      formatted: serverTimeData.formatted,
      serverTime: serverTime.toISOString(),
      localTime: serverTime.toString()
    });
    
    // Step 2: Fetch calendar events (like fetchCalendarEvents())
    console.log('\n📊 Step 2: Fetching calendar events...');
    const cacheBuster = Date.now();
    const calendarUrl = `${API_BASE_URL}/api/calendar?limit=50&sort_by=event_date&sort_order=ASC&_t=${cacheBuster}`;
    
    const calendarResponse = await axios.get(calendarUrl, {
      headers: {
        'Content-Type': 'application/json',
        'Cache-Control': 'no-cache, no-store, must-revalidate',
        'Pragma': 'no-cache',
        'Expires': '0'
      }
    });
    
    console.log('✅ Calendar API response:', {
      status: calendarResponse.status,
      success: calendarResponse.data.success,
      eventsCount: calendarResponse.data.data?.events?.length || 0
    });
    
    const calendarEvents = calendarResponse.data.data.events || [];
    
    // Check if target events are in the response
    const event1564 = calendarEvents.find(e => e.calendar_id === 1564);
    const event1565 = calendarEvents.find(e => e.calendar_id === 1565);
    
    console.log('\n🎯 Target events in API response:');
    console.log('Event 1564 (Earthquake):', event1564 ? '✅ FOUND' : '❌ NOT FOUND');
    console.log('Event 1565 (Marsquake):', event1565 ? '✅ FOUND' : '❌ NOT FOUND');
    
    if (event1564) {
      console.log('Event 1564 details:', {
        title: event1564.title,
        is_active: event1564.is_active,
        is_published: event1564.is_published,
        is_alert: event1564.is_alert,
        event_date: event1564.event_date,
        end_date: event1564.end_date
      });
    }
    
    if (event1565) {
      console.log('Event 1565 details:', {
        title: event1565.title,
        is_active: event1565.is_active,
        is_published: event1565.is_published,
        is_alert: event1565.is_alert,
        event_date: event1565.event_date,
        end_date: event1565.end_date
      });
    }
    
    // Step 3: Apply the exact filtering logic from NewsFeed.tsx
    console.log('\n🔍 Step 3: Applying frontend filtering logic...');
    
    const filteredCalendarEvents = calendarEvents.filter(event => {
      // Search and category filtering (assume no filters for this test)
      const matchesSearch = true;
      const matchesCategory = true;
      
      // Date filtering logic (exact copy from NewsFeed.tsx lines 802-844)
      if (!serverTime) {
        console.log('⚠️ Server time not loaded yet, skipping date filtering for:', event.title);
        return matchesSearch && matchesCategory;
      }
      
      const todayDateString = serverTime.getFullYear() + '-' +
        String(serverTime.getMonth() + 1).padStart(2, '0') + '-' +
        String(serverTime.getDate()).padStart(2, '0');
      
      const eventStartDate = new Date(event.event_date);
      const eventStartDateString = eventStartDate.getFullYear() + '-' +
        String(eventStartDate.getMonth() + 1).padStart(2, '0') + '-' +
        String(eventStartDate.getDate()).padStart(2, '0');
      
      const eventEndDateString = event.end_date ? (() => {
        const endDate = new Date(event.end_date);
        return endDate.getFullYear() + '-' +
          String(endDate.getMonth() + 1).padStart(2, '0') + '-' +
          String(endDate.getDate()).padStart(2, '0');
      })() : eventStartDateString;
      
      const isEventActive = todayDateString >= eventStartDateString && todayDateString <= eventEndDateString;
      const isActive = Boolean(event.is_active);
      
      // Log filtering details for target events
      if (event.calendar_id === 1564 || event.calendar_id === 1565) {
        console.log(`\n📅 FILTERING EVENT ${event.calendar_id} (${event.title}):`);
        console.log('  Server Time:', serverTime.toISOString());
        console.log('  Today Date String:', todayDateString);
        console.log('  Event Start Date:', event.event_date);
        console.log('  Event Start Date String:', eventStartDateString);
        console.log('  Event End Date:', event.end_date);
        console.log('  Event End Date String:', eventEndDateString);
        console.log('  Is Event Active (date range):', isEventActive);
        console.log('  Is Active (database flag):', isActive);
        console.log('  Matches Search:', matchesSearch);
        console.log('  Matches Category:', matchesCategory);
        console.log('  Final Result:', matchesSearch && matchesCategory && isEventActive && isActive);
      }
      
      return matchesSearch && matchesCategory && isEventActive && isActive;
    });
    
    console.log('\n📊 FILTERING RESULTS:');
    console.log('Total events from API:', calendarEvents.length);
    console.log('Filtered events:', filteredCalendarEvents.length);
    
    const filteredEvent1564 = filteredCalendarEvents.find(e => e.calendar_id === 1564);
    const filteredEvent1565 = filteredCalendarEvents.find(e => e.calendar_id === 1565);
    
    console.log('Event 1564 after filtering:', filteredEvent1564 ? '✅ PASSED' : '❌ FILTERED OUT');
    console.log('Event 1565 after filtering:', filteredEvent1565 ? '✅ PASSED' : '❌ FILTERED OUT');
    
    // Step 4: Separate into alert and regular posts
    console.log('\n🚨 Step 4: Separating into alert and regular posts...');
    
    const alertCalendarEvents = filteredCalendarEvents.filter(event => Boolean(event.is_alert));
    const regularCalendarEvents = filteredCalendarEvents.filter(event => !Boolean(event.is_alert));
    
    console.log('Alert calendar events:', alertCalendarEvents.length);
    console.log('Regular calendar events:', regularCalendarEvents.length);
    
    console.log('\nAlert events:');
    alertCalendarEvents.forEach(event => {
      console.log(`  - ${event.title} (ID: ${event.calendar_id})`);
    });
    
    console.log('\nRegular events:');
    regularCalendarEvents.forEach(event => {
      console.log(`  - ${event.title} (ID: ${event.calendar_id})`);
    });
    
    // Final summary
    console.log('\n🎯 FINAL SUMMARY:');
    console.log('================');
    console.log('Event 1564 (Earthquake - Alert):', {
      inApiResponse: !!event1564,
      passedFiltering: !!filteredEvent1564,
      inAlertSection: alertCalendarEvents.some(e => e.calendar_id === 1564),
      shouldDisplay: !!filteredEvent1564 && alertCalendarEvents.some(e => e.calendar_id === 1564)
    });
    
    console.log('Event 1565 (Marsquake - Regular):', {
      inApiResponse: !!event1565,
      passedFiltering: !!filteredEvent1565,
      inRegularSection: regularCalendarEvents.some(e => e.calendar_id === 1565),
      shouldDisplay: !!filteredEvent1565 && regularCalendarEvents.some(e => e.calendar_id === 1565)
    });
    
  } catch (error) {
    console.error('❌ Simulation failed:', error.message);
    if (error.response) {
      console.error('Response status:', error.response.status);
      console.error('Response data:', error.response.data);
    }
  }
}

simulateFrontendLogic();
