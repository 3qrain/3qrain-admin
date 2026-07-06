interface EmailLayoutInput {
  siteName: string
  heading: string
  subheading?: string
  body: string
  cta?: { label: string; url: string }
  footer?: string
}

export function emailLayout(input: EmailLayoutInput): string {
  const { siteName, heading, subheading, body, cta, footer } = input

  return `<!DOCTYPE html>
<html lang="zh-CN">
<head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"></head>
<body style="margin:0;padding:0;background:#f5f5f5;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Helvetica,Arial,sans-serif">
<table width="100%" cellpadding="0" cellspacing="0" style="background:#f5f5f5;padding:2.5rem 1rem">
<tr><td align="center">

  <!-- Brand -->
  <table width="100%" cellpadding="0" cellspacing="0" style="max-width:520px;margin-bottom:1.25rem">
    <tr><td style="text-align:center">
      <span style="font-size:1.125rem;font-weight:700;color:#18181b;letter-spacing:-.02em">${siteName}</span>
    </td></tr>
  </table>

  <!-- Card -->
  <table width="100%" cellpadding="0" cellspacing="0" style="max-width:520px;background:#fff;border-radius:.75rem;overflow:hidden;box-shadow:0 1px 3px rgba(0,0,0,.05)">
    <tr>
      <td style="padding:2rem 2rem 0">
        <h2 style="margin:0 0 .25rem;font-size:1.0625rem;font-weight:600;color:#18181b;line-height:1.4">${heading}</h2>
        ${subheading ? `<p style="margin:.25rem 0 0;font-size:.8125rem;color:#a1a1aa">${subheading}</p>` : ''}
      </td>
    </tr>
    <tr>
      <td style="padding:1.25rem 2rem">
        ${body}
      </td>
    </tr>
    ${cta ? `
    <tr>
      <td style="padding:0 2rem 1.5rem">
        <a href="${cta.url}" style="display:inline-block;padding:.625rem 1.5rem;background:#18181b;color:#fff;font-size:.8125rem;font-weight:500;text-decoration:none;border-radius:.5rem">${cta.label}</a>
      </td>
    </tr>` : ''}
  </table>

  <!-- Footer -->
  <table width="100%" cellpadding="0" cellspacing="0" style="max-width:520px;margin-top:1.25rem">
    <tr><td style="text-align:center;font-size:.6875rem;color:#d4d4d8">
      ${footer !== undefined ? footer : `此邮件由 ${siteName} 系统自动发送`}
    </td></tr>
  </table>

</td></tr>
</table>
</body>
</html>`
}
