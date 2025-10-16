'use client';

import { useState, useEffect } from 'react';

interface RegularHours {
  monday: string;
  tuesday: string;
  wednesday: string;
  thursday: string;
  friday: string;
  saturday: string;
  sunday: string;
}

interface Hours {
  currentStatus: 'open' | 'closed' | 'unknown';
  todayHours: string;
  nextChange: string;
  regularHours: RegularHours;
  specialHours?: string[];
}

interface Zone {
  facility: string;
  zone: string;
  currentOccupancy: number;
  maxCapacity: number;
  occupancyPercentage: number;
  lastUpdated: string;
  status: 'Low' | 'Moderate' | 'High' | 'Closed';
}

interface Facility {
  name: string;
  zones: Zone[];
  hours: Hours;
  lastUpdated: string;
}

export default function HoursTestPage() {
  const [data, setData] = useState<Facility[] | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [lastUpdate, setLastUpdate] = useState<Date | null>(null);

  const fetchData = async (facility?: string) => {
    setLoading(true);
    setError(null);
    
    try {
      const url = facility ? `/api/occupancy-with-hours?facility=${facility}` : '/api/occupancy-with-hours';
      const response = await fetch(url);
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
    const interval = setInterval(() => fetchData(), 30000);
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="min-h-screen bg-gray-50 p-4">
      <div className="max-w-6xl mx-auto">
        <div className="bg-white rounded-lg shadow-lg p-6 mb-6">
          <div className="flex justify-between items-center mb-4">
            <h1 className="text-3xl font-bold text-gray-900">🕒 UCLA Recreation Hours & Occupancy</h1>
            <div className="flex space-x-2">
              <button
                onClick={() => fetchData()}
                disabled={loading}
                className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 disabled:opacity-50"
              >
                {loading ? 'Loading...' : 'Refresh All'}
              </button>
              <button
                onClick={() => fetchData('jwc')}
                disabled={loading}
                className="px-4 py-2 bg-green-500 text-white rounded hover:bg-green-600 disabled:opacity-50"
              >
                JWC Only
              </button>
              <button
                onClick={() => fetchData('bfit')}
                disabled={loading}
                className="px-4 py-2 bg-purple-500 text-white rounded hover:bg-purple-600 disabled:opacity-50"
              >
                BruinFit Only
              </button>
            </div>
          </div>
          
          {lastUpdate && (
            <p className="text-sm text-gray-600 mb-4">
              Last updated: {lastUpdate.toLocaleTimeString()} (auto-refreshes every 30 seconds)
            </p>
          )}
        </div>

        {loading && (
          <div className="bg-white rounded-lg shadow p-8 text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto mb-4"></div>
            <p className="text-gray-600">Fetching live data with hours...</p>
          </div>
        )}

        {error && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-6 mb-6">
            <h3 className="text-lg font-semibold text-red-800 mb-2">Error</h3>
            <p className="text-red-700">{error}</p>
          </div>
        )}

        {data && (
          <div className="space-y-6">
            {data.map((facility, index) => (
              <div key={index} className="bg-white rounded-lg shadow-lg overflow-hidden">
                {/* Facility Header with Hours Status */}
                <div className={`p-6 text-white ${
                  facility.hours.currentStatus === 'open' ? 'bg-gradient-to-r from-green-500 to-green-600' :
                  facility.hours.currentStatus === 'closed' ? 'bg-gradient-to-r from-red-500 to-red-600' :
                  'bg-gradient-to-r from-gray-500 to-gray-600'
                }`}>
                  <div className="flex justify-between items-start">
                    <div>
                      <h2 className="text-2xl font-bold">{facility.name}</h2>
                      <p className="text-green-100 mt-1">
                        {facility.zones.length} zones • {facility.hours.currentStatus.toUpperCase()}
                      </p>
                    </div>
                    <div className="text-right">
                      <div className="text-lg font-semibold">
                        {facility.hours.currentStatus === 'open' ? '🟢 OPEN' : 
                         facility.hours.currentStatus === 'closed' ? '🔴 CLOSED' : '❓ UNKNOWN'}
                      </div>
                      <p className="text-sm text-green-100 mt-1">
                        {facility.hours.nextChange}
                      </p>
                    </div>
                  </div>
                </div>
                
                <div className="p-6">
                  {/* Hours of Operation */}
                  <div className="mb-6">
                    <h3 className="text-lg font-semibold text-gray-900 mb-4">🕒 Hours of Operation</h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="bg-gray-50 p-4 rounded-lg">
                        <h4 className="font-medium text-gray-900 mb-2">Today&apos;s Hours</h4>
                        <p className="text-gray-700">{facility.hours.todayHours}</p>
                      </div>
                      <div className="bg-gray-50 p-4 rounded-lg">
                        <h4 className="font-medium text-gray-900 mb-2">Regular Hours</h4>
                        <div className="space-y-1 text-sm">
                          <div className="flex justify-between">
                            <span className="text-gray-600">Mon-Thu:</span>
                            <span>{facility.hours.regularHours.monday}</span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-gray-600">Friday:</span>
                            <span>{facility.hours.regularHours.friday}</span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-gray-600">Saturday:</span>
                            <span>{facility.hours.regularHours.saturday}</span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-gray-600">Sunday:</span>
                            <span>{facility.hours.regularHours.sunday}</span>
                          </div>
                        </div>
                      </div>
                    </div>
                    
                    {facility.hours.specialHours && facility.hours.specialHours.length > 0 && (
                      <div className="mt-4 bg-yellow-50 p-4 rounded-lg">
                        <h4 className="font-medium text-yellow-900 mb-2">⚠️ Special Hours</h4>
                        <ul className="text-sm text-yellow-800 space-y-1">
                          {facility.hours.specialHours.map((special, idx) => (
                            <li key={idx}>• {special}</li>
                          ))}
                        </ul>
                      </div>
                    )}
                  </div>
                  
                  {/* Occupancy Data */}
                  <div>
                    <h3 className="text-lg font-semibold text-gray-900 mb-4">👥 Current Occupancy</h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                      {facility.zones.map((zone, zoneIndex) => (
                        <div key={zoneIndex} className="border rounded-lg p-4 hover:shadow-md transition-shadow">
                          <div className="flex justify-between items-start mb-3">
                            <h4 className="font-semibold text-gray-900">{zone.zone}</h4>
                            <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                              zone.status === 'Low' ? 'bg-green-100 text-green-800' :
                              zone.status === 'Moderate' ? 'bg-yellow-100 text-yellow-800' :
                              zone.status === 'High' ? 'bg-red-100 text-red-800' :
                              'bg-gray-100 text-gray-800'
                            }`}>
                              {zone.status}
                            </span>
                          </div>
                          
                          <div className="space-y-2">
                            <div className="flex justify-between">
                              <span className="text-sm text-gray-600">People:</span>
                              <span className="font-medium">{zone.currentOccupancy}/{zone.maxCapacity}</span>
                            </div>
                            
                            <div className="w-full bg-gray-200 rounded-full h-2">
                              <div 
                                className={`h-2 rounded-full ${
                                  zone.occupancyPercentage < 40 ? 'bg-green-500' :
                                  zone.occupancyPercentage < 70 ? 'bg-yellow-500' :
                                  'bg-red-500'
                                }`}
                                style={{ width: `${Math.min(zone.occupancyPercentage, 100)}%` }}
                              ></div>
                            </div>
                            
                            <div className="flex justify-between text-sm">
                              <span className="text-gray-600">Capacity:</span>
                              <span className="font-medium">{zone.occupancyPercentage}%</span>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                    
                    <div className="mt-6 p-4 bg-gray-50 rounded-lg">
                      <div className="flex justify-between items-center">
                        <span className="text-gray-600">Total Occupancy:</span>
                        <span className="text-xl font-bold text-blue-600">
                          {facility.zones.reduce((sum: number, zone) => sum + zone.currentOccupancy, 0)} people
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        <div className="mt-8 bg-white rounded-lg shadow p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">🔗 API Endpoints</h3>
          <div className="space-y-2 text-sm">
            <p><strong>Occupancy + Hours:</strong> <a href="/api/occupancy-with-hours" target="_blank" className="text-blue-500 hover:underline">/api/occupancy-with-hours</a></p>
            <p><strong>JWC + Hours:</strong> <a href="/api/occupancy-with-hours?facility=jwc" target="_blank" className="text-blue-500 hover:underline">/api/occupancy-with-hours?facility=jwc</a></p>
            <p><strong>BruinFit + Hours:</strong> <a href="/api/occupancy-with-hours?facility=bfit" target="_blank" className="text-blue-500 hover:underline">/api/occupancy-with-hours?facility=bfit</a></p>
          </div>
        </div>
      </div>
    </div>
  );
}
