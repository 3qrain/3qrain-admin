import { apiClient } from '~/lib/axios'
import type { Comment, CommentListResult } from './types'

export interface CommentQuery {
  page?: number
  pageSize?: number
  offset?: number
  id?: number
  status?: string
  targetType?: string
  targetId?: number
  deleted?: string
  keyword?: string
  parentOnly?: boolean
  t?: number
}

export async function getComments(query: CommentQuery = {}) {
  const { data } = await apiClient.get<{ data: CommentListResult }>('/admin/comments', { params: query })
  return data.data
}

export async function createComment(body: { targetType: string; targetId: number; content: string; parentId?: number; replyToId?: number; replyToUserId?: number }) {
  const { data } = await apiClient.post<{ data: Comment }>('/admin/comments', body)
  return data.data
}

export async function updateComment(id: number, body: { content: string }) {
  const { data } = await apiClient.patch<{ data: Comment }>(`/admin/comments/${id}`, body)
  return data.data
}

export async function approveComment(id: number) {
  const { data } = await apiClient.patch<{ data: Comment }>(`/admin/comments/${id}/review`, { action: 'approve' })
  return data.data
}

export async function pinComment(id: number, pinned: boolean) {
  const { data } = await apiClient.patch<{ data: Comment }>(`/admin/comments/${id}/pin`, { pinned })
  return data.data
}

export async function deleteComment(ids: number[]) {
  const { data } = await apiClient.post('/admin/comments/trash', { ids })
  return data
}

export async function restoreComment(id: number) {
  const { data } = await apiClient.patch<{ data: Comment }>(`/admin/comments/${id}/restore`)
  return data.data
}

export async function getReplies(id: number) {
  const { data } = await apiClient.get<{ data: { list: Comment[]; total: number } }>(`/admin/comments/${id}/replies`)
  return data.data
}

export async function emptyTrashComments() {
  const { data } = await apiClient.delete('/admin/trash/comments')
  return data
}

export async function destroyComment(ids: number[]) {
  const { data } = await apiClient.post('/admin/comments/destroy', { ids })
  return data
}
