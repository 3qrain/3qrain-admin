import { createRoute, z } from '@hono/zod-openapi'
import * as HttpStatusCodes from '~/constants/http-status-codes'
import { successResponseSchema, errorResponseSchema } from '~/utils/response'

// ---- Response Schemas ----

const notificationSchema = z.object({
  id: z.number(),
  type: z.string(),
  title: z.string(),
  content: z.string().nullable(),
  meta: z.string().nullable(),
  isRead: z.number(),
  emailStatus: z.string(),
  emailError: z.string().nullable(),
  emailSentAt: z.string().nullable(),
  createdAt: z.string(),
  updatedAt: z.string(),
})

const notificationListSchema = z.object({
  list: z.array(notificationSchema),
  total: z.number(),
  page: z.number(),
  pageSize: z.number(),
})

const unreadCountSchema = z.object({
  count: z.number(),
})

// ---- Routes ----

export const listRoute = createRoute({
  tags: ['Admin/Notifications'],
  summary: '获取通知列表',
  method: 'get',
  path: '/notifications',
  request: {
    query: z.object({
      page: z.string().optional(),
      pageSize: z.string().optional(),
      offset: z.string().optional(),
      types: z.string().optional(),
      isRead: z.string().optional(),
    }),
  },
  responses: {
    [HttpStatusCodes.OK]: {
      content: { 'application/json': { schema: successResponseSchema(notificationListSchema) } },
      description: '获取成功',
    },
  },
})

export const unreadCountRoute = createRoute({
  tags: ['Admin/Notifications'],
  summary: '获取未读通知数',
  method: 'get',
  path: '/notifications/unread-count',
  responses: {
    [HttpStatusCodes.OK]: {
      content: { 'application/json': { schema: successResponseSchema(unreadCountSchema) } },
      description: '获取成功',
    },
  },
})

export const markReadRoute = createRoute({
  tags: ['Admin/Notifications'],
  summary: '标记已读',
  method: 'patch',
  path: '/notifications/{id}/read',
  request: {
    params: z.object({ id: z.string() }),
  },
  responses: {
    [HttpStatusCodes.OK]: {
      content: { 'application/json': { schema: successResponseSchema(z.object({})) } },
      description: '已读',
    },
    [HttpStatusCodes.NOT_FOUND]: {
      content: { 'application/json': { schema: errorResponseSchema } },
      description: '通知不存在',
    },
  },
})

export const markAllReadRoute = createRoute({
  tags: ['Admin/Notifications'],
  summary: '全部标记已读',
  method: 'patch',
  path: '/notifications/read-all',
  responses: {
    [HttpStatusCodes.OK]: {
      content: { 'application/json': { schema: successResponseSchema(z.object({})) } },
      description: '全部已读',
    },
  },
})

export const destroyRoute = createRoute({
  tags: ['Admin/Notifications'],
  summary: '删除通知（批量）',
  method: 'post',
  path: '/notifications/destroy',
  request: {
    body: { content: { 'application/json': { schema: z.object({ ids: z.array(z.number().int().positive()) }) } } },
  },
  responses: {
    [HttpStatusCodes.OK]: {
      content: { 'application/json': { schema: successResponseSchema(z.object({})) } },
      description: '已删除',
    },
  },
})

export const clearReadRoute = createRoute({
  tags: ['Admin/Notifications'],
  summary: '清空已读通知',
  method: 'delete',
  path: '/notifications',
  responses: {
    [HttpStatusCodes.OK]: {
      content: { 'application/json': { schema: successResponseSchema(z.object({})) } },
      description: '已清空已读通知',
    },
  },
})
