// 发送中、已发送、失败、不需要发送（admin账号的评论）
export const emailStatuses = [
  'pending',
  'sent',
  'failed',
  'not_required',
] as const

export type EmailStatus = (typeof emailStatuses)[number]
