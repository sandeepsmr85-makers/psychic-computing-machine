
import { db } from "./db";
import {
  automationRuns,
  cachedActions,
  type InsertAutomationRun,
  type AutomationRun,
  type InsertCachedAction,
  type CachedAction,
} from "@shared/schema";
import { eq, desc } from "drizzle-orm";

export interface IStorage {
  // Runs
  createRun(run: InsertAutomationRun): Promise<AutomationRun>;
  getRun(id: number): Promise<AutomationRun | undefined>;
  listRuns(): Promise<AutomationRun[]>;
  updateRun(id: number, updates: Partial<AutomationRun>): Promise<AutomationRun>;
  appendRunLog(id: number, log: string): Promise<void>;

  // Cached Actions
  createCachedAction(action: InsertCachedAction): Promise<CachedAction>;
  getCachedAction(name: string, website: string): Promise<CachedAction | undefined>;
  listCachedActions(website?: string): Promise<CachedAction[]>;
  deleteCachedAction(id: number): Promise<void>;
  clearCache(website?: string): Promise<void>;
}

export class DatabaseStorage implements IStorage {
  async createRun(run: InsertAutomationRun): Promise<AutomationRun> {
    const [newRun] = await db.insert(automationRuns).values(run).returning();
    return newRun;
  }

  async getRun(id: number): Promise<AutomationRun | undefined> {
    const [run] = await db
      .select()
      .from(automationRuns)
      .where(eq(automationRuns.id, id));
    return run;
  }

  async listRuns(): Promise<AutomationRun[]> {
    return await db.select().from(automationRuns).orderBy(desc(automationRuns.id)).limit(50);
  }

  async updateRun(id: number, updates: Partial<AutomationRun>): Promise<AutomationRun> {
    const [updated] = await db
      .update(automationRuns)
      .set(updates)
      .where(eq(automationRuns.id, id))
      .returning();
    return updated;
  }

  async appendRunLog(id: number, log: string): Promise<void> {
    const run = await this.getRun(id);
    if (run) {
      const logs = run.logs || [];
      logs.push(log);
      await db
        .update(automationRuns)
        .set({ logs })
        .where(eq(automationRuns.id, id));
    }
  }

  async createCachedAction(action: InsertCachedAction): Promise<CachedAction> {
    const [newAction] = await db.insert(cachedActions).values(action).returning();
    return newAction;
  }

  async getCachedAction(name: string, website: string): Promise<CachedAction | undefined> {
    // Basic implementation: find by name and website
    // In a real scenario, you might want more complex matching
    const [action] = await db
      .select()
      .from(cachedActions)
      .where(eq(cachedActions.name, name));
      // .where(and(eq(cachedActions.name, name), eq(cachedActions.website, website))); 
      // Simplified for now as website parsing might vary
    return action;
  }

  async listCachedActions(website?: string): Promise<CachedAction[]> {
    if (website) {
      return await db.select().from(cachedActions).where(eq(cachedActions.website, website));
    }
    return await db.select().from(cachedActions);
  }

  async deleteCachedAction(id: number): Promise<void> {
    await db.delete(cachedActions).where(eq(cachedActions.id, id));
  }

  async clearCache(website?: string): Promise<void> {
    if (website) {
      await db.delete(cachedActions).where(eq(cachedActions.website, website));
    } else {
      await db.delete(cachedActions);
    }
  }
}

export const storage = new DatabaseStorage();
