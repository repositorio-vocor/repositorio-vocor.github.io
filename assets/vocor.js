/* VoCor — sitio público. Lee materiales.json (lo arma scripts/build.py) y dibuja el catálogo. */
const AREAS = ["Ciencias Agrarias","Ciencias Biológicas y de la Salud","Ciencias Exactas y Naturales","Ciencias Sociales y Humanidades","Tecnología, de la Ingeniería y Materiales"];
const PUBLICOS = ["Público General","Infancia temprana (0-5 años)","Infantil (7 a 11 años)","Juvenil (12 a 18 años)","Docentes"];

const $ = s => document.querySelector(s);
const esc = s => String(s ?? "").replace(/[&<>"']/g, c => ({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[c]));
const norm = s => String(s ?? "").normalize("NFD").replace(/[̀-ͯ]/g,"").toLowerCase().trim();
const arr = v => Array.isArray(v) ? v.filter(Boolean).map(String) : (v ? [String(v)] : []);
// Las rutas de imagen se guardan como "/imagenes/x.jpg"; se usan relativas para que funcione en usuario.github.io/vocor/
const imgSrc = p => !p ? "" : /^https?:/.test(p) ? p : p.replace(/^\/+/, "");

let items = [], loaded = false;
const F = {q:"", fmt:"", area:"", pub:"", ue:"", sort:"az"};

function toast(msg){ const t=$("#toast"); t.textContent=msg; t.hidden=false; clearTimeout(toast.t); toast.t=setTimeout(()=>t.hidden=true, 3200); }

function counts(key, list){ const m=new Map(); list.forEach(it=>arr(it[key]).forEach(v=>m.set(v,(m.get(v)||0)+1))); return m; }
function fillSelect(el, label, map, cur, order){
  const rest = [...map.keys()].filter(k=>!order || !order.includes(k)).sort((a,b)=>a.localeCompare(b,"es"));
  const keys = order ? order.filter(k=>map.has(k)).concat(rest) : rest;
  el.innerHTML = `<option value="">${label}</option>` + keys.map(k=>`<option value="${esc(k)}"${k===cur?" selected":""}>${esc(k)} (${map.get(k)})</option>`).join("");
  el.classList.toggle("on", !!cur);
}
function matches(it, skip){
  if (skip!=="fmt" && F.fmt && !arr(it.formato).includes(F.fmt)) return false;
  if (skip!=="area" && F.area && !arr(it.area).includes(F.area)) return false;
  if (skip!=="pub" && F.pub && !arr(it.publico).includes(F.pub)) return false;
  if (skip!=="ue" && F.ue && !arr(it.ue).includes(F.ue)) return false;
  if (F.q){
    const hay = norm([it.recurso, it.descripcion, ...arr(it.palabras), ...arr(it.ue), ...arr(it.formato), ...arr(it.area)].join(" "));
    if (!norm(F.q).split(/\s+/).every(w=>hay.includes(w))) return false;
  }
  return true;
}
const sortKey = s => norm(s).replace(/^[^a-z0-9]+/,"");
function cover(it, ph){
  return `<div class="cover"><div class="ph">${esc(ph)}</div>${it.imagen?`<img loading="lazy" alt="" src="${esc(imgSrc(it.imagen))}" onerror="this.remove()">`:""}`;
}
function render(){
  $("#sTotal").textContent = loaded ? items.length : "—";
  $("#sUE").textContent = loaded ? new Set(items.flatMap(i=>arr(i.ue))).size : "—";
  $("#sFmt").textContent = loaded ? new Set(items.flatMap(i=>arr(i.formato))).size : "—";

  fillSelect($("#fArea"), "Todas las áreas", counts("area", items.filter(i=>matches(i,"area"))), F.area, AREAS);
  fillSelect($("#fPub"), "Todo público", counts("publico", items.filter(i=>matches(i,"pub"))), F.pub, PUBLICOS);
  fillSelect($("#fUE"), "Todas las UE", counts("ue", items.filter(i=>matches(i,"ue"))), F.ue);
  const fm = counts("formato", items.filter(i=>matches(i,"fmt")));
  const fkeys = [...fm.keys()].sort((a,b)=>fm.get(b)-fm.get(a) || a.localeCompare(b,"es"));
  $("#fmtChips").innerHTML = `<button class="chip" type="button" data-fmt="" aria-pressed="${!F.fmt}">Todos los formatos</button>` +
    fkeys.map(k=>`<button class="chip" type="button" data-fmt="${esc(k)}" aria-pressed="${F.fmt===k}">${esc(k)}<span class="n">${fm.get(k)}</span></button>`).join("");

  const list = items.filter(i=>matches(i));
  list.sort(F.sort==="new" ? (a,b)=>String(b.creado||"").localeCompare(String(a.creado||"")) : (a,b)=>sortKey(a.recurso).localeCompare(sortKey(b.recurso),"es"));
  const active = F.q||F.fmt||F.area||F.pub||F.ue;
  $("#clear").hidden = !active;
  $("#resCount").textContent = !loaded ? "Cargando el repositorio…" : active ? `${list.length} de ${items.length} materiales` : `${items.length} materiales`;

  $("#grid").innerHTML = list.map(it=>`
    <button class="card" type="button" data-id="${esc(it.id)}">
      ${cover(it, (arr(it.formato)[0]||"VoCor").slice(0,2))}
        <div class="fmt">${arr(it.formato).slice(0,2).map(f=>`<span class="tag">${esc(f)}</span>`).join("")}</div></div>
      <div class="body">
        <span class="ue">${esc(arr(it.ue).join(" · "))}</span>
        <h3>${esc(it.recurso)}</h3>
        <p>${esc(it.descripcion)}</p>
        <div class="pub">${arr(it.publico).map(p=>`<span class="pill">${esc(p)}</span>`).join("")}</div>
      </div>
    </button>`).join("");

  const empty = $("#empty");
  if (loaded && !items.length){ empty.hidden=false; empty.innerHTML = `<h2>Todavía no hay materiales</h2><p>Cuando se carguen materiales van a aparecer acá.</p>`; }
  else if (loaded && !list.length){ empty.hidden=false; empty.innerHTML = `<h2>Sin resultados</h2><p>No hay materiales con esos filtros. <button class="linkbtn" type="button" id="clear2">Limpiar filtros</button></p>`; $("#clear2").onclick=clearF; }
  else empty.hidden=true;
  if (loaded) writeHash();
}
function clearF(){ Object.assign(F,{q:"",fmt:"",area:"",pub:"",ue:""}); $("#q").value=""; render(); }

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

$("#clear").onclick = clearF;
$("#q").addEventListener("input", e=>{ F.q=e.target.value; clearTimeout(render.t); render.t=setTimeout(render,120); });
$("#fArea").onchange = e=>{F.area=e.target.value; render();};
$("#fPub").onchange = e=>{F.pub=e.target.value; render();};
$("#fUE").onchange = e=>{F.ue=e.target.value; render();};
$("#fSort").onchange = e=>{F.sort=e.target.value; render();};
$("#fmtChips").onclick = e=>{ const b=e.target.closest(".chip"); if(!b) return; F.fmt = F.fmt===b.dataset.fmt ? "" : b.dataset.fmt; render(); };
$("#grid").onclick = e=>{ const c=e.target.closest(".card"); if(c) openDetail(c.dataset.id); };
const dDet = $("#dDet");
dDet.addEventListener("click", e=>{ if(e.target===dDet || e.target.closest("[data-close]")) dDet.close(); });
dDet.addEventListener("close", ()=>{ openId=null; writeHash(); });

let openId = null;
function openDetail(id){
  const it = items.find(i=>i.id===id); if(!it) return;
  openId = id;
  $("#detEye").textContent = arr(it.formato).join(" · ");
  const links = arr(it.links);
  $("#detBody").innerHTML = `<div class="det">
    <div>${cover(it,"VoCor")}</div></div>
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
  $("#detBody").querySelectorAll("[data-kw]").forEach(b=>b.onclick=()=>{ F.q=b.dataset.kw; $("#q").value=F.q; dDet.close(); render(); });
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
    const m = readHash(); render();
    if (m) openDetail(m);
  })
  .catch(()=>{ loaded=true; render(); const e=$("#empty"); e.hidden=false; e.innerHTML="<h2>No se pudo cargar el catálogo</h2><p>Revisá tu conexión y recargá la página.</p>"; });
