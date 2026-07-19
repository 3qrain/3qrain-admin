import { createRoute, z } from '@hono/zod-openapi'
import * as HttpStatusCodes from '~/constants/http-status-codes'
import { successResponseSchema, errorResponseSchema } from '~/utils/response'

const userSchema = z.object({
  id: z.number(),
  username: z.string(),
  avatarUrl: z.string(),
  role: z.enum(['system', 'admin', 'visitor']),
})

const commentSchema = z.object({
  id: z.number(),
  targetType: z.string(),
  targetId: z.number(),
  userId: z.number(),
  user: userSchema,
  parentId: z.number().nullable(),
  replyToId: z.number().nullable(),
  replyToUserId: z.number().nullable(),
  replyToUser: userSchema.nullable(),
  content: z.string(),
  isPinned: z.boolean(),
  status: z.string(),
  deletedAt: z.string().nullable(),
  ip: z.string().nullable(),
  userAgent: z.string().nullable(),
  replyCount: z.number().optional(),
  createdAt: z.string(),
  updatedAt: z.string(),
})

const commentListSchema = z.object({
  list: z.array(commentSchema),
  total: z.number(),
  page: z.number(),
  pageSize: z.number(),
})

export const listCommentsRoute = createRoute({
  tags: ['Admin/Comments'],
  summary: '获取评论列表（管理）',
  method: 'get',
  path: '/comments',
  request: {
    query: z.object({
      page: z.string().optional(),
      pageSize: z.string().optional(),
      offset: z.string().optional(),
      id: z.string().optional(),
      status: z.string().optional(),
      targetType: z.string().optional(),
      targetId: z.string().optional(),
      deleted: z.string().optional(),
      keyword: z.string().optional(),
      parentOnly: z.string().optional(),
      t: z.string().optional(),
    }),
  },
  responses: {
    [HttpStatusCodes.OK]: {
      content: { 'application/json': { schema: successResponseSchema(commentListSchema) } },
      description: '评论列表',
    },
  },
})

export const pendingCountRoute = createRoute({
  tags: ['Admin/Comments'],
  summary: '待审核评论数量',
  method: 'get',
  path: '/comments/pending-count',
  responses: {
    [HttpStatusCodes.OK]: {
      content: { 'application/json': { schema: successResponseSchema(z.object({ count: z.number() })) } },
      description: '获取成功',
    },
  },
})

export const createCommentRoute = createRoute({
  tags: ['Admin/Comments'],
  summary: '管理员发表评论',
  method: 'post',
  path: '/comments',
  request: {
    body: {
      content: {
        'application/json': {
          schema: z.object({
            targetType: z.enum(['post', 'note']),
            targetId: z.number().int().positive(),
            content: z.string().trim().min(1).max(500),
            parentId: z.number().int().positive().optional(),
            replyToId: z.number().int().positive().optional(),
            replyToUserId: z.number().int().positive().optional(),
          }),
        },
      },
    },
  },
  responses: {
    [HttpStatusCodes.CREATED]: {
      content: { 'application/json': { schema: successResponseSchema(commentSchema) } },
      description: '创建成功',
    },
    [HttpStatusCodes.BAD_REQUEST]: {
      content: { 'application/json': { schema: errorResponseSchema } },
      description: '参数校验失败',
    },
  },
})

export const updateCommentRoute = createRoute({
  tags: ['Admin/Comments'],
  summary: '编辑评论',
  method: 'patch',
  path: '/comments/{id}',
  request: {
    params: z.object({ id: z.string() }),
    body: {
      content: {
        'application/json': {
          schema: z.object({ content: z.string().trim().min(1).max(500) }),
        },
      },
    },
  },
  responses: {
    [HttpStatusCodes.OK]: {
      content: { 'application/json': { schema: successResponseSchema(commentSchema) } },
      description: '更新成功',
    },
    [HttpStatusCodes.NOT_FOUND]: {
      content: { 'application/json': { schema: errorResponseSchema } },
      description: '评论不存在',
    },
  },
})

