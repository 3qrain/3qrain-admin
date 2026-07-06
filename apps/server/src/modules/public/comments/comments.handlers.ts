import type { Context } from 'hono'
import { eq, and, asc, desc, isNull, count, inArray, lt } from 'drizzle-orm'
import { db } from '~/db'
import { comments, users, posts, notes } from '~/db/schema'
import { notify } from '~/services/notify'
import { sendEmail } from '~/services/email'
import { renderNewCommentEmail, renderNewReplyEmail, renderReplyEmail } from '@3qrain/shared'
import { ok, fail } from '~/utils/response'
import { ErrorCode } from '@3qrain/shared'
import * as HttpStatusCodes from '~/constants/http-status-codes'
import { createCommentSchema } from './comments.routes'
import { getClientIp } from '~/utils/getClientIp'

function enrichComments(rows: any[]) {
  if (rows.length === 0) return []
  const userIds = [...new Set(
    rows.flatMap(r => [r.userId, r.replyToUserId].filter(Boolean))
  )] as number[]

  const userMap = new Map(
    userIds.length > 0
      ? db.select({ id: users.id, username: users.username, avatarUrl: users.avatarUrl })
        .from(users).where(inArray(users.id, userIds)).all().map(u => [u.id, u])
      : [],
  )

  return rows.map(c => ({
    id: c.id,
    targetType: c.targetType,
    targetId: c.targetId,
    userId: c.userId,
    user: userMap.get(c.userId) || { id: c.userId, username: '', avatarUrl: '' },
    parentId: c.parentId,
    replyToId: c.replyToId,
    replyToUserId: c.replyToUserId,
    replyToUser: c.replyToUserId ? (userMap.get(c.replyToUserId) || null) : null,
    content: c.content,
    isPinned: c.isPinned,
    createdAt: c.createdAt,
  }))
}

export async function list(c: Context) {
  const { targetType, targetId } = c.req.query()
  const query = c.req.query()
  const page = Number(query.page || 1)
  const pageSize = Number(query.pageSize || 10)
  const t = query.t ? Number(query.t) : undefined

  const publishedFilter = and(
    eq(comments.targetType, targetType),
    eq(comments.targetId, Number(targetId)),
    eq(comments.status, 'published'),
    isNull(comments.deletedAt),
  )
  const tCondition = t ? lt(comments.createdAt, new Date(t)) : undefined
  const parentFilter = tCondition
    ? and(publishedFilter!, isNull(comments.parentId), tCondition)
    : and(publishedFilter!, isNull(comments.parentId))

  const total = db.select({ count: count() }).from(comments).where(publishedFilter!).get()!.count
  const parentTotal = db.select({ count: count() }).from(comments).where(parentFilter!).get()!.count

  const parentRows = db
    .select()
    .from(comments)
    .where(parentFilter!)
    .orderBy(desc(comments.isPinned), desc(comments.createdAt))
    .limit(pageSize)
    .offset((page - 1) * pageSize)
    .all()

  if (parentRows.length === 0) {
    return c.json(ok({ list: [], total, parentTotal: 0, pageSize }, '获取成功'), HttpStatusCodes.OK)
  }

  // 查所有主评论的子评论
  const parentIds = parentRows.map(p => p.id)
  const childRows = db
    .select()
    .from(comments)
    .where(and(inArray(comments.parentId, parentIds), publishedFilter!))
    .orderBy(asc(comments.createdAt))
    .all()

  // 查子评论的子评论（回复的回复）
  const childIds = childRows.map(c => c.id)
  const grandchildRows = childIds.length > 0
    ? db.select().from(comments).where(and(inArray(comments.parentId, childIds), publishedFilter!)).orderBy(asc(comments.createdAt)).all()
    : []

  // 按 parentId 分组
  const childrenMap: Record<number, any[]> = {}
  for (const child of childRows) {
    if (child.parentId === null) continue
    if (!childrenMap[child.parentId]) childrenMap[child.parentId] = []
    childrenMap[child.parentId].push(child)
  }

  // 合并所有需要 enrich 的行
  const allRows = [...parentRows, ...childRows, ...grandchildRows]
  const enriched = enrichComments(allRows)
  const enrichedMap = new Map(enriched.map((e: any) => [e.id, e]))

  const list = parentRows.map(p => ({
    ...enrichedMap.get(p.id)!,
    replies: (childrenMap[p.id] || []).map((c: any) => ({
      ...enrichedMap.get(c.id)!,
      replies: (childrenMap[c.id] || []).map((gc: any) => enrichedMap.get(gc.id)!),
    })),
  }))

  return c.json(ok({ list, total, parentTotal, pageSize }, '获取成功'), HttpStatusCodes.OK)
}

