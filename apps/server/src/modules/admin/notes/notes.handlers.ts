import type { Context } from 'hono'
import { eq, desc, count, inArray, isNull, isNotNull, and } from 'drizzle-orm'
import { db } from '~/db'
import { notes, noteTags, noteMedia, tags, media } from '~/db/schema'
import { ok, fail } from '~/utils/response'
import { ErrorCode } from '@3qrain/shared'
import * as HttpStatusCodes from '~/constants/http-status-codes'
import { broadcast } from '~/services/notify'

function toUrl(p: string | null) {
  return p ? `/storage${p}` : null
}

export async function list(c: Context) {
  const page = Number(c.req.query('page') || 1)
  const pageSize = Number(c.req.query('pageSize') || 20)
  const actualOffset = c.req.query('offset') !== undefined ? Number(c.req.query('offset')) : (page - 1) * pageSize
  const deleted = c.req.query('deleted') === 'true'

  const filter = deleted ? isNotNull(notes.deletedAt) : isNull(notes.deletedAt)

  const total = db.select({ count: count() }).from(notes).where(filter).get()!.count
  const rows = db.select().from(notes)
    .where(filter)
    .orderBy(desc(notes.createdAt))
    .limit(pageSize)
    .offset(actualOffset)
    .all()

  if (rows.length === 0) {
    return c.json(ok({ list: [], total, page, pageSize }, '获取成功'), HttpStatusCodes.OK)
  }

  const noteIds = rows.map(r => r.id)

  const tagRows = db.select({
    noteId: noteTags.noteId,
    id: tags.id,
    name: tags.name,
    slug: tags.slug,
  }).from(noteTags)
    .innerJoin(tags, eq(noteTags.tagId, tags.id))
    .where(inArray(noteTags.noteId, noteIds))
    .all()

  const mediaRows = db.select({
    noteId: noteMedia.noteId,
    sort: noteMedia.sort,
    id: media.id,
    originalPath: media.originalPath,
    thumbnailPath: media.thumbnailPath,
    previewPath: media.previewPath,
    placeholder: media.placeholder,
    mimeType: media.mimeType,
    type: media.type,
    filename: media.filename,
    ext: media.ext,
    width: media.width,
    height: media.height,
  }).from(noteMedia)
    .innerJoin(media, eq(noteMedia.mediaId, media.id))
    .where(inArray(noteMedia.noteId, noteIds))
    .orderBy(noteMedia.sort)
    .all()

  const result = rows.map(note => ({
    ...note,
    tags: tagRows.filter(t => t.noteId === note.id).map(({ noteId, ...tag }) => tag),
    media: mediaRows.filter(m => m.noteId === note.id).map(({ noteId, ...m }) => ({
      id: m.id,
      url: toUrl(m.originalPath),
      thumbnailUrl: toUrl(m.thumbnailPath),
      previewUrl: toUrl(m.previewPath),
      placeholder: m.placeholder,
      type: m.type,
      mimeType: m.mimeType,
      filename: m.filename,
      ext: m.ext,
      width: m.width,
      height: m.height,
      sort: m.sort,
    })),
  }))

  return c.json(ok({ list: result, total, page, pageSize }, '获取成功'), HttpStatusCodes.OK)
}

export async function create(c: Context) {
  const body = await c.req.json<{ content: string; isPublished?: boolean; tagIds?: number[]; mediaIds?: number[] }>()

  const note = db.insert(notes).values({
    content: body.content,
    ...(body.isPublished !== undefined && { isPublished: body.isPublished }),
  }).returning().get()

  if (body.tagIds?.length) {
    const validTagIds = db.select({ id: tags.id }).from(tags)
      .where(inArray(tags.id, body.tagIds)).all().map(t => t.id)
    for (const tagId of validTagIds) {
      db.insert(noteTags).values({ noteId: note.id, tagId }).run()
    }
  }

  if (body.mediaIds?.length) {
    const validMediaIds = new Set(
      db.select({ id: media.id }).from(media)
        .where(inArray(media.id, body.mediaIds)).all().map(m => m.id),
    )
    const ordered = body.mediaIds.filter(id => validMediaIds.has(id))
    for (let i = 0; i < ordered.length; i++) {
      db.insert(noteMedia).values({ noteId: note.id, mediaId: ordered[i], sort: i }).run()
    }
  }

  if (body.isPublished) {
    broadcast({
      type: 'new_note',
      title: '一条说说到来~',
      content: body.content.slice(0, 50),
      meta: JSON.stringify({ noteId: note.id }),
    }).catch(() => {})
  }

  return c.json(ok(note, '发布成功'), HttpStatusCodes.CREATED)
}

