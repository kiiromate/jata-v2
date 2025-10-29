/**
 * Professional color palette for charts
 * Intentional, non-generic colors for data visualization
 */

export const CHART_COLORS = {
  // Primary scale - for main data series
  primary: {
    indigo: '#6366f1',
    purple: '#8b5cf6',
    cyan: '#06b6d4',
    emerald: '#10b981',
    amber: '#f59e0b',
  },
  // Status colors
  status: {
    applied: '#6366f1',     // Indigo
    screening: '#8b5cf6',   // Purple
    interview: '#06b6d4',   // Cyan
    offer: '#10b981',       // Emerald
    rejected: '#ef4444',    // Red
  },
  // Success gradient
  gradient: {
    low: '#ef4444',         // Red
    medium: '#f59e0b',      // Amber
    high: '#10b981',        // Emerald
  },
  // Neutral grays
  gray: {
    50: '#f9fafb',
    100: '#f3f4f6',
    200: '#e5e7eb',
    300: '#d1d5db',
    400: '#9ca3af',
    500: '#6b7280',
    600: '#4b5563',
    700: '#374151',
    800: '#1f2937',
    900: '#111827',
  },
};

/**
 * Get color based on score (0-100)
 */
export const getScoreColor = (score: number): string => {
  if (score >= 75) return CHART_COLORS.gradient.high;
  if (score >= 50) return CHART_COLORS.gradient.medium;
  return CHART_COLORS.gradient.low;
};

/**
 * Get color for application status
 */
export const getStatusColor = (status: string): string => {
  const statusLower = status.toLowerCase();
  if (statusLower.includes('offer')) return CHART_COLORS.status.offer;
  if (statusLower.includes('interview')) return CHART_COLORS.status.interview;
  if (statusLower.includes('reject')) return CHART_COLORS.status.rejected;
  if (statusLower.includes('screen')) return CHART_COLORS.status.screening;
  return CHART_COLORS.status.applied;
};

/**
 * Generate color palette for multiple series
 */
export const getSeriesColors = (count: number): string[] => {
  const colors = [
    CHART_COLORS.primary.indigo,
    CHART_COLORS.primary.purple,
    CHART_COLORS.primary.cyan,
    CHART_COLORS.primary.emerald,
    CHART_COLORS.primary.amber,
  ];
  return colors.slice(0, count);
};
