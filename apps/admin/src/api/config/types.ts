export interface SiteInfo {
  bio: string
  motto: string
  copyright: string
  filingNumber: string
  filingUrl: string
}

export interface Appearance {
  theme: 'system' | 'light' | 'dark'
}

export interface EmailConfig {
  enabled: boolean
  host: string
  port: number
  user: string
  pass: string
}

export interface CommentsConfig {
  enabled: boolean
  reviewEnabled: boolean
}

export interface FriendLinksConfig {
  applicationEnabled: boolean
}

export interface FullConfig {
  siteInfo: SiteInfo
  appearance: Appearance
  email: EmailConfig
  comments: CommentsConfig
  friendLinks: FriendLinksConfig
}
