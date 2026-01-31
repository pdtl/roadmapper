/**
 * Roadmapper – Express server.
 * Serves static assets and provides REST API for categories (YAML), events (JSON), and config (JSON).
 */

import express from "express";
import fs from "fs/promises";
import path from "path";
import { fileURLToPath } from "url";
import yaml from "js-yaml";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const app = express();
const PORT = Number(process.env.PORT) || 3000;

const categoriesPath = path.join(__dirname, "categories.yaml");
const eventsPath = path.join(__dirname, "events.json");
const configPath = path.join(__dirname, "config.json");

// ---------------------------------------------------------------------------
// Middleware
// ---------------------------------------------------------------------------
app.use(express.json({ limit: "1mb" }));
app.use(express.static(__dirname));

// ---------------------------------------------------------------------------
// API: Categories (YAML-backed)
// ---------------------------------------------------------------------------

/** GET /api/categories – load categories and tags from categories.yaml */
app.get("/api/categories", async (_req, res) => {
  try {
    const raw = await fs.readFile(categoriesPath, "utf8");
    const data = yaml.load(raw);
    res.json(data?.categories ?? {});
  } catch (err) {
    console.error("GET /api/categories:", err.message);
    res.status(500).json({ error: "Failed to read categories" });
  }
});

/** PUT /api/categories – write categories to categories.yaml (with preamble comment) */
app.put("/api/categories", async (req, res) => {
  try {
    const categories =
      typeof req.body === "object" && req.body !== null ? req.body : {};
    const preamble = `# Categories and their tags for timeline events.
# Each category becomes a swimlane grouping option.
# Tags under a category become individual swimlanes when that category is selected.

`;
    const yamlOut = preamble + yaml.dump({ categories }, { lineWidth: -1 });
    await fs.writeFile(categoriesPath, yamlOut, "utf8");
    res.json(categories);
  } catch (err) {
    console.error("PUT /api/categories:", err.message);
    res.status(500).json({ error: "Failed to write categories" });
  }
});

// ---------------------------------------------------------------------------
// API: Events (JSON-backed)
// ---------------------------------------------------------------------------

/** GET /api/events – load events from events.json */
app.get("/api/events", async (_req, res) => {
  try {
    const raw = await fs.readFile(eventsPath, "utf8");
    const data = JSON.parse(raw);
    res.json(Array.isArray(data) ? data : []);
  } catch (err) {
    console.error("GET /api/events:", err.message);
    res.status(500).json({ error: "Failed to read events" });
  }
});

/** PUT /api/events – replace events in events.json */
app.put("/api/events", async (req, res) => {
  try {
    const events = Array.isArray(req.body) ? req.body : [];
    await fs.writeFile(eventsPath, JSON.stringify(events, null, 2), "utf8");
    res.json(events);
  } catch (err) {
    console.error("PUT /api/events:", err.message);
    res.status(500).json({ error: "Failed to write events" });
  }
});

// ---------------------------------------------------------------------------
// API: Config (JSON-backed, optional file)
// ---------------------------------------------------------------------------

/** GET /api/config – load config (theme, etc.); default to { theme: "dark" } if missing */
app.get("/api/config", async (_req, res) => {
  try {
    const raw = await fs.readFile(configPath, "utf8");
    const data = JSON.parse(raw);
    res.json(data ?? { theme: "dark" });
  } catch (err) {
    if (err.code === "ENOENT") {
      return res.json({ theme: "dark" });
    }
    console.error("GET /api/config:", err.message);
    res.status(500).json({ error: "Failed to read config" });
  }
});

/** PUT /api/config – write config to config.json */
app.put("/api/config", async (req, res) => {
  try {
    const config =
      typeof req.body === "object" && req.body !== null ? req.body : {};
    await fs.writeFile(configPath, JSON.stringify(config, null, 2), "utf8");
    res.json(config);
  } catch (err) {
    console.error("PUT /api/config:", err.message);
    res.status(500).json({ error: "Failed to write config" });
  }
});

// ---------------------------------------------------------------------------
// SPA fallback: serve index.html for non-API routes
// ---------------------------------------------------------------------------
app.get("*", (_req, res) => {
  res.sendFile(path.join(__dirname, "index.html"));
});

app.listen(PORT, () => {
  console.log(`Roadmapper running at http://localhost:${PORT}`);
});
