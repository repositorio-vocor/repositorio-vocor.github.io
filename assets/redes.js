/* VoCor — página "Redes de los institutos" (redes.html). Lee redes.json y materiales.json (los arma scripts/build.py). */
const $ = s => document.querySelector(s);
const esc = s => String(s ?? "").replace(/[&<>"']/g, c => ({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[c]));
const norm = s => String(s ?? "").normalize("NFD").replace(/[̀-ͯ]/g,"").toLowerCase().trim();
const imgSrc = p => !p ? "" : /^https?:/.test(p) ? p : p.replace(/^\/+/, "");

/* ---------- Claro / oscuro (mismo comportamiento que la portada) ---------- */
function pintarTema(){
  const oscuro = document.documentElement.dataset.theme === "dark";
  const b = $("#btnTema"); b.setAttribute("aria-pressed", String(oscuro));
  b.querySelector("span").textContent = oscuro ? "Modo claro" : "Modo oscuro";
}
$("#btnTema").onclick = () => {
  const oscuro = document.documentElement.dataset.theme !== "dark";
  if (oscuro) document.documentElement.dataset.theme = "dark"; else delete document.documentElement.dataset.theme;
  try { localStorage.setItem("vocor-tema", oscuro ? "oscuro" : "claro"); } catch {}
  pintarTema();
};
pintarTema();

/* ---------- Redes ---------- */
const REDES = [
  ["web","Sitio web",'<circle cx="12" cy="12" r="9"/><path d="M3 12h18M12 3c3 3.2 3 14.8 0 18M12 3c-3 3.2-3 14.8 0 18"/>'],
  ["instagram","Instagram",'<rect x="3" y="3" width="18" height="18" rx="5"/><circle cx="12" cy="12" r="4"/><circle cx="17.5" cy="6.5" r=".8"/>'],
  ["facebook","Facebook",'<path d="M14 8h3V4h-3a4 4 0 0 0-4 4v3H7v4h3v6h4v-6h3l1-4h-4V8z"/>'],
  ["x","X",'<path d="M4 4l16 16M20 4L4 20"/>'],
  ["youtube","YouTube",'<rect x="2" y="5" width="20" height="14" rx="4"/><path d="m10 9 5 3-5 3z"/>'],
  ["tiktok","TikTok",'<path d="M14 3v11a4 4 0 1 1-4-4M14 3c.5 3 2.5 5 5 5"/>'],
  ["linktree","Linktree",'<path d="M12 21V9M6 7l6 5 6-5M7 14h10"/>'],
];
const ALIAS_UE = {"CIT VILLA MARIA":"CIT-UNVM"}; // sigla en redes → nombre usado en los materiales (igual en vocor.js)
// Grandes áreas de CONICET: [nombre completo, nombre corto (botones de filtro), color, etiqueta del recuadro (una sola línea)]
const AREAS_REDES = [
  ["Ciencias Agrarias, de las Ingenierías y Materiales","Agrarias, Ingenierías y Materiales","agr","Agrarias, Ing. y Mat."],
  ["Ciencias Biológicas y de la Salud","Biológicas y de la Salud","bio","Biológicas y Salud"],
  ["Ciencias Exactas y Naturales","Exactas y Naturales","exa","Exactas y Naturales"],
  ["Ciencias Sociales y Humanidades","Sociales y Humanidades","soc","Sociales y Humanidades"],
];
const areaColor = a => { const x = AREAS_REDES.find(([n])=>n===a); return x ? `var(--a-${x[2]})` : "var(--line)"; };
let redes = [], areaRed = "", porUE = new Map(), cargado = false;

function renderRedes(){
  const q = norm($("#qRedes").value);
  const cnt = new Map(); redes.forEach(r=>cnt.set(r.area, (cnt.get(r.area)||0)+1));
  $("#areaChips").innerHTML = AREAS_REDES.filter(([n])=>cnt.has(n)).map(([n,corto])=>`<button type="button" data-area="${esc(n)}" style="--ac:${areaColor(n)}" aria-pressed="${areaRed===n}" title="${esc(n)}"><i></i>${esc(corto)}<span>${cnt.get(n)}</span></button>`).join("");
  const list = redes.filter(r => (!q || norm(r.sigla).includes(q)) && (!areaRed || r.area===areaRed));
  $("#nRedes").textContent = !cargado ? "Cargando institutos…" : (q || areaRed) ? `${list.length} de ${redes.length} institutos` : `${redes.length} institutos`;
  const ico = d => `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${d}</svg>`;
  $("#redes").innerHTML = list.length ? list.map(r=>{
    const ue = ALIAS_UE[r.sigla] || r.sigla, n = porUE.get(ue) || 0;
    const links = REDES.filter(([k])=>/^https?:\/\//.test(r[k]||"")).map(([k,lab,d])=>`<a href="${esc(r[k])}" target="_blank" rel="noopener" title="${lab}" aria-label="${lab} de ${esc(r.sigla)}">${ico(d)}</a>`)
      .concat((Array.isArray(r.otros)?r.otros:[]).filter(o=>/^https?:\/\//.test(o?.url||"")).map(o=>`<a href="${esc(o.url)}" target="_blank" rel="noopener" title="${esc(o.texto||"Otro enlace")}" aria-label="${esc(o.texto||"Otro enlace")}">${ico(REDES[0][2])}</a>`));
    // "Ver N materiales" lleva al catálogo de la portada filtrado por ese instituto
    const ver = n ? `<a class="red-ver" href="./#${new URLSearchParams({ue})}">Ver ${n} material${n>1?"es":""}</a>` : "";
    return `<article class="red" style="--ac:${areaColor(r.area)}">${r.area?`<span class="red-area" title="${esc(r.area)}">${esc((AREAS_REDES.find(([n])=>n===r.area)||[0,0,0,r.area])[3])}</span>`:""}${r.logo?`<div class="red-logo"><img loading="lazy" src="${esc(imgSrc(r.logo))}" alt="Logo de ${esc(r.sigla)}" onerror="this.closest('.red').classList.add('sin-logo');this.parentNode.remove()"></div>`:""}<div class="red-h"><h3${r.logo?' class="sr-only"':""}>${esc(r.sigla)}</h3>${ver}</div>${links.length?`<div class="red-links">${links.join("")}</div>`:`<p class="red-pronto">Próximamente</p>`}</article>`;
  }).join("") : cargado ? `<p class="redes-empty">No hay institutos que coincidan con esa búsqueda.</p>` : "";
}
$("#qRedes").addEventListener("input", renderRedes);
$("#areaChips").addEventListener("click", e=>{ const b=e.target.closest("[data-area]"); if(!b) return; areaRed = areaRed===b.dataset.area ? "" : b.dataset.area; renderRedes(); });

renderRedes();
Promise.all([
  fetch("redes.json", {cache:"no-cache"}).then(r=>r.ok?r.json():null),
  fetch("materiales.json", {cache:"no-cache"}).then(r=>r.ok?r.json():[]).catch(()=>[]),
]).then(([d, items])=>{
  redes = (d?.institutos||[]).filter(r=>r?.sigla).sort((a,b)=>a.sigla.localeCompare(b.sigla,"es"));
  (items||[]).forEach(it=>(Array.isArray(it.ue)?it.ue:[]).forEach(u=>porUE.set(u,(porUE.get(u)||0)+1)));
  cargado = true; renderRedes();
}).catch(()=>{ cargado = true; $("#nRedes").textContent = ""; $("#redes").innerHTML = `<p class="redes-empty">No se pudieron cargar los institutos. Revisá tu conexión y recargá la página.</p>`; });
