(() => {
  const root = document.querySelector('[data-fdm-ui="kanban"]');
  if (!root) return;
  const status = root.querySelector("[data-kb-status]");
  const cards = Array.from(root.querySelectorAll(".kb-card"));

  root.querySelectorAll("[data-filter]").forEach((button) => {
    button.addEventListener("click", () => {
      root.querySelectorAll("[data-filter]").forEach((item) => item.setAttribute("aria-pressed", String(item === button)));
      const filter = button.dataset.filter;
      let visible = 0;
      cards.forEach((card) => {
        const show = filter === "all" || (filter === "mine" && card.dataset.assignee === "amina") || (filter === "week" && card.dataset.due === "week");
        card.hidden = !show;
        if (show) visible += 1;
      });
      if (status) status.textContent = `Showing ${visible} ${visible === 1 ? "task" : "tasks"}${filter === "all" ? "" : ` for ${filter === "mine" ? "Amina" : "this week"}`}.`;
    });
  });
})();
