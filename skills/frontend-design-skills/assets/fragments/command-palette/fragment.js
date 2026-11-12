(() => {
  const root = document.querySelector('[data-fdm-ui="command-palette"]');
  if (!root) return;
  const input = root.querySelector("[data-cp-input]");
  const items = Array.from(root.querySelectorAll("[data-cp-item]"));
  const groups = Array.from(root.querySelectorAll("[data-cp-group]"));
  const empty = root.querySelector("[data-cp-none]");
  const count = root.querySelector("[data-cp-count]");
  const status = root.querySelector("[data-cp-status]");
  const close = root.querySelector("[data-cp-close]");

  function visibleItems() {
    return items.filter((item) => !item.closest("[data-cp-group]").hidden);
  }

  function filter() {
    const query = (input?.value || "").trim().toLowerCase();
    items.forEach((item) => {
      const haystack = `${item.dataset.cpItem || ""} ${item.textContent || ""}`.toLowerCase();
      item.closest("li").hidden = Boolean(query) && !haystack.includes(query);
    });
    groups.forEach((group) => {
      group.hidden = !group.querySelector("li:not([hidden])");
    });
    const n = visibleItems().length;
    if (empty) empty.hidden = n !== 0;
    if (count) count.textContent = `${n} ${n === 1 ? "result" : "results"}`;
    if (status) status.textContent = query ? `${n} results for ${query}.` : "Showing all commands.";
  }

  if (input) {
    input.addEventListener("input", filter);
    input.addEventListener("keydown", (event) => {
      if (event.key === "ArrowDown" || event.key === "ArrowUp") {
        event.preventDefault();
        const visible = visibleItems();
        if (!visible.length) return;
        const current = visible.indexOf(document.activeElement);
        const next = event.key === "ArrowDown"
          ? visible[(current + 1 + visible.length) % visible.length]
          : visible[(current - 1 + visible.length) % visible.length];
        next.focus();
      }
      if (event.key === "Escape") {
        input.value = "";
        filter();
        input.blur();
        if (status) status.textContent = "Palette search cleared.";
      }
    });
  }

  items.forEach((item) => {
    item.addEventListener("click", () => {
      if (status) status.textContent = `Opening ${item.dataset.cpItem}.`;
    });
  });

  if (close) {
    close.addEventListener("click", () => {
      if (status) status.textContent = "Command palette closed.";
      if (input) { input.value = ""; filter(); }
    });
  }
})();
