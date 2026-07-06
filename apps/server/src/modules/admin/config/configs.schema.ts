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
export const configSchemaMapping = {
  siteInfo: SiteInfoSchema,
  appearance: AppearanceSchema,
} as const

export type ConfigKey = keyof typeof configSchemaMapping

// ==================== Full Config ====================
export const FullConfigSchema = z.object({
  ...configSchemaMapping,
  emailEnabled: z.boolean(),
})
export type FullConfig = z.infer<typeof FullConfigSchema>
