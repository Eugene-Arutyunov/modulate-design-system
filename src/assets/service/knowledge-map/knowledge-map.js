// Voice Agent Knowledge Map (/tools/knowledge-map/).
// Behavior port of the standalone page: tag selection, neighbor highlighting,
// SVG link curves recomputed on resize and after fonts load. All colors live
// in knowledge-map.css so the site theme toggle restyles the map for free.
// EN is the public language; double-clicking the invisible bottom-right
// corner of the stage toggles RU (persisted in localStorage "km-lang").

import {
  UI,
  GROUPS,
  DISCIPLINES,
  ORDER,
  LINKS,
} from "./knowledge-map-data.js";

const NS = "http://www.w3.org/2000/svg";
const root = document.querySelector(".km");

if (root) {
  const map = root.querySelector(".km__map");
  const svg = root.querySelector(".km__links");
  const panel = root.querySelector(".km__panel");
  const langZone = root.querySelector(".km__lang-zone");
  let selected = null;
  let lang = "en";
  try {
    const saved = localStorage.getItem("km-lang");
    if (saved === "ru" || saved === "en") lang = saved;
  } catch (e) {
    /* private mode */
  }

  function build() {
    Object.keys(ORDER).forEach((g) => {
      const cloud = map.querySelector(`.km__cloud[data-group="${g}"]`);
      const box = cloud.querySelector(".km__tags");
      ORDER[g].forEach((id) => {
        const b = document.createElement("button");
        b.type = "button";
        b.className = "km__tag";
        b.dataset.id = id;
        b.setAttribute("aria-pressed", "false");
        b.addEventListener("click", (ev) => {
          ev.stopPropagation();
          select(selected === id ? null : id);
        });
        box.appendChild(b);
        box.appendChild(document.createTextNode(" "));
      });
    });
    LINKS.forEach(([a, b]) => {
      const path = document.createElementNS(NS, "path");
      path.dataset.a = a;
      path.dataset.b = b;
      svg.appendChild(path);
    });
  }

  function labels() {
    map.querySelectorAll(".km__cloud h2").forEach((h) => {
      h.textContent = GROUPS[h.parentElement.dataset.group][lang];
    });
    map.querySelectorAll(".km__tag").forEach((t) => {
      t.textContent = DISCIPLINES[t.dataset.id].n[lang];
    });
  }

  function centre(el, base) {
    const r = el.getBoundingClientRect();
    return [r.left - base.left + r.width / 2, r.top - base.top + r.height / 2];
  }

  function draw() {
    const base = map.getBoundingClientRect();
    svg.setAttribute("viewBox", `0 0 ${base.width} ${base.height}`);
    svg.querySelectorAll("path").forEach((p, i) => {
      const a = map.querySelector(`.km__tag[data-id="${p.dataset.a}"]`);
      const b = map.querySelector(`.km__tag[data-id="${p.dataset.b}"]`);
      const A = centre(a, base);
      const B = centre(b, base);
      const mx = (A[0] + B[0]) / 2;
      const my = (A[1] + B[1]) / 2;
      const dx = B[0] - A[0];
      const dy = B[1] - A[1];
      const k = (i % 2 ? 1 : -1) * 0.14;
      p.setAttribute(
        "d",
        `M${A[0].toFixed(1)} ${A[1].toFixed(1)} Q${(mx - dy * k).toFixed(1)} ${(
          my +
          dx * k
        ).toFixed(1)} ${B[0].toFixed(1)} ${B[1].toFixed(1)}`,
      );
    });
  }

  function neighbours(id) {
    const n = [];
    LINKS.forEach(([a, b]) => {
      if (a === id) n.push(b);
      else if (b === id) n.push(a);
    });
    return n;
  }

  function el(tag, text, cls) {
    const e = document.createElement(tag);
    if (text != null) e.textContent = text;
    if (cls) e.className = cls;
    return e;
  }

  function render() {
    panel.textContent = "";
    const u = UI[lang];
    if (!selected) {
      panel.appendChild(el("div", "", "km__grp"));
      panel.appendChild(el("h2", u.title, "km__title"));
      panel.appendChild(el("p", u.intro));
      panel.appendChild(el("p", u.hint));
      return;
    }
    const d = DISCIPLINES[selected];
    panel.appendChild(el("div", GROUPS[d.g][lang], "km__grp"));
    panel.appendChild(el("h2", d.n[lang], "km__title"));
    panel.appendChild(el("p", d.t[lang]));
    panel.appendChild(el("h3", u.read));
    const ul = el("ul");
    d.l.forEach(([label, href]) => {
      const li = el("li");
      const a = el("a", label);
      a.href = href;
      a.target = "_blank";
      a.rel = "noopener";
      li.appendChild(a);
      ul.appendChild(li);
    });
    panel.appendChild(ul);
    const nb = neighbours(selected);
    if (nb.length) {
      panel.appendChild(el("h3", u.linked));
      const ul2 = el("ul");
      nb.forEach((id) => {
        const li = el("li");
        const b = el("button", DISCIPLINES[id].n[lang]);
        b.type = "button";
        b.addEventListener("click", () => select(id));
        li.appendChild(b);
        ul2.appendChild(li);
      });
      panel.appendChild(ul2);
    }
    panel.scrollTop = 0;
  }

  function select(id) {
    selected = id;
    const nb = id ? neighbours(id) : [];
    map.querySelectorAll(".km__tag").forEach((t) => {
      const me = t.dataset.id === id;
      t.classList.toggle("sel", me);
      t.classList.toggle("off", !!id && !me && nb.indexOf(t.dataset.id) < 0);
      t.setAttribute("aria-pressed", me ? "true" : "false");
    });
    svg.querySelectorAll("path").forEach((p) => {
      const on = id && (p.dataset.a === id || p.dataset.b === id);
      p.classList.toggle("on", !!on);
      p.classList.toggle("off", !!id && !on);
    });
    render();
  }

  build();
  labels();
  select(null);
  draw();
  if (langZone) {
    langZone.addEventListener("dblclick", (ev) => {
      ev.stopPropagation();
      lang = lang === "en" ? "ru" : "en";
      try {
        localStorage.setItem("km-lang", lang);
      } catch (e) {
        /* private mode */
      }
      labels();
      render();
      requestAnimationFrame(draw);
    });
  }
  map.addEventListener("click", () => {
    if (selected) select(null);
  });
  document.addEventListener("keydown", (e) => {
    if (e.key === "Escape" && selected) select(null);
  });
  window.addEventListener("resize", draw);
  if (document.fonts && document.fonts.ready) document.fonts.ready.then(draw);
  window.addEventListener("load", draw);
}
