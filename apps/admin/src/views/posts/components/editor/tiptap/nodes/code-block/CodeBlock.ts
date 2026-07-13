import { Node, VueNodeViewRenderer, mergeAttributes } from '@tiptap/vue-3'
import CodeBlockView from './CodeBlockView.vue'

export const CodeBlock = Node.create({
  name: 'codeBlock',

  group: 'block',

  content: 'text*',

  marks: '',

  code: true,

  defining: true,

  addAttributes() {
    return {
      language: {
        default: 'text',
        parseHTML: element => element.querySelector('code')?.getAttribute('data-language') || 'text',
        renderHTML: attributes => ({
          'data-language': attributes.language || 'text',
          class: attributes.language ? `language-${attributes.language}` : null
        })
      }
    }
  },

  parseHTML() {
    return [{ tag: 'pre' }]
  },

  renderHTML({ node, HTMLAttributes }) {
    return [
      'pre',
      mergeAttributes({ 'data-type': 'code-block' }),
      ['code', mergeAttributes(HTMLAttributes, { 'data-language': node.attrs.language || 'text' }), 0]
    ]
  },

  addCommands() {
    return ({
      setCodeBlock:
        (attrs?: { language?: string }) =>
        ({ commands }: any) =>
          commands.setNode(this.name, attrs),
      toggleCodeBlock:
        (attrs?: { language?: string }) =>
        ({ editor, commands }: any) =>
          editor.isActive(this.name) ? commands.setParagraph() : commands.setNode(this.name, attrs)
    } as any)
  },

  addKeyboardShortcuts() {
    return {
      'Mod-Alt-c': () => this.editor.commands.toggleCodeBlock()
    }
  },

  addNodeView() {
    return VueNodeViewRenderer(CodeBlockView)
  }
})

export default CodeBlock
