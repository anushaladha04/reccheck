// Server-side API functions for UCLA Recreation occupancy data
import * as cheerio from 'cheerio';
import puppeteer from 'puppeteer';
import { DATA_FETCHING_CONFIG } from '@/config/data-fetching';
// eslint-disable-next-line @typescript-eslint/no-unused-vars
import { getFacilityConfig, getAllFacilities, type FacilityConfig } from '@/config/facilities';
// eslint-disable-next-line @typescript-eslint/no-unused-vars
import { fetchUCLALiveOccupancyData, groupOccupancyByFacility, getFacilityOccupancy } from '@/lib/ucla-api';

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

// Demo data for development when API is not available (only used if explicitly enabled)
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

// Web scraping functions for UCLA Recreation live occupancy data
async function scrapeFacilityOccupancyData(facilityId?: string): Promise<FacilityData[]> {
  try {
    // Get facility configuration
    const facilityConfig = facilityId ? getFacilityConfig(facilityId) : getFacilityConfig('jwc');
    
    if (!facilityConfig) {
      throw new Error(`Facility configuration not found for: ${facilityId || 'jwc'}`);
    }
    
    console.log(`Starting web scraping for ${facilityConfig.name} occupancy data...`);
    console.log('Configuration:', { useScraping: API_CONFIG.useScraping, useDemoData: API_CONFIG.useDemoData });
    
    // Check if iframe URL is configured
    if (facilityConfig.iframeUrl === 'TBD') {
      throw new Error(`Facility ${facilityConfig.name} iframe URL not configured yet. Please provide the iframe URL.`);
    }
    
    // Launch puppeteer browser
    const browser = await puppeteer.launch({
      headless: true,
      args: ['--no-sandbox', '--disable-setuid-sandbox']
    });
    
    const page = await browser.newPage();
    
    // Set user agent to avoid blocking
    await page.setUserAgent('Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36');
    
    // Navigate directly to the iframe URL to get the occupancy data
    const iframeUrl = facilityConfig.iframeUrl;
    
    await page.goto(iframeUrl, { 
      waitUntil: 'networkidle2',
      timeout: API_CONFIG.scraping.timeout 
    });
    
    // Wait for content to load
    await new Promise(resolve => setTimeout(resolve, 5000));
    
    // Get the page content
    const content = await page.content();
    await browser.close();
    
    // Parse the HTML content
    const $ = cheerio.load(content);
    
    // Look for the occupancy data in the iframe content
    const occupancyData: OccupancyData[] = [];
    
    console.log('Parsing iframe content for occupancy data...');
    
    // Look for bar chart containers that contain the occupancy data
    $('.barChart').each((index, element) => {
      const $element = $(element);
      const html = $element.html();
      
      if (!html) return;
      
      // Extract zone name from the HTML
      const zoneMatch = html.match(/([A-Za-z\s]+(?:Zone|Court|Courtyard))/);
      if (!zoneMatch) return;
      
      const zoneName = zoneMatch[1].trim();
      
      // Extract status (Open/Closed)
      const isOpen = html.includes('(Open)') || html.includes('color:green');
      // eslint-disable-next-line @typescript-eslint/no-unused-vars
      const status = isOpen ? 'Open' : 'Closed';
      
      // Extract count
      const countMatch = html.match(/Last Count:\s*(\d+)/);
      const currentOccupancy = countMatch ? parseInt(countMatch[1]) : 0;
      
      // Extract percentage
      const percentageMatch = html.match(/(\d+)%/);
      const occupancyPercentage = percentageMatch ? parseInt(percentageMatch[1]) : 0;
      
      // Get max capacity from facility configuration
      const maxCapacity = facilityConfig.maxCapacities[zoneName] || 50; // default fallback
      
      // Calculate occupancy status
      const calculatedStatus = getOccupancyStatus(occupancyPercentage);
      
        occupancyData.push({
          facility: facilityConfig.name,
          zone: zoneName,
          currentOccupancy,
          maxCapacity,
          occupancyPercentage,
          lastUpdated: new Date().toISOString(), // Use current time since we don't have timestamp in iframe
          status: calculatedStatus
        });
      
      console.log(`Found zone: ${zoneName}, Occupancy: ${currentOccupancy}, Percentage: ${occupancyPercentage}%`);
    });
    
    // If we didn't find data in bar charts, try alternative parsing
    if (occupancyData.length === 0) {
      console.log('Bar chart parsing failed, trying alternative methods...');
      
      // Look for any text that contains occupancy information
      const text = $('body').text();
      const lines = text.split('\n').map(line => line.trim()).filter(line => line.length > 0);
      
      for (const line of lines) {
        // Look for patterns like "Cardio Zone (Open) Last Count: 25 42%"
        const occupancyPattern = /([A-Za-z\s]+(?:Zone|Court|Courtyard))\s*\(([^)]+)\)\s*Last Count:\s*(\d+)\s*(\d+)%/;
        const match = line.match(occupancyPattern);
        
        if (match) {
          const [, zoneName, statusText, count, percentage] = match;
          
          // eslint-disable-next-line @typescript-eslint/no-unused-vars
          const isOpen = statusText.toLowerCase().includes('open');
          const currentOccupancy = parseInt(count);
          const occupancyPercentage = parseInt(percentage);
          
          // Get max capacity from facility configuration
          const maxCapacity = facilityConfig.maxCapacities[zoneName.trim()] || 50;
          
          occupancyData.push({
            facility: facilityConfig.name,
            zone: zoneName.trim(),
            currentOccupancy,
            maxCapacity,
            occupancyPercentage,
            lastUpdated: new Date().toISOString(),
            status: getOccupancyStatus(occupancyPercentage)
          });
        }
      }
    }
    
    if (occupancyData.length > 0) {
      console.log(`Successfully scraped ${occupancyData.length} zones from JWC page`);
      console.log('Scraped data:', occupancyData);
      return [{
        name: facilityConfig.name,
        zones: occupancyData,
        lastUpdated: new Date().toISOString()
      }];
    } else {
      console.log('No occupancy data found on the page');
      console.log('Content length:', content.length);
      console.log('Content sample:', content.substring(0, 500));
      throw new Error('No occupancy data found on the JWC page');
    }
    
  } catch (error) {
    console.error('Error scraping JWC occupancy data:', error);
    throw error;
  }
}

