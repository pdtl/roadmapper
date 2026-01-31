/**
 * Roadmapper – main entry point.
 * Holds application state and DOM refs, wires modules and event listeners.
 */

import {
  loadCategories,
  loadEvents,
  saveEvents,
  loadConfig,
  saveConfig,
  saveCategories,
  api,
} from "./api.js";
import { renderCategorySelect, renderFilters } from "./filters.js";
import { renderTimeline } from "./timeline.js";
import {
  openAddEvent,
  openEditEvent,
  renderEventTagsForm,
  getFormTags,
  getEventFormData,
} from "./eventModal.js";
import {
  renderCategoriesEditor,
  getCategoriesFromEditor,
  applyCategoryAndTagRenamesToEvents,
} from "./categoriesModal.js";

// ---------------------------------------------------------------------------
// State: single source of truth for categories, events, filters, theme
// ---------------------------------------------------------------------------
const state = {
  categories: {},
  events: [],
  swimlaneCategory: null,
  activeFilters: {},
  dateFilterStart: null,
  dateFilterEnd: null,
  showPastEvents: false,
  theme: "dark",
};

// ---------------------------------------------------------------------------
// DOM refs: gathered once after DOM is ready
// ---------------------------------------------------------------------------
const dom = {
  categorySelect: document.getElementById("category-select"),
  filtersEl: document.getElementById("filters"),
  dateFilterStartEl: document.getElementById("date-filter-start"),
  dateFilterEndEl: document.getElementById("date-filter-end"),
  resetFiltersBtn: document.getElementById("reset-filters-btn"),
  showPastEventsCheckbox: document.getElementById("show-past-events"),
  timelineGrid: document.getElementById("timeline-grid"),
  timelineEl: document.getElementById("timeline"),
  timelineWrap: document.getElementById("timeline-wrap"),
  timelineTooltip: document.getElementById("timeline-tooltip"),
  splitterEl: document.getElementById("splitter"),
  eventsTableBody: document.getElementById("events-table-body"),
  addEventBtn: document.getElementById("add-event-btn"),
  editCategoriesBtn: document.getElementById("edit-categories-btn"),
  categoriesModal: document.getElementById("categories-modal"),
  categoriesEditor: document.getElementById("categories-editor"),
  categoriesModalCancel: document.getElementById("categories-modal-cancel"),
  categoriesModalSave: document.getElementById("categories-modal-save"),
  eventModal: document.getElementById("event-modal"),
  eventForm: document.getElementById("event-form"),
  eventIdInput: document.getElementById("event-id"),
  eventTitleInput: document.getElementById("event-title"),
  eventDateInput: document.getElementById("event-date"),
  eventNotesInput: document.getElementById("event-notes"),
  eventTagsForm: document.getElementById("event-tags-form"),
  modalTitle: document.getElementById("modal-title"),
  modalCancel: document.getElementById("modal-cancel"),
  themeLightBtn: document.getElementById("theme-light"),
  themeDarkBtn: document.getElementById("theme-dark"),
};

// ---------------------------------------------------------------------------
// Theme: apply and persist
// ---------------------------------------------------------------------------
function applyTheme(theme) {
  state.theme = theme;
  document.documentElement.setAttribute("data-theme", theme);
  dom.themeLightBtn.classList.toggle("active", theme === "light");
  dom.themeDarkBtn.classList.toggle("active", theme === "dark");
  dom.themeLightBtn.setAttribute("aria-pressed", theme === "light");
  dom.themeDarkBtn.setAttribute("aria-pressed", theme === "dark");
}

// ---------------------------------------------------------------------------
// Timeline re-render (used by filters, category select, date range, etc.)
// ---------------------------------------------------------------------------
function onRenderTimeline() {
  renderTimeline(state, dom, (evt) => openEditEvent(evt, dom, (d, sel) => renderEventTagsForm(d, sel, state)));
}

