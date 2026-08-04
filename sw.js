const CACHE_NAME = 'gohappy-cache-v8.9.29';
const TILE_CACHE = 'gohappy-tiles-v1.3.0';

const ASSETS = [
    './',
    'js/lib/maplibre-gl.js',
    'js/lib/maplibre-gl.css',
    'index.html',
    'manifest.json',
    'css/main.css',
    'css/premium.css',
    'css/liquid-glass.css',
    'js/app.js',
    'js/config.js',
    'js/lib/qrcode.min.js',
    // Services
    'js/data/poi_seed.js',
    'js/services/i18n.js',
    'js/services/page_premium.js',
    'js/services/navigation.js',
    'js/services/cookies_banner.js',
    'js/services/security.js',
    'js/services/session_guard.js',
    'js/services/toast.js',
    'js/services/sound.js',
    'js/services/data.js',
    'js/services/points.js',
    'js/services/family_context.js',
    'js/services/events_api.js',
    'js/services/proactive.js',
    'js/services/onboarding_tour.js',
    'js/services/ai_content.js',
    'js/pages/my_family.js',
    'js/pages/adventures.js',
    'js/pages/coach.js',
    'js/pages/moments.js',
    'js/services/auth.js',
    'js/services/quests.js',
    'js/services/safety.js',
    'js/services/families.js',
    'js/services/notifications.js',
    'js/services/analytics.js',
    'js/services/web_push.js',
    'js/services/state_sync.js',
    // Pages
    'js/pages/map_v11.js',
    'js/pages/today.js',
    'js/pages/events.js',
    'js/pages/quests.js',
    'js/pages/ranking.js',
    'js/pages/news_events.js',
    'js/pages/safe.js',
    'js/pages/profile.js',
    'js/pages/tribu.js',
    'js/pages/memories.js',
    'js/pages/legal.js',
    'js/pages/family_onboarding.js',
    // Assets
    'assets/logo.png',
    'assets/logo_transparent.png',
    'assets/ESLOGAN.png',
    'assets/logo_gohappy_official.svg',
    'assets/map-marker.png',
    // External CDN (cache for offline)
];

self.addEventListener('install', (event) => {
    self.skipWaiting();
    event.waitUntil(
        caches.open(CACHE_NAME).then((cache) => {
            // Cache assets individually so one failure doesn't block all
            return Promise.allSettled(
                ASSETS.map(asset => cache.add(asset).catch(e => console.warn('[SW] No se pudo cachear:', asset, e)))
            );
        })
    );
});

self.addEventListener('activate', (event) => {
    event.waitUntil(
        Promise.all([
            clients.claim(),
            caches.keys().then((cacheNames) => {
                return Promise.all(
                    cacheNames.map((name) => {
                        if (name !== CACHE_NAME && name !== TILE_CACHE) {
                            console.log('[SW] Limpiando caché antigua:', name);
                            return caches.delete(name);
                        }
                    })
                );
            })
        ])
    );
});

// ════════════════════════════════════════════════════════════════
// WEB PUSH — recordatorio diario "Super Plan del día"
// Recibe payloads (notification o data) enviados por la Cloud Function
// programada. Funciona con el protocolo Web Push estándar; no requiere
// importScripts de firebase en el SW. No-op si no llega payload.
// ════════════════════════════════════════════════════════════════
self.addEventListener('push', (event) => {
    let payload = {};
    try { payload = event.data ? event.data.json() : {}; } catch (e) {
        try { payload = { notification: { body: event.data && event.data.text() } }; } catch (_) {}
    }
    const n = payload.notification || payload.data || payload || {};
    const title = n.title || 'GoHappy Family';
    const options = {
        body: n.body || '✨ Tu Super Plan del día te espera',
        icon: 'assets/logo.png',
        badge: 'assets/logo.png',
        tag: 'gohappy-daily',
        renotify: true,
        data: { page: (n.page || (payload.data && payload.data.page) || 'today') }
    };
    event.waitUntil(self.registration.showNotification(title, options));
});

self.addEventListener('notificationclick', (event) => {
    event.notification.close();
    const page = (event.notification.data && event.notification.data.page) || 'today';
    event.waitUntil(
        clients.matchAll({ type: 'window', includeUncontrolled: true }).then((wins) => {
            for (const w of wins) {
                if ('focus' in w) {
                    w.postMessage({ type: 'navigate', page });
                    return w.focus();
                }
            }
            if (clients.openWindow) return clients.openWindow('./?page=' + encodeURIComponent(page));
        })
    );
});

