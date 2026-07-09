import { emailLayout } from '../layout'

export interface ReplyData {
  siteName: string
  siteUrl: string
  userName: string
  replierName: string
  postTitle: string
  postSlug: string
  replyContent: string
  yourComment: string
}

export function renderReplyEmail(data: ReplyData): string {
  return emailLayout({
    siteName: data.siteName,
    siteUrl: data.siteUrl,
    href: `${data.siteUrl}/posts/${data.postSlug}`,
    buttonLabel: '查看回复',
    body: `
      <p style="margin:0 0 10px;color:#555">Hi，<strong>${data.userName}</strong>：</p>
      <p style="margin:0 0 15px;color:#555">您在 <strong>「${data.postTitle}」</strong> 的评论收到了回复：</p>
      <div style="background:#f8f9fa;border-left:4px solid #000000;padding:15px;margin:15px 0;border-radius:3px;">
        <p style="margin:0 0 5px;color:#333"><strong>${data.replierName}：</strong>${data.replyContent}</p>
      </div>
      <div style="background:#f8f9fa;border-left:4px solid #e4e4e7;padding:15px;margin:15px 0;border-radius:3px;">
        <p style="margin:0;color:#999;font-size:13px">您的评论</p>
        <p style="margin:5px 0 0;color:#666">${data.yourComment}</p>
      </div>
    `
  })
}
