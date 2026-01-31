/**
 * Categories/tags editor modal: edit category names and tags, remap events, save.
 * Uses state and DOM refs; save goes through API (called from app).
 */

/**
 * Render the categories editor UI from state.categories.
 * Each category is a block with name input and tag rows (add/remove).
 * @param {object} state - Application state (categories)
 * @param {HTMLElement} categoriesEditor - Container for category blocks
 */
export function renderCategoriesEditor(state, categoriesEditor) {
  categoriesEditor.innerHTML = "";
  const cats = Object.entries(state.categories).map(([key, tags]) => ({
    key,
    name: key,
    tags: (tags || []).map((t) => ({ key: t, name: t })),
  }));

  for (const cat of cats) {
    const block = createCategoryBlock(cat);
    categoriesEditor.appendChild(block);
  }

  const addCatBtn = document.createElement("button");
  addCatBtn.type = "button";
  addCatBtn.className = "btn-add-category";
  addCatBtn.textContent = "+ Category";
  addCatBtn.addEventListener("click", () => {
    const key = "new-" + Date.now();
    const block = createCategoryBlock({ key, name: "", tags: [] });
    categoriesEditor.insertBefore(block, addCatBtn);
  });
  categoriesEditor.appendChild(addCatBtn);
}

/**
 * Create one category block DOM element (header + tag rows + add tag button).
 * @param {{ key: string, name: string, tags: Array<{ key: string, name: string }> }} cat - Category data
 * @returns {HTMLElement}
 */
function createCategoryBlock(cat) {
  const block = document.createElement("div");
  block.className = "cat-block";
  block.dataset.key = cat.key;

  const header = document.createElement("div");
  header.className = "cat-block-header";
  const nameInput = document.createElement("input");
  nameInput.type = "text";
  nameInput.value = cat.name;
  nameInput.placeholder = "Category name";
  const removeCatBtn = document.createElement("button");
  removeCatBtn.type = "button";
  removeCatBtn.className = "cat-block-remove";
  removeCatBtn.textContent = "×";
  removeCatBtn.title = "Remove category";
  removeCatBtn.addEventListener("click", () => block.remove());
  header.appendChild(nameInput);
  header.appendChild(removeCatBtn);
  block.appendChild(header);

  const tagsDiv = document.createElement("div");
  tagsDiv.className = "cat-block-tags";
  for (const tag of cat.tags || []) {
    tagsDiv.appendChild(createTagRow(tag.key, tag.name));
  }
  const addTagBtn = document.createElement("button");
  addTagBtn.type = "button";
  addTagBtn.className = "btn-add-tag";
  addTagBtn.textContent = "+ Tag";
  addTagBtn.addEventListener("click", () => {
    const row = createTagRow("new-" + Date.now(), "");
    tagsDiv.insertBefore(row, addTagBtn);
  });
  tagsDiv.appendChild(addTagBtn);
  block.appendChild(tagsDiv);

  return block;
}

/**
 * Create one tag row: input + remove button.
 * @param {string} tagKey - Data key for the tag
 * @param {string} tagName - Display value
 * @returns {HTMLElement}
 */
function createTagRow(tagKey, tagName) {
  const row = document.createElement("span");
  row.className = "cat-tag-row";
  row.dataset.tagKey = tagKey;
  const tagInput = document.createElement("input");
  tagInput.type = "text";
  tagInput.value = tagName;
  tagInput.placeholder = "Tag";
  const removeTagBtn = document.createElement("button");
  removeTagBtn.type = "button";
  removeTagBtn.className = "cat-tag-remove";
  removeTagBtn.textContent = "×";
  removeTagBtn.addEventListener("click", () => row.remove());
  row.appendChild(tagInput);
  row.appendChild(removeTagBtn);
  return row;
}

/**
 * Read category and tag names from the editor DOM; build rename maps for events.
 * @param {HTMLElement} categoriesEditor - Container with .cat-block elements
 * @returns {{ newCategories: Record<string, string[]>, categoryMap: Record<string, string>, tagMap: Record<string, Record<string, string>> }}
 */
export function getCategoriesFromEditor(categoriesEditor) {
  const newCategories = {};
  const categoryMap = {};
  const tagMap = {};
  const blocks = categoriesEditor.querySelectorAll(".cat-block");
  blocks.forEach((block) => {
    const oldKey = block.dataset.key;
    const nameInput = block.querySelector(".cat-block-header input");
    const catName = (nameInput && nameInput.value.trim()) || oldKey;
    const tagRows = block.querySelectorAll(".cat-tag-row");
    const tagNames = [];
    tagMap[oldKey] = {};
    tagRows.forEach((row) => {
      const tagKey = row.dataset.tagKey;
      const tagInput = row.querySelector("input");
      const tagName = (tagInput && tagInput.value.trim()) || tagKey;
      tagNames.push(tagName);
      tagMap[oldKey][tagKey] = tagName;
    });
    newCategories[catName] = tagNames;
    categoryMap[oldKey] = catName;
  });
  return { newCategories, categoryMap, tagMap };
}

/**
 * Apply category/tag renames to events (after editor save).
 * @param {Array<object>} events - Current events
 * @param {Record<string, string>} categoryMap - Old category key -> new name
 * @param {Record<string, Record<string, string>>} tagMap - Old cat key -> { old tag key -> new name }
 * @param {Record<string, string[]>} newCategories - New category name -> tag names
 * @returns {Array<object>} - Events with updated tags
 */
export function applyCategoryAndTagRenamesToEvents(
  events,
  categoryMap,
  tagMap,
  newCategories
) {
  const validNewCategories = new Set(Object.keys(newCategories));
  return events.map((evt) => {
    const newTags = {};
    for (const [oldCat, tagArr] of Object.entries(evt.tags || {})) {
      const newCat = categoryMap[oldCat] ?? oldCat;
      if (!validNewCategories.has(newCat)) continue;
      const mapped = (tagArr || [])
        .map((t) => tagMap[oldCat]?.[t] ?? t)
        .filter((t) => newCategories[newCat]?.includes(t));
      if (mapped.length) newTags[newCat] = mapped;
    }
    return { ...evt, tags: newTags };
  });
}
