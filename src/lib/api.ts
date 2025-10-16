// api client for UCLA Recreation occupancy data
import * as cheerio from 'cheerio';
import puppeteer from 'puppeteer';
import { DATA_FETCHING_CONFIG } from '@/config/data-fetching';

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

// demo data for development when API is not available (only used if explicitly enabled)
const DEMO_FACILITIES: FacilityData[] = [
  {
    name: "John Wooden Center",
    lastUpdated: new Date().toISOString(),
    zones: [
      {
        facility: "John Wooden Center",
        zone: "Cardio Zone",
        currentOccupancy: 25,
        maxCapacity: 60,
        occupancyPercentage: 42,
        lastUpdated: new Date().toISOString(),
        status: "Moderate"
      },
      {
        facility: "John Wooden Center", 
        zone: "Free Weight Zone",
        currentOccupancy: 36,
        maxCapacity: 65,
        occupancyPercentage: 55,
        lastUpdated: new Date().toISOString(),
        status: "Moderate"
      },
      {
        facility: "John Wooden Center",
        zone: "Functional Training Zone",
        currentOccupancy: 12,
        maxCapacity: 40,
        occupancyPercentage: 30,
        lastUpdated: new Date().toISOString(),
        status: "Low"
      },
      {
        facility: "John Wooden Center",
        zone: "Courtyard",
        currentOccupancy: 16,
        maxCapacity: 45,
        occupancyPercentage: 36,
        lastUpdated: new Date().toISOString(),
        status: "Low"
      }
    ]
  }
];

// Use centralized configuration
const API_CONFIG = DATA_FETCHING_CONFIG;

// Utility function to determine occupancy status
export function getOccupancyStatus(percentage: number): 'Low' | 'Moderate' | 'High' | 'Closed' {
  if (percentage === 0) return 'Closed';
  if (percentage < 40) return 'Low';
  if (percentage < 70) return 'Moderate';
  return 'High';
}

// Utility function to validate occupancy data
export function validateOccupancyData(data: unknown): data is OccupancyData {
  if (!data || typeof data !== 'object') return false;
  
  const d = data as Record<string, unknown>;
  return (
    typeof d.facility === 'string' &&
    typeof d.zone === 'string' &&
    typeof d.currentOccupancy === 'number' &&
    typeof d.maxCapacity === 'number' &&
    typeof d.occupancyPercentage === 'number' &&
    (d.currentOccupancy as number) >= 0 &&
    (d.maxCapacity as number) > 0 &&
    (d.occupancyPercentage as number) >= 0 &&
    (d.occupancyPercentage as number) <= 100 &&
    typeof d.status === 'string' &&
    ['Low', 'Moderate', 'High', 'Closed'].includes(d.status as string)
  );
}

// Utility function to validate facility data
export function validateFacilityData(data: unknown): data is FacilityData {
  if (!data || typeof data !== 'object') return false;
  
  const d = data as Record<string, unknown>;
  return (
    typeof d.name === 'string' &&
    Array.isArray(d.zones) &&
    d.zones.every(validateOccupancyData) &&
    typeof d.lastUpdated === 'string'
  );
}

