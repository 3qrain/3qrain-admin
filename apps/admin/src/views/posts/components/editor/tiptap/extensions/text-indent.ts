import { Extension } from '@tiptap/vue-3'

export const TextIndent = Extension.create({
  name: 'textIndent',

  addGlobalAttributes() {
    return [
      {
        types: ['paragraph'],
        attributes: {
          textIndent: {
            default: 0,
            parseHTML: element => {
              const level = Number.parseInt(element.getAttribute('data-text-indent') || '0', 10)
              return Number.isFinite(level) ? Math.max(0, level) : 0
            },
            renderHTML: attributes => {
              const level = Number(attributes.textIndent) || 0
              if (level <= 0) return {}

              return {
                'data-text-indent': String(level),
                style: `text-indent: ${level * 2}em`
              }
            }
          }
        }
      }
    ]
  },

  addKeyboardShortcuts() {
    const changeIndent = (offset: number) => {
      const { $from, $to } = this.editor.state.selection
      const isTopLevelParagraph = $from.depth === 1
        && $to.depth === 1
        && $from.parent.type.name === 'paragraph'
        && $to.parent.type.name === 'paragraph'

      if (!isTopLevelParagraph) return false

      const currentLevel = Number(this.editor.getAttributes('paragraph').textIndent) || 0
      const nextLevel = Math.max(0, currentLevel + offset)
      if (nextLevel === currentLevel) return true

      return this.editor
        .chain()
        .focus()
        .updateAttributes('paragraph', { textIndent: nextLevel })
        .run()
    }

    const handleTab = (offset: number) => {
      if (this.editor.isActive('codeBlock')) return false

      if (this.editor.isActive('listItem')) {
        if (offset > 0) {
          this.editor.commands.sinkListItem('listItem')
        } else {
          this.editor.commands.liftListItem('listItem')
        }
        return true
      }

      changeIndent(offset)
      return true
    }

    return {
      Tab: () => handleTab(1),
      'Shift-Tab': () => handleTab(-1)
    }
  }
})

export default TextIndent
