(() => {
  const root = document.querySelector('[data-fdm-ui="table"]');
  if (!root) return;
  const body = root.querySelector("[data-table-body]");
  const rows = Array.from(root.querySelectorAll("tbody tr"));
  const filter = root.querySelector("[data-table-filter]");
  const status = root.querySelector("[data-status-filter]");
  const count = root.querySelector("[data-table-count]");
  const empty = root.querySelector("[data-table-empty]");
  const live = root.querySelector("[data-tbl-status]");
  let direction = {};

  function apply() {
    const query = (filter?.value || "").trim().toLowerCase();
    const selected = status?.value || "all";
    let visible = 0;
    rows.forEach((row) => {
      const text = row.textContent.toLowerCase();
      const show = (!query || text.includes(query)) && (selected === "all" || row.dataset.status === selected);
      row.hidden = !show;
      if (show) visible += 1;
    });
    if (count) count.textContent = `${visible} ${visible === 1 ? "invoice" : "invoices"}`;
    if (empty) empty.hidden = visible !== 0;
    if (live) live.textContent = `${visible} invoices shown.`;
  }

  if (filter) filter.addEventListener("input", apply);
  if (status) status.addEventListener("change", apply);

  root.querySelectorAll("[data-sort]").forEach((button) => {
    button.addEventListener("click", () => {
      const key = button.dataset.sort;
      const th = button.closest("th");
      const next = direction[key] === "ascending" ? "descending" : "ascending";
      direction = { [key]: next };
      root.querySelectorAll("th[aria-sort]").forEach((cell) => cell.setAttribute("aria-sort", "none"));
      th.setAttribute("aria-sort", next);
      const numeric = key === "amount";
      rows.sort((a, b) => {
        const av = numeric ? Number(a.dataset[key]) : a.dataset[key].toLowerCase();
        const bv = numeric ? Number(b.dataset[key]) : b.dataset[key].toLowerCase();
        if (av < bv) return next === "ascending" ? -1 : 1;
        if (av > bv) return next === "ascending" ? 1 : -1;
        return 0;
      });
      rows.forEach((row) => body.appendChild(row));
      if (live) live.textContent = `Sorted by ${key}, ${next}.`;
    });
  });

  const exportButton = root.querySelector("[data-export-invoices]");
  if (exportButton) {
    exportButton.addEventListener("click", () => {
      if (live) live.textContent = "Invoice export prepared as CSV.";
    });
  }
})();