export async function update(c: Context) {
  const id = Number.parseInt(c.req.param('id')!)
  const existing = db.select().from(notes).where(eq(notes.id, id)).get()
  if (!existing) {
    return c.json(fail(ErrorCode.INVALID_PARAMS, '说说不存在'), HttpStatusCodes.NOT_FOUND)
  }

  const body = await c.req.json<{ content?: string; isPublished?: boolean; tagIds?: number[]; mediaIds?: number[] }>()

  const updates: Record<string, any> = {}
  if (body.content !== undefined) updates.content = body.content
  if (body.isPublished !== undefined) updates.isPublished = body.isPublished
  if (Object.keys(updates).length > 0) {
    db.update(notes).set(updates).where(eq(notes.id, id)).run()
  }

  if (body.tagIds !== undefined) {
    db.delete(noteTags).where(eq(noteTags.noteId, id)).run()
    if (body.tagIds.length) {
      const validTagIds = db.select({ id: tags.id }).from(tags)
        .where(inArray(tags.id, body.tagIds)).all().map(t => t.id)
      for (const tagId of validTagIds) {
        db.insert(noteTags).values({ noteId: id, tagId }).run()
      }
    }
  }

  if (body.mediaIds !== undefined) {
    db.delete(noteMedia).where(eq(noteMedia.noteId, id)).run()
    if (body.mediaIds.length) {
      const validMediaIds = new Set(
        db.select({ id: media.id }).from(media)
          .where(inArray(media.id, body.mediaIds)).all().map(m => m.id),
      )
      const ordered = body.mediaIds.filter(id => validMediaIds.has(id))
      for (let i = 0; i < ordered.length; i++) {
        db.insert(noteMedia).values({ noteId: id, mediaId: ordered[i], sort: i }).run()
      }
    }
  }

  const updated = db.select().from(notes).where(eq(notes.id, id)).get()!
  return c.json(ok(updated, '更新成功'), HttpStatusCodes.OK)
}

export async function remove(c: Context) {
  const { ids } = await c.req.json<{ ids: number[] }>()
  for (const id of ids) {
    db.update(notes).set({ deletedAt: new Date() }).where(eq(notes.id, id)).run()
  }
  return c.json(ok({}, '已移至回收站'), HttpStatusCodes.OK)
}

export async function restore(c: Context) {
  const id = Number.parseInt(c.req.param('id')!)
  const existing = db.select().from(notes).where(and(eq(notes.id, id), isNotNull(notes.deletedAt))).get()
  if (!existing) {
    return c.json(fail(ErrorCode.INVALID_PARAMS, '说说不存在'), HttpStatusCodes.NOT_FOUND)
  }

  db.update(notes).set({ deletedAt: null }).where(eq(notes.id, id)).run()
  return c.json(ok({}, '已恢复'), HttpStatusCodes.OK)
}

export async function emptyTrash(c: Context) {
  const trashed = db.select({ id: notes.id }).from(notes).where(isNotNull(notes.deletedAt)).all()
  for (const n of trashed) {
    db.delete(noteTags).where(eq(noteTags.noteId, n.id)).run()
    db.delete(noteMedia).where(eq(noteMedia.noteId, n.id)).run()
  }
  db.delete(notes).where(isNotNull(notes.deletedAt)).run()
  return c.json(ok({}, '回收站已清空'), HttpStatusCodes.OK)
}

export async function destroy(c: Context) {
  const { ids } = await c.req.json<{ ids: number[] }>()
  for (const id of ids) {
    db.delete(noteTags).where(eq(noteTags.noteId, id)).run()
    db.delete(noteMedia).where(eq(noteMedia.noteId, id)).run()
    db.delete(notes).where(eq(notes.id, id)).run()
  }
  return c.json(ok({}, '已永久删除'), HttpStatusCodes.OK)
}
