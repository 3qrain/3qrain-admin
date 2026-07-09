import { emailLayout } from '../layout'

export interface FriendApplyResultData {
  siteName: string
  siteUrl: string
  applicantName: string
  approved: boolean
  reason?: string
}

export function renderFriendApplyResultEmail(data: FriendApplyResultData): string {
  const subheading = data.approved
    ? `您的友链申请已通过审核`
    : `您的友链申请未通过审核`

  return emailLayout({
    siteName: data.siteName,
    siteUrl: data.siteUrl,
    href: `${data.siteUrl}`,
    buttonLabel: '访问站点',
    body: `
      <p style="margin:0 0 10px;color:#555">Hi，<strong>${data.applicantName}</strong>：</p>
      <p style="margin:0 0 15px;color:#555">${subheading}</p>
      ${!data.approved && data.reason ? `
      <div style="background:#f8f9fa;border-left:4px solid #ef4444;padding:15px;margin:15px 0;border-radius:3px;">
        <p style="margin:0;color:#666;font-size:14px">原因：${data.reason}</p>
      </div>` : ''}
    `
  })
}
