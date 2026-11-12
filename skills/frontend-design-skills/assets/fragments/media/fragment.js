(() => {
  const root = document.querySelector('[data-fdm-ui="media"]');
  if (!root) return;
  const stage = root.querySelector("[data-media-stage]");
  const buttons = root.querySelectorAll("[data-play]");
  const iconHost = root.querySelector("[data-play-icon]");
  const status = root.querySelector("[data-media-status]");
  const seek = root.querySelector("[data-seek]");
  const elapsed = root.querySelector("[data-elapsed]");
  let playing = false;

  const playIcon = '<svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true"><path d="M8 5.5v13l11-6.5-11-6.5Z"/></svg>';
  const pauseIcon = '<svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true"><rect x="7" y="5.5" width="3.6" height="13" rx="1"/><rect x="13.4" y="5.5" width="3.6" height="13" rx="1"/></svg>';

  function format(seconds) {
    const m = Math.floor(seconds / 60).toString().padStart(2, "0");
    const s = Math.floor(seconds % 60).toString().padStart(2, "0");
    return `${m}:${s}`;
  }

  buttons.forEach((button) => {
    button.addEventListener("click", () => {
      playing = !playing;
      root.classList.toggle("md-playing", playing);
      buttons.forEach((item) => item.setAttribute("aria-label", playing ? "Pause episode 14" : "Play episode 14"));
      if (iconHost) iconHost.innerHTML = playing ? pauseIcon : playIcon;
      if (status) status.textContent = playing ? "Episode 14 playing. Audio is simulated in this fragment." : "Episode 14 paused.";
    });
  });

  if (seek) {
    seek.addEventListener("input", () => {
      if (elapsed) elapsed.textContent = format(Number(seek.value));
    });
  }

  const captions = root.querySelector(".md-text-control");
  if (captions) {
    captions.addEventListener("click", () => {
      const on = captions.getAttribute("aria-pressed") === "true";
      captions.setAttribute("aria-pressed", String(!on));
      if (status) status.textContent = `Captions ${on ? "off" : "on"}.`;
    });
  }

  root.querySelectorAll(".md-play-row").forEach((row) => {
    row.addEventListener("click", () => {
      const label = row.getAttribute("aria-label") || "episode";
      if (status) status.textContent = `Selected ${label.replace("Play ", "")}.`;
    });
  });
})();
