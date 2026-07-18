import { createRoute, z } from '@hono/zod-openapi'
import * as HttpStatusCodes from '~/constants/http-status-codes'
import { successResponseSchema, errorResponseSchema } from '~/utils/response'

export const createFriendLinkSchema = z.object({
  siteName: z.string().min(1).max(64, '不能超过64个字符'),
  siteUrl: z.url('站点url格式有误'),
  avatarUrl: z.url('头像url格式有误').or(z.literal('')).nullable().optional(),
  description: z.string().max(255, '不能超过255个字符').or(z.literal('')).nullable().optional(),
  applicantEmail: z.email('联系邮箱格式有误').or(z.literal('')).nullable().optional(),
})

const friendLinkItemSchema = z.object({
  id: z.number(),
  siteName: z.string(),
  siteUrl: z.string(),
  avatarUrl: z.string().nullable(),
  description: z.string().nullable(),
})

export const listApprovedRoute = createRoute({
  tags: ['Public/FriendLinks'],
  summary: '获取已通过友链列表',
  method: 'get',
  path: '/friend-links',
  responses: {
    [HttpStatusCodes.OK]: {
      content: { 'application/json': { schema: successResponseSchema(z.array(friendLinkItemSchema)) } },
      description: '获取成功',
    },
  },
})

export const createFriendLinkRoute = createRoute({
  tags: ['Public/FriendLinks'],
  summary: '申请友链',
  method: 'post',
  path: '/friend-links',
  request: {
    body: { content: { 'application/json': { schema: createFriendLinkSchema } } },
  },
  responses: {
    [HttpStatusCodes.CREATED]: {
      content: { 'application/json': { schema: successResponseSchema(z.object({})) } },
      description: '申请成功',
    },
    [HttpStatusCodes.BAD_REQUEST]: {
      content: { 'application/json': { schema: errorResponseSchema } },
      description: '参数校验失败',
    },
    [HttpStatusCodes.FORBIDDEN]: {
      content: { 'application/json': { schema: errorResponseSchema } },
      description: '友链申请暂时停用',
    },
  },
})
