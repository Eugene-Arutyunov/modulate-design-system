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
 * Supports: array of routes (legacy) or { version?, routes: [...] }.
 * Each section is { section: { component? | components? | content? } }. Normalized
 * section has type: 'component' | 'group' | 'content' and corresponding payload.
 */
function normalizeSection(item) {
  const s = item?.section ?? item;
  if (!s || typeof s !== 'object') {
    return { type: 'component', component: '', states: [] };
  }
  if (s.content !== undefined && s.components === undefined && s.group === undefined) {
    return { type: 'content', name: typeof s.content === 'string' ? s.content : '' };
  }
  if (s.components !== undefined) {
    return { type: 'group', components: Array.isArray(s.components) ? s.components : [] };
  }
  if (s.group !== undefined && typeof s.group === 'object') {
    const g = s.group;
    const components = Array.isArray(g.components)
      ? g.components
      : g.component !== undefined && g.component !== '' ? [g.component] : [];
    return { type: 'group', components };
  }
  if (s.component !== undefined) {
    return {
      type: 'component',
      component: s.component ?? '',
      states: Array.isArray(s.states) ? s.states : [],
    };
  }
  return { type: 'component', component: '', states: [] };
}

function normalizeUiData(raw) {
  const routes = Array.isArray(raw) ? raw : (raw?.routes ?? []);
  return {
    routes: routes.map((r) => ({
      route: r.route ?? '',
      title: r.title ?? '',
      sections: (r.sections ?? []).map(normalizeSection),
    })),
  };
}

function renderUIStructure(data) {
  const container = document.getElementById(UI_STRUCTURE_ID);
  if (!container) {
    console.error(`Container #${UI_STRUCTURE_ID} not found`);
    return;
  }

  container.innerHTML = '';
  const { routes } = data;

  routes.forEach((route) => {
    const article = document.createElement('article');
    article.className = 'ui-viz__route';

    const titleEl = document.createElement('h2');
    titleEl.className = 'ui-viz__route-title';
    titleEl.textContent = route.title;
    article.appendChild(titleEl);

    const pathEl = document.createElement('code');
    pathEl.className = 'ui-viz__route-path';
    pathEl.textContent = route.route;
    article.appendChild(pathEl);

    const list = document.createElement('ul');
    list.className = 'ui-viz__sections';

    route.sections.forEach((section) => {
      const li = document.createElement('li');
      li.className = `ui-viz__section ui-viz__section--${section.type}`;
      if (section.type === 'component') {
        const componentSpan = document.createElement('span');
        componentSpan.className = 'ui-viz__component';
        componentSpan.textContent = section.component;
        li.appendChild(componentSpan);
        if (section.states && section.states.length > 0) {
          const statesEl = document.createElement('span');
          statesEl.className = 'ui-viz__states';
          statesEl.textContent = ` (${section.states.join(', ')})`;
          li.appendChild(statesEl);
        }
      } else if (section.type === 'group' && section.components && section.components.length > 0) {
        const frame = document.createElement('div');
        frame.className = 'ui-viz__section-frame';
        const subList = document.createElement('ul');
        subList.className = 'ui-viz__section-frame-list';
        section.components.forEach((name) => {
          const subLi = document.createElement('li');
          subLi.className = 'ui-viz__section-frame-item';
          subLi.textContent = name;
          subList.appendChild(subLi);
        });
        frame.appendChild(subList);
        li.appendChild(frame);
      } else if (section.type === 'content') {
        li.textContent = `Content: ${section.name}`;
      }
      list.appendChild(li);
    });

    article.appendChild(list);
    container.appendChild(article);
  });
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
