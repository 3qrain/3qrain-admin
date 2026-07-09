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
    href: `${data.adminUrl}/notifications`,
    buttonLabel: '后台管理',
    body: `
      <p style="margin:0 0 10px;color:#555"><strong>${data.commenterName}</strong> 评论了 <strong>「${data.postTitle}」</strong></p>
      <div style="background:#f8f9fa;border-left:4px solid #000000;padding:15px;margin:15px 0;border-radius:3px;">
        <p style="margin:0;color:#333;line-height:1.6">${data.commentContent}</p>
      </div>
    `
  })
}
