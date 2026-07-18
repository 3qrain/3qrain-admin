// 发送中、已发送、失败、不需要发送、等待审核
export const emailStatuses = [
  'pending',
  'sent',
  'failed',
  'not_required',
  'pending_review',
] as const

export type EmailStatus = (typeof emailStatuses)[number]
