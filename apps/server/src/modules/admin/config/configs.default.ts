import { count } from 'drizzle-orm'
import { db } from '~/db'
import { configs } from '~/db/schema'
import { DEFAULT_SITE_INFO } from '~/constants/site-info'
import type { FullConfig } from './configs.schema'

export const getDefaultConfig = (): FullConfig => ({
  siteInfo: { ...DEFAULT_SITE_INFO },
  appearance: {
    theme: 'system',
  },
  email: {
    enabled: false,
    host: '',
    port: 465,
    user: '',
    pass: '',
  }
})

export async function initConfigs() {
  const result = db.select({ count: count() }).from(configs).get()
  if (result!.count > 0) return

  const defaults = getDefaultConfig()
  for (const [key, value] of Object.entries(defaults)) {
    db.insert(configs).values({ key, value: JSON.stringify(value) }).run()
  }
}
