import { sqliteTable, integer, primaryKey, index } from 'drizzle-orm/sqlite-core'
import { notes } from './notes'
import { tags } from './tags'

export const noteTags = sqliteTable(
  'note_tags',
  {
    noteId: integer('note_id').notNull().references(() => notes.id, { onDelete: 'cascade' }),
    tagId: integer('tag_id').notNull().references(() => tags.id, { onDelete: 'cascade' }),
  },
  (table) => [
    primaryKey({ columns: [table.noteId, table.tagId] }),
    index('note_tags_tag_id_idx').on(table.tagId),
  ],
)
