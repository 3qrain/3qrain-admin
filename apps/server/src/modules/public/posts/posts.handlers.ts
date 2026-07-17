import type { Context } from 'hono'
import { eq, and, desc, count, inArray, isNull } from 'drizzle-orm'
import { db } from '~/db'
import { posts, postTags, categories, tags } from '~/db/schema'
import { ok, fail } from '~/utils/response'
import { ErrorCode, emptyTiptapDocument, type TiptapDocument } from '@3qrain/shared'
import * as HttpStatusCodes from '~/constants/http-status-codes'

const publishedFilter = and(eq(posts.status, 'published'), isNull(posts.deletedAt))

function parseContent(content: string): TiptapDocument {
  try {
    const parsed = JSON.parse(content)
    if (parsed?.type === 'doc' && Array.isArray(parsed.content)) {
      return parsed
    }
  } catch {
    /* Invalid editor data falls back to an empty document. */
  }
  return emptyTiptapDocument
}

export async function list(c: Context) {
  const page = Number(c.req.query('page') || 1)
  const pageSize = Number(c.req.query('pageSize') || 10)
  const categorySlug = c.req.query('category')
  const tagSlug = c.req.query('tag')

  const conditions = [publishedFilter!]

  if (categorySlug) {
    const cat = db.select({ id: categories.id }).from(categories).where(eq(categories.slug, categorySlug)).get()
    if (!cat) {
      return c.json(ok({ list: [], total: 0, page, pageSize }, '获取成功'), HttpStatusCodes.OK)
    }
    conditions.push(eq(posts.categoryId, cat.id))
  }

  let tagFilterPostIds: number[] | null = null
  if (tagSlug) {
    const tag = db.select({ id: tags.id }).from(tags).where(eq(tags.slug, tagSlug)).get()
    if (!tag) {
      return c.json(ok({ list: [], total: 0, page, pageSize }, '获取成功'), HttpStatusCodes.OK)
    }
    tagFilterPostIds = db
      .select({ postId: postTags.postId })
      .from(postTags)
      .where(eq(postTags.tagId, tag.id))
      .all()
      .map(r => r.postId)
    if (tagFilterPostIds.length === 0) {
      return c.json(ok({ list: [], total: 0, page, pageSize }, '获取成功'), HttpStatusCodes.OK)
    }
    conditions.push(inArray(posts.id, tagFilterPostIds))
  }

  const where = and(...conditions)

  const total = db.select({ count: count() }).from(posts).where(where).get()!.count
  const rows = db
    .select({
      id: posts.id,
      title: posts.title,
      slug: posts.slug,
      summary: posts.summary,
      cover: posts.cover,
      isPinned: posts.isPinned,
      viewCount: posts.viewCount,
      categoryId: posts.categoryId,
      createdAt: posts.createdAt,
    })
    .from(posts)
    .where(where)
    .orderBy(desc(posts.isPinned), desc(posts.createdAt))
    .limit(pageSize)
    .offset((page - 1) * pageSize)
    .all()

  if (rows.length === 0) {
    return c.json(ok({ list: [], total, page, pageSize }, '获取成功'), HttpStatusCodes.OK)
  }

  const postIds = rows.map(p => p.id)
  const catIds = [...new Set(rows.map(p => p.categoryId).filter(Boolean))] as number[]

  const catMap = catIds.length > 0
    ? new Map(
      db.select({ id: categories.id, name: categories.name, slug: categories.slug })
        .from(categories)
        .where(inArray(categories.id, catIds))
        .all()
        .map(c => [c.id, c]),
    )
    : new Map()

  const ptRows = db
    .select({ postId: postTags.postId, id: tags.id, name: tags.name, slug: tags.slug })
    .from(postTags)
    .innerJoin(tags, eq(postTags.tagId, tags.id))
    .where(inArray(postTags.postId, postIds))
    .all()

  const tagMap = new Map<number, { id: number; name: string; slug: string }[]>()
  for (const pt of ptRows) {
    if (!tagMap.has(pt.postId)) tagMap.set(pt.postId, [])
    tagMap.get(pt.postId)!.push({ id: pt.id, name: pt.name, slug: pt.slug })
  }

  const list = rows.map(p => ({
    ...p,
    slug: p.slug || '',
    cover: p.cover,
    category: (p.categoryId && catMap.get(p.categoryId)) || null,
    tags: tagMap.get(p.id) || [],
  }))

  return c.json(ok({ list, total, page, pageSize }, '获取成功'), HttpStatusCodes.OK)
}

export async function detail(c: Context) {
  const slug = c.req.param('slug')!

  const post = db
    .select()
    .from(posts)
    .where(and(eq(posts.slug, slug), publishedFilter!))
    .get()

  if (!post) {
    return c.json(fail(ErrorCode.POST_NOT_FOUND, '文章不存在'), HttpStatusCodes.NOT_FOUND)
  }

  const category = post.categoryId
    ? db.select({ id: categories.id, name: categories.name, slug: categories.slug })
      .from(categories).where(eq(categories.id, post.categoryId)).get() ?? null
    : null

  const tagRows = db
    .select({ id: tags.id, name: tags.name, slug: tags.slug })
    .from(postTags)
    .innerJoin(tags, eq(postTags.tagId, tags.id))
    .where(eq(postTags.postId, post.id))
    .all()

  return c.json(ok({
    id: post.id,
    title: post.title,
    slug: post.slug || '',
    summary: post.summary,
    cover: post.cover,
    content: parseContent(post.content),
    isPinned: post.isPinned,
    categoryId: post.categoryId,
    viewCount: post.viewCount || 0,
    category,
    tags: tagRows,
    createdAt: post.createdAt,
    updatedAt: post.updatedAt,
  }, '获取成功'), HttpStatusCodes.OK)
}
