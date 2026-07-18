import { createRoute, z } from '@hono/zod-openapi'
import * as HttpStatusCodes from '~/constants/http-status-codes'
import { successResponseSchema, errorResponseSchema } from '~/utils/response'
import { authGuardPublic } from '~/middleware/auth-guard-public'

export const createCommentSchema = z.object({
  targetType: z.enum(['post', 'note']),
  targetId: z.number().int().positive(),
  content: z.string().trim().min(1).max(500),
  parentId: z.number().int().positive().optional(),
  replyToId: z.number().int().positive().optional(),
  replyToUserId: z.number().int().positive().optional(),
})

const commentUserSchema = z.object({
  id: z.number(),
  username: z.string(),
  avatarUrl: z.string(),
})

const commentSchema = z.object({
  id: z.number(),
  targetType: z.string(),
  targetId: z.number(),
  userId: z.number(),
  user: commentUserSchema,
  parentId: z.number().nullable(),
  replyToId: z.number().nullable(),
  replyToUserId: z.number().nullable(),
  replyToUser: commentUserSchema.nullable(),
  content: z.string(),
  isPinned: z.union([z.boolean(), z.number()]),
  createdAt: z.string().nullable(),
})

export const listCommentsRoute = createRoute({
  tags: ['Public/Comments'],
  summary: '获取评论列表',
  method: 'get',
  path: '/comments',
  request: {
    query: z.object({
      targetType: z.string(),
      targetId: z.string(),
      page: z.string().optional(),
      pageSize: z.string().optional(),
      t: z.string().optional(),
    }),
  },
  responses: {
    [HttpStatusCodes.OK]: {
      content: { 'application/json': { schema: successResponseSchema(z.object({
        list: z.array(commentSchema),
        total: z.number(),
        parentTotal: z.number(),
        pageSize: z.number(),
      })) } },
      description: '获取成功',
    },
  },
})

export const createCommentRoute = createRoute({
  tags: ['Public/Comments'],
  summary: '发表评论',
  method: 'post',
  path: '/comments',
  middleware: [authGuardPublic],
  request: {
    body: { content: { 'application/json': { schema: createCommentSchema } } },
  },
  responses: {
    [HttpStatusCodes.CREATED]: {
      content: { 'application/json': { schema: successResponseSchema(commentSchema) } },
      description: '评论成功',
    },
    [HttpStatusCodes.BAD_REQUEST]: {
      content: { 'application/json': { schema: errorResponseSchema } },
      description: '参数校验失败',
    },
  },
})
