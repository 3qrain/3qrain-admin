import { emailLayout } from '../layout'

export interface FriendApplyData {
  siteName: string
  applicantName: string
  siteUrl: string
  description?: string
  time: string
}

export function renderFriendApplyEmail(data: FriendApplyData): string {
  return emailLayout({
    siteName: data.siteName,
    heading: '收到新的友链申请',
    subheading: `${data.applicantName} · ${data.time}`,
    body: `
      <table width="100%" cellpadding="0" cellspacing="0" style="margin-bottom:.75rem">
        <tr><td style="font-size:.8125rem;color:#71717a;padding-bottom:.25rem">申请人</td></tr>
        <tr><td style="font-size:.875rem;color:#18181b">${data.applicantName}</td></tr>
      </table>
      <table width="100%" cellpadding="0" cellspacing="0" style="margin-bottom:.75rem">
        <tr><td style="font-size:.8125rem;color:#71717a;padding-bottom:.25rem">网站</td></tr>
        <tr><td style="font-size:.875rem;color:#18181b"><a href="${data.siteUrl}" style="color:#18181b">${data.siteUrl}</a></td></tr>
      </table>
      ${data.description ? `
      <table width="100%" cellpadding="0" cellspacing="0">
        <tr><td style="font-size:.8125rem;color:#71717a;padding-bottom:.25rem">简介</td></tr>
        <tr><td style="font-size:.875rem;color:#3f3f46;line-height:1.5">${data.description}</td></tr>
      </table>` : ''}`,
    cta: { label: '处理申请', url: '/admin/notifications' },
  })
}
