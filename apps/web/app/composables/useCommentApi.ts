import type { ApiResponse, PaginatedData } from '~/types/api'

export interface CommentUser {
  id: number
  username: string
  avatarUrl: string
  role: 'system' | 'admin' | 'visitor'
}

export interface CommentItem {
  id: number
  targetType: string
  targetId: number
  userId: number
  user: CommentUser
  parentId: number | null
  replies: CommentItem[] | []
  replyToId: number | null
  replyToUserId: number | null
  replyToUser: CommentUser | null
  content: string
  isPinned: boolean
  status: string
  createdAt: string
}

export function useCommentApi() {
  const { $api } = useNuxtApp()

  function getList(targetType: string, targetId: number, page = 1, t?: string) {
    const query: Record<string, any> = { targetType, targetId, pageSize: 10, page }
    if (t) query.t = t
    return $api<ApiResponse<{ list: CommentItem[]; total: number; parentTotal: number; pageSize: number }>>('/comments', { query })
  }

  function create(body: { targetType: string; targetId: number; content: string; parentId?: number; replyToId?: number; replyToUserId?: number }) {
    return $api<ApiResponse<CommentItem>>('/comments', { method: 'POST', body })
  }

  return { getList, create }
}
