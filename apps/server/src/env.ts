import { z } from 'zod'

// 1. 定义环境变量的 Schema
const envSchema = z.object({
  // Redis 连接地址，必须是合法的 URL
  REDIS_URL: z.url('❌ REDIS_URL 必须是有效的 Redis 连接地址'),

  // Token 过期时间，自动将字符串 '86400' 转换为数字，且必须是正整数
  TOKEN_TTL: z.coerce.number().int().positive('❌ TOKEN_TTL 必须是一个正整数'),

  ALLOWED_ORIGINS: z
    .string()
    .transform(val => val.split(','))
    .pipe(z.array(z.url({ message: '❌ ALLOWED_ORIGINS 中包含非法的 URL 格式' }))),

  // GitHub OAuth 配置
  GITHUB_ID: z.string().min(1, '❌ GITHUB_ID 不能为空'),
  GITHUB_SECRET: z.string().min(1, '❌ GITHUB_SECRET 不能为空'),

	GOOGLE_ID: z.string().min(1, '❌ GOOGLE_ID 不能为空'),
	GOOGLE_SECRET: z.string().min(1, '❌ GOOGLE_SECRET 不能为空'),

  // 网站跳转地址
  WEB_URL: z.url('❌ WEB_URL 必须是合法的网站地址'),
  // 后台地址
  ADMIN_URL: z.url('❌ ADMIN_URL 必须是合法的网站地址')
  // 上传地址
})

// 2. 解析并导出配置
// 如果校验失败，parse 会直接抛出带有详细原因的 Error，导致服务启动失败（Fail Fast）
export const config = envSchema.parse(process.env)

// 3. 导出 TypeScript 类型（方便在代码其他文件中使用）
export type EnvConfig = z.infer<typeof envSchema>
