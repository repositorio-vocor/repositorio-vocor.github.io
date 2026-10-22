/* VoCor — sitio público. Lee materiales.json (lo arma scripts/build.py) y dibuja el catálogo. */
const AREAS = ["Ciencias Agrarias","Ciencias Biológicas y de la Salud","Ciencias Exactas y Naturales","Ciencias Sociales y Humanidades","Tecnología, de la Ingeniería y Materiales"];
const PUBLICOS = ["Público General","Infancia temprana (0-5 años)","Infantil (7 a 11 años)","Juvenil (12 a 18 años)","Docentes"];

/* Familias de formato: color e ícono. Un formato nuevo cae en "texto" hasta que se lo agregue acá. */
const ICONOS = {
  audio: '<rect x="9" y="3" width="6" height="11" rx="3"/><path d="M5 11a7 7 0 0 0 14 0M12 18v3"/>',
  video: '<rect x="3" y="5" width="18" height="14" rx="2"/><path d="m10 9 5 3-5 3z"/>',
  texto: '<path d="M5 4h10l4 4v12H5z"/><path d="M15 4v4h4M8 12h8M8 16h6"/>',
  edu:   '<path d="M2 9l10-5 10 5-10 5z"/><path d="M6 11v5c3.5 2.5 8.5 2.5 12 0v-5M22 9v6"/>',
  web:   '<circle cx="12" cy="12" r="9"/><path d="M3 12h18M12 3c3 3.2 3 14.8 0 18M12 3c-3 3.2-3 14.8 0 18"/>',
  libro: '<path d="M4 5.5C6.5 4 9.5 4 12 5.5 14.5 4 17.5 4 20 5.5V19c-2.5-1.5-5.5-1.5-8 0-2.5-1.5-5.5-1.5-8 0z"/><path d="M12 5.5V19"/>',
  revista:'<rect x="5" y="3" width="14" height="18" rx="1"/><path d="M8 7h8M8 11h8M8 15h5"/>',
  redes: '<circle cx="6" cy="12" r="2.5"/><circle cx="18" cy="6" r="2.5"/><circle cx="18" cy="18" r="2.5"/><path d="m8.2 10.8 7.6-3.6M8.2 13.2l7.6 3.6"/>',
  charla:'<path d="M4 5h16v10H9l-5 4z"/>',
};
const FAMILIA = {
  "Podcast":["audio","audio"], "Notas y entrevistas":["audio","charla"],
  "Audiovisual":["video","video"], "Webinar":["video","charla"],
  "Libro":["texto","libro"], "Revista":["texto","revista"], "Publicación de divulgación científica":["texto","texto"],
  "Material didáctico":["edu","edu"],
  "Sitio Web":["web","web"], "Redes sociales":["web","redes"],
};
const fam = f => FAMILIA[f] || ["texto","texto"];
const colorDe = f => `var(--c-${fam(f)[0]})`;
const icono = (f, cls="") => `<svg class="${cls}" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${ICONOS[fam(f)[1]]}</svg>`;

