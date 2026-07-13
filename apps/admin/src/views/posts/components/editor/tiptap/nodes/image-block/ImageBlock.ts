import { Node, VueNodeViewRenderer, mergeAttributes } from '@tiptap/vue-3'
import ImageBlockView from './ImageBlockView.vue'
import type { ImageBlockAttrs } from './types'

function parseNumber(value: string | null) {
  if (!value) return null
  const parsed = Number(value)
  return Number.isFinite(parsed) ? parsed : null
}

export const ImageBlock = Node.create({
  name: 'imageBlock',

  group: 'block',

  atom: true,

  draggable: true,

  selectable: true,

  isolating: true,

  addAttributes() {
    return {
      mediaId: {
        default: null,
        parseHTML: element => parseNumber(element.getAttribute('data-media-id'))
      },
      url: {
        default: '',
        parseHTML: element => element.getAttribute('data-url') || element.querySelector('img')?.getAttribute('src') || ''
      },
      thumbnailUrl: {
        default: null,
        parseHTML: element => element.getAttribute('data-thumbnail-url')
      },
      previewUrl: {
        default: null,
        parseHTML: element => element.getAttribute('data-preview-url')
      },
      placeholder: {
        default: null,
        parseHTML: element => element.getAttribute('data-placeholder')
      },
      intrinsicWidth: {
        default: null,
        parseHTML: element => parseNumber(element.getAttribute('data-intrinsic-width'))
      },
      intrinsicHeight: {
        default: null,
        parseHTML: element => parseNumber(element.getAttribute('data-intrinsic-height'))
      },
      displayWidth: {
        default: null,
        parseHTML: element => parseNumber(element.getAttribute('data-display-width'))
      },
      align: {
        default: 'center',
        parseHTML: element => element.getAttribute('data-align') || 'center'
      },
      alt: {
        default: '',
        parseHTML: element => element.querySelector('img')?.getAttribute('alt') || ''
      },
      caption: {
        default: '',
        parseHTML: element => element.querySelector('figcaption')?.textContent || ''
      }
    }
  },

  parseHTML() {
    return [{ tag: 'figure[data-type="image-block"]' }]
  },

  renderHTML({ HTMLAttributes }) {
    const attrs = {
      'data-type': 'image-block',
      'data-media-id': HTMLAttributes.mediaId,
      'data-url': HTMLAttributes.url,
      'data-thumbnail-url': HTMLAttributes.thumbnailUrl,
      'data-preview-url': HTMLAttributes.previewUrl,
      'data-placeholder': HTMLAttributes.placeholder,
      'data-intrinsic-width': HTMLAttributes.intrinsicWidth,
      'data-intrinsic-height': HTMLAttributes.intrinsicHeight,
      'data-display-width': HTMLAttributes.displayWidth,
      'data-align': HTMLAttributes.align,
    }

    return [
      'figure',
      mergeAttributes(attrs),
      ['img', { src: HTMLAttributes.previewUrl || HTMLAttributes.thumbnailUrl || HTMLAttributes.url, alt: HTMLAttributes.alt || '' }],
      HTMLAttributes.caption ? ['figcaption', {}, HTMLAttributes.caption] : ['figcaption', {}, '']
    ]
  },

  addCommands() {
    return ({
      setImageBlock:
        (attrs: Partial<ImageBlockAttrs> & { url: string }) =>
        ({ commands }: any) =>
          commands.insertContent({
            type: this.name,
            attrs
          })
    } as any)
  },

  addNodeView() {
    return VueNodeViewRenderer(ImageBlockView)
  }
})

export default ImageBlock
