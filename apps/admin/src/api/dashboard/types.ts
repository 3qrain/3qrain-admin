export interface DashboardOverview {
  totalViews: number
  onlineVisitors: number
  posts: {
    total: number
    published: number
    draft: number
    archived: number
  }
  notes: {
    total: number
    published: number
    hidden: number
  }
  comments: {
    total: number
    pending: number
  }
  media: number
  visitors: number
  friendLinks: {
    approved: number
    pending: number
  }
  unreadNotifications: number
}

export interface DashboardRecentComment {
  id: number
  content: string
  status: string
  parentId: number | null
  targetType: string
  createdAt: string
  user: {
    username: string
    avatarUrl: string
  }
}

export interface DashboardTopPost {
  id: number
  title: string
  viewCount: number
  updatedAt: string
}

export interface DashboardData {
  overview: DashboardOverview
  recentComments: DashboardRecentComment[]
  topPosts: DashboardTopPost[]
}
