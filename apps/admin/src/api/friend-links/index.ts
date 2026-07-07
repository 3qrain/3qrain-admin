import { apiClient } from '~/lib/axios'
import type { FriendLinkListResult, FriendLinkListQuery } from './types'

export async function updateFriendLink(id: number, body: { siteName?: string; siteUrl?: string; avatarUrl?: string; description?: string }) {
  const { data } = await apiClient.patch(`/admin/friend-links/${id}`, body)
  return data
}

export async function createFriendLink(body: { siteName: string; siteUrl: string; avatarUrl?: string; description?: string }) {
  const { data } = await apiClient.post('/admin/friend-links', body)
  return data
}

export async function getFriendLinkCounts() {
  const { data } = await apiClient.get<{ data: { pending: number; approved: number; rejected: number } }>('/admin/friend-links/counts')
  return data.data
}

export async function getFriendLinks(params?: FriendLinkListQuery) {
  const { data } = await apiClient.get<{ data: FriendLinkListResult }>('/admin/friend-links', { params })
  return data.data
}

export async function approveFriendLink(id: number) {
  const { data } = await apiClient.patch(`/admin/friend-links/${id}/approve`)
  return data
}

export async function rejectFriendLink(id: number, reason: string) {
  const { data } = await apiClient.patch(`/admin/friend-links/${id}/reject`, { reason })
  return data
}

export async function deleteFriendLinks(ids: number[]) {
  const { data } = await apiClient.post('/admin/friend-links/destroy', { ids })
  return data
}
