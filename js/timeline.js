/**
 * Timeline rendering: swimlanes, event blocks, tooltip, today line, events table.
 * Uses state and DOM refs provided by app.
 */

import {
  LABEL_COL_WIDTH,
  OVERLAP_GAP,
  ROW_GAP,
  LANE_PADDING,
  VERTICAL_STAGGER,
  EVENT_BLOCK_COLORS,
  DEFAULT_LANE_HEIGHT_PX,
} from "./constants.js";
import { getDateRange, dateToOffset, todayISO } from "./dateUtils.js";
import { filteredEvents } from "./filterUtils.js";

/**
 * Read --lane-height from CSS (px). Used for block size and lane height.
 * @returns {number}
 */
function getBlockSizePx() {
  const laneHeight = parseInt(
    getComputedStyle(document.documentElement)
      .getPropertyValue("--lane-height")
      .trim(),
    10
  );
  return (Number.isFinite(laneHeight) ? laneHeight : DEFAULT_LANE_HEIGHT_PX) - 16;
}

/**
 * Base lane height from CSS (for overlap expansion).
 * @returns {number}
 */
function getBaseLaneHeightPx() {
  const laneHeight = parseInt(
    getComputedStyle(document.documentElement)
      .getPropertyValue("--lane-height")
      .trim(),
    10
  );
  return Number.isFinite(laneHeight) ? laneHeight : DEFAULT_LANE_HEIGHT_PX;
}

/**
 * Lay out events in a single lane: compute positions and row wrapping for overlaps.
 * @param {Array<{ date: string, [key: string]: any }>} laneEvents - Events in this lane
 * @param {{ start: Date, end: Date }} range - Display date range
 * @param {number} trackWidth - Width of the track in px
 * @param {number} blockSize - Block size in px
 * @returns {{ placements: Array<{ evt: object, left: number, top: number, width: number, height: number, compact: boolean }>, laneHeight: number | null, hasOverlap: boolean }}
 */
export function layoutEventsInLane(laneEvents, range, trackWidth, blockSize) {
  if (!laneEvents.length) return { placements: [], laneHeight: null, hasOverlap: false };

  const items = laneEvents.map((evt) => ({
    evt,
    pos: dateToOffset(evt.date, range),
  }));
  items.sort((a, b) => a.pos - b.pos);

  const usableTrack = Math.max(0, trackWidth - blockSize);
  let hasOverlap = false;
  for (let i = 1; i < items.length; i++) {
    const prevLeft = items[i - 1].pos * usableTrack;
    const currIdeal = items[i].pos * usableTrack;
    if (currIdeal < prevLeft + blockSize + OVERLAP_GAP) {
      hasOverlap = true;
      break;
    }
  }

  const size = hasOverlap ? Math.max(36, Math.floor(blockSize * 0.8)) : blockSize;
  const gap = OVERLAP_GAP;
  const placements = [];
  let rowRight = 0;
  let rowTop = LANE_PADDING;
  let indexInRow = 0;
  const usableWithSize = Math.max(0, trackWidth - size);
  const baseLaneHeight = getBaseLaneHeightPx();

  for (let i = 0; i < items.length; i++) {
    const idealLeft = items[i].pos * usableWithSize;
    let left = idealLeft;
    if (left < rowRight) left = rowRight + gap;
    if (left + size > trackWidth) {
      rowTop += size + (indexInRow > 0 ? indexInRow * VERTICAL_STAGGER : 0) + ROW_GAP;
      rowRight = 0;
      indexInRow = 0;
      left = Math.min(idealLeft, trackWidth - size);
      if (left < 0) left = 0;
    }
    const top = hasOverlap ? rowTop + indexInRow * VERTICAL_STAGGER : rowTop;
    rowRight = left + size + gap;
    placements.push({
      evt: items[i].evt,
      left,
      top,
      width: size,
      height: size,
      compact: hasOverlap,
    });
    indexInRow++;
  }

  const contentHeight =
    rowTop +
    size +
    (indexInRow > 0 ? (indexInRow - 1) * VERTICAL_STAGGER : 0) +
    LANE_PADDING;
  const laneHeight = hasOverlap ? Math.max(baseLaneHeight, contentHeight) : contentHeight;
  return { placements, laneHeight, hasOverlap };
}

/**
 * Build tooltip DOM content for an event (title, date, tags, notes).
 * @param {object} evt - Event object
 * @returns {DocumentFragment | HTMLElement}
 */
