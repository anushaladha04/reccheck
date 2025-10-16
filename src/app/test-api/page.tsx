'use client';

import { useOccupancyData } from '@/hooks/useOccupancyData';
import { useState } from 'react';

export default function TestApiPage() {
  const { data, loading, error, lastUpdated, isHealthy, refetch, healthCheck } = useOccupancyData(undefined, 10000); // Refresh every 10 seconds
  const [manualRefresh, setManualRefresh] = useState(false);

  const handleManualRefresh = async () => {
    setManualRefresh(true);
    await refetch();
    setManualRefresh(false);
  };

  const handleHealthCheck = async () => {
    await healthCheck();
  };

  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-3xl font-bold text-gray-900 mb-8">API Test Dashboard</h1>
        
        {/* Status Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <div className="bg-white p-6 rounded-lg shadow">
            <h3 className="text-lg font-semibold text-gray-900 mb-2">API Health</h3>
            <div className="flex items-center">
              <div className={`w-3 h-3 rounded-full mr-3 ${isHealthy ? 'bg-green-500' : 'bg-red-500'}`}></div>
              <span className={isHealthy ? 'text-green-600' : 'text-red-600'}>
                {isHealthy ? 'Healthy' : 'Unhealthy'}
              </span>
            </div>
            <button 
              onClick={handleHealthCheck}
              className="mt-3 px-3 py-1 bg-blue-500 text-white rounded text-sm hover:bg-blue-600"
            >
              Check Health
            </button>
          </div>

          <div className="bg-white p-6 rounded-lg shadow">
            <h3 className="text-lg font-semibold text-gray-900 mb-2">Loading Status</h3>
            <div className="flex items-center">
              <div className={`w-3 h-3 rounded-full mr-3 ${loading ? 'bg-yellow-500 animate-pulse' : 'bg-green-500'}`}></div>
              <span className={loading ? 'text-yellow-600' : 'text-green-600'}>
                {loading ? 'Loading...' : 'Ready'}
              </span>
            </div>
          </div>

          <div className="bg-white p-6 rounded-lg shadow">
            <h3 className="text-lg font-semibold text-gray-900 mb-2">Last Updated</h3>
            <p className="text-gray-600">
              {lastUpdated ? lastUpdated.toLocaleTimeString() : 'Never'}
            </p>
          </div>
        </div>

        {/* Controls */}
        <div className="bg-white p-6 rounded-lg shadow mb-8">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Controls</h3>
          <div className="flex gap-4">
            <button 
              onClick={handleManualRefresh}
              disabled={manualRefresh}
              className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 disabled:opacity-50"
            >
              {manualRefresh ? 'Refreshing...' : 'Manual Refresh'}
            </button>
            <button 
              onClick={() => window.location.reload()}
              className="px-4 py-2 bg-gray-500 text-white rounded hover:bg-gray-600"
            >
              Reload Page
            </button>
          </div>
        </div>

        {/* Error Display */}
        {error && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-8">
            <h3 className="text-lg font-semibold text-red-800 mb-2">Error</h3>
            <p className="text-red-700">{error}</p>
          </div>
        )}

        {/* Data Display */}
        {loading && !data && (
          <div className="bg-white p-8 rounded-lg shadow text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto mb-4"></div>
            <p className="text-gray-600">Loading occupancy data...</p>
          </div>
        )}

        {data && (
          <div className="space-y-6">
            <h2 className="text-2xl font-bold text-gray-900">Facility Data</h2>
            
            {data.map((facility) => (
              <div key={facility.name} className="bg-white p-6 rounded-lg shadow">
                <h3 className="text-xl font-semibold text-gray-900 mb-4">{facility.name}</h3>
                <p className="text-sm text-gray-500 mb-4">
                  Last updated: {new Date(facility.lastUpdated).toLocaleString()}
                </p>
                
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {facility.zones.map((zone) => (
                    <div key={zone.zone} className="border rounded-lg p-4">
                      <h4 className="font-medium text-gray-900 mb-2">{zone.zone}</h4>
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
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        )}

      </div>
    </div>
  );
}
