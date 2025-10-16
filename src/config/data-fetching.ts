// Configuration for UCLA Recreation data fetching

export const DATA_FETCHING_CONFIG = {
  // Set to true to use demo data instead of live data
  // Useful for development and testing
  useDemoData: process.env.NEXT_PUBLIC_USE_DEMO_DATA === 'true',
  
  // Set to true to enable web scraping from UCLA Recreation website
  // This will scrape live occupancy data from https://recreation.ucla.edu/facilities/jwc
  useScraping: process.env.NEXT_PUBLIC_USE_SCRAPING !== 'false', // Default to true unless explicitly disabled
  
  // UCLA API configuration (if they provide an official API in the future)
  apiUrl: process.env.NEXT_PUBLIC_UCLA_API_URL || 'https://api.ucla.edu/recreation',
  apiKey: process.env.NEXT_PUBLIC_UCLA_API_KEY,
  
  // Data refresh interval in milliseconds (default: 30 seconds)
  // For more real-time data, consider reducing to 10000 (10 seconds)
  refreshInterval: parseInt(process.env.NEXT_PUBLIC_REFRESH_INTERVAL || '10000'),
  
  // Web scraping configuration
  scraping: {
    jwcUrl: 'https://recreation.ucla.edu/facilities/jwc',
    timeout: 10000, // 10 seconds
    retryAttempts: 3,
    retryDelay: 1000, // 1 second
  },
  
  // Data validation settings
  validation: {
    maxOccupancyPercentage: 100,
    minOccupancyPercentage: 0,
    maxCapacity: 200, // Reasonable upper limit
    minCapacity: 1,
  }
};

// Helper function to get current configuration
export function getDataFetchingConfig() {
  return {
    ...DATA_FETCHING_CONFIG,
    isDemoMode: DATA_FETCHING_CONFIG.useDemoData,
    isScrapingEnabled: DATA_FETCHING_CONFIG.useScraping,
    isApiEnabled: !DATA_FETCHING_CONFIG.useDemoData && !DATA_FETCHING_CONFIG.useScraping,
  };
}