// Web scraping functions for UCLA Recreation live occupancy data
async function scrapeJWCOccupancyData(): Promise<FacilityData[]> {
  try {
    console.log('Starting web scraping for JWC occupancy data...');
    
    // Launch puppeteer browser
    const browser = await puppeteer.launch({
      headless: true,
      args: ['--no-sandbox', '--disable-setuid-sandbox']
    });
    
    const page = await browser.newPage();
    
    // Set user agent to avoid blocking
    await page.setUserAgent('Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36');
    
    // Navigate to the JWC page
    await page.goto(API_CONFIG.scraping.jwcUrl, { 
      waitUntil: 'networkidle2',
      timeout: API_CONFIG.scraping.timeout 
    });
    
    // Wait for the occupancy data to load (look for the Location Count section)
    await page.waitForSelector('[class*="location"], [class*="count"], [class*="occupancy"]', { timeout: 5000 }).catch(() => {
      console.log('Occupancy data selector not found, proceeding with page content...');
    });
    
    // Get the page content
    const content = await page.content();
    await browser.close();
    
    // Parse the HTML content
    const $ = cheerio.load(content);
    
    // Look for the occupancy data in various possible selectors
    const occupancyData: OccupancyData[] = [];
    
    // Try to find the Location Count section
    const locationCountSection = $('*:contains("Location Count")').closest('div, section, table');
    
    if (locationCountSection.length > 0) {
      console.log('Found Location Count section, parsing data...');
      
      // Look for zone data within the section
      locationCountSection.find('tr, div, li').each((index, element) => {
        const $element = $(element);
        const text = $element.text().trim();
        
        // Skip if this doesn't look like a zone entry
        if (!text.includes('Zone') && !text.includes('Court') && !text.includes('Courtyard')) {
          return;
        }
        
        // Extract zone name (look for patterns like "Cardio Zone", "Free Weight Zone", etc.)
        const zoneMatch = text.match(/([A-Za-z\s]+(?:Zone|Court|Courtyard))/);
        if (!zoneMatch) return;
        
        const zoneName = zoneMatch[1].trim();
        
        // Extract status (Open/Closed)
        const isOpen = text.includes('(Open)') || text.includes('Open');
        // eslint-disable-next-line @typescript-eslint/no-unused-vars
        const status = isOpen ? 'Open' : 'Closed';
        
        // Extract count (look for numbers)
        const countMatch = text.match(/Last Count[:\s]*(\d+)/i) || text.match(/(\d+)\s*(?:people|count)/i);
        const currentOccupancy = countMatch ? parseInt(countMatch[1]) : 0;
        
        // Extract percentage
        const percentageMatch = text.match(/(\d+)%/);
        const occupancyPercentage = percentageMatch ? parseInt(percentageMatch[1]) : 0;
        
        // Extract timestamp
        const timestampMatch = text.match(/(\d{1,2}\/\d{1,2}\/\d{4}\s+\d{1,2}:\d{2}\s+[AP]M)/);
        const lastUpdated = timestampMatch ? timestampMatch[1] : new Date().toISOString();
        
        // Estimate max capacity based on typical gym zone capacities
        let maxCapacity = 50; // default
        if (zoneName.includes('Cardio')) maxCapacity = 60;
        else if (zoneName.includes('Free Weight')) maxCapacity = 65;
        else if (zoneName.includes('Functional')) maxCapacity = 40;
        else if (zoneName.includes('Courtyard')) maxCapacity = 45;
        else if (zoneName.includes('Circuit')) maxCapacity = 30;
        else if (zoneName.includes('Court')) maxCapacity = 100;
        
        // Calculate occupancy status
        const calculatedStatus = getOccupancyStatus(occupancyPercentage);
        
        occupancyData.push({
          facility: 'John Wooden Center',
          zone: zoneName,
          currentOccupancy,
          maxCapacity,
          occupancyPercentage,
          lastUpdated: new Date(lastUpdated).toISOString(),
          status: calculatedStatus
        });
      });
    }
    
    // If we didn't find data in the expected format, try alternative parsing
    if (occupancyData.length === 0) {
      console.log('Standard parsing failed, trying alternative methods...');
      
      // Look for any text that contains occupancy information
      $('*').each((index, element) => {
        const $element = $(element);
        const text = $element.text();
        
        // Look for patterns like "Cardio Zone (Open) Last Count: 25 Updated: 10/15/2025 04:38 PM 42%"
        const occupancyPattern = /([A-Za-z\s]+(?:Zone|Court|Courtyard))\s*\(([^)]+)\)\s*Last Count[:\s]*(\d+)\s*Updated[:\s]*([^%]+)\s*(\d+)%/g;
        let match;
        
        while ((match = occupancyPattern.exec(text)) !== null) {
          const [, zoneName, statusText, count, timestamp, percentage] = match;
          
          // eslint-disable-next-line @typescript-eslint/no-unused-vars
          const isOpen = statusText.toLowerCase().includes('open');
          const currentOccupancy = parseInt(count);
          const occupancyPercentage = parseInt(percentage);
          
          // Estimate max capacity
          let maxCapacity = 50;
          if (zoneName.includes('Cardio')) maxCapacity = 60;
          else if (zoneName.includes('Free Weight')) maxCapacity = 65;
          else if (zoneName.includes('Functional')) maxCapacity = 40;
          else if (zoneName.includes('Courtyard')) maxCapacity = 45;
          else if (zoneName.includes('Circuit')) maxCapacity = 30;
          else if (zoneName.includes('Court')) maxCapacity = 100;
          
          occupancyData.push({
            facility: 'John Wooden Center',
            zone: zoneName.trim(),
            currentOccupancy,
            maxCapacity,
            occupancyPercentage,
            lastUpdated: new Date(timestamp.trim()).toISOString(),
            status: getOccupancyStatus(occupancyPercentage)
          });
        }
      });
    }
    
    if (occupancyData.length > 0) {
      console.log(`Successfully scraped ${occupancyData.length} zones from JWC page`);
      return [{
        name: 'John Wooden Center',
        zones: occupancyData,
        lastUpdated: new Date().toISOString()
      }];
    } else {
      console.log('No occupancy data found on the page');
      throw new Error('No occupancy data found on the JWC page');
    }
    
  } catch (error) {
    console.error('Error scraping JWC occupancy data:', error);
    throw error;
  }
}

