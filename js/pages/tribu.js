window.KidoaTribu = {
    // Keep state cached in memory
    postsCache: null,
    activeTab: 'comunidad', // 'comunidad', 'eventos', 'noticias'

    render: async (container) => {
        container.innerHTML = `
            <div class="page-header sticky-header">
                <h2 id="tribu-title" style="color: var(--primary-navy); font-weight: 800;">🏘️ TRIBU</h2>
            </div>
            
            <div id="tribu-content" class="content-list stagger-group" style="padding-bottom: 100px; width: 100%; display: flex; flex-direction: column; align-items: center;">
                <div class="center-text p-20"><div class="typing-dots"><span></span><span></span><span></span></div></div>
            </div>

            <button class="fab-btn" id="tribu-action-btn">➕</button>

            <!-- New Post Modal -->
            <div id="post-modal" class="modal hidden">
                <div class="auth-container slide-up-anim">
                    <div class="auth-card">
                        <h3>Nueva Publicación</h3>
                        <textarea id="post-content" maxlength="160" placeholder="¿Qué quieres compartir? (Max 160 carácteres)" class="post-input"></textarea>
                        <div class="char-count">0/160</div>
                        <button id="publish-btn" class="btn-primary full-width">Publicar</button>
                        <button id="close-post-btn" class="btn-text" style="margin-top:10px;">Cancelar</button>
                    </div>
                </div>
            </div>
        `;

        const contentContainer = document.getElementById('tribu-content');
        const actionBtn = document.getElementById('tribu-action-btn');

        // Direct load community
        await window.KidoaTribu.loadComunidad(contentContainer);

        // Modal Logic (only for Comunidad)
        const modal = document.getElementById('post-modal');
        const contentInput = document.getElementById('post-content');

        actionBtn.addEventListener('click', () => {
            modal.classList.remove('hidden');
            contentInput.focus();
        });

        document.getElementById('close-post-btn').addEventListener('click', () => {
            modal.classList.add('hidden');
        });

        document.getElementById('publish-btn').addEventListener('click', async () => {
            const text = contentInput.value.trim();
            const user = window.KidoaAuth.checkAuth();

            if (!user) {
                alert("Identifícate para participar en la Tribu.");
                return;
            }

            if (text && text.length <= 160) {
                const publishBtn = document.getElementById('publish-btn');
                publishBtn.disabled = true;
                publishBtn.textContent = 'Publicando...';

                try {
                    await window.KidoaData.addTribuPost(text, user);
                    window.KidoaPoints.addPoints('COMMENT');

                    if (window.KidoaTribu.postsCache) {
                        window.KidoaTribu.postsCache.unshift({
                            id: Date.now(),
                            user: user.nickname || "Tú",
                            avatar: user.photo || "😎",
                            time: "Ahora",
                            content: text,
                            likes: 0,
                            comments: 0
                        });
                        if (window.KidoaTribu.activeTab === 'comunidad') {
                            window.KidoaTribu.renderPosts(contentContainer, window.KidoaTribu.postsCache);
                        }
                    }

                    modal.classList.add('hidden');
                    contentInput.value = '';
                    alert("¡Publicado! Has ganado 5 puntos.");
                } catch (e) {
                    alert("Error al publicar. Inténtalo de nuevo.");
                } finally {
                    publishBtn.disabled = false;
                    publishBtn.textContent = 'Publicar';
                }
            }
        });

        contentInput.addEventListener('input', () => {
            const count = contentInput.value.length;
            document.querySelector('.char-count').innerText = `${count}/160`;
            document.querySelector('.char-count').style.color = count > 160 ? 'red' : '#666';
        });
    },

    loadComunidad: async (container) => {
        const posts = await window.KidoaData.getTribuPosts();
        window.KidoaTribu.postsCache = posts;
        window.KidoaTribu.renderPosts(container, posts);

        // Async AI Topic Injection
        setTimeout(async () => {
            if (window.GEMINI_KEY && !window.GEMINI_KEY.includes('PEGAR_AQUI')) {
                try {
                    let coords = "41.6520, -4.7286";
                    try {
                        const pos = await new Promise((resolve, reject) => navigator.geolocation.getCurrentPosition(resolve, reject, { timeout: 3000 }));
                        if (pos) coords = `${pos.coords.latitude}, ${pos.coords.longitude}`;
                    } catch (e) { }

                    const aiTopic = await window.KidoaAI.getDailyTribuTopic(coords);
                    if (aiTopic && aiTopic.title) {
                        const aiPost = {
                            id: 'ai-topic',
                            user: "KIDOA IA",
                            avatar: "🤖",
                            time: aiTopic.date || "Ahora",
                            content: `<strong>${aiTopic.title}</strong><br><br>${aiTopic.content}`,
                            likes: aiTopic.likes || 12,
                            comments: aiTopic.comments || 4,
                            isAI: true
                        };
                        window.KidoaTribu.postsCache.unshift(aiPost);
                        // Only re-render if still on comunidad tab
                        if (window.KidoaTribu.activeTab === 'comunidad') {
                            window.KidoaTribu.renderPosts(container, window.KidoaTribu.postsCache);
                        }
                    }
                } catch (e) {
                    console.warn("Error loading AI Topic:", e);
                }
            }
        }, 500);
    },

    renderPosts: (container, postList) => {
        container.innerHTML = '';
        if (postList.length === 0) {
            container.innerHTML = '<p class="center-text p-20">No hay publicaciones aún. ¡Sé el primero!</p>';
            return;
        }
        postList.forEach(post => {
            const card = document.createElement('div');
            card.className = `tribu-card entry-anim ${post.isAI ? 'ai-sponsored-card' : ''}`;
            if (post.isAI) {
                card.style.background = 'linear-gradient(135deg, rgba(74, 144, 217, 0.05), rgba(76, 201, 240, 0.15))';
                card.style.border = '1px solid var(--primary-blue)';
            }

            card.innerHTML = `
                <div class="tribu-header">
                    <div class="tribu-avatar" style="${post.isAI ? 'background: var(--primary-navy); box-shadow: 0 0 10px var(--primary-blue);' : ''}">${post.avatar}</div>
                    <div class="tribu-info">
                        <span class="tribu-user" style="${post.isAI ? 'font-weight: 900; color: var(--primary-blue);' : ''}">${post.user} ${post.isAI ? '✨ (Oficial)' : ''}</span>
                        <span class="tribu-time">${post.time}</span>
                    </div>
                </div>
                <p class="tribu-content" style="${post.isAI ? 'font-size: 14px; line-height: 1.5; color: var(--primary-navy);' : ''}">${post.content}</p>
                <div class="tribu-actions">
                    <button class="action-btn">❤️ ${post.likes}</button>
                    <button class="action-btn">💬 ${post.comments}</button>
                    <button class="action-btn">🔗</button>
                </div>
            `;
            container.appendChild(card);
        });
    }
};
