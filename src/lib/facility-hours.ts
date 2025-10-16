// UCLA Recreation facility hours of operation
// This data is scraped from the official UCLA Recreation facility pages
// Fixed hours calculation for overnight hours (properly handles 12:00 AM closing times)

export interface FacilityHours {
  facility: string;
  currentStatus: 'open' | 'closed' | 'unknown';
  todayHours: string;
  regularHours: {
    monday: string;
    tuesday: string;
    wednesday: string;
    thursday: string;
    friday: string;
    saturday: string;
    sunday: string;
  };
  specialHours?: string[];
  lastUpdated: string;
}

// Static hours data (scraped from UCLA Recreation website)
export const FACILITY_HOURS: Record<string, FacilityHours> = {
  'John Wooden Center': {
    facility: 'John Wooden Center',
    currentStatus: 'unknown', // Will be calculated based on current time
    todayHours: '5:15 AM - 1:00 AM', // Fall Quarter Hours
    regularHours: {
      monday: '5:15 AM - 1:00 AM',
      tuesday: '5:15 AM - 1:00 AM',
      wednesday: '5:15 AM - 1:00 AM',
      thursday: '5:15 AM - 1:00 AM',
      friday: '5:15 AM - 10:00 PM',
      saturday: '8:00 AM - 8:00 PM',
      sunday: '8:00 AM - 11:00 PM'
    },
    specialHours: [
      'Fall Quarter Hours (Current)',
      'Veteran\'s Day: 11/10: 5:15 AM - 10:00 PM, 11/11: 9:00 AM - 6:00 PM',
      'Thanksgiving: 11/26: 5:15 AM - 5:00 PM, 11/27-11/28: CLOSED, 11/29: 9:00 AM - 2:00 PM, 11/30: 9:00 AM - 6:00 PM',
      'Fall Finals: 12/8-12/11: 5:15 AM - 11:00 PM, 12/12: 5:15 AM - 8:00 PM, 12/13-14: CLOSED',
      'Winter Break: 12/15-12/23: 9:00 AM - 5:00 PM, 12/24-1/3: CLOSED',
      'NOTE: Showers close 45 minutes prior to gym closing time'
    ],
    lastUpdated: new Date().toISOString()
  },
  'Bruin Fitness Center': {
    facility: 'Bruin Fitness Center',
    currentStatus: 'unknown',
    todayHours: '6:00 AM - 12:00 AM', // Fall Hours
    regularHours: {
      monday: '6:00 AM - 12:00 AM',
      tuesday: '6:00 AM - 12:00 AM',
      wednesday: '6:00 AM - 12:00 AM',
      thursday: '6:00 AM - 12:00 AM',
      friday: '6:00 AM - 9:00 PM',
      saturday: '9:00 AM - 6:00 PM',
      sunday: '9:00 AM - 9:00 PM'
    },
    specialHours: [
      'Fall Hours (Current)',
      '11/10: 6:00 AM - 9:00 PM',
      '11/11: CLOSED',
      '11/26: 6:00 AM - 3:00 PM',
      '11/27-11/29: CLOSED',
      '11/30: 3:00 PM - 9:00 PM',
      'Fall Finals: 12/8-12/11: 6:00 AM - 11:00 PM, 12/12: 6:00 AM - 3:00 PM, 12/13-14: CLOSED',
      'Winter Break: 12/15-1/4: CLOSED'
    ],
    lastUpdated: new Date().toISOString()
  },
  'Kinross Rec Center': {
    facility: 'Kinross Rec Center',
    currentStatus: 'unknown',
    todayHours: '6:00 AM - 11:00 PM', // Fall Quarter Hours
    regularHours: {
      monday: '6:00 AM - 11:00 PM',
      tuesday: '6:00 AM - 11:00 PM',
      wednesday: '6:00 AM - 11:00 PM',
      thursday: '6:00 AM - 11:00 PM',
      friday: '6:00 AM - 9:00 PM',
      saturday: '8:00 AM - 7:00 PM',
      sunday: '8:00 AM - 7:00 PM'
    },
    specialHours: [
      'Fall Quarter Hours (Current)',
      'Veterans Day Weekend: 11/10: 6:00 AM - 9:00 PM, 11/11: CLOSED',
      'Thanksgiving Holiday: 11/26: 6:00 AM - 5:00 PM, 11/27-11/30: CLOSED',
      'Fall Finals: 12/8-12/12: 6:00 AM - 9:00 PM, 12/13-14: 9:00 AM - 6:00 PM',
      'Winter Break: 12/15-1/4: CLOSED',
      'MLK Weekend: 1/17-1/18: 9:00 AM - 6:00 PM, 1/19: CLOSED',
      'Presidents Day Weekend: 2/14-2/15: 9:00 AM - 6:00 PM, 2/16: CLOSED',
      'Spring Finals: 6/8-6/11: 6:00 AM - 9:00 PM, 6/12: 6:00 AM - 2:00 PM',
      'Commencement Weekend: 6/13-6/21: CLOSED'
    ],
    lastUpdated: new Date().toISOString()
  }
};

