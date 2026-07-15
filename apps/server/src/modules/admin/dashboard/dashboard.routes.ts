import { createRoute, z } from '@hono/zod-openapi'
import * as HttpStatusCodes from '~/constants/http-status-codes'
import { successResponseSchema } from '~/utils/response'

const contentCountSchema = z.object({
  total: z.number(),
  published: z.number(),
  draft: z.number(),
  archived: z.number()
})

const noteCountSchema = z.object({
  total: z.number(),
  published: z.number(),
  hidden: z.number()
})

const dashboardOverviewSchema = z.object({
  totalViews: z.number(),
  onlineVisitors: z.number(),
  posts: contentCountSchema,
  notes: noteCountSchema,
  comments: z.object({ total: z.number(), pending: z.number() }),
  media: z.number(),
  visitors: z.number(),
  friendLinks: z.object({ approved: z.number(), pending: z.number() }),
  unreadNotifications: z.number()
})

const recentCommentSchema = z.object({
  id: z.number(),
  content: z.string(),
  status: z.string(),
  parentId: z.number().nullable(),
  targetType: z.string(),
  createdAt: z.string(),
  user: z.object({
    username: z.string(),
    avatarUrl: z.string()
  })
})

const topPostSchema = z.object({
  id: z.number(),
  title: z.string(),
  viewCount: z.number(),
  updatedAt: z.string()
})

const dashboardSchema = z.object({
  overview: dashboardOverviewSchema,
  recentComments: z.array(recentCommentSchema),
  topPosts: z.array(topPostSchema)
})

export const overviewRoute = createRoute({
  tags: ['Admin/Dashboard'],
  summary: '获取仪表盘数据',
  method: 'get',
  path: '/dashboard',
  responses: {
    [HttpStatusCodes.OK]: {
      content: { 'application/json': { schema: successResponseSchema(dashboardSchema) } },
      description: '获取成功'
    }
  }
})
