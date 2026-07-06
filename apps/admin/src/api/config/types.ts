export interface SiteInfo {
  bio: string
}

export interface Appearance {
  theme: 'system' | 'light' | 'dark'
}

export interface FullConfig {
  siteInfo: SiteInfo
  appearance: Appearance
  emailEnabled: boolean
}
