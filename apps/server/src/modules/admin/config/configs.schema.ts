import { z } from '@hono/zod-openapi'

// ==================== SiteInfo ====================
export const SiteInfoSchema = z.object({
  bio: z.string(),
})
export type SiteInfo = z.infer<typeof SiteInfoSchema>

// ==================== Appearance ====================
export const AppearanceSchema = z.object({
  theme: z.enum(['system', 'light', 'dark']),
})
export type Appearance = z.infer<typeof AppearanceSchema>

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
} as const

export type ConfigKey = keyof typeof configSchemaMapping

// ==================== Full Config ====================
export const FullConfigSchema = z.object(configSchemaMapping)
export type FullConfig = z.infer<typeof FullConfigSchema>
