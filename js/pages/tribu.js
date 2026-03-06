window.KindrTribu = {
    // Keep state cached in memory
    postsCache: null,
    activeTab: 'comunidad', // 'comunidad', 'eventos', 'noticias'

    render: async (container) => {
        container.innerHTML = `
            <div class="page-header sticky-header" style="display: flex; justify-content: space-between; align-items: center; padding-bottom: 20px;">
                <h2 id="tribu-title">🏘️ La Tribu</h2>
                <button class="btn-icon-pulse" id="tribu-action-btn">➕</button>
            </div>
            
            <div id="tribu-content" class="content-list stagger-group" style="padding-bottom: 100px; width: 100%; display: flex; flex-direction: column; align-items: center;">
                <div class="center-text p-20"><div class="typing-dots"><span></span><span></span><span></span></div></div>
            </div>

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
        await window.KindrTribu.loadComunidad(contentContainer);

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
            const user = window.KindrAuth.checkAuth();

            if (!user) {
                alert("Identifícate para participar en la Tribu.");
                return;
            }

            if (text && text.length <= 160) {
                const publishBtn = document.getElementById('publish-btn');
                publishBtn.disabled = true;
                publishBtn.textContent = 'Publicando...';

                try {
                    await window.KindrData.addTribuPost(text, user);
                    window.KindrPoints.addPoints('COMMENT');

                    if (window.KindrTribu.postsCache) {
                        window.KindrTribu.postsCache.unshift({
                            id: Date.now(),
                            user: user.nickname || "Tú",
                            avatar: user.photo || "😎",
                            time: "Ahora",
                            content: text,
                            likes: 0,
                            comments: 0
                        });
                        if (window.KindrTribu.activeTab === 'comunidad') {
                            window.KindrTribu.renderPosts(contentContainer, window.KindrTribu.postsCache);
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
        const posts = await window.KindrData.getTribuPosts();
        window.KindrTribu.postsCache = posts;
        window.KindrTribu.renderPosts(container, posts);
    },

    renderPosts: (container, postList) => {
        container.innerHTML = '';
        if (postList.length === 0) {
            container.innerHTML = '<p class="center-text p-20">No hay publicaciones aún. ¡Sé el primero!</p>';
            return;
        }
        postList.forEach(post => {
            const card = document.createElement('div');
            card.className = 'tribu-card entry-anim';
            card.innerHTML = `
                <div class="tribu-header">
                    <div class="tribu-avatar">${post.avatar}</div>
                    <div class="tribu-info">
                        <span class="tribu-user">${post.user}</span>
                        <span class="tribu-time">${post.time}</span>
                    </div>
                </div>
                <p class="tribu-content">${post.content}</p>
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
