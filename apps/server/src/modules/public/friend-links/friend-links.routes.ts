import { createRoute, z } from '@hono/zod-openapi'
import * as HttpStatusCodes from '~/constants/http-status-codes'
import { successResponseSchema, errorResponseSchema } from '~/utils/response'

export const createSchema = z.object({
  siteName: z.string().min(1).max(64, '不能超过64个字符'),
  siteUrl: z.url('站点url格式有误'),
  avatarUrl: z.url('头像url格式有误').or(z.literal('')).nullable().optional(),
  description: z.string().max(255, '不能超过255个字符').or(z.literal('')).nullable().optional(),
  applicantEmail: z.email('联系邮箱格式有误').or(z.literal('')).nullable().optional(),
})

export const createFriendLinkRoute = createRoute({
  tags: ['Public/FriendLinks'],
  summary: '申请友链',
  method: 'post',
  path: '/friend-links',
  request: {
    body: { content: { 'application/json': { schema: createSchema } } },
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
  },
})
