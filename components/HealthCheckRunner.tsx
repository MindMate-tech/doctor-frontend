'use client';

import { useEffect } from 'react';
import { runHealthChecks } from '@/lib/healthCheck';

/**
 * Client-side health check component
 * Runs connectivity tests on mount (client-side only)
 */
export default function HealthCheckRunner() {
  useEffect(() => {
    // Only run in browser
    if (typeof window !== 'undefined') {
      // Run health checks after a short delay to not block initial render
      const timer = setTimeout(() => {
        runHealthChecks().catch(err => {
          console.error('Health check error:', err);
        });
      }, 1000);

      return () => clearTimeout(timer);
    }
  }, []);

  // This component doesn't render anything
  return null;
}
