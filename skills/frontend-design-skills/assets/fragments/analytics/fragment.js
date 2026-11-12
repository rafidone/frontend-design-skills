(() => {
  const root = document.querySelector('[data-fdm-ui="analytics"]');
  if (!root) return;
  const status = root.querySelector("[data-range-status]");
  const rangeButtons = root.querySelectorAll("[data-range]");

  rangeButtons.forEach((button) => {
    button.addEventListener("click", () => {
      rangeButtons.forEach((item) => item.setAttribute("aria-pressed", String(item === button)));
      if (status) status.textContent = `Showing the last ${button.dataset.range} days.`;
    });
  });

  const exportButton = root.querySelector("[data-export]");
  if (exportButton) {
    exportButton.addEventListener("click", () => {
      const rows = [
        ["Day", "Sessions"],
        ["Mon 3", "2100"], ["Tue 4", "2600"], ["Wed 5", "2350"],
        ["Thu 6", "3100"], ["Fri 7", "3400"], ["Sat 8", "2900"], ["Sun 9", "3750"],
      ];
      const csv = rows.map((row) => row.join(",")).join("\n");
      const blob = new Blob([csv], { type: "text/csv;charset=utf-8" });
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = "sessions-nov-3-9-2026.csv";
      link.click();
      URL.revokeObjectURL(url);
      if (status) status.textContent = "Sessions CSV exported.";
    });
  }
})();
