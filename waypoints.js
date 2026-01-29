/*
  waypoints.js — icono 8px + zoom 1.5x y ficha pegada por POI (mismo formato).
  - Usa assets/icons/way.png
  - Auto-resuelve regiones anidadas
  - Centroide visual por muestreo
  - Copia de la "ficha" de la parroquia y extrae la sección correspondiente al POI
*/
(function(){
  'use strict';
  const $ = (sel,root=document)=>root.querySelector(sel);
  const $$ = (sel,root=document)=>Array.from(root.querySelectorAll(sel));
  const DEFAULT_WAYPOINT_ICON = 'assets/icons/way.png';

// ---- Tooltip hover para waypoints ----
  // Timers para retardar la aparición del tooltip
  let WP_HOVER_TIMER = null;
  function clearHoverTimer(){ if(WP_HOVER_TIMER){ clearTimeout(WP_HOVER_TIMER); WP_HOVER_TIMER = null; } }

let WP_TOOLTIP = null;
function ensureTooltip(){
  if (WP_TOOLTIP) return WP_TOOLTIP;
  const el = document.createElement('div');
  el.className = 'wp-tooltip';
  el.setAttribute('role','tooltip');
  el.style.opacity = '0';
  el.style.transform = 'translateY(-4px)';
  el.style.display = 'none';
  document.body.appendChild(el);
  WP_TOOLTIP = el;
  return el;
}
function setTooltipContent(poi){
  const el = ensureTooltip();
  const title = (poi && poi.title) ? poi.title : '';
  const img = (poi && poi.images && poi.images[0]) ? poi.images[0] : '';
  el.innerHTML = `<h4 class="wp-tooltip__title"></h4>${img?`<img class="wp-tooltip__img" alt="">`:''}`;
  el.querySelector('.wp-tooltip__title').textContent = title || '';
  if (img){
    const im = el.querySelector('.wp-tooltip__img');
    im.src = img;
    im.alt = title || '';
  }
}
function showTooltipAt(x,y){
  const el = ensureTooltip();
  const pad=12, vw=window.innerWidth, vh=window.innerHeight;
  const rectW = el.offsetWidth||280, rectH = el.offsetHeight||120;
  // Posición preferente arriba-izquierda del cursor
  let left = Math.min(Math.max(x+14, pad), vw - rectW - pad);
  let top  = Math.min(Math.max(y-rectH-14, pad), vh - rectH - pad);
  el.style.left = left + 'px';
  el.style.top  = top + 'px';
  el.style.display = 'block';
  requestAnimationFrame(()=>{ el.style.opacity='1'; el.style.transform='translateY(0)'; });
}
function hideTooltip(){
  if (!WP_TOOLTIP) return;
  WP_TOOLTIP.style.opacity='0';
  WP_TOOLTIP.style.transform='translateY(-4px)';
  // Retraso breve para permitir transición
  setTimeout(()=>{ if(WP_TOOLTIP) WP_TOOLTIP.style.display='none'; }, 140);
}


function getViewBox(svg){
  const vb = (svg.getAttribute('viewBox')||'').trim().split(/\s+/).map(parseFloat);
  if (vb.length===4 && vb.every(n=>!isNaN(n))) return {minx:vb[0], miny:vb[1], w:vb[2], h:vb[3]};
  const r = svg.getBBox ? svg.getBBox() : {x:0,y:0,width:svg.clientWidth||1000,height:svg.clientHeight||1000};
  return {minx:r.x, miny:r.y, w:r.width, h:r.height};
}
function applyPositionToMarker(svg, g, pos){
  if(!pos) return;
  const vb = getViewBox(svg);
  const baseX = vb.minx + (pos.vx/100)*vb.w;
  const baseY = vb.miny + (pos.vy/100)*vb.h;

  // Si hay círculo (nuevo marcador), ancla inferior (como el icono anterior)
  const c = g.querySelector('circle.waypoint-circle, circle.waypoint-circle');
  if(c){
    const r = parseFloat(c.getAttribute('r')) || 4;
    const cy = baseY - r; // bottom anchor
    c.setAttribute('cx', baseX);
    c.setAttribute('cy', cy);
    const h = g.querySelector('circle.waypoint-halo, circle.waypoint-halo');
    if(h){
      h.setAttribute('cx', baseX);
      h.setAttribute('cy', cy);
    }
    return;
  }

  // Compatibilidad: si aún existe image
  const img = g.querySelector('image'); 
  if(!img) return;
  const w = parseFloat(img.getAttribute('width'))||8;
  const h = parseFloat(img.getAttribute('height'))||8;
  const x = baseX - w/2;
  const y = baseY - h;
  img.setAttribute('x', x);
  img.setAttribute('y', y);
}


  function normalizeName(s){
    try{
      let t = s.toString().replace(/[_-]+/g,' ');
      t = t.normalize('NFD').replace(/[\u0300-\u036f]/g,'');
      t = t.toLowerCase().trim().replace(/^parroquia\s+/, '');
      t = t.replace(/\s+/g,' ');
      t = t.replace(/^(la|el|los|las)\s+/, '');
      return t.trim();
    }catch(e){
      return (s||'').toString().toLowerCase().trim();
    }
  }

  function waitForSVG(){
    return new Promise(resolve=>{
      const container = $('#svgContainer');
      if (!container){ resolve(document.querySelector('svg')); return; }
      let tries = 0;
      const iv = setInterval(()=>{
        const svg = container.querySelector('svg');
        if (svg){ clearInterval(iv); resolve(svg); }
        else if (++tries>100){ clearInterval(iv); resolve(document.querySelector('svg')); }
      }, 60);
    });
  }

  async function loadJSON(p){
    try{ const r = await fetch(p,{cache:'no-store'}); return await r.json(); }
    catch(e){ console.warn('[WP] sin JSON', e); return {}; }
  }

  function collectRegions(svg){
    const regs = [];
    $$('g.region', svg).forEach(g=>{
      const raw = (g.getAttribute('aria-label')||g.id||'').replace(/^Parroquia\s+/i,'').trim();
      if (raw) regs.push({el:g, name: raw});
    });
    if (regs.length) return regs;
    $$('g', svg).forEach(g=>{
      const raw = (g.getAttribute('aria-label')||g.id||'').replace(/^Parroquia\s+/i,'').trim();
      if (raw) regs.push({el:g, name: raw});
    });
    return regs;
  }

  function ensureLayer(svg){
    let layer = svg.querySelector('g.wp-root');
    if (!layer){
      layer = document.createElementNS('http://www.w3.org/2000/svg','g');
      layer.setAttribute('class','wp-root');
      svg.appendChild(layer);
    }
    return layer;
  }

  function regionCentroid(targetEl, svg){
    let bb; try{ bb = targetEl.getBBox(); }catch(e){ return {x:0,y:0}; }
    const cols = 24, rows = 24;
    const pt = svg.createSVGPoint();
    let sx = 0, sy = 0, n = 0;
    for (let i=0;i<cols;i++){
      for (let j=0;j<rows;j++){
        const x = bb.x + (i+0.5)*bb.width/cols;
        const y = bb.y + (j+0.5)*bb.height/rows;
        pt.x = x; pt.y = y;
        try{
          if (targetEl.isPointInFill && targetEl.isPointInFill(pt)) { sx += x; sy += y; n++; }
        }catch(e){}
      }
    }
    if (n>0) return {x: sx/n, y: sy/n};
    return {x: bb.x + bb.width/2, y: bb.y + bb.height/2};
  }

  function resolveRegionElement(svg, rawName, baseEl){
    const key = normalizeName(rawName);
    const inside = $$('path,polygon', baseEl).find(p=>{
      const n = normalizeName(p.getAttribute('aria-label')||p.id||'');
      return n===key || n.includes(key) || key.includes(n);
    });
    if (inside) return inside;
    const candidates = $$('path,polygon', svg).filter(p=>{
      const n = normalizeName(p.getAttribute('aria-label')||p.id||'');
      return n===key || n.includes(key) || key.includes(n);
    });
    if (candidates.length) return candidates[0];
    return baseEl;
  }

  // --- FICHA: localizar la sección concreta del POI dentro de la ficha de la parroquia ---
  function getParishFichaRoot(parishName){
    const key = normalizeName(parishName);
    const selectors = [
      `[data-parish]`, `[data-parroquia]`, `#ficha-${key}`, `#parish-${key}`, `.ficha[data-parish]`, `.parish-ficha`, `.parroquia-ficha`
    ];
    for (const sel of selectors){
      const nodes = $$(sel, document);
      for (const node of nodes){
        const attrs = [
          node.getAttribute('data-parish'),
          node.getAttribute('data-parroquia'),
          node.id || '',
          node.getAttribute('aria-label')||''
        ].map(v => normalizeName(v||''));
        const inText = normalizeName(node.textContent||'');
        if (attrs.includes(key) || inText.includes(key)) return node;
      }
    }
    return null;
  }

  function getPOISectionHTML(parishName, poi){
    const root = getParishFichaRoot(parishName);
    if (!root) return '';

    const keyTitle = normalizeName(poi.title||'');

    // 1) Por data-id/anchors
    const direct = root.querySelector(`[data-poi-id="${poi.id}"]`) || root.querySelector(`#${poi.id}`) || root.querySelector(`[data-id="${poi.id}"]`);
    if (direct){
      // Incluir el propio nodo + sus hermanos siguientes hasta el próximo encabezado/POI
      return sliceUntilNextSection(direct);
    }

    // 2) Buscar por texto de título (en headings y listas)
    const headings = root.querySelectorAll('h1,h2,h3,h4,h5,dt,li,strong,em,b');
    for (const h of headings){
      const txt = normalizeName(h.textContent||'');
      if (txt.includes(keyTitle) || keyTitle.includes(txt)){
        return sliceUntilNextSection(h);
      }
    }

    // 3) Último recurso: primer párrafo que contenga el título
    const paras = root.querySelectorAll('p');
    for (const p of paras){
      const txt = normalizeName(p.textContent||'');
      if (txt.includes(keyTitle)){
        return p.outerHTML;
      }
    }

    return '';
  }

  function sliceUntilNextSection(startNode){
    // Toma el nodo de inicio y concatena sus hermanos siguientes hasta llegar a un límite (encabezado/HR/separador)
    const limits = new Set(['H1','H2','H3','H4','H5','HR']);
    let html = startNode.outerHTML || '';
    let node = startNode.nextElementSibling;
    while (node){
      if (limits.has(node.tagName)) break;
      // si detectamos otro bloque marcado como data-poi-id, cortamos
      if (node.hasAttribute && (node.hasAttribute('data-poi-id') || node.hasAttribute('data-id'))) break;
      html += node.outerHTML || '';
      node = node.nextElementSibling;
    }
    return html;
  }

  function openPopup(title, desc, images, parishName, poi){
    // 1) Intentar sección específica del POI desde la ficha (manteniendo formato)
    const poiHTML = getPOISectionHTML(parishName, poi);
    // 2) Si no hay sección, usar desc/imágenes del JSON
    const fallbackHTML=(function(){ let html=''; if(desc){ try{ html+=(typeof mdToHTML==='function')?mdToHTML(desc):`<p>${desc}</p>`;}catch(e){ html+=`<p>${desc}</p>`;} } return html; })();

    
// --- Single image rendering for waypoints (no thumbnails/carrusel) ---
try{
  const wrap = document.getElementById('parishSwiperWrapper');
  if (wrap){
    wrap.innerHTML = '';
    // Fallback to parish image if none
    if ((!images || images.length===0) && parish){
      const parishSlug = parish.toLowerCase()
        .replace(/[áàä]/g,'a').replace(/[éèë]/g,'e')
        .replace(/[íìï]/g,'i').replace(/[óòö]/g,'o')
        .replace(/[úùü]/g,'u').replace(/ñ/g,'n')
        .replace(/[^a-z0-9]+/g,'-').replace(/^-+|-+$/g,'');
      images = [`assets/parroquias/${parishSlug}/01.png`];
    }
    const mainSrc = (images && images.length) ? images[0] : '';
    const img = document.createElement('img');
    img.src = mainSrc;
    img.alt = title || '';
    img.loading = 'lazy';
    img.decoding = 'async';
    img.style.width = '100%';
    img.style.height = 'auto';
    img.style.borderRadius = '12px';
    img.style.margin = '.5rem 0';
    wrap.appendChild(img);
  }
}catch(e){ console.warn('single-image waypoint render failed', e); }
const modal = $('#modal');
    if(modal){
      const titleEl = $('#modalTitle');
      const contentEl = $('#modalContent');
      if(titleEl) titleEl.textContent = title;
      if(contentEl) contentEl.innerHTML = poiHTML || fallbackHTML || '';
      modal.setAttribute('aria-hidden','false');
      // Hide thumbs strip for waypoints (no miniatures)
const thumbsEl = document.getElementById('parishThumbs');
if (thumbsEl) thumbsEl.style.display = 'none';
try { } catch(e){}
document.body.style.overflow='hidden';
      try{ }catch(e){}
      return;
    }
    // Fallback: plano
    const plain = (poiHTML && poiHTML.replace(/<[^>]+>/g,'')) || (desc||'');
    alert(title + (plain ? ('\n\n'+plain) : ''));
  }

  // --- Waypoint hover animation (radii) ---
function animateWaypointRadii(haloEl, circleEl, targetHaloR, targetCircleR, durationMs){
  const start = performance.now();
  const h0 = parseFloat(haloEl.getAttribute('r')) || 0;
  const c0 = parseFloat(circleEl.getAttribute('r')) || 0;
  const dh = targetHaloR - h0;
  const dc = targetCircleR - c0;

  function easeOutQuad(t){ return 1 - (1 - t) * (1 - t); }

  function step(now){
    const t = Math.min(1, (now - start) / durationMs);
    const e = easeOutQuad(t);
    haloEl.setAttribute('r', (h0 + dh * e).toFixed(3));
    circleEl.setAttribute('r', (c0 + dc * e).toFixed(3));
    if (t < 1) requestAnimationFrame(step);
  }
  requestAnimationFrame(step);
}

function makeMarker(x, y, poi, parishName){
  const svgns = 'http://www.w3.org/2000/svg';
  const g = document.createElementNS(svgns,'g');
  g.setAttribute('class','waypoint');
  g.dataset.parish = parishName || '';
  g.dataset.id = (poi && poi.id) ? poi.id : '';

  // Halo + círculo (tamaño base por atributos; el hover se controla por CSS)
  const halo = document.createElementNS(svgns,'circle');
  halo.setAttribute('class','waypoint-halo');
  halo.setAttribute('cx', String(x));
  halo.setAttribute('cy', String(y));
  halo.setAttribute('r', '4');      // base
  g.appendChild(halo);

  const c = document.createElementNS(svgns,'circle');
  c.setAttribute('class','waypoint-circle');
  c.setAttribute('cx', String(x));
  c.setAttribute('cy', String(y));
  c.setAttribute('r', '2.5');       // base
  g.appendChild(c);

  // Añadir texto "Fitoria" justo debajo del waypoint si es Fitoria
  if (poi && poi.id === 'fitoria') {
    // Obtener viewBox del SVG para calcular el offset en píxeles
    const svg = g.ownerSVGElement || document.querySelector('svg');
    const vb = getViewBox(svg);
    
    // Usar la misma vx que el waypoint
    const textVx = poi.pos ? poi.pos.vx : 61.51597071511568;
    const waypointVy = poi.pos ? poi.pos.vy : 33.61377132862209;
    
    // Calcular offset de 12px en porcentaje del viewBox (más separado del icono)
    const offsetPx = 12;
    const offsetPercent = (offsetPx / vb.h) * 100;
    const textVy = waypointVy + offsetPercent;
    
    const textX = vb.minx + (textVx / 100) * vb.w;
    const textY = vb.miny + (textVy / 100) * vb.h;
    
    const text = document.createElementNS(svgns, 'text');
    text.setAttribute('x', String(textX));
    text.setAttribute('y', String(textY));
    text.setAttribute('text-anchor', 'middle');
    text.setAttribute('font-family', 'Montserrat, sans-serif');
    text.setAttribute('font-size', '7');
    text.setAttribute('font-weight', '400'); // Regular
    text.setAttribute('fill', '#ffffff');
    text.setAttribute('class', 'waypoint-label');
    text.textContent = 'Fitoria';
    g.appendChild(text);
  }

  // Click abre popup
  g.addEventListener('click', (e)=>{
    e.stopPropagation();
    try{
      (typeof openPopup === 'function' ? openPopup : openPopup_hook)(poi.title, poi.desc || '', poi.images || [], parishName, poi);
    }catch(err){}
  });

  // Accesibilidad básica
  g.setAttribute('tabindex','0');
  g.setAttribute('role','button');
  g.setAttribute('aria-label', (poi && poi.title) ? poi.title : 'Punto de interés');
  g.addEventListener('keydown', (e)=>{
    if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); g.dispatchEvent(new MouseEvent('click')); }
  });

  return g;
}

  function placeWaypoints(svg, regions, map){
    const layer = ensureLayer(svg);
    Array.from(layer.querySelectorAll('g.wp')).forEach(n=>n.remove());

    regions.forEach(r=>{
      const k = normalizeName(r.name);
      const list = map[k] || [];
      if (!list.length) return;

      const target = resolveRegionElement(svg, r.name, r.el);
      const cen = regionCentroid(target, svg);

      const N = list.length;
      const dy = 12;
      const positions = Array.from({length:N}, (_,i)=>({x:cen.x, y:cen.y + (i-(N-1)/2)*dy}));
      positions.forEach((p,idx)=>{
        const g = makeMarker(p.x, p.y, list[idx], r.name);
      layer.appendChild(g);
      try{ if(list[idx] && list[idx].pos){ applyPositionToMarker(svg, g, list[idx].pos); } }catch(e){}});
    });
  }

  (async function init(){
    const [svg, data, pos] = await Promise.all([ waitForSVG(), loadJSON('assets/data/waypoints.json'), loadJSON('assets/data/waypoint-positions.svg.json') ]);
    const map = {}; Object.keys(data||{}).forEach(k=>{ map[normalizeName(k)] = data[k]; });
    const regions = collectRegions(svg);

// Añadir Oviedo (no se lista) solo para poder pintar sus puntos de interés
try{
  if (data && data['Oviedo'] && Array.isArray(data['Oviedo']) && data['Oviedo'].length){
    const ovEl = svg.querySelector('#Oviedo, #OVIEDO, [id="oviedo"]');
    if (ovEl){
      const has = regions.some(rr => normalizeName(rr.name) === normalizeName('Oviedo'));
      if (!has) regions.push({ name:'Oviedo', el: ovEl });
    }
  }
}catch(e){}
    placeWaypoints(svg, regions, map, pos||{});
  })();
})();