// ════════════════════════════════════════════════════════════════════
// GoHappy Toast — avisos discretos, estilo iOS
//
// Filosofía: el aviso mejor es el que no hace falta. Si el usuario acaba
// de pulsar algo y VE el resultado, un toast diciéndoselo sobra.
//
// Reglas del sistema (misma API pública de siempre):
//   · PRIORIDADES: error/warning son importantes y se encolan.
//     info/success/points son de cortesía: NO se encolan, se reemplazan.
//     Así nunca se acumulan 10 segundos de avisos seguidos.
//   · ANTI-REPETICIÓN: el mismo mensaje dos veces en 4s se ignora.
//   · DURACIONES CORTAS: lo justo para leerlo de un vistazo.
//   · ESTILO: cápsula de cristal translúcido, casi monocroma, con un
//     punto de color como único acento. Nada de degradados saturados.
// ════════════════════════════════════════════════════════════════════

window.GoHappyToast = {
    _queue: [],
    _showing: false,
    _last: { msg: null, at: 0 },
    _timer: null,

    // Cuánto pesa cada tipo: 2 = hay que verlo, 1 = cortesía
    _priority: { error: 2, warning: 2, success: 1, info: 1, points: 1 },

    // Duraciones por defecto (ms)
    _duration: { error: 4000, warning: 3200, success: 2000, info: 1900, points: 2600 },

    show: (message, type = 'info', duration) => {
        const T = window.GoHappyToast;
        if (!message) return;
        const now = Date.now();

        // Anti-repetición: el mismo texto seguido no aporta nada
        if (T._last.msg === message && now - T._last.at < 4000) return;
        T._last = { msg: message, at: now };

        const item = { message, type, duration: duration || T._duration[type] || 2200 };
        const prio = T._priority[type] || 1;

        if (prio === 1) {
            // Cortesía: no se acumula. Reemplaza lo que hubiera de su nivel.
            T._queue = T._queue.filter(q => (T._priority[q.type] || 1) > 1);
            if (T._showing && T._currentPrio === 1) { T._dismiss(() => T._render(item)); return; }
            if (T._showing) { T._queue.push(item); return; }
            T._render(item);
        } else {
            // Importante: un error o aviso no espera detrás de una cortesía.
            // Si lo que hay en pantalla es de cortesía, lo desplaza ya.
            if (T._showing && T._currentPrio === 1) { T._dismiss(() => T._render(item)); return; }
            T._queue.push(item);
            if (!T._showing) T._next();
        }
    },

    _next: () => {
        const T = window.GoHappyToast;
        if (!T._queue.length) { T._showing = false; return; }
        T._render(T._queue.shift());
    },

    _dismiss: (after) => {
        const T = window.GoHappyToast;
        const el = document.getElementById('gh-toast');
        clearTimeout(T._timer);
        if (!el) { T._showing = false; after && after(); return; }
        el.style.opacity = '0';
        el.style.transform = 'translateX(-50%) translateY(8px) scale(0.96)';
        setTimeout(() => {
            el.remove();
            T._showing = false;
            after ? after() : T._next();
        }, 220);
    },

    _render: (item) => {
        const T = window.GoHappyToast;
        const { message, type, duration } = item;
        document.getElementById('gh-toast')?.remove();

        T._showing = true;
        T._currentPrio = T._priority[type] || 1;

        // Un punto de color como acento — el resto, cristal neutro
        const accent = {
            success: 'var(--gh-success)',
            error:   'var(--gh-danger)',
            warning: 'var(--gh-warning)',
            info:    'var(--gh-primary)',
            points:  'var(--gh-gold)'
        }[type] || 'var(--gh-primary)';

        const toast = document.createElement('div');
        toast.id = 'gh-toast';
        toast.setAttribute('role', type === 'error' ? 'alert' : 'status');
        toast.setAttribute('aria-live', type === 'error' ? 'assertive' : 'polite');
        toast.style.cssText = `
            position: fixed;
            bottom: calc(var(--nav-height, 85px) + env(safe-area-inset-bottom, 0px) + 14px);
            left: 50%;
            transform: translateX(-50%) translateY(14px) scale(0.96);
            display: flex;
            align-items: center;
            gap: 9px;
            padding: 11px 18px;
            border-radius: 999px;
            background: rgba(255, 255, 255, 0.78);
            backdrop-filter: blur(28px) saturate(180%);
            -webkit-backdrop-filter: blur(28px) saturate(180%);
            color: var(--gh-ink);
            font-family: 'Inter', -apple-system, system-ui, sans-serif;
            font-size: 13.5px;
            font-weight: 600;
            letter-spacing: -0.01em;
            line-height: 1.35;
            max-width: min(82vw, 340px);
            box-shadow:
                inset 0 1px 0 rgba(255,255,255,0.9),
                0 8px 28px rgba(11, 76, 143, 0.16);
            z-index: 99999;
            opacity: 0;
            transition: opacity 0.26s ease, transform 0.26s cubic-bezier(0.32, 1.4, 0.5, 1);
            pointer-events: none;
            white-space: nowrap;
            overflow: hidden;
            text-overflow: ellipsis;
        `;

        const dot = document.createElement('span');
        dot.style.cssText = `width:7px; height:7px; border-radius:50%; flex-shrink:0; background:${accent};`;
        const txt = document.createElement('span');
        txt.style.cssText = 'overflow:hidden; text-overflow:ellipsis;';
        txt.textContent = String(message).replace(/^[\p{Emoji_Presentation}\p{Extended_Pictographic}️\s]+/u, '').trim() || String(message);

        toast.append(dot, txt);
        document.body.appendChild(toast);

        requestAnimationFrame(() => requestAnimationFrame(() => {
            toast.style.opacity = '1';
            toast.style.transform = 'translateX(-50%) translateY(0) scale(1)';
        }));

        T._timer = setTimeout(() => T._dismiss(), duration);
    },

    // ─── API pública (sin cambios) ───
    success: (msg, dur) => window.GoHappyToast.show(msg, 'success', dur),
    error:   (msg, dur) => window.GoHappyToast.show(msg, 'error', dur),
    info:    (msg, dur) => window.GoHappyToast.show(msg, 'info', dur),
    warning: (msg, dur) => window.GoHappyToast.show(msg, 'warning', dur),
    points:  (msg, dur) => window.GoHappyToast.show(msg, 'points', dur)
};
