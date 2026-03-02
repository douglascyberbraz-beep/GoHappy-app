window.KindrEvents = {
    // Helper para calcular distancia entre dos puntos (Haversine)
    getDistance: (lat1, lon1, lat2, lon2) => {
        const R = 6371; // Radio de la Tierra en km
        const dLat = (lat2 - lat1) * Math.PI / 180;
        const dLon = (lon2 - lon1) * Math.PI / 180;
        const a = Math.sin(dLat / 2) * Math.sin(dLat / 2) +
            Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
            Math.sin(dLon / 2) * Math.sin(dLon / 2);
        const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
        return R * c; // Distancia en km
    },

    render: async (container) => {
        container.innerHTML = `
            <div class="page-header center-text">
                <h2>🎭 Eventos Infantiles</h2>
                <p>Planes para niños de 0 a 15 años</p>
            </div>
            <div id="events-loading" class="center-text p-20">
                <div class="typing-dots"><span></span><span></span><span></span></div>
                <p>Buscando planes increíbles...</p>
            </div>
            <div id="events-list" class="content-list stagger-group"></div>
        `;

        const list = document.getElementById('events-list');
        const loading = document.getElementById('events-loading');

        try {
            // Obtener ubicación real del usuario para el radio de 30km
            let userLoc = { lat: 41.6520, lng: -4.7286, name: "Castilla y León" }; // Default

            if (navigator.geolocation) {
                const pos = await new Promise((resolve) => {
                    navigator.geolocation.getCurrentPosition(resolve, () => resolve(null), { timeout: 5000 });
                });
                if (pos) userLoc = { lat: pos.coords.latitude, lng: pos.coords.longitude, name: "tu ubicación" };
            }

            const events = await window.KindrAI.getEvents(`${userLoc.lat}, ${userLoc.lng}`);
            loading.remove();

            // Filtrar por radio de 30km (en el cliente para precisión extrema si el AI devuelve más)
            const filteredEvents = events.filter(ev => {
                if (!ev.lat || !ev.lng) return true; // Si no tiene coordenadas, lo dejamos por si acaso
                const dist = window.KindrEvents.getDistance(userLoc.lat, userLoc.lng, ev.lat, ev.lng);
                ev.distance = dist.toFixed(1);
                return dist <= 30;
            });

            if (filteredEvents.length === 0) {
                list.innerHTML = '<p class="center-text p-20">No hemos encontrado eventos en un radio de 30km. Prueba a buscar en otra zona.</p>';
                return;
            }

            filteredEvents.forEach(item => {
                const card = document.createElement('div');
                card.className = 'card event-card premium-shadow entry-anim';
                card.innerHTML = `
                    <div class="event-date-chip gradient-bg">
                        <span class="date">${item.date}</span>
                    </div>
                    <div class="card-body" style="padding: 15px;">
                        <span class="badge" style="background:#eee; color:#666; font-size:10px; margin-bottom:5px; display:inline-block;">📍 a ${item.distance || '?'} km</span>
                        <h3>${item.name}</h3>
                        <p>${item.info}</p>
                        <a href="${item.url}" target="_blank" class="btn-primary small full-width" style="margin-top:10px; text-decoration:none; display:inline-block; text-align:center;">Ver Detalles</a>
                    </div>
                `;
                list.appendChild(card);
            });
        } catch (e) {
            loading.innerHTML = '<p>Error al buscar eventos. Inténtalo de nuevo.</p>';
        }
    }
};
