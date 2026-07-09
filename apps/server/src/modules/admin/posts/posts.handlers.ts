import type { Context } from 'hono'
import { eq, like, and, desc, count as drizzleCount, inArray, isNull, isNotNull, lt } from 'drizzle-orm'
import { db } from '~/db'
import { posts, postTags, categories, tags } from '~/db/schema'
import { ok, fail } from '~/utils/response'
import { ErrorCode } from '@3qrain/shared'
import * as HttpStatusCodes from '~/constants/http-status-codes'
import { createPostSchema, updatePostSchema } from './posts.routes'
import { broadcast } from '~/services/notify'

function buildPostFilters(query: Record<string, string | undefined>) {
  const conditions = []

  if (query.deleted) {
    conditions.push(isNotNull(posts.deletedAt))
  } else {
    conditions.push(isNull(posts.deletedAt))
  }

  if (query.keyword) {
    conditions.push(like(posts.title, `%${query.keyword}%`))
  }
  if (query.status) {
    conditions.push(eq(posts.status, query.status))
  }
  if (query.categoryId) {
    conditions.push(eq(posts.categoryId, Number.parseInt(query.categoryId)))
  }

  return conditions
}

async function getPostWithRelations(postId: number) {
  const post = db.select().from(posts).where(eq(posts.id, postId)).get()
  if (!post) return null

  const category = post.categoryId ? db.select().from(categories).where(eq(categories.id, post.categoryId)).get() : null

  const tagRows = db
    .select({ id: tags.id, name: tags.name, slug: tags.slug })
    .from(postTags)
    .innerJoin(tags, eq(postTags.tagId, tags.id))
    .where(eq(postTags.postId, postId))
    .all()

  return serialize({ ...post, category, tags: tagRows })
}

// API → DB：空 slug → null，content 对象 → JSON 字符串，categoryId 0 false -> null
function normalize(data: Record<string, any>) {
  if (data.slug === '') data.slug = null
  if (!data.categoryId) delete data.categoryId
  if (data.content !== undefined && typeof data.content !== 'string') {
    data.content = JSON.stringify(data.content)
  }
  return data
}

// DB → API：slug null → ""，content JSON 解析
function serialize<T extends { slug: any; content: any }>(post: T): T {
  if (post.slug === null) post.slug = ''
  if (typeof post.content === 'string') {
    try {
      post.content = JSON.parse(post.content)
    } catch {
      /* keep raw */
    }
  }
  return post
}

// 同步文章标签关系
async function syncPostTags(postId: number, tagIds: number[]) {
  db.delete(postTags).where(eq(postTags.postId, postId)).run()
  if (tagIds.length > 0) {
    db.insert(postTags)
      .values(tagIds.map(tagId => ({ postId, tagId })))
      .run()
  }
}

// --- Handlers ---

export async function list(c: Context) {
  const query = c.req.query()
  const page = Number.parseInt(query.page || '1')
  const pageSize = Number.parseInt(query.pageSize || '10')
  const actualOffset = query.offset !== undefined ? Number(query.offset) : (page - 1) * pageSize
  const t = query.t ? Number(query.t) : undefined
  const filters = buildPostFilters(query)

  const conditions = filters
  if (t) conditions.push(lt(posts.createdAt, new Date(t)))
  const where = conditions.length > 0 ? and(...conditions) : undefined

  const total = db.select({ count: drizzleCount() }).from(posts).where(where).get()!.count

  const rows = db
    .select()
    .from(posts)
    .where(where)
    .orderBy(desc(posts.createdAt))
    .limit(pageSize)
    .offset(actualOffset)
    .all()

  if (rows.length === 0) {
    return c.json(ok({ list: [], total, page, pageSize }, '获取成功'), HttpStatusCodes.OK)
  }

  const postIds = rows.map(p => p.id)
  const catIds = [...new Set(rows.map(p => p.categoryId).filter(Boolean))] as number[]

  const catMap = new Map(
    db
      .select()
      .from(categories)
      .where(inArray(categories.id, catIds))
      .all()
      .map(c => [c.id, c])
  )

  const ptRows = db
    .select({
      postId: postTags.postId,
      id: tags.id,
      name: tags.name,
      slug: tags.slug
    })
    .from(postTags)
    .innerJoin(tags, eq(postTags.tagId, tags.id))
    .where(inArray(postTags.postId, postIds))
    .all()

  const tagMap = new Map<number, { id: number; name: string; slug: string }[]>()
  for (const pt of ptRows) {
    if (!tagMap.has(pt.postId)) tagMap.set(pt.postId, [])
    tagMap.get(pt.postId)!.push({ id: pt.id, name: pt.name, slug: pt.slug })
  }

  const list = rows.map(p =>
    serialize({
      ...p,
      category: (p.categoryId && catMap.get(p.categoryId)) || null,
      tags: tagMap.get(p.id) || []
    })
  )

  return c.json(ok({ list: list as any, total, page, pageSize }, '获取成功'), HttpStatusCodes.OK)
}

