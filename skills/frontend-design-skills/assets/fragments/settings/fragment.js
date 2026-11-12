(() => {
  const root = document.querySelector('[data-fdm-ui="settings"]');
  if (!root) return;
  const status = root.querySelector("[data-set-status]");
  const toggles = root.querySelectorAll("[data-toggle]");

  toggles.forEach((toggle) => {
    toggle.addEventListener("click", () => {
      const on = toggle.getAttribute("aria-checked") === "true";
      toggle.setAttribute("aria-checked", String(!on));
      const text = toggle.querySelector(".ui-visually-hidden");
      if (text) text.textContent = on ? "Off" : "On";
      const label = toggle.getAttribute("aria-labelledby");
      const labelText = label ? document.getElementById(label)?.textContent : "Setting";
      if (status) status.textContent = `${labelText} turned ${on ? "off" : "on"}.`;
    });
  });

  const save = root.querySelector("[data-save]");
  if (save) {
    save.addEventListener("click", () => {
      save.textContent = "Saved";
      if (status) status.textContent = "Workspace settings saved.";
      setTimeout(() => { save.textContent = "Save changes"; }, 1800);
    });
  }
  const reset = root.querySelector("[data-reset]");
  if (reset) {
    reset.addEventListener("click", () => {
      if (status) status.textContent = "Unsaved changes discarded.";
    });
  }
})();
