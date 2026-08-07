// ------------------------------------------------------------------
// GoHappySafe - Safety Alerts Service
// ------------------------------------------------------------------
window.GoHappySafe = {

    // Cada tipo trae tres colores porque cumplen tres papeles distintos:
    //   color → borde y acento          (pastel, es relleno)
    //   soft  → fondo del icono          (pastel muy claro)
    //   ink   → texto de la etiqueta     (oscuro, legible)
    // Antes había un solo color y el fondo se hacía con `${color}15`,
    // concatenando alfa al hex. Con tokens eso genera `var(--x)15`, que es
    // CSS inválido y el fondo desaparecía sin avisar.
    ALERT_TYPES: {
        DANGER:       { icon: '🚨', label: 'Peligro', color: 'var(--gh-danger)',         soft: 'var(--gh-danger-soft)',  ink: 'var(--gh-danger-ink)' },
        CONSTRUCTION: { icon: '🚧', label: 'Obras',   color: 'var(--gh-warning)',        soft: 'var(--gh-warning-soft)', ink: 'var(--gh-warning-ink)' },
        CLOSED:       { icon: '🔒', label: 'Cerrado', color: 'var(--gh-ink-3)',          soft: 'var(--gh-surface-2)',    ink: 'var(--gh-ink-2)' },
        WEATHER:      { icon: '⛈️', label: 'Clima',   color: 'var(--gh-sky)',            soft: 'var(--gh-primary-soft)', ink: 'var(--gh-sky-ink)' },
        INFO:         { icon: 'ℹ️', label: 'Info',    color: 'var(--gh-primary-bright)', soft: 'var(--gh-primary-soft)', ink: 'var(--gh-primary)' }
    },

    // Obtener alertas REALES de la comunidad. NUNCA devuelve demos.
    getAlerts: async (coords) => {
        try {
            const snap = await window.GoHappyDB.collection('alerts')
                .orderBy('createdAt', 'desc')
                .limit(30)
                .get();

            if (snap.empty) return [];

            return snap.docs
                .map(d => {
                    const data = d.data();
                    let timeAgo = 'Reciente';
                    try {
                        const ts = data.createdAt?.toDate ? data.createdAt.toDate() : null;
                        if (ts) {
                            const diffMin = Math.round((Date.now() - ts.getTime()) / 60000);
                            if (diffMin < 60) timeAgo = `Hace ${diffMin} min`;
                            else if (diffMin < 1440) timeAgo = `Hace ${Math.round(diffMin / 60)} h`;
                            else timeAgo = `Hace ${Math.round(diffMin / 1440)} d`;
                        }
                    } catch (e) { /* keep default */ }
                    return { id: d.id, timeAgo, ...data };
                })
                .filter(a => a.active !== false)
                .slice(0, 15);
        } catch (e) {
            console.warn("[Safe] alerts fetch failed:", e?.message);
            return [];   // NUNCA devolver demos
        }
    },

    // Reportar una nueva alerta
    reportAlert: async (alertData) => {
        const user = window.GoHappyAuth.checkAuth();
        if (!user || user.isGuest) return false;

        try {
            const alert = {
                ...alertData,
                reportedBy: user.nickname || 'Anónimo',
                userId: user.uid,
                createdAt: firebase.firestore.FieldValue.serverTimestamp(),
                active: true,
                votes: 0
            };
            await window.GoHappyDB.collection('alerts').add(alert);

            // Activity para Memories — title obligatorio según reglas (best-effort)
            try {
                await window.GoHappyDB.collection('activity').add({
                    userId:    user.uid,
                    type:      'safety_report',
                    title:     alertData.title || 'Alerta de seguridad',
                    timestamp: firebase.firestore.FieldValue.serverTimestamp()
                });
            } catch (e) { console.warn('[Safe] activity log skipped:', e?.message); }

            window.GoHappyPoints.addPoints('SAFETY_REPORT');
            return true;
        } catch (e) {
            console.error("Error reportando alerta:", e);
            return false;
        }
    },

    // Votar una alerta (atomic increment, sin race conditions)
    voteAlert: async (alertId) => {
        try {
            await window.GoHappyDB.collection('alerts').doc(alertId).update({
                votes: firebase.firestore.FieldValue.increment(1)
            });
            return true;
        } catch (e) {
            console.warn("Vote error:", e);
        }
        return false;
    }
};

