/**
 * Mapa Interactivo Parroquias de Oviedo
 * Versión mejorada y optimizada
 */

// ============================================================================
// CONFIGURACIÓN Y CONSTANTES
// ============================================================================

const SVG_PATH = 'fondo.svg';

// Elementos del DOM
const svgContainer = document.getElementById('svgContainer');
const listEl = document.getElementById('parishList');
const searchInput = document.getElementById('searchInput');
const modal = document.getElementById('modal');
const modalClose = document.getElementById('modalClose');
const modalTitle = document.getElementById('modalTitle');
const modalContent = document.getElementById('modalContent');

// Estado de la aplicación
let regions = []; // Array de {el, name, id}
let parishData = {}; // Datos de cada parroquia
let lastFocused = null; // Elemento con foco antes de abrir modal
let parishSwiperInstance = null;
let parishThumbsInstance = null;

// Mapeo de nombres para mostrar
const DISPLAY_NAME_OVERRIDES = {
  "Agueria": "Agüeria",
  "San_Claudio": "San Claudio",
  "San Claudio": "San Claudio"
};

// ============================================================================
// UTILIDADES
// ============================================================================

/**
 * Convierte un string a slug
 */
function slugify(str) {
  return (str || '')
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)/g, '');
}

/**
 * Obtiene el nombre para mostrar en la UI
 */
function displayParishName(name) {
  const cleaned = (name || '').replaceAll('_', ' ').trim();
  return DISPLAY_NAME_OVERRIDES[name] || DISPLAY_NAME_OVERRIDES[cleaned] || cleaned;
}

/**
 * Genera array de imágenes placeholder
 */
function placeholderImagesFor(name) {
  return Array.from({ length: 10 }, (_, i) => 
    `assets/placeholders/${slugify(name || 'parroquia')}-${i + 1}.jpg`
  );
}

/**
 * Convierte Markdown simple a HTML
 */
function mdToHTML(src) {
  function escapeHtml(s) {
    return String(s || '')
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;');
  }
  
  function processContent(content) {
    // Escapar HTML excepto <u>, </u>, <br>
    // Primero proteger las etiquetas permitidas
    let processed = content;
    processed = processed.replace(/<u>/g, '___U_START___');
    processed = processed.replace(/<\/u>/g, '___U_END___');
    processed = processed.replace(/<br>/g, '___BR___');
    processed = processed.replace(/<br\/>/g, '___BR___');
    
    // Escapar el resto
    processed = escapeHtml(processed);
    
    // Restaurar las etiquetas permitidas
    processed = processed.replace(/___U_START___/g, '<u>');
    processed = processed.replace(/___U_END___/g, '</u>');
    processed = processed.replace(/___BR___/g, '<br>');
    
    return processed;
  }

  const lines = String(src || '').split(/\r?\n/);
  let html = '';
  let inList = false;
  let inNestedList = false;
  let secOpen = false;

  for (let i = 0; i < lines.length; i++) {
    const raw = lines[i];
    const line = raw.trim();

    // Encabezado "## "
    if (line.startsWith('## ')) {
      if (inNestedList) {
        html += '</ul>';
        inNestedList = false;
      }
      if (inList) {
        html += '</ul>';
        inList = false;
      }
      if (secOpen) {
        html += '</div>';
        secOpen = false;
      }
      const title = line.slice(3).trim();
      const slug = slugify(title);
      html += `<div class="sec sec--${slug}">`;
      secOpen = true;
      html += `<h2>${escapeHtml(title)}</h2>`;
      continue;
    }

    // Línea en blanco
    if (!line) {
      if (inNestedList) {
        html += '</ul>';
        inNestedList = false;
      }
      if (inList) {
        html += '</ul>';
        inList = false;
      }
      html += '<div class="sec__spacer"></div>';
      continue;
    }

    // Viñeta anidada (con espacios al inicio: "  - ")
    if (/^\s{2,}(-|•)\s+/.test(raw)) {
      const content = raw.replace(/^\s*(-|•)\s+/, '');
      if (!inNestedList) {
        html += '<ul class="nested-list">';
        inNestedList = true;
      }
      html += `<li>${processContent(content)}</li>`;
      continue;
    }

    // Viñeta principal "- " o "• "
    if (/^(-|•)\s+/.test(line)) {
      // Cerrar lista anidada si está abierta
      if (inNestedList) {
        html += '</ul>';
        inNestedList = false;
      }
      
      const content = raw.replace(/^(\s*(-|•)\s+)/, '');
      if (!inList) {
        html += '<ul>';
        inList = true;
      }
      html += `<li>${processContent(content)}</li>`;
      continue;
    }

    // Párrafo normal
    if (inNestedList) {
      html += '</ul>';
      inNestedList = false;
    }
    if (inList) {
      html += '</ul>';
      inList = false;
    }
    html += `<p>${processContent(raw)}</p>`;
  }

  if (inNestedList) html += '</ul>';
  if (inList) html += '</ul>';
  if (secOpen) html += '</div>';
  
  return html;
}

