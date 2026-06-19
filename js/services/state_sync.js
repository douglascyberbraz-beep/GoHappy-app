// ================================================================
// GoHappy State Sync — estado crítico del usuario en Firestore
// ----------------------------------------------------------------
// Objetivo (#4): que racha, planes guardados, super-plan y preferencias
// sobrevivan a un cambio de dispositivo / reinstalación de la PWA.
//
// DISEÑO SEGURO (aditivo, NO rompe nada del flujo actual):
//   • localStorage SIGUE siendo la fuente de verdad en caliente.
//   • Espejo → Firestore: users/{uid}/private/app_state (merge) cada cierto
//     tiempo y al ocultar/cerrar la pestaña.
//   • Hidratación ← Firestore: SÓLO rellena claves que falten en local
//     (nunca sobreescribe lo que el usuario ya tiene en el dispositivo).
//   • Reglas: cubierto por match /users/{uid}/{sub=**} (sólo el dueño).
// ================================================================
window.GoHappyState = {
    // Claves que merece la pena persistir entre dispositivos.
    SYNC_KEYS: [
        'GoHappy_saved_plans',
        'GoHappy_streak',
        'GoHappy_super_plan_today',
        'GoHappy_family_prefs',
        'GoHappy_nav_app',
        'GoHappy_last_weekly_reset'
    ],
    _started: false,
    _lastHash: '',

    _uid() {
        const u = window.GoHappyAuth?.checkAuth?.();
        return (u && !u.isGuest) ? u.uid : null;
    },

    _docRef(uid) {
        return window.GoHappyDB?.collection('users').doc(uid).collection('private').doc('app_state');
    },

    _snapshot() {
        const out = {};
        for (const k of this.SYNC_KEYS) {
            try { const v = localStorage.getItem(k); if (v != null) out[k] = v; } catch (e) {}
        }
        return out;
    },

    // ── Hidratar: rellenar SÓLO lo que falte en local ──
    async hydrate() {
        const uid = this._uid();
        if (!uid || !window.GoHappyDB) return;
        try {
            const snap = await this._docRef(uid).get();
            if (!snap.exists) return;
            const data = snap.data() || {};
            let restored = 0;
            for (const k of this.SYNC_KEYS) {
                const remote = data[k];
                if (remote == null) continue;
                const local = localStorage.getItem(k);
                if (local == null || local === '' || local === '[]' || local === '{}') {
                    try { localStorage.setItem(k, remote); restored++; } catch (e) {}
                }
            }
            if (restored) console.info(`[StateSync] hidratadas ${restored} claves desde Firestore`);
        } catch (e) { console.warn('[StateSync] hydrate:', e?.message); }
    },

    // ── Espejar local → Firestore (merge) ──
    async mirror() {
        const uid = this._uid();
        if (!uid || !window.GoHappyDB) return;
        const data = this._snapshot();
        const hash = JSON.stringify(data);
        if (hash === this._lastHash) return;      // nada cambió
        this._lastHash = hash;
        try {
            await this._docRef(uid).set({ ...data, _syncedAt: Date.now() }, { merge: true });
        } catch (e) { console.warn('[StateSync] mirror:', e?.message); }
    },

    // ── Arranque: hidratar una vez (login) y luego espejar periódicamente ──
    async start() {
        if (this._started) return;
        this._started = true;
        await this.hydrate();
        await this.mirror();
        // Espejo periódico + al ocultar/cerrar (sin bloquear).
        setInterval(() => this.mirror(), 60000);
        document.addEventListener('visibilitychange', () => {
            if (document.visibilityState === 'hidden') this.mirror();
        });
        window.addEventListener('pagehide', () => this.mirror());
    }
};
