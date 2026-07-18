import type { Context } from 'hono'
import { eq, and, desc, count, inArray, isNull, isNotNull, like, lt } from 'drizzle-orm'
import { db } from '~/db'
import { comments, users } from '~/db/schema'
import { ok, fail } from '~/utils/response'
import { ErrorCode } from '@3qrain/shared'
import * as HttpStatusCodes from '~/constants/http-status-codes'

function buildFilters(query: Record<string, string | undefined>) {
  const conditions = []

  if (query.id) {
    conditions.push(eq(comments.id, Number(query.id)))
  } else if (query.deleted) {
    conditions.push(isNotNull(comments.deletedAt))
  } else {
    conditions.push(isNull(comments.deletedAt))
  }

  if (query.status) conditions.push(eq(comments.status, query.status))
  if (query.parentOnly === 'true') conditions.push(isNull(comments.parentId))
  if (query.targetType) conditions.push(eq(comments.targetType, query.targetType))
  if (query.targetId) conditions.push(eq(comments.targetId, Number(query.targetId)))
  if (query.keyword) conditions.push(like(comments.content, `%${query.keyword}%`))
  if (query.t) conditions.push(lt(comments.createdAt, new Date(Number(query.t))))

  return conditions
}

function enrichComments(rows: any[]) {
  if (rows.length === 0) return []

  const userIds = [...new Set(rows.flatMap(r => [r.userId, r.replyToUserId].filter(Boolean)))] as number[]

  const userMap = new Map(
    userIds.length > 0
      ? db
          .select({ id: users.id, username: users.username, avatarUrl: users.avatarUrl })
          .from(users)
          .where(inArray(users.id, userIds))
          .all()
          .map(u => [u.id, u])
      : []
  )

  return rows.map(c => ({
    ...c,
    user: userMap.get(c.userId) || { id: c.userId, username: '', avatarUrl: '' },
    replyToUser: c.replyToUserId ? userMap.get(c.replyToUserId) || null : null
  }))
}

export async function list(c: Context) {
  const query = c.req.query()
  const page = Number(query.page || 1)
  const pageSize = Number(query.pageSize || 20)
  const actualOffset = query.offset !== undefined ? Number(query.offset) : (page - 1) * pageSize

  const conditions = buildFilters(query)
  const where = conditions.length > 0 ? and(...conditions) : undefined

  const total = db.select({ count: count() }).from(comments).where(where).get()!.count

  const rows = db
    .select()
    .from(comments)
    .where(where)
    .orderBy(desc(comments.createdAt))
    .limit(pageSize)
    .offset(actualOffset)
    .all()

  const list = enrichComments(rows)

  // 补充一级评论的回复数
  const parentIds = list.filter((c: any) => !c.parentId).map((c: any) => c.id)
  const replyCounts = new Map<number, number>()
  if (parentIds.length > 0) {
    const counts = db
      .select({ parentId: comments.parentId, count: count() })
      .from(comments)
      .where(inArray(comments.parentId, parentIds))
      .groupBy(comments.parentId)
      .all()

    for (const row of counts) {
      if (row.parentId !== null) replyCounts.set(row.parentId, row.count)
    }
  }
  const listWithCounts = list.map((c: any) => ({
    ...c,
    replyCount: c.parentId ? 0 : replyCounts.get(c.id) || 0
  }))

  return c.json(ok({ list: listWithCounts, total, page, pageSize }, '获取成功'), HttpStatusCodes.OK)
}

export async function create(c: Context) {
  const body = (await c.req.json()) as {
    targetType: string
    targetId: number
    content: string
    parentId?: number
    replyToUserId?: number
    replyToId?: number
  }

  const systemUser = db.select({ id: users.id }).from(users).where(eq(users.role, 'system')).get()!

  const result = db
    .insert(comments)
    .values({
      targetType: body.targetType,
      targetId: body.targetId,
      userId: systemUser.id,
      parentId: body.parentId || null,
      replyToId: body.replyToId || null,
      replyToUserId: body.replyToUserId || null,
      content: body.content,
      status: 'published'
    })
    .returning()
    .get()

  const [enriched] = enrichComments([result])
  return c.json(ok(enriched as any, '评论成功'), HttpStatusCodes.CREATED)
}

