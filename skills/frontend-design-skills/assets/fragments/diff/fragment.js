(() => {
  const root = document.querySelector('[data-fdm-ui="diff"]');
  if (!root) return;
  const status = root.querySelector("[data-diff-status]");
  const file = root.querySelector(".df-file");
  const accept = root.querySelector("[data-accept]");
  const request = root.querySelector("[data-request-changes]");

  if (accept) {
    accept.addEventListener("click", () => {
      if (file) file.classList.add("df-accepted");
      accept.textContent = "Changes accepted";
      accept.disabled = true;
      accept.setAttribute("aria-disabled", "true");
      if (status) status.textContent = "Changes accepted. The pull request is ready to merge.";
    });
  }
  if (request) {
    request.addEventListener("click", () => {
      if (status) status.textContent = "Change request noted. Add a review comment before submitting.";
    });
  }
})();
