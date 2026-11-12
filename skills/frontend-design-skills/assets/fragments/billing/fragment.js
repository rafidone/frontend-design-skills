(() => {
  const root = document.querySelector('[data-fdm-ui="billing"]');
  if (!root) return;
  const status = root.querySelector("[data-bill-status]");
  const announce = (message) => { if (status) status.textContent = message; };

  const actions = [
    ["[data-upgrade]", "Plan comparison opened. Scale is the recommended next tier."],
    ["[data-change]", "Plan options opened for the next billing cycle."],
    ["[data-payment]", "Payment method editor opened."],
    ["[data-add-seats]", "Five additional seats added to the next invoice."],
  ];
  actions.forEach(([selector, message]) => {
    const el = root.querySelector(selector);
    if (el) el.addEventListener("click", () => announce(message));
  });

  const cancel = root.querySelector("[data-cancel]");
  if (cancel) {
    cancel.addEventListener("click", () => announce("Cancellation needs confirmation. Your plan stays active until Dec 1, 2026."));
  }
  root.querySelectorAll(".bl-download").forEach((button) => {
    button.addEventListener("click", () => announce(`${button.getAttribute("aria-label") || "Invoice"} prepared for download.`));
  });
})();
