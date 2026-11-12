(() => {
  const root = document.querySelector('[data-fdm-ui="chat"]');
  if (!root) return;
  const form = root.querySelector("[data-chat-form]");
  const input = root.querySelector("[data-chat-input]");
  const thread = root.querySelector(".ch-thread");
  const status = root.querySelector("[data-chat-status]");
  const copyButton = root.querySelector("[data-copy-snippet]");

  if (input) {
    input.addEventListener("input", () => {
      input.style.height = "auto";
      input.style.height = `${Math.min(input.scrollHeight, 120)}px`;
    });
  }

  if (form && input && thread) {
    form.addEventListener("submit", (event) => {
      event.preventDefault();
      const text = input.value.trim();
      if (!text) {
        if (status) status.textContent = "Write a message before sending.";
        input.focus();
        return;
      }
      const item = document.createElement("li");
      item.className = "ch-msg ch-user ch-new";
      item.innerHTML = '<span class="ch-avatar ui-avatar-warm" aria-hidden="true">AF</span><div class="ch-bubble"><div class="ch-meta"><strong>Amina Farouk</strong><time></time></div><p></p></div>';
      const time = item.querySelector("time");
      time.textContent = new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
      item.querySelector("p").textContent = text;
      thread.appendChild(item);
      input.value = "";
      input.style.height = "auto";
      if (status) status.textContent = "Message added to the thread. Assistant replies are simulated in this fragment.";
      item.scrollIntoView({ block: "nearest" });
    });
  }

  const useful = root.querySelector(".ch-reaction[aria-pressed]");
  if (useful) {
    useful.addEventListener("click", () => {
      const next = useful.getAttribute("aria-pressed") !== "true";
      useful.setAttribute("aria-pressed", String(next));
    });
  }
  if (copyButton) {
    copyButton.addEventListener("click", async () => {
      const snippet = "--card-gap: 12px;\n--card-gap-narrow: 16px;\n--card-text-inset: 44px;";
      try {
        await navigator.clipboard.writeText(snippet);
        if (status) status.textContent = "Snippet copied to the clipboard.";
      } catch {
        if (status) status.textContent = "Snippet selected. Copy is unavailable in this context.";
      }
    });
  }
})();
