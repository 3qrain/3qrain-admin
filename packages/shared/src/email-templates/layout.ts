interface EmailLayoutInput {
  siteName: string
  siteUrl?: string
  body: string
}

export function emailLayout(input: EmailLayoutInput): string {
  const { siteName, siteUrl = '', body } = input

  return `<!DOCTYPE html>
<html lang="zh-CN">
<head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"></head>
<body style="margin:0;padding:20px;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Arial,sans-serif;line-height:1.6;color:#333;background:#f5f5f5">
<div style="max-width:600px;margin:0 auto;background:#fff;padding:30px;border-radius:8px;box-shadow:0 2px 8px rgba(0,0,0,.1)">
${body}
<hr style="border:0;border-top:1px solid #eee;margin:20px 0 0">
<p style="margin:12px 0 0;font-size:12px;color:#bbb;text-align:center">此邮件由系统自动发送，请勿回复</p>
</div>
${siteUrl ? `
<div style="max-width:600px;margin:20px auto 0;text-align:center;color:#999;font-size:13px">
  <a href="${siteUrl}" style="color:#4a90e2;text-decoration:none" target="_blank">${siteName}</a>
</div>` : ''}
</body>
</html>`
}
