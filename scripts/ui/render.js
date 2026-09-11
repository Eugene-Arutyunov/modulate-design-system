const fs = require('node:fs');
const path = require('node:path');
const { buildData } = require('./data');
const { publicChecks, isPublicCapture } = require('./public-captures');
const { buildReview, checkId } = require('../../src/assets/service/ui-review');
const escape = value => String(value ?? '').replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const empty = '<p class="ui-viz__empty">—</p>';
const link = (label, href, cls = '') => `<a class="${cls}" href="${escape(href)}" target="_blank" rel="noopener">${escape(label)}</a>`;
const columns = '<colgroup><col style="width:24%"><col style="width:38%"><col style="width:38%"></colgroup>';
const headers = labels => `<thead><tr>${labels.map(s=>`<th scope="col">${s}</th>`).join('')}</tr></thead>`;
function sections(items = []) {
  return `<ul class="ui-viz__sections">${items.map(item => {
    const s = item.section ?? item;
    if (s['text-content'] !== undefined) return `<li class="ui-viz__section ui-viz__section--text-content">${escape(s['text-content'])}</li>`;
    const widgets = s.widgets || s.group?.widgets || (s.group?.widget ? [s.group.widget] : [s.widget || '']);
    return `<li class="ui-viz__section ui-viz__section--${s.widget !== undefined ? 'widget':'widgets'}"><div class="ui-viz__section-frame"><ul class="ui-viz__section-frame-list">${widgets.map(name=>`<li class="ui-viz__section-frame-item"><span class="ui-viz__widget">${escape(name)}</span>${s.states?.length ? `<span class="ui-viz__states"> (${escape(s.states.join(', '))})</span>`:''}</li>`).join('')}</ul></div></li>`;
  }).join('')}</ul>`;
}
function structure(route, side) {
  const urls = (route?.routes || [route?.route]).filter(u => typeof u === 'string' && u.startsWith('/') && !u.startsWith('//'));
  if (!urls.length) return empty;
  const body = (route.sections?.length ? sections(route.sections) : '') + (route.subsections?.length ? `<div class="ui-viz__subsections">${route.subsections.map(s=>`<div class="ui-viz__subsection"><h3 class="ui-viz__subsection-title">${escape(s.title)}</h3>${sections(s.sections)}</div>`).join('')}</div>`:'');
  return urls.map(u=>link(u,side === 'prototype' ? u : `https://platform.modulate.ai${u}`,'ui-viz__route-path')).join('') + (body || empty);
}
function imageURL(src, base) {
  if (typeof src !== 'string' || !/^\/ui-audit\/[a-z0-9][a-z0-9._-]*\.(png|webp)$/i.test(src)) return null;
  const name = path.basename(src), file = path.join(base,name);
  if (!fs.existsSync(file) || !fs.statSync(file).isFile() || !fs.realpathSync(file).startsWith(fs.realpathSync(base)+path.sep) || !isPublicCapture(base,name)) return null;
  return src;
}
function notes(check, route, review, base) {
  const item=review.byCheck.get(check); if (!item) return '';
  return `<div class="ui-viz__differences" aria-label="Differences in production">${check.fingerprint !== route.fingerprint ? '<p class="caption">Prototype changed. Capture again to compare.</p>' : check.status === 'match' ? '<p class="caption">No differences detected.</p>' : ''}
  ${item.elements.length ? `${!item.reviewed ? '<p class="caption">Detected elements — confirm against the screenshots.</p>':''}<ul class="ui-viz__differences-list">${item.elements.map(e=>`<li>${e.element?`<strong>${escape(e.element)}</strong> — `:''}${escape(e.difference)}</li>`).join('')}</ul>`:''}
  ${item.shared.length ? `<details class="ui-viz__comparison-notes ui-viz__shared-links"><summary>Linked issues</summary><p>${item.shared.map(g=>`<a href="#${escape(g.id)}">${escape(g.title)}</a>`).join(', ')}</p></details>`:''}
  ${item.notes.length ? `<details class="ui-viz__comparison-notes"><summary>View data diff</summary>${item.notes.map(n=>`<p>${escape(n)}</p>`).join('')}</details>`:''}
  ${imageURL(check.screenshots?.diff,base) ? `<p class="ui-viz__pixel-link">${link('View pixel diff ↗',check.screenshots.diff,'m__button-secondary-outline XS m__rounded')}</p>`:''}</div>`;
}
function issues(review) {
  if (!review.shared.length) return '';
  return `<section class="ui-viz__recommendations" id="general-issues"><h2>Issues</h2><table class="ui-viz__table ui-viz__issues-table">${columns}${headers(['Element','Prototype','Production'])}<tbody>${review.shared.map(g=>`<tr id="${escape(g.id)}"><td class="ui-viz__page-cell" data-label="Element"><strong>${escape(g.title)}</strong></td><td data-label="Prototype"><code>${escape(g.property)}: ${escape(g.prototype)}</code></td><td data-label="Production"><code>${escape(g.property)}: ${escape(g.production)}</code><p class="ui-viz__recommendation-fix"><strong>Recommendation: </strong>${escape(g.recommendation)}</p><details><summary>Found in ${g.affected.length} places</summary><ul class="ui-viz__affected-pages">${g.affected.map(a=>`<li><a href="#${escape(a.anchor)}">${escape(a.title)}${a.scenario !== 'default' ? ` · ${escape(a.scenario)}`:''}</a> — ${escape(a.elements.join(', '))}</li>`).join('')}</ul></details></td></tr>`).join('')}</tbody></table></section>`;
}
function comparison(route, checks, review, base) {
  return (checks.length ? checks : [{scenario:'default',pageId:route.id}]).map(check=>`<div class="ui-viz__comparison-state" data-scenario="${escape(check.scenario)}" id="${escape(checkId(check))}">${['prototype','production'].map(side=>{
    const src=imageURL(check.screenshots?.[side],base),label=side==='prototype'?'Prototype':'Production'; let address='';
    try {const u=new URL(check.urls?.[side]);if(src&&['http:','https:'].includes(u.protocol))address=link(u.pathname+u.search+u.hash,u.href,'ui-viz__route-path');}catch{}
    return `<figure class="ui-viz__screenshot" data-side="${side}" data-label="${label}"><figcaption class="caption">${checks.length>1||check.scenario!=='default'?escape(check.scenario):''}</figcaption><div class="ui-viz__capture-url">${address}</div><div class="ui-viz__preview">${src?`<a class="ui-viz__image-frame" href="${escape(src)}" target="_blank" rel="noopener" title="Open full screenshot"><img src="${escape(src)}" alt="${escape(`${label}: ${route.title}, ${check.scenario}`)}" loading="lazy"></a>`:empty}${side==='production'&&src?notes(check,route,review,base):''}</div></figure>`;
  }).join('')}</div>`).join('');
}
function renderUI(view, root = process.cwd()) {
  if (!['scheme','compare'].includes(view)) throw new Error('Unknown UI view');
  const data=buildData(root),base=path.join(root,'.ui-audit/latest');let checks=[],error='';
  if(view==='compare'){
    const file=path.join(base,'results.json');
    if(fs.existsSync(file))try{const report=JSON.parse(fs.readFileSync(file,'utf8'));if(!Array.isArray(report.checks))throw Error('Invalid results');checks=publicChecks(report.checks,base).map(c=>({...c,screenshots:Object.fromEntries(Object.entries(c.screenshots||{}).filter(([,u])=>imageURL(u,base)))}));}catch{error='<p class="ui-viz__error" role="alert">Could not read comparison results. Check the local audit files and rebuild.</p>';}
  }
  const review=buildReview(checks,data.routes);
  return `${view==='compare'?issues(review):''}<section id="ui-viz-panel" aria-labelledby="ui-tab-${view}">${view==='compare'?'<h2>Pages</h2>':''}${error}<table class="ui-viz__table ui-viz__table--${view}">${columns}${headers(['Route','Prototype','Production'])}<tbody>${data.routes.map(route=>`<tr data-page-id="${escape(route.id)}"><td class="ui-viz__page-cell" data-label="Route"><code class="ui-viz__route-title">${route.target?.title_deprecated||route.current?.title_deprecated?`<del>${escape(route.target?.title_deprecated||route.current?.title_deprecated)}</del> `:''}${escape(route.title)}</code></td>${view==='compare'?`<td class="ui-viz__comparison-cell" colspan="2">${comparison(route,checks.filter(c=>c.pageId===route.id),review,base)}</td>`:`<td data-label="Prototype">${structure(route.target,'prototype')}</td><td data-label="Production">${structure(route.current,'production')}</td>`}</tr>`).join('')}</tbody></table></section>`;
}
module.exports={renderUI};