/**
 * Resetea el scroll del modal
 */
function resetModalScroll() {
  try {
    const bodyEl = document.querySelector('.modal__body');
    const contentEl = document.getElementById('modalContent');
    
    if (bodyEl) bodyEl.scrollTop = 0;
    if (contentEl) contentEl.scrollTop = 0;
    
    document.documentElement.scrollTop = 0;
    document.body.scrollTop = 0;
    
    window.scrollTo({ top: 0, left: 0, behavior: 'instant' });
  } catch (e) {
    console.warn('Error al resetear scroll:', e);
  }
}

// ============================================================================
// CARGA DE DATOS
// ============================================================================

/**
 * Genera rutas de imágenes asumiendo convención de nombres
 * Mucho más rápido - no verifica si existen, solo genera las rutas
 */
function generateParishImagePaths(parishName, count = 10) {
  const slug = slugify(parishName);
  const images = [];
  
  for (let i = 1; i <= count; i++) {
    const num = String(i).padStart(2, '0');
    images.push(`assets/parroquias/${slug}/${num}.jpg`);
  }
  
  return images;
}

/**
 * Verifica si una imagen existe con timeout
 */
function imageExists(url, timeout = 3000) {
  return new Promise(resolve => {
    const img = new Image();
    const timer = setTimeout(() => {
      img.onload = img.onerror = null;
      resolve(false);
    }, timeout);
    
    img.onload = () => {
      clearTimeout(timer);
      resolve(true);
    };
    img.onerror = () => {
      clearTimeout(timer);
      resolve(false);
    };
    img.src = url;
  });
}

/**
 * Carga datos externos de parroquias desde JSON
 */
async function loadExternalParishData() {
  try {
    const res = await fetch('assets/data/parroquias.json', { cache: 'no-store' });
    if (!res.ok) return;
    
    const arr = await res.json();
    
    // Procesar cada parroquia (SIN cargar imágenes todavía)
    for (const item of arr) {
      const key = item.id || item.name;
      if (!key) continue;
      
      // Buscar región coincidente
      let match = regions.find(r => r.id === key) || 
                  regions.find(r => r.name === key) ||
                  regions.find(r => slugify(r.name) === slugify(key));
      
      if (!match) continue;
      
      // Guardar datos sin cargar imágenes (lazy loading)
      parishData[match.name] = {
        title: item.name || match.name,
        desc: item.desc_md || item.desc || '',
        images: null, // Se cargarán cuando se abra el modal
        _imagesLoaded: false
      };
    }
  } catch (e) {
    console.warn('No se pudo cargar parroquias.json:', e);
  }
}

/**
 * Ajusta el viewBox del SVG
 */
function fitSVG(svg) {
  if (!svg.getAttribute('preserveAspectRatio')) {
    svg.setAttribute('preserveAspectRatio', 'xMidYMid meet');
  }
  
  if (!svg.getAttribute('viewBox')) {
    const bb = svg.getBBox ? svg.getBBox() : { x: 0, y: 0, width: 1200, height: 800 };
    svg.setAttribute('viewBox', `${bb.x} ${bb.y} ${bb.width} ${bb.height}`);
  }
}

