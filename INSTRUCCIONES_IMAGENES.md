# 📸 INSTRUCCIONES PARA AÑADIR IMÁGENES

## 📁 ESTRUCTURA DE CARPETAS

La estructura de carpetas para imágenes está organizada en dos secciones:

```
assets/
├── parroquias/          # Imágenes de parroquias (máx 20 por parroquia)
│   ├── agüeria/
│   ├── bendones/
│   ├── box/
│   └── ... (31 carpetas total)
│
└── waypoints/           # Imágenes de waypoints (1 imagen por waypoint)
    ├── bendones-santa-maria-de-bendones/
    ├── box-casa-natal-de-tino-casal/
    ├── branes-puente-romano-de-branes/
    └── ... (33 carpetas total)
```

---

## 🏛️ IMÁGENES DE PARROQUIAS

### Ubicación
`assets/parroquias/[nombre-parroquia]/`

### Especificaciones
- **Cantidad:** Sin límite de imágenes
- **Nombres:** Numerar con dos dígitos: `01.jpg`, `02.jpg`, `03.jpg`, ..., `10.jpg`, `11.jpg`, etc.
- **Formato:** JPG o PNG (JPG preferido para menor peso)
- **Resolución recomendada:** 1920x1080 o 1600x1200 píxeles
- **Peso máximo:** 500KB por imagen
- **Orientación:** Preferiblemente horizontal (landscape)

### Cómo se usan
Las imágenes aparecerán en el **carrusel Swiper** dentro del modal cuando el usuario haga clic en una parroquia del mapa.

### Ejemplo
```
assets/parroquias/colloto/
├── 01.jpg  (imagen principal)
├── 02.jpg
├── 03.jpg
├── ...
├── 10.jpg
├── 11.jpg
└── 25.jpg
```

---

## 📍 IMÁGENES DE WAYPOINTS

### Ubicación
`assets/waypoints/[id-waypoint]/`

### Especificaciones
- **Cantidad:** 1 imagen por waypoint
- **Nombre:** `01.jpg` o `01.png`
- **Formato:** JPG o PNG
- **Resolución recomendada:** 800x600 o 1024x768 píxeles
- **Peso máximo:** 300KB
- **Orientación:** Horizontal o vertical según el punto de interés

### Cómo se usan
La imagen aparecerá en el modal cuando el usuario haga clic en un waypoint (círculo blanco) del mapa.

### Ejemplo
```
assets/waypoints/colloto-llagares-de-colloto/
└── 01.jpg
```

---

## ✅ CHECKLIST ANTES DE SUBIR IMÁGENES

- [ ] Las imágenes están optimizadas (peso reducido)
- [ ] Las imágenes tienen nombres correctos (1.jpg, 2.jpg, etc.)
- [ ] Las imágenes están en las carpetas correctas
- [ ] No hay más de 20 imágenes por parroquia
- [ ] Cada waypoint tiene máximo 1 imagen
- [ ] La calidad es buena (nítidas, bien iluminadas)

---

## 🛠️ HERRAMIENTAS RECOMENDADAS PARA OPTIMIZAR

### Online
- **TinyPNG/TinyJPG:** https://tinypng.com/
- **Squoosh:** https://squoosh.app/
- **CompressJPEG:** https://compressjpeg.com/

### Desktop
- **ImageOptim** (Mac)
- **RIOT** (Windows)
- **GIMP** (Multiplataforma)

---

## 📝 NOTAS IMPORTANTES

1. **Nombres de archivo:** Usar dos dígitos (01.jpg, 02.jpg, 10.jpg, 25.jpg). No usar nombres descriptivos.

2. **Orden:** El orden numérico determina el orden en el carrusel (01.jpg será la primera).

3. **Formato:** JPG es preferido sobre PNG para fotografías (menor tamaño).

4. **Optimización:** Siempre optimizar las imágenes antes de subirlas para mejorar el rendimiento web.

5. **Responsive:** Las imágenes se adaptarán automáticamente a diferentes tamaños de pantalla.

6. **Carpetas vacías:** Si una parroquia o waypoint no tiene imágenes, dejar la carpeta vacía (el sistema mostrará un placeholder o lo ocultará).

7. **Sin límite:** Las parroquias pueden tener todas las imágenes necesarias (se recomienda entre 5-30 para mejor rendimiento).

---

## 🔧 CONFIGURACIÓN TÉCNICA

Las rutas de las imágenes están configuradas automáticamente en:

- **Parroquias:** `assets/data/parroquias.json` (campo `images`)
- **Waypoints:** `assets/data/waypoints.json` (campo `images`)

El sistema buscará imágenes con el patrón `[carpeta]/01.jpg`, `[carpeta]/02.jpg`, etc.

**Formato de numeración:** Dos dígitos (01-99+) para mantener el orden correcto alfabéticamente.

---

## 📞 SOPORTE

Si tienes dudas sobre qué imágenes usar o cómo optimizarlas, consulta los archivos README.txt en cada carpeta para instrucciones específicas.

**¡Listo para añadir tus imágenes! 🎉**
