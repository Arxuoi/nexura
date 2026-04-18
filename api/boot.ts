import { Hono } from "hono";
import { handle } from "hono/vercel"; // Adapter ini adalah kunci untuk Vercel
import { bodyLimit } from "hono/body-limit";
import { fetchRequestHandler } from "@trpc/server/adapters/fetch";
import { appRouter } from "./router";
import { createContext } from "./context";
import { createOAuthCallbackHandler } from "./kimi/auth";
import { Paths } from "@contracts/constants";

// Inisialisasi aplikasi Hono
// Tidak perlu Bindings: HttpBindings di sini karena Vercel menggunakan env-nya sendiri
const app = new Hono();

// Middleware
app.use(bodyLimit({ maxSize: 50 * 1024 * 1024 }));

// Routes
app.get(Paths.oauthCallback, createOAuthCallbackHandler());

// tRPC Handler
app.all("/api/trpc/*", async (c) => {
  return fetchRequestHandler({
    endpoint: "/api/trpc",
    req: c.req.raw,
    router: appRouter,
    createContext,
  });
});

// Fallback untuk route /api/* yang tidak ditemukan
app.all("/api/*", (c) => c.json({ error: "Not Found" }, 404));

// EKSPOR UTAMA UNTUK VERCEL
// Ini adalah cara Vercel membaca entry point aplikasi kamu
export default handle(app);
