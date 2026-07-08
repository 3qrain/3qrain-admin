export interface FriendLink {
  id: number
  siteName: string
  siteUrl: string
  avatarUrl: string | null
  description: string | null
  applicantEmail: string
  status: 'pending' | 'approved' | 'rejected'
  rejectReason: string | null
  approvedAt: string | null
  rejectedAt: string | null
  createdAt: string
  updatedAt: string
}

export interface FriendLinkListResult {
  list: FriendLink[]
  total: number
  page: number
  pageSize: number
}

export interface CreateFriendLinkInput {
  siteName: string
  siteUrl: string
  avatarUrl?: string
  description?: string
}

export interface FriendLinkListQuery {
  page?: number
  pageSize?: number
  offset?: string
  status?: string
}
