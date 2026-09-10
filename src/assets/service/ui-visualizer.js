/**
 * UI Scheme: one page table with structure and screenshot comparison views.
 * Data and rendering can be extended without changing the load flow.
 */

const UI_STRUCTURE_ID = 'ui-structure';

/**
 * Normalizes raw YAML into a fixed shape. Extend here when ui.yaml format changes.
 * Expects { current: routes[], target: routes[] }. Each section is
 * { section: { widget? | widgets? | text-content? } }.
 * Normalized section has type: 'widget' | 'widgets' | 'text-content' and the
 * corresponding payload.
 */
function normalizeSection(item) {
  const s = item?.section ?? item;
  if (!s || typeof s !== 'object') {
    return { type: 'widget', widget: '', states: [] };
  }
  if (
    s['text-content'] !== undefined &&
    s.widget === undefined &&
    s.widgets === undefined &&
    s.group === undefined
  ) {
    return {
      type: 'text-content',
      name: typeof s['text-content'] === 'string' ? s['text-content'] : '',
    };
  }
  if (s.widgets !== undefined) {
    return { type: 'widgets', widgets: Array.isArray(s.widgets) ? s.widgets : [] };
  }
  if (s.widget !== undefined) {
    return {
      type: 'widget',
      widget: s.widget ?? '',
      states: Array.isArray(s.states) ? s.states : [],
    };
  }
  if (s.group !== undefined && typeof s.group === 'object') {
    const g = s.group;
    const widgets = Array.isArray(g.widgets)
      ? g.widgets
      : g.widget !== undefined && g.widget !== ''
        ? [g.widget]
        : [];
    return { type: 'widgets', widgets };
  }
  return { type: 'widget', widget: '', states: [] };
}

function normalizeSubsection(s) {
  return {
    title: typeof s?.title === 'string' ? s.title : '',
    sections: (s?.sections ?? []).map(normalizeSection),
  };
}

function normalizeRouteList(routes) {
  return (routes ?? []).map((r) => {
    const routes = Array.isArray(r.routes)
      ? r.routes.filter((x) => typeof x === 'string' && x.length > 0)
      : r.route
        ? [r.route]
        : [];
    return {
      id: r.id ?? r.route ?? (Array.isArray(r.routes) ? r.routes[0] : '') ?? '',
      routes,
      title: r.title ?? '',
      title_deprecated:
        typeof r.title_deprecated === 'string' ? r.title_deprecated : '',
      sections: (r.sections ?? []).map(normalizeSection),
      subsections: Array.isArray(r.subsections)
        ? r.subsections.map(normalizeSubsection)
        : [],
    };
  });
}

function renderRouteBody(cell, route) {
  const hasSections = route?.sections?.length > 0;
  const hasSubsections = route?.subsections?.length > 0;
  if (!hasSections && !hasSubsections) {
    const empty = document.createElement('p');
    empty.className = 'ui-viz__empty';
    empty.textContent = '—';
    cell.appendChild(empty);
    return;
  }
  if (hasSections) {
    cell.appendChild(renderSectionsList(route.sections));
  }
  if (hasSubsections) {
    const wrap = document.createElement('div');
    wrap.className = 'ui-viz__subsections';
    route.subsections.forEach((sub) => {
      const block = document.createElement('div');
      block.className = 'ui-viz__subsection';
      const heading = document.createElement('h3');
      heading.className = 'ui-viz__subsection-title';
      heading.textContent = sub.title;
      block.appendChild(heading);
      if (sub.sections?.length) {
        block.appendChild(renderSectionsList(sub.sections));
      }
      wrap.appendChild(block);
    });
    cell.appendChild(wrap);
  }
}

function renderSectionsList(sections, listClass) {
  const list = document.createElement('ul');
  list.className = listClass ?? 'ui-viz__sections';
  (sections ?? []).forEach((section) => {
    const li = document.createElement('li');
    li.className = `ui-viz__section ui-viz__section--${section.type}`;
    if (section.type === 'widget') {
      const frame = document.createElement('div');
      frame.className = 'ui-viz__section-frame';
      const subList = document.createElement('ul');
      subList.className = 'ui-viz__section-frame-list';
      const subLi = document.createElement('li');
      subLi.className = 'ui-viz__section-frame-item';
      const widgetSpan = document.createElement('span');
      widgetSpan.className = 'ui-viz__widget';
      widgetSpan.textContent = section.widget;
      subLi.appendChild(widgetSpan);
      if (section.states && section.states.length > 0) {
        const statesEl = document.createElement('span');
        statesEl.className = 'ui-viz__states';
        statesEl.textContent = ` (${section.states.join(', ')})`;
        subLi.appendChild(statesEl);
      }
      subList.appendChild(subLi);
      frame.appendChild(subList);
      li.appendChild(frame);
    } else if (section.type === 'widgets' && section.widgets && section.widgets.length > 0) {
      const frame = document.createElement('div');
      frame.className = 'ui-viz__section-frame';
      const subList = document.createElement('ul');
      subList.className = 'ui-viz__section-frame-list';
      section.widgets.forEach((name) => {
        const subLi = document.createElement('li');
        subLi.className = 'ui-viz__section-frame-item';
        subLi.textContent = name;
        subList.appendChild(subLi);
      });
      frame.appendChild(subList);
      li.appendChild(frame);
    } else if (section.type === 'text-content') {
      li.textContent = section.name;
    }
    list.appendChild(li);
  });
  return list;
}

