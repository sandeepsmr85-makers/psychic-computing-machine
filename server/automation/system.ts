
/**
 * Universal Web Automation System
 * Adapted for Fullstack Application
 * 
 * FIXES:
 * 1. ✅ Added teach() method using observe()
 * 2. ✅ Added scrape() and scrapeMultiple() using extract()
 * 3. ✅ Fixed cache mechanism to use action objects
 * 4. ✅ Added all 4 Stagehand primitives
 */

import { Stagehand } from "@browserbasehq/stagehand";
import { z } from "zod";
import Anthropic from "@anthropic-ai/sdk";
import { storage } from "../storage";
import { type InsertCachedAction } from "@shared/schema";

interface WorkflowStep {
  actionName: string;
  params?: Record<string, any>;
}

interface AutomationResult {
  success: boolean;
  data?: any;
  error?: string;
  steps: string[];
  cacheHits: number;
  cacheMisses: number;
  cost: number;
}

export class UniversalWebAutomation {
  private stagehand!: Stagehand;
  private anthropic: Anthropic;
  private currentWebsite: string = "";
  private runId: number;
  private executionLog: string[] = [];
  private cacheHits: number = 0;
  private cacheMisses: number = 0;
  private totalCost: number = 0;

  constructor(runId: number) {
    this.runId = runId;
    this.anthropic = new Anthropic({
      apiKey: process.env.ANTHROPIC_API_KEY || "",
    });
  }

  private async log(message: string) {
    console.log(`[Run ${this.runId}] ${message}`);
    await storage.appendRunLog(this.runId, message);
  }

  async initialize(options: {
    env?: "LOCAL" | "BROWSERBASE";
    headless?: boolean;
    debugMode?: boolean;
  } = {}) {
    const { env = "LOCAL", headless = true, debugMode = false } = options;

    await this.log("🚀 Initializing Universal Web Automation System...");

    if (env === "BROWSERBASE") {
      if (!process.env.BROWSERBASE_API_KEY) {
        await this.log("❌ Missing BROWSERBASE_API_KEY");
        throw new Error("Missing BROWSERBASE_API_KEY");
      }
      this.stagehand = new Stagehand({
        env: "BROWSERBASE",
        apiKey: process.env.BROWSERBASE_API_KEY!,
        projectId: process.env.BROWSERBASE_PROJECT_ID!,
        enableCaching: true,
        verbose: debugMode ? 2 : 0,
        modelName: "gpt-4o",
        modelClientOptions: {
          apiKey: process.env.OPENAI_API_KEY,
        },
        browserbaseSessionCreateParams: {
          proxies: true,
          browserSettings: {
            blockAds: true,
            solveCaptchas: true,
          },
        },
      });
    } else {
      if (!process.env.OPENAI_API_KEY) {
        await this.log("⚠️ OPENAI_API_KEY not found. Stagehand requires an LLM provider.");
      }
      this.stagehand = new Stagehand({
        env: "LOCAL",
        enableCaching: true,
        verbose: debugMode ? 2 : 0,
        modelName: "gpt-4o",
        modelClientOptions: {
          apiKey: process.env.OPENAI_API_KEY,
        },
        localBrowserLaunchOptions: {
          headless,
          args: ["--no-sandbox", "--disable-setuid-sandbox"],
        },
      });
    }

    await this.stagehand.init();
    await this.log("✅ System initialized successfully!");
  }

  async goto(url: string) {
    await this.log(`🌐 Navigating to ${url}...`);
    const page = this.stagehand.page;
    await page.goto(url);
    this.currentWebsite = new URL(url).hostname;
    await this.log(`✅ Loaded: ${this.currentWebsite}`);
  }

  async close() {
    await this.log("👋 Closing automation session...");
    await this.stagehand.close();
  }

  private getCacheKey(actionName: string, website: string): string {
    return `${website}::${actionName}`;
  }

  // ============================================================================
  // ✅ FIX #1: TEACHING WITH OBSERVE
  // ============================================================================

