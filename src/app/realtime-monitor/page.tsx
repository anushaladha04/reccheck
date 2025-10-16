'use client';

import { useState, useEffect } from 'react';
// eslint-disable-next-line @typescript-eslint/no-unused-vars
import { analyzeDataFreshness, getFreshnessColor, getFreshnessIcon } from '@/lib/data-freshness';

interface FreshnessData {
  facility: string;
  freshness: {
    isStale: boolean;
    ageMinutes: number;
    lastUpdated: Date;
    freshnessStatus: 'fresh' | 'stale' | 'very_stale';
    recommendedAction: string;
  };
  zones: number;
  totalOccupancy: number;
}

export default function RealtimeMonitorPage() {
  const [data, setData] = useState<FreshnessData[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [lastCheck, setLastCheck] = useState<Date | null>(null);

  const checkFreshness = async () => {
    try {
      setLoading(true);
      setError(null);
      
      const response = await fetch('/api/occupancy-freshness');
      const result = await response.json();
      
      if (result.success) {
        setData(result.data);
        setLastCheck(new Date());
      } else {
        setError(result.error || 'Failed to check data freshness');
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error');
    } finally {
      setLoading(false);
    }
  };

  // Auto-refresh every 30 seconds
  useEffect(() => {
    checkFreshness();
    const interval = setInterval(checkFreshness, 30000);
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <div className="max-w-6xl mx-auto">
        <div className="flex justify-between items-center mb-8">
          <h1 className="text-3xl font-bold text-gray-900">Real-Time Data Monitor</h1>
          <div className="flex items-center space-x-4">
            <button
              onClick={checkFreshness}
              disabled={loading}
              className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 disabled:opacity-50"
            >
              {loading ? 'Checking...' : 'Refresh Now'}
            </button>
            {lastCheck && (
              <span className="text-sm text-gray-500">
                Last checked: {lastCheck.toLocaleTimeString()}
              </span>
            )}
          </div>
        </div>

        {error && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-6 mb-8">
            <h3 className="text-lg font-semibold text-red-800 mb-2">Error</h3>
            <p className="text-red-700">{error}</p>
          </div>
        )}

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {data.map((facility, index) => (
            <div key={index} className="bg-white p-6 rounded-lg shadow">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-xl font-semibold text-gray-900">{facility.facility}</h3>
                <span className={`px-3 py-1 rounded-full text-sm font-medium ${getFreshnessColor(facility.freshness.freshnessStatus)}`}>
                  {getFreshnessIcon(facility.freshness.freshnessStatus)} {facility.freshness.freshnessStatus.toUpperCase()}
                </span>
              </div>
              
              <div className="space-y-3">
                <div className="flex justify-between">
                  <span className="text-gray-600">Data Age:</span>
                  <span className="font-medium">
                    {facility.freshness.ageMinutes} minutes ago
                  </span>
                </div>
                
                <div className="flex justify-between">
                  <span className="text-gray-600">Last Updated:</span>
                  <span className="font-medium">
                    {facility.freshness.lastUpdated.toLocaleString()}
                  </span>
                </div>
                
                <div className="flex justify-between">
                  <span className="text-gray-600">Zones:</span>
                  <span className="font-medium">{facility.zones}</span>
                </div>
                
                <div className="flex justify-between">
                  <span className="text-gray-600">Total Occupancy:</span>
                  <span className="font-medium">{facility.totalOccupancy} people</span>
                </div>
                
                <div className="mt-4 p-3 bg-gray-50 rounded-lg">
                  <p className="text-sm text-gray-700">
                    <strong>Status:</strong> {facility.freshness.recommendedAction}
                  </p>
                </div>
              </div>
            </div>
          ))}
        </div>

        <div className="mt-8 bg-white p-6 rounded-lg shadow">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Data Source Information</h3>
          <div className="space-y-2 text-sm text-gray-600">
            <p><strong>Source:</strong> UCLA Recreation live occupancy system (connect2mycloud.com)</p>
            <p><strong>Update Frequency:</strong> UCLA&apos;s system updates every 2-5 minutes</p>
            <p><strong>Our Refresh Rate:</strong> Every 10 seconds (checks for new data)</p>
            <p><strong>Data Latency:</strong> 2-5 minutes behind real-time occupancy</p>
          </div>
        </div>
      </div>
    </div>
  );
}
