# AGENTS.md

This file provides guidance to Codex (Codex.ai/code) when working with code in this repository.

## 项目概况

3qrain 博客后台，Turborepo monorepo，Bun 运行时。

```
apps/admin     — Vite 8 + Vue 3.5 前端 (port 5173)
apps/server    — Hono 4 后端 (port 3010)
packages/
  shared         — @3qrain/shared，共享常量 (ErrorCode)
  eslint-config  — @repo/eslint-config，共享 ESLint
```

## 常用命令

```bash
bun dev                  # turbo 并行启动前后端
bun dev --filter=admin   # 只前端
bun dev --filter=server  # 只后端
docker compose up -d     # 启动 Redis
docker compose stop      # 停止
bunx drizzle-kit push    # schema 变更后推送数据库
```

## 技术栈

- **后端**: Hono 4 + Bun + Drizzle ORM + @hono/zod-openapi + bcryptjs + ioredis
- **前端**: Vite 8 + Vue 3.5 + Pinia + Vue Router + axios + @lucide/vue
- **数据库**: SQLite (bun:sqlite 驱动) + Drizzle ORM，文件存储在 `apps/server/data/`
- **缓存**: Redis (alpine)，Docker Compose 管理
- **认证**: 单 token (random hex 32B) + Redis session + Cookie (SameSite=Lax, HttpOnly)
- **共享包**: `@3qrain/shared` — ErrorCode 常量（前后端公用）

## 后端目录结构

```
apps/server/src/
├── index.ts                     # 根：connectDB → createApp → 挂载三层路由
├── db.ts                        # SQLite + Drizzle + Redis 连接
├── db/
│   └── schema/                  # Drizzle schema 定义（drizzle-kit 递归读取）
│       ├── index.ts             # barrel export
│       ├── columns.helpers.ts   # 公共 timestamps (createdAt, updatedAt)
│       ├── relations.ts         # Drizzle relations 定义
│       ├── passwords.ts
│       ├── recovery-keys.ts
│       ├── categories.ts
│       ├── tags.ts
│       ├── posts.ts
│       └── post-tags.ts
├── constants/
│   ├── http-status-codes.ts     # HTTP 状态码常量 (OK, CREATED, BAD_REQUEST...)
│   └── session.ts               # SESSION_ADMIN_PREFIX + sessionValueSchema
├── lib/core/
│   └── create-app.ts            # createApp() 工厂，内置 Zod defaultHook
├── middleware/
│   ├── auth-guard.ts            # 认证中间件（cookie → redis JSON → Zod → c.set("admin")）
│   └── error-handler.ts         # 全局 onError（兜底 500）
├── utils/
│   ├── crypto.ts                # bcryptjs 密码哈希 + generateToken (Web Crypto)
│   └── response.ts              # ok() / fail() 响应辅助 + Zod schema + timestamp
└── modules/
    ├── auth/        # 公开：status / setup / login / recover
    ├── admin/       # 全鉴权
    │   ├── account/       # change-password / logout
    │   ├── categories/    # 分类 CRUD
    │   ├── tags/          # 标签 CRUD
    │   └── posts/         # 文章 CRUD
    └── public/      # 前台接口（占位）
```

## 后端架构要点

### 三层模块划分

```
/api/*        → public/  无鉴权
/api/auth/*   → auth/    无鉴权
/api/admin/*  → admin/   全鉴权，authGuard 挂在模块内部 admin.use("*", authGuard)
```

根 index.ts 只挂路由，不感知鉴权。

### 命名规范

- **Router 实例** (`export default`): `authRouter`, `adminRouter`, `accountRouter` — 已注册完成的应用
- **Route 定义** (`export const`): `loginRoute`, `statusRoute` — createRoute 返回值
- **Handler**: `export async function`
- 导入：`import * as routes from "./xxx.routes"` / `import * as handlers from "./xxx.handlers"`

### 响应规范

统一格式，所有响应含 `timestamp`：

```typescript
import { ok, fail } from "~/utils/response";
import { ErrorCode } from "@3qrain/shared";

ok(data, "消息")    // { success: true,  code: "OK", message: "...", timestamp: ..., data }
fail(ErrorCode.X, "消息")  // { success: false, code: "X", message: "...", timestamp: ... }
```

无数据时传空对象：`ok({}, "消息")`。

### Session 数据结构

Redis key: `3qrain:session:admin:<token>`，值存 JSON（Zod 校验）：

```json
{ "role": "admin", "loginIp": "...", "userAgent": "...", "createdAt": ..., "lastActiveAt": ... }
```

guard 每次请求刷新 `lastActiveAt`。改密码时清除 `session:admin:*` 全设备下线。

## 前端目录结构

