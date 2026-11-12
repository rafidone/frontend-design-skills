(() => {
  const root = document.querySelector('[data-fdm-ui="map"]');
  if (!root) return;
  const status = root.querySelector("[data-map-status]");
  const pins = root.querySelectorAll(".mp-pin");
  const sites = root.querySelectorAll(".mp-site");

  function select(name) {
    pins.forEach((pin) => pin.classList.toggle("is-selected", pin.dataset.site === name));
    sites.forEach((site) => {
      const active = site.dataset.site === name;
      site.classList.toggle("is-selected", active);
      site.setAttribute("aria-pressed", String(active));
    });
    const selected = root.querySelector(`.mp-site[data-site="${name}"] strong`);
    if (status) status.textContent = `${selected ? selected.textContent : name} selected.`;
  }

  pins.forEach((pin) => pin.addEventListener("click", () => select(pin.dataset.site)));
  sites.forEach((site) => site.addEventListener("click", () => select(site.dataset.site)));
})();