export function buildEventTooltipContent(evt) {
  const root = document.createElement("div");
  const titleEl = document.createElement("div");
  titleEl.className = "tooltip-title";
  titleEl.textContent = evt.title || "Untitled";
  root.appendChild(titleEl);
  const dateEl = document.createElement("div");
  dateEl.className = "tooltip-date";
  dateEl.textContent = evt.date || "—";
  root.appendChild(dateEl);
  const tagsWrap = document.createElement("div");
  tagsWrap.className = "tooltip-tags";
  const tags = evt.tags || {};
  for (const [cat, tagList] of Object.entries(tags)) {
    if (!tagList || !tagList.length) continue;
    const catEl = document.createElement("div");
    catEl.className = "tooltip-cat";
    catEl.textContent = `${cat}: ${tagList.join(", ")}`;
    tagsWrap.appendChild(catEl);
  }
  if (tagsWrap.childNodes.length) root.appendChild(tagsWrap);
  if (evt.notes && evt.notes.trim()) {
    const notesEl = document.createElement("div");
    notesEl.className = "tooltip-notes";
    notesEl.textContent = evt.notes.trim();
    root.appendChild(notesEl);
  }
  return root;
}

/**
 * Stable color index from event id (for consistent block colors).
 * @param {string} id - Event id
 * @returns {number} - Index into EVENT_BLOCK_COLORS
 */
function eventColorIndex(id) {
  const hash = (id || "")
    .split("")
    .reduce((a, c) => (a << 5) - a + c.charCodeAt(0), 0);
  return Math.abs(hash) % EVENT_BLOCK_COLORS.length;
}

/**
 * Render the full timeline (header, swimlanes, event blocks, today line) and events table.
 * @param {object} state - Application state
 * @param {object} dom - DOM refs: timelineGrid, timelineEl, timelineWrap, timelineTooltip, eventsTableBody
 * @param {() => void} onEditEvent - Callback when user clicks an event (open edit modal)
 */
export function renderTimeline(state, dom, onEditEvent) {
  const events = filteredEvents(state);
  const range = getDateRange(events);
  const cat = state.swimlaneCategory;
  const tags = (state.categories[cat] || []);
  const dayMs = 24 * 60 * 60 * 1000;
  const totalDays = Math.ceil((range.end - range.start) / dayMs);
  const trackWidth = Math.max(
    200,
    (dom.timelineWrap && dom.timelineWrap.clientWidth)
      ? dom.timelineWrap.clientWidth - LABEL_COL_WIDTH
      : 600
  );
  const blockSize = getBlockSizePx();

  dom.timelineGrid.innerHTML = "";
  const existingTodayLine = dom.timelineEl.querySelector(".today-line");
  if (existingTodayLine) existingTodayLine.remove();

  // Header row with week labels
  const header = document.createElement("div");
  header.className = "timeline-header";
  const labelCol = document.createElement("div");
  labelCol.className = "timeline-label-col";
  labelCol.textContent = cat || "Category";
  header.appendChild(labelCol);
  const datesDiv = document.createElement("div");
  datesDiv.className = "timeline-dates";
  datesDiv.style.width = `${trackWidth}px`;
  for (let i = 0; i <= totalDays; i += 7) {
    const d = new Date(range.start);
    d.setDate(d.getDate() + i);
    const span = document.createElement("div");
    span.className = "timeline-date";
    span.textContent = `${d.getMonth() + 1}/${d.getDate()}`;
    datesDiv.appendChild(span);
  }
  header.appendChild(datesDiv);
  dom.timelineGrid.appendChild(header);

  if (!tags.length) {
    const empty = document.createElement("div");
    empty.className = "empty-state";
    empty.textContent =
      "No tags in this category. Add categories and tags in categories.yaml.";
    dom.timelineGrid.appendChild(empty);
    renderEventsTable(state, dom, onEditEvent);
    return;
  }

  for (const tag of tags) {
    const laneEvents = events.filter((evt) =>
      (evt.tags && evt.tags[cat] || []).includes(tag)
    );
    const { placements, laneHeight, hasOverlap } = layoutEventsInLane(
      laneEvents,
      range,
      trackWidth,
      blockSize
    );

    const lane = document.createElement("div");
    lane.className = "swimlane";
    const labelDiv = document.createElement("div");
    labelDiv.className = "swimlane-label";
    labelDiv.textContent = tag;
    const trackDiv = document.createElement("div");
    trackDiv.className = "swimlane-track";
    trackDiv.style.width = `${trackWidth}px`;
    lane.appendChild(labelDiv);
    lane.appendChild(trackDiv);

    if (hasOverlap && laneHeight != null) {
      lane.classList.add("has-overlap");
      lane.style.minHeight = `${laneHeight}px`;
    }

    for (const { evt, left, top, width, height, compact } of placements) {
      const block = document.createElement("div");
      const colorClass = EVENT_BLOCK_COLORS[eventColorIndex(evt.id)];
      block.className = `event-block ${colorClass}${compact ? " compact" : ""}`;
      block.textContent = evt.title;
      block.style.left = `${left}px`;
      block.style.top = `${top}px`;
      block.style.width = `${width}px`;
      block.style.height = `${height}px`;
      block.style.minWidth = `${width}px`;
      block.style.maxWidth = `${width}px`;
      block.addEventListener("mouseenter", () => showEventTooltip(block, evt, dom.timelineTooltip));
      block.addEventListener("mouseleave", () => hideEventTooltip(dom.timelineTooltip));
      block.addEventListener("click", () => onEditEvent(evt));
      trackDiv.appendChild(block);
    }
    dom.timelineGrid.appendChild(lane);
  }

  // Today vertical line
  const todayStr = todayISO();
  const rangeStart = range.start.getTime();
  const rangeEnd = range.end.getTime();
  const todayMs = new Date(todayStr).getTime();
  if (todayMs >= rangeStart && todayMs <= rangeEnd) {
    const pos = dateToOffset(todayStr, range);
    const lineLeft = LABEL_COL_WIDTH + pos * trackWidth;
    const todayLine = document.createElement("div");
    todayLine.className = "today-line";
    todayLine.setAttribute("aria-hidden", "true");
    todayLine.style.left = `${lineLeft}px`;
    dom.timelineEl.appendChild(todayLine);
  }

  renderEventsTable(state, dom, onEditEvent);
}

