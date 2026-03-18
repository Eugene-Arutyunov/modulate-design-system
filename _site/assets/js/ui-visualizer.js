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
 * Expects { product: routes[], prototype: routes[] }. Each section is
 * { section: { widget? | widgets? | text-content? } }.
 * Normalized section has type: 'widget' | 'widgets' | 'text-content' and the
 * corresponding payload.
 */
function normalizeSection(item) {
  const s = item?.section ?? item;
  if (!s || typeof s !== 'object') {
    return { type: 'widget', widget: '', states: [] };
  }
  const hasLegacyComponentKeys =
    s.component !== undefined || s.components !== undefined;
  const hasNewWidgetKeys = s.widget !== undefined || s.widgets !== undefined;
  if (
    s['text-content'] !== undefined &&
    !hasNewWidgetKeys &&
    !hasLegacyComponentKeys &&
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
  if (s.components !== undefined) {
    // Legacy compatibility: keep old ui.yaml keys working.
    return { type: 'widgets', widgets: Array.isArray(s.components) ? s.components : [] };
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
      : Array.isArray(g.components)
        ? g.components
        : g.component !== undefined && g.component !== ''
          ? [g.component]
          : g.widget !== undefined && g.widget !== ''
            ? [g.widget]
            : [];
    return { type: 'widgets', widgets };
  }
  if (s.component !== undefined) {
    // Legacy compatibility: keep old ui.yaml keys working.
    return {
      type: 'widget',
      widget: s.component ?? '',
      states: Array.isArray(s.states) ? s.states : [],
    };
  }
  return { type: 'widget', widget: '', states: [] };
}

function normalizeRouteList(routes) {
  return (routes ?? []).map((r) => ({
    route: r.route ?? '',
    title: r.title ?? '',
    sections: (r.sections ?? []).map(normalizeSection),
  }));
}

function normalizeUiData(raw) {
  const product = normalizeRouteList(raw?.product);
  const prototype = normalizeRouteList(raw?.prototype);
  return { product, prototype };
}

function renderSectionsList(sections, listClass) {
  const list = document.createElement('ul');
  list.className = listClass ?? 'ui-viz__sections';
  (sections ?? []).forEach((section) => {
    const li = document.createElement('li');
    li.className = `ui-viz__section ui-viz__section--${section.type}`;
    if (section.type === 'widget') {
      const widgetSpan = document.createElement('span');
      widgetSpan.className = 'ui-viz__widget';
      widgetSpan.textContent = section.widget;
      li.appendChild(widgetSpan);
      if (section.states && section.states.length > 0) {
        const statesEl = document.createElement('span');
        statesEl.className = 'ui-viz__states';
        statesEl.textContent = ` (${section.states.join(', ')})`;
        li.appendChild(statesEl);
      }
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
      li.textContent = `Text content: ${section.name}`;
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
  const { product, prototype } = data;

  const table = document.createElement('table');
  table.className = 'ui-viz__table';

  const thead = document.createElement('thead');
  const headerTr = document.createElement('tr');
  const thRoute = document.createElement('th');
  thRoute.textContent = 'Route';
  const thActual = document.createElement('th');
  thActual.textContent = 'Actual';
  const thTarget = document.createElement('th');
  thTarget.textContent = 'Target';
  headerTr.appendChild(thRoute);
  headerTr.appendChild(thActual);
  headerTr.appendChild(thTarget);
  thead.appendChild(headerTr);
  table.appendChild(thead);

  const tbody = document.createElement('tbody');

  const routeKeys = new Set([
    ...product.map((r) => r.route),
    ...prototype.map((r) => r.route),
  ]);
  const productByRoute = new Map(product.map((r) => [r.route, r]));
  const prototypeByRoute = new Map(prototype.map((r) => [r.route, r]));

  routeKeys.forEach((routePath) => {
    const productRoute = productByRoute.get(routePath);
    const prototypeRoute = prototypeByRoute.get(routePath);
    const route = prototypeRoute ?? productRoute;
    const title = route?.title ?? routePath;

    const tr = document.createElement('tr');

    const tdPage = document.createElement('td');
    const titleEl = document.createElement('code');
    titleEl.className = 'ui-viz__route-title';
    titleEl.textContent = title;
    tdPage.appendChild(titleEl);
    tr.appendChild(tdPage);

    const tdProduct = document.createElement('td');
    const productPath = document.createElement('span');
    productPath.className = 'ui-viz__route-path';
    productPath.textContent = productRoute?.route ?? '—';
    tdProduct.appendChild(productPath);
    if (productRoute?.sections?.length) {
      tdProduct.appendChild(renderSectionsList(productRoute.sections));
    } else {
      const empty = document.createElement('p');
      empty.className = 'ui-viz__empty';
      empty.textContent = '—';
      tdProduct.appendChild(empty);
    }
    tr.appendChild(tdProduct);

    const tdPrototype = document.createElement('td');
    const prototypePath = document.createElement('span');
    prototypePath.className = 'ui-viz__route-path';
    prototypePath.textContent = prototypeRoute?.route ?? '—';
    tdPrototype.appendChild(prototypePath);
    if (prototypeRoute?.sections?.length) {
      tdPrototype.appendChild(renderSectionsList(prototypeRoute.sections));
    } else {
      const empty = document.createElement('p');
      empty.className = 'ui-viz__empty';
      empty.textContent = '—';
      tdPrototype.appendChild(empty);
    }
    tr.appendChild(tdPrototype);

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