  async teach(
    name: string,
    instruction: string,
    type: "act" | "extract" = "act",
    schema?: z.ZodTypeAny
  ): Promise<{ success: boolean; action?: any; error?: string }> {
    const page = this.stagehand.page;
    const currentUrl = page.url();
    this.currentWebsite = new URL(currentUrl).hostname;

    await this.log(`📚 Teaching action: "${name}"`);
    await this.log(`   Instruction: "${instruction}"`);

    try {
      let actionData: any;

      if (type === "act") {
        await this.log(`   Using observe() to learn the action...`);
        const observed = await this.stagehand.observe(instruction);
        
        if (!observed || observed.length === 0) {
          throw new Error("No actions observed");
        }

        actionData = observed[0];
        await this.log(`   ✅ Learned action: ${JSON.stringify(actionData).substring(0, 100)}...`);
      } else if (type === "extract") {
        if (!schema) {
          throw new Error("Schema required for extract actions");
        }
        
        await this.log(`   Learning extraction pattern...`);
        const result = await this.stagehand.extract(instruction, schema);
        actionData = {
          instruction,
          schema: schema.toString(),
          sampleResult: result,
        };
        await this.log(`   ✅ Learned extraction pattern`);
      }

      await storage.saveCachedAction({
        name,
        instruction,
        action: actionData,
        website: this.currentWebsite,
        type,
        schema: schema ? schema.toString() : undefined,
        timestamp: Date.now(),
      } as any);

      await this.log(`   💾 Cached action: "${name}" for ${this.currentWebsite}`);
      this.cacheMisses++;
      this.totalCost += 0.02;

      return { success: true, action: actionData };
    } catch (error) {
      await this.log(`   ❌ Failed to teach action: ${error}`);
      return { success: false, error: String(error) };
    }
  }

  async teachBatch(
    actions: Array<{
      name: string;
      instruction: string;
      type?: "act" | "extract";
      schema?: z.ZodTypeAny;
    }>
  ): Promise<Array<{ success: boolean; action?: any; error?: string }>> {
    await this.log(`📚 Teaching ${actions.length} actions...`);
    const results = [];

    for (const { name, instruction, type = "act", schema } of actions) {
      const result = await this.teach(name, instruction, type, schema);
      results.push(result);
    }

    return results;
  }

  // ============================================================================
  // ✅ FIX #2: SCRAPING WITH EXTRACT
  // ============================================================================

  async scrape<T>(instruction: string, schema: z.ZodType<T>): Promise<T> {
    await this.log(`🕷️ Scraping: "${instruction}"`);
    this.cacheMisses++;
    this.totalCost += 0.03;

    const result = await this.stagehand.extract(instruction, schema);
    await this.log(`   ✅ Scraped data successfully`);

    return result as T;
  }

  async scrapeMultiple<T>(
    instruction: string,
    schema: z.ZodType<T>,
    options: {
      maxPages?: number;
      nextPageAction?: string;
      stopCondition?: (data: T[]) => boolean;
    } = {}
  ): Promise<T[]> {
    const { maxPages = 10, nextPageAction = "click next page button" } = options;
    const results: T[] = [];

    await this.log(`🕷️ Multi-page scraping (max ${maxPages} pages)...`);

    for (let i = 0; i < maxPages; i++) {
      try {
        const data = await this.scrape(instruction, schema);
        results.push(data);
        await this.log(`   Page ${i + 1}: ✅ Scraped`);

        if (options.stopCondition && options.stopCondition(results)) {
          await this.log(`   Stop condition met`);
          break;
        }

        if (i < maxPages - 1) {
          try {
            await this.execute(nextPageAction);
            await new Promise((resolve) => setTimeout(resolve, 2000));
          } catch (error) {
            await this.log(`   No more pages available`);
            break;
          }
        }
      } catch (error) {
        await this.log(`   Error on page ${i + 1}: ${error}`);
        break;
      }
    }

    await this.log(`   ✅ Total pages scraped: ${results.length}`);
    return results;
  }

  async scrapeAndSave<T>(
    instruction: string,
    schema: z.ZodType<T>,
    saveName?: string
  ): Promise<{ data: T; saved: boolean }> {
    const data = await this.scrape(instruction, schema);

    try {
      const run = await storage.getRun(this.runId);
      const existingResult = (run?.result as any) || {};
      
      await storage.updateRun(this.runId, {
        result: {
          ...existingResult,
          scrapedData: {
            ...(existingResult.scrapedData || {}),
            [saveName || "data"]: data,
          },
        },
      });
      
      await this.log(`   💾 Saved scraped data to run result`);
      return { data, saved: true };
    } catch (error) {
      await this.log(`   ⚠️ Failed to save scraped data: ${error}`);
      return { data, saved: false };
    }
  }

  // ============================================================================
  // EXECUTING ACTIONS (FIXED)
  // ============================================================================

