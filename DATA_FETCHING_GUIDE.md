# UCLA Recreation Data Fetching Guide

This guide explains how to set up and test the live data fetching for the UCLA Recreation occupancy tracking app.

## Overview

The app can fetch live occupancy data in two ways:

1. **Web Scraping** - Scrapes live data from the UCLA Recreation website (default)
2. **API** - Uses a direct API (if available)

Demo data is only available when explicitly enabled for testing purposes.

## Setup

### 1. Install Dependencies

The required packages are already installed:

- `cheerio` - For HTML parsing
- `puppeteer` - For web scraping
- `@types/cheerio` - TypeScript types

### 2. Configuration

Create a `.env.local` file in the project root with:

```env
# Enable web scraping (default: true)
NEXT_PUBLIC_USE_SCRAPING=true

# Use demo data (default: false, only for testing)
NEXT_PUBLIC_USE_DEMO_DATA=false

# Data refresh interval in milliseconds
NEXT_PUBLIC_REFRESH_INTERVAL=30000
```

## Testing the Data Fetching

### 1. Test Web Scraping

Visit: `http://localhost:3000/test-scraping`

This page will:

- Attempt to scrape live data from the UCLA Recreation website
- Show the scraped data in a formatted view
- Display any errors that occur
- Show raw JSON data for debugging

### 2. Test API Integration

Visit: `http://localhost:3000/test-api`

This page will:

- Test the complete data fetching pipeline
- Show API health status
- Display live occupancy data
- Allow manual refresh
- Show data validation results

## Data Validation

The system includes several validation layers:

### 1. Data Structure Validation

- Ensures all required fields are present
- Validates data types and ranges
- Checks for reasonable occupancy percentages (0-100%)

### 2. Data Freshness Validation

- Checks timestamps to ensure data is recent
- Warns if data is older than expected

### 3. Capacity Validation

- Validates that current occupancy doesn't exceed max capacity
- Ensures capacity values are reasonable

## Expected Data Format

The scraped data should match this structure:

```typescript
interface OccupancyData {
  facility: string; // "John Wooden Center"
  zone: string; // "Cardio Zone", "Free Weight Zone", etc.
  currentOccupancy: number; // Current number of people
  maxCapacity: number; // Maximum capacity
  occupancyPercentage: number; // Percentage (0-100)
  lastUpdated: string; // ISO timestamp
  status: "Low" | "Moderate" | "High" | "Closed";
}
```

## Troubleshooting

### Common Issues

1. **Scraping Fails**

   - Check if the UCLA Recreation website is accessible
   - Verify the page structure hasn't changed
   - Check browser console for errors

2. **No Data Found**

   - The page structure might have changed
   - Check if the "Location Count" section is still present
   - Verify the CSS selectors in the scraping code

3. **Data Validation Errors**
   - Check if the scraped data matches expected format
   - Verify occupancy percentages are reasonable
   - Ensure timestamps are valid

### Debug Mode

To enable debug logging, check the browser console when running the test pages. The scraping process logs detailed information about:

- Page loading status
- Data extraction progress
- Validation results
- Error details

## Production Deployment

For production deployment:

1. Set `NEXT_PUBLIC_USE_SCRAPING=true`
2. Set `NEXT_PUBLIC_USE_DEMO_DATA=false`
3. Ensure the server has sufficient resources for Puppeteer
4. Consider implementing rate limiting for scraping requests
5. Set up monitoring for scraping failures

## Future Improvements

- Add support for other UCLA Recreation facilities
- Implement caching to reduce scraping frequency
- Add historical data collection
- Create fallback mechanisms for scraping failures
- Add data quality metrics and alerts
