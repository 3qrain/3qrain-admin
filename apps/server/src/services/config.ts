import { eq } from 'drizzle-orm'
import { db } from '~/db'
import { configs } from '~/db/schema'
import { getDefaultConfig } from '~/modules/admin/config/configs.default'
import type { ConfigKey, FullConfig } from '~/modules/admin/config/configs.schema'

// 公开接口会频繁读取功能配置，短时缓存可避免每次请求都查询 SQLite。
const CACHE_TTL = 60_000
const cache = new Map<ConfigKey, { value: FullConfig[ConfigKey]; expiresAt: number }>()

export function mergeConfigDefault<K extends ConfigKey>(key: K, value: unknown): FullConfig[K] {
  const defaultValue = getDefaultConfig()[key]
  if (
    defaultValue && typeof defaultValue === 'object' && !Array.isArray(defaultValue)
    && value && typeof value === 'object' && !Array.isArray(value)
  ) {
    return { ...defaultValue, ...value } as FullConfig[K]
  }
  return (value ?? defaultValue) as FullConfig[K]
}

export function getConfigValue<K extends ConfigKey>(key: K): FullConfig[K] {
  const cached = cache.get(key)
  if (cached && cached.expiresAt > Date.now()) return cached.value as FullConfig[K]

  const row = db.select({ value: configs.value }).from(configs).where(eq(configs.key, key)).get()
  let value: unknown
  if (row) {
    try { value = JSON.parse(row.value) } catch { /* use default */ }
  }

  // 配置不存在或字段不完整时补齐默认值，兼容已有数据库。
  const merged = mergeConfigDefault(key, value)
  cache.set(key, { value: merged, expiresAt: Date.now() + CACHE_TTL })
  return merged
}

export function invalidateConfig(key: ConfigKey) {
  // 后台保存后立即清除，确保功能开关无需等待缓存过期即可生效。
  cache.delete(key)
}
