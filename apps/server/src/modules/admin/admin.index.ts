import { createApp } from "~/lib/core/create-app";
import { authGuard } from "~/middleware/auth-guard";
import accountRouter from "./account/account.index";
import categoriesRouter from "./categories/categories.index";
import tagsRouter from "./tags/tags.index";
import postsRouter from "./posts/posts.index";
import configRouter from "./config/configs.index";
import mediaRouter from "./media/media.index";
import visitorsRouter from "./visitors/visitors.index";
import notesRouter from './notes/notes.index'
import commentsRouter from './comments/comments.index'
import notificationsRouter from './notifications/notifications.index'
import friendLinksRouter from './friend-links/friend-links.index'
import { tusHandler } from './upload/tus'
import { upgradeWebSocket } from 'hono/bun'
import { adminWsHandler } from '~/services/ws'

const adminRouter = createApp();

adminRouter.use("*", authGuard);

adminRouter.route("/", configRouter);
adminRouter.route("/", accountRouter);
adminRouter.route("/", categoriesRouter);
adminRouter.route("/", tagsRouter);
adminRouter.route("/", postsRouter);

adminRouter.route("/", mediaRouter);
adminRouter.route("/", visitorsRouter);
adminRouter.route('/', notesRouter)
adminRouter.route('/', commentsRouter)
adminRouter.route('/', notificationsRouter)
adminRouter.route('/', friendLinksRouter)
adminRouter.all('/upload/*', tusHandler)

// WebSocket（authGuard 已验证）
adminRouter.get('/ws', upgradeWebSocket(adminWsHandler))

export default adminRouter;
