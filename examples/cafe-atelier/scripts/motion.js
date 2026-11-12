/* Entrance motion for hero content. Short, one-shot, and opt-out friendly. */
(function () {
  "use strict";

  var root = document.documentElement;
  var query = window.matchMedia("(prefers-reduced-motion: reduce)");

  if (!query.matches) {
    root.classList.add("fdm-motion");
  }

  function startEntrance() {
    if (query.matches) {
      root.classList.remove("fdm-motion");
      return;
    }

    var items = Array.prototype.slice.call(document.querySelectorAll("[data-enter]"));

    items.forEach(function (item, index) {
      if (!item.closest("[data-enter-group]") && !item.style.getPropertyValue("--enter-delay")) {
        item.style.setProperty("--enter-delay", index * 70 + "ms");
      }

      item.classList.add("is-entering");
      item.addEventListener(
        "animationend",
        function () {
          item.classList.remove("is-entering");
          item.style.opacity = "1";
        },
        { once: true }
      );
    });

    if (!items.length) {
      root.classList.remove("fdm-motion");
    }
  }

  function boot() {
    window.requestAnimationFrame(function () {
      window.requestAnimationFrame(startEntrance);
    });
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", boot, { once: true });
  } else {
    boot();
  }

  query.addEventListener("change", function (event) {
    if (event.matches) {
      root.classList.remove("fdm-motion");
      document.querySelectorAll("[data-enter]").forEach(function (item) {
        item.classList.remove("is-entering");
        item.style.opacity = "1";
      });
    }
  });
})();
