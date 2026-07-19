export const CONTENT_TYPE_LABELS: Record<string, string> = {
  post: '文章',
  note: '说说',
}

export interface CommentUser {
  id: number
  username: string
  avatarUrl: string
  role: 'system' | 'admin' | 'visitor'
}

export interface Comment {
  id: number
  targetType: string
  targetId: number
  userId: number
  user: CommentUser
  parentId: number | null
  replyToId: number | null
  replyToUserId: number | null
  replyToUser: CommentUser | null
  content: string
  isPinned: boolean
  status: string
  deletedAt: string | null
  ip: string | null
  userAgent: string | null
  replyCount?: number
  replies?: Comment[]
  createdAt: string
  updatedAt: string
}

export interface CommentListResult {
  list: Comment[]
  total: number
  page: number
  pageSize: number
}
