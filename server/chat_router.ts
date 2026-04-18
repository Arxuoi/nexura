import { z } from "zod";
import { createRouter, publicQuery } from "./middleware";
import { getDb } from "./queries/connection";
import { chatSessions, chatMessages } from "@db/schema";
import { eq, desc } from "drizzle-orm";
import { GoogleGenAI } from "@google/genai";

const GEMINI_API_KEY = "AIzaSyBXEDXdgvBCcKgeKiKyDqpMwM_2HeLMBws";

export const chatRouter = createRouter({
  // Create a new chat session
  createSession: publicQuery
    .input(
      z.object({
        title: z.string().optional().default("New Chat"),
        model: z.string().optional().default("gemini-2.0-flash"),
      }).optional()
    )
    .mutation(async ({ input }) => {
      const db = getDb();
      const result = await db.insert(chatSessions).values({
        title: input?.title ?? "New Chat",
        model: input?.model ?? "gemini-2.0-flash",
      });
      return { id: Number(result[0].insertId) };
    }),

  // Get all chat sessions
  listSessions: publicQuery.query(async () => {
    const db = getDb();
    const sessions = await db
      .select()
      .from(chatSessions)
      .orderBy(desc(chatSessions.updatedAt));
    return sessions;
  }),

  // Get messages for a session
  getMessages: publicQuery
    .input(z.object({ sessionId: z.number() }))
    .query(async ({ input }) => {
      const db = getDb();
      const messages = await db
        .select()
        .from(chatMessages)
        .where(eq(chatMessages.sessionId, input.sessionId))
        .orderBy(chatMessages.createdAt);
      return messages;
    }),

  // Send message and get AI response
  sendMessage: publicQuery
    .input(
      z.object({
        sessionId: z.number(),
        message: z.string().min(1),
        model: z.string().optional().default("gemini-2.0-flash"),
      })
    )
    .mutation(async ({ input }) => {
      const db = getDb();

      // Save user message
      await db.insert(chatMessages).values({
        sessionId: input.sessionId,
        role: "user",
        content: input.message,
      });

      // Get chat history for context
      const history = await db
        .select()
        .from(chatMessages)
        .where(eq(chatMessages.sessionId, input.sessionId))
        .orderBy(chatMessages.createdAt);

      // Build content for Gemini
      const contents = history.map((m) => ({
        role: m.role === "user" ? ("user" as const) : ("model" as const),
        parts: [{ text: m.content }],
      }));

      // Get AI response using Google GenAI SDK
      const genAI = new GoogleGenAI({ apiKey: GEMINI_API_KEY });

      const result = await genAI.models.generateContent({
        model: input.model,
        contents,
      });

      const aiResponse = result.text || "Sorry, I couldn't generate a response.";

      // Save AI response
      await db.insert(chatMessages).values({
        sessionId: input.sessionId,
        role: "assistant",
        content: aiResponse,
      });

      // Update session title from first message if still default
      const session = await db
        .select()
        .from(chatSessions)
        .where(eq(chatSessions.id, input.sessionId));

      if (
        session[0] &&
        session[0].title === "New Chat" &&
        history.length <= 2
      ) {
        const newTitle =
          input.message.slice(0, 50) +
          (input.message.length > 50 ? "..." : "");
        await db
          .update(chatSessions)
          .set({ title: newTitle })
          .where(eq(chatSessions.id, input.sessionId));
      }

      return { response: aiResponse };
    }),

  // Stream message for real-time response
  streamMessage: publicQuery
    .input(
      z.object({
        sessionId: z.number(),
        message: z.string().min(1),
        model: z.string().optional().default("gemini-2.0-flash"),
      })
    )
    .mutation(async ({ input }) => {
      const db = getDb();

      // Save user message
      await db.insert(chatMessages).values({
        sessionId: input.sessionId,
        role: "user",
        content: input.message,
      });

      // Get AI response via streaming
      const genAI = new GoogleGenAI({ apiKey: GEMINI_API_KEY });

      const result = await genAI.models.generateContentStream({
        model: input.model,
        contents: [{ role: "user", parts: [{ text: input.message }] }],
      });

      let fullResponse = "";
      for await (const chunk of result) {
        const text = chunk.text;
        if (text) {
          fullResponse += text;
        }
      }

      // Save AI response
      await db.insert(chatMessages).values({
        sessionId: input.sessionId,
        role: "assistant",
        content: fullResponse,
      });

      // Update session title
      const history = await db
        .select()
        .from(chatMessages)
        .where(eq(chatMessages.sessionId, input.sessionId))
        .orderBy(chatMessages.createdAt);

      const session = await db
        .select()
        .from(chatSessions)
        .where(eq(chatSessions.id, input.sessionId));

      if (
        session[0] &&
        session[0].title === "New Chat" &&
        history.length <= 3
      ) {
        const newTitle =
          input.message.slice(0, 50) +
          (input.message.length > 50 ? "..." : "");
        await db
          .update(chatSessions)
          .set({ title: newTitle })
          .where(eq(chatSessions.id, input.sessionId));
      }

      return { response: fullResponse };
    }),

  // Delete a session
  deleteSession: publicQuery
    .input(z.object({ sessionId: z.number() }))
    .mutation(async ({ input }) => {
      const db = getDb();
      await db
        .delete(chatMessages)
        .where(eq(chatMessages.sessionId, input.sessionId));
      await db
        .delete(chatSessions)
        .where(eq(chatSessions.id, input.sessionId));
      return { success: true };
    }),

  // Update session title
  updateSessionTitle: publicQuery
    .input(
      z.object({
        sessionId: z.number(),
        title: z.string().min(1),
      })
    )
    .mutation(async ({ input }) => {
      const db = getDb();
      await db
        .update(chatSessions)
        .set({ title: input.title })
        .where(eq(chatSessions.id, input.sessionId));
      return { success: true };
    }),
});
