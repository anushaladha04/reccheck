import { NextRequest, NextResponse } from 'next/server';
import { fetchOccupancyWithHours } from '@/lib/ucla-api';

export async function GET(request: NextRequest) {
  try {
    console.log('API route: Starting to fetch occupancy data with hours...');
    
    // Get facility parameter from query string
    const { searchParams } = new URL(request.url);
    const facility = searchParams.get('facility');
    
    console.log('Facility parameter:', facility);
    
    const data = await fetchOccupancyWithHours();
    
    // Filter by facility if specified
    let filteredData = data;
    if (facility) {
      const facilityLower = facility.toLowerCase();
      filteredData = data.filter(facilityData => {
        const nameLower = facilityData.name.toLowerCase();
        return nameLower.includes(facilityLower) || 
               facilityLower.includes(nameLower) ||
               (facilityLower === 'jwc' && nameLower.includes('john wooden')) ||
               (facilityLower === 'bfit' && nameLower.includes('bruin fitness'));
      });
      
      // Ensure hours are properly populated for filtered facilities
      filteredData = filteredData.map(facilityData => ({
        ...facilityData,
        hours: facilityData.hours || {
          currentStatus: 'unknown',
          todayHours: 'Hours not available',
          nextChange: 'Unknown',
          regularHours: {
            monday: 'Hours not available',
            tuesday: 'Hours not available',
            wednesday: 'Hours not available',
            thursday: 'Hours not available',
            friday: 'Hours not available',
            saturday: 'Hours not available',
            sunday: 'Hours not available'
          }
        }
      }));
    }
    
    console.log('API route: Successfully fetched data with hours:', {
      facilityCount: filteredData.length,
      totalZones: filteredData.reduce((sum, facility) => sum + facility.zones.length, 0)
    });

    return NextResponse.json({
      success: true,
      data: filteredData,
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error('API route error:', error);
    
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error occurred',
      timestamp: new Date().toISOString()
    }, { status: 500 });
  }
}