// Fetch live occupancy data from UCLA API or web scraping
export async function fetchLiveOccupancyData(facilityId?: string): Promise<FacilityData[]> {
  // Use demo data only if explicitly enabled
  if (API_CONFIG.useDemoData) {
    console.log('Using demo data (explicitly enabled)');
    return DEMO_FACILITIES;
  }

  // Try UCLA's official GoBoard API first (fastest and most reliable)
  try {
    console.log('Attempting to fetch live occupancy data from UCLA GoBoard API...');
    const uclaData = await fetchUCLALiveOccupancyData();
    
    if (uclaData && uclaData.length > 0) {
      console.log('Successfully fetched live occupancy data from UCLA API');
      
      // Group data by facility
      const groupedData = groupOccupancyByFacility(uclaData);
      
      // Convert to our FacilityData format
      const facilityData: FacilityData[] = Object.entries(groupedData).map(([facilityName, zones]) => ({
        name: facilityName,
        zones: zones.map(zone => ({
          facility: zone.facility,
          zone: zone.zone,
          currentOccupancy: zone.currentOccupancy,
          maxCapacity: zone.maxCapacity,
          occupancyPercentage: zone.occupancyPercentage,
          lastUpdated: zone.lastUpdated,
          status: zone.status
        })),
        lastUpdated: new Date().toISOString()
      }));
      
      // Filter by facility if specified
      if (facilityId) {
        const facilityConfig = getFacilityConfig(facilityId);
        if (facilityConfig) {
          return facilityData.filter(facility => 
            facility.name.toLowerCase().includes(facilityConfig.name.toLowerCase()) ||
            facilityConfig.name.toLowerCase().includes(facility.name.toLowerCase())
          );
        }
      }
      
      return facilityData;
    }
  } catch (apiError) {
    console.error('UCLA API failed:', apiError);
    console.log('Falling back to web scraping...');
  }

  // Fallback to web scraping if API fails
  if (API_CONFIG.useScraping) {
    try {
      console.log('Attempting to scrape live occupancy data from UCLA Recreation website...');
      const scrapedData = await scrapeFacilityOccupancyData(facilityId);
      
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
    if (!Array.isArray(data)) {
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
