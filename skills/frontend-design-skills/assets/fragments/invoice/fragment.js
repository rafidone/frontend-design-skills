(() => {
  const root = document.querySelector('[data-fdm-ui="invoice"]');
  if (!root) return;
  const status = root.querySelector("[data-inv-status]");
  const print = root.querySelector("[data-print]");
  const send = root.querySelector("[data-send]");

  if (print) {
    print.addEventListener("click", () => {
      if (status) status.textContent = "Preparing invoice INV-2041 for print.";
      if (typeof window.print === "function") window.print();
    });
  }
  if (send) {
    send.addEventListener("click", () => {
      send.textContent = "Invoice sent";
      send.disabled = true;
      if (status) status.textContent = "Invoice INV-2041 queued for delivery to Meridian Labs finance.";
    });
  }
})();