export async function update(c: Context) {
  const id = Number(c.req.param('id')!)
  const body = await c.req.json<{ content: string }>()

  const existing = db.select().from(comments).where(eq(comments.id, id)).get()
  if (!existing) {
    return c.json(fail(ErrorCode.INVALID_PARAMS, '评论不存在'), HttpStatusCodes.NOT_FOUND)
  }

  db.update(comments).set({ content: body.content }).where(eq(comments.id, id)).run()

  const updated = db.select().from(comments).where(eq(comments.id, id)).get()!
  const [enriched] = enrichComments([updated])
  return c.json(ok(enriched as any, '更新成功'), HttpStatusCodes.OK)
}

export async function review(c: Context) {
  const id = Number(c.req.param('id')!)
  const body = await c.req.json<{ action: string }>()

  const existing = db.select().from(comments).where(eq(comments.id, id)).get()
  if (!existing) {
    return c.json(fail(ErrorCode.INVALID_PARAMS, '评论不存在'), HttpStatusCodes.NOT_FOUND)
  }

  db.update(comments).set({ status: 'published' }).where(eq(comments.id, id)).run()

  const updated = db.select().from(comments).where(eq(comments.id, id)).get()!
  const [enriched] = enrichComments([updated])
  return c.json(ok(enriched as any, '审核成功'), HttpStatusCodes.OK)
}

export async function pin(c: Context) {
  const id = Number(c.req.param('id')!)
  const body = await c.req.json<{ pinned: boolean }>()

  const existing = db.select().from(comments).where(eq(comments.id, id)).get()
  if (!existing) {
    return c.json(fail(ErrorCode.INVALID_PARAMS, '评论不存在'), HttpStatusCodes.NOT_FOUND)
  }

  db.update(comments).set({ isPinned: body.pinned }).where(eq(comments.id, id)).run()
  return c.json(ok({}, '操作成功'), HttpStatusCodes.OK)
}

export async function remove(c: Context) {
  const { ids } = await c.req.json<{ ids: number[] }>()
  for (const id of ids) {
    db.update(comments).set({ deletedAt: new Date() }).where(eq(comments.id, id)).run()
  }
  return c.json(ok({}, '已移入回收站'), HttpStatusCodes.OK)
}

export async function restore(c: Context) {
  const id = Number(c.req.param('id')!)

  const existing = db
    .select()
    .from(comments)
    .where(and(eq(comments.id, id), isNotNull(comments.deletedAt)))
    .get()
  if (!existing) {
    return c.json(fail(ErrorCode.INVALID_PARAMS, '评论不存在'), HttpStatusCodes.NOT_FOUND)
  }

  db.update(comments).set({ deletedAt: null }).where(eq(comments.id, id)).run()

  const updated = db.select().from(comments).where(eq(comments.id, id)).get()!
  const [enriched] = enrichComments([updated])
  return c.json(ok(enriched as any, '已恢复'), HttpStatusCodes.OK)
}

export async function replies(c: Context) {
  const id = Number(c.req.param('id')!)

  const rows = db.select().from(comments).where(eq(comments.parentId, id)).orderBy(desc(comments.createdAt)).all()

  const list = enrichComments(rows)
  return c.json(ok({ list, total: rows.length }, '获取成功'), HttpStatusCodes.OK)
}

export async function emptyTrash(c: Context) {
  db.delete(comments).where(isNotNull(comments.deletedAt)).run()
  return c.json(ok({}, '回收站已清空'), HttpStatusCodes.OK)
}

export async function destroy(c: Context) {
  const { ids } = await c.req.json<{ ids: number[] }>()
  for (const id of ids) {
    db.delete(comments).where(eq(comments.parentId, id)).run()
    db.delete(comments).where(eq(comments.id, id)).run()
  }
  return c.json(ok({}, '已永久删除'), HttpStatusCodes.OK)
}