/**
 * Carga el SVG y configura las regiones interactivas
 */
async function loadSVGInline() {
  try {
    const res = await fetch(SVG_PATH);
    const txt = await res.text();
    svgContainer.innerHTML = txt;
    
    const svg = svgContainer.querySelector('svg');
    svg.setAttribute('role', 'img');
    svg.setAttribute('aria-label', 'Mapa de las parroquias de Oviedo');
    fitSVG(svg);

    // Buscar grupo de parroquias
    let root = svg;
    const namedRoot = svg.querySelector('g#Parroquias_Oviedo, g#parroquias, g#PARROQUIAS, g[id*="Parroquias"]');
    if (namedRoot) root = namedRoot;

    const groups = Array.from(root.children).filter(n => n.tagName.toLowerCase() === 'g');

    groups.forEach(g => {
      const name = g.getAttribute('data-name') || 
                   g.getAttribute('inkscape:label') || 
                   g.id || 
                   g.getAttribute('title') || 
                   'Parroquia';
      
      const nm = (name || '').trim().toLowerCase();
      
      // Excluir la parroquia "Oviedo" (ciudad) y el grupo "Parroquias Oviedo"
      if (nm === 'oviedo' || nm === 'parroquias oviedo' || nm === 'parroquia') {
        g.removeAttribute('tabindex');
        g.removeAttribute('role');
        g.setAttribute('aria-hidden', 'true');
        g.style.pointerEvents = 'none';
        return;
      }

      // Configurar región interactiva
      g.classList.add('region');
      g.setAttribute('tabindex', '0');
      g.setAttribute('role', 'button');
      g.setAttribute('aria-label', `Parroquia ${name}`);

      // Inicializar datos si no existen
      if (!parishData[name]) {
        parishData[name] = {
          title: name,
          desc: `Descripción de ${name}.`,
          images: placeholderImagesFor(name)
        };
      }

      // Eventos
      g.addEventListener('click', () => openParish(name));
      g.addEventListener('keydown', (e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          openParish(name);
        }
      });

      regions.push({ el: g, name, id: g.id || slugify(name) });
    });

    await loadExternalParishData();
    renderList();
  } catch (err) {
    console.error('Error cargando SVG:', err);
    svgContainer.innerHTML = `
      <div style="color:#111;padding:20px;text-align:center;">
        <p>No se pudo cargar el mapa.</p>
        <p>Asegúrate de que el archivo <code>fondo.svg</code> esté disponible.</p>
      </div>
    `;
  }
}

// ============================================================================
// LISTA DE PARROQUIAS
// ============================================================================

/**
 * Renderiza la lista lateral de parroquias
 */
function renderList() {
  const items = regions
    .slice()
    .sort((a, b) => a.name.localeCompare(b.name, 'es'))
    .map(r => r.name);

  listEl.innerHTML = '';

  items.forEach(name => {
    const li = document.createElement('li');
    li.tabIndex = 0;
    li.innerHTML = `<div class="parish-name">${displayParishName(name)}</div>`;
    
    li.addEventListener('click', () => openParish(name));
    li.addEventListener('keydown', (e) => {
      if (e.key === 'Enter' || e.key === ' ') {
        e.preventDefault();
        openParish(name);
      }
    });
    
    listEl.appendChild(li);
  });

  // Configurar búsqueda
  searchInput.addEventListener('input', () => {
    const query = searchInput.value.trim().toLowerCase();
    Array.from(listEl.children).forEach(li => {
      const name = li.querySelector('.parish-name').textContent.toLowerCase();
      li.style.display = name.includes(query) ? '' : 'none';
    });
  });
}

// ============================================================================
// MODAL Y GALERÍA
// ============================================================================

/**
 * Monta las miniaturas en Swiper
 */
