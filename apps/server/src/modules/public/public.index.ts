import { createApp } from '~/lib/core/create-app'
import { upgradeWebSocket } from 'hono/bun'
import { publicWsHandler } from '~/services/ws'
import userRouter from './user/user.index'
import postsRouter from './posts/posts.index'
import notesRouter from './notes/notes.index'
import viewRouter from './view/view.index'
import siteRouter from './site/site.index'
import commentsRouter from './comments/comments.index'
import friendLinksRouter from './friend-links/friend-links.index'

const publicRouter = createApp()

publicRouter.route('/', userRouter)
publicRouter.route('/', postsRouter)
publicRouter.route('/', notesRouter)
publicRouter.route('/', viewRouter)
publicRouter.route('/', siteRouter)
publicRouter.route('/', commentsRouter)
publicRouter.route('/', friendLinksRouter)

// 前台 WebSocket（无需认证）
publicRouter.get('/ws', upgradeWebSocket(publicWsHandler))

export default publicRouter
