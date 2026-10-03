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
  // Show the unassigned demo state once, including in existing prototype sessions.
  try {
    const demoKey = "modulate-review-assignment-demo-v2";
    if (!localStorage.getItem(demoKey)) {
      assignments["7622f4"] = ["Maya Chen"];
      assignments["7691d5"] = [];
      localStorage.setItem(key, JSON.stringify(assignments));
      localStorage.setItem(demoKey, "1");
    }
  } catch { /* Storage is optional for the prototype. */ }
  const reportId = new URLSearchParams(location.search).get("reviewId");
  const report = document.querySelector("[data-moderation-review]");
  if (reportId && /^[a-z0-9]+$/.test(reportId) && report) {
    report.dataset.conversationId = reportId;
    report.querySelector("[data-review-assignee]").dataset.reviewAssignee = reportId;
    report.querySelector("[data-assignment-avatar]").dataset.assignmentAvatar = reportId;
  }
  const controls = Array.from(document.querySelectorAll("[data-review-assignee]"));
  const filter = document.querySelector("[data-assignee-filter]");
  const initialMembers = Object.fromEntries(Array.from(document.querySelectorAll("[data-assignment-avatar]"), avatar => [avatar.dataset.assignmentAvatar, (avatar.dataset.initialMembers || "").split("|").filter(Boolean)]));
  const assignedPeople = id => {
    const value = Object.prototype.hasOwnProperty.call(assignments, id) ? assignments[id] : (initialMembers[id] || []);
    return (Array.isArray(value) ? value : [value]).filter(name => people.includes(name));
  };
  function refresh() {
    controls.forEach(select => {
      select.value = assignedPeople(select.dataset.reviewAssignee)[0] || "";
      const label = select.closest("label").querySelector("[data-assignee-label]");
      label.textContent = select.value || "Unassigned";
      label.title = label.textContent;
      const avatar = select.closest("[data-assignment-avatar]");
      if (avatar) {
        const trigger = avatar.querySelector(".review-assignment-avatar__trigger");
        const names = assignedPeople(select.dataset.reviewAssignee);
        trigger.replaceChildren();
        trigger.classList.toggle("has-members", !!names.length);
        if (names.length) {
          names.slice(0, 4).forEach(name => {
            const badge = document.createElement("span");
            badge.className = "moderation-participants__avatar";
            badge.textContent = name.split(" ").map(part => part[0]).slice(0, 2).join("");
            trigger.append(badge);
          });
          if (names.length > 4) {
            const more = document.createElement("span");
            more.className = "moderation-participants__avatar";
            more.textContent = "+" + (names.length - 4);
            trigger.append(more);
          }
        } else trigger.innerHTML = '<svg viewBox="0 0 32 32" aria-hidden="true"><path d="M16 6v20M6 16h20" fill="none" stroke="currentColor" stroke-width="4" stroke-linecap="butt"/></svg>';
        trigger.setAttribute("aria-label", select.value ? "Assigned to " + select.value + ". Change assignee" : "Assign reviewer");
        trigger.title = names.join(", ") || "Assign reviewer";

      }
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
  document.querySelectorAll("[data-assignment-avatar]").forEach(avatar => {
    const select = avatar.querySelector("select");
    const menu = avatar.querySelector('[role="menu"]');
    menu.classList.add("review-assignment-options");
    const search = document.createElement("input");
    search.type = "search";
    search.placeholder = "Search";
    search.setAttribute("aria-label", "Search members");
    menu.append(search);
    const heading = document.createElement("div");
    heading.className = "moderation-sort-heading";
    heading.textContent = "Assigned to";
    menu.append(heading);
    people.forEach(name => {
      const row = document.createElement("div");
      row.className = "review-filter-checkbox-row";
      const label = document.createElement("label");
      label.className = "m__checkbox-primary";
      const checkbox = document.createElement("input");
      checkbox.type = "checkbox";
      checkbox.setAttribute("aria-label", name);
      const sync = () => { checkbox.checked = assignedPeople(select.dataset.reviewAssignee).includes(name); };
      sync();
      document.addEventListener("review-assignment-change", sync);
      label.append(checkbox);
      label.insertAdjacentHTML("beforeend", '<svg aria-hidden="true"><use href="#checkmark"></use></svg>');
      label.addEventListener("click", event => event.stopPropagation());
      const toggle = () => {
        read();
        const names = new Set(assignedPeople(select.dataset.reviewAssignee));
        if (names.has(name)) names.delete(name); else names.add(name);
        assignments[select.dataset.reviewAssignee] = Array.from(names);
        try { localStorage.setItem(key, JSON.stringify(assignments)); } catch {}
        refresh();
      };
      checkbox.addEventListener("change", toggle);
      const button = document.createElement("button");
      button.type = "button";
      button.className = "m__menu-button-item";
      button.dataset.sortOption = name;
      const avatar = document.createElement("span");
      avatar.className = "moderation-participants__avatar review-assignment-options__avatar";
      avatar.setAttribute("aria-hidden", "true");
      avatar.textContent = name.split(/\s+/).map(part => part[0]).join("");
      const nameLabel = document.createElement("span");
      nameLabel.textContent = name;
      button.append(avatar, nameLabel);
      button.addEventListener("click", toggle);
      row.append(label, button);
      menu.append(row);
      search.addEventListener("input", () => { row.hidden = !name.toLowerCase().includes(search.value.toLowerCase()); });
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
      const names = assignedPeople(id);
      return !value || (value === "unassigned" ? !names.length : names.includes(value === "me" ? me : value));
    },
  };
  refresh();
  window.addEventListener("storage", event => { if (event.key === key || event.key === null) { read(); refresh(); } });
  window.addEventListener("pageshow", () => { read(); refresh(); });
})();
