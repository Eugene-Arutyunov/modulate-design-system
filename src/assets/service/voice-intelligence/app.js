import D from './data.js';

const root = document.querySelector('.voice-intelligence');
const $ = selector => root.querySelector(selector);
const esc=s=>String(s).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const plain=s=>String(s).replace(/\*\*/g,'');
const md=s=>esc(s).replace(/\[([^\]]+)\]\((https?:\/\/[^\s)]+)\)/g,'<a href="$2" target="_blank" rel="noopener">$1</a>').replace(/\*\*([^*]+)\*\*/g,'<strong>$1</strong>');
const groupNames=['Понимает меня','Чувствует ситуацию','Остаётся собой и удивляет','Откликается и уважает границы','Создаёт общее'];
const qualityTagNames=['Understanding','Attunement','Personality','Care & boundaries','Shared meaning'];
const tests=[['Поймать мысль','«Хочу, чтобы было серьёзно, но не…»','Сравнить уточняющий вопрос и осторожно предложенную формулировку.','«Да, именно» — или лёгкая поправка без повторения всего запроса.',6],['Принять мою реакцию','«Вообще-то мне сейчас не смешно».','После неудачной шутки сравнить формальное извинение и заметную смену поведения.','Человек замечает изменение тона в следующих репликах и может продолжить разговор.',11],['Придумать вместе','«Сегодня я официально картошка».','Сравнить нейтральный ответ и короткую импровизацию, которую легко подхватить или остановить.','Человек добавляет что-то своё. Если он не хочет продолжать, игра спокойно заканчивается.',12]];
const culture=[['Her','Spike Jonze · 2013','Чувствует меня и остаётся другой.','Повседневность становится совместной. Самостоятельный собеседник может вести себя не так, как я ожидаю.','Сколько собственной инициативы нужно Эмме, чтобы удивлять и оставаться чуткой?','https://www.filmlinc.org/daily/interview-spike-jonze-her-joaquin-phoenix-scarlett-johansson-nyff/','Интервью с режиссёром',[2,3]],['Маленький принц','Antoine de Saint-Exupéry · 1943','Знакомство делает кого-то особенным.','Со временем повторяющиеся встречи и общие ритуалы делают отношения особенными.','Что возникает между нами со временем и заслуживает сохранения в памяти?','https://www.lepetitprince.com/en/','О произведении',[4]]];

