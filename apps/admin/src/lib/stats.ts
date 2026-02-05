export interface DashboardStats {
  totalUsers: number
  activeSessions: number
  revenue: number
}

/**
 * Get dashboard statistics
 * In real app, this would fetch from API
 */
export function getDashboardStats(): DashboardStats {
  return {
    totalUsers: 1250,
    activeSessions: 89,
    revenue: 4580000,
  }
}

/**
 * Calculate growth rate between two values
 */
export function calculateGrowthRate(current: number, previous: number): number {
  if (previous === 0) return 0
  return ((current - previous) / previous) * 100
}

/**
 * Format currency in JPY
 */
export function formatCurrency(amount: number): string {
  return new Intl.NumberFormat('ja-JP', {
    style: 'currency',
    currency: 'JPY',
  }).format(amount)
}
