// Client-side API client for UCLA Recreation occupancy data
export interface OccupancyData {
  facility: string;
  zone: string;
  currentOccupancy: number;
  maxCapacity: number;
  occupancyPercentage: number;
  lastUpdated: string;
  status: 'Low' | 'Moderate' | 'High' | 'Closed';
}

export interface FacilityData {
  name: string;
  zones: OccupancyData[];
  lastUpdated: string;
}

export interface ApiResponse {
  success: boolean;
  data?: FacilityData[];
  error?: string;
  timestamp: string;
}

// Fetch live occupancy data from the API route
export async function fetchLiveOccupancyData(facilityId?: string): Promise<FacilityData[]> {
  try {
    const url = facilityId ? `/api/occupancy?facility=${encodeURIComponent(facilityId)}` : '/api/occupancy';
    
    const response = await fetch(url, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      throw new Error(`API request failed: ${response.status} ${response.statusText}`);
    }

    const result: ApiResponse = await response.json();
    
    if (!result.success) {
      throw new Error(result.error || 'API returned unsuccessful response');
    }

    if (!result.data) {
      throw new Error('No data received from API');
    }

    return result.data;

  } catch (error) {
    console.error('Error fetching live occupancy data:', error);
    throw error;
  }
}

// Health check function
export async function checkApiHealth(): Promise<{
  isHealthy: boolean;
  responseTime?: number;
  error?: string;
}> {
  const startTime = Date.now();
  
  try {
    const response = await fetch('/api/occupancy', {
      method: 'GET',
      headers: { 'Content-Type': 'application/json' },
    });

    const responseTime = Date.now() - startTime;
    
    if (response.ok) {
      const result: ApiResponse = await response.json();
      return {
        isHealthy: result.success,
        responseTime,
        error: result.success ? undefined : result.error
      };
    } else {
      return {
        isHealthy: false,
        responseTime,
        error: `HTTP ${response.status}`
      };
    }

  } catch (error) {
    return {
      isHealthy: false,
      responseTime: Date.now() - startTime,
      error: error instanceof Error ? error.message : 'Unknown error'
    };
  }
}
