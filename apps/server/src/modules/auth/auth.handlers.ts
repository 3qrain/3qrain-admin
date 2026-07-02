import type { Context } from 'hono'
import { count, eq } from 'drizzle-orm'
import { db, redis } from '~/db'
import { passwords, recoveryKeys, users } from '~/db/schema'
import { hashPassword, verifyPassword, generateToken } from '~/utils/crypto'
import { ok, fail } from '~/utils/response'
import { ErrorCode } from '@3qrain/shared'
import * as HttpStatusCodes from '~/constants/http-status-codes'
import { SESSION_ADMIN_PREFIX, type SessionValue } from '~/constants/session'
import { initConfigs } from '~/modules/admin/config/configs.default'
import { getClientIp } from '~/utils/getClientIp'
import { config } from '~/env'

const TOKEN_TTL = Number(config.TOKEN_TTL) || 86400

function buildSessionValue(c: Context): SessionValue {
  return {
    role: 'system' as const,
    loginIp: getClientIp(c),
    userAgent: c.req.header('user-agent') || 'unknown',
    createdAt: Date.now(),
    lastActiveAt: Date.now(),
  }
}

async function createSession(c: Context) {
  const token = generateToken()
  const value = buildSessionValue(c)
  await redis.setex(`${SESSION_ADMIN_PREFIX}${token}`, TOKEN_TTL, JSON.stringify(value))
  return token
}

function setCookie(c: Context, token: string) {
  c.header(
    'set-cookie',
    `3qrain_token=${token}; HttpOnly; SameSite=Lax; Path=/; Max-Age=${TOKEN_TTL}`,
  )
}

export async function status(c: Context) {
  const pwCount = db.select({ count: count() }).from(passwords).get()
  const adminUser = db.select().from(users).where(eq(users.role, 'system')).get()
  return c.json(
    ok({ initialized: pwCount!.count > 0, hasAdminUser: !!adminUser }, '状态检查成功'),
    HttpStatusCodes.OK,
  )
}

export async function setup(c: Context) {
  const pwCount = db.select({ count: count() }).from(passwords).get()
  if (pwCount!.count > 0) {
    return c.json(fail(ErrorCode.ALREADY_INITIALIZED, '已初始化'), HttpStatusCodes.CONFLICT)
  }

  const { password, confirmPassword, email, nickname } = await c.req.json<{
    password: string
    confirmPassword: string
    email?: string
    nickname?: string
  }>()

  if (password !== confirmPassword) {
    return c.json(fail(ErrorCode.INVALID_PARAMS, '两次密码不一致'), HttpStatusCodes.BAD_REQUEST)
  }

  const adminUser = db.select().from(users).where(eq(users.role, 'system')).get()
  if (!adminUser) {
    if (!email) {
      return c.json(fail(ErrorCode.INVALID_PARAMS, '邮箱不能为空'), HttpStatusCodes.BAD_REQUEST)
    }
    db.insert(users).values({
      username: nickname || '3qrain',
      email,
      role: 'system',
    }).run()
  }

  const passwordHash = await hashPassword(password)
  db.insert(passwords).values({ hash: passwordHash }).run()

  db.delete(recoveryKeys).run()
  const recoveryKey = generateToken()
  const recoveryHash = await hashPassword(recoveryKey)
  db.insert(recoveryKeys).values({ hash: recoveryHash }).run()

  await initConfigs()

  const token = await createSession(c)
  setCookie(c, token)

  return c.json(ok({ recoveryKey }, '设置成功'), HttpStatusCodes.CREATED)
}

export async function login(c: Context) {
  const pw = db.select().from(passwords).limit(1).all()[0]
  if (!pw) {
    return c.json(fail(ErrorCode.NOT_INITIALIZED, '尚未初始化'), HttpStatusCodes.BAD_REQUEST)
  }

  const { password } = await c.req.json<{ password: string }>()
  const valid = await verifyPassword(password, pw.hash)
  if (!valid) {
    return c.json(fail(ErrorCode.INVALID_PASSWORD, '密码错误'), HttpStatusCodes.BAD_REQUEST)
  }

  const token = await createSession(c)
  setCookie(c, token)

  return c.json(ok({}, '登录成功'), HttpStatusCodes.OK)
}

export async function recover(c: Context) {
  const { recoveryKey } = await c.req.json<{ recoveryKey: string }>()

  const rk = db.select().from(recoveryKeys).limit(1).all()[0]
  if (!rk) {
    return c.json(fail(ErrorCode.NO_VALID_RECOVERY_KEY, '无有效恢复密钥'), HttpStatusCodes.BAD_REQUEST)
  }

  const valid = await verifyPassword(recoveryKey, rk.hash)
  if (!valid) {
    return c.json(fail(ErrorCode.INVALID_RECOVERY_KEY, '恢复密钥错误'), HttpStatusCodes.BAD_REQUEST)
  }

  db.delete(passwords).run()
  db.delete(recoveryKeys).run()

  const keys = await redis.keys(`${SESSION_ADMIN_PREFIX}*`)
  if (keys.length > 0) {
    await redis.del(keys)
  }

  return c.json(ok({}, '恢复成功'), HttpStatusCodes.OK)
}
