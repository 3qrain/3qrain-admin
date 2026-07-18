import type { EmailStatus, NotificationType } from '@3qrain/shared'
export interface NotificationItem {
  id: number
  type: NotificationType
  title: string
  content: string | null
  meta: string | null
  isRead: number
  emailStatus: EmailStatus
  emailError: string | null
  emailSentAt: string | null
  createdAt: string
  updatedAt: string | null
}

export interface NotificationListResult {
  list: NotificationItem[]
  total: number
  counts: {
    all: number
    unread: number
    read: number
  }
  page: number
  pageSize: number
}

export interface NotificationListQuery {
  page?: number
  pageSize?: number
  offset?: string
  types?: string
  isRead?: string
  t: number
}
