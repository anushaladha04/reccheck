// Data freshness utilities for occupancy tracking

export interface DataFreshnessInfo {
  isStale: boolean;
  ageMinutes: number;
  lastUpdated: Date;
  freshnessStatus: 'fresh' | 'stale' | 'very_stale';
  recommendedAction: string;
}

export function analyzeDataFreshness(lastUpdated: string): DataFreshnessInfo {
  const now = new Date();
  const updated = new Date(lastUpdated);
  const ageMinutes = Math.floor((now.getTime() - updated.getTime()) / (1000 * 60));
  
  let freshnessStatus: 'fresh' | 'stale' | 'very_stale';
  let isStale: boolean;
  let recommendedAction: string;
  
  if (ageMinutes <= 5) {
    freshnessStatus = 'fresh';
    isStale = false;
    recommendedAction = 'Data is current';
  } else if (ageMinutes <= 15) {
    freshnessStatus = 'stale';
    isStale = true;
    recommendedAction = 'Data may be slightly outdated';
  } else {
    freshnessStatus = 'very_stale';
    isStale = true;
    recommendedAction = 'Data is significantly outdated - consider manual refresh';
  }
  
  return {
    isStale,
    ageMinutes,
    lastUpdated: updated,
    freshnessStatus,
    recommendedAction
  };
}

export function getFreshnessColor(status: 'fresh' | 'stale' | 'very_stale'): string {
  switch (status) {
    case 'fresh': return 'text-green-600 bg-green-100';
    case 'stale': return 'text-yellow-600 bg-yellow-100';
    case 'very_stale': return 'text-red-600 bg-red-100';
  }
}

export function getFreshnessIcon(status: 'fresh' | 'stale' | 'very_stale'): string {
  switch (status) {
    case 'fresh': return '🟢';
    case 'stale': return '🟡';
    case 'very_stale': return '🔴';
  }
}
