import { createRoute, z } from '@hono/zod-openapi'
import * as HttpStatusCodes from '~/constants/http-status-codes'
import { successResponseSchema, errorResponseSchema } from '~/utils/response'

export const friendLinkStatusSchema = z.enum(['pending', 'approved', 'rejected'])

const friendLinkSchema = z.object({
  id: z.number(),
  siteName: z.string().min(1).max(64, '不能超过64个字符'),
  siteUrl: z.url('站点url格式有误'),
  avatarUrl: z.url('头像url格式有误').or(z.literal('')).nullable().optional(),
  description: z.string().max(255, '不能超过255个字符').or(z.literal('')).nullable().optional(),
  applicantEmail: z.email('联系邮箱格式有误').or(z.literal('')).nullable().optional(),
  status: z.string(),
  rejectReason: z.string().nullable(),
  approvedAt: z.string().nullable(),
  rejectedAt: z.string().nullable(),
  createdAt: z.string(),
  updatedAt: z.string()
})

export const createFriendLinkRoute = createRoute({
  tags: ['Admin/FriendLinks'],
  summary: '添加友链（直接通过）',
  method: 'post',
  path: '/friend-links',
  request: {
    body: {
      content: {
        'application/json': {
          schema: friendLinkSchema.pick({
            siteName: true,
            siteUrl: true,
            avatarUrl: true,
            description: true
          })
        }
      }
    }
  },
  responses: {
    [HttpStatusCodes.CREATED]: {
      content: { 'application/json': { schema: successResponseSchema(z.object({})) } },
      description: '添加成功'
    }
  }
})

export const listFriendLinksRoute = createRoute({
  tags: ['Admin/FriendLinks'],
  summary: '获取友链列表',
  method: 'get',
  path: '/friend-links',
  request: {
    query: z.object({
      page: z.string().optional(),
      pageSize: z.string().optional(),
      offset: z.string().optional(),
      status: friendLinkStatusSchema.optional()
    })
  },
  responses: {
    [HttpStatusCodes.OK]: {
      content: {
        'application/json': {
          schema: successResponseSchema(
            z.object({
              list: z.array(friendLinkSchema),
              total: z.number(),
              page: z.number(),
              pageSize: z.number()
            })
          )
        }
      },
      description: '获取成功'
    }
  }
})

export const approveFriendLinkRoute = createRoute({
  tags: ['Admin/FriendLinks'],
  summary: '通过友链申请',
  method: 'patch',
  path: '/friend-links/{id}/approve',
  request: { params: z.object({ id: z.string() }) },
  responses: {
    [HttpStatusCodes.OK]: {
      content: { 'application/json': { schema: successResponseSchema(z.object({})) } },
      description: '已通过'
    },
    [HttpStatusCodes.NOT_FOUND]: {
      content: { 'application/json': { schema: errorResponseSchema } },
      description: '友链不存在'
    }
  }
})

export const rejectFriendLinkRoute = createRoute({
  tags: ['Admin/FriendLinks'],
  summary: '拒绝友链申请',
  method: 'patch',
  path: '/friend-links/{id}/reject',
  request: {
    params: z.object({ id: z.string() }),
    body: { content: { 'application/json': { schema: z.object({ reason: z.string().min(1) }) } } }
  },
  responses: {
    [HttpStatusCodes.OK]: {
      content: { 'application/json': { schema: successResponseSchema(z.object({})) } },
      description: '已拒绝'
    },
    [HttpStatusCodes.NOT_FOUND]: {
      content: { 'application/json': { schema: errorResponseSchema } },
      description: '友链不存在'
    }
  }
})

export const updateFriendLinkRoute = createRoute({
  tags: ['Admin/FriendLinks'],
  summary: '编辑友链',
  method: 'patch',
  path: '/friend-links/{id}',
  request: {
    params: z.object({ id: z.string() }),
    body: {
      content: {
        'application/json': {
          schema: friendLinkSchema.pick({
            siteName: true,
            siteUrl: true,
            avatarUrl: true,
            description: true
          })
        }
      }
    }
  },
  responses: {
    [HttpStatusCodes.OK]: {
      content: { 'application/json': { schema: successResponseSchema(z.object({})) } },
      description: '更新成功'
    }
  }
})

export const countsRoute = createRoute({
  tags: ['Admin/FriendLinks'],
  summary: '各状态数量',
  method: 'get',
  path: '/friend-links/counts',
  responses: {
    [HttpStatusCodes.OK]: {
      content: { 'application/json': { schema: successResponseSchema(z.object({
        pending: z.number(),
        approved: z.number(),
        rejected: z.number(),
      })) } },
      description: '获取成功',
    },
  },
})

export const destroyFriendLinksRoute = createRoute({
  tags: ['Admin/FriendLinks'],
  summary: '删除友链（批量）',
  method: 'post',
  path: '/friend-links/destroy',
  request: {
    body: { content: { 'application/json': { schema: z.object({ ids: z.array(z.number().int().positive()) }) } } }
  },
  responses: {
    [HttpStatusCodes.OK]: {
      content: { 'application/json': { schema: successResponseSchema(z.object({})) } },
      description: '已删除'
    }
  }
})