const $ = s => document.querySelector(s);
const esc = s => String(s ?? "").replace(/[&<>"']/g, c => ({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[c]));
const norm = s => String(s ?? "").normalize("NFD").replace(/[̀-ͯ]/g,"").toLowerCase().trim();
const arr = v => Array.isArray(v) ? v.filter(Boolean).map(String) : (v ? [String(v)] : []);
// Las rutas de imagen se guardan como "/imagenes/x.jpg"; se usan relativas para que funcione en cualquier dirección
const imgSrc = p => !p ? "" : /^https?:/.test(p) ? p : p.replace(/^\/+/, "");
const sortKey = s => norm(s).replace(/^[^a-z0-9]+/,"");
const porFecha = (a,b) => String(b.creado||"").localeCompare(String(a.creado||"")) || sortKey(a.recurso).localeCompare(sortKey(b.recurso),"es");

let items = [], loaded = false, openId = null;
const F = {q:"", fmt:"", area:"", pub:"", ue:"", sort:"new"};
let view = "grid";
try { view = localStorage.getItem("vocor-vista") === "list" ? "list" : "grid"; } catch {}

function toast(msg){ const t=$("#toast"); t.textContent=msg; t.hidden=false; clearTimeout(toast.t); toast.t=setTimeout(()=>t.hidden=true, 3200); }
function counts(key, list){ const m=new Map(); list.forEach(it=>arr(it[key]).forEach(v=>m.set(v,(m.get(v)||0)+1))); return m; }
function fillSelect(el, label, map, cur, order){
  const rest = [...map.keys()].filter(k=>!order || !order.includes(k)).sort((a,b)=>a.localeCompare(b,"es"));
  const keys = order ? order.filter(k=>map.has(k)).concat(rest) : rest;
  if (cur && !keys.includes(cur)) keys.unshift(cur);
  el.innerHTML = `<option value="">${label}</option>` + keys.map(k=>`<option value="${esc(k)}"${k===cur?" selected":""}>${esc(k)} (${map.get(k)||0})</option>`).join("");
  el.classList.toggle("on", !!cur);
}
function matches(it, skip){
  if (skip!=="fmt" && F.fmt && !arr(it.formato).includes(F.fmt)) return false;
  if (skip!=="area" && F.area && !arr(it.area).includes(F.area)) return false;
  if (skip!=="pub" && F.pub && !arr(it.publico).includes(F.pub)) return false;
  if (skip!=="ue" && F.ue && !arr(it.ue).includes(F.ue)) return false;
  if (F.q){
    const hay = norm([it.recurso, it.descripcion, ...arr(it.palabras), ...arr(it.ue), ...arr(it.formato), ...arr(it.area), ...arr(it.publico)].join(" "));
    if (!norm(F.q).split(/\s+/).every(w=>hay.includes(w))) return false;
  }
  return true;
}
const tagsHTML = it => arr(it.formato).slice(0,2).map(f=>`<span class="tag" style="--c:${colorDe(f)}">${icono(f)}${esc(f)}</span>`).join("");
const imgTag = (it, lazy=true) => it.imagen ? `<img ${lazy?'loading="lazy" ':''}alt="" src="${esc(imgSrc(it.imagen))}" onerror="this.remove()">` : "";

/* ---------- Secciones fijas ---------- */
function renderFormats(){
  const fm = counts("formato", items);
  const keys = [...fm.keys()].sort((a,b)=>fm.get(b)-fm.get(a) || a.localeCompare(b,"es"));
  $("#formats").innerHTML = keys.map(k=>`
    <button class="ftile" type="button" data-fmt="${esc(k)}" style="--c:${colorDe(k)}" aria-pressed="${F.fmt===k}">
      <span class="ic">${icono(k)}</span><b>${esc(k)}</b><span>${fm.get(k)} material${fm.get(k)>1?"es":""}</span>
    </button>`).join("");
}
function renderFeatured(){
  const top = [...items].sort(porFecha).slice(0,3);
  $("#secNew").hidden = top.length < 3;
  if (top.length < 3) return;
  const card = (it, big) => `
    <button class="fcard${big?" big":""}" type="button" data-id="${esc(it.id)}">
      ${imgTag(it, false)}<span class="shade"></span>
      ${big?'<span class="badge-new">Nuevo</span>':""}
      <span class="txt"><span class="tags">${tagsHTML(it)}</span><span class="ue">${esc(arr(it.ue).join(" · "))}</span><h3>${esc(it.recurso)}</h3>${big&&it.descripcion?`<p>${esc(it.descripcion)}</p>`:""}</span>
    </button>`;
  $("#feat").innerHTML = card(top[0], true) + `<div class="feat-side">${card(top[1])}${card(top[2])}</div>`;
}
function renderUEs(){
  const m = counts("ue", items);
  const max = Math.max(1, ...m.values());
  const keys = [...m.keys()].sort((a,b)=>m.get(b)-m.get(a) || a.localeCompare(b,"es"));
  $("#ues").innerHTML = keys.map(k=>`
    <button class="uebtn" type="button" data-ue="${esc(k)}" title="${esc(k)}">
      <b>${esc(k)}</b><span class="bar-n"><span class="meter"><i style="width:${Math.round(m.get(k)/max*100)}%"></i></span><span>${m.get(k)}</span></span>
    </button>`).join("");
}

/* ---------- Catálogo ---------- */
function render(){
  $("#sTotal").textContent = loaded ? items.length : "—";
  $("#sUE").textContent = loaded ? new Set(items.flatMap(i=>arr(i.ue))).size : "—";
  $("#sFmt").textContent = loaded ? new Set(items.flatMap(i=>arr(i.formato))).size : "—";

  fillSelect($("#fFmt"), "Todos los formatos", counts("formato", items.filter(i=>matches(i,"fmt"))), F.fmt);
  fillSelect($("#fArea"), "Todas las áreas", counts("area", items.filter(i=>matches(i,"area"))), F.area, AREAS);
  fillSelect($("#fPub"), "Todo público", counts("publico", items.filter(i=>matches(i,"pub"))), F.pub, PUBLICOS);
  fillSelect($("#fUE"), "Todas las UE", counts("ue", items.filter(i=>matches(i,"ue"))), F.ue);
  document.querySelectorAll(".ftile").forEach(b=>b.setAttribute("aria-pressed", String(F.fmt===b.dataset.fmt)));

  const list = items.filter(i=>matches(i));
  list.sort(F.sort==="new" ? porFecha : (a,b)=>sortKey(a.recurso).localeCompare(sortKey(b.recurso),"es"));
  const chips = [["q",F.q&&`“${F.q}”`],["fmt",F.fmt],["area",F.area],["pub",F.pub],["ue",F.ue]].filter(([,v])=>v);
  $("#active").innerHTML = chips.map(([k,v])=>`<button type="button" data-k="${k}" aria-label="Quitar filtro ${esc(v)}">${esc(v)} ×</button>`).join("");
  $("#clear").hidden = chips.length < 2;
  $("#resCount").textContent = !loaded ? "Cargando el repositorio…" : chips.length ? `${list.length} de ${items.length} materiales` : `${items.length} materiales`;

  const g = $("#grid");
  g.classList.toggle("list", view==="list");
  document.querySelectorAll("[data-view]").forEach(b=>b.setAttribute("aria-pressed", String(b.dataset.view===view)));
  g.innerHTML = list.map(it=>{
    const f0 = arr(it.formato)[0] || "";
    return `
    <button class="card" type="button" data-id="${esc(it.id)}" style="--c:${colorDe(f0)}">
      <div class="cover"><div class="ph">${icono(f0)}</div>${imgTag(it)}<span class="go">Ver material →</span></div>
      <div class="body">
        <span class="tags">${tagsHTML(it)}</span>
        <h3>${esc(it.recurso)}</h3>
        <span class="ue">${esc(arr(it.ue).join(" · "))}</span>
        <p>${esc(it.descripcion)}</p>
        <div class="pub">${arr(it.publico).map(p=>`<span class="pill">${esc(p)}</span>`).join("")}</div>
      </div>
    </button>`; }).join("");

  const empty = $("#empty");
  if (loaded && !items.length){ empty.hidden=false; empty.innerHTML = `<h2>Todavía no hay materiales</h2><p>Cuando se carguen materiales van a aparecer acá.</p>`; }
  else if (loaded && !list.length){ empty.hidden=false; empty.innerHTML = `<h2>Sin resultados</h2><p>No hay materiales con esos filtros. <button class="linkbtn" type="button" id="clear2">Limpiar filtros</button></p>`; $("#clear2").onclick=clearF; }
  else empty.hidden=true;
  if (loaded) writeHash();
}
function clearF(){ Object.assign(F,{q:"",fmt:"",area:"",pub:"",ue:""}); $("#q").value=""; $("#qHero").value=""; render(); }
function toCatalog(){ $("#catalogo").scrollIntoView({behavior: matchMedia("(prefers-reduced-motion: reduce)").matches ? "auto" : "smooth"}); }

/* Filtros en la dirección (#formato=Podcast&q=...) para poder compartir una búsqueda */
function writeHash(){
  const p = new URLSearchParams();
  if (F.q) p.set("q",F.q); if (F.fmt) p.set("formato",F.fmt); if (F.area) p.set("area",F.area);
  if (F.pub) p.set("publico",F.pub); if (F.ue) p.set("ue",F.ue); if (openId) p.set("m",openId);
  const h = p.toString(); history.replaceState(null, "", h ? "#"+h : location.pathname + location.search);
}
function readHash(){
  const p = new URLSearchParams(location.hash.slice(1));
  F.q=p.get("q")||""; F.fmt=p.get("formato")||""; F.area=p.get("area")||""; F.pub=p.get("publico")||""; F.ue=p.get("ue")||"";
  $("#q").value=F.q; return p.get("m");
}

/* ---------- Eventos ---------- */
$("#clear").onclick = clearF;
$("#q").addEventListener("input", e=>{ F.q=e.target.value; clearTimeout(render.t); render.t=setTimeout(render,120); });
$("#heroForm").addEventListener("submit", e=>{ e.preventDefault(); Object.assign(F,{fmt:"",area:"",pub:"",ue:""}); F.q=$("#qHero").value.trim(); $("#q").value=F.q; render(); toCatalog(); });
$("#fFmt").onchange = e=>{F.fmt=e.target.value; render();};
$("#fArea").onchange = e=>{F.area=e.target.value; render();};
$("#fPub").onchange = e=>{F.pub=e.target.value; render();};
$("#fUE").onchange = e=>{F.ue=e.target.value; render();};
$("#fSort").onchange = e=>{F.sort=e.target.value; render();};
$("#active").onclick = e=>{ const b=e.target.closest("[data-k]"); if(!b) return; F[b.dataset.k]=""; if(b.dataset.k==="q"){ $("#q").value=""; $("#qHero").value=""; } render(); };
document.querySelector(".views").onclick = e=>{ const b=e.target.closest("[data-view]"); if(!b) return; view=b.dataset.view; try{localStorage.setItem("vocor-vista",view);}catch{} render(); };
$("#formats").onclick = e=>{ const b=e.target.closest(".ftile"); if(!b) return; F.fmt = F.fmt===b.dataset.fmt ? "" : b.dataset.fmt; render(); if(F.fmt) toCatalog(); };
$("#ues").onclick = e=>{ const b=e.target.closest(".uebtn"); if(!b) return; clearF(); F.ue=b.dataset.ue; render(); toCatalog(); };
document.addEventListener("click", e=>{ const c=e.target.closest(".card,.fcard"); if(c) openDetail(c.dataset.id); });
const dDet = $("#dDet");
dDet.addEventListener("click", e=>{ if(e.target===dDet || e.target.closest("[data-close]")) dDet.close(); });
dDet.addEventListener("close", ()=>{ openId=null; writeHash(); });

function openDetail(id){
  const it = items.find(i=>i.id===id); if(!it) return;
  openId = id;
  const f0 = arr(it.formato)[0] || "";
  $("#detEye").innerHTML = tagsHTML(it);
  const links = arr(it.links);
  $("#detBody").innerHTML = `<div class="det">
    <div><div class="cover" style="--c:${colorDe(f0)}"><div class="ph">${icono(f0)}</div>${imgTag(it,false)}</div></div>
    <div style="min-width:0">
      <span class="ue">${esc(arr(it.ue).join(" · "))}</span>
      <h2>${esc(it.recurso)}</h2>
      ${it.descripcion?`<p class="desc">${esc(it.descripcion)}</p>`:""}
      <dl class="meta">
        ${arr(it.area).length?`<dt>Área</dt><dd>${esc(arr(it.area).join(" · "))}</dd>`:""}
        ${arr(it.publico).length?`<dt>Público</dt><dd>${esc(arr(it.publico).join(" · "))}</dd>`:""}
        ${arr(it.palabras).length?`<dt>Temas</dt><dd class="kw">${arr(it.palabras).map(k=>`<button type="button" data-kw="${esc(k)}">${esc(k)}</button>`).join("")}</dd>`:""}
      </dl>
      ${links.length?`<div class="links">${links.map((l,i)=>`<a class="btn${i===0?" primary":""}" href="${esc(l)}" target="_blank" rel="noopener">${i===0?"Ver material":"Enlace "+(i+1)} ↗</a>`).join("")}</div>`:`<p style="color:var(--ink-2)">Sin enlace cargado.</p>`}
    </div></div>`;
  $("#detBody").querySelectorAll("[data-kw]").forEach(b=>b.onclick=()=>{ F.q=b.dataset.kw; $("#q").value=F.q; dDet.close(); render(); toCatalog(); });
  if (!dDet.open) dDet.showModal();
  writeHash();
}

$("#btnExport").onclick = e=>{
  e.preventDefault();
  if (typeof XLSX==="undefined"){ toast("No se pudo preparar el archivo. Probá recargar la página."); return; }
  const rows = [...items].sort((a,b)=>sortKey(a.recurso).localeCompare(sortKey(b.recurso),"es")).map(i=>[i.recurso, arr(i.ue).join("; "), arr(i.area).join("; "), arr(i.formato).join("; "), arr(i.publico).join("; "), arr(i.palabras).join(", "), i.descripcion||"", arr(i.links).join(" ")]);
  const ws = XLSX.utils.aoa_to_sheet([["Recurso","UE","Área","Formato","Público","Palabras clave","Descripción","Links"], ...rows]);
  ws["!cols"] = [40,22,34,22,26,30,60,40].map(w=>({wch:w}));
  const wb = XLSX.utils.book_new(); XLSX.utils.book_append_sheet(wb, ws, "Materiales");
  XLSX.writeFile(wb, `vocor-catalogo-${new Date().toISOString().slice(0,10)}.xlsx`);
};

render();
fetch("materiales.json", {cache:"no-cache"})
  .then(r=>{ if(!r.ok) throw new Error(r.status); return r.json(); })
  .then(data=>{
    items = data; loaded = true;
    const m = readHash();
    renderFormats(); renderFeatured(); renderUEs(); render();
    if (m) openDetail(m);
  })
  .catch(()=>{ loaded=true; render(); const e=$("#empty"); e.hidden=false; e.innerHTML="<h2>No se pudo cargar el catálogo</h2><p>Revisá tu conexión y recargá la página.</p>"; });
