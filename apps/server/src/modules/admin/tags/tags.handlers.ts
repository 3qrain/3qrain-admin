import type { Context } from "hono";
import { eq, countDistinct, getTableColumns } from "drizzle-orm";
import { db } from "~/db";
import { tags, postTags, noteTags } from "~/db/schema";
import { ok, fail } from "~/utils/response";
import { ErrorCode } from "@3qrain/shared";
import * as HttpStatusCodes from "~/constants/http-status-codes";

export async function list(c: Context) {
  const rows = db
    .select({
      ...getTableColumns(tags),
      postCount: countDistinct(postTags.postId),
      noteCount: countDistinct(noteTags.noteId),
    })
    .from(tags)
    .leftJoin(postTags, eq(postTags.tagId, tags.id))
    .leftJoin(noteTags, eq(noteTags.tagId, tags.id))
    .groupBy(tags.id)
    .all();
  const result = rows.map(tag => ({
    ...tag,
    createdAt: tag.createdAt.toISOString(),
    updatedAt: tag.updatedAt.toISOString(),
    usageCount: tag.postCount + tag.noteCount,
  }));
  return c.json(ok(result, "获取成功"), HttpStatusCodes.OK);
}

export async function create(c: Context) {
  const { name, slug } = await c.req.json<{ name: string; slug: string }>();

  const nameExists = db.select().from(tags).where(eq(tags.name, name)).get();
  if (nameExists) {
    return c.json(fail(ErrorCode.TAG_NAME_EXISTS, "标签名称已存在"), HttpStatusCodes.CONFLICT);
  }

  const slugExists = db.select().from(tags).where(eq(tags.slug, slug)).get();
  if (slugExists) {
    return c.json(fail(ErrorCode.TAG_SLUG_EXISTS, "标签标识已存在"), HttpStatusCodes.CONFLICT);
  }

  const inserted = db.insert(tags).values({ name, slug }).returning().get();
  const result = {
    ...inserted,
    createdAt: inserted.createdAt.toISOString(),
    updatedAt: inserted.updatedAt.toISOString(),
  };
  return c.json(ok(result, "创建成功"), HttpStatusCodes.CREATED);
}

export async function update(c: Context) {
  const id = Number.parseInt(c.req.param("id")!);
  const body = await c.req.json<{ name?: string; slug?: string }>();

  const existing = db.select().from(tags).where(eq(tags.id, id)).get();
  if (!existing) {
    return c.json(fail(ErrorCode.TAG_NOT_FOUND, "标签不存在"), HttpStatusCodes.NOT_FOUND);
  }

  if (body.name !== undefined && body.name !== existing.name) {
    const dup = db.select().from(tags).where(eq(tags.name, body.name)).get();
    if (dup) {
      return c.json(fail(ErrorCode.TAG_NAME_EXISTS, "标签名称已存在"), HttpStatusCodes.CONFLICT);
    }
  }

  if (body.slug !== undefined && body.slug !== existing.slug) {
    const dup = db.select().from(tags).where(eq(tags.slug, body.slug)).get();
    if (dup) {
      return c.json(fail(ErrorCode.TAG_SLUG_EXISTS, "标签标识已存在"), HttpStatusCodes.CONFLICT);
    }
  }

  const updated = db.update(tags).set(body).where(eq(tags.id, id)).returning().get();
  const result = {
    ...updated,
    createdAt: updated.createdAt.toISOString(),
    updatedAt: updated.updatedAt.toISOString(),
  };
  return c.json(ok(result, "更新成功"), HttpStatusCodes.OK);
}

export async function remove(c: Context) {
  const id = Number.parseInt(c.req.param("id")!);

  const existing = db.select().from(tags).where(eq(tags.id, id)).get();
  if (!existing) {
    return c.json(fail(ErrorCode.TAG_NOT_FOUND, "标签不存在"), HttpStatusCodes.NOT_FOUND);
  }

  db.delete(tags).where(eq(tags.id, id)).run();
  return c.json(ok({}, "删除成功"), HttpStatusCodes.OK);
}
