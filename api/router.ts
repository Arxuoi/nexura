import { authRouter } from "./auth-router";
import { chatRouter } from "./chat-router";
import { createRouter, publicQuery } from "./middleware";

export const appRouter = createRouter({
  ping: publicQuery.query(() => ({ ok: true, ts: Date.now() })),
  auth: authRouter,
  chat: chatRouter,
});

export type AppRouter = typeof appRouter;