window.mountThumbsWith = async function mountThumbsWith(images) {
  const wrap = document.getElementById('parishThumbsWrapper');
  const thumbs = document.getElementById('parishThumbs');
  
  if (!wrap) return;
  
  // NO limpiar aquí - ya se limpió en openParish
  
  const arr = images || [];
  
  // Validar imágenes en PARALELO con lotes
  const validImages = [];
  const batchSize = 10;
  
  for (let i = 0; i < arr.length; i += batchSize) {
    const batch = arr.slice(i, i + batchSize);
    const results = await Promise.all(
      batch.map(src => imageExists(src, 2000))
    );
    
    batch.forEach((src, idx) => {
      if (results[idx]) {
        validImages.push(src);
      }
    });
    
    // Parar si ya tenemos suficientes para las miniaturas
    if (validImages.length >= 20) break;
  }
  
  // Ocultar miniaturas si hay 1 o menos imágenes
  if (thumbs) {
    thumbs.style.display = (validImages.length <= 1) ? 'none' : '';
  }

  validImages.forEach((src, idx) => {
    const slide = document.createElement('div');
    slide.className = 'swiper-slide';
    
    const img = document.createElement('img');
    img.loading = 'lazy';
    img.decoding = 'async';
    img.alt = `Miniatura ${idx + 1}`;
    img.src = src;
    
    slide.appendChild(img);
    wrap.appendChild(slide);
  });

  // NO destruir aquí - ya se destruyó en openParish

  // Crear nueva instancia solo si hay imágenes
  if (validImages.length > 1) {
    parishThumbsInstance = new Swiper('#parishThumbs', {
      slidesPerView: 'auto',
      spaceBetween: 8,
      freeMode: true,
      watchSlidesProgress: true,
      slideToClickedSlide: true
    });
  }
}

/**
 * Monta la galería principal en Swiper (solo con imágenes que existen)
 */
window.mountSwiperWith = async function mountSwiperWith(images) {
  try {
    const wrapper = document.getElementById('parishSwiperWrapper');
    if (!wrapper) return;

    // NO limpiar aquí - ya se limpió en openParish
    
    // Validar imágenes en PARALELO (mucho más rápido)
    // Limitar a las primeras 10 validaciones simultáneas para no saturar
    const imagesToCheck = images || [];
    const validImages = [];
    
    // Procesar en lotes de 10 para mejor rendimiento
    const batchSize = 10;
    for (let i = 0; i < imagesToCheck.length; i += batchSize) {
      const batch = imagesToCheck.slice(i, i + batchSize);
      const results = await Promise.all(
        batch.map(src => imageExists(src, 2000)) // 2 segundos timeout
      );
      
      // Añadir las que existen
      batch.forEach((src, idx) => {
        if (results[idx]) {
          validImages.push(src);
        }
      });
      
      // Si ya encontramos suficientes imágenes, parar la búsqueda
      if (validImages.length >= 20) break;
    }

    validImages.forEach((src, idx) => {
      const slide = document.createElement('div');
      slide.className = 'swiper-slide';
      
      const img = document.createElement('img');
      img.loading = 'lazy';
      img.decoding = 'async';
      img.alt = `Imagen ${idx + 1}`;
      img.src = src;
      
      slide.appendChild(img);
      wrapper.appendChild(slide);
    });

    // NO destruir aquí - ya se destruyó en openParish

    // Crear nueva instancia solo si hay imágenes
    if (validImages.length > 0) {
      parishSwiperInstance = new Swiper('#parishSwiper', {
        initialSlide: 0,
        slidesPerView: 1,
        spaceBetween: 8,
        centeredSlides: false,
        loop: false,
        preloadImages: false,
        watchOverflow: true,
        pagination: {
          el: '.swiper-pagination',
          clickable: true
        },
        navigation: {
          nextEl: '.swiper-button-next',
          prevEl: '.swiper-button-prev'
        },
        keyboard: {
          enabled: true
        },
        lazy: true,
        thumbs: parishThumbsInstance ? { swiper: parishThumbsInstance } : undefined
      });

      parishSwiperInstance.slideTo(0, 0);
    }
  } catch (e) {
    console.warn('Error inicializando Swiper:', e);
  }
}

