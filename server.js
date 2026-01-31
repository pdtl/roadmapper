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

app.get("*", (_req, res) => {
  res.sendFile(path.join(__dirname, "index.html"));
});

app.listen(PORT, () => {
  console.log(`Roadmapper running at http://localhost:${PORT}`);
});
