import { emailLayout } from '../layout'

export interface NewCommentData {
  siteName: string
  postTitle: string
  postSlug: string
  commenterName: string
  commenterEmail: string
  commentContent: string
  time: string
}

export function renderNewCommentEmail(data: NewCommentData): string {
  return emailLayout({
    siteName: data.siteName,
    heading: `《${data.postTitle}》有新评论`,
    subheading: `评论人 ${data.commenterName} · ${data.time}`,
    body: `
      <table width="100%" cellpadding="0" cellspacing="0" style="margin-bottom:.75rem">
        <tr><td style="font-size:.8125rem;color:#71717a;padding-bottom:.375rem">评论人</td></tr>
        <tr><td style="font-size:.875rem;color:#18181b">${data.commenterName}${data.commenterEmail ? ` &lt;${data.commenterEmail}&gt;` : ''}</td></tr>
      </table>
      <table width="100%" cellpadding="0" cellspacing="0">
        <tr><td style="font-size:.8125rem;color:#71717a;padding-bottom:.375rem">评论内容</td></tr>
        <tr><td style="font-size:.875rem;color:#3f3f46;line-height:1.6;padding:.75rem;background:#fafafa;border-radius:.5rem">${data.commentContent}</td></tr>
      </table>`,
    cta: data.postSlug
      ? { label: '进入后台处理', url: `/admin/comments` }
      : undefined,
  })
}
