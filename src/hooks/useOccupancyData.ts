import { useState, useEffect, useCallback } from 'react';
import { fetchLiveOccupancyData, checkApiHealth, type FacilityData } from '@/lib/client-api';

export interface UseOccupancyDataReturn {
  data: FacilityData[] | null;
  loading: boolean;
  error: string | null;
  lastUpdated: Date | null;
  isHealthy: boolean;
  refetch: () => Promise<void>;
  healthCheck: () => Promise<void>;
}

export function useOccupancyData(facilityId?: string, refreshInterval: number = 30000): UseOccupancyDataReturn {
  const [data, setData] = useState<FacilityData[] | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);
  const [isHealthy, setIsHealthy] = useState(true);

  const fetchData = useCallback(async () => {
    try {
      setError(null);
      const facilityData = await fetchLiveOccupancyData(facilityId);
      setData(facilityData);
      setLastUpdated(new Date());
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to fetch occupancy data';
      setError(errorMessage);
      console.error('Error in useOccupancyData:', err);
    } finally {
      setLoading(false);
    }
  }, [facilityId]);

  const performHealthCheck = useCallback(async () => {
    try {
      const health = await checkApiHealth();
      setIsHealthy(health.isHealthy);
      if (!health.isHealthy) {
        console.warn('API health check failed:', health.error);
      }
    } catch (err) {
      console.error('Health check failed:', err);
      setIsHealthy(false);
    }
  }, []);

  // Initial data fetch
  useEffect(() => {
    fetchData();
    performHealthCheck();
  }, [fetchData, performHealthCheck]);

  // Set up auto-refresh
  useEffect(() => {
    if (refreshInterval <= 0) return;

    const interval = setInterval(() => {
      fetchData();
      performHealthCheck();
    }, refreshInterval);

    return () => clearInterval(interval);
  }, [fetchData, performHealthCheck, refreshInterval]);

  return {
    data,
    loading,
    error,
    lastUpdated,
    isHealthy,
    refetch: fetchData,
    healthCheck: performHealthCheck,
  };
}
