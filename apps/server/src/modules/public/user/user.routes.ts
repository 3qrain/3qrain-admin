import { createRoute, z } from '@hono/zod-openapi'
import * as HttpStatusCodes from '~/constants/http-status-codes'
import { successResponseSchema, errorResponseSchema } from '~/utils/response'
import { authGuardPublic } from '~/middleware/auth-guard-public'

const userSchema = z.object({
  id: z.number(),
  username: z.string(),
  email: z.string(),
  avatarUrl: z.string(),
  role: z.string(),
})

export const meRoute = createRoute({
  tags: ['Public/User'],
  summary: '获取当前用户',
  method: 'get',
  path: '/user/me',
  middleware: [authGuardPublic],
  responses: {
    [HttpStatusCodes.OK]: {
      content: { 'application/json': { schema: successResponseSchema(userSchema) } },
      description: '获取成功',
    },
  },
})

export const updateMeSchema = z.object({
  email: z.string().email('邮箱格式不正确').max(254, '邮箱过长').optional(),
}).strict()

export const updateMeRoute = createRoute({
  tags: ['Public/User'],
  summary: '更新当前用户信息',
  method: 'patch',
  path: '/user/me',
  middleware: [authGuardPublic] ,
  request: {
    body: { content: { 'application/json': { schema: updateMeSchema } } },
  },
  responses: {
    [HttpStatusCodes.OK]: {
      content: { 'application/json': { schema: successResponseSchema(userSchema) } },
      description: '更新成功',
    },
    [HttpStatusCodes.BAD_REQUEST]: {
      content: { 'application/json': { schema: errorResponseSchema } },
      description: '参数校验失败',
    },
  },
})

export const logoutRoute = createRoute({
  tags: ['Public/User'],
  summary: '退出登录',
  method: 'post',
  path: '/user/logout',
  middleware: [authGuardPublic] ,
  responses: {
    [HttpStatusCodes.OK]: {
      content: { 'application/json': { schema: successResponseSchema(z.object({})) } },
      description: '退出成功',
    },
  },
})
