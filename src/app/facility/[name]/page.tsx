'use client';

import { useState, useEffect, useCallback } from 'react';
import { useParams, useRouter } from 'next/navigation';

interface FacilityData {
  name: string;
  zones: Array<{
    facility: string;
    zone: string;
    currentOccupancy: number;
    maxCapacity: number;
    occupancyPercentage: number;
    lastUpdated: string;
    status: 'Low' | 'Moderate' | 'High' | 'Closed';
  }>;
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

export default function FacilityDetailPage() {
  const params = useParams();
  const router = useRouter();
  const facilityName = decodeURIComponent(params.name as string);
  
  const [data, setData] = useState<FacilityData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [lastUpdate, setLastUpdate] = useState<Date | null>(null);

  const fetchData = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      
      // Try to get specific facility data
      const facilityParam = facilityName.toLowerCase().includes('john wooden') ? 'jwc' :
                           facilityName.toLowerCase().includes('bruin') ? 'bfit' :
                           facilityName.toLowerCase().includes('kinross') ? 'kinross' : '';
      
      const url = facilityParam ? `/api/occupancy-with-hours?facility=${facilityParam}` : '/api/occupancy-with-hours';
      const response = await fetch(url);
      const result = await response.json();
      
      if (result.success && result.data.length > 0) {
        const facility = result.data.find((f: FacilityData) => 
          f.name.toLowerCase().includes(facilityName.toLowerCase()) ||
          facilityName.toLowerCase().includes(f.name.toLowerCase())
        );
        
        if (facility) {
          setData(facility);
          setLastUpdate(new Date());
        } else {
          setError('Facility not found');
        }
      } else {
        setError(result.error || 'Failed to fetch data');
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error');
    } finally {
      setLoading(false);
    }
  }, [facilityName]);

  // Auto-refresh every 30 seconds
  useEffect(() => {
    fetchData();
    const interval = setInterval(fetchData, 30000);
    return () => clearInterval(interval);
  }, [fetchData]);

  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const getStatusColor = (status: string) => {
    switch (status) {
      case 'open': return 'text-green-600 bg-green-100';
      case 'closed': return 'text-red-600 bg-red-100';
      default: return 'text-gray-600 bg-gray-100';
    }
  };

  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const getOccupancyColor = (percentage: number) => {
    if (percentage < 40) return 'text-green-600 bg-green-100';
    if (percentage < 70) return 'text-yellow-600 bg-yellow-100';
    return 'text-red-600 bg-red-100';
  };

  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const getOccupancyBarColor = (percentage: number) => {
    if (percentage < 40) return 'bg-green-500';
    if (percentage < 70) return 'bg-yellow-500';
    return 'bg-red-500';
  };

  if (loading && !data) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <h2 className="text-xl font-semibold text-gray-700">Loading {facilityName}...</h2>
          <p className="text-gray-500 mt-2">Fetching live occupancy and hours</p>
        </div>
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center">
        <div className="text-center">
          <div className="text-red-500 text-6xl mb-4">⚠️</div>
          <h2 className="text-xl font-semibold text-gray-700 mb-2">Error Loading Facility</h2>
          <p className="text-gray-500 mb-4">{error || 'Facility not found'}</p>
          <button
            onClick={() => router.push('/')}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
          >
            Back to Dashboard
          </button>
        </div>
      </div>
    );
  }

  const totalOccupancy = data.zones.reduce((sum, zone) => sum + zone.currentOccupancy, 0);
  const totalCapacity = data.zones.reduce((sum, zone) => sum + zone.maxCapacity, 0);
  const overallPercentage = totalCapacity > 0 ? Math.round((totalOccupancy / totalCapacity) * 100) : 0;

  return (
    <div className="min-h-screen bg-gray-50">
      {/* UCLA Header */}
      <div className="shadow-lg" style={{ background: 'linear-gradient(135deg, #1e3a8a 0%, #3b82f6 50%, #93c5fd 100%)' }}>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-8">
            <div className="flex items-center space-x-4">
              <button
                onClick={() => router.push('/')}
                className="p-2 hover:bg-white hover:bg-opacity-20 rounded-lg transition-colors text-white"
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                </svg>
              </button>
              <div>
                <h1 className="text-4xl font-bold text-white">RecCheck - {data.name}</h1>
                <p className="text-blue-100 mt-2 text-lg">Live occupancy and hours information</p>
              </div>
            </div>
            <div className="flex items-center space-x-4">
              <button
                onClick={fetchData}
                disabled={loading}
                className="px-6 py-3 bg-white rounded-lg hover:bg-gray-50 disabled:opacity-50 flex items-center space-x-2 font-semibold shadow-md"
                style={{ color: '#1e3a8a' }}
              >
                <svg className={`w-5 h-5 ${loading ? 'animate-spin' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                </svg>
                <span>{loading ? 'Refreshing...' : 'Refresh'}</span>
              </button>
              {lastUpdate && (
                <div className="text-blue-100 text-sm">
                  Last updated: {lastUpdate.toLocaleTimeString()}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Occupancy Hero Section - Most Prominent */}
        <div className="bg-white rounded-xl shadow-lg overflow-hidden mb-8 border-2" style={{ borderColor: overallPercentage < 40 ? '#10b981' : overallPercentage < 70 ? '#f59e0b' : '#ef4444' }}>
          <div className="p-8 text-center">
            <h2 className="text-3xl font-bold text-gray-900 mb-6">Live Occupancy Status</h2>
            
            {/* Massive Occupancy Display */}
            <div className="mb-8">
              <div 
                className="text-8xl font-bold mb-4"
                style={{ 
                  color: overallPercentage < 40 ? '#10b981' : 
                         overallPercentage < 70 ? '#f59e0b' : '#ef4444' 
                }}
              >
                {overallPercentage}%
              </div>
              <div className="text-2xl text-gray-600 mb-6">
                {totalOccupancy} of {totalCapacity} people
              </div>
              
              {/* Large Progress Bar */}
              <div className="w-full bg-gray-200 rounded-full h-6 mb-6">
                <div 
                  className="h-6 rounded-full transition-all duration-500"
                  style={{ 
                    width: `${Math.min(overallPercentage, 100)}%`,
                    backgroundColor: overallPercentage < 40 ? '#10b981' : 
                                   overallPercentage < 70 ? '#f59e0b' : '#ef4444'
                  }}
                ></div>
              </div>
              
              {/* Status Badge */}
              <div className="inline-flex items-center space-x-3">
                <span 
                  className="px-6 py-3 rounded-full text-lg font-bold"
                  style={{
                    backgroundColor: overallPercentage < 40 ? '#dcfce7' : 
                                   overallPercentage < 70 ? '#fef3c7' : '#fee2e2',
                    color: overallPercentage < 40 ? '#166534' : 
                           overallPercentage < 70 ? '#92400e' : '#991b1b'
                  }}
                >
                  {overallPercentage < 40 ? '🟢 LOW CROWDING' : 
                   overallPercentage < 70 ? '🟡 MODERATE CROWDING' : '🔴 HIGH CROWDING'}
                </span>
                <span className={`px-4 py-2 rounded-full text-sm font-medium ${
                  data.hours.currentStatus === 'open' ? 'bg-green-100 text-green-800' :
                  data.hours.currentStatus === 'closed' ? 'bg-red-100 text-red-800' :
                  'bg-gray-100 text-gray-800'
                }`}>
                  {data.hours.currentStatus.toUpperCase()}
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Hours Information - Secondary */}
        <div className="bg-white rounded-lg shadow-md p-6 mb-8">
          <h3 className="text-xl font-bold text-gray-900 mb-4">Today&apos;s Hours</h3>
          <div className="text-center">
            <div className="text-lg text-gray-600 mb-2">{data.hours.todayHours}</div>
            <div className="text-sm text-gray-500">Next change: {data.hours.nextChange}</div>
          </div>
        </div>

        {/* Hours of Operation */}
        <div className="bg-white rounded-xl shadow-lg overflow-hidden mb-8">
          <div className="bg-gray-50 px-6 py-4 border-b">
            <h3 className="text-xl font-semibold text-gray-900">🕒 Hours of Operation</h3>
          </div>
          <div className="p-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <h4 className="font-medium text-gray-900 mb-3">Regular Hours</h4>
                <div className="space-y-2">
                  <div className="flex justify-between">
                    <span className="text-gray-600">Monday-Thursday:</span>
                    <span className="font-medium">{data.hours.regularHours.monday}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Friday:</span>
                    <span className="font-medium">{data.hours.regularHours.friday}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Saturday:</span>
                    <span className="font-medium">{data.hours.regularHours.saturday}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Sunday:</span>
                    <span className="font-medium">{data.hours.regularHours.sunday}</span>
                  </div>
                </div>
              </div>
              
              {data.hours.specialHours && data.hours.specialHours.length > 0 && (
                <div>
                  <h4 className="font-medium text-gray-900 mb-3">Special Hours</h4>
                  <div className="space-y-2">
                    {data.hours.specialHours.map((special, index) => (
                      <div key={index} className="text-sm text-gray-600">
                        • {special}
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Zone Details */}
        <div className="bg-white rounded-xl shadow-lg overflow-hidden">
          <div className="bg-gray-50 px-6 py-4 border-b">
            <h3 className="text-xl font-semibold text-gray-900">👥 Zone Occupancy Details</h3>
          </div>
          <div className="p-6">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {data.zones.map((zone, index) => (
                <div key={index} className="border rounded-lg p-6 hover:shadow-md transition-shadow">
                  <div className="flex justify-between items-start mb-4">
                    <h4 className="text-lg font-semibold text-gray-900">{zone.zone}</h4>
                    <span 
                      className="px-3 py-1 rounded-full text-sm font-medium"
                      style={{
                        backgroundColor: zone.occupancyPercentage < 40 ? '#dcfce7' : 
                                       zone.occupancyPercentage < 70 ? '#fef3c7' : '#fee2e2',
                        color: zone.occupancyPercentage < 40 ? '#166534' : 
                               zone.occupancyPercentage < 70 ? '#92400e' : '#991b1b'
                      }}
                    >
                      {zone.status}
                    </span>
                  </div>
                  
                  <div className="space-y-4">
                    <div className="text-center">
                      <div className="text-3xl font-bold text-gray-900 mb-1">{zone.currentOccupancy}</div>
                      <div className="text-sm text-gray-600">of {zone.maxCapacity} people</div>
                    </div>
                    
                    <div className="w-full bg-gray-200 rounded-full h-4">
                      <div 
                        className="h-4 rounded-full transition-all duration-300"
                        style={{ 
                          width: `${Math.min(zone.occupancyPercentage, 100)}%`,
                          backgroundColor: zone.occupancyPercentage < 40 ? '#10b981' : 
                                         zone.occupancyPercentage < 70 ? '#f59e0b' : '#ef4444'
                        }}
                      ></div>
                    </div>
                    
                    <div className="text-center">
                      <div className="text-2xl font-bold text-gray-900">{zone.occupancyPercentage}%</div>
                      <div className="text-sm text-gray-600">Capacity</div>
                    </div>
                    
                    <div className="pt-4 border-t">
                      <div className="flex justify-between text-sm">
                        <span className="text-gray-600">Last Updated:</span>
                        <span className="font-medium">
                          {new Date(zone.lastUpdated).toLocaleTimeString()}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Footer */}
      <div className="bg-white border-t mt-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="text-center text-gray-500 text-sm">
            <p>Data provided by UCLA Recreation • Updates every 30 seconds</p>
            <p className="mt-1">Built for UCLA students, faculty, and staff</p>
          </div>
        </div>
      </div>
    </div>
  );
}
