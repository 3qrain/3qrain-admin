import { emailLayout } from '../layout'

export interface ReplyData {
  siteName: string
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
    heading: '有人回复了你的评论',
    subheading: `${data.replierName} 在《${data.postTitle}》中回复了你`,
    body: `
      <table width="100%" cellpadding="0" cellspacing="0" style="margin-bottom:1rem">
        <tr><td style="font-size:.75rem;color:#a1a1aa;padding-bottom:.25rem">你的评论</td></tr>
        <tr><td style="font-size:.8125rem;color:#71717a;line-height:1.5;padding:.5rem .75rem;background:#fafafa;border-radius:.5rem;border-left:2px solid #e4e4e7">${data.yourComment}</td></tr>
      </table>
      <table width="100%" cellpadding="0" cellspacing="0">
        <tr><td style="font-size:.75rem;color:#a1a1aa;padding-bottom:.25rem">${data.replierName} 的回复</td></tr>
        <tr><td style="font-size:.875rem;color:#18181b;line-height:1.6;padding:.5rem .75rem;background:#f4f4f5;border-radius:.5rem">${data.replyContent}</td></tr>
      </table>`,
    cta: { label: '查看完整讨论', url: `/posts/${data.postSlug}` },
    footer: '',
  })
}
