// Control Center (/tools/control-center/): renders the projects table from
// /assets/service/control-center-data.json and makes it editable in place.
//
// Filters: stream select, type segmented control, status segmented control.
// Sorting: stream order from the data, then task → project → process →
// asset → product → tool, with done rows at the end of their stream; each
// stream ends with a clickable "+" row that drafts a new project.
// Editing: names are contenteditable, type/status tags open a chip picker
// (one shared .cc__picker popover), the whole link cell starts link editing.
// Name/link commits touch only their own cell (no full re-render), so focus
// can move between editable cells with a single click.
// Edits are kept in localStorage under KEY; whenever the working copy
// differs from the shipped JSON, the export group shows (copy / download /
// discard). When the shipped JSON catches up with the saved edits (the repo
// got updated), the saved copy is dropped silently. Any runtime JS error is
// surfaced in the export note to make silent failures diagnosable.
(function () {
  var KEY = "cc-data";
  var TYPES = ["task", "project", "process", "asset", "product", "tool"];
  var TYPE_LABELS = {
    task: "Task",
    project: "Project",
    process: "Process",
    asset: "Asset",
    product: "Product",
    tool: "Tool",
  };
  var STATUS_LABELS = {
    backlog: "Backlog",
    planned: "Planned",
    "in-progress": "In progress",
    running: "Running",
    online: "Online",
    paused: "Paused",
    done: "Done",
    archived: "Archived",
  };
  // Each type has its own status set: tasks and projects go through the
  // full lifecycle, processes just run or pause, and products, tools and
  // assets are either online or archived.
  var TYPE_STATUSES = {
    task: ["backlog", "planned", "in-progress", "paused", "done"],
    project: ["backlog", "planned", "in-progress", "paused", "done"],
    process: ["running", "paused"],
    asset: ["online", "archived"],
    product: ["online", "archived"],
    tool: ["online", "archived"],
  };
  var DEFAULT_STATUS = {
    task: "backlog",
    project: "backlog",
    process: "running",
    asset: "online",
    product: "online",
    tool: "online",
  };
  // Within a type, rows sort from more complete to less complete; done and
  // archived are terminal and go to the end of the stream.
  var STATUS_RANK = {
    "in-progress": 0,
    running: 0,
    online: 0,
    paused: 1,
    planned: 2,
    backlog: 3,
    done: 4,
    archived: 4,
  };

  function isTerminal(status) {
    return status === "done" || status === "archived";
  }

  // When the type changes, an incompatible status maps to its closest
  // counterpart: terminal stays terminal, anything else becomes the new
  // type's default.
  function coerceStatus(project) {
    var allowed = TYPE_STATUSES[project.type];
    if (allowed.indexOf(project.status) !== -1) return;
    if (isTerminal(project.status)) {
      project.status = allowed.indexOf("archived") !== -1 ? "archived" : "done";
    } else {
      project.status = DEFAULT_STATUS[project.type];
    }
    if (project.status !== "in-progress") delete project.progress;
  }

  var tbody = document.querySelector("[data-cc-body]");
  var typeInputs = document.querySelectorAll("[data-cc-filter]");
  var statusInputs = document.querySelectorAll("[data-cc-status-filter]");
  var streamSelect = document.querySelector("[data-cc-stream-select]");
  var streamValue = document.querySelector("[data-cc-stream-value]");
  var exportBar = document.querySelector("[data-cc-export]");
  var exportNote = document.querySelector(".cc__export-note");
  var picker = document.querySelector("[data-cc-picker]");
  var pickerChips = document.querySelector("[data-cc-picker-chips]");
  var progressInput = document.querySelector("[data-cc-picker-progress]");
  if (!tbody) return;

  // Surface any runtime error in the export note instead of failing
  // silently — the first step of diagnosing "the button does nothing".
  window.addEventListener("error", function (event) {
    if (!exportBar || !exportNote) return;
    exportNote.textContent = "JS error: " + event.message;
    exportBar.hidden = false;
  });

  var shipped = null;
  var data = null;
  var modified = false;
  var pickerTarget = null; // {index, field}

  // Key-order-independent serialization, so "edited back to the original"
  // and a repo update that reorders keys both count as equal.
  function stable(value) {
    if (Array.isArray(value)) {
      return "[" + value.map(stable).join(",") + "]";
    }
    if (value && typeof value === "object") {
      return (
        "{" +
        Object.keys(value)
          .sort()
          .map(function (key) {
            return JSON.stringify(key) + ":" + stable(value[key]);
          })
          .join(",") +
        "}"
      );
    }
    return JSON.stringify(value);
  }

  function esc(text) {
    return String(text).replace(/[&<>"]/g, function (ch) {
      return { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[ch];
    });
  }

  function checkedValue(list) {
    var value = "all";
    list.forEach(function (input) {
      if (input.checked) value = input.value;
    });
    return value;
  }

  function save() {
    modified = stable(data) !== stable(shipped);
    try {
      if (modified) localStorage.setItem(KEY, JSON.stringify(data));
      else localStorage.removeItem(KEY);
    } catch (e) {
      /* Private mode etc. — edits then live only until reload. */
    }
    syncExportBar();
  }

  function syncExportBar() {
    if (!exportBar) return;
    exportBar.hidden = !modified;
    if (exportNote) exportNote.textContent = "Edited";
  }

  function progressOf(project) {
    if (isTerminal(project.status)) return 100;
    if (project.status === "in-progress") return project.progress || 0;
    return 0;
  }

  function sortedEntries() {
    var entries = data.projects.map(function (project, index) {
      return { project: project, index: index };
    });
    entries.sort(function (a, b) {
      var pa = a.project;
      var pb = b.project;
      // Drafts (still unnamed) stay at the very end, by the "+" row.
      var fa = pa.name === "" ? 2 : isTerminal(pa.status) ? 1 : 0;
      var fb = pb.name === "" ? 2 : isTerminal(pb.status) ? 1 : 0;
      if (fa !== fb) return fa - fb;
      var ta = TYPES.indexOf(pa.type);
      var tb = TYPES.indexOf(pb.type);
      if (ta !== tb) return ta - tb;
      var ra = STATUS_RANK[pa.status];
      var rb = STATUS_RANK[pb.status];
      if (ra !== rb) return ra - rb;
      var ga = progressOf(pa);
      var gb = progressOf(pb);
      if (ga !== gb) return gb - ga;
      return a.index - b.index;
    });
    return entries;
  }

  // The status tag doubles as a progress bar: done is fully filled,
  // in-progress is filled to its percentage (the number is not shown).
  function statusButtonHtml(project) {
    var style = "";
    if (isTerminal(project.status)) {
      style = ' style="background-color: var(--m__bg-surface)"';
    } else if (project.status === "in-progress") {
      var percent = Math.max(0, Math.min(100, project.progress || 0));
      style =
        ' style="background: linear-gradient(90deg, var(--m__bg-surface) ' +
        percent +
        "%, transparent " +
        percent +
        '%)"';
    }
    return (
      '<button type="button" class="m__tag cc__tag-button"' +
      ' data-cc-pick="status"' +
      style +
      ">" +
      STATUS_LABELS[project.status] +
      "</button>"
    );
  }

  function linkCellHtml(project) {
    if (project.link) {
      return (
        '<a href="' +
        esc(project.link) +
        '" target="_blank" rel="noopener">' +
        esc(project.link.replace(/^https?:\/\//, "")) +
        "</a>"
      );
    }
    return '<span class="cc__link-add">+ link</span>';
  }

  function render() {
    hidePicker();
    var typeMode = checkedValue(typeInputs);
    var statusMode = checkedValue(statusInputs);
    var streamMode = streamSelect ? streamSelect.value : "all";
    var entries = sortedEntries();
    tbody.innerHTML = "";
    var prevAddRow = null;
    data.streams.forEach(function (stream) {
      if (streamMode !== "all" && stream !== streamMode) return;
      var visible = entries.filter(function (entry) {
        return (
          entry.project.stream === stream &&
          (typeMode === "all" || entry.project.type === typeMode) &&
          (statusMode === "all" || entry.project.status === statusMode)
        );
      });
      visible.forEach(function (entry, position) {
        var project = entry.project;
        var tr = document.createElement("tr");
        tr.dataset.ccIndex = entry.index;
        if (isTerminal(project.status)) tr.classList.add("cc__done");
        tr.innerHTML =
          '<td class="cc__stream">' +
          (position === 0 ? esc(stream) : "") +
          "</td>" +
          '<td class="cc__name-cell"><strong' +
          ' contenteditable="plaintext-only" spellcheck="false"' +
          " data-cc-name>" +
          esc(project.name) +
          "</strong></td>" +
          '<td><button type="button" class="m__tag cc__tag-button"' +
          ' data-cc-pick="type">' +
          TYPE_LABELS[project.type] +
          "</button></td>" +
          "<td>" +
          statusButtonHtml(project) +
          "</td>" +
          '<td class="cc__link">' +
          linkCellHtml(project) +
          "</td>";
        tbody.appendChild(tr);
      });
      if (!visible.length) return;
      // Clickable empty row drafting a new project in this stream; it also
      // carries the stream-end divider.
      var addRow = document.createElement("tr");
      addRow.className = "cc__add";
      addRow.dataset.ccStream = stream;
      addRow.innerHTML =
        '<td class="cc__stream"></td><td colspan="4">+</td>';
      tbody.appendChild(addRow);
      prevAddRow = addRow;
    });
    if (prevAddRow) prevAddRow.classList.add("cc__last-add");
    tbody
      .querySelectorAll("tr.cc__add:not(.cc__last-add)")
      .forEach(function (row) {
        row.classList.add("cc__stream-end");
      });
    syncExportBar();
  }

  function rowIndex(node) {
    var tr = node.closest("tr");
    return tr ? Number(tr.dataset.ccIndex) : -1;
  }

  function rowFor(index) {
    return tbody.querySelector('tr[data-cc-index="' + index + '"]');
  }

  function updateStatusCell(index) {
    var tr = rowFor(index);
    if (!tr) return;
    var button = tr.querySelector('[data-cc-pick="status"]');
    if (button) button.outerHTML = statusButtonHtml(data.projects[index]);
  }

  // --- Chip picker (type / status) ---

  function showPicker(button, field) {
    pickerTarget = { index: rowIndex(button), field: field };
    var options =
      field === "type"
        ? TYPES
        : TYPE_STATUSES[data.projects[pickerTarget.index].type];
    var labels = field === "type" ? TYPE_LABELS : STATUS_LABELS;
    var current = data.projects[pickerTarget.index][field];
    pickerChips.innerHTML = options
      .map(function (value) {
        return (
          '<label class="m__chip"><input type="radio" name="cc-picker"' +
          ' value="' +
          value +
          '"' +
          (value === current ? " checked" : "") +
          " />" +
          labels[value] +
          "</label>"
        );
      })
      .join("");
    if (progressInput) {
      var showProgress =
        field === "status" &&
        data.projects[pickerTarget.index].status === "in-progress";
      progressInput.hidden = !showProgress;
      if (showProgress) {
        progressInput.value =
          data.projects[pickerTarget.index].progress || 0;
      }
    }
    picker.hidden = false;
    var rect = button.getBoundingClientRect();
    var width = picker.offsetWidth;
    picker.style.left =
      Math.max(8, Math.min(rect.left, window.innerWidth - width - 8)) + "px";
    picker.style.top = rect.bottom + 6 + "px";
  }

  function hidePicker() {
    if (picker && !picker.hidden) picker.hidden = true;
    pickerTarget = null;
  }

  if (picker) {
    picker.addEventListener("change", function (event) {
      if (!pickerTarget) return;
      if (event.target === progressInput) {
        // Commit of the percent closes the picker and re-sorts.
        render();
        return;
      }
      if (!event.target.matches("input")) return;
      var project = data.projects[pickerTarget.index];
      var value = event.target.value;
      if (pickerTarget.field === "status" && value === "in-progress") {
        // Keep the picker open so the percent can be typed right here.
        project.status = "in-progress";
        if (typeof project.progress !== "number") project.progress = 45;
        save();
        updateStatusCell(pickerTarget.index);
        if (progressInput) {
          progressInput.hidden = false;
          progressInput.value = project.progress;
          progressInput.focus();
          progressInput.select();
        }
        return;
      }
      project[pickerTarget.field] = value;
      if (pickerTarget.field === "status" && value !== "in-progress") {
        delete project.progress;
      }
      if (pickerTarget.field === "type") coerceStatus(project);
      save();
      render();
    });
    if (progressInput) {
      // Live fill while typing; Enter/blur (change) closes via render.
      progressInput.addEventListener("input", function () {
        if (!pickerTarget) return;
        var project = data.projects[pickerTarget.index];
        var percent = Math.max(
          0,
          Math.min(100, Number(progressInput.value) || 0)
        );
        project.progress = percent;
        save();
        updateStatusCell(pickerTarget.index);
      });
      progressInput.addEventListener("keydown", function (event) {
        if (event.key === "Enter") {
          event.preventDefault();
          render();
        }
      });
    }
    document.addEventListener("click", function (event) {
      if (picker.hidden) return;
      if (picker.contains(event.target)) return;
      if (event.target.closest("[data-cc-pick]")) return;
      hidePicker();
    });
    document.addEventListener("keydown", function (event) {
      if (event.key === "Escape") hidePicker();
    });
  }

  // --- Inline editing ---

  tbody.addEventListener("click", function (event) {
    var addRow = event.target.closest("tr.cc__add");
    if (addRow) {
      addProject(addRow.dataset.ccStream);
      return;
    }
    var pick = event.target.closest("[data-cc-pick]");
    if (pick) {
      var field = pick.dataset.ccPick;
      if (
        pickerTarget &&
        pickerTarget.index === rowIndex(pick) &&
        pickerTarget.field === field
      ) {
        hidePicker();
      } else {
        showPicker(pick, field);
      }
      return;
    }
    // The whole link cell is the edit target; the anchor itself still
    // opens the link.
    var linkCell = event.target.closest("td.cc__link");
    if (
      linkCell &&
      !event.target.closest("a") &&
      !event.target.closest("input")
    ) {
      startLinkEdit(linkCell);
    }
  });

  function addProject(stream) {
    var type =
      checkedValue(typeInputs) === "all" ? "task" : checkedValue(typeInputs);
    var status = checkedValue(statusInputs);
    if (status === "all" || TYPE_STATUSES[type].indexOf(status) === -1) {
      status = DEFAULT_STATUS[type];
    }
    data.projects.push({
      stream: stream,
      name: "",
      type: type,
      status: status,
      link: "",
    });
    render();
    var name = tbody.querySelector(
      'tr[data-cc-index="' + (data.projects.length - 1) + '"] [data-cc-name]'
    );
    if (name) name.focus();
  }

  tbody.addEventListener("focusout", function (event) {
    if (!event.target.matches("[data-cc-name]")) return;
    var index = rowIndex(event.target);
    var project = data.projects[index];
    var name = event.target.textContent.trim();
    if (!name) {
      if (!project.name) {
        // Abandoned draft row — remove it again.
        data.projects.splice(index, 1);
        save();
        render();
      } else {
        event.target.textContent = project.name;
      }
      return;
    }
    if (name === project.name) return;
    project.name = name;
    // No re-render: the cell already shows the typed name, and a rebuild
    // here would swallow the first click on the next editable cell.
    save();
  });

  tbody.addEventListener("keydown", function (event) {
    if (event.key !== "Enter") return;
    if (
      event.target.matches("[data-cc-name]") ||
      event.target.matches("[data-cc-link-input]")
    ) {
      event.preventDefault();
      event.target.blur();
    }
  });

  function startLinkEdit(cell) {
    var index = rowIndex(cell);
    cell.innerHTML =
      '<input type="text" class="cc__link-input" data-cc-link-input' +
      ' placeholder="https://..." value="' +
      esc(data.projects[index].link) +
      '" />';
    var input = cell.querySelector("input");
    var cancelled = false;
    input.focus();
    input.select();
    input.addEventListener("blur", function () {
      if (cancelled) return;
      var link = input.value.trim();
      if (link && !/^[a-z]+:\/\//i.test(link)) link = "https://" + link;
      data.projects[index].link = link;
      save();
      // Only this cell changes; a full re-render would swallow the first
      // click on whatever the user is moving to.
      cell.innerHTML = linkCellHtml(data.projects[index]);
    });
    input.addEventListener("keydown", function (event) {
      if (event.key === "Escape") {
        event.stopPropagation();
        cancelled = true;
        cell.innerHTML = linkCellHtml(data.projects[index]);
      }
    });
  }

  // --- Filters ---

  typeInputs.forEach(function (input) {
    input.addEventListener("change", render);
  });
  statusInputs.forEach(function (input) {
    input.addEventListener("change", render);
  });
  if (streamSelect) {
    streamSelect.addEventListener("change", function () {
      if (streamValue) {
        streamValue.textContent =
          streamSelect.options[streamSelect.selectedIndex].textContent;
      }
      render();
    });
  }

  // --- Export group ---

  function exportJson() {
    return JSON.stringify(data, null, 2) + "\n";
  }

  var copyButton = document.querySelector("[data-cc-copy]");
  if (copyButton) {
    copyButton.addEventListener("click", function () {
      navigator.clipboard.writeText(exportJson()).then(function () {
        var original = copyButton.textContent;
        copyButton.textContent = "Copied";
        setTimeout(function () {
          copyButton.textContent = original;
        }, 1500);
      });
    });
  }

  var downloadButton = document.querySelector("[data-cc-download]");
  if (downloadButton) {
    downloadButton.addEventListener("click", function () {
      var blob = new Blob([exportJson()], { type: "application/json" });
      var url = URL.createObjectURL(blob);
      var a = document.createElement("a");
      a.href = url;
      a.download = "control-center-data.json";
      a.click();
      URL.revokeObjectURL(url);
    });
  }

  var discardButton = document.querySelector("[data-cc-discard]");
  if (discardButton) {
    discardButton.addEventListener("click", function () {
      try {
        localStorage.removeItem(KEY);
      } catch (e) {
        /* noop */
      }
      data = JSON.parse(JSON.stringify(shipped));
      modified = false;
      render();
    });
  }

  // --- Boot ---

  fetch("/assets/service/control-center-data.json", { cache: "no-store" })
    .then(function (response) {
      return response.json();
    })
    .then(function (json) {
      shipped = json;
      var saved = null;
      try {
        saved = JSON.parse(localStorage.getItem(KEY));
      } catch (e) {
        /* noop */
      }
      if (saved && stable(saved) === stable(shipped)) {
        // The repo caught up with the local edits: drop them.
        try {
          localStorage.removeItem(KEY);
        } catch (e) {
          /* noop */
        }
        saved = null;
      }
      data = saved || JSON.parse(JSON.stringify(shipped));
      modified = !!saved;
      if (streamSelect) {
        data.streams.forEach(function (stream) {
          var option = document.createElement("option");
          option.value = stream;
          option.textContent = stream;
          streamSelect.appendChild(option);
        });
      }
      render();
    });
})();
