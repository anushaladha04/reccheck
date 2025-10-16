import { NextRequest, NextResponse } from 'next/server';
import { fetchLiveOccupancyData } from '@/lib/server-api';
import { analyzeDataFreshness } from '@/lib/data-freshness';

export async function GET(request: NextRequest) {
  try {
    console.log('Checking data freshness...');
    
    // Get facility parameter
    const { searchParams } = new URL(request.url);
    const facility = searchParams.get('facility');
    
    // Fetch current data
    const data = await fetchLiveOccupancyData(facility || undefined);
    
    // Analyze freshness for each facility
    const freshnessAnalysis = data.map(facility => {
      const freshness = analyzeDataFreshness(facility.lastUpdated);
      return {
        facility: facility.name,
        freshness,
        zones: facility.zones.length,
        totalOccupancy: facility.zones.reduce((sum, zone) => sum + zone.currentOccupancy, 0)
      };
    });
    
    return NextResponse.json({
      success: true,
      data: freshnessAnalysis,
      timestamp: new Date().toISOString()
    });
    
  } catch (error) {
    console.error('Freshness check error:', error);
    
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error occurred',
      timestamp: new Date().toISOString()
    }, { status: 500 });
  }
}
