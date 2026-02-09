
import type { Express } from "express";
import type { Server } from "http";
import { storage } from "./storage";
import { api } from "@shared/routes";
import { UniversalWebAutomation } from "./automation/system";
import { z } from "zod";

export async function registerRoutes(
  httpServer: Server,
  app: Express
): Promise<Server> {
  // === Automation Runs ===

  app.get(api.runs.list.path, async (req, res) => {
    const runs = await storage.listRuns();
    res.json(runs);
  });

  app.get(api.runs.get.path, async (req, res) => {
    const run = await storage.getRun(Number(req.params.id));
    if (!run) {
      return res.status(404).json({ message: "Run not found" });
    }
    res.json(run);
  });

  app.post(api.runs.create.path, async (req, res) => {
    try {
      const input = api.runs.create.input.parse(req.body);
      
      const run = await storage.createRun({
        url: input.url,
        instruction: input.instruction,
        status: "running",
      });

      (async () => {
        const automation = new UniversalWebAutomation(run.id);
        try {
          await automation.initialize({
            env: process.env.BROWSERBASE_API_KEY ? "BROWSERBASE" : "LOCAL",
            headless: true,
          });

          if (input.url) {
            await automation.goto(input.url);
          }

          const result = await automation.prompt(input.instruction);

          await storage.updateRun(run.id, {
            status: "completed",
            result: result,
            endTime: new Date(),
            cost: Math.round(result.cost * 100),
          });
        } catch (error) {
          console.error(`Run ${run.id} failed:`, error);
          await storage.updateRun(run.id, {
            status: "failed",
            result: { error: String(error) },
            endTime: new Date(),
          });
          await storage.appendRunLog(run.id, `❌ Fatal Error: ${String(error)}`);
        } finally {
          try {
            await automation.close();
          } catch (e) {
            // ignore
          }
        }
      })();

      res.status(201).json(run);
    } catch (err) {
      if (err instanceof z.ZodError) {
        return res.status(400).json({
          message: err.errors[0].message,
          field: err.errors[0].path.join("."),
        });
      }
      throw err;
    }
  });

  // === Cached Actions (Teaching) ===

  app.post("/api/actions", async (req, res) => {
    try {
      const { url, name, instruction, type, schema } = req.body;
      
      if (!url || !name || !instruction) {
        return res.status(400).json({
          message: "Missing required fields: url, name, instruction",
        });
      }
      
      const run = await storage.createRun({
        url,
        instruction: `Teaching action: ${name}`,
        status: "running",
      });
      
      const automation = new UniversalWebAutomation(run.id);
      
      try {
        await automation.initialize({
          env: process.env.BROWSERBASE_API_KEY ? "BROWSERBASE" : "LOCAL",
          headless: true,
        });
        
        await automation.goto(url);
        
        let zodSchema;
        if (schema && type === "extract") {
          try {
            zodSchema = eval(`z.${schema}`);
          } catch (e) {
            zodSchema = z.any();
          }
        }
        
        const result = await automation.teach(name, instruction, type || "act", zodSchema);
        
        await automation.close();
        
        await storage.updateRun(run.id, {
          status: "completed",
          result: { taught: result },
          endTime: new Date(),
        });
        
        if (result.success) {
          res.status(201).json({
            success: true,
            message: `Action "${name}" taught successfully`,
            action: result.action,
          });
        } else {
          res.status(400).json({
            success: false,
            message: result.error,
          });
        }
      } catch (error) {
        await automation.close();
        await storage.updateRun(run.id, {
          status: "failed",
          result: { error: String(error) },
          endTime: new Date(),
        });
        
        res.status(500).json({
          success: false,
          message: String(error),
        });
      }
    } catch (error) {
      res.status(500).json({
        success: false,
        message: String(error),
      });
    }
  });

  app.post("/api/actions/batch", async (req, res) => {
    try {
      const { url, actions } = req.body;
      
      if (!url || !actions || !Array.isArray(actions)) {
        return res.status(400).json({
          message: "Missing required fields: url, actions (array)",
        });
      }
      
      const run = await storage.createRun({
        url,
        instruction: `Teaching ${actions.length} actions`,
        status: "running",
      });
      
      const automation = new UniversalWebAutomation(run.id);
      
      try {
        await automation.initialize({
          env: process.env.BROWSERBASE_API_KEY ? "BROWSERBASE" : "LOCAL",
          headless: true,
        });
        
        await automation.goto(url);
        
        const results = await automation.teachBatch(
          actions.map((a: any) => ({
            name: a.name,
            instruction: a.instruction,
            type: a.type || "act",
            schema: a.schema ? eval(`z.${a.schema}`) : undefined,
          }))
        );
        
        await automation.close();
        
        await storage.updateRun(run.id, {
          status: "completed",
          result: { taught: results },
          endTime: new Date(),
        });
        
        res.status(201).json({
          success: true,
          message: `Taught ${results.filter((r) => r.success).length}/${actions.length} actions`,
          results,
        });
      } catch (error) {
        await automation.close();
        res.status(500).json({
          success: false,
          message: String(error),
        });
      }
    } catch (error) {
      res.status(500).json({
        success: false,
        message: String(error),
      });
    }
  });

  // === Scraping Endpoints ===

  app.post("/api/runs/:id/scrape", async (req, res) => {
    try {
      const runId = Number(req.params.id);
      const { instruction, schema, saveName } = req.body;
      
      if (!instruction || !schema) {
        return res.status(400).json({
          message: "Missing required fields: instruction, schema",
        });
      }
      
      const run = await storage.getRun(runId);
      if (!run) {
        return res.status(404).json({ message: "Run not found" });
      }
      
      const automation = new UniversalWebAutomation(runId);
      
      try {
        await automation.initialize({
          env: process.env.BROWSERBASE_API_KEY ? "BROWSERBASE" : "LOCAL",
          headless: true,
        });
        
        if (run.url) {
          await automation.goto(run.url);
        }
        
        let zodSchema;
        try {
          zodSchema = eval(`z.${schema}`);
        } catch (e) {
          zodSchema = z.any();
        }
        
        const result = await automation.scrapeAndSave(instruction, zodSchema, saveName);
        
        await automation.close();
        
        res.json({
          success: true,
          data: result.data,
          saved: result.saved,
        });
      } catch (error) {
        await automation.close();
        res.status(500).json({
          success: false,
          message: String(error),
        });
      }
    } catch (error) {
      res.status(500).json({
        success: false,
        message: String(error),
      });
    }
  });

  app.get("/api/runs/:id/export", async (req, res) => {
    try {
      const runId = Number(req.params.id);
      const format = (req.query.format as string) || "json";
      
      const run = await storage.getRun(runId);
      if (!run) {
        return res.status(404).json({ message: "Run not found" });
      }
      
      const result = run.result as any;
      const scrapedData = result?.scrapedData || result?.data;
      
      if (!scrapedData) {
        return res.status(404).json({ message: "No scraped data found" });
      }
      
      if (format === "json") {
        res.setHeader("Content-Type", "application/json");
        res.setHeader(
          "Content-Disposition",
          `attachment; filename="run-${runId}-data.json"`
        );
        res.json(scrapedData);
      } else if (format === "csv") {
        const data = Array.isArray(scrapedData) ? scrapedData : [scrapedData];
        if (data.length === 0) {
          return res.status(400).json({ message: "No data to export" });
        }
        
        const headers = Object.keys(data[0]);
        const csv = [
          headers.join(","),
          ...data.map((row) =>
            headers.map((h) => JSON.stringify(row[h] || "")).join(",")
          ),
        ].join("\n");
        
        res.setHeader("Content-Type", "text/csv");
        res.setHeader(
          "Content-Disposition",
          `attachment; filename="run-${runId}-data.csv"`
        );
        res.send(csv);
      } else {
        res.status(400).json({ message: "Invalid format. Use json or csv" });
      }
    } catch (error) {
      res.status(500).json({
        success: false,
        message: String(error),
      });
    }
  });

  // === Actions (Management) ===

  app.get(api.actions.list.path, async (req, res) => {
    const website = req.query.website as string | undefined;
    const actions = await storage.listCachedActions(website);
    res.json(actions);
  });

  app.delete(api.actions.delete.path, async (req, res) => {
    await storage.deleteCachedAction(Number(req.params.id));
    res.status(204).send();
  });

  app.delete("/api/actions/clear", async (req, res) => {
    const website = req.query.website as string | undefined;
    if (website) {
      const actions = await storage.listCachedActions(website);
      for (const action of actions) {
        await storage.deleteCachedAction(action.id);
      }
      res.json({ 
        success: true, 
        message: `Cleared ${actions.length} actions for ${website}` 
      });
    } else {
      const actions = await storage.listCachedActions();
      for (const action of actions) {
        await storage.deleteCachedAction(action.id);
      }
      res.json({ 
        success: true, 
        message: `Cleared all ${actions.length} cached actions` 
      });
    }
  });

  return httpServer;
}
