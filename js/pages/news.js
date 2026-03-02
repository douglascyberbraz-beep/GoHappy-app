window.KindrNews = {
    render: async (container) => {
        container.innerHTML = `
            <div class="page-header premium-header">
                <h2>Noticias KINDR</h2>
                <p>Actualidad regional para padres</p>
            </div>
            <div id="news-loading" class="center-text p-20">
                <div class="typing-dots"><span></span><span></span><span></span></div>
                <p>Buscando noticias relevantes...</p>
            </div>
            <div id="news-list" class="content-list stagger-group"></div>
        `;

        const list = document.getElementById('news-list');
        const loading = document.getElementById('news-loading');

        try {
            // Obtener ubicación real del usuario para noticias geolocalizadas
            let userCoords = "41.6520, -4.7286"; // Default (Valladolid)

            if (navigator.geolocation) {
                const pos = await new Promise((resolve) => {
                    navigator.geolocation.getCurrentPosition(resolve, () => resolve(null), { timeout: 5000 });
                });
                if (pos) userCoords = `${pos.coords.latitude}, ${pos.coords.longitude}`;
            }

            let news = await window.KindrAI.getNews(userCoords);
            loading.remove();

            // Filtrar cualquier rastro de "Factor X" si el AI lo genera por error
            news = news.filter(item =>
                !item.title.toUpperCase().includes('FACTOR X') &&
                !item.summary.toUpperCase().includes('FACTOR X')
            );

            if (news.length === 0) {
                list.innerHTML = '<p class="center-text">No hay noticias nuevas en tu zona hoy.</p>';
                return;
            }

            news.forEach(item => {
                const card = document.createElement('div');
                card.className = 'card news-card entry-anim';
                card.innerHTML = `
                    <div class="card-header">
                        <span class="badge" style="background: var(--primary-blue); color: white;">Novedad</span>
                        <span class="date">Hoy</span>
                    </div>
                    <h3 style="color: var(--primary-navy); margin: 10px 0;">${item.title}</h3>
                    <p style="font-size: 0.9rem; color: #555; line-height: 1.4;">${item.summary}</p>
                    <div class="card-footer" style="margin-top: 15px; display: flex; justify-content: space-between; align-items: center; border-top: 1px solid #eee; padding-top: 10px;">
                        <small style="color: #888;">Fuente: ${item.sourceName || 'Prensa'}</small>
                        <a href="${item.source}" target="_blank" class="btn-text" style="color: var(--primary-blue); font-weight: 600; text-decoration: none;">Leer más</a>
                    </div>
                `;
                list.appendChild(card);
            });
        } catch (e) {
            loading.innerHTML = '<p>Error al cargar noticias. Inténtalo más tarde.</p>';
        }
    }
};
