import { emailLayout } from '../layout'

export interface NewCommentData {
  siteName: string
  siteUrl: string
  adminUrl: string
  postTitle: string
  commenterName: string
  commentContent: string
}

export function renderNewCommentEmail(data: NewCommentData): string {
  return emailLayout({
    siteName: data.siteName,
    siteUrl: data.siteUrl,
    body: `
      <p style="margin:0 0 10px;color:#555"><strong>${data.commenterName}</strong> 评论了 <strong>「${data.postTitle}」</strong></p>
      <div style="background:#f8f9fa;border-left:4px solid #4a90e2;padding:15px;margin:15px 0;border-radius:4px">
        <p style="margin:0;color:#333;line-height:1.6">${data.commentContent}</p>
      </div>
      <a href="${data.adminUrl}/notifications" style="display:inline-block;background:#4a90e2;color:#fff;padding:12px 28px;text-decoration:none;border-radius:6px;margin:20px 0 10px;font-weight:500" target="_blank">后台管理</a>`,
  })
}