/**
 * Show tooltip at block position with event content.
 */
function showEventTooltip(block, evt, tooltipEl) {
  tooltipEl.replaceChildren(buildEventTooltipContent(evt));
  tooltipEl.classList.add("visible");
  tooltipEl.setAttribute("aria-hidden", "false");
  const rect = block.getBoundingClientRect();
  const ttRect = tooltipEl.getBoundingClientRect();
  let left = rect.left + (rect.width - ttRect.width) / 2;
  let top = rect.top - ttRect.height - 8;
  left = Math.max(8, Math.min(window.innerWidth - ttRect.width - 8, left));
  top = Math.max(8, Math.min(window.innerHeight - ttRect.height - 8, top));
  tooltipEl.style.left = `${left}px`;
  tooltipEl.style.top = `${top}px`;
}

/**
 * Hide the timeline tooltip.
 */
function hideEventTooltip(tooltipEl) {
  tooltipEl.classList.remove("visible");
  tooltipEl.setAttribute("aria-hidden", "true");
}

/**
 * Render the events table (same filtered events as timeline, sorted by date).
 * @param {object} state - Application state
 * @param {object} dom - DOM refs: eventsTableBody
 * @param {() => void} onEditEvent - Callback when user clicks a row title
 */
export function renderEventsTable(state, dom, onEditEvent) {
  const events = filteredEvents(state)
    .slice()
    .sort((a, b) => (a.date || "").localeCompare(b.date || ""));
  dom.eventsTableBody.innerHTML = "";

  const fragment = document.createDocumentFragment();
  for (const evt of events) {
    const tagValues = (evt.tags && Object.values(evt.tags))
      ? Object.values(evt.tags).flat()
      : [];
    const tr = document.createElement("tr");
    const titleCell = document.createElement("td");
    titleCell.className = "event-title-cell";
    titleCell.textContent = evt.title;
    titleCell.addEventListener("click", () => onEditEvent(evt));
    tr.appendChild(titleCell);
    const dateCell = document.createElement("td");
    dateCell.textContent = evt.date || "";
    tr.appendChild(dateCell);
    const tagsCell = document.createElement("td");
    const tagPills = document.createElement("div");
    tagPills.className = "table-pills";
    for (const tag of tagValues) {
      const pill = document.createElement("span");
      pill.className = "pill";
      pill.textContent = tag;
      tagPills.appendChild(pill);
    }
    tagsCell.appendChild(tagPills);
    tr.appendChild(tagsCell);
    const notesCell = document.createElement("td");
    notesCell.className = "notes-cell";
    notesCell.textContent = evt.notes || "";
    tr.appendChild(notesCell);
    fragment.appendChild(tr);
  }
  dom.eventsTableBody.appendChild(fragment);
}