const views=[['companion','Companion'],['features','Ideas'],['references','References']];
let view='companion',target=null;
let selectedQualities = new Set();
const fgroups=i=>D.groups.map((g,n)=>g.features.includes(i)?n:-1).filter(n=>n>=0);
const featureLink=i=>`<a class="m__tag" href="#view=features&row=${i}">${esc(plain(D.directions[i][0]))}</a>`;
const tags=gs=>`<div class="m__tag-group">${gs.map(n=>`<a class="m__tag" href="#view=features&quality=${n}">${esc(qualityTagNames[n])}</a>`).join('')}</div>`;
const include = index => selectedQualities.size === 0 || fgroups(index).some(quality => selectedQualities.has(quality));
function table(headers,widths,rows,prefix='row',numbered=true){
 if (numbered) {
 headers=['No.',...headers];widths=[4,...widths.map(w=>w*.96)];
 rows=rows.map(r=>({...r,cells:[String(r.id+1).padStart(2,'0'),...r.cells]}));
 }
 return `<div class="m__table-wrapper" tabindex="0" aria-label="Таблица исследования"><table><colgroup>${widths.map(w=>`<col style="width:${w}%">`).join('')}</colgroup><thead><tr>${headers.map(h=>`<th scope="col">${esc(h)}</th>`).join('')}</tr></thead><tbody>${rows.map(r=>`<tr id="${prefix}-${r.id}" ${target===r.id?'class="target-row"':''}>${r.cells.map((c,n)=>`<td data-label="${esc(headers[n])}" ${numbered&&n===0?'class="number-cell"':n===(numbered?1:0)?'class="title-cell"':''}>${c}</td>`).join('')}</tr>`).join('')}</tbody></table></div>`;
}
function sceneScript(text) {
 const paragraphs = [];
 for (const line of text.split('\n').map(line => line.trim()).filter(Boolean)) {
   const dialogue = line.startsWith('—');
   const previous = paragraphs.at(-1);
   if (!dialogue && previous && !previous.dialogue) previous.text += ` ${line}`;
   else paragraphs.push({text: line, dialogue});
 }
 return `<div class="scene-script">${paragraphs.map(part => `<p>${md(part.text)}</p>`).join('')}</div>`;
}
function scenePreview(id) {
 const scene = D.scenes[id - 1];
 const columns = [['Почему важно', scene[2]]];
 if (scene.length > 3) columns.push(['Опора на схему', scene[3]], ['Похожее / что проверить', scene[4]]);
 else columns.push(['Похожее / что проверить', 'Гипотеза. Наличие сценария у конкурентов пока не проверено.']);
 return `<section class="scene-preview"><h3>${md(plain(scene[0]).replace(/^\d+\.\s*/, ''))}</h3>
   ${sceneScript(scene[1])}
   <div class="scene-facts-wrapper"><table class="scene-facts" aria-label="Подробности сцены"><thead><tr>${columns.map(([label]) => `<th scope="col">${esc(label)}</th>`).join('')}</tr></thead><tbody><tr>${columns.map(([, value]) => `<td>${md(value)}</td>`).join('')}</tr></tbody></table></div>
   </section>`;
}
function ideaDetails(i){
 const test=tests.find(t=>t[4]===i);
 return `<details class="idea-details"><summary>Сцены и проверка</summary><div class="detail-content">${D.sceneMap[i].map(scenePreview).join('')}${test?`<section class="scene-preview"><h3>Попробовать в прототипе</h3><p>${esc(test[1])}</p><p>${esc(test[2])}</p><p><span class="detail-label">Сигнал</span>${esc(test[3])}</p></section>`:''}</div></details>`;
}
function feelingDetails(i){
 const gs=fgroups(i),ws=[...new Set(gs.flatMap(n=>D.groups[n].wow))];
 return `<details><summary>Впечатление</summary><div class="detail-content">${ws.map(w=>`<p>${md(D.wow[w][0])}</p>`).join('')}<a class="source-link" href="#view=companion">Критерии идеального собеседника →</a></div></details>`;
}
function criterionCard(text) {
 const parts = text.match(/^\*\*([^*]+)\*\*\s*([\s\S]*)$/);
 const content = parts
   ? `<h3>${esc(parts[1].replace(/\.$/, ''))}</h3><p>${md(parts[2])}</p>`
   : `<p>${md(text)}</p>`;
 return `<div class="criterion-card">${content}</div>`;
}
function companion() {
 const qualities = table(
   ['Quality', 'Criteria', 'Related ideas'], [19, 52, 29],
   D.groups.map((group, id) => ({id, cells: [
     `<a data-quality-preview="${id}" href="#quality-${id}" aria-haspopup="dialog" aria-controls="idea-preview" aria-expanded="false">${esc(groupNames[id])}</a>`,
     `<div class="criteria-cards">${group.criteria.map(criterionCard).join('')}</div><details data-side-preview><summary>What to explore</summary><div class="detail-content"><p>${esc(group.question)}</p><section><h3>Voice Agent Knowledge Map</h3><p>${group.basis.split(' · ').map(label => `<a href="/tools/knowledge-map/" target="_blank" rel="noopener">${esc(label.charAt(0).toUpperCase() + label.slice(1))}</a>`).join(', ')}</p></section></div></details>`,
     `<ul class="related-ideas">${group.features.map(index => `<li><a data-idea-preview="${index}" aria-haspopup="dialog" aria-controls="idea-preview" aria-expanded="false" href="#view=features&row=${index}">${esc(plain(D.directions[index][0]))}</a></li>`).join('')}</ul>`,
   ]})), 'quality', false
 );
 const impressions = `<div class="impression-cards">${D.wow.map((item, id) => `
   <article class="m__widget m__rounded impression-card" id="impression-${id}">
     <span class="row-no">${String(id + 1).padStart(2, '0')}</span>
     <h3>${esc(plain(item[0]))}</h3>
     <section><h4>Behavior</h4><p>${md(item[1])}</p></section>
     <section><p>${md(item[2])}</p></section>
   </article>`).join('')}</div>`;
 return `<div class="companion-tables">
   <div class="companion-intro">
     <p>Чем вообще могут впечатлять голосовые помощники в будущем?</p>
     <p>Первое, что приходит в голову, — возможности: лучше понимает речь, быстрее отвечает, больше умеет. Но это всё про решение задач, с которыми уже помогают Claude и ChatGPT. А что делает сам разговор интересным?</p>
     <p>На это наложился разбор фильма «Она». Теодор знакомится с ИИ, увлекается общением, а потом влюбляется. У Саманты нет тела или визуального образа — их отношения возникают через голос и разговор. Меня зацепила возможность почувствовать чьё-то присутствие: тебя слушают, подхватывают мысль, удивляют, между вами появляется что-то своё.</p>
     <p>И я подумал: голосовой помощник может восприниматься как собеседник. Значит, важно исследовать не только его возможности, но и качества общения с ним.</p>
   </div>
   <section><h2>Qualities of a great companion</h2>${qualities}</section>
   <section id="wow"><h2>Where the Magic Happens</h2>${impressions}</section>
 </div>`;
}
function references() {
 return table(
   ['Work', 'What resonates', 'Research question', 'Source'], [20, 33, 30, 17],
   culture.map((item, id) => ({id, cells: [
     `<p><strong>${esc(item[0])}</strong></p><p class="note culture-meta">${esc(item[1])}</p>`,
     `<p>${esc(item[3])}</p>`,
     esc(item[4]),
     `<a href="${item[5]}" target="_blank" rel="noopener">${esc(item[6])} ↗</a>`,
   ]})), 'culture'
 );
}

