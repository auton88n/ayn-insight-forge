/**
 * Subscription tier limits and configurations
 * Centralized tier definitions for consistent usage across the app
 */

export const TIER_LIMITS = {
  free: {
    credits: 5, // per day
    storage: 100 * 1024 * 1024, // 100MB in bytes
    retention: 30, // days
    maxSessions: 10,
    maxUploadsPerDay: 5,
    isDaily: true,
  },
  starter: {
    credits: 1000,
    storage: 500 * 1024 * 1024, // 500MB
    retention: 90,
    maxSessions: 50,
    maxUploadsPerDay: 20,
  },
  pro: {
    credits: 5000,
    storage: 2 * 1024 * 1024 * 1024, // 2GB
    retention: 365,
    maxSessions: 200,
    maxUploadsPerDay: 50,
  },
  business: {
    credits: 15000,
    storage: 10 * 1024 * 1024 * 1024, // 10GB
    retention: -1, // unlimited
    maxSessions: -1, // unlimited
    maxUploadsPerDay: -1, // unlimited
  },
  enterprise: {
    credits: -1, // custom
    storage: -1, // custom
    retention: -1, // unlimited
    maxSessions: -1, // unlimited
    maxUploadsPerDay: -1, // unlimited
  },
} as const;

export type TierName = keyof typeof TIER_LIMITS;

/**
 * Get human-readable storage size
 */
export const formatStorageSize = (bytes: number): string => {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(0)} KB`;
  if (bytes < 1024 * 1024 * 1024) return `${(bytes / (1024 * 1024)).toFixed(0)} MB`;
  return `${(bytes / (1024 * 1024 * 1024)).toFixed(1)} GB`;
};
