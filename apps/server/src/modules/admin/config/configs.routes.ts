import { createRoute, z } from "@hono/zod-openapi";
import * as HttpStatusCodes from "~/constants/http-status-codes";
import { successResponseSchema, errorResponseSchema } from "~/utils/response";
import { FullConfigSchema } from "./configs.schema";

// --- Routes ---

export const getConfigRoute = createRoute({
  tags: ['Admin/Config'],
  summary: '获取配置（可按 keys 筛选）',
  method: 'get',
  path: '/config',
  request: {
    query: z.object({ keys: z.string().optional() }),
  },
  responses: {
    [HttpStatusCodes.OK]: {
      content: { "application/json": { schema: successResponseSchema(FullConfigSchema) } },
      description: "所有配置",
    },
  },
});

export const getConfigByKeyRoute = createRoute({
  tags: ["Admin/Config"],
  summary: "获取指定配置",
  method: "get",
  path: "/config/{key}",
  request: { params: z.object({ key: z.string() }) },
  responses: {
    [HttpStatusCodes.OK]: {
      content: { "application/json": { schema: successResponseSchema(z.record(z.string(), z.unknown())) } },
      description: "配置值",
    },
    [HttpStatusCodes.NOT_FOUND]: {
      content: { "application/json": { schema: errorResponseSchema } },
      description: "配置不存在",
    },
  },
});

export const updateConfigRoute = createRoute({
  tags: ["Admin/Config"],
  summary: "更新配置",
  method: "patch",
  path: "/config/{key}",
  request: {
    params: z.object({ key: z.string() }),
  },
  responses: {
    [HttpStatusCodes.OK]: {
      content: { "application/json": { schema: successResponseSchema(z.record(z.string(), z.unknown())) } },
      description: "更新成功",
    },
    [HttpStatusCodes.BAD_REQUEST]: {
      content: { "application/json": { schema: errorResponseSchema } },
      description: "参数校验失败",
    },
    [HttpStatusCodes.NOT_FOUND]: {
      content: { "application/json": { schema: errorResponseSchema } },
      description: "配置键不存在",
    },
  },
});

// ---- Email Config ----

export const getEmailConfigRoute = createRoute({
  tags: ['Admin/Config'],
  summary: '获取邮件配置',
  method: 'get',
  path: '/email-config',
  responses: {
    [HttpStatusCodes.OK]: {
      content: { 'application/json': { schema: successResponseSchema(z.object({
        enabled: z.boolean(),
        host: z.string(),
        port: z.number(),
        user: z.string(),
        pass: z.string(),
      })) } },
      description: '邮件配置',
    },
  },
})

export const saveEmailConfigRoute = createRoute({
  tags: ['Admin/Config'],
  summary: '保存邮件配置',
  method: 'put',
  path: '/email-config',
  request: {
    body: { content: { 'application/json': { schema: z.object({
      enabled: z.boolean(),
      host: z.string(),
      port: z.number().int(),
      user: z.string(),
      pass: z.string(),
    }) } } },
  },
  responses: {
    [HttpStatusCodes.OK]: {
      content: { 'application/json': { schema: successResponseSchema(z.object({})) } },
      description: '保存成功',
    },
  },
})

export const testEmailRoute = createRoute({
  tags: ['Admin/Config'],
  summary: '测试邮件连通性',
  method: 'post',
  path: '/email-config/test',
  responses: {
    [HttpStatusCodes.OK]: {
      content: { 'application/json': { schema: successResponseSchema(z.object({})) } },
      description: '连接成功',
    },
    [HttpStatusCodes.BAD_REQUEST]: {
      content: { 'application/json': { schema: errorResponseSchema } },
      description: '配置缺失或连接失败',
    },
  },
})

export const sendTestEmailRoute = createRoute({
  tags: ['Admin/Config'],
  summary: '发送测试邮件',
  method: 'post',
  path: '/email-config/test-send',
  responses: {
    [HttpStatusCodes.OK]: {
      content: { 'application/json': { schema: successResponseSchema(z.object({})) } },
      description: '发送成功',
    },
    [HttpStatusCodes.BAD_REQUEST]: {
      content: { 'application/json': { schema: errorResponseSchema } },
      description: '配置缺失、邮箱格式错误或发送失败',
    },
  },
})
