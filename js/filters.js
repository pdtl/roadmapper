/**
 * Sidebar filters: swimlane category select and tag filter chips.
 * Renders from state and updates state on user interaction.
 */

/**
 * Populate the swimlane category dropdown from state.categories.
 * Ensures swimlaneCategory stays valid (falls back to first category).
 * @param {object} state - Application state (categories, swimlaneCategory)
 * @param {HTMLSelectElement} categorySelect - Select element for category
 */
export function renderCategorySelect(state, categorySelect) {
  const cats = Object.keys(state.categories);
  categorySelect.innerHTML = "";
  if (!cats.length) {
    categorySelect.innerHTML = "<option>No categories</option>";
    return;
  }
  state.swimlaneCategory = state.swimlaneCategory || cats[0];
  if (!state.categories[state.swimlaneCategory]) {
    state.swimlaneCategory = cats[0];
  }
  for (const cat of cats) {
    const opt = document.createElement("option");
    opt.value = cat;
    opt.textContent = cat;
    if (cat === state.swimlaneCategory) opt.selected = true;
    categorySelect.appendChild(opt);
  }
}

/**
 * Render tag filter chips per category. Toggling a tag updates activeFilters and triggers callback.
 * @param {object} state - Application state (categories, activeFilters)
 * @param {HTMLElement} filtersEl - Container for filter chips
 * @param {() => void} onFilterChange - Called after filter change (e.g. re-render timeline)
 */
export function renderFilters(state, filtersEl, onFilterChange) {
  filtersEl.innerHTML = "";
  for (const [cat, tags] of Object.entries(state.categories)) {
    const catDiv = document.createElement("div");
    catDiv.className = "filter-cat";
    const span = document.createElement("span");
    span.textContent = `${cat}:`;
    catDiv.appendChild(span);
    const tagsDiv = document.createElement("div");
    tagsDiv.className = "filter-tags";
    for (const tag of tags || []) {
      const btn = document.createElement("button");
      btn.type = "button";
      btn.className = "filter-tag";
      btn.textContent = tag;
      const isActive = (state.activeFilters[cat] || []).includes(tag);
      if (isActive) btn.classList.add("active");
      btn.addEventListener("click", () => {
        const current = state.activeFilters[cat] || [];
        const next = current.includes(tag)
          ? current.filter((t) => t !== tag)
          : [...current, tag];
        state.activeFilters[cat] = next.length ? next : null;
        renderFilters(state, filtersEl, onFilterChange);
        onFilterChange();
      });
      tagsDiv.appendChild(btn);
    }
    catDiv.appendChild(tagsDiv);
    filtersEl.appendChild(catDiv);
  }
}
