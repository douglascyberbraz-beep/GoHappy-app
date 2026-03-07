window.KidoaRanking = {
    render: async (container) => {
        container.innerHTML = `
            <div class="page-header center-text">
                <h2 style="color: var(--primary-navy); font-weight: 800; font-size: 24px;">🏆 RANKING</h2>
                <p style="font-size: 13px; color: #888; margin-top: -5px; margin-bottom: 15px;">Los mejores de la comunidad</p>
                <div class="tab-scroller">
                    <button class="tab-btn active" data-tab="sites">Top Sitios</button>
                    <button class="tab-btn" data-tab="users">Contribuidores</button>
                </div>
            </div>
            
            <div id="ranking-list" class="ranking-container stagger-group" style="padding-bottom: 100px;">
                <div class="center-text p-20"><div class="typing-dots"><span></span><span></span><span></span></div></div>
            </div>
        `;

        const list = document.getElementById('ranking-list');

        const getPlaceholder = (type) => {
            const colors = {
                park: '#4CAF50',
                food: '#FF9800',
                museum: '#9C27B0',
                culture: '#E91E63',
                generic: '#2196F3'
            };
            const color = colors[type] || colors.generic;
            return `linear-gradient(135deg, ${color}, ${color}dd)`;
        };

        const renderSites = async () => {
            list.innerHTML = '<div class="center-text p-20"><div class="typing-dots"><span></span><span></span><span></span></div></div>';
            const locations = await window.KidoaData.getLocations();
            const sorted = [...locations].sort((a, b) => (b.rating || 0) - (a.rating || 0)).slice(0, 10);

            if (sorted.length === 0) {
                list.innerHTML = '<p class="center-text p-40">¡Aún no hay sitios en el ranking!</p>';
                return;
            }

            // Podium split
            const top3 = sorted.slice(0, 3);
            const others = sorted.slice(3);

            let html = '<div class="podium-section">';

            // Order for podium: 2, 1, 3
            const pOrder = [1, 0, 2];
            pOrder.forEach(idx => {
                const site = top3[idx];
                if (!site) return;
                const pos = idx + 1;
                const medal = pos === 1 ? '🥇' : pos === 2 ? '🥈' : '🥉';
                const size = pos === 1 ? 'large' : 'medium';

                html += `
                    <div class="podium-card ${size} entry-anim" onclick="window.KidoaRanking.goToMap('${site.id}', ${site.lat}, ${site.lng})">
                        <div class="podium-rank">${medal}</div>
                        <div class="podium-image" style="background: ${site.image ? `url(${site.image})` : getPlaceholder(site.type)}; background-size: cover; background-position: center;">
                            ${!site.image ? '<span class="podium-icon">📍</span>' : ''}
                        </div>
                        <div class="podium-info">
                            <h4 class="truncate">${site.name}</h4>
                            <span class="stars">⭐ ${site.rating}</span>
                        </div>
                    </div>
                `;
            });
            html += '</div>';

            // Others list
            html += '<div class="ranking-rows">';
            others.forEach((site, i) => {
                html += `
                    <div class="ranking-row card-anim" onclick="window.KidoaRanking.goToMap('${site.id}', ${site.lat}, ${site.lng})">
                        <span class="row-rank">#${i + 4}</span>
                        <div class="row-thumb" style="background: ${site.image ? `url(${site.image})` : getPlaceholder(site.type)}; background-size: cover;"></div>
                        <div class="row-info">
                            <h4 class="truncate">${site.name}</h4>
                            <span class="row-type">${site.type || 'Lugar'}</span>
                        </div>
                        <div class="row-score">⭐ ${site.rating}</div>
                    </div>
                `;
            });
            html += '</div>';

            list.innerHTML = html;
        };

        const renderContributors = async () => {
            list.innerHTML = '<div class="center-text p-20"><div class="typing-dots"><span></span><span></span><span></span></div></div>';
            let users = await window.KidoaData.getContributors();
            const me = window.KidoaAuth.checkAuth();
            if (me && !me.isGuest) {
                if (!users.find(u => u.name === (me.nickname || me.email))) {
                    users.push({ name: me.nickname || me.email, points: me.points, rank: me.level, role: "Tú", special: true, avatar: me.photo || '👤' });
                }
            }
            users.sort((a, b) => b.points - a.points);

            const top3 = users.slice(0, 3);
            const others = users.slice(3);

            let html = '<div class="podium-section">';
            const pOrder = [1, 0, 2];
            pOrder.forEach(idx => {
                const user = top3[idx];
                if (!user) return;
                const pos = idx + 1;
                const medal = pos === 1 ? '🥇' : pos === 2 ? '🥈' : '🥉';
                const size = pos === 1 ? 'large' : 'medium';
                html += `
                    <div class="podium-card ${size} entry-anim ${user.special ? 'is-me' : ''}">
                        <div class="podium-rank">${medal}</div>
                        <div class="podium-avatar gradient-bg">${user.avatar || '👤'}</div>
                        <div class="podium-info">
                            <h4 class="truncate">${user.name}</h4>
                            <span class="points">${user.points} pts</span>
                        </div>
                    </div>
                `;
            });
            html += '</div>';

            html += '<div class="ranking-rows">';
            others.forEach((user, i) => {
                html += `
                    <div class="ranking-row card-anim ${user.special ? 'is-me' : ''}">
                        <span class="row-rank">#${i + 4}</span>
                        <div class="row-avatar gradient-bg small">${user.avatar || '👤'}</div>
                        <div class="row-info">
                            <h4 class="truncate">${user.name}</h4>
                            <span class="row-type">${user.rank || 'Nivel 1'}</span>
                        </div>
                        <div class="row-score">${user.points} pts</div>
                    </div>
                `;
            });
            html += '</div>';

            list.innerHTML = html;
        };

        await renderSites();

        container.querySelectorAll('.tab-btn').forEach(btn => {
            btn.addEventListener('click', async (e) => {
                const tab = e.target.dataset.tab;
                container.querySelectorAll('.tab-btn').forEach(b => b.classList.remove('active'));
                e.target.classList.add('active');
                if (tab === 'sites') await renderSites();
                else await renderContributors();
                window.KidoaSound.play('click');
            });
        });
    },

    goToMap: (id, lat, lng) => {
        window.KidoaApp.navigate('map');
        setTimeout(() => {
            if (window.KidoaMap && window.KidoaMap.instance) {
                window.KidoaMap.instance.flyTo([lat, lng], 16, { animate: true, duration: 2 });
                const m = window.KidoaMap.markers.find(m => m.data.id === id || (m.data.lat === lat && m.data.lng === lng));
                if (m) m.instance.openPopup();
            }
        }, 600);
    }
};
