import { emailLayout } from '../layout'

export interface CommentReviewData {
  siteName: string
  siteUrl: string
  adminUrl: string
  targetTitle: string
}

export function renderCommentReviewEmail(data: CommentReviewData): string {
  return emailLayout({
    siteName: data.siteName,
    siteUrl: data.siteUrl,
    href: `${data.adminUrl}/comments`,
    buttonLabel: '审核评论',
    body: `
      <p style="margin:0;color:#555;line-height:1.7">「${data.targetTitle}」有一条评论等待审核，请前往后台查看。</p>
    `
  })
}
