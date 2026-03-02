window.KindrAuth = {
    // Estado interno para evitar múltiples guardados
    _currentUser: null,

    init: (callback) => {
        // Escuchar cambios de estado de Firebase
        window.KindrAuthReal.onAuthStateChanged(async (user) => {
            if (user) {
                // Obtener perfil extendido de Firestore si existe
                const doc = await window.KindrDB.collection('users').doc(user.uid).get();
                const profile = doc.exists ? doc.data() : {};

                window.KindrAuth._currentUser = {
                    uid: user.uid,
                    email: user.email || "Invitado",
                    nickname: profile.nickname || "Explorador",
                    points: profile.points || 0,
                    level: profile.level || "Bronce",
                    isGuest: user.isAnonymous,
                    photo: profile.photo || "👤",
                    referralCode: profile.referralCode || ""
                };
            } else {
                window.KindrAuth._currentUser = null;
            }
            if (callback) callback(window.KindrAuth._currentUser);
        });
    },

    checkAuth: () => {
        return window.KindrAuth._currentUser;
    },

    // Validar código de invitación en Firestore
    validateInvitation: async (code) => {
        if (!code) return false;
        const snap = await window.KindrDB.collection('invitations')
            .where('code', '==', code.toUpperCase())
            .where('used', '==', false)
            .get();
        return !snap.empty;
    },

    login: async (email, pass) => {
        try {
            const res = await window.KindrAuthReal.signInWithEmailAndPassword(email, pass);
            return res.user;
        } catch (e) {
            console.error("Login Error:", e);
            throw e;
        }
    },

    register: async (email, pass, nickname, inviteCode) => {
        try {
            // 1. Validar invitación primero
            const isValid = await window.KindrAuth.validateInvitation(inviteCode);
            if (!isValid) throw new Error("Código de invitación inválido o ya usado.");

            // 2. Crear usuario en Auth
            const res = await window.KindrAuthReal.createUserWithEmailAndPassword(email, pass);
            const user = res.user;

            // 3. Crear perfil en Firestore
            const profile = {
                uid: user.uid,
                email,
                nickname,
                points: 50, // Bono de bienvenida
                level: "Semilla",
                referralCode: 'KNDR-' + Math.random().toString(36).substr(2, 6).toUpperCase(),
                createdAt: new Date()
            };
            await window.KindrDB.collection('users').doc(user.uid).set(profile);

            // 4. Marcar invitación como usada (opcional, depende de la lógica del beta)
            // Aquí podrías actualizar el doc de la invitación si fuera de un solo uso

            return user;
        } catch (e) {
            console.error("Registration Error:", e);
            throw e;
        }
    },

    logout: async () => {
        await window.KindrAuthReal.signOut();
        window.location.reload();
    },

    setGuestMode: async () => {
        try {
            const res = await window.KindrAuthReal.signInAnonymously();
            return res.user;
        } catch (e) {
            console.error("Guest Auth Error:", e);
            throw e;
        }
    },

    renderAuthModal: () => {
        const modal = document.createElement('div');
        modal.id = 'auth-modal';
        modal.className = 'modal auth-modal';
        modal.innerHTML = `
            <div class="auth-container slide-up-anim">
                <div class="auth-card premium-glass">
                    <div class="auth-header">
                        <div class="logo-icon gradient-bg">👤</div>
                        <h3>Comunidad KINDR</h3>
                        <p>Únete a la comunidad</p>
                    </div>
                    
                    <div id="auth-form">
                        <div id="auth-error-msg" style="color: #ff4d4d; font-size: 12px; margin-bottom: 10px; display:none;"></div>
                        
                        <input type="text" id="reg-nickname" placeholder="Tu Apodo / Nickname" class="auth-input">
                        <input type="email" id="auth-email" placeholder="Email" class="auth-input">
                        <input type="password" id="auth-pass" placeholder="Contraseña" class="auth-input">
                        <input type="text" id="auth-invite" placeholder="CÓDIGO DE INVITACIÓN" class="auth-input" style="border: 2px solid var(--accent); font-weight: bold; text-align: center;">
                        
                        <label style="display:flex; align-items:center; gap:8px; margin-top:12px; font-size:11px; color:#666; cursor:pointer;">
                            <input type="checkbox" id="accept-terms" style="width:18px; height:18px; accent-color:var(--primary-blue);">
                            Acepto los <a href="#" id="show-terms-link" style="color:var(--primary-blue); text-decoration:underline;">Términos y Condiciones</a>
                        </label>
                        
                        <div style="display:flex; gap:10px; margin-top:15px;">
                            <button id="do-register" class="btn-primary" style="flex:1">Registrarse</button>
                            <button id="do-login" class="btn-secondary" style="flex:1">Entrar</button>
                        </div>
                        
                        <div class="social-divider"><span>o</span></div>
                        
                        <button id="do-guest" class="btn-text full-width">Explorar como Invitado</button>
                    </div>
                </div>
            </div>
        `;

        document.body.appendChild(modal);

        const showError = (msg) => {
            const errDiv = document.getElementById('auth-error-msg');
            errDiv.textContent = msg;
            errDiv.style.display = 'block';
        };

        document.getElementById('do-login').addEventListener('click', async () => {
            const email = document.getElementById('auth-email').value;
            const pass = document.getElementById('auth-pass').value;

            if (!email || !pass) return showError("Email y contraseña requeridos.");

            try {
                await window.KindrAuth.login(email, pass);
                modal.remove();
                location.reload();
            } catch (e) {
                showError("Error al iniciar sesión. Revisa tus datos.");
            }
        });

        document.getElementById('do-register').addEventListener('click', async () => {
            const email = document.getElementById('auth-email').value;
            const pass = document.getElementById('auth-pass').value;
            const nick = document.getElementById('reg-nickname').value;
            const invite = document.getElementById('auth-invite').value;
            const termsAccepted = document.getElementById('accept-terms').checked;

            if (!email || !pass || !nick || !invite) return showError("Todos los campos + invitación son obligatorios.");
            if (!termsAccepted) return showError("Debes aceptar los Términos y Condiciones.");

            try {
                await window.KindrAuth.register(email, pass, nick, invite);
                modal.remove();
                location.reload();
            } catch (e) {
                showError(e.message || "Error en el registro.");
            }
        });

        document.getElementById('do-guest').addEventListener('click', async () => {
            try {
                await window.KindrAuth.setGuestMode();
                modal.remove();
                location.reload();
            } catch (e) {
                showError("No se pudo iniciar modo invitado.");
            }
        });

        // Terms link opens a simple alert with key info
        document.getElementById('show-terms-link').addEventListener('click', (e) => {
            e.preventDefault();
            modal.remove();
            // Navigate to legal page
            window.KindrApp.loadPage('legal');
        });
    }
};