// ---------------------------------------------------------------------------
// Event modal: add / edit and save
// ---------------------------------------------------------------------------
function handleOpenAddEvent() {
  openAddEvent(dom, state, (d, sel) => renderEventTagsForm(d, sel, state));
}

function handleOpenEditEvent(evt) {
  openEditEvent(evt, dom, (d, sel) => renderEventTagsForm(d, sel, state));
}

async function handleEventFormSubmit(e) {
  e.preventDefault();
  const payload = getEventFormData(dom, () => getFormTags(dom));
  const id = payload.id;
  const events = [...state.events];
  if (id) {
    const idx = events.findIndex((evt) => evt.id === id);
    if (idx >= 0) {
      events[idx] = { ...events[idx], ...payload };
    }
  } else {
    events.push({
      id: "evt-" + Date.now(),
      title: payload.title,
      date: payload.date,
      tags: payload.tags,
      notes: payload.notes,
    });
  }
  await saveEvents(events);
  state.events = events;
  dom.eventModal.classList.remove("open");
  onRenderTimeline();
}

// ---------------------------------------------------------------------------
// Categories modal: edit and save (with event tag remapping)
// ---------------------------------------------------------------------------
function handleOpenCategoriesModal() {
  renderCategoriesEditor(state, dom.categoriesEditor);
  dom.categoriesModal.classList.add("open");
}

async function handleSaveCategoriesModal() {
  try {
    const { newCategories, categoryMap, tagMap } = getCategoriesFromEditor(dom.categoriesEditor);
    const names = Object.keys(newCategories).filter((cat) => cat && cat.trim());
    if (names.length !== Object.keys(newCategories).length) {
      alert("Category names cannot be empty.");
      return;
    }
    if (names.length !== new Set(names).size) {
      alert("Category names must be unique.");
      return;
    }
    const updatedEvents = applyCategoryAndTagRenamesToEvents(
      state.events,
      categoryMap,
      tagMap,
      newCategories
    );
    await saveCategories(newCategories);
    await saveEvents(updatedEvents);
    state.events = updatedEvents;
    state.categories = newCategories;
    dom.categoriesModal.classList.remove("open");
    renderCategorySelect(state, dom.categorySelect);
    renderFilters(state, dom.filtersEl, onRenderTimeline);
    onRenderTimeline();
  } catch (err) {
    console.error("Save categories error:", err);
    alert("Failed to save: " + (err.message || String(err)));
  }
}

// ---------------------------------------------------------------------------
// Date filter helpers
// ---------------------------------------------------------------------------
function applyDateFilterFromInputs() {
  state.dateFilterStart = dom.dateFilterStartEl.value || null;
  state.dateFilterEnd = dom.dateFilterEndEl.value || null;
  onRenderTimeline();
}

function setDateRangeNextMonths(months) {
  const start = new Date();
  const end = new Date();
  end.setMonth(end.getMonth() + months);
  const startStr = start.toISOString().slice(0, 10);
  const endStr = end.toISOString().slice(0, 10);
  dom.dateFilterStartEl.value = startStr;
  dom.dateFilterEndEl.value = endStr;
  state.dateFilterStart = startStr;
  state.dateFilterEnd = endStr;
  onRenderTimeline();
}

// ---------------------------------------------------------------------------
// Splitter: resize timeline vs table (vertical drag)
// ---------------------------------------------------------------------------
const SPLITTER_MIN_PCT = 15;
const SPLITTER_MAX_PCT = 85;

function setupSplitter() {
  dom.splitterEl.addEventListener("mousedown", (e) => {
    e.preventDefault();
    function move(ev) {
      const rect = dom.timelineWrap.getBoundingClientRect();
      const pct = ((ev.clientY - rect.top) / rect.height) * 100;
      const clamped = Math.max(SPLITTER_MIN_PCT, Math.min(SPLITTER_MAX_PCT, pct));
      dom.timelineWrap.style.setProperty("--split-pct", String(clamped));
      dom.splitterEl.setAttribute("aria-valuenow", Math.round(clamped));
    }
    function up() {
      document.removeEventListener("mousemove", move);
      document.removeEventListener("mouseup", up);
    }
    document.addEventListener("mousemove", move);
    document.addEventListener("mouseup", up);
  });
}

