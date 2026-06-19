// ================================================================
// GoHappy Web Push (PWA) — Notificación diaria "Super Plan del día"
// ----------------------------------------------------------------
// Esto es el push del NAVEGADOR/PWA (distinto de notifications.js, que es
// el push NATIVO vía Capacitor en la app empaquetada Android/iOS).
//
// CÓMO ACTIVARLO (1 sólo paso pendiente — necesita tu clave):
//   1. Firebase Console → kindr-8d660 → Project Settings → Cloud Messaging
//      → "Web Push certificates" → Generate key pair → copia la clave pública.
//   2. Pégala abajo en VAPID_KEY (window.WEB_PUSH_VAPID_KEY en config.js).
//   3. (servidor) Una Cloud Function programada lee superPlanToday de cada
//      usuario y envía el push con el token FCM guardado en users/{uid}.fcmTokenWeb.
//
// Mientras VAPID_KEY sea null → todo es no-op (no pide permisos, no rompe nada).
// ================================================================
window.GoHappyWebPush = {
    _messaging: null,

    _vapid() { return window.WEB_PUSH_VAPID_KEY || null; },

    _supported() {
        return !!(window.firebase && firebase.messaging &&
            'serviceWorker' in navigator && 'PushManager' in window &&
            !(window.Capacitor && window.Capacitor.isNativePlatform()));
    },

    // Inicializa el receptor en foreground (no pide permiso todavía).
    init() {
        if (!this._supported() || !this._vapid()) return;
        try {
            this._messaging = firebase.messaging();
            this._messaging.onMessage((payload) => {
                const n = payload?.notification || {};
                try { window.GoHappyToast?.info(`${n.title || 'GoHappy'}: ${n.body || ''}`); } catch (e) {}
            });
            console.info('[WebPush] init ✓');
        } catch (e) {
            console.warn('[WebPush] init falló:', e?.message);
        }
    },

    // Pide permiso explícito (llamar tras un gesto del usuario: botón "Activar recordatorio").
    async enable() {
        if (!this._supported()) {
            window.GoHappyToast?.info(window.L?.('Las notificaciones no están disponibles aquí.',
                'Notifications are not available here.') || 'No disponible');
            return false;
        }
        if (!this._vapid()) {
            console.warn('[WebPush] Falta WEB_PUSH_VAPID_KEY en config.js');
            return false;
        }
        try {
            const perm = await Notification.requestPermission();
            if (perm !== 'granted') return false;

            const reg = await navigator.serviceWorker.ready;
            if (!this._messaging) this._messaging = firebase.messaging();
            const token = await this._messaging.getToken({
                vapidKey: this._vapid(),
                serviceWorkerRegistration: reg
            });
            if (token) {
                await this._saveToken(token);
                window.GoHappyToast?.success(window.L?.('🔔 Recordatorio diario activado',
                    '🔔 Daily reminder enabled') || 'Activado');
                return true;
            }
        } catch (e) {
            console.warn('[WebPush] enable falló:', e?.message);
        }
        return false;
    },

    async _saveToken(token) {
        const user = window.GoHappyAuth?.checkAuth?.();
        if (!user || user.isGuest || !window.GoHappyDB) return;
        try {
            await window.GoHappyDB.collection('users').doc(user.uid).set({
                fcmTokenWeb: token,
                pushLang: window.GoHappyI18n?.lang || 'es',
                pushUpdatedAt: Date.now()
            }, { merge: true });
        } catch (e) { console.warn('[WebPush] guardar token:', e?.message); }
    }
};
