import { apiClient } from '~/lib/axios'
import type { FullConfig } from './types'

export async function getConfig(keys?: string[]) {
  const params = keys?.length ? { keys: keys.join(',') } : undefined
  const { data } = await apiClient.get<{ data: FullConfig }>('/admin/config', { params })
  return data.data
}

export async function updateConfig(key: string, body: Record<string, unknown>) {
  const { data } = await apiClient.patch(`/admin/config/${key}`, body)
  return data.data
}

// ---- Email ----

export interface EmailConfig {
  enabled: boolean
  host: string
  port: number
  user: string
  pass: string
}

export async function getEmailConfig() {
  const { data } = await apiClient.get<{ data: EmailConfig }>('/admin/email-config')
  return data.data
}

export async function saveEmailConfig(config: EmailConfig) {
  const { data } = await apiClient.put('/admin/email-config', config)
  return data
}

export async function testEmailConnection() {
  const { data } = await apiClient.post('/admin/email-config/test')
  return data
}

export async function sendTestEmail() {
  const { data } = await apiClient.post('/admin/email-config/test-send')
  return data
}
