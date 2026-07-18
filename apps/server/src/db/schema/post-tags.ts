import { sqliteTable, integer, primaryKey, index } from "drizzle-orm/sqlite-core";
import { posts } from "./posts";
import { tags } from "./tags";

export const postTags = sqliteTable(
  "post_tags",
  {
    postId: integer("post_id").notNull().references(() => posts.id, { onDelete: "cascade" }),
    tagId: integer("tag_id").notNull().references(() => tags.id, { onDelete: "cascade" }),
  },
  (table) => [
    primaryKey({ columns: [table.postId, table.tagId] }),
    index("post_tags_tag_id_idx").on(table.tagId),
  ],
);
