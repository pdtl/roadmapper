/**
 * Event add/edit modal: form, tag selection, save.
 * Uses state and DOM refs; save goes through API (called from app).
 */

/**
 * Open modal for adding a new event (empty form, default today).
 * @param {object} dom - DOM refs: eventIdInput, eventTitleInput, eventDateInput, eventNotesInput, eventTagsForm, eventModal, modalTitle
 * @param {object} state - Application state (categories)
 * @param {() => void} renderEventTagsForm - Function to render tag form (state, dom)
 */
export function openAddEvent(dom, state, renderEventTagsForm) {
  dom.eventIdInput.value = "";
  dom.eventTitleInput.value = "";
  dom.eventDateInput.value = new Date().toISOString().slice(0, 10);
  dom.eventNotesInput.value = "";
  dom.modalTitle.textContent = "New event";
  renderEventTagsForm(dom, {});
  dom.eventModal.classList.add("open");
}

/**
 * Open modal for editing an existing event (form prefilled).
 * @param {object} evt - Event object to edit
 * @param {object} dom - DOM refs (same as openAddEvent)
 * @param {() => void} renderEventTagsForm - Function to render tag form (dom, selectedTags)
 */
export function openEditEvent(evt, dom, renderEventTagsForm) {
  dom.eventIdInput.value = evt.id;
  dom.eventTitleInput.value = evt.title;
  dom.eventDateInput.value = evt.date;
  dom.eventNotesInput.value = evt.notes || "";
  dom.modalTitle.textContent = "Edit event";
  renderEventTagsForm(dom, evt.tags || {});
  dom.eventModal.classList.add("open");
}

/**
 * Render the category/tag selection UI in the event form.
 * @param {object} dom - DOM refs: eventTagsForm
 * @param {Record<string, string[]>} selectedTags - { categoryName: [tag, ...] }
 * @param {object} state - Application state (categories)
 */
export function renderEventTagsForm(dom, selectedTags, state) {
  dom.eventTagsForm.innerHTML = "";
  for (const [cat, tags] of Object.entries(state.categories)) {
    const catLabel = document.createElement("div");
    catLabel.className = "form-tag-cat";
    catLabel.textContent = cat;
    dom.eventTagsForm.appendChild(catLabel);
    const opts = document.createElement("div");
    opts.className = "form-tag-options";
    for (const tag of tags || []) {
      const btn = document.createElement("button");
      btn.type = "button";
      btn.className = "form-tag-opt";
      btn.textContent = tag;
      if ((selectedTags[cat] || []).includes(tag)) btn.classList.add("selected");
      btn.addEventListener("click", () => btn.classList.toggle("selected"));
      opts.appendChild(btn);
    }
    dom.eventTagsForm.appendChild(opts);
  }
}

/**
 * Read selected tags from the event form DOM.
 * @param {object} dom - DOM refs: eventTagsForm
 * @returns {Record<string, string[]>} - { categoryName: [tag, ...] }
 */
export function getFormTags(dom) {
  const tags = {};
  const catLabels = dom.eventTagsForm.querySelectorAll(".form-tag-cat");
  const optGroups = dom.eventTagsForm.querySelectorAll(".form-tag-options");
  catLabels.forEach((label, i) => {
    const cat = label.textContent.trim();
    const opts = optGroups[i];
    if (!opts) return;
    const selected = [...opts.querySelectorAll(".form-tag-opt.selected")].map(
      (el) => el.textContent.trim()
    );
    if (selected.length) tags[cat] = selected;
  });
  return tags;
}

/**
 * Build event payload from form and return it (caller saves via API).
 * @param {object} dom - DOM refs: eventIdInput, eventTitleInput, eventDateInput, eventNotesInput
 * @param {object} getFormTags - Function (dom) => tags
 * @returns {{ id?: string, title: string, date: string, tags: object, notes?: string }}
 */
export function getEventFormData(dom, getFormTags) {
  const id = dom.eventIdInput.value.trim();
  const title = dom.eventTitleInput.value.trim();
  const date = dom.eventDateInput.value;
  const notes = (dom.eventNotesInput.value || "").trim();
  const tags = getFormTags(dom);
  return {
    id: id || undefined,
    title,
    date,
    tags,
    notes: notes || undefined,
  };
}
