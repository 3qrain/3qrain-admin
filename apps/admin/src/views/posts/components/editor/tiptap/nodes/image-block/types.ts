import type { MediaItem } from '~/api/media'

export type ImageBlockAlign = 'left' | 'center' | 'right' | 'full'

export interface ImageBlockAttrs {
  mediaId: number | null
  url: string
  thumbnailUrl: string | null
  previewUrl: string | null
  placeholder: string | null
  intrinsicWidth: number | null
  intrinsicHeight: number | null
  displayWidth: number | null
  align: ImageBlockAlign
  alt: string
  caption: string
}

export function mediaToImageBlockAttrs(media: MediaItem): ImageBlockAttrs {
  return {
    mediaId: media.id,
    url: media.url,
    thumbnailUrl: media.thumbnailUrl,
    previewUrl: media.previewUrl,
    placeholder: media.placeholder,
    intrinsicWidth: media.width,
    intrinsicHeight: media.height,
    displayWidth: media.width ? Math.min(media.width, 720) : null,
    align: 'center',
    alt: media.filename,
    caption: ''
  }
}
