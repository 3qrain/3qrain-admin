import type { Context } from 'hono'
import { z } from 'zod'
import { eq } from 'drizzle-orm'
import { db, redis } from '~/db'
import { posts } from '~/db/schema'
import { ok, fail } from '~/utils/response'
import { ErrorCode } from '@3qrain/shared'
import * as HttpStatusCodes from '~/constants/http-status-codes'
import { recordViewSchema } from './view.routes'

const querySchema = z.object({
  contentType: z.enum(['post']),
  contentId: z.string(),
})

const VIEW_TTL = 1800

function getPostCount(contentId: number) {
  return db.select({ id: posts.id, viewCount: posts.viewCount })
    .from(posts)
    .where(eq(posts.id, contentId))
    .get()
}

export async function record(c: Context) {
  const parsed = recordViewSchema.safeParse(await c.req.json())
  if (!parsed.success) {
    return c.json(fail(ErrorCode.INVALID_PARAMS, parsed.error.issues[0].message), HttpStatusCodes.BAD_REQUEST)
  }

  const { contentId, contentType, visitorId } = parsed.data

  const post = getPostCount(contentId)
  if (!post) {
    return c.json(fail(ErrorCode.POST_NOT_FOUND, '文章不存在'), HttpStatusCodes.NOT_FOUND)
  }

  const viewKey = `3qrain:view:${contentType}:${contentId}:${visitorId}`
  const exists = await redis.exists(viewKey)
  if (!exists) {
    const newCount = (post.viewCount || 0) + 1
    db.update(posts).set({ viewCount: newCount }).where(eq(posts.id, contentId)).run()
    await redis.setex(viewKey, VIEW_TTL, '1')
    return c.json(ok({ viewCount: newCount }, '已记录浏览会话'), HttpStatusCodes.OK)
  }

  await redis.setex(viewKey, VIEW_TTL, '1')
  return c.json(ok({ viewCount: post.viewCount }, '已刷新浏览会话'), HttpStatusCodes.OK)
}

export async function count(c: Context) {
  const query = querySchema.safeParse(c.req.query())
  if (!query.success) {
    return c.json(fail(ErrorCode.INVALID_PARAMS, query.error.issues[0].message), HttpStatusCodes.BAD_REQUEST)
  }

  const { contentId } = query.data
  const post = getPostCount(Number(contentId))
  if (!post) {
    return c.json(fail(ErrorCode.POST_NOT_FOUND, '文章不存在'), HttpStatusCodes.NOT_FOUND)
  }

  return c.json(ok({ viewCount: post.viewCount || 0 }, '获取成功'), HttpStatusCodes.OK)
}