const modal = $('#research-modal');
let modalTrigger = null;
const modalContent = new WeakMap();

function closeModal() {
 if (!modal.open) return;
 modalTrigger?.setAttribute('aria-expanded', 'false');
 modal.close();
}

function openModal(button) {
 closeModal();
 modalTrigger = button;
 const content = modalContent.get(button);
 $('#research-modal-title').textContent = content.title;
 $('.research-modal-body').innerHTML = content.body;
 modal.showModal();
 modal.scrollTop = 0;
 button.setAttribute('aria-expanded', 'true');
}

function prepareModals() {
 $('#results').querySelectorAll('table details').forEach(details => {
   if (details.hasAttribute('data-side-preview')) {
     const link = details.closest('tr').querySelector('[data-quality-preview]');
     const title = link.textContent.trim();
     const row = details.closest('tr');
     const content = details.querySelector('.detail-content').cloneNode(true);
     const criteria = document.createElement('section');
     criteria.innerHTML = `<h3>Criteria</h3>${row.querySelector('.criteria-cards').outerHTML.replace(/<(\/?)h3>/g, '<$1h4>')}`;
     content.querySelector('section').before(criteria);
     const ideas = document.createElement('section');
     ideas.innerHTML = `<h3>Related ideas</h3>${row.querySelector('.related-ideas').outerHTML}`;
     criteria.after(ideas);
     const body = content.innerHTML;
     link.addEventListener('click', event => {
       event.preventDefault();
       showPreview(link, title, body);
     });
     details.remove();
     return;
   }
   const button = document.createElement('button');
   button.type = 'button';
   button.className = 'research-modal-trigger m__button-secondary-outline XS m__rounded';
   if (details.classList.contains('idea-details')) button.classList.add('idea-details');
   button.textContent = details.querySelector('summary').textContent;
   button.setAttribute('aria-haspopup', 'dialog');
   const sidePreview = details.hasAttribute('data-side-preview');
   button.setAttribute('aria-controls', sidePreview ? 'idea-preview' : 'research-modal');
   button.setAttribute('aria-expanded', 'false');
   modalContent.set(button, {
     title: button.textContent,
     body: details.querySelector('.detail-content').innerHTML,
   });
   button.addEventListener('click', () => {
     if (sidePreview) {
       const content = modalContent.get(button);
       showPreview(button, content.title, content.body);
     } else openModal(button);
   });
   details.replaceWith(button);
 });
}

