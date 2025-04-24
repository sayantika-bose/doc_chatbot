import { pgTable, text, serial, integer, timestamp } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

export const users = pgTable("users", {
  id: serial("id").primaryKey(),
  username: text("username").notNull().unique(),
  password: text("password").notNull(),
});

export const insertUserSchema = createInsertSchema(users).pick({
  username: true,
  password: true,
});

export type InsertUser = z.infer<typeof insertUserSchema>;
export type User = typeof users.$inferSelect;

// Document schema
export const documents = pgTable("documents", {
  id: serial("id").primaryKey(),
  documentId: text("document_id").notNull().unique(),
  fileName: text("file_name").notNull(),
  userId: integer("user_id").references(() => users.id).notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const insertDocumentSchema = createInsertSchema(documents).pick({
  documentId: true,
  fileName: true,
  userId: true,
});

export type InsertDocument = z.infer<typeof insertDocumentSchema>;
export type Document = typeof documents.$inferSelect;

// Chat messages schema
export const messages = pgTable("messages", {
  id: serial("id").primaryKey(),
  documentId: text("document_id").notNull(),
  content: text("content").notNull(),
  isUserMessage: integer("is_user_message").notNull(),
  userId: integer("user_id").references(() => users.id).notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const insertMessageSchema = createInsertSchema(messages).pick({
  documentId: true,
  content: true,
  isUserMessage: true,
  userId: true,
});

export type InsertMessage = z.infer<typeof insertMessageSchema>;
export type Message = typeof messages.$inferSelect;

// API schemas for frontend validation
export const chatRequestSchema = z.object({
  documentId: z.string().min(1, "Document ID is required"),
  question: z.string().min(1, "Question is required"),
});

export type ChatRequest = z.infer<typeof chatRequestSchema>;

export const chatResponseSchema = z.object({
  answer: z.string(),
});

export type ChatResponse = z.infer<typeof chatResponseSchema>;

export const uploadResponseSchema = z.object({
  documentId: z.string(),
});

export type UploadResponse = z.infer<typeof uploadResponseSchema>;
