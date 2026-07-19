import { createApp } from '~/lib/core/create-app'
import * as handlers from './comments.handlers'
import * as routes from './comments.routes'

const commentsRouter = createApp()

commentsRouter.openapi(routes.listCommentsRoute, handlers.list)
commentsRouter.openapi(routes.pendingCountRoute, handlers.pendingCount)
commentsRouter.openapi(routes.createCommentRoute, handlers.create)
commentsRouter.openapi(routes.updateCommentRoute, handlers.update)
commentsRouter.openapi(routes.reviewCommentRoute, handlers.review)
commentsRouter.openapi(routes.emptyTrashRoute, handlers.emptyTrash)
commentsRouter.openapi(routes.pinCommentRoute, handlers.pin)
commentsRouter.openapi(routes.deleteCommentRoute, handlers.remove)
commentsRouter.openapi(routes.repliesRoute, handlers.replies)
commentsRouter.openapi(routes.restoreCommentRoute, handlers.restore)
commentsRouter.openapi(routes.destroyCommentRoute, handlers.destroy)

export default commentsRouter
