/**
 * Filtering logic for events (tag filters, date range, show past).
 * Pure functions that take state and return filtered lists.
 */

/**
 * Return events that pass all active filters.
 * - Tag filters: event must match at least one selected tag per category that has selections.
 * - Date range: event date within dateFilterStart..dateFilterEnd if set.
 * - Show past: if false, exclude events before today.
 * @param {object} state - Application state (events, activeFilters, dateFilterStart/End, showPastEvents)
 * @returns {Array<object>} - Filtered events
 */
export function filteredEvents(state) {
  let list = state.events;

  const hasTagFilter = Object.values(state.activeFilters).some(
    (arr) => arr && arr.length > 0
  );
  if (hasTagFilter) {
    list = list.filter((evt) => {
      for (const [cat, selectedTags] of Object.entries(state.activeFilters)) {
        if (!selectedTags || selectedTags.length === 0) continue;
        const evtTags = (evt.tags && evt.tags[cat]) || [];
        const match = selectedTags.some((t) => evtTags.includes(t));
        if (!match) return false;
      }
      return true;
    });
  }

  if (state.dateFilterStart) {
    list = list.filter((evt) => (evt.date || "") >= state.dateFilterStart);
  }
  if (state.dateFilterEnd) {
    list = list.filter((evt) => (evt.date || "") <= state.dateFilterEnd);
  }
  if (!state.showPastEvents) {
    const todayStr = new Date().toISOString().slice(0, 10);
    list = list.filter((evt) => (evt.date || "") >= todayStr);
  }

  return list;
}
