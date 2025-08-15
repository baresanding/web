# Optimizaciones Móviles para Videos - BARESAND

## Descripción
Este proyecto incluye optimizaciones específicas para mejorar la experiencia de los videos en dispositivos móviles en la landing page de BARESAND.

## Archivos Implementados

### 1. CSS de Optimizaciones Móviles
**Archivo:** `css/mobile-optimizations.css`

**Características:**
- Responsive design para diferentes tamaños de pantalla
- Optimizaciones específicas para dispositivos táctiles
- Estilos para botón de reproducción móvil
- Ajustes para orientación landscape/portrait
- Optimizaciones de rendimiento

### 2. JavaScript de Optimización de Videos
**Archivo:** `js/mobile-video-optimizer.js`

**Funcionalidades:**
- Detección automática de dispositivos móviles
- Optimización de reproducción de videos
- Soporte para gestos de swipe
- Fallbacks para dispositivos sin soporte de video
- Monitoreo de rendimiento

## Características Implementadas

### ✅ Optimizaciones de Video
- **Autoplay normal:** Los videos se reproducen automáticamente en todos los dispositivos
- **Atributos móviles:** `playsinline`, `webkit-playsinline`, `x5-playsinline`
- **Preload optimizado:** Solo carga metadatos inicialmente
- **Fallback automático:** Muestra imágenes si el video falla

### ✅ Experiencia Móvil
- **Autoplay normal:** Los videos se reproducen automáticamente como en desktop
- **Gestos de swipe:** Navegación por el carrusel con dedo
- **Responsive design:** Adaptación automática a diferentes pantallas
- **Orientación:** Optimizaciones para landscape y portrait

### ✅ Rendimiento
- **Lazy loading:** Los videos solo se cargan cuando es necesario
- **Optimización de memoria:** Uso eficiente de recursos del dispositivo
- **Monitoreo:** Seguimiento del tiempo de carga y rendimiento

## Cómo Funciona

### 1. Detección Automática
El sistema detecta automáticamente:
- Tipo de dispositivo (iOS, Android, etc.)
- Capacidades de video del navegador
- Velocidad de conexión
- Orientación de la pantalla

### 2. Optimización Inteligente
Basado en la detección:
- **Dispositivos móviles:** Mantiene autoplay normal, optimiza atributos
- **Conexiones lentas:** Carga solo metadatos, muestra fallbacks
- **Dispositivos táctiles:** Habilita gestos de swipe

### 3. Fallbacks Automáticos
Si algo falla:
- Videos → Imágenes estáticas
- Carrusel automático → Navegación manual

## Compatibilidad

### Navegadores Soportados
- ✅ Chrome (móvil y desktop)
- ✅ Safari (iOS y macOS)
- ✅ Firefox (móvil y desktop)
- ✅ Edge (Windows)
- ✅ Samsung Internet (Android)

### Dispositivos Optimizados
- 📱 iPhone (iOS 12+)
- 📱 iPad (iOS 12+)
- 📱 Android (API 21+)
- 💻 Tablets (todas las plataformas)
- 🖥️ Desktop (fallback a comportamiento normal)

## Personalización

### Personalización de Videos
Los estilos de video se pueden modificar en `css/mobile-optimizations.css`:

```css
.video-background {
    /* Estilos para videos en móviles */
}
```

### Tamaños de Texto
Ajustar en las media queries:

```css
@media (max-width: 480px) {
    .carousel-title {
        font-size: 28px !important; /* Tamaño del título */
    }
}
```

## Solución de Problemas

### Video No Se Reproduce
1. Verificar que el archivo de video existe en `videos/`
2. Comprobar que el formato es compatible (MP4 recomendado)
3. Verificar permisos del navegador para reproducción

### Videos No Se Reproducen
1. Verificar que `mobile-video-optimizer.js` está cargado
2. Comprobar que no hay errores en la consola del navegador
3. Verificar que el dispositivo es detectado como móvil

### Rendimiento Lento
1. Optimizar archivos de video (comprimir, reducir resolución)
2. Verificar que `preload="metadata"` está configurado
3. Comprobar velocidad de conexión del usuario

## Mantenimiento

### Actualizaciones
- Revisar compatibilidad con nuevos navegadores
- Actualizar detección de dispositivos según sea necesario
- Optimizar para nuevas tecnologías móviles

### Monitoreo
- Revisar logs de consola para errores
- Monitorear métricas de rendimiento
- Verificar funcionamiento en diferentes dispositivos

## Soporte Técnico

Para problemas o consultas:
- Revisar la consola del navegador para errores
- Verificar que todos los archivos están en su lugar
- Comprobar que no hay conflictos con otros scripts

---

**Desarrollado para BARESAND** - Optimizando la experiencia móvil desde 2025