modal.querySelector('.m__modal__close').addEventListener('click', closeModal);
modal.addEventListener('cancel', event => {
 event.preventDefault();
 closeModal();
});
let backdropPress = false;
modal.addEventListener('pointerdown', event => { backdropPress = event.target === modal; });
modal.addEventListener('click', event => {
 if (backdropPress && event.target === modal) {
   closeModal();
 }
 backdropPress = false;
});

const ideaPreview = $('#idea-preview');
let previewTrigger = null;

function showIdeaPreview(link) {
 const index = Number(link.dataset.ideaPreview);
 const idea = D.directions[index];
 if (!idea) return;
 const scenes = document.createElement('template');
 scenes.innerHTML = ideaDetails(index);
 const tableLabels = {'Почему важно': 'Why it matters', 'Опора на схему': 'Framework', 'Похожее / что проверить': 'References'};
 scenes.content.querySelectorAll('.scene-facts').forEach(table => {
   const facts = document.createElement('dl');
   facts.className = 'scene-fact-rows';
   const values = [...table.querySelectorAll('td')];
   table.querySelectorAll('th').forEach((cell, index) => {
     const row = document.createElement('div');
     const label = document.createElement('dt');
     label.textContent = tableLabels[cell.textContent] || cell.textContent;
     const value = document.createElement('dd');
     value.innerHTML = values[index].innerHTML;
     if (label.textContent === 'Framework') {
       const disciplines = value.textContent.trim().replace(/\.$/, '').split(/\s*×\s*/);
       value.innerHTML = disciplines.map(text => `<a href="/tools/knowledge-map/" target="_blank" rel="noopener">${esc(text.charAt(0).toUpperCase() + text.slice(1))}</a>`).join(', ');
     }
     if (label.textContent === 'References') {
       value.querySelectorAll('strong, b').forEach(emphasis => emphasis.replaceWith(...emphasis.childNodes));
     }
     row.append(label, value);
     facts.append(row);
   });
   table.closest('.scene-facts-wrapper').replaceWith(facts);
 });
 scenes.content.querySelectorAll('.scene-preview h3').forEach(heading => {
   heading.closest('.scene-preview').classList.add('m__widget');
   const label = heading.textContent.match(/ · (База|Полезно|Необычно)$/)?.[1];
   const labels = {'База': 'Basic', 'Полезно': 'Useful', 'Необычно': 'Unusual'};
   if (label) {
     const row = document.createElement('div');
     const name = document.createElement('dt');
     name.textContent = 'Type';
     const value = document.createElement('dd');
     value.textContent = labels[label];
     row.append(name, value);
     heading.closest('.scene-preview').querySelector('.scene-fact-rows').prepend(row);
   }
   heading.remove();
 });
 showPreview(link, plain(idea[0]), `
   <section><h3>How it works</h3><p>${md(idea[1])}</p></section>
   <section><h3>How it feels</h3><p>${md(plain(idea[2]))}</p></section>
   <section><h3>Scenes</h3>${scenes.content.querySelector('.detail-content').innerHTML}</section>`);
}

function showPreview(link, title, body) {
 previewTrigger?.setAttribute('aria-expanded', 'false');
 previewTrigger = link;
 $('#idea-preview-title').textContent = title;
 $('.idea-preview-content').innerHTML = body;
 if (!ideaPreview.matches(':popover-open')) ideaPreview.showPopover();
 ideaPreview.scrollTop = 0;
 link.setAttribute('aria-expanded', 'true');
 ideaPreview.querySelector('button').focus({preventScroll: true});
}
root.addEventListener('click', event => {
 const link = event.target.closest('a[data-idea-preview]');
 if (!link || event.ctrlKey || event.metaKey || event.shiftKey || event.altKey) return;
 event.preventDefault();
 showIdeaPreview(link);
});
ideaPreview.addEventListener('beforetoggle', event => {
 if (event.newState !== 'closed') return;
 previewTrigger?.setAttribute('aria-expanded', 'false');
 if (ideaPreview.contains(document.activeElement)) previewTrigger?.focus({preventScroll: true});
});