const ui = { data: null, checks: [], mode: 'scheme', compareError: null };
function node(tag, className, text) {
  const element = document.createElement(tag);
  if (className) element.className = className;
  if (text !== undefined) element.textContent = text;
  return element;
}
function routePaths(route) { return (route?.routes || [route?.route]).filter(value => typeof value === 'string' && value.startsWith('/')); }
function empty() { return node('p', 'ui-viz__empty', '—'); }
function link(label, href, className) {
  const element = node('a', className, label);
  element.href = href; element.target = '_blank'; element.rel = 'noopener'; return element;
}
function imageURL(value) { return typeof value === 'string' && /^\/ui-audit\/[a-z0-9][a-z0-9._-]*\.png$/i.test(value) ? value : null; }
function renderStructure(cell, route, side) {
  const paths = routePaths(route);
  if (!paths.length) { cell.append(empty()); return; }
  paths.forEach(url => cell.append(link(url, side === 'prototype' ? url : `https://platform.modulate.ai${url}`, 'ui-viz__route-path')));
  renderRouteBody(cell, normalizeRouteList([route])[0]);
}
function captureURL(value) {
  try { const url = new URL(value); return ['http:', 'https:'].includes(url.protocol) ? url.href : null; }
  catch { return null; }
}
function renderDifferences(pair, route, check) {
  if (!imageURL(check.screenshots?.prototype) || !imageURL(check.screenshots?.production)) return;
  const block = node('div', 'ui-viz__differences');
  if (check.fingerprint !== route.fingerprint) block.append(node('p', 'caption', 'Prototype changed. Capture again to compare.'));
  else if (check.status === 'match') block.append(node('p', 'caption', 'No differences detected.'));
  const findings = check.reviewedFindings || check.findings;
  if (findings?.length) {
    const heading = node('p');
    heading.append(node('strong', '', 'Conclusion:')); block.append(heading);
    const list = node('ul', 'ui-viz__differences-list');
    findings.forEach(finding => list.append(node('li', '', finding))); block.append(list);
  }
  const diff = imageURL(check.screenshots?.diff);
  if (diff) block.append(link('Pixel differences', diff));
  if (block.childElementCount) pair.prepend(block);
}
function renderComparison(cell, route, checks) {
  for (const check of checks.length ? checks : [{ scenario: 'default' }]) {
    const pair = node('div', 'ui-viz__comparison-state'); pair.dataset.scenario = check.scenario;
    for (const side of ['prototype', 'production']) {
      const figure = node('figure', 'ui-viz__screenshot'); figure.dataset.side = side;
      figure.dataset.label = side === 'prototype' ? 'Prototype' : 'Production';
      const caption = node('figcaption', 'caption');
      if (checks.length > 1 || check.scenario !== 'default') caption.textContent = check.scenario;
      const address = node('div', 'ui-viz__capture-url');
      const src = imageURL(check.screenshots?.[side]), url = captureURL(check.urls?.[side]);
      if (src && url) {
        const { pathname, search, hash } = new URL(url);
        address.append(link(`${pathname.replace(/\/$/, '') || '/'}${search}${hash}`, url, 'ui-viz__route-path'));
      }
      const preview = node('div', 'ui-viz__preview');
      if (src) {
        const anchor = link('', src), image = node('img');
        image.src = src; image.alt = `${figure.dataset.label}: ${route.title}, ${check.scenario}`; image.loading = 'lazy';
        image.addEventListener('error', () => {
          anchor.replaceWith(empty()); address.replaceChildren();
          pair.querySelector('.ui-viz__differences')?.remove();
        });
        anchor.append(image); preview.append(anchor);
      } else preview.append(empty());
      figure.append(caption, address, preview); pair.append(figure);
    }
    renderDifferences(pair, route, check); cell.append(pair);
  }
}
function renderTable(container) {
  const table = node('table', `ui-viz__table ui-viz__table--${ui.mode}`);
  const columns = node('colgroup');
  [24, 38, 38].forEach(width => { const column = node('col'); column.style.width = `${width}%`; columns.append(column); });
  table.append(columns);
  const head = node('thead'), headers = node('tr'), body = node('tbody');
  ['Route', 'Prototype', 'Production'].forEach(label => { const cell = node('th', '', label); cell.scope = 'col'; headers.append(cell); });
  head.append(headers); table.append(head, body);
  for (const route of ui.data.routes) {
    const row = node('tr'); row.dataset.pageId = route.id;
    const page = node('td', 'ui-viz__page-cell'); page.dataset.label = 'Route';
    const title = node('code', 'ui-viz__route-title');
    const deprecated = route.target?.title_deprecated || route.current?.title_deprecated;
    if (deprecated) title.append(node('del', '', deprecated), document.createTextNode(' '));
    title.append(document.createTextNode(route.title)); page.append(title); row.append(page);
    const checks = ui.checks.filter(check => check.pageId === route.id);
    if (ui.mode === 'compare') {
      const cell = node('td', 'ui-viz__comparison-cell'); cell.colSpan = 2;
      renderComparison(cell, route, checks); row.append(cell);
    } else {
      for (const [key, side, label] of [['target', 'prototype', 'Prototype'], ['current', 'production', 'Production']]) {
        const cell = node('td'); cell.dataset.label = label;
        renderStructure(cell, route[key], side); row.append(cell);
      }
    }
    body.append(row);
  }
  container.append(table);
}
async function loadChecks() {
  ui.compareError = null;
  try {
    const response = await fetch('/ui-audit-data.json', { cache: 'no-store' });
    if (!response.ok) throw new Error();
    const data = await response.json();
    if (!Array.isArray(data.checks)) throw new Error();
    ui.checks = data.checks;
  } catch { ui.compareError = 'Could not load comparison screenshots. Reload the page to retry.'; }
}
async function setMode(mode) {
  ui.mode = mode;
  history.replaceState(null, '', `#mode=${mode}`);
  if (mode === 'compare') await loadChecks();
  render(); document.getElementById(`ui-tab-${mode}`).focus();
}
function render() {
  const container = document.getElementById(UI_STRUCTURE_ID); container.replaceChildren();
  const tabs = node('nav', 'm__segmented-nav ui-viz__tabs'), list = node('ul');
  list.setAttribute('role', 'tablist'); list.setAttribute('aria-label', 'UI Scheme view');
  for (const [mode, label] of [['scheme', 'Scheme'], ['compare', 'Compare']]) {
    const item = node('li', ui.mode === mode ? 'current' : ''); item.setAttribute('role', 'presentation');
    const tab = node('a', '', label); tab.href = `#mode=${mode}`; tab.id = `ui-tab-${mode}`;
    tab.setAttribute('role', 'tab'); tab.setAttribute('aria-selected', String(ui.mode === mode)); tab.setAttribute('aria-controls', 'ui-viz-panel'); tab.tabIndex = ui.mode === mode ? 0 : -1;
    tab.addEventListener('click', event => { event.preventDefault(); setMode(mode); });
    tab.addEventListener('keydown', event => {
      if (!['ArrowLeft', 'ArrowRight', 'Home', 'End'].includes(event.key)) return;
      event.preventDefault(); setMode(event.key === 'Home' ? 'scheme' : event.key === 'End' ? 'compare' : mode === 'scheme' ? 'compare' : 'scheme');
    });
    item.append(tab); list.append(item);
  }
  tabs.append(list); container.append(tabs);
  const panel = node('section'); panel.id = 'ui-viz-panel'; panel.setAttribute('role', 'tabpanel'); panel.setAttribute('aria-labelledby', `ui-tab-${ui.mode}`);
  if (ui.mode === 'compare' && ui.compareError) { const error = node('p', 'ui-viz__error', ui.compareError); error.setAttribute('role', 'alert'); panel.append(error); }
  renderTable(panel); container.append(panel);
}
async function loadUIStructure() {
  try {
    const response = await fetch('/ui-data.json', { cache: 'no-store' });
    if (!response.ok) throw new Error(`Unable to load the scheme (${response.status}).`);
    ui.data = await response.json();
    ui.mode = new URLSearchParams(location.hash.slice(1)).get('mode') === 'compare' ? 'compare' : 'scheme';
    if (ui.mode === 'compare') await loadChecks();
    render();
  } catch (error) { document.getElementById(UI_STRUCTURE_ID).replaceChildren(node('p', 'ui-viz__error', error.message)); }
}
loadUIStructure();
window.addEventListener('hashchange', loadUIStructure);
