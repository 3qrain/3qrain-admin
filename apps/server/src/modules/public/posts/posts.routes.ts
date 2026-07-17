import { createRoute, z } from '@hono/zod-openapi'
import * as HttpStatusCodes from '~/constants/http-status-codes'
import { successResponseSchema, errorResponseSchema } from '~/utils/response'

const tagSchema = z.object({ id: z.number(), name: z.string(), slug: z.string() })
const categorySchema = z.object({ id: z.number(), name: z.string(), slug: z.string() })

const postItemSchema = z.object({
  id: z.number(),
  title: z.string(),
  slug: z.string(),
  summary: z.string().nullable(),
  cover: z.string().nullable(),
  isPinned: z.boolean(),
  viewCount: z.number(),
  categoryId: z.number().nullable(),
  category: categorySchema.nullable(),
  tags: z.array(tagSchema),
  createdAt: z.string(),
})

const postListSchema = z.object({
  list: z.array(postItemSchema),
  total: z.number(),
  page: z.number(),
  pageSize: z.number(),
})

export const listPostsRoute = createRoute({
  tags: ['Public/Posts'],
  summary: '获取已发布文章列表',
  method: 'get',
  path: '/posts',
  request: {
    query: z.object({
      page: z.string().optional(),
      pageSize: z.string().optional(),
      category: z.string().optional(),
      tag: z.string().optional(),
    }),
  },
  responses: {
    [HttpStatusCodes.OK]: {
      content: { 'application/json': { schema: successResponseSchema(postListSchema) } },
      description: '文章列表',
    },
  },
})

const postDetailSchema = postItemSchema.extend({
  content: z.object({
    type: z.literal('doc'),
    content: z.array(z.any()),
  }),
  updatedAt: z.string(),
})

export const getPostRoute = createRoute({
  tags: ['Public/Posts'],
  summary: '获取文章详情',
  method: 'get',
  path: '/posts/{slug}',
  request: {
    params: z.object({ slug: z.string() }),
  },
  responses: {
    [HttpStatusCodes.OK]: {
      content: { 'application/json': { schema: successResponseSchema(postDetailSchema) } },
      description: '文章详情',
    },
    [HttpStatusCodes.NOT_FOUND]: {
      content: { 'application/json': { schema: errorResponseSchema } },
      description: '文章不存在',
    },
  },
})