export async function detail(c: Context) {
  const id = Number.parseInt(c.req.param('id')!)
  const fields = c.req.query('fields')?.split(',')

  if (fields && fields.length > 0) {
    const post = db.select().from(posts).where(eq(posts.id, id)).get()
    if (!post) {
      return c.json(fail(ErrorCode.POST_NOT_FOUND, '文章不存在'), HttpStatusCodes.NOT_FOUND)
    }
    const slim: Record<string, any> = {}
    for (const f of fields) slim[f] = (post as any)[f]
    return c.json(ok(slim, '获取成功'), HttpStatusCodes.OK)
  }

  const post = await getPostWithRelations(id)
  if (!post) {
    return c.json(fail(ErrorCode.POST_NOT_FOUND, '文章不存在'), HttpStatusCodes.NOT_FOUND)
  }
  return c.json(ok(post as any, '获取成功'), HttpStatusCodes.OK)
}

export async function create(c: Context) {
  const parsed = createPostSchema.strict().safeParse(await c.req.json())
  if (!parsed.success) {
    return c.json(fail(ErrorCode.INVALID_PARAMS, parsed.error.issues[0].message), HttpStatusCodes.BAD_REQUEST)
  }
  const body = parsed.data

  const isDraft = body.status === 'draft'

  // 发布/归档时校验必填
  if (!isDraft) {
    if (!body.title || !body.slug || !body.categoryId) {
      return c.json(fail(ErrorCode.INVALID_PARAMS, '发布/归档时标题、标识和分类为必填'), HttpStatusCodes.BAD_REQUEST)
    }
  }

  // slug 唯一性检查
  if (body.slug) {
    const dup = db.select().from(posts).where(eq(posts.slug, body.slug)).get()
    if (dup) {
      return c.json(fail(ErrorCode.POST_SLUG_EXISTS, '文章标识已存在'), HttpStatusCodes.CONFLICT)
    }
  }

  // 分类校验
  if (body.categoryId && body.categoryId > 0) {
    const category = db.select().from(categories).where(eq(categories.id, body.categoryId)).get()
    if (!category) {
      return c.json(fail(ErrorCode.CATEGORY_NOT_FOUND, '分类不存在'), HttpStatusCodes.NOT_FOUND)
    }
  }

  // 标签校验
  if (body.tagIds.length > 0) {
    const existingTags = db.select({ id: tags.id }).from(tags).where(inArray(tags.id, body.tagIds)).all()
    if (existingTags.length !== body.tagIds.length) {
      return c.json(fail(ErrorCode.TAG_NOT_FOUND, '标签不存在'), HttpStatusCodes.NOT_FOUND)
    }
  }

  const { tagIds, ...data } = normalize(body)
  const result = serialize(
    db
      .insert(posts)
      .values({ ...data, viewCount: 0 })
      .returning()
      .get()
  )

  await syncPostTags(result.id, tagIds)

  const post = await getPostWithRelations(result.id)

  if (body.status === 'published') {
    broadcast({
      type: 'new_post',
      title: `飘来一篇文章「${body.title}」`,
      // content: body.summary || '',
      meta: JSON.stringify({ slug: body.slug })
    }).catch(() => {})
  }

  return c.json(ok(post as any, '创建成功'), HttpStatusCodes.CREATED)
}

