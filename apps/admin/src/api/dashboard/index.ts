import { apiClient } from '~/lib/axios'
import type { DashboardData } from './types'

export async function getDashboard() {
  const { data } = await apiClient.get<{ data: DashboardData }>('/admin/dashboard')
  return data.data
}
