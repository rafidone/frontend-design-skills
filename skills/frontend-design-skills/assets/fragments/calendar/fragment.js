(() => {
  const root = document.querySelector('[data-fdm-ui="calendar"]');
  if (!root) return;
  const title = root.querySelector("[data-detail-title]");
  const when = root.querySelector("[data-detail-when]");
  const note = root.querySelector("[data-detail-note]");

  root.querySelectorAll("[data-event]").forEach((event) => {
    event.addEventListener("click", () => {
      if (title) title.textContent = event.dataset.event || "";
      if (when) when.textContent = `${event.dataset.when || ""} · ${event.dataset.where || ""}`;
      if (note) note.textContent = event.dataset.detail || "";
      root.querySelectorAll("[data-event]").forEach((item) => item.classList.remove("cal-selected"));
      event.classList.add("cal-selected");
    });
  });

  const today = root.querySelector("[data-today]");
  if (today) {
    today.addEventListener("click", () => {
      root.querySelectorAll(".cal-day").forEach((day) => day.classList.remove("cal-today"));
      const current = root.querySelector(".cal-day");
      if (current) current.classList.add("cal-today");
      if (note) note.textContent = "Returned to the current week.";
    });
  }
})();
