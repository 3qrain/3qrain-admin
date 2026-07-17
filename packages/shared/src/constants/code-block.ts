export const CODE_BLOCK_LANGUAGES = [
  { label: 'Text', value: 'text' },
  { label: 'TypeScript', value: 'ts' },
  { label: 'JavaScript', value: 'js' },
  { label: 'Vue', value: 'vue' },
  { label: 'CSS', value: 'css' },
  { label: 'HTML', value: 'html' },
  { label: 'JSON', value: 'json' },
  { label: 'Bash', value: 'bash' },
  { label: 'SQL', value: 'sql' },
] as const

export type CodeBlockLanguage = typeof CODE_BLOCK_LANGUAGES[number]['value']

export function isCodeBlockLanguage(value: unknown): value is CodeBlockLanguage {
  return typeof value === 'string'
    && CODE_BLOCK_LANGUAGES.some(language => language.value === value)
}
