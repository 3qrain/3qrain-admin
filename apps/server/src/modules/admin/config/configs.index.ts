import { createApp } from "~/lib/core/create-app";
import * as handlers from "./configs.handlers";
import * as routes from "./configs.routes";

const configRouter = createApp();

configRouter.openapi(routes.getConfigRoute, handlers.getAll)
configRouter.openapi(routes.getConfigByKeyRoute, handlers.getByKey)
configRouter.openapi(routes.updateConfigRoute, handlers.update)
configRouter.openapi(routes.getEmailConfigRoute, handlers.getEmailConf)
configRouter.openapi(routes.saveEmailConfigRoute, handlers.saveEmailConf)
configRouter.openapi(routes.testEmailRoute, handlers.testEmail)
configRouter.openapi(routes.sendTestEmailRoute, handlers.sendTestEmailHandler)

export default configRouter
