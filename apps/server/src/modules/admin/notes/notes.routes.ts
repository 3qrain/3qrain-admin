import { createRoute, z } from '@hono/zod-openapi'
import * as HttpStatusCodes from '~/constants/http-status-codes'
import { successResponseSchema, errorResponseSchema } from '~/utils/response'

const noteSchema = z.object({
  id: z.number(),
  content: z.string(),
  isPublished: z.boolean(),
  createdAt: z.string(),
  updatedAt: z.string(),
})

const createNoteSchema = z.object({
  content: z.string().min(1, '内容不能为空'),
  isPublished: z.boolean().optional(),
  tagIds: z.array(z.number()).optional(),
  mediaIds: z.array(z.number()).optional(),
}).strict()

const updateNoteSchema = z.object({
  content: z.string().min(1, '内容不能为空').optional(),
  isPublished: z.boolean().optional(),
  tagIds: z.array(z.number()).optional(),
  mediaIds: z.array(z.number()).optional(),
}).strict()

export const listNotesRoute = createRoute({
  tags: ['Admin/Notes'],
  summary: '说说列表',
  method: 'get',
  path: '/notes',
  responses: {
    [HttpStatusCodes.OK]: {
      content: { 'application/json': { schema: successResponseSchema(z.object({})) } },
      description: '获取成功',
    },
  },
})

export const createNoteRoute = createRoute({
  tags: ['Admin/Notes'],
  summary: '发布说说',
  method: 'post',
  path: '/notes',
  request: {
    body: { content: { 'application/json': { schema: createNoteSchema } } },
  },
  responses: {
    [HttpStatusCodes.CREATED]: {
      content: { 'application/json': { schema: successResponseSchema(noteSchema) } },
      description: '发布成功',
    },
  },
})

export const updateNoteRoute = createRoute({
  tags: ['Admin/Notes'],
  summary: '编辑说说',
  method: 'patch',
  path: '/notes/{id}',
  request: {
    params: z.object({ id: z.string() }),
    body: { content: { 'application/json': { schema: updateNoteSchema } } },
  },
  responses: {
    [HttpStatusCodes.OK]: {
      content: { 'application/json': { schema: successResponseSchema(noteSchema) } },
      description: '更新成功',
    },
    [HttpStatusCodes.NOT_FOUND]: {
      content: { 'application/json': { schema: errorResponseSchema } },
      description: '不存在',
    },
  },
})

export const deleteNoteRoute = createRoute({
  tags: ['Admin/Notes'],
  summary: '批量移入回收站',
  method: 'post',
  path: '/notes/trash',
  request: {
    body: { content: { 'application/json': { schema: z.object({ ids: z.array(z.number().int().positive()) }) } } },
  },
  responses: {
    [HttpStatusCodes.OK]: {
      content: { 'application/json': { schema: successResponseSchema(z.object({})) } },
      description: '已移至回收站',
    },
  },
})

export const restoreNoteRoute = createRoute({
  tags: ['Admin/Notes'],
  summary: '恢复说说',
  method: 'post',
  path: '/notes/{id}/restore',
  request: {
    params: z.object({ id: z.string() }),
  },
  responses: {
    [HttpStatusCodes.OK]: {
      content: { 'application/json': { schema: successResponseSchema(z.object({})) } },
      description: '已恢复',
    },
    [HttpStatusCodes.NOT_FOUND]: {
      content: { 'application/json': { schema: errorResponseSchema } },
      description: '不存在',
    },
  },
})

export const emptyTrashRoute = createRoute({
  tags: ['Admin/Notes'],
  summary: '清空回收站',
  method: 'delete',
  path: '/trash/notes',
  responses: {
    [HttpStatusCodes.OK]: {
      content: { 'application/json': { schema: successResponseSchema(z.object({})) } },
      description: '回收站已清空',
    },
  },
})

export const destroyNoteRoute = createRoute({
  tags: ['Admin/Notes'],
  summary: '批量永久删除说说',
  method: 'post',
  path: '/notes/destroy',
  request: {
    body: { content: { 'application/json': { schema: z.object({ ids: z.array(z.number().int().positive()) }) } } },
  },
  responses: {
    [HttpStatusCodes.OK]: {
      content: { 'application/json': { schema: successResponseSchema(z.object({})) } },
      description: '已永久删除',
    },
  },
})
