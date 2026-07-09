import { emailLayout } from '../layout'

export interface FriendApplyData {
  siteName: string
  siteUrl: string
  adminUrl: string
  applicantName: string
  applicantUrl: string
  description?: string
}

export function renderFriendApplyEmail(data: FriendApplyData): string {
  return emailLayout({
    siteName: data.siteName,
    siteUrl: data.siteUrl,
    href: `${data.adminUrl}/friend-links`,
    buttonLabel: '处理申请',
    body: `
      <p style="margin:0 0 10px;color:#555"><strong>${data.applicantName}</strong> 申请友链</p>
      <p style="margin:5px 0;color:#555">网站：<a href="${data.applicantUrl}" style="color:#4a90e2">${data.applicantUrl}</a></p>
      ${data.description ? `<p style="margin:5px 0;color:#555">简介：${data.description}</p>` : ''}
    `
  })
}