// Helper function to parse time string (e.g., "6:00 AM - 12:00 AM")
function parseTimeString(timeStr: string): { open: Date; close: Date } | null {
  if (timeStr.toLowerCase().includes('closed')) {
    return null;
  }
  
  const match = timeStr.match(/(\d{1,2}):(\d{2})\s*(AM|PM)\s*-\s*(\d{1,2}):(\d{2})\s*(AM|PM)/);
  if (!match) return null;
  
  const [, openHour, openMin, openPeriod, closeHour, closeMin, closePeriod] = match;
  
  const now = new Date();
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  
  // Parse open time
  let openTime = parseInt(openHour);
  if (openPeriod === 'PM' && openTime !== 12) openTime += 12;
  if (openPeriod === 'AM' && openTime === 12) openTime = 0;
  
  // Parse close time
  let closeTime = parseInt(closeHour);
  if (closePeriod === 'PM' && closeTime !== 12) closeTime += 12;
  if (closePeriod === 'AM' && closeTime === 12) closeTime = 0;
  
  const open = new Date(today.getTime() + openTime * 60 * 60 * 1000 + parseInt(openMin) * 60 * 1000);
  const close = new Date(today.getTime() + closeTime * 60 * 60 * 1000 + parseInt(closeMin) * 60 * 1000);
  
  // Handle overnight hours
  // For cases like "6:00 AM - 12:00 AM" or "6:00 AM - 1:00 AM" 
  // where closing time is after midnight but earlier in the day than the opening time
  if (closeTime < openTime || 
      (closePeriod === 'AM' && openPeriod === 'AM' && closeTime === openTime) || 
      (closePeriod === 'AM' && openPeriod === 'PM')) {
    close.setDate(close.getDate() + 1);
  }
  
  return { open, close };
}

// Check for special hours that apply today
function checkSpecialHours(specialHours: string[] | undefined): string | null {
  if (!specialHours || specialHours.length === 0) return null;
  
  const now = new Date();
  const currentMonth = now.getMonth() + 1; // JavaScript months are 0-indexed
  const currentDate = now.getDate();
  const currentYear = now.getFullYear();
  
  // Format: MM/DD
  const todayShortFormat = `${currentMonth}/${currentDate}`;
  // Check for full dates like 12/25/2025
  const todayFullFormat = `${currentMonth}/${currentDate}/${currentYear}`;
  
  for (const specialHour of specialHours) {
    // Skip title entries (no date patterns)
    if (!specialHour.match(/\d+\/\d+/) && !specialHour.includes('CLOSED')) continue;
    
    // Check for exact date matches
    if (specialHour.includes(todayShortFormat) || specialHour.includes(todayFullFormat)) {
      // Extract hours for today
      const hourMatch = specialHour.match(new RegExp(`${todayShortFormat}\s*:\s*([^,]+)`)) || 
                        specialHour.match(new RegExp(`${todayFullFormat}\s*:\s*([^,]+)`));
      
      if (hourMatch && hourMatch[1]) {
        return hourMatch[1].trim();
      }
      
      // If it just says CLOSED for today
      if (specialHour.toLowerCase().includes('closed')) {
        return 'CLOSED';
      }
    }
    
    // Check for date ranges like 11/27-11/30
    const rangeMatch = specialHour.match(/(\d+)\/(\d+)-(\d+)\/(\d+)/g);
    if (rangeMatch) {
      for (const range of rangeMatch) {
        const [startMonth, startDay, endMonth, endDay] = range.split(/[\/\-]/).map(Number);
        
        const today = new Date(currentYear, currentMonth - 1, currentDate);
        const startDate = new Date(currentYear, startMonth - 1, startDay);
        const endDate = new Date(currentYear, endMonth - 1, endDay);
        
        // Check if today falls within the range
        if (today >= startDate && today <= endDate) {
          // Find specific hours or if it's closed
          if (specialHour.toLowerCase().includes('closed')) {
            return 'CLOSED';
          }
          
          // Try to extract specific hours for this date range
          const hoursMatch = specialHour.match(/[^:]+:\s*([^,]+)/i);
          if (hoursMatch && hoursMatch[1]) {
            return hoursMatch[1].trim();
          }
        }
      }
    }
  }
  
  return null; // No special hours found for today
}

// Get the next day's hours
function getNextDayHours(facilityName: string): string {
  const hours = FACILITY_HOURS[facilityName];
  if (!hours) return 'Unknown';
  
  const now = new Date();
  const tomorrow = new Date(now);
  tomorrow.setDate(tomorrow.getDate() + 1);
  
  const dayNames = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'];
  const nextDayOfWeek = dayNames[tomorrow.getDay()] as keyof typeof hours.regularHours;
  
  return hours.regularHours[nextDayOfWeek];
}

