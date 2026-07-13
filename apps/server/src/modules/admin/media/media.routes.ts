import { createRoute, z } from "@hono/zod-openapi";
import * as HttpStatusCodes from "~/constants/http-status-codes";
import { successResponseSchema, errorResponseSchema } from "~/utils/response";

const mediaSchema = z.object({
  id: z.number(),
  mimeType: z.string(),
  size: z.number(),
  type: z.string(),
  ext: z.string().nullable(),
  width: z.number().nullable(),
  height: z.number().nullable(),
  filename: z.string(),
  url: z.string(),
  thumbnailUrl: z.string().nullable(),
  previewUrl: z.string().nullable(),
  placeholder: z.string().nullable(),
  createdAt: z.string(),
  updatedAt: z.string().nullable(),
});

// --- Routes ---

export const listMediaRoute = createRoute({
  tags: ["Admin/Media"],
  summary: "媒体文件列表",
  method: "get",
  path: "/media",
  request: {
    query: z.object({
      keyword: z.string().optional(),
      type: z.enum(['image', 'video', 'audio', 'file']).optional(),
      page: z.string().optional().default("1"),
      pageSize: z.string().optional().default("24"),
      offset: z.string().optional(),
      t: z.string().optional(),
    }),
  },
  responses: {
    [HttpStatusCodes.OK]: {
      content: {
        "application/json": {
          schema: successResponseSchema(
            z.object({ list: z.array(mediaSchema), total: z.number(), page: z.number(), pageSize: z.number() })
          ),
        },
      },
      description: "媒体列表",
    },
  },
});

export const deleteMediaRoute = createRoute({
  tags: ['Admin/Media'],
  summary: '批量删除媒体文件',
  method: 'post',
  path: '/media/destroy',
  request: {
    body: { content: { 'application/json': { schema: z.object({ ids: z.array(z.number().int().positive()) }) } } },
  },
  responses: {
    [HttpStatusCodes.OK]: { content: { 'application/json': { schema: successResponseSchema(z.object({})) } }, description: '已删除' },
  },
});

export const healthRoute = createRoute({
  tags: ["Admin/Media"],
  summary: "媒体库健康检查",
  method: "get",
  path: "/media/health",
  responses: {
    [HttpStatusCodes.OK]: {
      content: {
        "application/json": {
          schema: successResponseSchema(z.object({ unregistered: z.number(), missing: z.number() })),
        },
      },
      description: "健康状态",
    },
  },
});