export async function create(c: Context) {
  const user = c.get('user')

  const parsed = createCommentSchema.safeParse(await c.req.json())
  if (!parsed.success) {
    return c.json(fail(ErrorCode.INVALID_PARAMS, parsed.error.issues[0].message), HttpStatusCodes.BAD_REQUEST)
  }

  const body = parsed.data
  const result = db
    .insert(comments)
    .values({
      targetType: body.targetType,
      targetId: body.targetId,
      userId: user.id,
      parentId: body.parentId || null,
      replyToId: body.replyToId || null,
      replyToUserId: body.replyToUserId || null,
      content: body.content,
      status: 'published',
      ip: getClientIp(c),
      userAgent: c.req.header('user-agent') || null,
    })
    .returning()
    .get()

  const [enriched] = enrichComments([result])

  // 通知管理员
  try {
    const isReply = !!body.parentId
    const maxLength = 25
    let summary = body.content.slice(0, maxLength)
    if (body.content.length > maxLength) summary += '...'

    // 获取文章信息
    let postTitle = ''
    let postSlug = ''
    if (body.targetType === 'post') {
      const post = db.select({ title: posts.title, slug: posts.slug }).from(posts).where(eq(posts.id, body.targetId)).get()
      postTitle = post?.title || ''
      postSlug = post?.slug || ''
    } else if (body.targetType === 'note') {
      postTitle = '说说#' + body.targetId
    }

    const meta = JSON.stringify({
      targetType: body.targetType,
      targetId: body.targetId,
      commentId: result.id,
      parentId: body.parentId || null,
    })

    await notify({
      scope: 'admin',
      type: isReply ? 'new_reply' : 'new_comment',
      title: postTitle + (isReply ? ' 有新回复' : ' 有新评论'),
      content: summary,
      meta,
    })

    // 邮件通知
    const admin = db.select({ username: users.username, email: users.email }).from(users).where(eq(users.role, 'system')).get()
    const siteName = admin?.username || '3qrain'
    const now = new Date().toLocaleString('zh-CN', { timeZone: 'Asia/Shanghai' })

    if (isReply) {
      // 回复：只通知被回复的人，不邮件通知站长
      if (body.replyToUserId) {
        const parentAuthor = db.select({ username: users.username, email: users.email }).from(users).where(eq(users.id, body.replyToUserId)).get()
        const parentComment = db.select({ content: comments.content }).from(comments).where(eq(comments.id, body.parentId!)).get()

        if (parentAuthor?.email) {
          sendEmail({
            to: parentAuthor.email,
            subject: `[${siteName}] 您收到了来自 ${user.username} 的评论回复`,
            html: renderReplyEmail({
              siteName,
              userName: parentAuthor.username,
              replierName: user.username,
              postTitle,
              postSlug,
              replyContent: body.content,
              yourComment: parentComment?.content?.slice(0, 100) || '...',
            }),
          }).catch(() => {})
        }
      }
    } else {
      // 新评论：通知站长
      if (admin?.email) {
        sendEmail({
          to: admin.email,
          subject: `[${siteName}] 新评论飞来「${postTitle}」`,
          html: renderNewCommentEmail({
            siteName,
            postTitle,
            postSlug,
            commenterName: user.username,
            commenterEmail: user.email || '',
            commentContent: body.content,
            time: now,
          }),
        }).catch(() => {})
      }
    }
  } catch (e) {
    console.error('[notify] failed to send notification:', e)
  }

  return c.json(ok(enriched, '评论成功'), HttpStatusCodes.CREATED)
}
