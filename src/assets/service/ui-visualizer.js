/**
 * UI Visualizer: loads ui.yaml, normalizes data, renders into #ui-structure.
 * Data and rendering can be extended without changing the load flow.
 */

const UI_STRUCTURE_ID = 'ui-structure';

function waitForJsYaml(maxAttempts = 50, interval = 100) {
  return new Promise((resolve, reject) => {
    let attempts = 0;
    const check = () => {
      attempts++;
      if (typeof jsyaml !== 'undefined' && jsyaml.load) {
        resolve(jsyaml);
      } else if (typeof YAML !== 'undefined' && YAML.load) {
        resolve(YAML);
      } else if (attempts >= maxAttempts) {
        reject(new Error('js-yaml library failed to load'));
      } else {
        setTimeout(check, interval);
      }
    };
    check();
  });
}

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

function normalizeUiData(raw) {
  const current = normalizeRouteList(raw?.current);
  const target = normalizeRouteList(raw?.target);
  return { current, target };
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

function renderRoutePaths(routes) {
  const list = (routes ?? []).filter((r) => typeof r === 'string' && r.length > 0);
  if (list.length === 0) {
    const span = document.createElement('span');
    span.className = 'ui-viz__route-path';
    span.textContent = '—';
    return span;
  }
  if (list.length === 1) {
    const span = document.createElement('span');
    span.className = 'ui-viz__route-path';
    span.textContent = list[0];
    return span;
  }
  const wrap = document.createElement('div');
  wrap.className = 'ui-viz__route-paths';
  list.forEach((r) => {
    const span = document.createElement('span');
    span.className = 'ui-viz__route-path';
    span.textContent = r;
    wrap.appendChild(span);
  });
  return wrap;
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

function renderUIStructure(data) {
  const container = document.getElementById(UI_STRUCTURE_ID);
  if (!container) {
    console.error(`Container #${UI_STRUCTURE_ID} not found`);
    return;
  }

  container.innerHTML = '';
  const { current, target } = data;

  const table = document.createElement('table');
  table.className = 'ui-viz__table';

  const thead = document.createElement('thead');
  const headerTr = document.createElement('tr');
  const thRoute = document.createElement('th');
  thRoute.textContent = 'Route';
  const thCurrent = document.createElement('th');
  thCurrent.textContent = 'Production';
  const thTarget = document.createElement('th');
  thTarget.textContent = 'Prototype';
  headerTr.appendChild(thRoute);
  headerTr.appendChild(thTarget);
  headerTr.appendChild(thCurrent);
  thead.appendChild(headerTr);
  table.appendChild(thead);

  const tbody = document.createElement('tbody');

  const routeKeys = new Set([
    ...current.map((r) => r.id),
    ...target.map((r) => r.id),
  ]);
  const currentById = new Map(current.map((r) => [r.id, r]));
  const targetById = new Map(target.map((r) => [r.id, r]));

  routeKeys.forEach((routeId) => {
    const currentRoute = currentById.get(routeId);
    const targetRoute = targetById.get(routeId);
    const route = targetRoute ?? currentRoute;
    const title = route?.title ?? routeId;
    const titleDeprecated = route?.title_deprecated ?? '';

    const tr = document.createElement('tr');

    const tdPage = document.createElement('td');
    const titleEl = document.createElement('code');
    titleEl.className = 'ui-viz__route-title';
    if (titleDeprecated) {
      const del = document.createElement('del');
      del.textContent = titleDeprecated;
      titleEl.appendChild(del);
      titleEl.appendChild(document.createTextNode(' '));
      titleEl.appendChild(document.createTextNode(title));
    } else {
      titleEl.textContent = title;
    }
    tdPage.appendChild(titleEl);
    tr.appendChild(tdPage);

    const tdCurrent = document.createElement('td');
    tdCurrent.appendChild(renderRoutePaths(currentRoute?.routes));
    renderRouteBody(tdCurrent, currentRoute);
    const tdTarget = document.createElement('td');
    tdTarget.appendChild(renderRoutePaths(targetRoute?.routes));
    renderRouteBody(tdTarget, targetRoute);
    tr.appendChild(tdTarget);
    tr.appendChild(tdCurrent);

    tbody.appendChild(tr);
  });

  table.appendChild(tbody);
  container.appendChild(table);
}

function showError(message) {
  const container = document.getElementById(UI_STRUCTURE_ID);
  if (container) {
    container.innerHTML = `<p class="ui-viz__error">Error loading UI structure: ${message}</p>`;
  }
}

async function loadUIStructure() {
  try {
    const yamlLib = await waitForJsYaml();
    const response = await fetch('/ui.yaml');
    if (!response.ok) {
      throw new Error(`Failed to load ui.yaml: ${response.status}`);
    }
    const yamlText = await response.text();
    const raw = yamlLib.load(yamlText);
    const data = normalizeUiData(raw);
    renderUIStructure(data);
  } catch (error) {
    console.error('Error loading UI structure:', error);
    showError(error.message);
  }
}

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', loadUIStructure);
} else {
  loadUIStructure();
}