```
apps/admin/src/
├── main.ts              # 挂载 + initTheme()
├── App.vue
├── api/                 # 按模块分文件夹
│   └── auth/
│       ├── index.ts
│       └── types.ts
├── lib/axios/index.ts   # axios 实例 (baseURL 读 VITE_API_BASE_URL)
├── router/
│   ├── index.ts
│   └── routes.ts        # menuRoutes (带 meta.icon) + routes
├── stores/index.ts
├── css/
│   └── themes/
│       ├── light.css        # :root (oklch 色彩变量)
│       ├── dark.css         # html.dark
│       └── index.ts         # getTheme / setTheme / initTheme (含跟随系统)
├── layouts/
│   ├── AppLayout.vue    # 侧边栏 + main，≤768px 抽屉
│   └── components/
│       └── AppSidebar.vue
└── views/
    ├── Login.vue
    └── Dashboard.vue
```

### 前端架构要点

- **路径别名**: `~/` → `src/`（tsconfig.app.json + vite.config.ts）
- **主题**: oklch 色彩变量（命名参考 daisyUI），light/dark/system 三模式，`html.dark` class 切换
- **AppLayout**: 桌面端 fixed 侧边栏 (240px) + main (margin-left)，移动端 slide-up 抽屉
- **SFC 顺序**: `<script>` → `<template>` → `<style>`
- **Vite 代理**: `/api` → `http://localhost:3010`

## 路径别名

前后端统一 `~/` → `src/`，跨目录 import 用别名，模块内部用相对路径。

## 环境变量

```
# server
DATABASE_PATH=data/3qrain.db
REDIS_URL=redis://localhost:6379
TOKEN_TTL=86400

# admin
VITE_API_BASE_URL=/api
```

## Docker

- Redis alpine:6379，TZ=Asia/Shanghai
- Volume 命名: 3qrain-redis-data
- SQLite 为文件数据库，无需容器

## 注意事项

- **不用 `node:crypto`**，用 Web Crypto API 或 `bcryptjs`
- **安装依赖务必 `cd` 到对应 app 目录**
- **状态码**：`import * as HttpStatusCodes from "~/constants/http-status-codes"`，禁止裸数字
- **错误码**：`import { ErrorCode } from "@3qrain/shared"`，禁止裸字符串
- **OpenAPIHono** 必须用 `createApp()` 创建
- **Vue 组件** script 写在 template 上面
- **前端 api 调用** 按模块建文件夹（`api/auth/`），axios 实例在 `lib/axios/`
- **Drizzle schema 变更**后跑 `bunx drizzle-kit push`，`casing: "snake_case"` 在 `drizzle.config.ts` 和 `db.ts` 两处维护
- **时间列**：`timestamp_ms` 毫秒模式 + `default(sql\`(unixepoch() * 1000)\`)`，updatedAt 用 `$onUpdate(() => new Date())`
- **better-sqlite3** 仅 devDeps，供 drizzle-kit CLI 用，运行时走 `bun:sqlite`
- **Handler 校验**：用 Zod schema `.strict().safeParse()`，拒绝多余字段，`const { tagIds, ...data } = parsed.data` 再 spread 到 Drizzle
- **文章 draft**：slug/categoryId 可空，发布/归档时校验必填，status 含 draft/published/archived
- **前端组件**：views 模块化（`views/posts/` 含 `components/editor/`），通用组件放 `components/table/` 等
- **分页**：`components/table/Pagination.vue`，mode=button 按钮分页 / scroll 滚动加载，切换mode需 watch 重建 Observer
- **Cookie**：`3qrain_token`，正则 `/3qrain_token=([^;]+)/`
- **端口**：后端 3010，前端 Vite 代理 `/api` 和 `/public/` → 3010
- **静态文件**：`/storage/*` → `data/uploads/`，serveStatic rewrite
- **上传 (Uppy + TUS)**：前端 `@uppy/core` + `@uppy/dashboard` + `@uppy/tus`，后端 `@tus/server` + `@tus/file-store`，TUS 协议切片续传，详见下方上传章节
- **媒体库**：`admin/media/` 模块化，列表/删除/健康检查，onUploadFinish 自动写入 media 表+生成缩略图
- **example 目录**：参考项目组件库，已 gitignore，Codex EXAMPLE.md 有总结
- **Tiptap 编辑器**：`views/posts/components/editor/tiptap/`，含 BubbleMenu + FloatingMenu 组件化，content/contentHtml/contentText 三存，getContent() 仅在保存时调用
- **base 组件**：`components/base/` — Button(5 variant/loading/active/icon)/Input/Select/ToggleGroup
- **边框变量**：`--color-border: color-mix(in oklab, var(--color-base-content) 12%, transparent)`，全局 border 统一用此变量
- **主题**：ThemeToggle 三模式切换(light/dark/system)在侧边栏底部

## 上传 (Uppy + TUS)

### 架构

```
前端 Uppy (@uppy/tus)  ──PATCH /api/admin/upload/:id──→  @tus/server (Hono)
                                                              │
                                                              ├── data/tus/ (切片暂存)
                                                              └── onUploadFinish → data/uploads/ (完成文件)
                                                                      │
                                                        /storage/* 静态服务对外可访问
```

### 前端
- **全局实例**：`stores/uppy.ts` — `useUppyStore`，Pinia 单例，Uppy 实例全局复用
  - 插件：`ImageEditor` + `ScreenCapture` + `Tus({ endpoint: '/api/admin/upload/' })`
  - `mountDashboard(target, theme)` — 挂载 Dashboard UI，已存在则重建（适配 Drawer 开关场景）
