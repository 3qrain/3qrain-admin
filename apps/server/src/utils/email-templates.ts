import type { NotificationType } from '@3qrain/shared'

interface TemplateData {
  type: NotificationType
  title: string
  content?: string
  meta?: string
  siteName: string
}

export function renderEmail(data: TemplateData): string {
  return `<!DOCTYPE html>
<html lang="zh-CN">
<head><meta charset="utf-8"></head>
<body style="margin:0;padding:0;background:#f4f4f5;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif">
<table width="100%" cellpadding="0" cellspacing="0" style="background:#f4f4f5;padding:2rem 0">
<tr><td align="center">
<table width="100%" cellpadding="0" cellspacing="0" style="max-width:480px;background:#fff;border-radius:.75rem;overflow:hidden;box-shadow:0 1px 3px rgba(0,0,0,.06)">
  <tr>
    <td style="padding:2rem 2rem 0;text-align:center">
      <h1 style="margin:0 0 .25rem;font-size:1.125rem;font-weight:700;color:#18181b">${data.siteName}</h1>
      <p style="margin:0;font-size:.8125rem;color:#a1a1aa">通知提醒</p>
    </td>
  </tr>
  <tr>
    <td style="padding:1.5rem 2rem">
      <h2 style="margin:0 0 .375rem;font-size:1rem;font-weight:600;color:#18181b">${data.title}</h2>
      ${data.content ? `<p style="margin:0;font-size:.875rem;line-height:1.6;color:#52525b">${data.content}</p>` : ''}
      ${data.meta ? `<p style="margin:.5rem 0 0;font-size:.75rem;color:#a1a1aa">${JSON.stringify(JSON.parse(data.meta), null, 2)}</p>` : ''}
    </td>
  </tr>
  <tr>
    <td style="padding:0 2rem 1.5rem;text-align:center">
      <p style="margin:0;font-size:.75rem;color:#d4d4d8">此邮件由系统自动发送，请勿回复</p>
    </td>
  </tr>
</table>
</td></tr>
</table>
</body>
</html>`
}
