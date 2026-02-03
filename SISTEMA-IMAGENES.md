# 🖼️ SISTEMA DE CARGA AUTOMÁTICA DE IMÁGENES

## ✅ FUNCIONAMIENTO

El sistema detecta y carga las imágenes **automáticamente** desde las carpetas sin necesidad de editar el JSON.

### 📁 PARROQUIAS
- **Ubicación:** `assets/parroquias/[nombre-parroquia]/`
- **Nombres:** `01.jpg`, `02.jpg`, `03.jpg`, etc.
- **Detección:** El sistema busca secuencialmente desde `01.jpg` hasta encontrar un número que no existe
- **Sin límite:** Puedes añadir tantas imágenes como necesites

**Ejemplo:**
```
assets/parroquias/agueria/
├── 01.jpg  ← Se cargará
├── 02.jpg  ← Se cargará
├── 03.jpg  ← Se cargará
├── 04.jpg  ← Se cargará
└── 05.jpg  ← Se cargará
```

Si faltan números intermedios, se detendrá:
```
assets/parroquias/box/
├── 01.jpg  ← Se cargará
├── 02.jpg  ← Se cargará
├── 04.jpg  ← NO se cargará (falta el 03)
└── 05.jpg  ← NO se cargará
```

### 📍 WAYPOINTS
- **Ubicación:** `assets/waypoints/[id-waypoint]/`
- **Nombre:** `01.jpg` o `01.png`
- **Detección:** Busca primero JPG, luego PNG
- **Cantidad:** Solo 1 imagen

**Ejemplo:**
```
assets/waypoints/colloto-llagares-de-colloto/
└── 01.jpg  ← Se cargará automáticamente
```

## 🔍 NOMBRES DE CARPETAS

Las carpetas de parroquias usan nombres "slugificados" (sin acentos, minúsculas, guiones):

| Parroquia     | Nombre de carpeta  |
|---------------|-------------------|
| Agüeria       | `agueria`         |
| San Claudio   | `san-claudio`     |
| La Corredoria | `la-corredoria`   |
| Villapérez    | `villaperez`      |

**Regla de conversión:**
- Minúsculas
- Sin acentos (á→a, é→e, í→i, ó→o, ú→u)
- Espacios → guiones (-)
- Sin caracteres especiales

## 🚀 AÑADIR IMÁGENES

1. **Identifica la carpeta correcta:**
   - Parroquias: `assets/parroquias/[nombre-slug]/`
   - Waypoints: `assets/waypoints/[id-waypoint]/`

2. **Nombra las imágenes:**
   - Usar dos dígitos: `01.jpg`, `02.jpg`, `03.jpg`
   - Sin espacios ni caracteres especiales
   - Formato JPG preferido (menor tamaño)

3. **Coloca las imágenes** en la carpeta correspondiente

4. **¡Listo!** El sistema las detectará automáticamente

## ⚠️ IMPORTANTE

- **No editar** `parroquias.json` ni `waypoints.json` para añadir imágenes
- Las imágenes se detectan **en tiempo de carga**
- Si una carpeta no existe, verificar el nombre slug
- Numerar siempre con dos dígitos: `01`, `02`, no `1`, `2`

## 🧪 VERIFICAR CARGA

Abre `test-images.html` en el navegador para verificar qué imágenes se están cargando correctamente.

## 📝 NOTAS TÉCNICAS

### Código de detección (app.js):
```javascript
async function detectParishImages(parishName) {
  const slug = slugify(parishName);
  const images = [];
  const maxImages = 99;
  
  for (let i = 1; i <= maxImages; i++) {
    const num = String(i).padStart(2, '0');
    const jpgPath = `assets/parroquias/${slug}/${num}.jpg`;
    const pngPath = `assets/parroquias/${slug}/${num}.png`;
    
    if (await imageExists(jpgPath)) {
      images.push(jpgPath);
    } else if (await imageExists(pngPath)) {
      images.push(pngPath);
    } else {
      break; // Detener si no encuentra
    }
  }
  
  return images;
}
```

El sistema:
1. Convierte el nombre de la parroquia a slug
2. Busca imágenes del 01 al 99
3. Se detiene cuando no encuentra un número
4. Retorna array con todas las imágenes encontradas

---

**¿Dudas?** Consulta `INSTRUCCIONES_IMAGENES.md` para más detalles.