// ---------------------------------------------------------------------------
// Resize: debounced timeline re-render
// ---------------------------------------------------------------------------
let resizeTimeout;
function onResize() {
  clearTimeout(resizeTimeout);
  resizeTimeout = setTimeout(onRenderTimeline, 100);
}

// ---------------------------------------------------------------------------
// Event listeners
// ---------------------------------------------------------------------------
function setupListeners() {
  dom.eventForm.addEventListener("submit", handleEventFormSubmit);
  dom.modalCancel.addEventListener("click", () => dom.eventModal.classList.remove("open"));
  dom.eventModal.addEventListener("click", (e) => {
    if (e.target === dom.eventModal) dom.eventModal.classList.remove("open");
  });

  dom.categorySelect.addEventListener("change", () => {
    state.swimlaneCategory = dom.categorySelect.value;
    onRenderTimeline();
  });

  dom.dateFilterStartEl.addEventListener("change", applyDateFilterFromInputs);
  dom.dateFilterEndEl.addEventListener("change", applyDateFilterFromInputs);
  document.querySelectorAll(".btn-date-range").forEach((btn) => {
    btn.addEventListener("click", () =>
      setDateRangeNextMonths(parseInt(btn.dataset.months, 10))
    );
  });

  dom.resetFiltersBtn.addEventListener("click", () => {
    state.activeFilters = {};
    state.dateFilterStart = null;
    state.dateFilterEnd = null;
    dom.dateFilterStartEl.value = "";
    dom.dateFilterEndEl.value = "";
    renderFilters(state, dom.filtersEl, onRenderTimeline);
    onRenderTimeline();
  });

  dom.showPastEventsCheckbox.addEventListener("change", () => {
    state.showPastEvents = dom.showPastEventsCheckbox.checked;
    onRenderTimeline();
  });

  dom.addEventBtn.addEventListener("click", handleOpenAddEvent);
  dom.editCategoriesBtn.addEventListener("click", handleOpenCategoriesModal);
  dom.categoriesModalCancel.addEventListener("click", () =>
    dom.categoriesModal.classList.remove("open")
  );
  dom.categoriesModal.addEventListener("click", (e) => {
    if (e.target === dom.categoriesModal) dom.categoriesModal.classList.remove("open");
  });
  dom.categoriesModalSave.addEventListener("click", () => handleSaveCategoriesModal());

  dom.themeLightBtn.addEventListener("click", async () => {
    applyTheme("light");
    try {
      const config = await api("/api/config");
      await saveConfig({ ...config, theme: "light" });
    } catch {
      await saveConfig({ theme: "light" });
    }
  });
  dom.themeDarkBtn.addEventListener("click", async () => {
    applyTheme("dark");
    try {
      const config = await api("/api/config");
      await saveConfig({ ...config, theme: "dark" });
    } catch {
      await saveConfig({ theme: "dark" });
    }
  });

  window.addEventListener("resize", onResize);
}

// ---------------------------------------------------------------------------
// Init: load data, apply theme, render, setup splitter and listeners
// ---------------------------------------------------------------------------
async function init() {
  const config = await loadConfig();
  state.theme =
    config.theme === "light" || config.theme === "dark" ? config.theme : "dark";
  applyTheme(state.theme);

  state.categories = await loadCategories();
  if (typeof state.categories !== "object") state.categories = {};
  state.events = await loadEvents();
  if (!Array.isArray(state.events)) state.events = [];

  renderCategorySelect(state, dom.categorySelect);
  renderFilters(state, dom.filtersEl, onRenderTimeline);
  setupSplitter();
  setupListeners();

  dom.showPastEventsCheckbox.checked = state.showPastEvents;

  onRenderTimeline();
}

init();
