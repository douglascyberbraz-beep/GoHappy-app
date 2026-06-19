// ================================================================
// GoHappy Analytics — GA4 (Firebase Analytics) con consentimiento GDPR
// ----------------------------------------------------------------
// • NO recoge nada hasta que el usuario acepta cookies (GoHappy_cookies_consent_v1).
// • measurementId vive en config.js (G-2F3HNE2L5P).
// • API mínima: GoHappyAnalytics.track(evento, params) y .page(nombre).
// • Si firebase-analytics no está cargado, todo es no-op silencioso.
// ================================================================
window.GoHappyAnalytics = {
    _fb: null,
    _ready: false,
    _queue: [],   // eventos antes de tener consentimiento/instancia

    CONSENT_KEY: 'GoHappy_cookies_consent_v1',

    _hasConsent() {
        try { return !!localStorage.getItem(this.CONSENT_KEY); } catch (e) { return false; }
    },

    init() {
        try {
            if (!window.firebase || !firebase.analytics) return; // SDK no cargado
            this._fb = firebase.analytics();
            // Recolección sólo si ya hay consentimiento previo. Si no, queda apagada.
            const consent = this._hasConsent();
            try { this._fb.setAnalyticsCollectionEnabled(consent); } catch (e) {}
            this._ready = true;
            if (consent) this._flush();
            console.info('[Analytics] init ✓ (consent=' + consent + ')');
        } catch (e) {
            console.warn('[Analytics] init falló:', e?.message);
        }
    },

    // Llamar desde el banner de cookies al aceptar.
    setConsent(granted) {
        try {
            if (this._fb) this._fb.setAnalyticsCollectionEnabled(!!granted);
            if (granted) this._flush();
        } catch (e) {}
    },

    _flush() {
        if (!this._fb || !this._ready) return;
        const q = this._queue.splice(0);
        q.forEach(({ name, params }) => {
            try { this._fb.logEvent(name, params); } catch (e) {}
        });
    },

    track(name, params = {}) {
        if (!name) return;
        // Sin consentimiento → ni se encola (privacidad por defecto).
        if (!this._hasConsent()) return;
        if (this._fb && this._ready) {
            try { this._fb.logEvent(name, params); } catch (e) {}
        } else {
            this._queue.push({ name, params });
            if (this._queue.length > 50) this._queue.shift();
        }
    },

    // Navegación SPA → screen_view (GA4 lo entiende como pantalla).
    page(name) {
        if (!name) return;
        this.track('screen_view', {
            firebase_screen: String(name),
            firebase_screen_class: 'GoHappyPWA',
            country: (window.GoHappyI18n?.country) || (navigator.language || 'es').slice(-2)
        });
    }
};
