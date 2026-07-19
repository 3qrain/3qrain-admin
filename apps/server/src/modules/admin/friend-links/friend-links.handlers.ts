import type { Context } from 'hono'
import { eq, desc, and, count, lt } from 'drizzle-orm'
import { db } from '~/db'
import { friendLinks } from '~/db/schema'
import { ok, fail } from '~/utils/response'
import { ErrorCode } from '@3qrain/shared'
import * as HttpStatusCodes from '~/constants/http-status-codes'
import { notify } from '~/services/notify'

export async function create(c: Context) {
  const body = await c.req.json<{ siteName: string; siteUrl: string; description?: string; applicantEmail: string }>()
  db.insert(friendLinks)
    .values({ ...body, status: 'approved', approvedAt: new Date() })
    .run()
  return c.json(ok({}, '添加成功'), HttpStatusCodes.CREATED)
}

export async function list(c: Context) {
  const query = c.req.query()
  const page = Number(query.page || 1)
  const pageSize = Number(query.pageSize || 20)
  const actualOffset = query.offset !== undefined ? Number(query.offset) : (page - 1) * pageSize

  const conditions = []
  if (query.status) conditions.push(eq(friendLinks.status, query.status))
  if (query.t) conditions.push(lt(friendLinks.createdAt, new Date(Number(query.t))))
  const where = conditions.length > 0 ? and(...conditions) : undefined

  const total = db.select({ count: count() }).from(friendLinks).where(where).get()!.count

  const rows = db
    .select()
    .from(friendLinks)
    .where(where)
    .orderBy(desc(friendLinks.createdAt))
    .limit(pageSize)
    .offset(actualOffset)
    .all()

  return c.json(ok({ list: rows, total, page, pageSize }, '获取成功'), HttpStatusCodes.OK)
}

export async function update(c: Context) {
  const id = Number(c.req.param('id')!)
  const body = await c.req.json<{ siteName?: string; siteUrl?: string; avatarUrl?: string; description?: string }>()
  db.update(friendLinks).set(body).where(eq(friendLinks.id, id)).run()
  return c.json(ok({}, '更新成功'), HttpStatusCodes.OK)
}

export async function approve(c: Context) {
  const id = Number(c.req.param('id')!)
  const existing = db.select().from(friendLinks).where(eq(friendLinks.id, id)).get()
  if (!existing) {
    return c.json(fail(ErrorCode.INVALID_PARAMS, '友链不存在'), HttpStatusCodes.NOT_FOUND)
  }

  db.update(friendLinks).set({ status: 'approved', approvedAt: new Date() }).where(eq(friendLinks.id, id)).run()

  notify({
    scope: 'admin',
    type: 'friend_approve',
    title: `${existing.siteName} 友链已通过`,
    // 友链有申请邮箱就发邮件
    emailStatus: existing.applicantEmail ? undefined : 'not_required',
    meta: {
      id,
      siteName: existing.siteName,
      siteUrl: existing.siteUrl,
      applicantEmail: existing.applicantEmail,
      approved: true
    }
  }).catch(() => {})

  return c.json(ok({}, '已通过'), HttpStatusCodes.OK)
}

export async function reject(c: Context) {
  const id = Number(c.req.param('id')!)
  const { reason } = await c.req.json<{ reason: string }>()

  const existing = db.select().from(friendLinks).where(eq(friendLinks.id, id)).get()
  if (!existing) {
    return c.json(fail(ErrorCode.INVALID_PARAMS, '友链不存在'), HttpStatusCodes.NOT_FOUND)
  }

  db.update(friendLinks)
    .set({ status: 'rejected', rejectReason: reason, rejectedAt: new Date() })
    .where(eq(friendLinks.id, id))
    .run()

  notify({
    scope: 'admin',
    type: 'friend_reject',
    title: `${existing.siteName} 友链已拒绝`,
    emailStatus: existing.applicantEmail ? undefined : 'not_required',
    // content: reason,
    meta: {
      id,
      siteName: existing.siteName,
      siteUrl: existing.siteUrl,
      applicantEmail: existing.applicantEmail,
      approved: false,
      reason
    }
  }).catch(() => {})

  return c.json(ok({}, '已拒绝'), HttpStatusCodes.OK)
}

export async function pendingCount(c: Context) {
  const result = db.select({ count: count() }).from(friendLinks).where(eq(friendLinks.status, 'pending')).get()!
  return c.json(ok({ count: result.count }, '获取成功'), HttpStatusCodes.OK)
}

export async function counts(c: Context) {
  const rows = db
    .select({ status: friendLinks.status, count: count() })
    .from(friendLinks)
    .groupBy(friendLinks.status)
    .all()
  const map: Record<string, number> = { pending: 0, approved: 0, rejected: 0 }
  for (const r of rows) map[r.status] = r.count
  return c.json(ok(map as { pending: number; approved: number; rejected: number }, '获取成功'), HttpStatusCodes.OK)
}

export async function destroy(c: Context) {
  const { ids } = await c.req.json<{ ids: number[] }>()
  for (const id of ids) {
    db.delete(friendLinks).where(eq(friendLinks.id, id)).run()
  }
  return c.json(ok({}, '已删除'), HttpStatusCodes.OK)
}
