import { createRoute, z } from "@hono/zod-openapi";
import * as HttpStatusCodes from "~/constants/http-status-codes";
import { successResponseSchema, errorResponseSchema } from "~/utils/response";

// --- Request Schemas ---

export const createTagSchema = z.object({
  name: z.string().min(1, "标签名称不能为空"),
  slug: z.string().min(1, "标签标识不能为空"),
});

export const updateTagSchema = z.object({
  name: z.string().min(1, "标签名称不能为空").optional(),
  slug: z.string().min(1, "标签标识不能为空").optional(),
});

// --- Response Schemas ---

const tagSchema = z.object({
  id: z.number(),
  name: z.string(),
  slug: z.string(),
  createdAt: z.string(),
  updatedAt: z.string(),
});

const tagListItemSchema = tagSchema.extend({
  postCount: z.number(),
  noteCount: z.number(),
  usageCount: z.number(),
});

export const tagListSchema = z.array(tagListItemSchema);
export const tagResponseSchema = tagSchema;

// --- Routes ---

export const listTagsRoute = createRoute({
  tags: ["Admin/Tags"],
  summary: "获取标签列表",
  method: "get",
  path: "/tags",
  responses: {
    [HttpStatusCodes.OK]: {
      content: { "application/json": { schema: successResponseSchema(tagListSchema) } },
      description: "标签列表",
    },
  },
});

export const createTagRoute = createRoute({
  tags: ["Admin/Tags"],
  summary: "创建标签",
  method: "post",
  path: "/tags",
  request: {
    body: { content: { "application/json": { schema: createTagSchema } } },
  },
  responses: {
    [HttpStatusCodes.CREATED]: {
      content: { "application/json": { schema: successResponseSchema(tagResponseSchema) } },
      description: "创建成功",
    },
    [HttpStatusCodes.CONFLICT]: {
      content: { "application/json": { schema: errorResponseSchema } },
      description: "名称或标识已存在",
    },
  },
});

export const updateTagRoute = createRoute({
  tags: ["Admin/Tags"],
  summary: "更新标签",
  method: "patch",
  path: "/tags/{id}",
  request: {
    params: z.object({ id: z.string() }),
    body: { content: { "application/json": { schema: updateTagSchema } } },
  },
  responses: {
    [HttpStatusCodes.OK]: {
      content: { "application/json": { schema: successResponseSchema(tagResponseSchema) } },
      description: "更新成功",
    },
    [HttpStatusCodes.NOT_FOUND]: {
      content: { "application/json": { schema: errorResponseSchema } },
      description: "标签不存在",
    },
    [HttpStatusCodes.CONFLICT]: {
      content: { "application/json": { schema: errorResponseSchema } },
      description: "名称或标识冲突",
    },
  },
});

export const deleteTagRoute = createRoute({
  tags: ["Admin/Tags"],
  summary: "删除标签",
  method: "delete",
  path: "/tags/{id}",
  request: {
    params: z.object({ id: z.string() }),
  },
  responses: {
    [HttpStatusCodes.OK]: {
      content: { "application/json": { schema: successResponseSchema(z.object({})) } },
      description: "删除成功",
    },
    [HttpStatusCodes.NOT_FOUND]: {
      content: { "application/json": { schema: errorResponseSchema } },
      description: "标签不存在",
    },
  },
});
