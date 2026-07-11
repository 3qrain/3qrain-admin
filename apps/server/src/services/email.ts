import nodemailer from 'nodemailer'
import { db } from '~/db'
import { configs } from '~/db/schema'
import { eq } from 'drizzle-orm'
import { emailLayout } from '@3qrain/shared'

export interface EmailConfig {
  enabled: boolean
  host: string
  port: number
  user: string
  pass: string
}

const CONFIG_KEY = 'email'
let transporter: nodemailer.Transporter | null = null

const defaultConfig: EmailConfig = {
  enabled: false,
  host: '',
  port: 465,
  user: '',
  pass: ''
}

export function getEmailConfig(): EmailConfig {
  const row = db.select({ value: configs.value }).from(configs).where(eq(configs.key, CONFIG_KEY)).get()
  if (!row) return { ...defaultConfig }
  try {
    return { ...defaultConfig, ...JSON.parse(row.value) }
  } catch {
    return { ...defaultConfig }
  }
}

export function saveEmailConfig(config: EmailConfig) {
  const value = JSON.stringify(config)
  const existing = db.select({ id: configs.id }).from(configs).where(eq(configs.key, CONFIG_KEY)).get()
  if (existing) {
    db.update(configs).set({ value }).where(eq(configs.key, CONFIG_KEY)).run()
  } else {
    db.insert(configs).values({ key: CONFIG_KEY, value }).run()
  }
  transporter?.close()
  transporter = null
}

function getTransporter() {
  if (!transporter) {
    const config = getEmailConfig()

    transporter = nodemailer.createTransport({
      host: config.host,
      port: config.port,
      secure: config.port === 465,
      auth: { user: config.user, pass: config.pass },

      // 复用连接，避免同时发送多封邮件时，每次都要创建一个新的连接。
      // 默认连接池，连接数是5
      // 空闲连接默认10分钟后关闭
      pool: true,
      // maxConnections: 5,
      // socketTimeout: 600000

      // TCP 连接超时时间
      connectionTimeout: 10000,
      // smtp 响应欢迎信息超时时间
      greetingTimeout: 10000
    })
  }

  return transporter
}

export async function testEmailConnection(config: EmailConfig): Promise<{ ok: boolean; error?: string }> {
  try {
    const transport = getTransporter()
    const result = await transport.verify()
    return { ok: result as boolean }
  } catch (e: any) {
    return { ok: false, error: e.message }
  }
}

export async function sendEmail(options: { to: string; subject: string; html: string }): Promise<void> {
  const config = getEmailConfig()
  if (!config.enabled) throw new Error('邮件服务未启用')

  const transport = getTransporter()
  try {
    await transport.sendMail({
      from: config.user,
      to: options.to,
      subject: options.subject,
      html: options.html
    })
  } catch (e: any) {}
}

export async function sendTestEmail(
  config: EmailConfig,
  to: string,
  siteName: string
): Promise<{ ok: boolean; error?: string }> {
  const transport = getTransporter()
  try {
    await transport.sendMail({
      from: config.user,
      to,
      subject: `[${siteName}] 测试邮件`,
      // html: '<p>如果你收到这封邮件，说明 SMTP 配置正确，邮件服务可以正常使用。</p>',
      html: emailLayout({
        siteName,
        body: '<p style="color:#3f3f46;font-size:.875rem;line-height:1.6">SMTP 配置正确，邮件服务可以正常使用。</p>'
      })
    })
    return { ok: true }
  } catch (e: any) {
    return { ok: false, error: e.message }
  }
}