export async function update(c: Context) {
  const id = Number.parseInt(c.req.param('id')!)
  const parsed = updatePostSchema.strict().safeParse(await c.req.json())
  if (!parsed.success) {
    return c.json(fail(ErrorCode.INVALID_PARAMS, parsed.error.issues[0].message), HttpStatusCodes.BAD_REQUEST)
  }
  const body = parsed.data

  const existing = db.select().from(posts).where(eq(posts.id, id)).get()
  if (!existing) {
    return c.json(fail(ErrorCode.POST_NOT_FOUND, '文章不存在'), HttpStatusCodes.NOT_FOUND)
  }

  // 目标状态：优先看 body.status，否则用现有状态
  const targetStatus = body.status || existing.status
  const isDraft = targetStatus === 'draft'

  // 发布/归档时校验必填
  if (!isDraft) {
    const title = body.title ?? existing.title
    const slug = body.slug ?? existing.slug
    const categoryId = body.categoryId ?? existing.categoryId
    if (!title || !slug || !categoryId) {
      return c.json(fail(ErrorCode.INVALID_PARAMS, '发布/归档时标题、标识和分类为必填'), HttpStatusCodes.BAD_REQUEST)
    }
  }

  if (body.slug && body.slug !== existing.slug) {
    const dup = db.select().from(posts).where(eq(posts.slug, body.slug)).get()
    if (dup) {
      return c.json(fail(ErrorCode.POST_SLUG_EXISTS, '文章标识已存在'), HttpStatusCodes.CONFLICT)
    }
  }

  if (body.categoryId && body.categoryId > 0) {
    const category = db.select().from(categories).where(eq(categories.id, body.categoryId)).get()
    if (!category) {
      return c.json(fail(ErrorCode.CATEGORY_NOT_FOUND, '分类不存在'), HttpStatusCodes.NOT_FOUND)
    }
  }

  const { tagIds, ...postData } = normalize(body)

  if (tagIds !== undefined && tagIds.length > 0) {
    const existingTags = db.select({ id: tags.id }).from(tags).where(inArray(tags.id, tagIds)).all()
    if (existingTags.length !== tagIds.length) {
      return c.json(fail(ErrorCode.TAG_NOT_FOUND, '标签不存在'), HttpStatusCodes.NOT_FOUND)
    }
  }

  db.update(posts).set(postData).where(eq(posts.id, id)).run()

  if (tagIds !== undefined) {
    await syncPostTags(id, tagIds)
  }

  const post = await getPostWithRelations(id)

  if (body.status === 'published') {
    broadcast({
      type: 'new_post',
      title: `飘来一篇文章「${body.title}」`,
      // content: body.summary || '',
      meta: JSON.stringify({ slug: body.slug })
    }).catch(() => {})
  }

  return c.json(ok(post as any, '更新成功'), HttpStatusCodes.OK)
}

export async function trash(c: Context) {
  const { ids } = await c.req.json<{ ids: number[] }>()
  for (const id of ids) {
    db.update(posts).set({ deletedAt: new Date() }).where(eq(posts.id, id)).run()
  }
  return c.json(ok({}, '已移入回收站'), HttpStatusCodes.OK)
}

export async function emptyTrash(c: Context) {
  const trashed = db.select({ id: posts.id }).from(posts).where(isNotNull(posts.deletedAt)).all()
  for (const p of trashed) {
    db.delete(postTags).where(eq(postTags.postId, p.id)).run()
  }
  db.delete(posts).where(isNotNull(posts.deletedAt)).run()
  return c.json(ok({}, '回收站已清空'), HttpStatusCodes.OK)
}

export async function destroy(c: Context) {
  const { ids } = await c.req.json<{ ids: number[] }>()
  for (const id of ids) {
    db.delete(postTags).where(eq(postTags.postId, id)).run()
    db.delete(posts).where(eq(posts.id, id)).run()
  }
  return c.json(ok({}, '已永久删除'), HttpStatusCodes.OK)
}

export async function restore(c: Context) {
  const id = Number.parseInt(c.req.param('id')!)

  const existing = db.select().from(posts).where(eq(posts.id, id)).get()
  if (!existing) {
    return c.json(fail(ErrorCode.POST_NOT_FOUND, '文章不存在'), HttpStatusCodes.NOT_FOUND)
  }
  if (!existing.deletedAt) {
    return c.json(fail(ErrorCode.POST_NOT_FOUND, '文章不在回收站'), HttpStatusCodes.NOT_FOUND)
  }

  db.update(posts).set({ deletedAt: null }).where(eq(posts.id, id)).run()
  const post = await getPostWithRelations(id)
  return c.json(ok(post as any, '恢复成功'), HttpStatusCodes.OK)
}