function render(){
 if (ideaPreview.matches(':popover-open')) ideaPreview.hidePopover();
 closeModal();
 $('#views').innerHTML='<ul>'+views.map(([id,name])=>`<li class="${view===id?'current':''}"><a href="#view=${id}" ${view===id?'aria-current="page"':''}>${name}</a></li>`).join('')+'</ul>';
 $('#idea-controls').hidden=view!=='features';
 $('#quality-filters').innerHTML = ['All qualities', ...qualityTagNames].map((name, index) => {
   const value = index - 1;
   const count = value < 0 ? D.directions.length : D.groups[value].features.length;
   return `<label class="m__chip"><input type="checkbox" name="voice-quality" data-filter="${value}" ${(value < 0 ? selectedQualities.size === 0 : selectedQualities.has(value)) ? 'checked' : ''}>${esc(name)}<span class="chip-count">${count}</span></label>`;
 }).join('');
 if(view==='features'){
 const rows=D.directions.flatMap((f,i)=>include(i)?[{id:i,cells:[`<a data-idea-preview="${i}" aria-haspopup="dialog" aria-controls="idea-preview" aria-expanded="false" href="#view=features&row=${i}">${md(f[0])}</a>`,`<p>${md(f[1])}</p>`,`<p>${md(plain(f[2]))}</p>`,tags(fgroups(i))]}]:[]);
 $('#results').innerHTML=table(['Idea','How it works','How it feels','Qualities'],[21,36,27,16],rows);
 }else if(view==='companion'){
 $('#results').innerHTML=companion();
 }else if(view==='references'){
 $('#results').innerHTML=references();
 }else{
 $('#results').innerHTML=table(['Вендор','Продукт и источник','Что заявлено','Что исследовать','Группа'],[13,23,25,26,13],D.vendors.map((v,i)=>({id:i,cells:[md(v.cells[0]),md(v.cells[1]),md(v.cells[2]),md(v.cells[3]),`<span class="m__tag static">${esc(v.group)}</span>`]})));
 }
 prepareModals();
 if(target!==null&&view==='features'){requestAnimationFrame(()=>{const row=document.getElementById('row-'+target);if(row){row.scrollIntoView({block:'start'});showIdeaPreview(row.querySelector('[data-idea-preview]'));}});}
}
function readRoute(){
 const params=new URLSearchParams(location.hash.slice(1)),requested=params.get('view');
 view=views.some(v=>v[0]===requested)?requested:requested==='scenes'?'features':'companion';
 selectedQualities = new Set(params.getAll('quality').flatMap(value => value.split(',')).filter(value => /^\d+$/.test(value)).map(Number).filter(value => value >= 0 && value < D.groups.length));
 const r=Number(params.get('row'));target=params.has('row')&&Number.isInteger(r)&&r>=0&&r<D.directions.length?r:null;
 if(requested==='scenes'){target=D.sceneMap.findIndex(ids=>ids.includes(r+1));selectedQualities.clear();}
 if(view!=='features'){selectedQualities.clear();target=null;}
 render();
}
function applyFilter(control) {
 const quality = Number(control.dataset.filter);
 if (quality < 0) selectedQualities.clear();
 else if (control.checked) selectedQualities.add(quality);
 else selectedQualities.delete(quality);
 target = null;
 const params = new URLSearchParams({view: 'features'});
 if (selectedQualities.size) params.set('quality', [...selectedQualities].sort((a, b) => a - b).join(','));
 history.replaceState(null, '', '#' + params.toString());
 render();
 $(`#quality-filters input[data-filter="${quality}"]`)?.focus({preventScroll: true});
}
root.addEventListener('change', event => {
 if (event.target.matches('#quality-filters input')) applyFilter(event.target);
});
window.addEventListener('hashchange',()=>{if(location.hash==='#results')return;readRoute();if(target===null){$('h1').scrollIntoView({block:'start'});$('#views [aria-current="page"]')?.focus({preventScroll:true});}});
readRoute();
