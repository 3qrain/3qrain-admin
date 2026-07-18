export const ErrorCode = {
  /** 密码错误 */
  INVALID_PASSWORD: "AUTH_INVALID_PASSWORD",
  /** 尚未初始化 */
  NOT_INITIALIZED: "AUTH_NOT_INITIALIZED",
  /** 已完成初始化 */
  ALREADY_INITIALIZED: "AUTH_ALREADY_INITIALIZED",
  /** 未登录 */
  UNAUTHORIZED: "AUTH_UNAUTHORIZED",
  /** 被封禁 */
  BANNED: "AUTH_BANNED",
  /** Token 过期 */
  TOKEN_EXPIRED: "AUTH_TOKEN_EXPIRED",

  /** 无效的请求来源 */
  INVALID_ORIGIN: "SECURITY_INVALID_ORIGIN",

  /** 无有效恢复密钥 */
  NO_VALID_RECOVERY_KEY: "AUTH_NO_VALID_RECOVERY_KEY",
  /** 恢复密钥错误 */
  INVALID_RECOVERY_KEY: "AUTH_INVALID_RECOVERY_KEY",
  /** 请求参数校验失败 */
  INVALID_PARAMS: "INVALID_PARAMS",
  /** 服务器内部错误 */
  INTERNAL_ERROR: "INTERNAL_ERROR",
  /** 分类不存在 */
  CATEGORY_NOT_FOUND: "CATEGORY_NOT_FOUND",
  /** 分类下存在文章，无法删除 */
  CATEGORY_HAS_POSTS: "CATEGORY_HAS_POSTS",
  /** 分类 name 已存在 */
  CATEGORY_NAME_EXISTS: "CATEGORY_NAME_EXISTS",
  /** 分类 slug 已存在 */
  CATEGORY_SLUG_EXISTS: "CATEGORY_SLUG_EXISTS",
  /** 标签不存在 */
  TAG_NOT_FOUND: "TAG_NOT_FOUND",
  /** 标签 name 已存在 */
  TAG_NAME_EXISTS: "TAG_NAME_EXISTS",
  /** 标签 slug 已存在 */
  TAG_SLUG_EXISTS: "TAG_SLUG_EXISTS",
  /** 文章不存在 */
  POST_NOT_FOUND: "POST_NOT_FOUND",
  /** 文章 slug 已存在 */
  POST_SLUG_EXISTS: "POST_SLUG_EXISTS",
  /** 配置不存在 */
  CONFIG_NOT_FOUND: "CONFIG_NOT_FOUND",
  /** 站点功能已关闭 */
  FEATURE_DISABLED: "FEATURE_DISABLED",

  /** 文件不存在 */
  FILE_NOT_FOUND: "FILE_NOT_FOUND",
  /** 邮件配置或发送失败 */
  EMAIL_ERROR: "EMAIL_ERROR",
} as const;

export type ErrorCodeType = (typeof ErrorCode)[keyof typeof ErrorCode];