export const reviewCommentRoute = createRoute({
  tags: ['Admin/Comments'],
  summary: '审核评论',
  method: 'patch',
  path: '/comments/{id}/review',
  request: {
    params: z.object({ id: z.string() }),
    body: {
      content: {
        'application/json': {
          schema: z.object({ action: z.enum(['approve']) }),
        },
      },
    },
  },
  responses: {
    [HttpStatusCodes.OK]: {
      content: { 'application/json': { schema: successResponseSchema(commentSchema) } },
      description: '审核完成',
    },
    [HttpStatusCodes.NOT_FOUND]: {
      content: { 'application/json': { schema: errorResponseSchema } },
      description: '评论不存在',
    },
  },
})

export const pinCommentRoute = createRoute({
  tags: ['Admin/Comments'],
  summary: '置顶/取消置顶',
  method: 'patch',
  path: '/comments/{id}/pin',
  request: {
    params: z.object({ id: z.string() }),
    body: {
      content: {
        'application/json': {
          schema: z.object({ pinned: z.boolean() }),
        },
      },
    },
  },
  responses: {
    [HttpStatusCodes.OK]: {
      content: { 'application/json': { schema: successResponseSchema(z.object({})) } },
      description: '操作成功',
    },
    [HttpStatusCodes.NOT_FOUND]: {
      content: { 'application/json': { schema: errorResponseSchema } },
      description: '评论不存在',
    },
  },
})

export const deleteCommentRoute = createRoute({
  tags: ['Admin/Comments'],
  summary: '批量移入回收站',
  method: 'post',
  path: '/comments/trash',
  request: {
    body: { content: { 'application/json': { schema: z.object({ ids: z.array(z.number().int().positive()) }) } } },
  },
  responses: {
    [HttpStatusCodes.OK]: {
      content: { 'application/json': { schema: successResponseSchema(z.object({})) } },
      description: '已移入回收站',
    },
    [HttpStatusCodes.NOT_FOUND]: {
      content: { 'application/json': { schema: errorResponseSchema } },
      description: '评论不存在',
    },
  },
})

export const restoreCommentRoute = createRoute({
  tags: ['Admin/Comments'],
  summary: '恢复评论',
  method: 'patch',
  path: '/comments/{id}/restore',
  request: { params: z.object({ id: z.string() }) },
  responses: {
    [HttpStatusCodes.OK]: {
      content: { 'application/json': { schema: successResponseSchema(commentSchema) } },
      description: '已恢复',
    },
    [HttpStatusCodes.NOT_FOUND]: {
      content: { 'application/json': { schema: errorResponseSchema } },
      description: '评论不存在',
    },
  },
})

const repliesListSchema = z.object({ list: z.array(commentSchema), total: z.number() })

export const repliesRoute = createRoute({
  tags: ['Admin/Comments'],
  summary: '获取某条评论的所有回复',
  method: 'get',
  path: '/comments/{id}/replies',
  request: { params: z.object({ id: z.string() }) },
  responses: {
    [HttpStatusCodes.OK]: {
      content: { 'application/json': { schema: successResponseSchema(repliesListSchema) } },
      description: '回复列表',
    },
    [HttpStatusCodes.NOT_FOUND]: {
      content: { 'application/json': { schema: errorResponseSchema } },
      description: '评论不存在',
    },
  },
})

export const emptyTrashRoute = createRoute({
  tags: ['Admin/Comments'],
  summary: '清空回收站',
  method: 'delete',
  path: '/trash/comments',
  responses: {
    [HttpStatusCodes.OK]: {
      content: { 'application/json': { schema: successResponseSchema(z.object({})) } },
      description: '回收站已清空',
    },
  },
})

export const destroyCommentRoute = createRoute({
  tags: ['Admin/Comments'],
  summary: '批量永久删除',
  method: 'post',
  path: '/comments/destroy',
  request: {
    body: { content: { 'application/json': { schema: z.object({ ids: z.array(z.number().int().positive()) }) } } },
  },
  responses: {
    [HttpStatusCodes.OK]: {
      content: { 'application/json': { schema: successResponseSchema(z.object({})) } },
      description: '已永久删除',
    },
    [HttpStatusCodes.NOT_FOUND]: {
      content: { 'application/json': { schema: errorResponseSchema } },
      description: '评论不存在',
    },
  },
})
