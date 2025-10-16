'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
// Navigation component is imported but not used in this file

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

export default function HomePage() {
  const router = useRouter();
  const [data, setData] = useState<FacilityData[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [lastUpdate, setLastUpdate] = useState<Date | null>(null);
  // We'll keep these state variables for future use
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const [selectedFacility, setSelectedFacility] = useState<string | null>(null);

  const fetchData = async () => {
    try {
      setLoading(true);
      setError(null);
      
      const response = await fetch('/api/occupancy-with-hours');
      const result = await response.json();
      
      if (result.success) {
        setData(result.data);
        setLastUpdate(new Date());
      } else {
        setError(result.error || 'Failed to fetch data');
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error');
    } finally {
      setLoading(false);
    }
  };

  // Auto-refresh every 30 seconds
  useEffect(() => {
    fetchData();
    const interval = setInterval(fetchData, 30000);
    return () => clearInterval(interval);
  }, []);

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

  if (loading && data.length === 0) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <h2 className="text-xl font-semibold text-gray-700">Loading UCLA Recreation Data...</h2>
          <p className="text-gray-500 mt-2">Fetching live occupancy and hours</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* UCLA Header */}
      <div className="shadow-lg" style={{ background: 'linear-gradient(135deg, #1e3a8a 0%, #3b82f6 50%, #93c5fd 100%)' }}>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-8">
            <div className="flex items-center space-x-4">
              <div className="text-4xl">🏋️</div>
              <div>
                <h1 className="text-4xl font-bold text-white">RecCheck</h1>
                <p className="text-blue-100 mt-2 text-lg">Live occupancy tracking for UCLA Recreation facilities</p>
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

      {/* Error State */}
      {error && (
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="bg-red-50 border border-red-200 rounded-lg p-6">
            <div className="flex">
              <div className="flex-shrink-0">
                <svg className="h-5 w-5 text-red-400" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                </svg>
              </div>
              <div className="ml-3">
                <h3 className="text-sm font-medium text-red-800">Error loading data</h3>
                <div className="mt-2 text-sm text-red-700">
                  <p>{error}</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-8">
          <h2 className="text-3xl font-bold text-gray-900 mb-2">Overview</h2>
          <p className="text-gray-600">Current occupancy status for all UCLA Recreation facilities</p>
        </div>
        
        {/* Live Occupancy Overview - Most Prominent */}
        <div className="mb-8">
          <h2 className="text-2xl font-bold text-gray-900 mb-6">Live Occupancy Status</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {data.map((facility, index) => {
              // If facility is closed, set occupancy to 0
              const isClosed = facility.hours.currentStatus === 'closed';
              const totalOccupancy = isClosed ? 0 : facility.zones.reduce((sum, zone) => sum + zone.currentOccupancy, 0);
              const totalCapacity = facility.zones.reduce((sum, zone) => sum + zone.maxCapacity, 0);
              const overallPercentage = isClosed ? 0 : (totalCapacity > 0 ? Math.round((totalOccupancy / totalCapacity) * 100) : 0);
              
              return (
                <div
                  key={index}
                  className={`rounded-xl shadow-lg hover:shadow-xl transition-all duration-300 cursor-pointer border-2 hover:border-blue-200 ${
                    facility.hours.currentStatus === 'closed' 
                      ? 'bg-gray-100 opacity-75' 
                      : 'bg-white'
                  }`}
                  onClick={() => router.push(`/facility/${encodeURIComponent(facility.name)}`)}
                >
                  {/* Occupancy Hero Section */}
                  <div className="px-6 py-4 text-center">
                    <h3 className="text-xl font-bold text-gray-900 mb-2">{facility.name}</h3>
                    
                    {facility.hours.currentStatus === 'closed' && (
                      <div className="mb-4 py-2 px-4 bg-red-100 text-red-800 rounded-md inline-block font-bold">
                        CLOSED • {facility.hours.nextChange}
                      </div>
                    )}
                    
                    {/* Large Occupancy Display */}
                    <div className="mb-4">
                      <div 
                        className={`text-5xl font-bold mb-1 ${facility.hours.currentStatus === 'closed' ? 'text-gray-400' : ''}`}
                        style={{ 
                          color: facility.hours.currentStatus === 'closed' ? '#9ca3af' : 
                                 overallPercentage < 40 ? '#10b981' : 
                                 overallPercentage < 70 ? '#f59e0b' : '#ef4444' 
                        }}
                      >
                        {overallPercentage}%
                      </div>
                      <div className="text-lg text-gray-600 mb-4">
                        {totalOccupancy} of {totalCapacity} people
                      </div>
                      
                      {/* Large Progress Bar */}
                      <div className="w-full bg-gray-200 rounded-full h-4 mb-4">
                        <div 
                          className="h-4 rounded-full transition-all duration-500"
                          style={{ 
                            width: `${Math.min(overallPercentage, 100)}%`,
                            backgroundColor: facility.hours.currentStatus === 'closed' ? '#d1d5db' : 
                                           overallPercentage < 40 ? '#10b981' : 
                                           overallPercentage < 70 ? '#f59e0b' : '#ef4444'
                          }}
                        ></div>
                      </div>
                      
                      {/* Status Badge */}
                      <div className="inline-flex items-center space-x-2">
                        <span 
                          className="px-4 py-2 rounded-full text-sm font-bold"
                          style={{
                            backgroundColor: facility.hours.currentStatus === 'closed' ? '#f3f4f6' : 
                                           overallPercentage < 40 ? '#dcfce7' : 
                                           overallPercentage < 70 ? '#fef3c7' : '#fee2e2',
                            color: facility.hours.currentStatus === 'closed' ? '#6b7280' : 
                                   overallPercentage < 40 ? '#166534' : 
                                   overallPercentage < 70 ? '#92400e' : '#991b1b'
                          }}
                        >
                          {facility.hours.currentStatus === 'closed' ? '⚪ CLOSED' :
                           overallPercentage < 40 ? '🟢 LOW CROWDING' : 
                           overallPercentage < 70 ? '🟡 MODERATE CROWDING' : '🔴 HIGH CROWDING'}
                        </span>
                        <span className={`px-3 py-1 rounded-full text-xs font-medium ${
                          facility.hours.currentStatus === 'open' ? 'bg-green-100 text-green-800' :
                          facility.hours.currentStatus === 'closed' ? 'bg-red-100 text-red-800' :
                          'bg-gray-100 text-gray-800'
                        }`}>
                          {facility.hours.currentStatus.toUpperCase()}
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Zone Breakdown */}
                  <div className="px-6 pb-4">
                    <div className="text-sm font-medium text-gray-600 mb-3">Zone Status:</div>
                    <div className="grid grid-cols-2 gap-2">
                      {facility.zones.slice(0, 4).map((zone, zoneIndex) => (
                        <div key={zoneIndex} className="text-center">
                          <div className="text-xs text-gray-500 mb-1">{zone.zone.split(' ')[0]}</div>
                          <div 
                            className="text-lg font-bold"
                            style={{ 
                              color: isClosed ? '#9ca3af' :
                                     zone.occupancyPercentage < 40 ? '#10b981' : 
                                     zone.occupancyPercentage < 70 ? '#f59e0b' : '#ef4444' 
                            }}
                          >
                            {isClosed ? '0' : zone.occupancyPercentage}%
                          </div>
                        </div>
                      ))}
                    </div>
                    {facility.zones.length > 4 && (
                      <div className="text-center mt-3">
                        <span className="text-xs text-gray-500">
                          +{facility.zones.length - 4} more zones
                        </span>
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Hours Information - Secondary */}
        <div className="bg-white rounded-lg shadow-md p-6 mb-8">
          <h3 className="text-xl font-bold text-gray-900 mb-4">Today&apos;s Hours</h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {data.map((facility, index) => (
              <div key={index} className="text-center">
                <div className="font-semibold text-gray-900 mb-1">{facility.name}</div>
                <div className="text-sm text-gray-600">{facility.hours.todayHours}</div>
                <div className="text-xs text-gray-500 mt-1">Next: {facility.hours.nextChange}</div>
              </div>
            ))}
          </div>
        </div>

      </div>

      {/* Footer */}
      <div className="bg-gray-100 border-t mt-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="text-center text-gray-600">
            <p className="text-sm">Data provided by UCLA Recreation • Updates every 30 seconds</p>
            <p className="text-xs mt-2">Built for UCLA students, faculty, and staff</p>
          </div>
        </div>
      </div>
    </div>
  );
}