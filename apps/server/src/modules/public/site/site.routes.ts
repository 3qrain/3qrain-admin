import { createRoute, z } from '@hono/zod-openapi'
import * as HttpStatusCodes from '~/constants/http-status-codes'
import { successResponseSchema } from '~/utils/response'

const siteSchema = z.object({
  name: z.string(),
  avatar: z.string(),
  bio: z.string(),
  motto: z.string(),
  copyright: z.string(),
  filingNumber: z.string(),
  filingUrl: z.string(),
})

export const siteRoute = createRoute({
  tags: ['Public/Site'],
  summary: '获取站点信息',
  method: 'get',
  path: '/site',
  responses: {
    [HttpStatusCodes.OK]: {
      content: { 'application/json': { schema: successResponseSchema(siteSchema) } },
      description: '站点信息',
    },
  },
})
