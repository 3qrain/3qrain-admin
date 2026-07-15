import type { Context } from 'hono'
import { and, count, desc, eq, isNull, sql } from 'drizzle-orm'
import { db } from '~/db'
import { comments, friendLinks, media, notes, notifications, posts, users } from '~/db/schema'
import { getVisitorCount } from '~/services/ws'
import { ok } from '~/utils/response'
import * as HttpStatusCodes from '~/constants/http-status-codes'

function asNumber(value: number | string | null | undefined) {
  return Number(value || 0)
}

function toIso(value: Date) {
  return value.toISOString()
}

export async function overview(c: Context) {
  const postCounts = db
    .select({
      total: count(),
      published: sql<number>`sum(case when ${posts.status} = 'published' then 1 else 0 end)`,
      draft: sql<number>`sum(case when ${posts.status} = 'draft' then 1 else 0 end)`,
      archived: sql<number>`sum(case when ${posts.status} = 'archived' then 1 else 0 end)`,
      totalViews: sql<number>`coalesce(sum(${posts.viewCount}), 0)`
    })
    .from(posts)
    .where(isNull(posts.deletedAt))
    .get()!

  const noteCounts = db
    .select({
      total: count(),
      published: sql<number>`sum(case when ${notes.isPublished} = 1 then 1 else 0 end)`,
      hidden: sql<number>`sum(case when ${notes.isPublished} = 0 then 1 else 0 end)`
    })
    .from(notes)
    .where(isNull(notes.deletedAt))
    .get()!

  const commentCounts = db
    .select({
      total: count(),
      pending: sql<number>`sum(case when ${comments.status} = 'pending' then 1 else 0 end)`
    })
    .from(comments)
    .where(isNull(comments.deletedAt))
    .get()!

  const mediaCount = db.select({ total: count() }).from(media).get()!.total
  const visitorCount = db.select({ total: count() }).from(users).where(eq(users.role, 'visitor')).get()!.total
  const friendLinkCounts = db
    .select({
      approved: sql<number>`sum(case when ${friendLinks.status} = 'approved' then 1 else 0 end)`,
      pending: sql<number>`sum(case when ${friendLinks.status} = 'pending' then 1 else 0 end)`
    })
    .from(friendLinks)
    .get()!
  const unreadNotifications = db
    .select({ total: count() })
    .from(notifications)
    .where(eq(notifications.isRead, 0))
    .get()!.total

  const recentComments = db
    .select({
      id: comments.id,
      content: comments.content,
      status: comments.status,
      parentId: comments.parentId,
      targetType: comments.targetType,
      createdAt: comments.createdAt,
      username: users.username,
      avatarUrl: users.avatarUrl
    })
    .from(comments)
    .innerJoin(users, eq(comments.userId, users.id))
    .where(isNull(comments.deletedAt))
    .orderBy(desc(comments.createdAt))
    .limit(5)
    .all()

  const topPosts = db
    .select({
      id: posts.id,
      title: posts.title,
      viewCount: posts.viewCount,
      updatedAt: posts.updatedAt
    })
    .from(posts)
    .where(and(isNull(posts.deletedAt), eq(posts.status, 'published')))
    .orderBy(desc(posts.viewCount), desc(posts.updatedAt))
    .limit(5)
    .all()
    .map(post => ({ ...post, updatedAt: toIso(post.updatedAt) }))

  return c.json(
    ok(
      {
        overview: {
          totalViews: asNumber(postCounts.totalViews),
          onlineVisitors: getVisitorCount(),
          posts: {
            total: asNumber(postCounts.total),
            published: asNumber(postCounts.published),
            draft: asNumber(postCounts.draft),
            archived: asNumber(postCounts.archived)
          },
          notes: {
            total: asNumber(noteCounts.total),
            published: asNumber(noteCounts.published),
            hidden: asNumber(noteCounts.hidden)
          },
          comments: {
            total: asNumber(commentCounts.total),
            pending: asNumber(commentCounts.pending)
          },
          media: asNumber(mediaCount),
          visitors: asNumber(visitorCount),
          friendLinks: {
            approved: asNumber(friendLinkCounts.approved),
            pending: asNumber(friendLinkCounts.pending)
          },
          unreadNotifications: asNumber(unreadNotifications)
        },
        recentComments: recentComments.map(comment => ({
          id: comment.id,
          content: comment.content,
          status: comment.status,
          parentId: comment.parentId,
          targetType: comment.targetType,
          createdAt: toIso(comment.createdAt),
          user: {
            username: comment.username,
            avatarUrl: comment.avatarUrl
          }
        })),
        topPosts
      },
      '获取成功'
    ),
    HttpStatusCodes.OK
  )
}
