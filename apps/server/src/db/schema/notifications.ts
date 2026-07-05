import { sqliteTable, integer, text } from 'drizzle-orm/sqlite-core'
import { timestamps } from './columns.helpers'

export const notifications = sqliteTable('notifications', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  type: text('type').notNull(),
  title: text('title').notNull(),
  content: text('content'),
  meta: text('meta'),
  isRead: integer('is_read').notNull().default(0),
  emailStatus: text('email_status').notNull().default('pending'),
  emailError: text('email_error'),
  emailSentAt: integer('email_sent_at', { mode: 'timestamp_ms' }),
  ...timestamps,
})