- **UI 组件**：`components/uppy-uploader/UppyUploader.vue` — 挂载时调用 `mountDashboard('#uppy-dashboard', theme)`
- **使用场景**：移动端 Drawer 内上传面板（AppLayout），桌面端暂无入口
- **依赖**：`@uppy/core` `@uppy/dashboard` `@uppy/tus` `@uppy/image-editor` `@uppy/screen-capture`（均 v5）

### 后端
- **包**：`@tus/server` v2 + `@tus/file-store` v2
- **挂载**：`adminRouter.all('/upload/*', tusHandler)`，在 `admin.index.ts` 中
- **存储**：`FileStore({ directory: './data/tus' })` — 切片暂存 `data/tus/`，完成后迁移到 `data/uploads/`
- **静态服务**：`/storage/*` → `data/uploads/`（serveStatic rewrite）
- **onUploadFinish** `modules/admin/upload/tus.ts`：
  - 生成唯一 ID → 按年月建目录 `data/uploads/{year}/{month}/`
  - 重命名 → metadata 提取 → 图片生成 WebP 缩略图(1200px) + placeholder
  - 写入 `media` 表（mimeType/type/size/ext/originalPath/thumbnailPath/width/height/filename）
- **认证**：TUS 端点当前无鉴权（`adminRouter.all` 前已挂 `authGuard`，但 `upload/*` 需要确认是否受保护）
- **清理**：`Bun.cron("0 */3 * * *")` 每 3 小时清理过期 TUS 上传

### 媒体库 API
- `GET /api/admin/media` — 分页列表（keyword/page/pageSize）
- `DELETE /api/admin/media/:id` — 删除文件+记录
- `GET /api/admin/media/health` — 未登记文件/失效记录检查
- 路径映射：DB 存 `/{year}/{month}/{id}-original{ext}`，直接拼 `/storage` 前缀即 URL

### 注意事项
- Uppy instance 有两个：Pinia store（全局）+ MediaLibrary.vue（复用 store 的 mountDashboard）
- `expireTime_tus` 在 shared 中定义为 `1000`（？），实际期望 24h
- `ScreenCapture` 需要安全上下文（HTTPS/localhost），局域网 HTTP 访问会报错
- `data/uploads/` 运行时自动 mkdir，无需手动创建

## 上传 (Uppy + TUS)

### 架构

```
前端 Uppy (@uppy/tus)  ──PATCH /api/upload/:id──→  @tus/server (Hono)
                                                      │
                                                      ├── data/tus/ (切片暂存)
                                                      └── onUploadFinish → data/uploads/ (完成文件)
                                                              │
                                                /storage/* 静态服务对外可访问
```

### 前端

- **全局实例**：`stores/uppy.ts` — `useUppyStore`，Pinia 单例，Uppy 实例全局复用
  - 插件：`ImageEditor` + `ScreenCapture` + `Tus({ endpoint: '/api/upload/' })`
  - `mountDashboard(target, theme)` — 挂载 Dashboard UI，已存在则重建（适配 Drawer 开关场景）
- **UI 组件**：`components/uppy-uploader/UppyUploader.vue` — 挂载时调用 `mountDashboard('#uppy-dashboard', theme)`
- **使用场景**：移动端 Drawer 内上传面板（AppLayout），桌面端暂无入口
- **依赖**：`@uppy/core` `@uppy/dashboard` `@uppy/tus` `@uppy/image-editor` `@uppy/screen-capture`（均 v5）

### 后端

- **包**：`@tus/server` v2 + `@tus/file-store` v2
- **挂载**：`apps/server/src/index.ts`，路径 `/api/upload/*`，`app.all()` 转发到 `tusServer.handleWeb()`
- **存储**：`FileStore({ directory: './data/tus' })` — 切片暂存 `data/tus/`，完成后需迁移到 `data/uploads/`
- **静态服务**：`/storage/*` → `data/uploads/`（serveStatic rewrite）
- **认证**：TUS 端点当前无鉴权

### 功能支持

| 功能 | 支持 | 说明 |
|------|------|------|
| 断点续传 | ✅ | 网络中断后 TUS 协议自动恢复 |
| 刷新继续上传 | ✅ | Uppy + localStorage 缓存上传状态，页面刷新后可恢复 |
| 跨设备续传 | ❌ | 依赖浏览器 localStorage，不支持 |
| 切片上传 | ⚠️ | TUS 流式协议，服务端自动处理，前端不手动分片 |
| 上传进度 | ✅ | 实时 PATCH offset 计算进度 |
| 上传恢复 | ✅ | 通过 uploadId + offset 定位恢复点 |

### 注意事项

- **ScreenCapture** 需要安全上下文（HTTPS/localhost），局域网 HTTP 访问会报错
- Vite 代理 `/api/*` → 3010，TUS 请求走此代理
- `data/uploads/` 运行时自动 mkdir，无需手动创建
