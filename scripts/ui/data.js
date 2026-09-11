const fs = require('node:fs');
const path = require('node:path');
const yaml = require('js-yaml');
const { digest, paths, assertScheme } = require('./model');
const SCHEME = 'src/service/ui.yaml';
function files(root, folder) {
  const dir = path.join(root, folder);
  if (!fs.existsSync(dir)) return [];
  return fs.readdirSync(dir, { withFileTypes: true }).flatMap(entry => entry.isDirectory() ? files(root, `${folder}/${entry.name}`) : [`${folder}/${entry.name}`]);
}
function buildData(root) {
  const read = file => fs.readFileSync(path.join(root, file), 'utf8');
  const raw = assertScheme(yaml.load(read(SCHEME)));
  const inventory = new Map();
  for (const file of files(root, 'src/prototypes').filter(file => file.endsWith('.html'))) {
    const source = read(file);
    const front = source.match(/^---\r?\n([\s\S]*?)\r?\n---/);
    const meta = front ? yaml.load(front[1]) : {};
    const url = meta?.permalink || file.replace(/^src\/prototypes\/platform/, '').replace(/^src\/prototypes/, '').replace(/\.html$/, '/');
    inventory.set(url.replace(/\/$/, ''), file);
  }
  const styleFiles = ['tokens', 'components', 'widgets', 'page-composition', 'prototypes'].flatMap(folder => files(root, `src/styles/${folder}`));
  const sourceCache = new Map(), fileHashes = new Map();
  const fileHash = file => { if (!fileHashes.has(file)) fileHashes.set(file, digest(fs.readFileSync(path.join(root, file)))); return fileHashes.get(file); };
  function dependencies(file, found = new Set()) {
    if (found.has(file) || !fs.existsSync(path.join(root, file))) return found;
    found.add(file);
    const source = sourceCache.get(file) ?? read(file); sourceCache.set(file, source);
    for (const match of source.matchAll(/(?:include|extends|from)\s+['"]([^'"]+)['"]/g)) dependencies(`src/includes/${match[1]}`, found);
    for (const match of source.matchAll(/['"](\/assets\/[^'"\s]+\.(?:js|json|css))['"]/g)) dependencies(`src${match[1]}`, found);
    if (source.includes('/dashboard-charts.json')) dependencies('src/assets/prototypes/data/dashboard-charts.json', found);
    if (source.includes('prototypeModels')) dependencies('src/assets/prototypes/data/models.json', found);
    return found;
  }
  const routeMap = new Map([...raw.target, ...raw.current].map(route => [route.id, { id: route.id, title: route.title || route.id }]));
  for (const route of routeMap.values()) {
    route.target = raw.target.find(item => item.id === route.id) || null;
    route.current = raw.current.find(item => item.id === route.id) || null;
    route.title = route.target?.title || route.current?.title || route.id;
    route.sourceFiles = paths(route.target).map(url => inventory.get(url.replace(/\/$/, ''))).filter(Boolean);
    route.available = route.sourceFiles.length > 0 && route.sourceFiles.length === paths(route.target).length;
    const deps = new Set(route.sourceFiles.flatMap(file => [...dependencies(file)]));
    if (deps.size) styleFiles.forEach(file => deps.add(file));
    route.dependencies = [...deps].sort();
    route.fingerprint = digest([route.target, ...route.dependencies.map(file => [file, fileHash(file)])]);
  }
  for (const route of routeMap.values()) delete route.dependencies;
  return { version: 1, current: raw.current, target: raw.target, routes: [...routeMap.values()] };
}
module.exports = { buildData };
