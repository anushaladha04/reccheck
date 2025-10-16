'use client';

import { useState } from 'react';
import { fetchLiveOccupancyData } from '@/lib/client-api';

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
  lastUpdated: string;
}

export default function TestFacilitiesPage() {
  const [data, setData] = useState<Facility[] | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [selectedFacility, setSelectedFacility] = useState<string>('');

  const testFacility = async (facilityId: string) => {
    setLoading(true);
    setError(null);
    setData(null);
    setSelectedFacility(facilityId);

    try {
      console.log(`Testing ${facilityId} facility...`);
      const result = await fetchLiveOccupancyData(facilityId);
      setData(result);
      console.log('Facility result:', result);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Unknown error occurred';
      setError(errorMessage);
      console.error('Facility test error:', err);
    } finally {
      setLoading(false);
    }
  };

  const testAllFacilities = async () => {
    setLoading(true);
    setError(null);
    setData(null);
    setSelectedFacility('all');

    try {
      console.log('Testing all facilities...');
      const result = await fetchLiveOccupancyData();
      setData(result);
      console.log('All facilities result:', result);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Unknown error occurred';
      setError(errorMessage);
      console.error('All facilities test error:', err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <div className="max-w-6xl mx-auto">
        <h1 className="text-3xl font-bold text-gray-900 mb-8">UCLA Recreation Facilities Test</h1>
        
        <div className="bg-white p-6 rounded-lg shadow mb-8">
          <h2 className="text-xl font-semibold mb-4">Test Different Facilities</h2>
          <p className="text-gray-600 mb-4">
            Test live occupancy data for different UCLA Recreation facilities.
          </p>
          
          <div className="flex flex-wrap gap-4">
            <button
              onClick={() => testFacility('jwc')}
              disabled={loading}
              className="px-6 py-3 bg-blue-500 text-white rounded-lg hover:bg-blue-600 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading && selectedFacility === 'jwc' ? 'Loading...' : 'Test John Wooden Center'}
            </button>
            
            <button
              onClick={() => testFacility('bfit')}
              disabled={loading}
              className="px-6 py-3 bg-green-500 text-white rounded-lg hover:bg-green-600 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading && selectedFacility === 'bfit' ? 'Loading...' : 'Test BruinFit'}
            </button>
            
            <button
              onClick={testAllFacilities}
              disabled={loading}
              className="px-6 py-3 bg-purple-500 text-white rounded-lg hover:bg-purple-600 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading && selectedFacility === 'all' ? 'Loading...' : 'Test All Facilities'}
            </button>
          </div>
        </div>

        {loading && (
          <div className="bg-white p-8 rounded-lg shadow text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto mb-4"></div>
            <p className="text-gray-600">Fetching live occupancy data...</p>
            <p className="text-sm text-gray-500 mt-2">This may take a few seconds</p>
          </div>
        )}

        {error && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-6 mb-8">
            <h3 className="text-lg font-semibold text-red-800 mb-2">Error</h3>
            <p className="text-red-700">{error}</p>
          </div>
        )}

        {data && (
          <div className="space-y-6">
            <div className="bg-green-50 border border-green-200 rounded-lg p-6">
              <h3 className="text-lg font-semibold text-green-800 mb-2">Success!</h3>
              <p className="text-green-700">
                Successfully fetched live occupancy data for {selectedFacility === 'all' ? 'all facilities' : selectedFacility}
              </p>
            </div>

            <div className="bg-white p-6 rounded-lg shadow">
              <h3 className="text-xl font-semibold mb-4">Live Data</h3>
              
              {data.map((facility, index) => (
                <div key={index} className="mb-8">
                  <h4 className="text-lg font-medium text-gray-900 mb-3">{facility.name}</h4>
                  <p className="text-sm text-gray-500 mb-4">
                    Last updated: {new Date(facility.lastUpdated).toLocaleString()}
                  </p>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {facility.zones.map((zone, zoneIndex) => (
                      <div key={zoneIndex} className="border rounded-lg p-4">
                        <h5 className="font-medium text-gray-900 mb-2">{zone.zone}</h5>
                        <div className="space-y-2">
                          <div className="flex justify-between">
                            <span className="text-sm text-gray-600">Occupancy:</span>
                            <span className="text-sm font-medium">
                              {zone.currentOccupancy}/{zone.maxCapacity}
                            </span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-sm text-gray-600">Percentage:</span>
                            <span className="text-sm font-medium">{zone.occupancyPercentage}%</span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-sm text-gray-600">Status:</span>
                            <span className={`text-sm font-medium px-2 py-1 rounded ${
                              zone.status === 'Low' ? 'bg-green-100 text-green-800' :
                              zone.status === 'Moderate' ? 'bg-yellow-100 text-yellow-800' :
                              zone.status === 'High' ? 'bg-red-100 text-red-800' :
                              'bg-gray-100 text-gray-800'
                            }`}>
                              {zone.status}
                            </span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-sm text-gray-600">Last Updated:</span>
                            <span className="text-sm font-medium">
                              {new Date(zone.lastUpdated).toLocaleString()}
                            </span>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>

          </div>
        )}
      </div>
    </div>
  );
}
