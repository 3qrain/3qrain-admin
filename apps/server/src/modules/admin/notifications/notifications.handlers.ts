import type { Context } from 'hono'
import { eq, desc, and, count, inArray, lt } from 'drizzle-orm'
import { db } from '~/db'
import { notifications } from '~/db/schema'
import { ok, fail } from '~/utils/response'
import { ErrorCode } from '@3qrain/shared'
import * as HttpStatusCodes from '~/constants/http-status-codes'

export async function list(c: Context) {
  const query = c.req.query()
  const page = Number(query.page || 1)
  const pageSize = Number(query.pageSize || 20)
  const actualOffset = query.offset !== undefined ? Number(query.offset) : (page - 1) * pageSize

  const conditions = []
  if (query.types) {
    const types = query.types.split(',').filter(Boolean)
    if (types.length > 0) conditions.push(inArray(notifications.type, types))
  }
  if (query.isRead) conditions.push(eq(notifications.isRead, Number(query.isRead)))
  if (query.t) conditions.push(lt(notifications.createdAt, new Date(Number(query.t))))
  const where = conditions.length > 0 ? and(...conditions) : undefined

  const total = db.select({ count: count() }).from(notifications).where(where).get()!.count

  const rows = db
    .select()
    .from(notifications)
    .where(where)
    .orderBy(desc(notifications.createdAt))
    .limit(pageSize)
    .offset(actualOffset)
    .all()

  return c.json(ok({ list: rows, total, page, pageSize }, '获取成功'), HttpStatusCodes.OK)
}

export async function unreadCount(c: Context) {
  const result = db.select({ count: count() }).from(notifications).where(eq(notifications.isRead, 0)).get()!

  return c.json(ok({ count: result.count }, '获取成功'), HttpStatusCodes.OK)
}

export async function markRead(c: Context) {
  const id = Number(c.req.param('id')!)

  const existing = db.select().from(notifications).where(eq(notifications.id, id)).get()
  if (!existing) {
    return c.json(fail(ErrorCode.INVALID_PARAMS, '通知不存在'), HttpStatusCodes.NOT_FOUND)
  }

  db.update(notifications).set({ isRead: 1 }).where(eq(notifications.id, id)).run()
  return c.json(ok({}, '已读'), HttpStatusCodes.OK)
}

export async function markAllRead(c: Context) {
  db.update(notifications).set({ isRead: 1 }).run()
  return c.json(ok({}, '全部已读'), HttpStatusCodes.OK)
}

export async function destroy(c: Context) {
  const { ids } = await c.req.json<{ ids: number[] }>()
  for (const id of ids) {
    db.delete(notifications).where(eq(notifications.id, id)).run()
  }
  return c.json(ok({}, '已删除'), HttpStatusCodes.OK)
}

export async function clearRead(c: Context) {
  db.delete(notifications).where(eq(notifications.isRead, 1)).run()
  return c.json(ok({}, '已清空已读通知'), HttpStatusCodes.OK)
}
