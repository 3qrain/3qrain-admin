interface EmailLayoutInput {
  siteName: string
  siteUrl?: string
  body: string
  href?: string
  buttonLabel?: string
}

export function emailLayout(input: EmailLayoutInput): string {
  const { siteName, siteUrl = '', body, href = '', buttonLabel = '' } = input

  return `<!DOCTYPE html>
<html lang="zh-CN">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width,initial-scale=1">
</head>

<body style="
margin:0;
padding:40px 20px;
font-family:-apple-system,BlinkMacSystemFont,'Segoe UI','PingFang SC','Microsoft YaHei',Arial,sans-serif;
line-height:1.7;
color:#333;
background:#f6f7fb;
">

<div style="
max-width:600px;
margin:0 auto;
background:#fff;
border-radius:16px;
overflow:hidden;
box-shadow:0 8px 30px rgba(0,0,0,.06);
">

<div style="
padding:28px 32px;
border-bottom:1px solid #f0f0f0;
background:linear-gradient(135deg,#fafafa,#fff);
">

<div style="
font-size:20px;
font-weight:700;
color:#222;
">
${siteName}
</div>

</div>


<div style="
padding:32px;
">

${body}
<a href="${href}" style="display:block;width:fit-content;background:#000000;color:#fff;padding:12px 24px;text-decoration:none;border-radius:6px;margin: 20px 0 0;;font-weight:500" target="_blank">${buttonLabel}</a>

</div>


<div style="
padding:20px 32px;
border-top:1px solid #f0f0f0;
">

<p style="
margin:0;
font-size:12px;
color:#aaa;
text-align:center;
">
此邮件由系统自动发送，请勿回复
</p>

</div>

</div>


${
  siteUrl
    ? `
<div style="
max-width:600px;
margin:18px auto 0;
text-align:center;
font-size:13px;
">

<a href="${siteUrl}"
style="
color:#64748b;
text-decoration:none;
"
target="_blank">
${siteName}
</a>

</div>
`
    : ''
}

</body>
</html>`
}