self.addEventListener('fetch', (event) => {
    const url = new URL(event.request.url);

    // ─── FIX: sólo interceptamos GET ───────────────────────────────────────
    // Las peticiones POST/PUT/DELETE (proxy de IA, escrituras de Firestore,
    // Cloud Functions) deben ir a la red SIN pasar por el SW. Antes, un POST
    // al proxy de IA (cuya URL termina en '/') caía en la rama de HTML de
    // abajo y, si el proxy fallaba, se devolvía index.html con status 200:
    // la app creía que la llamada había ido bien y fallaba al parsear el JSON,
    // ocultando el error real. La caché sólo tiene sentido para GET.
    if (event.request.method !== 'GET') return;

    // version.json: NUNCA cachear — debe ser fresh siempre para auto-update
    // Fallback: devuelve 'offline' (no '0.0.0') para evitar bucles de reload
    // cuando hay problemas de red intermitentes.
    if (url.pathname.endsWith('version.json')) {
        event.respondWith(fetch(event.request, { cache: 'no-store' }).catch(() =>
            new Response(JSON.stringify({ version: 'offline' }), { headers: { 'Content-Type': 'application/json' } })
        ));
        return;
    }

    // HTML: NETWORK-FIRST (siempre intentar fresco para detectar updates rápido)
    // Sólo para NUESTRO origen: una URL externa acabada en '/' (p.ej. el proxy
    // de IA) no es un documento HTML nuestro y no debe caer aquí.
    if (url.origin === self.location.origin &&
        (event.request.destination === 'document' || url.pathname.endsWith('.html') || url.pathname === '/' || url.pathname.endsWith('/'))) {
        event.respondWith(
            fetch(event.request).then(response => {
                if (response && response.ok) {
                    const clone = response.clone();
                    caches.open(CACHE_NAME).then(cache => cache.put(event.request, clone)).catch(() => {});
                }
                return response;
            }).catch(() => caches.match(event.request).then(c => c || caches.match('index.html')))
        );
        return;
    }

    // Mapa de tiles: Stale-While-Revalidate
    if (url.hostname.includes('openfreemap.org') || url.hostname.includes('demotiles.maplibre.org')) {
        event.respondWith(
            caches.open(TILE_CACHE).then((cache) => {
                return cache.match(event.request).then((cached) => {
                    const fetchPromise = fetch(event.request).then((networkResponse) => {
                        if (networkResponse && networkResponse.ok) {
                            cache.put(event.request, networkResponse.clone());
                        }
                        return networkResponse;
                    }).catch(() => cached);
                    return cached || fetchPromise;
                });
            })
        );
        return;
    }

    // Firebase / Gemini API / Cloud Functions: siempre red (datos en tiempo real)
    if (url.hostname.includes('firebaseio.com') ||
        url.hostname.includes('googleapis.com') ||
        url.hostname.includes('generativelanguage.googleapis.com') ||
        url.hostname.includes('identitytoolkit.googleapis.com') ||
        url.hostname.includes('firestore.googleapis.com') ||
        url.hostname.endsWith('.run.app') ||           // Cloud Functions v2 (geminiProxy)
        url.hostname.includes('cloudfunctions.net')) {
        event.respondWith(fetch(event.request).catch(() => new Response('{}', { headers: { 'Content-Type': 'application/json' } })));
        return;
    }

    // JS/CSS: Stale-While-Revalidate (respuesta instantánea + actualización background)
    // Esto es CLAVE para que la app cargue rápido en cada visita
    if (event.request.destination === 'script' ||
        event.request.destination === 'style' ||
        url.pathname.endsWith('.js') ||
        url.pathname.endsWith('.css')) {
        event.respondWith(
            caches.open(CACHE_NAME).then(cache =>
                cache.match(event.request).then(cached => {
                    const networkFetch = fetch(event.request).then(response => {
                        if (response && response.ok && response.type !== 'opaque') {
                            cache.put(event.request, response.clone());
                        }
                        return response;
                    }).catch(() => cached);
                    return cached || networkFetch;
                })
            )
        );
        return;
    }

    // Resto: Cache First con fallback a red
    event.respondWith(
        caches.match(event.request).then((cached) => {
            return cached || fetch(event.request).then((response) => {
                if (response && response.ok && response.type !== 'opaque') {
                    const clone = response.clone();
                    caches.open(CACHE_NAME).then(cache => cache.put(event.request, clone));
                }
                return response;
            });
        }).catch(() => {
            // Offline fallback para páginas HTML
            if (event.request.destination === 'document') {
                return caches.match('index.html');
            }
        })
    );
});
