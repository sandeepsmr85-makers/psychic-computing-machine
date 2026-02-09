
import { pgTable, text, serial, integer, boolean, timestamp, jsonb, bigint } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

// === TABLE DEFINITIONS ===

// Track automation execution history
export const automationRuns = pgTable("automation_runs", {
  id: serial("id").primaryKey(),
  status: text("status").notNull(), // "pending", "running", "completed", "failed"
  url: text("url"), // The URL operated on
  instruction: text("instruction").notNull(),
  logs: jsonb("logs").$type<string[]>().default([]), // Array of log strings
  result: jsonb("result"), // Result data or error message
  startTime: timestamp("start_time").defaultNow(),
  endTime: timestamp("end_time"),
  cost: integer("cost_cents").default(0), // Estimated cost in cents
});

// Store cached actions (replacing the file-based cache)
export const cachedActions = pgTable("cached_actions", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  instruction: text("instruction").notNull(),
  action: jsonb("action").notNull(), // The Playwright/Stagehand action object
  website: text("website").notNull(),
  type: text("type").notNull(), // "act" | "extract" | "observe"
  schema: text("schema"), // Stringified Zod schema for extraction
  timestamp: bigint("timestamp", { mode: "number" }).notNull(),
});

// === SCHEMAS ===

export const insertRunSchema = createInsertSchema(automationRuns).pick({
  url: true,
  instruction: true,
  status: true,
});

export const insertActionSchema = createInsertSchema(cachedActions).omit({
  id: true,
});

// === TYPES ===

export type AutomationRun = typeof automationRuns.$inferSelect;
export type InsertAutomationRun = z.infer<typeof insertRunSchema>;

export type CachedAction = typeof cachedActions.$inferSelect;
export type InsertCachedAction = z.infer<typeof insertActionSchema>;

// Request types
export type RunAutomationRequest = {
  url?: string;
  instruction: string;
  useCache?: boolean;
};

export type TeachActionRequest = {
  url: string;
  name: string;
  instruction: string;
  type: "act" | "extract";
  schema?: string; // Optional JSON schema string
};

// Response types
export type AutomationRunResponse = AutomationRun;
export type CachedActionResponse = CachedAction;
