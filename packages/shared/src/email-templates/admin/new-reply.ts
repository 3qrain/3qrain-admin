import { emailLayout } from '../layout'

export interface NewReplyData {
  siteName: string
  postTitle: string
  postSlug: string
  replierName: string
  replyContent: string
  repliedTo: string
  time: string
}

export function renderNewReplyEmail(data: NewReplyData): string {
  return emailLayout({
    siteName: data.siteName,
    heading: `《${data.postTitle}》有新回复`,
    subheading: `${data.replierName} 回复了 ${data.repliedTo} · ${data.time}`,
    body: `
      <table width="100%" cellpadding="0" cellspacing="0">
        <tr><td style="font-size:.8125rem;color:#71717a;padding-bottom:.375rem">回复内容</td></tr>
        <tr><td style="font-size:.875rem;color:#3f3f46;line-height:1.6;padding:.75rem;background:#fafafa;border-radius:.5rem">${data.replyContent}</td></tr>
      </table>`,
    cta: { label: '查看评论', url: `/admin/comments` },
  })
}
