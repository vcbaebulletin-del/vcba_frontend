// EMERGENCY DEBUG - Check exactly what's happening with calendar events
const axios = require('axios');

async function emergencyDebug() {
  console.log('🚨 EMERGENCY DEBUG - CALENDAR EVENTS');
  console.log('====================================');
  
  try {
    // 1. Check if backend is working
    const calendarResponse = await axios.get('http://localhost:5000/api/calendar?limit=50&sort_by=event_date&sort_order=ASC');
    const events = calendarResponse.data.data.events || [];
    
    console.log('📊 BACKEND STATUS:');
    console.log('Total events from API:', events.length);
    
    const event1564 = events.find(e => e.calendar_id === 1564);
    const event1565 = events.find(e => e.calendar_id === 1565);
    
    console.log('Event 1564 (Earthquake):', event1564 ? 'FOUND' : 'NOT FOUND');
    console.log('Event 1565 (Marsquake):', event1565 ? 'FOUND' : 'NOT FOUND');
    
    if (event1564) {
      console.log('Event 1564 details:', {
        title: event1564.title,
        is_active: event1564.is_active,
        is_alert: event1564.is_alert,
        event_date: event1564.event_date,
        end_date: event1564.end_date
      });
    }
    
    if (event1565) {
      console.log('Event 1565 details:', {
        title: event1565.title,
        is_active: event1565.is_active,
        is_alert: event1565.is_alert,
        event_date: event1565.event_date,
        end_date: event1565.end_date
      });
    }
    
    // 2. Test date filtering logic
    console.log('\n📅 DATE FILTERING TEST:');
    const today = new Date();
    const todayString = today.getFullYear() + '-' + 
      String(today.getMonth() + 1).padStart(2, '0') + '-' + 
      String(today.getDate()).padStart(2, '0');
    
    console.log('Today date string:', todayString);
    
    [event1564, event1565].forEach(event => {
      if (!event) return;
      
      const eventStart = new Date(event.event_date);
      const eventStartString = eventStart.getFullYear() + '-' + 
        String(eventStart.getMonth() + 1).padStart(2, '0') + '-' + 
        String(eventStart.getDate()).padStart(2, '0');
      
      const eventEndString = event.end_date ? (() => {
        const endDate = new Date(event.end_date);
        return endDate.getFullYear() + '-' + 
          String(endDate.getMonth() + 1).padStart(2, '0') + '-' + 
          String(endDate.getDate()).padStart(2, '0');
      })() : eventStartString;
      
      const isActive = todayString >= eventStartString && todayString <= eventEndString;
      
      console.log(`Event ${event.calendar_id}:`, {
        startDate: eventStartString,
        endDate: eventEndString,
        isInDateRange: isActive,
        isActiveFlag: Boolean(event.is_active),
        shouldShow: isActive && Boolean(event.is_active)
      });
    });
    
    // 3. Quick fix suggestion
    console.log('\n🔧 QUICK FIX ANALYSIS:');
    
    const activeEvents = events.filter(e => {
      const today = new Date();
      const todayString = today.getFullYear() + '-' + 
        String(today.getMonth() + 1).padStart(2, '0') + '-' + 
        String(today.getDate()).padStart(2, '0');
      
      const eventStart = new Date(e.event_date);
      const eventStartString = eventStart.getFullYear() + '-' + 
        String(eventStart.getMonth() + 1).padStart(2, '0') + '-' + 
        String(eventStart.getDate()).padStart(2, '0');
      
      const eventEndString = e.end_date ? (() => {
        const endDate = new Date(e.end_date);
        return endDate.getFullYear() + '-' + 
          String(endDate.getMonth() + 1).padStart(2, '0') + '-' + 
          String(endDate.getDate()).padStart(2, '0');
      })() : eventStartString;
      
      const isInRange = todayString >= eventStartString && todayString <= eventEndString;
      return isInRange && Boolean(e.is_active);
    });
    
    console.log('Events that should be visible:', activeEvents.length);
    console.log('Target events in filtered list:', 
      activeEvents.filter(e => e.calendar_id === 1564 || e.calendar_id === 1565).length);
    
    if (activeEvents.length === 0) {
      console.log('❌ NO EVENTS PASS DATE FILTERING - This is the problem!');
    } else {
      console.log('✅ Events pass filtering, issue might be in frontend rendering');
    }
    
  } catch (error) {
    console.error('❌ Emergency debug failed:', error.message);
  }
}

emergencyDebug();
