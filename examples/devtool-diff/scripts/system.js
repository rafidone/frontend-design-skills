/* Interface behaviour: menu, section-aware navigation and studio hours. */
(function () {
  "use strict";

  var root = document.documentElement;
  root.classList.add("has-js");

  /* Accessible disclosure menu. */
  var header = document.querySelector("[data-fdm-header]");
  var toggle = document.querySelector("[data-fdm-nav-toggle]");
  var menu = document.querySelector("[data-fdm-nav-menu]");
  var mq = window.matchMedia("(min-width: 861px)");

  if (header && toggle && menu) {
    var closeMenu = function (returnFocus) {
      header.removeAttribute("data-fdm-nav-open");
      toggle.setAttribute("aria-expanded", "false");
      if (returnFocus) {
        toggle.focus();
      }
    };

    var openMenu = function () {
      header.setAttribute("data-fdm-nav-open", "true");
      toggle.setAttribute("aria-expanded", "true");
      var firstLink = menu.querySelector("a");
      if (firstLink) {
        firstLink.focus();
      }
    };

    toggle.addEventListener("click", function () {
      if (toggle.getAttribute("aria-expanded") === "true") {
        closeMenu(false);
      } else {
        openMenu();
      }
    });

    menu.addEventListener("click", function (event) {
      if (event.target.closest("a")) {
        closeMenu(false);
      }
    });

    document.addEventListener("keydown", function (event) {
      if (event.key === "Escape" && toggle.getAttribute("aria-expanded") === "true") {
        closeMenu(true);
      }
    });

    document.addEventListener("click", function (event) {
      if (
        toggle.getAttribute("aria-expanded") === "true" &&
        !header.contains(event.target) &&
        !menu.contains(event.target)
      ) {
        closeMenu(false);
      }
    });

    mq.addEventListener("change", function (event) {
      if (event.matches) {
        closeMenu(false);
      }
    });
  }

  /* Mark the section currently in view in the primary navigation. */
  var nav = document.querySelector("[data-fdm-nav]");
  if (nav) {
    var links = Array.prototype.slice.call(nav.querySelectorAll('a[href^="#"]'));
    var sections = links
      .map(function (link) {
        var id = link.getAttribute("href").slice(1);
        return id ? document.getElementById(id) : null;
      })
      .filter(Boolean);

    var setCurrent = function (section) {
      links.forEach(function (link) {
        if (section && link.getAttribute("href") === "#" + section.id) {
          link.setAttribute("aria-current", "location");
        } else {
          link.removeAttribute("aria-current");
        }
      });
    };

    if ("IntersectionObserver" in window && sections.length) {
      var visible = new Map();
      var observer = new IntersectionObserver(
        function (entries) {
          entries.forEach(function (entry) {
            if (entry.isIntersecting) {
              visible.set(entry.target.id, entry.intersectionRatio);
            } else {
              visible.delete(entry.target.id);
            }
          });

          var best = null;
          visible.forEach(function (ratio, id) {
            if (!best || ratio > best.ratio) {
              best = { id: id, ratio: ratio };
            }
          });

          if (best) {
            setCurrent(document.getElementById(best.id));
          }
        },
        { rootMargin: "-24% 0px -58% 0px", threshold: [0, 0.2, 0.5, 1] }
      );

      sections.forEach(function (section) {
        observer.observe(section);
      });
    }
  }

  /* Optional opening-hours line. Uses the visitor's local time unless a zone is supplied. */
  document.querySelectorAll("[data-fdm-hours]").forEach(function (el) {
    var status = el.querySelector("[data-fdm-hours-status]");
    if (!status) {
      return;
    }

    var openHour = Number(el.getAttribute("data-open-hour") || 9);
    var closeHour = Number(el.getAttribute("data-close-hour") || 17);
    var days = (el.getAttribute("data-days") || "1,2,3,4,5")
      .split(",")
      .map(function (day) {
        return Number(day.trim());
      });

    var now = new Date();
    var zone = el.getAttribute("data-time-zone");
    var day = now.getDay();
    var minutes = now.getHours() * 60 + now.getMinutes();

    if (zone) {
      try {
        var parts = new Intl.DateTimeFormat("en-GB", {
          timeZone: zone,
          weekday: "short",
          hour: "numeric",
          minute: "numeric",
          hourCycle: "h23"
        }).formatToParts(now);
        var values = {};
        parts.forEach(function (part) {
          values[part.type] = part.value;
        });
        var weekdays = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
        day = weekdays.indexOf(values.weekday);
        minutes = Number(values.hour) * 60 + Number(values.minute);
      } catch (error) {
        day = now.getDay();
        minutes = now.getHours() * 60 + now.getMinutes();
      }
    }

    var isOpen = days.indexOf(day) !== -1 && minutes >= openHour * 60 && minutes < closeHour * 60;
    status.textContent = isOpen ? "Open now" : "Closed now";
    el.setAttribute("data-state", isOpen ? "open" : "closed");
  });
})();

/* Copy the install command from the hero artifact. */
(function () {
  document.querySelectorAll("[data-fdm-copy]").forEach(function (button) {
    button.addEventListener("click", function () {
      var value = button.getAttribute("data-fdm-copy") || "";
      var done = function () {
        button.textContent = "Copied";
        window.setTimeout(function () { button.textContent = "Copy"; }, 1400);
      };
      if (navigator.clipboard && navigator.clipboard.writeText) {
        navigator.clipboard.writeText(value).then(done).catch(function () { done(); });
      } else {
        done();
      }
    });
  });
})();
