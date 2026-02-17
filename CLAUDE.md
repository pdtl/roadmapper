# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

Roadmapper is a single-page timeline application for tracking events with categories and tags. It renders a swimlane timeline where time runs left-to-right and swimlanes group events by tags from a chosen category.

**Stack:** Vanilla JavaScript (ES6 modules) + Express + file-based persistence (YAML/JSON). No build step or bundler.

## Commands

```bash
npm install      # Install dependencies
npm start        # Start server at http://localhost:3000 (PORT env var configurable)
npm run dev      # Same as npm start
```

No tests, linting, or build pipeline exists.

## Architecture

**Backend:** `server.js` — Express server with REST endpoints for categories (YAML), events (JSON), and config (JSON). All data persists to flat files. Serves `index.html` as SPA fallback.

**Frontend modules (js/):**
- `app.js` — Entry point. Owns the single centralized `state` object and `dom` references. Wires event listeners, orchestrates re-renders via `onRenderTimeline()`.
- `api.js` — HTTP client for all backend calls (categories, events, config).
- `timeline.js` — Swimlane rendering, event block layout algorithm (`layoutEventsInLane()` handles overlap detection and row wrapping), events table, tooltips.
- `filters.js` — Category select dropdown and tag filter chip UI.
- `eventModal.js` — Add/edit event form and modal logic.
- `categoriesModal.js` — Category/tag editor with tag remap logic when renaming.
- `filterUtils.js` — Pure filtering functions (tags, date range, past events).
- `dateUtils.js` — Date calculations and date-to-pixel position mapping.
- `constants.js` — Layout constants (widths, gaps, color palette).

**Data files:**
- `categories.yaml` — `{ categories: { "CategoryName": ["tag1", "tag2"] } }`
- `events.json` — Array of `{ id, title, date (YYYY-MM-DD), tags: { "Category": ["tag"] }, notes? }`
- `config.json` — `{ theme: "light"|"dark" }`

## Key Patterns

- **No framework reactivity.** State changes require manual re-render calls.
- **Functional style.** Rendering and utility modules export functions that receive state/DOM as parameters.
- **Theming** via `data-theme` attribute on `<html>` and CSS variables. Material Design 3 conventions.
- **Modals** toggle via `classList.add/remove("open")`.
- **All data writes** go through `api.js` → Express → filesystem. No client-side storage.
