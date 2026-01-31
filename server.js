import express from "express";
import fs from "fs/promises";
import path from "path";
import { fileURLToPath } from "url";
import yaml from "js-yaml";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const app = express();
const PORT = 3000;

app.use(express.json());
app.use(express.static(__dirname));

const categoriesPath = path.join(__dirname, "categories.yaml");
const eventsPath = path.join(__dirname, "events.json");
const configPath = path.join(__dirname, "config.json");

app.get("/api/categories", async (_req, res) => {
  try {
    const raw = await fs.readFile(categoriesPath, "utf8");
    const data = yaml.load(raw);
    res.json(data.categories || {});
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Failed to read categories" });
  }
});

app.put("/api/categories", async (req, res) => {
  try {
    const categories = typeof req.body === "object" && req.body !== null ? req.body : {};
    const preamble = `# Categories and their tags for timeline events.
# Each category becomes a swimlane grouping option.
# Tags under a category become individual swimlanes when that category is selected.

`;
    const yamlOut = preamble + yaml.dump({ categories }, { lineWidth: -1 });
    await fs.writeFile(categoriesPath, yamlOut, "utf8");
    res.json(categories);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Failed to write categories" });
  }
});

app.get("/api/events", async (_req, res) => {
  try {
    const raw = await fs.readFile(eventsPath, "utf8");
    const data = JSON.parse(raw);
    res.json(Array.isArray(data) ? data : []);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Failed to read events" });
  }
});

app.put("/api/events", async (req, res) => {
  try {
    const events = Array.isArray(req.body) ? req.body : [];
    await fs.writeFile(eventsPath, JSON.stringify(events, null, 2), "utf8");
    res.json(events);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Failed to write events" });
  }
});

app.get("/api/config", async (_req, res) => {
  try {
    const raw = await fs.readFile(configPath, "utf8");
    const data = JSON.parse(raw);
    res.json(data);
  } catch (err) {
    if (err.code === "ENOENT") {
      return res.json({ theme: "dark" });
    }
    console.error(err);
    res.status(500).json({ error: "Failed to read config" });
  }
});

app.put("/api/config", async (req, res) => {
  try {
    const config = typeof req.body === "object" && req.body !== null ? req.body : {};
    await fs.writeFile(configPath, JSON.stringify(config, null, 2), "utf8");
    res.json(config);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Failed to write config" });
  }
});

app.get("*", (_req, res) => {
  res.sendFile(path.join(__dirname, "index.html"));
});

app.listen(PORT, () => {
  console.log(`Roadmapper running at http://localhost:${PORT}`);
});