// Fetch live occupancy data from UCLA API or web scraping
export async function fetchLiveOccupancyData(): Promise<FacilityData[]> {
  // Use demo data only if explicitly enabled
  if (API_CONFIG.useDemoData) {
    console.log('Using demo data (explicitly enabled)');
    return DEMO_FACILITIES;
  }

  // Try web scraping first if enabled
  if (API_CONFIG.useScraping) {
    try {
      console.log('Attempting to scrape live occupancy data from UCLA Recreation website...');
      const scrapedData = await scrapeJWCOccupancyData();
      
      if (scrapedData && scrapedData.length > 0) {
        console.log('Successfully scraped live occupancy data');
        return scrapedData;
      }
    } catch (scrapingError) {
      console.error('Web scraping failed:', scrapingError);
      console.log('Falling back to API...');
    }
  }

  // Try API if scraping is not enabled or failed
  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), API_CONFIG.scraping.timeout);

    const response = await fetch(`${API_CONFIG.apiUrl}/occupancy`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        // Add any required headers for UCLA API
        // 'Authorization': `Bearer ${process.env.NEXT_PUBLIC_UCLA_API_KEY}`,
      },
      signal: controller.signal,
    });

    clearTimeout(timeoutId);

    if (!response.ok) {
      throw new Error(`API request failed: ${response.status} ${response.statusText}`);
    }

    const data = await response.json();
    
    // Validate the response data
    if (!Array.isArray(data) || !data.every(validateFacilityData)) {
      throw new Error('Invalid data format received from API');
    }

    console.log('Successfully fetched live occupancy data from API:', data);
    return data;

  } catch (error) {
    console.error('Error fetching live occupancy data from API:', error);
    
    // If both scraping and API fail, throw an error instead of falling back to demo data
    throw new Error('Unable to fetch live occupancy data. Both web scraping and API failed.');
  }
}

// Fetch historical occupancy data (for trends and analytics)
export async function fetchHistoricalOccupancyData(
  facility?: string,
  zone?: string,
  startDate?: Date,
  endDate?: Date
): Promise<Record<string, unknown>[]> {
  // Use demo historical data only if explicitly enabled
  if (API_CONFIG.useDemoData) {
    console.log('Using demo historical data (explicitly enabled)');
    return generateDemoHistoricalData(facility, zone, startDate, endDate);
  }

  try {
    const params = new URLSearchParams();
    if (facility) params.append('facility', facility);
    if (zone) params.append('zone', zone);
    if (startDate) params.append('startDate', startDate.toISOString());
    if (endDate) params.append('endDate', endDate.toISOString());

    const response = await fetch(`${API_CONFIG.apiUrl}/historical?${params}`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      throw new Error(`Historical data request failed: ${response.status}`);
    }

    return await response.json();

  } catch (error) {
    console.error('Error fetching historical data:', error);
    throw new Error('Unable to fetch historical occupancy data. API is not available.');
  }
}

// Generate demo historical data for development
function generateDemoHistoricalData(
  facility?: string,
  zone?: string,
  startDate?: Date,
  endDate?: Date
): Record<string, unknown>[] {
  const data = [];
  const now = new Date();
  const start = startDate || new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000); // 7 days ago
  const end = endDate || now;

  // Generate hourly data points
  for (let time = start.getTime(); time <= end.getTime(); time += 60 * 60 * 1000) {
    const hour = new Date(time).getHours();
    
    // Simulate realistic occupancy patterns
    let baseOccupancy = 0;
    if (hour >= 6 && hour <= 10) baseOccupancy = 0.3; // Morning rush
    else if (hour >= 11 && hour <= 14) baseOccupancy = 0.2; // Lunch time
    else if (hour >= 15 && hour <= 22) baseOccupancy = 0.7; // Evening peak
    else baseOccupancy = 0.1; // Late night/early morning

    // Add some randomness
    const variation = (Math.random() - 0.5) * 0.3;
    const occupancy = Math.max(0, Math.min(1, baseOccupancy + variation));

    data.push({
      timestamp: new Date(time).toISOString(),
      facility: facility || 'John Wooden Center',
      zone: zone || 'Cardio',
      occupancyPercentage: Math.round(occupancy * 100),
      currentOccupancy: Math.round(occupancy * 40), // Assuming 40 max capacity
      maxCapacity: 40
    });
  }

  return data;
}

// Health check function to verify API connectivity
export async function checkApiHealth(): Promise<{
  isHealthy: boolean;
  responseTime?: number;
  error?: string;
}> {
  // If using demo data, consider it always healthy
  if (API_CONFIG.useDemoData) {
    return { isHealthy: true, responseTime: 0 };
  }

  const startTime = Date.now();
  
  try {
    const response = await fetch(`${API_CONFIG.apiUrl}/health`, {
      method: 'GET',
      headers: { 'Content-Type': 'application/json' },
    });

    const responseTime = Date.now() - startTime;
    
    return {
      isHealthy: response.ok,
      responseTime,
      error: response.ok ? undefined : `HTTP ${response.status}`
    };

  } catch (error) {
    return {
      isHealthy: false,
      responseTime: Date.now() - startTime,
      error: error instanceof Error ? error.message : 'Unknown error'
    };
  }
}
