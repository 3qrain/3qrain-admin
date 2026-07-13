import { Node, VueNodeViewRenderer, mergeAttributes } from '@tiptap/vue-3'
import ImageBlockView from './ImageBlockView.vue'
import type { ImageBlockAttrs } from './types'

export const ImageBlock = Node.create({
  name: 'imageBlock',

  group: 'block',

  atom: true,

  draggable: true,

  selectable: true,

  isolating: true,

  addAttributes() {
    return {
      mediaId: { default: null },
      src: { default: '' },
      thumbnailUrl: { default: null },
      previewUrl: { default: null },
      placeholder: { default: null },
      intrinsicWidth: { default: null },
      intrinsicHeight: { default: null },
      displayWidth: { default: null },
      align: { default: 'center' },
      alt: { default: '' },
      caption: { default: '' }
    }
  },

  parseHTML() {
    return [{ tag: 'figure[data-type="image-block"]' }]
  },

  renderHTML({ HTMLAttributes }) {
    const attrs = {
      'data-type': 'image-block',
      'data-media-id': HTMLAttributes.mediaId,
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
      ['img', { src: HTMLAttributes.src, alt: HTMLAttributes.alt || '' }],
      HTMLAttributes.caption ? ['figcaption', {}, HTMLAttributes.caption] : ['figcaption', {}, '']
    ]
  },

  addCommands() {
    return ({
      setImageBlock:
        (attrs: Partial<ImageBlockAttrs> & { src: string }) =>
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
