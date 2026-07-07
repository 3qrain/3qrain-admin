import { sqliteTable, integer, text } from 'drizzle-orm/sqlite-core'
import { timestamps } from './columns.helpers'

export const friendLinks = sqliteTable('friend_links', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  siteName: text('site_name').notNull(),
  siteUrl: text('site_url').notNull(),
  avatarUrl: text('icon_url'),
  description: text('description'),
  applicantEmail: text('applicant_email'),
  status: text('status').notNull().default('pending'),
  rejectReason: text('reject_reason'),
  approvedAt: integer('approved_at', { mode: 'timestamp_ms' }),
  rejectedAt: integer('rejected_at', { mode: 'timestamp_ms' }),
  ...timestamps,
})
