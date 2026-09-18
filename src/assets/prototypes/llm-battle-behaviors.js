// Both views edit the same draft. Only Apply changes the page configuration.
export function createBehaviorEditor({ modal, trigger, onApply }) {
  const tabs = [...modal.querySelectorAll('[role="tab"]')];
  const panels = [...modal.querySelectorAll('[role="tabpanel"]')];
  const list = modal.querySelector('[data-vlb-behaviors-list]');
  const json = modal.querySelector('#vlb-behaviors-json');
  const error = modal.querySelector('#vlb-json-error');
  const status = modal.querySelector('[data-vlb-json-status]');
  const apply = modal.querySelector('[data-vlb-behaviors-apply]');
  const format = modal.querySelector('[data-vlb-json-format]');
  const copy = modal.querySelector('[data-vlb-json-copy]');
  const jsonActions = modal.querySelector('[data-vlb-json-actions]');
  const clone = (value) => JSON.parse(JSON.stringify(value));
  let catalog = new Map();
  let defaults = { behaviors: [] };
  let saved = clone(defaults);
  let draft = clone(defaults);
  let copyFeedbackTimer = null;

  modal.dataset.modalAutofocus = 'false';

  function setError(message = '') {
    error.textContent = message;
    error.hidden = !message;
    json.setAttribute('aria-invalid', String(Boolean(message)));
    apply.disabled = Boolean(message);
    format.disabled = Boolean(message);
    // Keep incomplete JSON intact until it can be represented as a list.
    tabs[0].disabled = Boolean(message);
  }

  function renderList() {
    const selected = new Set(draft.behaviors);
    const options = new Map(catalog);
    // Preserve IDs pasted into JSON even when they are outside this demo's presets.
    draft.behaviors.forEach((id) => {
      if (!options.has(id)) options.set(id, id);
    });
    const rows = [...options].map(([id, name]) => {
      const row = document.createElement('label');
      row.className = 'm__menu-button-item vlb-behaviors__item';
      const checkbox = document.createElement('span');
      checkbox.className = 'm__checkbox-primary';
      const input = document.createElement('input');
      input.type = 'checkbox';
      input.value = id;
      input.checked = selected.has(id);
      checkbox.append(input);
      const title = document.createElement('span');
      title.textContent = name;
      row.append(checkbox, title);
      return row;
    });
    list.replaceChildren(...rows);
  }

  function resetCopyFeedback() {
    window.clearTimeout(copyFeedbackTimer);
    copyFeedbackTimer = null;
    copy.textContent = 'Copy';
  }

  function writeJSON() {
    resetCopyFeedback();
    json.value = JSON.stringify(draft, null, 2);
    status.textContent = '';
    setError();
  }

  function readJSON() {
    resetCopyFeedback();
    status.textContent = '';
    let next;
    try {
      next = JSON.parse(json.value);
    } catch {
      setError('Invalid JSON. Check quotes, commas, and brackets before applying.');
      return false;
    }
    if (!next || typeof next !== 'object' || Array.isArray(next)
      || !Array.isArray(next.behaviors)
      || next.behaviors.some((id) => typeof id !== 'string' || !id.trim())) {
      setError('Use an object with a "behaviors" array of non-empty strings.');
      return false;
    }
    if (new Set(next.behaviors).size !== next.behaviors.length) {
      setError('Each behavior must appear only once. Remove duplicate entries.');
      return false;
    }
    draft = next;
    setError();
    renderList();
    return true;
  }

  function selectTab(index, focus = false) {
    if (tabs[index].disabled) return;
    tabs.forEach((tab, i) => {
      tab.setAttribute('aria-selected', String(i === index));
      tab.tabIndex = i === index ? 0 : -1;
      panels[i].hidden = i !== index;
    });
    jsonActions.hidden = panels[index].id !== 'vlb-json-panel';
    if (focus) tabs[index].focus();
  }

  tabs.forEach((tab, index) => {
    tab.addEventListener('click', () => selectTab(index));
    tab.addEventListener('keydown', (event) => {
      if (!['ArrowLeft', 'ArrowRight', 'Home', 'End'].includes(event.key)) return;
      event.preventDefault();
      const next = event.key === 'Home' ? 0 : event.key === 'End' ? tabs.length - 1
        : (index + (event.key === 'ArrowRight' ? 1 : -1) + tabs.length) % tabs.length;
      selectTab(next, true);
    });
  });

  trigger.addEventListener('click', () => {
    draft = clone(saved);
    writeJSON();
    renderList();
    selectTab(0);
  });

  list.addEventListener('change', (event) => {
    const input = event.target;
    if (!input.matches('input[type="checkbox"]')) return;
    draft.behaviors = input.checked
      ? [...draft.behaviors, input.value]
      : draft.behaviors.filter((id) => id !== input.value);
    writeJSON();
  });
  json.addEventListener('input', readJSON);
  format.addEventListener('click', () => {
    if (readJSON()) writeJSON();
  });
  copy.addEventListener('click', async () => {
    resetCopyFeedback();
    status.textContent = '';
    try {
      await navigator.clipboard.writeText(json.value);
      copy.textContent = 'Copied!';
      copyFeedbackTimer = window.setTimeout(resetCopyFeedback, 2000);
    } catch {
      json.focus();
      json.select();
      status.textContent = 'Press ⌘C or Ctrl+C to copy the selected JSON.';
    }
  });
  modal.querySelector('[data-vlb-behaviors-reset]').addEventListener('click', () => {
    draft = clone(defaults);
    writeJSON();
    renderList();
  });
  apply.addEventListener('click', () => {
    if (!readJSON()) return;
    saved = clone(draft);
    onApply();
    window.M.closeModal(modal);
  });

  // The shared modal handles closing and scroll lock; contain focus here.
  modal.addEventListener('keydown', (event) => {
    if (event.key !== 'Tab') return;
    const controls = [...modal.querySelectorAll('button, input, textarea, [tabindex]')]
      .filter((element) => !element.disabled && element.tabIndex >= 0 && element.getClientRects().length);
    const first = controls[0];
    const last = controls[controls.length - 1];
    if (event.shiftKey && document.activeElement === first) {
      event.preventDefault();
      last.focus();
    } else if (!event.shiftKey && document.activeElement === last) {
      event.preventDefault();
      first.focus();
    }
  });
  new MutationObserver(() => {
    if (modal.hidden) trigger.focus();
    else tabs.find((tab) => tab.getAttribute('aria-selected') === 'true').focus();
  }).observe(modal, { attributes: true, attributeFilter: ['hidden'] });

  return {
    getConfig: () => clone(saved),
    reset({ options, selected }) {
      catalog = new Map(options.map(({ id, name }) => [id, name]));
      defaults = { behaviors: [...selected] };
      saved = clone(defaults);
      draft = clone(defaults);
      writeJSON();
      renderList();
    },
  };
}
