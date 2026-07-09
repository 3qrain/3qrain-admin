import { emailLayout } from '../layout'

export interface FriendApplyResultData {
  siteName: string
  siteUrl: string
  applicantName: string
  approved: boolean
  reason?: string
}

export function renderFriendApplyResultEmail(data: FriendApplyResultData): string {
  const heading = data.approved ? '友链申请已通过' : '友链申请未通过'
  const subheading = data.approved
    ? `你在 ${data.siteName} 申请的友链已通过审核`
    : `你在 ${data.siteName} 申请的友链未通过审核`

  return emailLayout({
    siteName: data.siteName,
    siteUrl: data.siteUrl,
    body: `
      <p style="margin:0 0 10px;color:#555">Hi，<strong>${data.applicantName}</strong>：</p>
      <p style="margin:0 0 15px;color:#555">${subheading}</p>
      ${!data.approved && data.reason ? `
      <div style="background:#f8f9fa;border-left:4px solid #ef4444;padding:15px;margin:15px 0;border-radius:4px">
        <p style="margin:0;color:#666;font-size:14px">原因：${data.reason}</p>
      </div>` : ''}
      <a href="${data.siteUrl}" style="display:inline-block;background:#4a90e2;color:#fff;padding:12px 28px;text-decoration:none;border-radius:6px;margin:20px 0 10px;font-weight:500" target="_blank">访问站点</a>`,
  })
}
