import type { Context } from 'hono'
import { eq, and, asc, desc, isNull, count, inArray, lt } from 'drizzle-orm'
import { db } from '~/db'
import { comments, users, posts, notes } from '~/db/schema'
import { notify } from '~/services/notify'
import { ok, fail } from '~/utils/response'
import { ErrorCode } from '@3qrain/shared'
import type {
  CommentEmailNotRequiredReason,
  CommentNotificationMeta,
  EmailStatus,
} from '@3qrain/shared'
import * as HttpStatusCodes from '~/constants/http-status-codes'
import { createCommentSchema } from './comments.routes'
import { getClientIp } from '~/utils/getClientIp'
import { getConfigValue } from '~/services/config'
import { dispatchCommentReviewEmail } from '~/services/email/dispatch'

function enrichComments(rows: any[]) {
  if (rows.length === 0) return []
  const userIds = [...new Set(
    rows.flatMap(r => [r.userId, r.replyToUserId].filter(Boolean))
  )] as number[]

  const userMap = new Map(
    userIds.length > 0
      ? db.select({ id: users.id, username: users.username, avatarUrl: users.avatarUrl, role: users.role })
        .from(users).where(inArray(users.id, userIds)).all().map(u => [u.id, u])
      : [],
  )

  return rows.map(c => ({
    id: c.id,
    targetType: c.targetType,
    targetId: c.targetId,
    userId: c.userId,
    user: userMap.get(c.userId) || { id: c.userId, username: '', avatarUrl: '', role: 'visitor' },
    parentId: c.parentId,
    replyToId: c.replyToId,
    replyToUserId: c.replyToUserId,
    replyToUser: c.replyToUserId ? (userMap.get(c.replyToUserId) || null) : null,
    content: c.content,
    isPinned: c.isPinned,
    status: c.status,
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
  const commentsConfig = getConfigValue('comments')

  if (!commentsConfig.enabled) {
    return c.json(fail(ErrorCode.FEATURE_DISABLED, '评论功能暂时停用'), HttpStatusCodes.FORBIDDEN)
  }

  const parsed = createCommentSchema.safeParse(await c.req.json())
  if (!parsed.success) {
    return c.json(fail(ErrorCode.INVALID_PARAMS, parsed.error.issues[0].message), HttpStatusCodes.BAD_REQUEST)
  }

  const body = parsed.data
  const pendingReview = commentsConfig.reviewEnabled && user.role === 'visitor'
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
      status: pendingReview ? 'pending' : 'published',
      ip: getClientIp(c),
      userAgent: c.req.header('user-agent') || null,
    })
    .returning()
    .get()

  const [enriched] = enrichComments([result])

  // 通知
  try {
    const isReply = !!body.parentId
    const maxLength = 25
    let summary = body.content.slice(0, maxLength)
    if (body.content.length > maxLength) summary += '...'

    let postTitle = ''
    if (body.targetType === 'post') {
      const post = db.select({ title: posts.title }).from(posts).where(eq(posts.id, body.targetId)).get()
      postTitle = post?.title || ''
    } else if (body.targetType === 'note') {
      postTitle = '说说#' + body.targetId
    }

    const replyRecipient = result.replyToUserId
      ? db.select({ role: users.role }).from(users).where(eq(users.id, result.replyToUserId)).get()
      : null
    const isSelfReply = isReply && user.id === result.replyToUserId
    const repliesToAdmin = replyRecipient?.role === 'system' || replyRecipient?.role === 'admin'
    const isAdminComment = !isReply && (user.role === 'system' || user.role === 'admin')

    let emailStatus: EmailStatus | undefined
    let emailNotRequiredReason: CommentEmailNotRequiredReason | undefined

    if (pendingReview) {
      if (isReply && !isSelfReply && !repliesToAdmin) {
        // 回复普通访客时，正常的回复邮件要等评论审核通过后再发送。
        emailStatus = 'pending_review'
      } else {
        // 根评论、回复管理员和自己回复自己只发独立的审核提醒，不再安排常规通知邮件。
        emailStatus = 'not_required'
        emailNotRequiredReason = isSelfReply ? 'self_reply' : 'review_notice_only'
      }
    } else if (isSelfReply) {
      // 自己回复自己没有实际邮件接收者。
      emailStatus = 'not_required'
      emailNotRequiredReason = 'self_reply'
    } else if (isAdminComment) {
      // 管理员发表根评论时，不需要再给管理员自己发送新评论邮件。
      emailStatus = 'not_required'
      emailNotRequiredReason = 'admin_comment'
    }

    // emailStatus 未设置时，由 notify() 根据邮件配置生成状态并立即派发常规通知邮件。

    const meta: CommentNotificationMeta = {
      targetType: body.targetType,
      targetId: body.targetId,
      commentId: result.id,
      parentId: body.parentId || null,
      replyToId: body.replyToId || null,
      pendingReview,
      emailNotRequiredReason,
    }

    // 审核提醒独立于通知邮件状态，发送失败也不会影响评论提交。
    if (pendingReview) {
      dispatchCommentReviewEmail(meta)
    }

    await notify({
      scope: 'admin',
      type: isReply ? 'new_reply' : 'new_comment',
      title: postTitle + (isReply ? ' 有新回复' : ' 有新评论'),
      content: summary,
      // pending_review 只表示确实有一封给普通访客的回复邮件需要等待审核。
      emailStatus,
      meta,
    })
  } catch (e) {
    // console.error('[notify] failed:', e)
  }

  return c.json(ok(enriched, pendingReview ? '评论已提交，等待审核' : '评论成功'), HttpStatusCodes.CREATED)
}
