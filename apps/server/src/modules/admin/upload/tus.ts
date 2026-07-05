import type { Context } from 'hono'
import { Server } from '@tus/server'
import { FileStore } from '@tus/file-store'
import { Upload } from '@tus/server'
import sharp from 'sharp'
import { mkdir, rename } from 'node:fs/promises'
import path from 'node:path'
import crypto from 'node:crypto'
import { db } from '~/db'
import { media } from '~/db/schema'
import { expireTime_tus } from '@3qrain/shared'
import dayjs from 'dayjs'

const tusServer = new Server({
  path: '/api/admin/upload',
  // tus上传产生的切片等文件单独放tus，上传完成放uploads(对外开发文件夹)
  // 设置过期时间 24小时
  datastore: new FileStore({ directory: './data/tus', expirationPeriodInMilliseconds: expireTime_tus }),

  // 返回相对路径 Location（如 /api/admin/upload/:id）
  // 避免 Tus 返回绝对地址 （如 http://localhost:3000/api/admin/upload/:id）
  // 导致后续 PATCH/HEAD 请求绕过前端代理，从而产生跨域问题并丢失 Cookie
  relativeLocation: true,
  onUploadFinish: async (req, upload: Upload) => {
    // Upload {
    //   id: "e0cdf7cfa87a99ae1f094eca53679acd",
    //   metadata: {
    //     relativePath: "null",
    //     name: "wallhaven-3ld92d.jpg",
    //     type: "image/jpeg",
    //     filetype: "image/jpeg",
    //     filename: "wallhaven-3ld92d.jpg",
    //   },
    //   size: 2733519,
    //   offset: 2733519,
    //   creation_date: "2026-06-12T15:20:51.867Z",
    //   storage: {
    //     type: "file",
    //     path: "./data/tus/e0cdf7cfa87a99ae1f094eca53679acd",
    //   },
    //   sizeIsDeferred: [Getter],
    // }

    try {
      if (!upload.metadata) {
        throw new Error('Missing upload metadata')
      }
      if (!upload.storage) {
        throw new Error('Missing upload storage')
      }

      const mimeType = upload.metadata.filetype || ''
      const originalName = upload.metadata.filename || ''
      const size = upload.size || 0
      const tmpPath = upload.storage.path

      // 2026-06-12：3qrain 文件上传功能完成
      const MEDIA_ID_EPOCH = Date.UTC(2026, 5, 12)
      const id = (Date.now() - MEDIA_ID_EPOCH).toString(36) + crypto.randomBytes(2).toString('hex')

      const now = new Date()
      const year = now.getFullYear()
      const month = String(now.getMonth() + 1).padStart(2, '0')

      const root_dir = './data/uploads'
      const dir = `${root_dir}/${year}/${month}`
      try {
        await mkdir(dir, { recursive: true })
      } catch (e) {
        throw new Error('Failed to create directory')
      }

      const ext = path.extname(originalName)
      const originalPath = `${dir}/${id}-original${ext}`

      let width: number | null = null
      let height: number | null = null
      let thumbnailPath: string | null = null
      let previewPath: string | null = null
      let placeholder: string | null = null

      let type: 'image' | 'svg' | 'video' | 'audio' | 'file' = 'file'

      //Bun.Image 能处理 JPEG, PNG, WebP, GIF, BMP, TIFF, HEIC or AVIF，要筛选Image子类型，避免出现svg等
      const bunImageList = [
        'image/jpeg',
        'image/png',
        'image/webp',
        'image/gif',
        // 'image/bmp',
        // 'image/tiff',
        // 'image/heic', 
        // 'image/avif'  需要编码器
      ]
      // image 图片
      if (mimeType.startsWith('image/') && bunImageList.includes(mimeType)) {
        type = 'image'
        const meta = await sharp(tmpPath).metadata()
        width = meta.width
        height = meta.height
        const isGif = meta.format === 'gif'

        thumbnailPath = `${dir}/${id}-thumbnail.webp`
        previewPath = `${dir}/${id}-preview.webp`

        // 缩略图，如果是gif的话，压狠一点
        let thumbSize = isGif ? 320 : 512
        let thumbQuality = isGif ?  50 : 75
        await sharp(tmpPath, { animated: true })
          .resize(thumbSize, thumbSize, {
            fit: 'inside',
            withoutEnlargement: true
          })
          .webp({ quality: thumbQuality })
          .toFile(thumbnailPath)

        await sharp(tmpPath, { animated: true })
          .resize(1280, 1280, {
            fit: 'inside',
            withoutEnlargement: true
          })
          .webp({ quality: 80 })
          .toFile(previewPath)

        placeholder = await new Bun.Image(tmpPath).placeholder()
      }

      // svg 图片
      else if (mimeType === 'image/svg+xml') {
        type = 'svg'
      }

      // video 视频
      else if (mimeType.startsWith('video/')) {
        type = 'video'
      }

      // audio 音频
      else if (mimeType.startsWith('audio/')) {
        type = 'audio'
      }

      // 其它
      else {
        type = 'file'
      }

      try {
        await rename(tmpPath, originalPath)
      } catch (e) {
        throw new Error('Failed to rename file')
      }

      try {
        // 清除tus的json文件
        await Bun.file(`${tmpPath}.json`).delete()
      } catch {
        throw new Error('Failed to delete tus json file')
      }

      const record = db
        .insert(media)
        .values({
          mimeType,
          type,
          size,
          ext,
          originalPath: originalPath.replace(root_dir, ''),
          thumbnailPath: thumbnailPath?.replace(root_dir, ''),
          previewPath: previewPath?.replace(root_dir, ''),
          placeholder,
          width,
          height,
          filename: originalName
        })
        .returning()
        .get()

      return {
        headers: {
          'X-Media-Record': JSON.stringify({
            id: record.id,
            url: `/storage${record.originalPath}`,
            thumbnailUrl: record.thumbnailPath ? `/storage${record.thumbnailPath}` : null,
            width: record.width,
            height: record.height
          })
        }
      }
    } catch (e) {
      const time = dayjs().format('YY-MM-DD HH:mm:ss')
      console.error(`${time} [upload] 文件上传失败`, e)
      return {}
    }
  }
})

export function cron_cleanUpExpiredUploads() {
  // 每3个整点执行一次，最大残留时间是3小时
  Bun.cron('0 */3 * * *', async () => {
    const time = dayjs().format('YY-MM-DD HH:mm:ss')
    try {
      await tusServer.cleanUpExpiredUploads()
      console.log(time + ' [tus] cleanup done')
    } catch (e) {
      console.error(time + ' [tus] cleanup error', e)
    }
  })
}

export async function tusHandler(c: Context) {
  // console.log(c.req.method, c.req.path)
  return tusServer.handleWeb(c.req.raw)
}
