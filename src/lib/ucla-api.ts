// UCLA Recreation GoBoard API client
// This is the official API that UCLA uses for their occupancy tracking

import { getFacilityHours, isFacilityOpen } from './facility-hours';

export interface UCLAOccupancyData {
  LocationId: number;
  TotalCapacity: number;
  LocationName: string;
  CountOfParticipants: number;
  PercetageCapacity: number;
  LastUpdatedDateAndTime: string;
  LastCount: number;
  MinColor: string;
  MidColor: string | null;
  MaxColor: string;
  MinCapacityRange: number;
  MaxCapacityRange: number;
  CountCapacityColorEnabled: boolean;
  FacilityId: number;
  FacilityName: string;
  IsClosed: boolean;
}

export interface ProcessedOccupancyData {
  facility: string;
  zone: string;
  currentOccupancy: number;
  maxCapacity: number;
  occupancyPercentage: number;
  lastUpdated: string;
  status: 'Low' | 'Moderate' | 'High' | 'Closed';
  isClosed: boolean;
}

export interface FacilityWithHours {
  name: string;
  zones: ProcessedOccupancyData[];
  hours: {
    currentStatus: 'open' | 'closed' | 'unknown';
    todayHours: string;
    nextChange: string;
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
  };
  lastUpdated: string;
}

// UCLA GoBoard API configuration
const UCLA_API_CONFIG = {
  baseUrl: 'https://goboardapi.azurewebsites.net/api/FacilityCount/GetCountsByAccount',
  apiKey: '73829a91-48cb-4b7b-bd0b-8cf4134c04cd',
  timeout: 10000
};

// Fetch live occupancy data from UCLA's official API
export async function fetchUCLALiveOccupancyData(): Promise<ProcessedOccupancyData[]> {
  try {
    console.log('Fetching live occupancy data from UCLA GoBoard API...');
    
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), UCLA_API_CONFIG.timeout);
    
    const response = await fetch(
      `${UCLA_API_CONFIG.baseUrl}?AccountAPIKey=${UCLA_API_CONFIG.apiKey}`,
      {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          'User-Agent': 'UCLA Recreation Check App'
        },
        signal: controller.signal
      }
    );
    
    clearTimeout(timeoutId);
    
    if (!response.ok) {
      throw new Error(`UCLA API request failed: ${response.status} ${response.statusText}`);
    }
    
    const data: UCLAOccupancyData[] = await response.json();
    console.log(`Received ${data.length} occupancy records from UCLA API`);
    
    // Process the data into our format
    const processedData: ProcessedOccupancyData[] = data.map(item => {
      const occupancyPercentage = Math.round((item.LastCount / item.TotalCapacity) * 100);
      
      // Determine status based on percentage
      let status: 'Low' | 'Moderate' | 'High' | 'Closed';
      if (item.IsClosed) {
        status = 'Closed';
      } else if (occupancyPercentage < 40) {
        status = 'Low';
      } else if (occupancyPercentage < 70) {
        status = 'Moderate';
      } else {
        status = 'High';
      }
      
      return {
        facility: item.FacilityName.replace(' - FITWELL', ''), // Clean up facility name
        zone: item.LocationName,
        currentOccupancy: item.LastCount,
        maxCapacity: item.TotalCapacity,
        occupancyPercentage,
        lastUpdated: item.LastUpdatedDateAndTime,
        status,
        isClosed: item.IsClosed
      };
    });
    
    console.log('Successfully processed UCLA API data');
    return processedData;
    
  } catch (error) {
    console.error('Error fetching UCLA API data:', error);
    throw error;
  }
}

// Group occupancy data by facility
export function groupOccupancyByFacility(data: ProcessedOccupancyData[]): Record<string, ProcessedOccupancyData[]> {
  return data.reduce((groups, item) => {
    if (!groups[item.facility]) {
      groups[item.facility] = [];
    }
    groups[item.facility].push(item);
    return groups;
  }, {} as Record<string, ProcessedOccupancyData[]>);
}

// Get occupancy data for a specific facility
export function getFacilityOccupancy(data: ProcessedOccupancyData[], facilityName: string): ProcessedOccupancyData[] {
  return data.filter(item => 
    item.facility.toLowerCase().includes(facilityName.toLowerCase()) ||
    facilityName.toLowerCase().includes(item.facility.toLowerCase())
  );
}

// Fetch occupancy data with hours of operation
export async function fetchOccupancyWithHours(): Promise<FacilityWithHours[]> {
  try {
    console.log('Fetching occupancy data with hours of operation...');
    
    // Get occupancy data
    const occupancyData = await fetchUCLALiveOccupancyData();
    
    // Group by facility
    const groupedData = groupOccupancyByFacility(occupancyData);
    
    // Add hours information
    const facilitiesWithHours: FacilityWithHours[] = Object.entries(groupedData).map(([facilityName, zones]) => {
      const hours = getFacilityHours(facilityName);
      const openStatus = isFacilityOpen(facilityName);
      
      return {
        name: facilityName,
        zones,
        hours: {
          currentStatus: hours?.currentStatus || 'unknown',
          todayHours: hours?.todayHours || 'Hours not available',
          nextChange: openStatus.nextChange,
          regularHours: hours?.regularHours || {
            monday: 'Hours not available',
            tuesday: 'Hours not available',
            wednesday: 'Hours not available',
            thursday: 'Hours not available',
            friday: 'Hours not available',
            saturday: 'Hours not available',
            sunday: 'Hours not available'
          },
          specialHours: hours?.specialHours
        },
        lastUpdated: new Date().toISOString()
      };
    });
    
    console.log('Successfully fetched occupancy data with hours');
    return facilitiesWithHours;
    
  } catch (error) {
    console.error('Error fetching occupancy data with hours:', error);
    throw error;
  }
}
