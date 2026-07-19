export type NotificationType =
  | 'new_comment'
  | 'new_reply'
  | 'friend_apply'
  | 'friend_approve'
  | 'friend_reject'
  | 'new_post'
  | 'new_note'
  | 'system'

export type CommentEmailNotRequiredReason =
  | 'admin_comment'
  | 'self_reply'
  | 'review_notice_only'

export interface CommentNotificationMeta {
  targetType: 'post' | 'note'
  targetId: number
  commentId: number
  parentId: number | null
  replyToId: number | null
  pendingReview: boolean
  emailNotRequiredReason?: CommentEmailNotRequiredReason
}

export interface FriendApplyNotificationMeta {
  id: number
  siteName: string
  siteUrl: string
  applicantEmail: string | null
}

export interface FriendApplyResultNotificationMeta extends FriendApplyNotificationMeta {
  approved: boolean
  reason?: string
}

export interface NotificationMetaMap {
  new_comment: CommentNotificationMeta
  new_reply: CommentNotificationMeta
  friend_apply: FriendApplyNotificationMeta
  friend_approve: FriendApplyResultNotificationMeta
  friend_reject: FriendApplyResultNotificationMeta
  new_post: { slug: string }
  new_note: { noteId: number }
  system: Record<string, unknown>
}

export type NotificationMeta<T extends NotificationType> = NotificationMetaMap[T]

// WebSocket 和 Redis 中传输的是已经序列化的通知记录。
export interface NotificationPayload {
  id: number
  type: NotificationType
  title: string
  content?: string
  meta?: string
  createdAt: string
}
