import { createApp } from '~/lib/core/create-app'
import * as handlers from './dashboard.handlers'
import * as routes from './dashboard.routes'

const dashboardRouter = createApp()

dashboardRouter.openapi(routes.overviewRoute, handlers.overview)

export default dashboardRouter
