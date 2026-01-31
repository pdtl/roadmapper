# Roadmapper

A single-page timeline app for tracking events with categories and tags. Events are shown in a **swimlane** layout: time runs left-to-right on the x-axis, and swimlanes are the tags of a chosen category. You can switch the category to re-group lanes and filter by any tags.

## Features

- **Swimlane timeline** – X-axis = date; swimlanes = tags from one category (select which category in the sidebar).
- **Events table** – Resizable table below the timeline listing Event, Date, Tags, and Notes; drag the splitter to adjust the layout.
- **Filter by tags** – Use the filter chips in the sidebar to show only events that have selected tags (any category).
- **Date range** – Optional start/end date filters plus quick buttons (Next month, 6 months, 12 months). Toggle “Show past events” to include or hide past events.
- **Add / edit events** – Title, date, tags per category, and optional notes. Edits are saved to `events.json`.
- **Edit categories** – Use the “Categories” button in the header to add, rename, or remove categories and tags; changes are written to `categories.yaml` and event data is updated to match.
- **Theme** – Light/dark theme toggle in the header; preference is stored in `config.json`.
- **Data in files** – Categories and tags in `categories.yaml`; events in `events.json`; optional user config (e.g. theme) in `config.json`.

## Setup

```bash
npm install
npm start
```

Open **http://localhost:3000** (or set `PORT` to use another port). The app serves static assets and provides a REST API that reads and writes the YAML and JSON files.

## Data files

- **`categories.yaml`** – Defines categories and their tags. You can edit this file by hand or via the “Categories” modal in the app. Example:

  ```yaml
  categories:
    Project:
      - Alpha
      - Beta
    Status:
      - Not Started
      - In Progress
      - Done
  ```

- **`events.json`** – Array of events. Each event has `id`, `title`, `date` (YYYY-MM-DD), `tags` (category → list of tag names), and optional `notes`. Example:

  ```json
  [
    {
      "id": "evt-1",
      "title": "Kickoff meeting",
      "date": "2025-01-15",
      "tags": {
        "Project": ["Alpha"],
        "Status": ["Done"]
      },
      "notes": "Follow up on action items"
    }
  ]
  ```

- **`config.json`** (optional) – User preferences. If missing, the app defaults to dark theme. Example:

  ```json
  {
    "theme": "dark"
  }
  ```

Add or edit events and categories in the UI; they are written back to `events.json` and `categories.yaml` respectively. Theme changes are saved to `config.json`.
