// UCLA Recreation facility hours of operation
// This data is scraped from the official UCLA Recreation facility pages

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
  
  // Handle overnight hours (e.g., 6:00 AM - 12:00 AM next day)
  if (closeTime < openTime) {
    close.setDate(close.getDate() + 1);
  }
  
  return { open, close };
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
  const todayHours = hours.regularHours[dayOfWeek];
  
  if (todayHours.toLowerCase().includes('closed')) {
    return { isOpen: false, status: 'Closed today', nextChange: 'Check tomorrow' };
  }
  
  const timeRange = parseTimeString(todayHours);
  if (!timeRange) {
    return { isOpen: false, status: 'Hours not available', nextChange: 'Unknown' };
  }
  
  const isOpen = now >= timeRange.open && now <= timeRange.close;
  const nextChange = isOpen ? 
    `Closes at ${timeRange.close.toLocaleTimeString()}` : 
    `Opens at ${timeRange.open.toLocaleTimeString()}`;
  
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
  
  // Update current status
  const openStatus = isFacilityOpen(facilityName);
  hours.currentStatus = openStatus.isOpen ? 'open' : 'closed';
  
  return hours;
}

// Get all facility hours
export function getAllFacilityHours(): FacilityHours[] {
  return Object.values(FACILITY_HOURS).map(hours => {
    const openStatus = isFacilityOpen(hours.facility);
    return {
      ...hours,
      currentStatus: openStatus.isOpen ? 'open' : 'closed'
    };
  });
}
