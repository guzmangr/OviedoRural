# 🎮 ¿CUÁNTO CONOCES OVIEDO RURAL? - Guía del Juego

## 📋 DESCRIPCIÓN

Juego interactivo tipo trivial sobre las 31 parroquias rurales de Oviedo.
Diseñado para público adulto con 3 niveles de dificultad progresiva.

---

## 🎯 MECÁNICAS DEL JUEGO

### **4 TIPOS DE PREGUNTAS:**

1. **💭 Trivial** - Preguntas de opción múltiple
   - Extraídas de los datos reales de parroquias.json
   - Sobre superficie, ubicación, características, puntos de interés

2. **🖼️ Identifica la imagen** - Reconocer parroquia por foto
   - Usa imágenes reales del directorio assets/parroquias/
   - Las fotos son las mismas que en el mapa interactivo

3. **📍 Ubica en el mapa** - Localizar parroquias
   - Versión simplificada con opciones múltiples
   - Preparado para implementar drag & drop con SVG completo

4. **🔍 Adivina con pistas** - Pistas progresivas
   - 3 pistas que se revelan cada 5 segundos
   - De más fácil a más difícil

---

## 🎚️ NIVELES

### **🟢 NIVEL 1 - EXPLORADOR**
- **Preguntas:** 10
- **Opciones:** 4 por pregunta
- **Tiempo:** Sin límite
- **Puntos:** 100 por acierto
- **Ideal para:** Conocer las parroquias

### **🟡 NIVEL 2 - CONOCEDOR**
- **Preguntas:** 10
- **Opciones:** 3 por pregunta
- **Tiempo:** 30 segundos por pregunta
- **Puntos:** 200 por acierto
- **Ideal para:** Probar conocimientos

### **🔴 NIVEL 3 - EXPERTO**
- **Preguntas:** 10
- **Opciones:** 2 por pregunta
- **Tiempo:** 20 segundos por pregunta
- **Puntos:** 300 por acierto
- **Ideal para:** Expertos en Oviedo Rural

---

## ⚡ SISTEMA DE JUEGO

### **❤️ VIDAS:**
- 3 corazones al inicio
- Pierdes 1 vida por respuesta incorrecta
- Pierdes 1 vida si se acaba el tiempo
- Game Over si pierdes todas las vidas

### **🏆 PUNTUACIÓN:**
- Acumulativa durante todo el juego
- Más puntos en niveles difíciles
- Récord guardado en localStorage del navegador

### **⏱️ TIEMPO:**
- Sin límite en Nivel 1
- 30 segundos en Nivel 2
- 20 segundos en Nivel 3
- Contador regresivo con alerta visual

---

## 🎨 DISEÑO

### **COLORES CORPORATIVOS:**
- Primario: #00326c (azul Oviedo)
- Éxito: #28a745 (verde)
- Error: #dc3545 (rojo)
- Advertencia: #ffc107 (amarillo)

### **ELEMENTOS:**
- Header idéntico al mapa (logo + texto)
- Footer idéntico al mapa (logotipos)
- Animaciones suaves y profesionales
- Feedback visual inmediato
- Diseño responsive (móvil y desktop)

---

## 📁 ARCHIVOS

```
juego.html  → Estructura HTML
juego.css   → Estilos (12 KB)
juego.js    → Lógica del juego (18 KB)
```

**Usa los mismos recursos que el mapa:**
- assets/data/parroquias.json
- assets/parroquias/[nombre]/XX.png
- assets/logos/
- fonts.googleapis.com (Montserrat)

---

## 🚀 CÓMO USAR

### **INTEGRACIÓN:**
1. Coloca los 3 archivos en el mismo directorio que index.html
2. Asegúrate de tener la carpeta assets/ completa
3. Abre juego.html en el navegador
4. **Desde el mapa:** Añade botón "Jugar" que enlace a juego.html
5. **Desde el juego:** Botón "Volver al mapa" ya incluido

### **NAVEGACIÓN:**
```
index.html ←→ juego.html
  (mapa)       (juego)
```

---

## ✨ CARACTERÍSTICAS

✅ **Generación automática de preguntas** del JSON
✅ **Sistema de vidas** (3 corazones)
✅ **Timer** con alerta visual
✅ **Récord** guardado en navegador
✅ **Feedback inmediato** (verde/rojo)
✅ **Animaciones** suaves
✅ **Responsive** completo
✅ **Accesible** (roles ARIA)
✅ **Pistas progresivas** cada 5 seg
✅ **Pantalla de resultados** detallada

---

## 🎯 PANTALLAS

### **1. INICIO**
- Título del juego
- Selector de nivel (3 botones)
- Récord actual

### **2. JUEGO**
- Header con stats (nivel, pregunta, puntuación)
- Vidas (3 corazones)
- Timer (niveles 2 y 3)
- Contenido de pregunta dinámico
- Opciones de respuesta

### **3. FINAL**
- Icono según resultado
- Puntuación final
- Aciertos
- Tiempo total
- Badge si es récord
- Botones: "Jugar de nuevo" / "Cambiar nivel"

---

## 💡 MEJORAS FUTURAS (OPCIONALES)

1. **Drag & Drop real en mapa**
   - Cargar fondo.svg
   - Permitir arrastrar nombres a regiones
   - Validar ubicación exacta

2. **Más tipos de preguntas**
   - Emparejar parroquias con características
   - Ordenar por tamaño/población
   - Completar datos faltantes

3. **Modo multijugador**
   - Tabla de récords con nombres
   - Competir en tiempo real

4. **Logros y badges**
   - "100% perfecto"
   - "Experto en el Naranco"
   - "Conocedor del sur"

5. **Estadísticas**
   - Gráficos de progreso
   - Parroquias más/menos conocidas
   - Historial de partidas

---

## 🔧 PERSONALIZACIÓN

### **AÑADIR MÁS PREGUNTAS:**
Edita `juego.js` → función `extractTrivialFromParish()`

### **CAMBIAR COLORES:**
Edita `juego.css` → variables `:root`

### **AJUSTAR DIFICULTAD:**
Edita `juego.js` → objeto `levelConfig`

### **MODIFICAR TIEMPOS:**
Edita `juego.js` → `timeLimit` en levelConfig

---

## ✅ TESTING

**Navegadores probados:**
- ✅ Chrome/Edge
- ✅ Firefox
- ✅ Safari
- ✅ Mobile (iOS/Android)

**Resoluciones probadas:**
- ✅ Desktop (1920x1080)
- ✅ Tablet (768x1024)
- ✅ Mobile (375x667)

---

## 📞 SOPORTE

Para añadir al mapa, añade este código en `index.html`:

```html
<a href="juego.html" class="btn-game" 
   style="position: fixed; bottom: 20px; right: 20px; 
          padding: 14px 24px; background: #00326c; 
          color: white; text-decoration: none; 
          border-radius: 8px; font-weight: 600;
          box-shadow: 0 4px 12px rgba(0,0,0,0.2);
          z-index: 100;">
  🎮 Jugar
</a>
```

---

## 🎉 ¡LISTO PARA USAR!

El juego está **100% funcional** y usa los datos reales del mapa.
Solo necesita los archivos del proyecto existente.

**Disfruta probando tus conocimientos sobre Oviedo Rural!** 🏆
