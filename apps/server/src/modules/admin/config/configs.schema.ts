import { z } from '@hono/zod-openapi'

// ==================== SiteInfo ====================
export const SiteInfoSchema = z.object({
  bio: z.string().trim().max(500, '简介不能超过 500 个字符'),
  motto: z.string().trim().max(100, '签名不能超过 100 个字符'),
  copyright: z.string().trim().max(100, '版权信息不能超过 100 个字符'),
  filingNumber: z.string().trim().max(100, '备案号不能超过 100 个字符'),
  filingUrl: z.union([
    z.literal(''),
    z.url('备案链接格式有误'),
  ]),
})
export type SiteInfo = z.infer<typeof SiteInfoSchema>

// ==================== Appearance ====================
export const AppearanceSchema = z.object({
  theme: z.enum(['system', 'light', 'dark']),
})
export type Appearance = z.infer<typeof AppearanceSchema>

// ==================== Features ====================
export const CommentsConfigSchema = z.object({
  enabled: z.boolean(),
  reviewEnabled: z.boolean(),
})
export type CommentsConfig = z.infer<typeof CommentsConfigSchema>

export const FriendLinksConfigSchema = z.object({
  applicationEnabled: z.boolean(),
})
export type FriendLinksConfig = z.infer<typeof FriendLinksConfigSchema>

// ==================== Schema Mapping ====================
export const EmailSchema = z.object({
  enabled: z.boolean(),
  host: z.string(),
  port: z.number(),
  user: z.string(),
  pass: z.string(),
})

export const configSchemaMapping = {
  siteInfo: SiteInfoSchema,
  appearance: AppearanceSchema,
  email: EmailSchema,
  comments: CommentsConfigSchema,
  friendLinks: FriendLinksConfigSchema,
} as const

export type ConfigKey = keyof typeof configSchemaMapping

// ==================== Full Config ====================
export const FullConfigSchema = z.object(configSchemaMapping)
export type FullConfig = z.infer<typeof FullConfigSchema>
