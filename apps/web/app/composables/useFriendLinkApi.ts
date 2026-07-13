import type { ApiResponse } from '~/types/api'

export interface FriendLinkItem {
  id: number
  siteName: string
  siteUrl: string
  avatarUrl: string | null
  description: string | null
}

export interface FriendLinkApplyBody {
  siteName: string
  siteUrl: string
  avatarUrl?: string | null
  description?: string | null
  applicantEmail?: string | null
}

export function useFriendLinkApi() {
  const { $api } = useNuxtApp()

  function getList() {
    return $api<ApiResponse<FriendLinkItem[]>>('/friend-links')
  }

  function create(body: FriendLinkApplyBody) {
    return $api<ApiResponse<{}>>('/friend-links', {
      method: 'POST',
      body,
    })
  }

  return { getList, create }
}
