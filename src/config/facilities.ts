// UCLA Recreation facility configurations
export interface FacilityConfig {
  id: string;
  name: string;
  iframeUrl: string;
  zones: string[];
  maxCapacities: Record<string, number>;
}

export const FACILITY_CONFIGS: Record<string, FacilityConfig> = {
  'jwc': {
    id: '802',
    name: 'John Wooden Center',
    iframeUrl: 'https://www.connect2mycloud.com/Widgets/Data/locationCount?type=bar&facility=802&key=73829a91-48cb-4b7b-bd0b-8cf4134c04cd',
    zones: ['Cardio Zone', 'Free Weight Zone', 'Functional Training Zone', 'Courtyard', 'Advanced Circuit Zone', 'Novice Circuit Zone', 'Collins Court'],
    maxCapacities: {
      'Cardio Zone': 60,
      'Free Weight Zone': 65,
      'Functional Training Zone': 40,
      'Courtyard': 45,
      'Advanced Circuit Zone': 30,
      'Novice Circuit Zone': 30,
      'Collins Court': 100
    }
  },
  // BruinFit configuration
  'bfit': {
    id: '803',
    name: 'Bruin Fitness Center',
    iframeUrl: 'https://www.connect2mycloud.com/Widgets/Data/locationCount?type=bar&facility=803&key=73829a91-48cb-4b7b-bd0b-8cf4134c04cd',
    zones: ['Cardio Zone', 'Flexibility Zone', 'Squat Zone', 'Synergy Zone', 'Selectorized Zone'],
    maxCapacities: {
      'Cardio Zone': 100, // Based on 20% occupancy with 20 people
      'Flexibility Zone': 30, // Based on 43% occupancy with 13 people
      'Squat Zone': 80, // Based on 45% occupancy with 36 people
      'Synergy Zone': 50, // Based on 48% occupancy with 24 people
      'Selectorized Zone': 50 // Based on 48% occupancy with 24 people
    }
  }
};

// Helper function to get facility config by name or ID
export function getFacilityConfig(facility: string): FacilityConfig | null {
  // Try exact match first
  if (FACILITY_CONFIGS[facility.toLowerCase()]) {
    return FACILITY_CONFIGS[facility.toLowerCase()];
  }
  
  // Try to find by name
  for (const config of Object.values(FACILITY_CONFIGS)) {
    if (config.name.toLowerCase().includes(facility.toLowerCase()) || 
        facility.toLowerCase().includes(config.name.toLowerCase())) {
      return config;
    }
  }
  
  return null;
}

// Get all available facilities
export function getAllFacilities(): FacilityConfig[] {
  return Object.values(FACILITY_CONFIGS);
}