/**
 * Abre el modal de una parroquia
 */
async function openParish(name) {
  lastFocused = document.activeElement;
  
  const data = parishData[name] || {
    title: name,
    desc: '',
    images: null
  };

  // Generar rutas de imágenes sin verificar (más rápido)
  if (!data.images) {
    data.images = generateParishImagePaths(name, 40);
  }

  const imgs = (data.images && data.images.length) 
    ? data.images 
    : placeholderImagesFor(name);

  // LIMPIAR contenido anterior PRIMERO para evitar mostrar imágenes viejas
  const wrapper = document.getElementById('parishSwiperWrapper');
  const thumbWrapper = document.getElementById('parishThumbsWrapper');
  if (wrapper) wrapper.innerHTML = '';
  if (thumbWrapper) thumbWrapper.innerHTML = '';
  
  // Destruir instancias anteriores inmediatamente
  if (parishSwiperInstance && parishSwiperInstance.destroy) {
    parishSwiperInstance.destroy(true, true);
    parishSwiperInstance = null;
  }
  if (parishThumbsInstance && parishThumbsInstance.destroy) {
    parishThumbsInstance.destroy(true, true);
    parishThumbsInstance = null;
  }

  // Actualizar contenido de texto (esto es instantáneo)
  modalTitle.textContent = data.title || name;
  modalContent.innerHTML = mdToHTML(data.desc || '');

  // Marcar como modal de PARROQUIA (fondo blanco)
  modal.classList.add('parish-modal');
  modal.classList.remove('waypoint-modal');

  // Mostrar modal CON loading
  modal.setAttribute('aria-hidden', 'false');
  document.body.style.overflow = 'hidden';

  // Mostrar botones de navegación y paginación para parroquias
  const prevBtn = modal.querySelector('.swiper-button-prev');
  const nextBtn = modal.querySelector('.swiper-button-next');
  const pagination = modal.querySelector('.swiper-pagination');
  if (prevBtn) prevBtn.style.display = '';
  if (nextBtn) nextBtn.style.display = '';
  if (pagination) pagination.style.display = '';

  // Montar galerías (async - se filtrarán las imágenes)
  // Estas funciones ahora NO intentarán limpiar porque ya lo hicimos
  await mountThumbsWith(imgs);
  await mountSwiperWith(imgs);

  // Resetear scroll
  resetModalScroll();
  requestAnimationFrame(() => {
    resetModalScroll();
    setTimeout(resetModalScroll, 0);
  });

  // Foco en botón cerrar
  setTimeout(() => {
    try {
      document.getElementById('modalClose')?.focus();
    } catch (e) {
      console.warn('Error al enfocar botón cerrar:', e);
    }
  }, 0);
}

/**
 * Cierra el modal
 */
function closeModal() {
  resetModalScroll();
  
  modal.setAttribute('aria-hidden', 'true');
  document.body.style.overflow = '';
  
  if (lastFocused && typeof lastFocused.focus === 'function') {
    try {
      lastFocused.focus();
    } catch (e) {
      console.warn('Error al devolver foco:', e);
    }
  }
}

// ============================================================================
// EVENT LISTENERS
// ============================================================================

// Cerrar modal
modalClose.addEventListener('click', closeModal);
modal.addEventListener('click', (e) => {
  if (e.target === modal) closeModal();
});

// Teclado
window.addEventListener('keydown', (e) => {
  const isOpen = modal.getAttribute('aria-hidden') === 'false';
  
  if (e.key === 'Escape' && isOpen) {
    closeModal();
  }
});

// Prevenir restauración de scroll
try {
  if ('scrollRestoration' in history) {
    history.scrollRestoration = 'manual';
  }
} catch (e) {
  console.warn('No se pudo desactivar scrollRestoration:', e);
}

// ============================================================================
// INICIALIZACIÓN
// ============================================================================

loadSVGInline();
