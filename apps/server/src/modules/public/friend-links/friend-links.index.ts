import { createApp } from '~/lib/core/create-app'
import * as routes from './friend-links.routes'
import * as handlers from './friend-links.handlers'

const friendLinksRouter = createApp()

friendLinksRouter.openapi(routes.listApprovedRoute, handlers.listApproved)
friendLinksRouter.openapi(routes.createFriendLinkRoute, handlers.create)

export default friendLinksRouter
