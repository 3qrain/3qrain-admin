import type { ApiResponse, PaginatedData } from '~/types/api'
import type { TiptapDocument } from '@3qrain/shared'

export interface PostItem {
  id: number
  title: string
  slug: string
  summary: string | null
  cover: string | null
  isPinned: boolean
  viewCount: number
  categoryId: number | null
  category: { id: number; name: string; slug: string } | null
  tags: { id: number; name: string; slug: string }[]
  createdAt: string
}

export interface PostDetail extends PostItem {
  content: TiptapDocument
  updatedAt: string
}

export function usePostApi() {
  const { $api } = useNuxtApp()
  const requestFetch = useRequestFetch()

  function getList(query: { page?: number; pageSize?: number; category?: string; tag?: string }) {
    return $api<ApiResponse<PaginatedData<PostItem>>>('/posts', { query })
  }

  function getDetail(slug: string) {
    return requestFetch<ApiResponse<PostDetail>>(`/_bff/posts/${encodeURIComponent(slug)}`)
  }

  return { getList, getDetail }
}
