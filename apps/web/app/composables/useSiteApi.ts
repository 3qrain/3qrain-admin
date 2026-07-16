import type { ApiResponse } from '~/types/api'

export interface SiteInfo {
  name: string
  avatar: string
  bio: string
  motto: string
  copyright: string
  filingNumber: string
  filingUrl: string
}

export function useSiteApi() {
  const { $api } = useNuxtApp()

  function get() {
    return $api<ApiResponse<SiteInfo>>('/site')
  }

  return { get }
}
