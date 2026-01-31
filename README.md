# Roadmapper

A single-page timeline app for tracking events with categories and tags. Events are shown in a **swimlane** layout: time runs left-to-right on the x-axis, and swimlanes are the tags of a chosen category. You can switch the category to re-group lanes and filter by any tags.

## Features

- **Swimlane timeline** – X-axis = date; swimlanes = tags from one category (select which category in the header).
- **Filter by tags** – Use the filter chips to show only events that have selected tags (any category).
- **Add / edit events** – Title, date, and tags per category. Edits are saved to `events.json`.
- **Data in files** – Categories and tags come from `categories.yaml`; events from `events.json`.

## Setup

```bash
npm install
npm start
```

Open **http://localhost:3000**. The app reads and writes the YAML and JSON files via the same server.

## Data files

- **`categories.yaml`** – Defines categories and their tags. Example:

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

- **`events.json`** – Array of events. Each event has `id`, `title`, `date` (YYYY-MM-DD), and `tags` (category → list of tag names). Example:

  ```json
  [
    {
      "id": "evt-1",
      "title": "Kickoff meeting",
      "date": "2025-01-15",
      "tags": {
        "Project": ["Alpha"],
        "Status": ["Done"],
        "Priority": ["High"]
      }
    }
  ]
  ```

Change `categories.yaml` and refresh the page to see new categories/tags. Add or edit events in the UI; they are written back to `events.json`.
