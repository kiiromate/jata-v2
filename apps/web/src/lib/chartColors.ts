/**
 * Centralized chart colors mapped to JATA design tokens.
 */

export const CHART_COLORS = {
  primary: {
    indigo: 'var(--jata-accent-blue)',
    purple: 'var(--jata-accent-rust)',
    cyan: 'var(--jata-accent-orange)',
    emerald: 'var(--jata-accent-lime)',
    amber: 'hsl(var(--chart-2))',
  },
  status: {
    applied: 'var(--jata-accent-blue)',
    screening: 'var(--jata-accent-rust)',
    interview: 'var(--jata-accent-orange)',
    offer: 'var(--jata-accent-lime)',
    rejected: 'hsl(var(--destructive))',
  },
  gradient: {
    low: 'hsl(var(--destructive))',
    medium: 'var(--jata-accent-orange)',
    high: 'var(--jata-accent-lime)',
  },
  gray: {
    50: 'hsl(var(--muted) / 0.2)',
    100: 'hsl(var(--muted) / 0.3)',
    200: 'hsl(var(--border))',
    300: 'hsl(var(--border) / 0.9)',
    400: 'var(--jata-text-muted)',
    500: 'var(--jata-text-muted)',
    600: 'var(--jata-text-secondary)',
    700: 'var(--jata-text-secondary)',
    800: 'var(--jata-text-primary)',
    900: 'var(--jata-text-primary)',
  },
} as const;

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
