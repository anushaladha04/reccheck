import { NextRequest, NextResponse } from 'next/server';
import { fetchLiveOccupancyData } from '@/lib/server-api';

export async function GET(request: NextRequest) {
  try {
    console.log('API route: Starting to fetch live occupancy data...');
    
    // Get facility parameter from query string
    const { searchParams } = new URL(request.url);
    const facility = searchParams.get('facility');
    
    console.log('Facility parameter:', facility);
    
    const data = await fetchLiveOccupancyData(facility || undefined);
    
    console.log('API route: Successfully fetched data:', {
      facilityCount: data.length,
      totalZones: data.reduce((sum, facility) => sum + facility.zones.length, 0)
    });
    
    return NextResponse.json({
      success: true,
      data,
      timestamp: new Date().toISOString()
    });
    
  } catch (error) {
    console.error('API route error:', error);
    
    // Log more details about the error
    if (error instanceof Error) {
      console.error('Error message:', error.message);
      console.error('Error stack:', error.stack);
    }
    
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error occurred',
      timestamp: new Date().toISOString()
    }, { status: 500 });
  }
}
