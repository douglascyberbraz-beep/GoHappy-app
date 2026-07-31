# 🚀 Plan de Lanzamiento — GoHappy en Android e iOS

> Elaborado por Claude el 25/07/2026 tras auditoría completa. Estado del arte: PWA v8.9.25 en producción (GitHub Pages), Capacitor 5 ya integrado con proyecto Android creado.

## 🔴 FASE 0 — Bloqueadores previos (sin esto no hay lanzamiento)

1. **Reactivar facturación Firebase (URGENTE)** — El proyecto kindr-8d660 tiene el billing DESACTIVADO desde ~8 jul. Las 4 Cloud Functions están caídas (geminiProxy, validateReferral, rewardReferrer, completeQuest) → sin IA, sin referidos. Acción de Douglas: Firebase Console → Upgrade a Blaze con tarjeta. Coste real esperado: céntimos/mes con el tráfico actual.
2. **Commitear y desplegar los fixes pendientes** — 7 archivos con ~210 líneas de fixes de calidad (XSS fotos, eliminar familia, fuga de memoria del mapa, race GPS, bucle reload offline) sin commitear en `master`. Bumpear versión (los 5 sitios: version.json, index.html ×2, app.js ×2, sw.js) y desplegar.
3. **Claves pendientes** (siguen en null en config.js): `WEB_PUSH_VAPID_KEY` (Firebase Console → Cloud Messaging → Web Push certificates) y `TICKETMASTER_KEY` (developer.ticketmaster.com). Sin la primera no hay push web; la segunda mejora Events.
4. **Verificación beta con cuenta real** (Douglas): login, crear/unir familia, guardar plan, subir foto — pendiente desde jun.

## 🟠 FASE 1 — Android beta instalable (esta semana es factible)

Estado: proyecto Android listo, SDK+Android Studio instalados, permisos corregidos (ubicación/notificaciones/vibración añadidos 25/07), Gradle actualizado a 8.7 + AGP 8.2.2 (compatible JDK 21), versionName alineada a 8.9.25.

- [x] `node scripts/build-www.js` + `npx cap sync android`
- [ ] `gradlew assembleDebug` → APK de prueba para el móvil de Douglas y Guilherme
- [ ] **Iconos y splash con la marca GoHappy** — los actuales son los GENÉRICOS de Capacitor (aspa azul). Hay logos en Downloads (GOHAPPY LOGO FINAL.png etc.). Generar set completo (mipmap-*) y splash.
- [ ] Probar en móvil real: login, mapa (WebView+WebGL), GPS nativo, cámara/fotos.
- [ ] **Push nativo**: la app detecta modo nativo pero el flujo FCM nativo (via @capacitor/push-notifications) hay que probarlo/completarlo — el web push (VAPID) NO aplica dentro del APK.

## 🟡 FASE 2 — Google Play producción

- [ ] Cuenta Google Play Console: **25$ una sola vez** (puede abrirla la empresa GoHappy de Guilherme en UK ✅ coherente con el plan).
- [ ] **targetSdk**: hoy 33 — Play exige API 34+ (2026: 35). Camino: subir Capacitor 5→7 (trae AGP/target modernos). Trabajo estimado: 1 sesión.
- [ ] Keystore de release (¡GUARDAR COPIA — si se pierde no se puede actualizar la app!) + `gradlew bundleRelease` (AAB).
- [ ] Ficha de Play: capturas, descripción ES/EN, icono 512, feature graphic, **política de privacidad** (ya existe privacidad.html ✅), formulario Data Safety (ubicación, fotos, cuenta).
- [ ] Internal testing → Closed testing (14 días con 12+ testers exige Play para cuentas nuevas) → Producción.

## 🔵 FASE 3 — iOS (App Store)

**Realidad: desde Windows NO se puede compilar iOS.** Opciones:
1. **Codemagic** (CI en la nube con Macs; capa gratuita) — build + firma remota. La más viable sin Mac. ★
2. GitHub Actions con runner macOS (gratis en repos públicos, minutos limitados).
3. Mac físico de segunda mano / Mac mini.
- Requiere **Apple Developer Program: 99$/año** (puede pagarlo la empresa UK).
- La carpeta ios/ no existe aún: `npx cap add ios` (se puede ejecutar en la nube).
- Revisión de Apple más exigente: login con Apple ✅ (ya está el botón), permisos con textos claros (ya en capacitor.config.json).

## 💰 Costes de lanzamiento
| Concepto | Coste |
|---|---|
| Google Play Console | 25$ (única vez) |
| Apple Developer | 99$/año |
| Firebase Blaze | ~0-5€/mes al inicio |
| Codemagic | 0€ (capa gratuita) |

## 🎯 Orden recomendado
**Semana 1:** Fase 0 completa + APK debug en vuestros móviles.
**Semana 2-3:** iconos/splash + push nativo + upgrade Capacitor 7 + cuenta Play → internal testing.
**Semana 4+:** testing cerrado Play (los 14 días obligatorios) mientras se monta Codemagic para iOS.
