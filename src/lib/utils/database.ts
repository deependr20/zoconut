// Database utility functions for handling optional database scenarios

/**
 * Check if database is available and configured
 */
export function isDatabaseAvailable(): boolean {
  return !!(process.env.MONGODB_URI && 
           !process.env.VERCEL && 
           process.env.NODE_ENV !== 'production');
}

/**
 * Check if we're running in Vercel environment
 */
export function isVercelEnvironment(): boolean {
  return !!(process.env.VERCEL || process.env.VERCEL_ENV);
}

/**
 * Get appropriate error response when database is not available
 */
export function getDatabaseUnavailableResponse() {
  return {
    error: 'Database features are not available in this deployment',
    message: 'This feature requires a database connection which is not configured for this environment',
    code: 'DATABASE_UNAVAILABLE'
  };
}

/**
 * Wrapper for database operations that handles unavailable database gracefully
 */
export async function withDatabase<T>(
  operation: () => Promise<T>,
  fallback?: () => Promise<T>
): Promise<T> {
  if (!isDatabaseAvailable()) {
    if (fallback) {
      return await fallback();
    }
    throw new Error('Database is not available');
  }
  
  return await operation();
}

/**
 * Check if a specific feature requires database
 */
export function requiresDatabase(feature: string): boolean {
  const databaseFeatures = [
    'appointments',
    'messages',
    'users',
    'progress',
    'meals',
    'recipes',
    'food-logs',
    'payments'
  ];
  
  return databaseFeatures.some(dbFeature => 
    feature.toLowerCase().includes(dbFeature)
  );
}
