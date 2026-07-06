import type { Context } from 'hono'
import { eq, inArray } from 'drizzle-orm'
import { db } from '~/db'
import { configs, users } from '~/db/schema'
import { ok, fail } from '~/utils/response'
import { ErrorCode } from '@3qrain/shared'
import * as HttpStatusCodes from '~/constants/http-status-codes'
import { configSchemaMapping, type ConfigKey, type FullConfig } from './configs.schema'
import { getEmailConfig, saveEmailConfig, testEmailConnection, sendTestEmail } from '~/services/email'

export async function getAll(c: Context) {
  const keys = c.req.query('keys')?.split(',').filter(Boolean)
  const rows = keys
    ? db.select().from(configs).where(inArray(configs.key, keys)).all()
    : db.select().from(configs).all()
  const result = {} as Record<string, unknown>
  for (const row of rows) {
    try { result[row.key] = JSON.parse(row.value) } catch { /* skip */ }
  }
  return c.json(ok(result as FullConfig, '获取成功'), HttpStatusCodes.OK)
}

export async function getByKey(c: Context) {
  const key = c.req.param('key')!
  const row = db.select().from(configs).where(eq(configs.key, key)).get()
  if (!row) {
    return c.json(fail(ErrorCode.CONFIG_NOT_FOUND, '配置不存在'), HttpStatusCodes.NOT_FOUND)
  }
  return c.json(ok({ [key]: JSON.parse(row.value) }, '获取成功'), HttpStatusCodes.OK)
}

export async function update(c: Context) {
  const key = c.req.param('key')!
  const raw = await c.req.json()

  const schema = configSchemaMapping[key as ConfigKey]
  if (!schema) {
    return c.json(fail(ErrorCode.CONFIG_NOT_FOUND, '配置键不存在'), HttpStatusCodes.NOT_FOUND)
  }

  const parsed = schema.partial().strict().safeParse(raw)
  if (!parsed.success) {
    return c.json(fail(ErrorCode.INVALID_PARAMS, parsed.error.issues[0].message), HttpStatusCodes.BAD_REQUEST)
  }

  const existing = db.select().from(configs).where(eq(configs.key, key)).get()!
  const merged = { ...JSON.parse(existing.value), ...raw }
  db.update(configs).set({ value: JSON.stringify(merged) }).where(eq(configs.key, key)).run()

  return c.json(ok({ [key]: merged }, '更新成功'), HttpStatusCodes.OK)
}

export async function getEmailConf(c: Context) {
  return c.json(ok(getEmailConfig(), '获取成功'), HttpStatusCodes.OK)
}

export async function saveEmailConf(c: Context) {
  const body = await c.req.json() as { enabled: boolean; host: string; port: number; user: string; pass: string }
  saveEmailConfig(body)
  return c.json(ok({}, '保存成功'), HttpStatusCodes.OK)
}

export async function testEmail(c: Context) {
  const config = getEmailConfig()
  if (!config.enabled || !config.host) {
    return c.json(fail(ErrorCode.INVALID_PARAMS, '请先配置并启用 SMTP'), HttpStatusCodes.BAD_REQUEST)
  }
  
  const result = await testEmailConnection(config)
  if (result.ok) {
    return c.json(ok({}, '连接成功'), HttpStatusCodes.OK)
  }
  return c.json(fail(ErrorCode.EMAIL_ERROR, result.error!), HttpStatusCodes.BAD_REQUEST)
}

export async function sendTestEmailHandler(c: Context) {
  const config = getEmailConfig()
  if (!config.enabled || !config.host) {
    return c.json(fail(ErrorCode.INVALID_PARAMS, '请先配置并启用 SMTP'), HttpStatusCodes.BAD_REQUEST)
  }
  const admin = db.select({ username: users.username, email: users.email }).from(users).where(eq(users.role, 'system')).get()
  if (!admin?.email) {
    return c.json(fail(ErrorCode.INVALID_PARAMS, '请先在个人信息中设置邮箱'), HttpStatusCodes.BAD_REQUEST)
  }
  const result = await sendTestEmail(config, admin.email, admin.username)
  if (result.ok) {
    return c.json(ok({}, '发送成功'), HttpStatusCodes.OK)
  }
  return c.json(fail(ErrorCode.EMAIL_ERROR, result.error!), HttpStatusCodes.BAD_REQUEST)
}
