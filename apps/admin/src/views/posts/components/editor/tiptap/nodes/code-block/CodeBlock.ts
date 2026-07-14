import { CodeBlockLowlight } from '@tiptap/extension-code-block-lowlight'
import { VueNodeViewRenderer, mergeAttributes } from '@tiptap/vue-3'
import { common, createLowlight } from 'lowlight'
import CodeBlockView from './CodeBlockView.vue'

const lowlight = createLowlight(common)

lowlight.registerAlias({
  xml: ['vue']
})

function parseLanguage(element: HTMLElement, prefix: string | null | undefined) {
  const code = element.querySelector('code')
  const dataLanguage = code?.getAttribute('data-language')
  if (dataLanguage) return dataLanguage

  if (!prefix) return null

  const classNames = [...(code?.classList || [])]
  return classNames
    .find(className => className.startsWith(prefix))
    ?.replace(prefix, '') || null
}

export const CodeBlock = CodeBlockLowlight.extend({
  addOptions() {
    return {
      ...this.parent?.(),
      lowlight,
      languageClassPrefix: 'language-',
      exitOnTripleEnter: true,
      exitOnArrowDown: true,
      defaultLanguage: 'text',
      enableTabIndentation: true,
      tabSize: 2,
      HTMLAttributes: {
        'data-type': 'code-block'
      }
    }
  },

  addAttributes() {
    return {
      language: {
        default: this.options.defaultLanguage,
        parseHTML: element => parseLanguage(element as HTMLElement, this.options.languageClassPrefix),
        rendered: false
      }
    }
  },

  renderHTML({ node, HTMLAttributes }) {
    const language = node.attrs.language || this.options.defaultLanguage || 'text'

    return [
      'pre',
      mergeAttributes(this.options.HTMLAttributes, HTMLAttributes),
      [
        'code',
        {
          class: language ? `${this.options.languageClassPrefix}${language}` : null,
          'data-language': language
        },
        0
      ]
    ]
  },

  addNodeView() {
    return VueNodeViewRenderer(CodeBlockView)
  }
})

export default CodeBlock
