import nodemailer from 'nodemailer'
import { db } from '~/db'
import { configs } from '~/db/schema'
import { eq } from 'drizzle-orm'

export interface EmailConfig {
  enabled: boolean
  host: string
  port: number
  user: string
  pass: string
}

const CONFIG_KEYS = {
  enabled: 'email_enabled',
  host: 'email_host',
  port: 'email_port',
  user: 'email_user',
  pass: 'email_pass',
} as const

function getConfigValue(key: string): string | null {
  const row = db.select({ value: configs.value }).from(configs).where(eq(configs.key, key)).get()
  return row?.value ?? null
}

function setConfigValue(key: string, value: string) {
  const existing = db.select({ id: configs.id }).from(configs).where(eq(configs.key, key)).get()
  if (existing) {
    db.update(configs).set({ value }).where(eq(configs.key, key)).run()
  } else {
    db.insert(configs).values({ key, value }).run()
  }
}

export function getEmailConfig(): EmailConfig {
  return {
    enabled: getConfigValue(CONFIG_KEYS.enabled) === 'true',
    host: getConfigValue(CONFIG_KEYS.host) || '',
    port: Number(getConfigValue(CONFIG_KEYS.port)) || 465,
    user: getConfigValue(CONFIG_KEYS.user) || '',
    pass: getConfigValue(CONFIG_KEYS.pass) || '',
  }
}

export function saveEmailConfig(config: EmailConfig) {
  setConfigValue(CONFIG_KEYS.enabled, String(config.enabled))
  setConfigValue(CONFIG_KEYS.host, config.host)
  setConfigValue(CONFIG_KEYS.port, String(config.port))
  setConfigValue(CONFIG_KEYS.user, config.user)
  if (config.pass) setConfigValue(CONFIG_KEYS.pass, config.pass)
}

function createTransport(config: EmailConfig) {
  return nodemailer.createTransport({
    host: config.host,
    port: config.port,
    secure: config.port === 465,
    auth: { user: config.user, pass: config.pass },
  })
}

export async function testEmailConnection(config: EmailConfig): Promise<{ ok: boolean; error?: string }> {
  try {
    const transport = createTransport(config)
    const result = await transport.verify()
    transport.close()
    return { ok: result as boolean }
  } catch (e: any) {
    return { ok: false, error: e.message }
  }
}

export async function sendTestEmail(config: EmailConfig, to: string, siteName: string): Promise<{ ok: boolean; error?: string }> {
  try {
    const transport = createTransport(config)
    await transport.sendMail({
      from: config.user,
      to,
      subject: `[${siteName}] 邮件连通性测试`,
      text: '如果你收到这封邮件，说明 SMTP 配置正确，邮件服务可以正常使用。',
    })
    transport.close()
    return { ok: true }
  } catch (e: any) {
    return { ok: false, error: e.message }
  }
}
