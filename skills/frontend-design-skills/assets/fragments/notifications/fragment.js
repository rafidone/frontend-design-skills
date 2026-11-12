(() => {
  const root = document.querySelector('[data-fdm-ui="notifications"]');
  if (!root) return;
  const items = Array.from(root.querySelectorAll(".nt-item"));
  const filters = root.querySelectorAll("[data-type]");
  const status = root.querySelector("[data-notif-status]");
  const count = root.querySelector("[data-unread-count]");
  const markAll = root.querySelector("[data-mark-all]");

  function updateCount() {
    const unread = items.filter((item) => item.classList.contains("nt-unread")).length;
    if (count) count.textContent = unread === 0 ? "All caught up" : `${unread} unread`;
  }

  filters.forEach((button) => {
    button.addEventListener("click", () => {
      filters.forEach((item) => item.setAttribute("aria-pressed", String(item === button)));
      const type = button.dataset.type;
      items.forEach((item) => {
        item.hidden = type !== "all" && item.dataset.notifType !== type;
      });
      if (status) status.textContent = type === "all" ? "Showing all notifications." : `Showing ${type} notifications.`;
    });
  });

  if (markAll) {
    markAll.addEventListener("click", () => {
      items.forEach((item) => {
        item.classList.remove("nt-unread");
        const dot = item.querySelector(".nt-dot");
        if (dot) dot.remove();
      });
      markAll.disabled = true;
      updateCount();
      if (status) status.textContent = "All notifications marked as read.";
    });
  }
})();
