import type { Context } from 'hono'
import { eq, like, and, desc, count as drizzleCount, lt } from 'drizzle-orm'
import { readdir, unlink, stat } from 'node:fs/promises'
import { db } from '~/db'
import { media } from '~/db/schema'
import { ok, fail } from '~/utils/response'
import { ErrorCode } from '@3qrain/shared'
import * as HttpStatusCodes from '~/constants/http-status-codes'

const UPLOADS_DIR = './data/uploads'
const STORAGE_PREFIX = '/storage'

function toUrl(rawPath: string | null) {
  if (!rawPath) return null
  return `${STORAGE_PREFIX}${rawPath}`
}

export async function list(c: Context) {
  const query = c.req.query()
  const page = Number.parseInt(query.page || '1')
  const pageSize = Number.parseInt(query.pageSize || '24')
  const actualOffset = query.offset !== undefined ? Number(query.offset) : (page - 1) * pageSize

  const conditions = []
  if (query.keyword) conditions.push(like(media.filename, `%${query.keyword}%`))
  if (query.type) conditions.push(eq(media.type, query.type))
  if (query.t) conditions.push(lt(media.createdAt, new Date(Number(query.t))))
  const where = conditions.length > 0 ? and(...conditions) : undefined

  const total = db.select({ count: drizzleCount() }).from(media).where(where).get()!.count

  const rows = db
    .select()
    .from(media)
    .where(where)
    .orderBy(desc(media.createdAt))
    .limit(pageSize)
    .offset(actualOffset)
    .all()

  const list = rows.map(r => ({
    ...r,
    url: toUrl(r.originalPath) as string,
    thumbnailUrl: toUrl(r.thumbnailPath),
    previewUrl: toUrl(r.previewPath)
  }))

  return c.json(ok({ list, total, page, pageSize }, '获取成功'), HttpStatusCodes.OK)
}

export async function remove(c: Context) {
  const { ids } = await c.req.json<{ ids: number[] }>()
  for (const id of ids) {
    const record = db.select().from(media).where(eq(media.id, id)).get()
    if (!record) continue
    for (const p of [record.originalPath, record.thumbnailPath, record.previewPath].filter(Boolean)) {
      try {
        await unlink(`${UPLOADS_DIR}${p}`)
      } catch {
        /* gone */
      }
    }
    db.delete(media).where(eq(media.id, id)).run()
  }
  return c.json(ok({}, '已删除'), HttpStatusCodes.OK)
}

export async function health(c: Context) {
  const records = db.select().from(media).all()
  const dbSet = new Set(records.map(r => `${UPLOADS_DIR}${r.originalPath}`))
  for (const r of records) {
    if (r.thumbnailPath) dbSet.add(`${UPLOADS_DIR}${r.thumbnailPath}`)
  }

  let unregistered = 0
  let missing = 0

  // 扫描文件系统中未登记的文件
  try {
    for (const y of await readdir(UPLOADS_DIR)) {
      const ymDir = `${UPLOADS_DIR}/${y}`
      if (!(await stat(ymDir)).isDirectory()) continue
      for (const m of await readdir(ymDir)) {
        const mmDir = `${ymDir}/${m}`
        if (!(await stat(mmDir)).isDirectory()) continue
        for (const f of await readdir(mmDir)) {
          const fp = `${mmDir}/${f}`
          if (!f.includes('-original') && !f.includes('-thumbnail')) continue
          if (!dbSet.has(fp)) unregistered++
        }
      }
    }
  } catch {
    /* dir may not exist yet */
  }

  // 数据库记录对应文件是否缺失
  for (const r of records) {
    try {
      await stat(`${UPLOADS_DIR}${r.originalPath}`)
    } catch {
      missing++
    }
  }

  return c.json(ok({ unregistered, missing }, '检查完成'), HttpStatusCodes.OK)
}
