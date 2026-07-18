import { createRoute, z } from "@hono/zod-openapi";
import * as HttpStatusCodes from "~/constants/http-status-codes";
import { successResponseSchema, errorResponseSchema } from "~/utils/response";

// --- Request Schemas ---

const POST_STATUS = ["draft", "published", "archived"] as const;
const tagIdsSchema = z.array(z.number().int().positive()).transform(ids => Array.from(new Set(ids)));

export const createPostSchema = z.object({
  title: z.string().optional(),
  slug: z.string().optional(),
  summary: z.string().optional(),
  cover: z.string().optional(),
  content: z.any().optional(),
  contentHtml: z.string().optional().default(""),
  contentText: z.string().optional().default(""),
  status: z.enum(POST_STATUS).optional().default("draft"),
  isPinned: z.boolean().optional().default(false),
  categoryId: z.number().int().optional().nullable(),
  tagIds: tagIdsSchema.optional().default([]),
});

export const updatePostSchema = z.object({
  title: z.string().optional(),
  slug: z.string().optional(),
  summary: z.string().optional(),
  cover: z.string().optional(),
  content: z.any().optional(),
  contentHtml: z.string().optional(),
  contentText: z.string().optional(),
  status: z.enum(POST_STATUS).optional(),
  isPinned: z.boolean().optional(),
  categoryId: z.number().int().optional().nullable(),
  tagIds: tagIdsSchema.optional(),
});

// --- Response Schemas ---

const tagSchema = z.object({
  id: z.number(),
  name: z.string(),
  slug: z.string(),
});

const categorySchema = z.object({
  id: z.number(),
  name: z.string(),
  slug: z.string(),
});

const postSchema = z.object({
  id: z.number(),
  title: z.string(),
  slug: z.string(),
  summary: z.string(),
  cover: z.string(),
  content: z.object(),
  status: z.string(),
  isPinned: z.union([z.boolean(), z.number()]),
  viewCount: z.number(),
  categoryId: z.number(),
  category: categorySchema.optional(),
  tags: z.array(tagSchema).optional(),
});

const postListSchema = z.object({
  list: z.array(postSchema),
  total: z.number(),
  page: z.number(),
  pageSize: z.number(),
});

// --- Routes ---

export const listPostsRoute = createRoute({
  tags: ["Admin/Posts"],
  summary: "获取文章分页列表",
  method: "get",
  path: "/posts",
  request: {
    query: z.object({
      keyword: z.string().optional(),
      status: z.enum(POST_STATUS).or(z.literal("")).optional(),
      categoryId: z.string().optional(),
      deleted: z.string().optional(),
      page: z.string().optional().default("1"),
      pageSize: z.string().optional().default("10"),
    }),
  },
  responses: {
    [HttpStatusCodes.OK]: {
      content: { "application/json": { schema: successResponseSchema(postListSchema) } },
      description: "文章列表",
    },
  },
});

export const getPostRoute = createRoute({
  tags: ["Admin/Posts"],
  summary: "获取文章详情",
  method: "get",
  path: "/posts/{id}",
  request: {
    params: z.object({ id: z.string() }),
  },
  responses: {
    [HttpStatusCodes.OK]: {
      content: { "application/json": { schema: successResponseSchema(postSchema) } },
      description: "文章详情",
    },
    [HttpStatusCodes.NOT_FOUND]: {
      content: { "application/json": { schema: errorResponseSchema } },
      description: "文章不存在",
    },
  },
});

export const createPostRoute = createRoute({
  tags: ["Admin/Posts"],
  summary: "创建文章",
  method: "post",
  path: "/posts",
  request: {
    body: { content: { "application/json": { schema: createPostSchema } } },
  },
  responses: {
    [HttpStatusCodes.CREATED]: {
      content: { "application/json": { schema: successResponseSchema(postSchema) } },
      description: "创建成功",
    },
    [HttpStatusCodes.BAD_REQUEST]: {
      content: { "application/json": { schema: errorResponseSchema } },
      description: "请求参数zod校验失败||发布/归档时标题、标识和分类为必填",
    },
    [HttpStatusCodes.CONFLICT]: {
      content: { "application/json": { schema: errorResponseSchema } },
      description: "slug 已存在",
    },
    [HttpStatusCodes.NOT_FOUND]: {
      content: { "application/json": { schema: errorResponseSchema } },
      description: "分类不存在",
    },
  },
});

export const updatePostRoute = createRoute({
  tags: ["Admin/Posts"],
  summary: "更新文章",
  method: "patch",
  path: "/posts/{id}",
  request: {
    params: z.object({ id: z.string() }),
    body: { content: { "application/json": { schema: updatePostSchema } } },
  },
  responses: {
    [HttpStatusCodes.OK]: {
      content: { "application/json": { schema: successResponseSchema(postSchema) } },
      description: "更新成功",
    },
    [HttpStatusCodes.BAD_REQUEST]: {
      content: { "application/json": { schema: errorResponseSchema } },
      description: "请求参数zod校验失败||发布/归档时标题、标识和分类为必填",
    },
    [HttpStatusCodes.NOT_FOUND]: {
      content: { "application/json": { schema: errorResponseSchema } },
      description: "文章或分类不存在",
    },
    [HttpStatusCodes.CONFLICT]: {
      content: { "application/json": { schema: errorResponseSchema } },
      description: "slug 冲突",
    },
  },
});

export const trashPostRoute = createRoute({
  tags: ['Admin/Posts'],
  summary: '移入回收站（软删除）',
  method: 'post',
  path: '/posts/trash',
  request: {
    body: { content: { 'application/json': { schema: z.object({ ids: z.array(z.number().int().positive()) }) } } },
  },
  responses: {
    [HttpStatusCodes.OK]: {
      content: { "application/json": { schema: successResponseSchema(z.object({})) } },
      description: "已移入回收站",
    },
    [HttpStatusCodes.NOT_FOUND]: {
      content: { "application/json": { schema: errorResponseSchema } },
      description: "文章不存在",
    },
  },
});

export const destroyPostRoute = createRoute({
  tags: ['Admin/Posts'],
  summary: '物理删除文章',
  method: 'post',
  path: '/posts/destroy',
  request: {
    body: { content: { 'application/json': { schema: z.object({ ids: z.array(z.number().int().positive()) }) } } },
  },
  responses: {
    [HttpStatusCodes.OK]: {
      content: { "application/json": { schema: successResponseSchema(z.object({})) } },
      description: "已永久删除",
    },
    [HttpStatusCodes.NOT_FOUND]: {
      content: { "application/json": { schema: errorResponseSchema } },
      description: "文章不存在",
    },
  },
});

export const emptyTrashRoute = createRoute({
  tags: ['Admin/Posts'],
  summary: '清空回收站',
  method: 'delete',
  path: '/trash/posts',
  responses: {
    [HttpStatusCodes.OK]: {
      content: { 'application/json': { schema: successResponseSchema(z.object({})) } },
      description: '回收站已清空',
    },
  },
})

export const restorePostRoute = createRoute({
  tags: ["Admin/Posts"],
  summary: "恢复文章",
  method: "patch",
  path: "/posts/{id}/restore",
  request: {
    params: z.object({ id: z.string() }),
  },
  responses: {
    [HttpStatusCodes.OK]: {
      content: { "application/json": { schema: successResponseSchema(postSchema) } },
      description: "恢复成功",
    },
    [HttpStatusCodes.NOT_FOUND]: {
      content: { "application/json": { schema: errorResponseSchema } },
      description: "文章不存在",
    },
  },
});