// Format time for display
function formatTimeForDisplay(date: Date): string {
  return date.toLocaleTimeString('en-US', { 
    hour: 'numeric', 
    minute: '2-digit',
    hour12: true 
  });
}

// Check if facility is currently open
export function isFacilityOpen(facilityName: string): { isOpen: boolean; status: string; nextChange: string } {
  const hours = FACILITY_HOURS[facilityName];
  if (!hours) {
    return { isOpen: false, status: 'Hours not available', nextChange: 'Unknown' };
  }
  
  const now = new Date();
  const dayNames = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'];
  const dayOfWeek = dayNames[now.getDay()] as keyof typeof hours.regularHours;
  
  // Check for special hours first
  const todaySpecialHours = checkSpecialHours(hours.specialHours);
  const todayHours = todaySpecialHours || hours.regularHours[dayOfWeek];
  
  // Handle CLOSED case
  if (todayHours.toLowerCase().includes('closed')) {
    // Get next day's hours for better user info
    const nextDayHours = getNextDayHours(facilityName);
    const nextDay = new Date(now);
    nextDay.setDate(nextDay.getDate() + 1);
    const nextDayName = dayNames[nextDay.getDay()];
    
    return { 
      isOpen: false, 
      status: 'Closed today', 
      nextChange: nextDayHours.toLowerCase().includes('closed') ? 
        `Closed tomorrow (${nextDayName})` : 
        `Opens tomorrow (${nextDayName}) at ${nextDayHours.split('-')[0].trim()}`
    };
  }
  
  const timeRange = parseTimeString(todayHours);
  if (!timeRange) {
    return { isOpen: false, status: 'Hours not available', nextChange: 'Unknown' };
  }
  
  const isOpen = now >= timeRange.open && now <= timeRange.close;
  
  // Calculate time difference for better user experience
  let nextChange = '';
  if (isOpen) {
    const minutesUntilClose = Math.round((timeRange.close.getTime() - now.getTime()) / 60000);
    if (minutesUntilClose <= 60) {
      nextChange = `Closes in ${minutesUntilClose} minute${minutesUntilClose !== 1 ? 's' : ''}`;
    } else {
      nextChange = `Closes at ${formatTimeForDisplay(timeRange.close)}`;
    }
  } else {
    if (now < timeRange.open) {
      const minutesUntilOpen = Math.round((timeRange.open.getTime() - now.getTime()) / 60000);
      if (minutesUntilOpen <= 60) {
        nextChange = `Opens in ${minutesUntilOpen} minute${minutesUntilOpen !== 1 ? 's' : ''}`;
      } else {
        nextChange = `Opens at ${formatTimeForDisplay(timeRange.open)}`;
      }
    } else {
      // After closing time, show next day's hours
      const nextDayHours = getNextDayHours(facilityName);
      const nextDay = new Date(now);
      nextDay.setDate(nextDay.getDate() + 1);
      const nextDayName = dayNames[nextDay.getDay()];
      
      nextChange = nextDayHours.toLowerCase().includes('closed') ? 
        `Closed tomorrow (${nextDayName})` : 
        `Opens tomorrow (${nextDayName}) at ${nextDayHours.split('-')[0].trim()}`;
    }
  }
  
  return {
    isOpen,
    status: isOpen ? 'Open' : 'Closed',
    nextChange
  };
}

// Get hours for a specific facility
export function getFacilityHours(facilityName: string): FacilityHours | null {
  const hours = FACILITY_HOURS[facilityName];
  if (!hours) return null;
  
  // Get today's date info
  const now = new Date();
  const dayNames = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'];
  const dayOfWeek = dayNames[now.getDay()] as keyof typeof hours.regularHours;
  
  // Check for special hours
  const specialHoursToday = checkSpecialHours(hours.specialHours);
  
  // Create a copy of the hours object so we don't modify the original data
  const currentHours = { ...hours };
  
  // Update with the most current information
  if (specialHoursToday) {
    currentHours.todayHours = specialHoursToday;
  } else {
    currentHours.todayHours = hours.regularHours[dayOfWeek];
  }
  
  // Update current status
  const openStatus = isFacilityOpen(facilityName);
  currentHours.currentStatus = openStatus.isOpen ? 'open' : 'closed';
  currentHours.lastUpdated = new Date().toISOString();
  
  return currentHours;
}

// Get all facility hours
export function getAllFacilityHours(): FacilityHours[] {
  return Object.keys(FACILITY_HOURS).map(facilityName => {
    // Use the getFacilityHours function to get consistent results
    const facilityHours = getFacilityHours(facilityName);
    if (!facilityHours) {
      // This should never happen since we're iterating over keys in FACILITY_HOURS
      console.error(`Failed to get hours for ${facilityName}`);
      return {
        ...FACILITY_HOURS[facilityName],
        currentStatus: 'unknown',
        lastUpdated: new Date().toISOString()
      };
    }
    
    return facilityHours;
  });
}
