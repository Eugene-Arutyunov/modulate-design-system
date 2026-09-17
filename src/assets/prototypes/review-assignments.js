(() => {
  const key = "modulate-review-assignments";
  const people = ["Eugene Arutyunov", "Maya Chen", "Jordan Lee", "Sofia Martinez", "Daniel Kim", "Priya Shah", "Lena Ortiz"];
  const me = document.querySelector(".prototype-header__user-name")?.textContent.trim() || people[0];
  let assignments = {};
  function read() {
    try {
      const saved = JSON.parse(localStorage.getItem(key) || "{}");
      assignments = saved && typeof saved === "object" && !Array.isArray(saved) ? saved : {};
    }
    catch { /* Keep session state when storage is unavailable. */ }
  }
  read();
  const reportId = new URLSearchParams(location.search).get("reviewId");
  const report = document.querySelector("[data-moderation-review]");
  if (reportId && /^[a-z0-9]+$/.test(reportId) && report) {
    report.dataset.conversationId = reportId;
    report.querySelector("[data-review-assignee]").dataset.reviewAssignee = reportId;
  }
  const controls = Array.from(document.querySelectorAll("[data-review-assignee]"));
  const filter = document.querySelector("[data-assignee-filter]");
  function refresh() {
    controls.forEach(select => {
      select.value = people.includes(assignments[select.dataset.reviewAssignee]) ? assignments[select.dataset.reviewAssignee] : "";
      const label = select.closest("label").querySelector("[data-assignee-label]");
      label.textContent = select.value || "Unassigned";
      label.title = label.textContent;
    });
    document.dispatchEvent(new Event("review-assignment-change"));
  }
  controls.forEach(select => {
    select.add(new Option("Unassigned", ""));
    people.forEach(name => select.add(new Option(name, name)));
    select.addEventListener("change", () => {
      read();
      if (select.value) assignments[select.dataset.reviewAssignee] = select.value;
      else delete assignments[select.dataset.reviewAssignee];
      try { localStorage.setItem(key, JSON.stringify(assignments)); } catch { /* Session-only fallback. */ }
      refresh();
    });
  });
  if (filter) {
    [["All assignees", ""], ["Assigned to me", "me"], ["Unassigned", "unassigned"], ...people.map(name => [name, name])]
      .forEach(([label, value]) => filter.add(new Option(label, value)));
    const initial = new URLSearchParams(location.search).get("assignee") || "";
    filter.value = Array.from(filter.options).some(option => option.value === initial) ? initial : "";
  }
  if (filter) {
    const menu = document.querySelector("[data-assignee-menu]");
    const sync = () => menu.querySelectorAll("button").forEach(button => {
      const active = button.dataset.value === filter.value;
      button.classList.toggle("is-active", active);
      button.setAttribute("aria-checked", String(active));
    });
    Array.from(filter.options).forEach((option, index) => {
      if (index === 3) {
        const divider = document.createElement("div");
        divider.className = "review-assignee-menu-divider";
        divider.setAttribute("role", "separator");
        menu.append(divider);
      }
      const button = document.createElement("button");
      button.type = "button";
      button.className = "m__menu-button-item conversation-report__report-item moderation-table__status-option";
      button.setAttribute("role", "menuitemradio");
      button.dataset.value = option.value;
      const text = document.createElement("span");
      text.textContent = option.text;
      button.append(text);
      button.insertAdjacentHTML("beforeend", '<span class="conversation-report__report-item-icon moderation-table__status-option-check" aria-hidden="true"><svg viewBox="0 0 10 10"><use href="#checkmark"></use></svg></span>');
      button.addEventListener("click", () => {
        filter.value = option.value;
        filter.dispatchEvent(new Event("change", { bubbles: true }));
        menu.hidden = true;
        const trigger = menu.parentElement.querySelector("button");
        trigger.setAttribute("aria-expanded", "false");
        trigger.focus();
        queueMicrotask(sync);
      });
      menu.append(button);
    });
    filter.addEventListener("change", sync);
    document.addEventListener("review-assignment-change", sync);
    menu.parentElement.querySelector("button").addEventListener("click", sync);
    sync();
  }
  window.ReviewAssignments = {
    matches(id, value) {
      const assignee = assignments[id] || "";
      return !value || (value === "unassigned" ? !assignee : assignee === (value === "me" ? me : value));
    },
  };
  refresh();
  window.addEventListener("storage", event => { if (event.key === key || event.key === null) { read(); refresh(); } });
  window.addEventListener("pageshow", () => { read(); refresh(); });
})();
