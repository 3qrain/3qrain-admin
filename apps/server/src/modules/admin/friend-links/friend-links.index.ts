import { createApp } from '~/lib/core/create-app'
import * as routes from './friend-links.routes'
import * as handlers from './friend-links.handlers'

const friendLinksRouter = createApp()

friendLinksRouter.openapi(routes.createFriendLinkRoute, handlers.create)
friendLinksRouter.openapi(routes.countsRoute, handlers.counts)
friendLinksRouter.openapi(routes.listFriendLinksRoute, handlers.list)
friendLinksRouter.openapi(routes.updateFriendLinkRoute, handlers.update)
friendLinksRouter.openapi(routes.approveFriendLinkRoute, handlers.approve)
friendLinksRouter.openapi(routes.rejectFriendLinkRoute, handlers.reject)
friendLinksRouter.openapi(routes.destroyFriendLinksRoute, handlers.destroy)

export default friendLinksRouter
