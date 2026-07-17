import {
  CODE_BLOCK_LANGUAGES,
  isCodeBlockLanguage,
  type CodeBlockLanguage,
  type TiptapDocument,
  type TiptapNode,
} from '@3qrain/shared'
import { createHighlighter } from 'shiki'

const highlighterPromise = createHighlighter({
  themes: ['github-light', 'github-dark'],
  langs: CODE_BLOCK_LANGUAGES.map(language => language.value),
})

function getNodeText(node: TiptapNode): string {
  if (node.type === 'text') return node.text || ''
  return node.content?.map(getNodeText).join('') || ''
}

function normalizeLanguage(value: unknown): CodeBlockLanguage {
  const language = typeof value === 'string' ? value.toLowerCase() : 'text'
  return isCodeBlockLanguage(language) ? language : 'text'
}

async function prepareNode(node: TiptapNode): Promise<TiptapNode> {
  const content = node.content
    ? await Promise.all(node.content.map(prepareNode))
    : undefined

  if (node.type !== 'codeBlock') {
    return content ? { ...node, content } : node
  }

  const language = normalizeLanguage(node.attrs?.language)
  const highlighter = await highlighterPromise
  const highlightedHtml = highlighter.codeToHtml(getNodeText(node), {
    lang: language,
    themes: {
      light: 'github-light',
      dark: 'github-dark',
    },
    defaultColor: false,
  })

  return {
    ...node,
    attrs: {
      ...node.attrs,
      language,
      highlightedHtml,
    },
    ...(content ? { content } : {}),
  }
}

export async function preparePostContent(document: TiptapDocument): Promise<TiptapDocument> {
  return {
    ...document,
    content: await Promise.all(document.content.map(prepareNode)),
  }
}