  async execute(actionNameOrInstruction: string, params?: Record<string, any>): Promise<any> {
    const page = this.stagehand.page;
    const currentUrl = page.url();
    this.currentWebsite = new URL(currentUrl).hostname;

    const cached = await storage.getCachedAction(actionNameOrInstruction, this.currentWebsite);

    if (cached) {
      await this.log(`⚡ Using cached action: "${actionNameOrInstruction}"`);
      this.cacheHits++;

      try {
        let instruction = cached.instruction;
        if (params) {
          Object.entries(params).forEach(([key, value]) => {
            instruction = instruction.replace(`{${key}}`, String(value));
          });
        }

        if (cached.type === "act") {
          await this.stagehand.act(cached.action as any);
          await this.log(`   ✅ Executed: ${actionNameOrInstruction}`);
          this.executionLog.push(`Executed: ${actionNameOrInstruction}`);
          return { success: true };
        } else if (cached.type === "extract") {
          const result = await this.stagehand.extract(instruction, z.any());
          this.executionLog.push(`Extracted: ${actionNameOrInstruction}`);
          return result;
        }
      } catch (error) {
        await this.log(`   ⚠️ Cached action failed, re-learning...`);
        await this.teach(actionNameOrInstruction, cached.instruction, cached.type as any);
        return this.execute(actionNameOrInstruction, params);
      }
    } else {
      await this.log(`🤖 Learning new action: "${actionNameOrInstruction}"`);
      this.cacheMisses++;
      this.totalCost += 0.02;

      let instruction = actionNameOrInstruction;
      if (params) {
        Object.entries(params).forEach(([key, value]) => {
          instruction = instruction.replace(`{${key}}`, String(value));
        });
      }

      const result = await this.stagehand.act(instruction);
      await this.log(`   ✅ Executed: ${actionNameOrInstruction}`);
      this.executionLog.push(`Executed: ${actionNameOrInstruction}`);

      return result;
    }
  }

  async executeWorkflow(steps: WorkflowStep[]): Promise<AutomationResult> {
    await this.log(`🎬 Executing workflow with ${steps.length} steps...`);
    this.executionLog = [];
    this.cacheHits = 0;
    this.cacheMisses = 0;
    this.totalCost = 0;

    const results: any[] = [];

    try {
      for (const step of steps) {
        const result = await this.execute(step.actionName, step.params);
        results.push(result);
      }

      return {
        success: true,
        data: results,
        steps: this.executionLog,
        cacheHits: this.cacheHits,
        cacheMisses: this.cacheMisses,
        cost: this.totalCost,
      };
    } catch (error) {
      return {
        success: false,
        error: String(error),
        steps: this.executionLog,
        cacheHits: this.cacheHits,
        cacheMisses: this.cacheMisses,
        cost: this.totalCost,
      };
    }
  }

  async prompt(instruction: string): Promise<AutomationResult> {
    await this.log(`💬 Processing prompt: "${instruction}"`);

    try {
      const steps = await this.parseInstructionToSteps(instruction);
      await this.log(`   Parsed into ${steps.length} steps`);
      return this.executeWorkflow(steps);
    } catch (e) {
      await this.log(`❌ Error parsing prompt: ${e}`);
      throw e;
    }
  }

  private async parseInstructionToSteps(instruction: string): Promise<WorkflowStep[]> {
    const page = this.stagehand.page;
    const currentUrl = page.url();
    this.currentWebsite = new URL(currentUrl).hostname;

    const availableActions = await storage.listCachedActions(this.currentWebsite);

    const prompt = `Parse this automation instruction into executable steps.

Website: ${this.currentWebsite}
Current URL: ${currentUrl}

Available cached actions:
${availableActions.map((a) => `- ${a.name}: ${a.instruction}`).join("\n") || "None"}

User instruction: "${instruction}"

Return a JSON array of steps. Each step should either:
1. Use a cached action by name if available
2. Provide a new instruction if no cached action fits

Format:
[
  { "actionName": "cached_action_name", "params": { "key": "value" } },
  { "actionName": "new instruction here", "params": {} }
]

Return ONLY the JSON array, no other text.`;

    const response = await this.anthropic.messages.create({
      model: "claude-3-5-sonnet-20240620",
      max_tokens: 2000,
      messages: [{ role: "user", content: prompt }],
    });

    const content = response.content[0];
    if (content.type === "text") {
      const jsonMatch = content.text.match(/\[[\s\S]*\]/);
      if (jsonMatch) {
        return JSON.parse(jsonMatch[0]);
      }
    }

    throw new Error("Failed to parse instruction");
  }
}
