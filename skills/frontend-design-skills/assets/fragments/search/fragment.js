(() => {
  const root = document.querySelector('[data-fdm-ui="search"]');
  if (!root) return;
  const form = root.querySelector("[data-search-form]");
  const input = root.querySelector("[data-search-input]");
  const results = Array.from(root.querySelectorAll(".sc-result"));
  const typeButtons = root.querySelectorAll("[data-category]");
  const updated = root.querySelector("[data-updated]");
  const title = root.querySelector("[data-search-title]");
  const summary = root.querySelector("[data-search-summary]");
  const range = root.querySelector("[data-result-range]");
  const none = root.querySelector("[data-no-results]");
  let category = "all";

  function apply() {
    const query = (input?.value || "").trim();
    const age = updated?.value || "any";
    let visible = 0;
    results.forEach((item) => {
      const typeMatch = category === "all" || item.dataset.category === category;
      const queryMatch = !query || item.textContent.toLowerCase().includes(query.toLowerCase());
      const ageMatch = age === "any" || item.dataset.age === age || (age === "month" && item.dataset.age === "week");
      item.hidden = !(typeMatch && queryMatch && ageMatch);
      if (!item.hidden) visible += 1;
    });
    if (title) title.textContent = `${visible} ${visible === 1 ? "result" : "results"} for “${query || "everything"}”`;
    if (summary) summary.textContent = `Sorted by relevance · ${age === "any" ? "any time" : age === "week" ? "updated in the past week" : "updated in the past month"}`;
    if (range) range.textContent = `Showing ${visible ? 1 : 0}–${visible} of ${visible} results`;
    if (none) none.hidden = visible !== 0;
  }

  typeButtons.forEach((button) => {
    button.addEventListener("click", () => {
      category = button.dataset.category;
      typeButtons.forEach((item) => item.setAttribute("aria-pressed", String(item === button)));
      apply();
    });
  });
  if (updated) updated.addEventListener("change", apply);
  if (input) input.addEventListener("input", apply);
  if (form) form.addEventListener("submit", (event) => { event.preventDefault(); apply(); });
  const clear = root.querySelector("[data-clear]");
  if (clear) {
    clear.addEventListener("click", () => {
      category = "all";
      typeButtons.forEach((item) => item.setAttribute("aria-pressed", String(item.dataset.category === "all")));
      if (input) input.value = "";
      if (updated) updated.value = "any";
      apply();
    });
  }
})();
