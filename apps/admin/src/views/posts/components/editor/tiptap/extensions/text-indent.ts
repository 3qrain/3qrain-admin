import { Extension } from '@tiptap/vue-3'

export const TextIndent = Extension.create({
  name: 'textIndent',

  addGlobalAttributes() {
    return [
      {
        types: ['paragraph'],
        attributes: {
          textIndent: {
            default: false,
            parseHTML: element => element.getAttribute('data-text-indent') === 'true',
            renderHTML: attributes => {
              if (!attributes.textIndent) return {}

              return {
                'data-text-indent': 'true',
                style: 'text-indent: 2em'
              }
            }
          }
        }
      }
    ]
  },

  addKeyboardShortcuts() {
    return {
      Tab: () => {
        if (!this.editor.isActive('paragraph')) return false
        return this.editor.chain().focus().updateAttributes('paragraph', { textIndent: true }).run()
      },

      'Shift-Tab': () => {
        if (!this.editor.isActive('paragraph')) return false
        return this.editor.chain().focus().updateAttributes('paragraph', { textIndent: false }).run()
      }
    }
  }
})

export default TextIndent
