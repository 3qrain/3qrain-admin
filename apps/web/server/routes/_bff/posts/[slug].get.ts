import type { ApiResponse } from '~~/app/types/api'
import type { PostDetail } from '~~/app/composables/usePostApi'
import { API_PREFIX } from '@3qrain/shared'
import { preparePostContent } from '~~/server/utils/post-content'

export default defineEventHandler(async event => {
  const slug = getRouterParam(event, 'slug')
  if (!slug) {
    throw createError({ statusCode: 400, statusMessage: '缺少文章标识' })
  }

  const response = await event.$fetch<ApiResponse<PostDetail>>(
    `${API_PREFIX}/posts/${encodeURIComponent(slug)}`,
  )

  return {
    ...response,
    data: {
      ...response.data,
      content: await preparePostContent(response.data.content),
    },
  }
})
