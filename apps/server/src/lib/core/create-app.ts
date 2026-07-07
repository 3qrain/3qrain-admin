import { OpenAPIHono } from "@hono/zod-openapi";
import type { Hook } from "@hono/zod-openapi";
import { fail } from "~/utils/response";
import { ErrorCode } from "@3qrain/shared";
import { BAD_REQUEST } from "~/constants/http-status-codes";

const defaultHook: Hook<any, any, any, any> = (result, c) => {
  if (!result.success && result.error.issues.length > 0) {
    // console.log('zod error: ',result.error.issues[0].message);
    return c.json(
      fail(ErrorCode.INVALID_PARAMS, result.error.issues[0].message),
      BAD_REQUEST,
    );
  }
};

export function createApp() {
  return new OpenAPIHono({ defaultHook });
}
