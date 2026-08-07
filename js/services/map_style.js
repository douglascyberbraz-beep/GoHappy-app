// ════════════════════════════════════════════════════════════════════
// GoHappy Map Style — "Navegador GoHappy"
//
// Estilo de mapa propio sobre las teselas de OpenFreeMap (esquema
// OpenMapTiles). Objetivo: aspecto de navegador 3D, limpio, con los
// colores de la marca y sin ruido visual.
//
// ─── Por qué existe este archivo ───
// El estilo anterior vivía suelto dentro del `on('load')` de map_v11.js
// y pintaba capas con guión (`landuse-park`, `landcover-grass`…) cuando
// el esquema real las nombra con guión bajo (`landuse_park`). De las 15
// capas que intentaba colorear sólo 2 existían, y como todo iba dentro
// de try/catch fallaba en silencio: la paleta de marca NUNCA se aplicó.
// Aquí las capas están tomadas del estilo real, y `_report()` avisa por
// consola si alguna deja de existir tras una actualización de las teselas.
//
// ─── Criterios de color ───
// El suelo es gris neutro cálido, no azulado. Así el agua (cian), los
// parques (verde) y los edificios (cobalto) se distinguen entre sí en vez
// de fundirse en la misma gama de azules pálidos que había antes.
// ════════════════════════════════════════════════════════════════════

window.GoHappyMapStyle = (() => {

    // ─── Paleta ───────────────────────────────────────────────────
    // Los mismos pasteles cálidos de palette.css: el mapa ocupa la pantalla
    // entera, así que si se queda en grises fríos rompe con el resto de la
    // app. Aquí van en hex porque MapLibre no entiende var() — para
    // resolver un token desde JS está la función token() de más abajo.
    const C = {
        // Suelo: arena muy clara, emparentada con la crema de la app
        fondo:        '#F8F2E9',
        residencial:  '#F1E9DE',
        // Verdes de Bluey: el parque tiene que leerse como parque
        parque:       '#C3E0B4',
        bosque:       '#AFD5A0',
        hierba:       '#D6EBC9',
        humedal:      '#C6DFD2',
        // Agua: el azul cielo de la serie
        agua:         '#A9D8E6',
        // Equipamientos: un tinte propio cada uno, tomado de los acentos
        colegio:      '#E6DCF0',   // lila
        hospital:     '#F6DEDC',   // coral
        cementerio:   '#DEE8D6',
        deporte:      '#CFE5C2',
        arena:        '#F3E3C8',
        hielo:        '#EDF3F5',
        aeropuerto:   '#EBE6DE',
        // Vías: crema muy claro con borde cálido (el look de navegador)
        viaPrincipal: '#FFFDF9',
        viaSecundaria:'#FDFAF4',
        viaMenor:     '#F9F4EC',
        borde:        '#E4D8C9',
        peatonal:     '#EDE4D8',
        // Edificios
        edificioBase: '#E5DDD2',
        // Texto: la tinta de la app
        texto:        '#24405C',
        textoHalo:    'rgba(255,253,250,0.94)'
    };

    // Rellenos: id real de la capa → color
    const RELLENOS = {
        park:                C.parque,
        landcover_wood:      C.bosque,
        landcover_grass:     C.hierba,
        landcover_wetland:   C.humedal,
        landcover_ice:       C.hielo,
        landcover_sand:      C.arena,
        landuse_residential: C.residencial,
        landuse_pitch:       C.deporte,
        landuse_track:       C.deporte,
        landuse_cemetery:    C.cementerio,
        landuse_hospital:    C.hospital,
        landuse_school:      C.colegio,
        water:               C.agua,
        aeroway_fill:        C.aeropuerto
    };

    // Vías: id real → color de trazo
    const VIAS = {
        road_motorway:            C.viaPrincipal,
        road_trunk_primary:       C.viaPrincipal,
        road_secondary_tertiary:  C.viaSecundaria,
        road_minor:               C.viaMenor,
        road_link:                C.viaMenor,
        road_motorway_link:       C.viaSecundaria,
        road_service_track:       C.viaMenor,
        road_path_pedestrian:     C.peatonal,
        bridge_motorway:          C.viaPrincipal,
        bridge_trunk_primary:     C.viaPrincipal,
        bridge_secondary_tertiary:C.viaSecundaria,
        bridge_street:            C.viaMenor,
        bridge_link:              C.viaMenor,
        bridge_motorway_link:     C.viaSecundaria,
        bridge_service_track:     C.viaMenor,
        bridge_path_pedestrian:   C.peatonal,
        tunnel_motorway:          C.viaSecundaria,
        tunnel_trunk_primary:     C.viaSecundaria,
        tunnel_secondary_tertiary:C.viaMenor,
        tunnel_minor:             C.viaMenor,
        tunnel_link:              C.viaMenor,
        tunnel_motorway_link:     C.viaMenor,
        tunnel_service_track:     C.viaMenor,
        tunnel_path_pedestrian:   C.peatonal
    };

    // Bordes de vía (el "casing" que da el efecto de carretera dibujada)
    const BORDES = [
        'road_motorway_casing', 'road_trunk_primary_casing', 'road_secondary_tertiary_casing',
        'road_minor_casing', 'road_link_casing', 'road_motorway_link_casing', 'road_service_track_casing',
        'bridge_motorway_casing', 'bridge_trunk_primary_casing', 'bridge_secondary_tertiary_casing',
        'bridge_street_casing', 'bridge_link_casing', 'bridge_motorway_link_casing',
        'bridge_service_track_casing', 'bridge_path_pedestrian_casing',
        'tunnel_motorway_casing', 'tunnel_trunk_primary_casing', 'tunnel_secondary_tertiary_casing',
        'tunnel_street_casing', 'tunnel_link_casing', 'tunnel_motorway_link_casing', 'tunnel_service_track_casing'
    ];

    // Ruido visual que quitamos del mapa base.
    // Los POI son NUESTROS marcadores: los iconos de OSM encima duplicaban
    // la información y llenaban la pantalla de puntos que no llevan a nada.
    const OCULTAR = [
        'poi_r20', 'poi_r7', 'poi_r1', 'poi_transit',
        'label_country_1', 'label_country_2', 'label_country_3', 'label_state',
        'highway-shield-us-interstate', 'highway-shield-non-us', 'road_shield_us',
        'boundary_disputed', 'boundary_3',
        'road_one_way_arrow', 'road_one_way_arrow_opposite',
        'natural_earth',
        'road_major_rail_hatching', 'bridge_major_rail_hatching', 'tunnel_major_rail_hatching',
        'waterway_line_label'
    ];

    const _fallos = [];

    function _set(map, id, prop, valor, tipo = 'paint') {
        if (!map.getLayer(id)) { _fallos.push(id); return false; }
        try {
            tipo === 'paint' ? map.setPaintProperty(id, prop, valor)
                             : map.setLayoutProperty(id, prop, valor);
            return true;
        } catch (e) { _fallos.push(id + '·' + prop); return false; }
    }

    /**
     * Aplica el estilo de marca al mapa. Idempotente: se puede llamar
     * varias veces (p. ej. al cambiar a modo noche) sin duplicar capas.
     */
    function apply(map, { noche = false } = {}) {
        _fallos.length = 0;

        // ── Suelo ──
        _set(map, 'background', 'background-color', noche ? '#1B2430' : C.fondo);

        // ── Rellenos ──
        Object.entries(RELLENOS).forEach(([id, color]) => {
            _set(map, id, 'fill-color', noche ? _oscurecer(color) : color);
            _set(map, id, 'fill-opacity', 1);
        });
        // El contorno del parque marcaba un borde duro: lo suavizamos
        _set(map, 'park_outline', 'line-color', noche ? '#2E4438' : '#A9D19A');
        _set(map, 'park_outline', 'line-opacity', 0.5);

        // ── Vías ──
        Object.entries(VIAS).forEach(([id, color]) => {
            _set(map, id, 'line-color', noche ? _oscurecer(color, 0.62) : color);
        });
        BORDES.forEach(id => _set(map, id, 'line-color', noche ? '#0F1720' : C.borde));

        // ── Agua en movimiento: los ríos con el mismo cian ──
        ['waterway_river', 'waterway_other', 'waterway_tunnel']
            .forEach(id => _set(map, id, 'line-color', noche ? _oscurecer(C.agua, 0.5) : C.agua));

        // ── Etiquetas: legibles sobre cualquier fondo ──
        ['label_city', 'label_city_capital', 'label_town', 'label_village', 'label_other',
         'highway-name-major', 'highway-name-minor', 'highway-name-path',
         'water_name_point_label', 'water_name_line_label', 'airport'].forEach(id => {
            _set(map, id, 'text-color', noche ? '#C7D3E0' : C.texto);
            _set(map, id, 'text-halo-color', noche ? 'rgba(15,23,32,0.9)' : C.textoHalo);
            _set(map, id, 'text-halo-width', 1.6);
        });

        // ── Fuera el ruido ──
        OCULTAR.forEach(id => _set(map, id, 'visibility', 'none', 'layout'));

        // ── Edificios 3D translúcidos ──
        // Ojo: el estilo YA trae una capa `building-3d`. Antes se añadía
        // otra encima ('gohappy-3d-buildings'), así que se pintaba la
        // geometría dos veces: transparencias sumadas (colores sucios) y
        // el doble de trabajo para la GPU. Aquí configuramos la que existe.
        _set(map, 'building', 'fill-color', noche ? '#243040' : C.edificioBase);
        _set(map, 'building', 'fill-opacity', 0.45);

        if (map.getLayer('building-3d')) {
            const alto = ['coalesce', ['get', 'render_height'], 12];
            _set(map, 'building-3d', 'fill-extrusion-color', noche ? [
                'interpolate', ['linear'], alto,
                0, '#2B3A4D', 30, '#33506E', 80, '#2E6291', 200, '#1E4A72'
            ] : [
                // De cian claro a cobalto de marca según la altura: da
                // lectura de relieve sin recurrir a sombras duras.
                'interpolate', ['linear'], alto,
                0,   '#EFE7DB',
                15,  '#D6DFE4',
                40,  '#A8C6D8',
                90,  '#6FA0C2',
                200, '#3A76A8'
            ]);
            _set(map, 'building-3d', 'fill-extrusion-height', [
                'interpolate', ['linear'], ['zoom'],
                13, 0,
                14.5, ['*', alto, 0.5],
                16, alto
            ]);
            _set(map, 'building-3d', 'fill-extrusion-base', ['coalesce', ['get', 'render_min_height'], 0]);
            // La transparencia es la clave del look "3D de cristal":
            // lejos casi no se ven, de cerca ganan cuerpo sin tapar calles.
            _set(map, 'building-3d', 'fill-extrusion-opacity', noche ? 0.78 : 0.68);
            _set(map, 'building-3d', 'fill-extrusion-vertical-gradient', true);
        }

        // ── Luz ambiental: da volumen a la extrusión ──
        try {
            map.setLight({
                anchor: 'viewport',
                color: noche ? '#8FA8C4' : '#FFF8EE',
                intensity: noche ? 0.2 : 0.42,
                position: [1.4, 200, 40]
            });
        } catch (e) {}

        // ── Cielo: el horizonte es lo que vende el modo navegador ──
        try {
            if (typeof map.setSky === 'function') {
                map.setSky(noche ? {
                    'sky-color': '#0E1725', 'horizon-color': '#22344B',
                    'fog-color': '#16202E', 'fog-ground-blend': 0.6,
                    'horizon-fog-blend': 0.5, 'sky-horizon-blend': 0.7, 'atmosphere-blend': 0.8
                } : {
                    'sky-color': '#A9D8E6', 'horizon-color': '#FBEFE0',
                    'fog-color': '#F8F2E9', 'fog-ground-blend': 0.55,
                    'horizon-fog-blend': 0.4, 'sky-horizon-blend': 0.8, 'atmosphere-blend': 0.75
                });
            }
        } catch (e) {}

        _report();
        return _fallos.length === 0;
    }

    // Oscurece un hex para el modo noche
    function _oscurecer(hex, f = 0.42) {
        const n = parseInt(hex.slice(1), 16);
        const r = Math.round(((n >> 16) & 255) * f);
        const g = Math.round(((n >> 8) & 255) * f);
        const b = Math.round((n & 255) * f);
        return '#' + [r, g, b].map(v => v.toString(16).padStart(2, '0')).join('');
    }

    // Si OpenFreeMap renombra capas, esto lo dice en voz alta en vez de
    // dejar el estilo a medias sin que nadie se entere (que es lo que pasó).
    function _report() {
        if (!_fallos.length) { console.info('[MapStyle] Estilo GoHappy aplicado, todas las capas encontradas'); return; }
        console.warn('[MapStyle] Capas no encontradas (' + _fallos.length + '):', [...new Set(_fallos)].join(', '));
    }

    /**
     * Resuelve un token de palette.css a su color real.
     *
     * MapLibre, el generador de QR y el canvas NO entienden `var(--x)`:
     * necesitan un color de verdad. Esto permite que esas partes sigan
     * bebiendo de la misma paleta en vez de tener sus hex duplicados.
     *
     *   token('--gh-aqua')  →  '#6BB8C4'
     */
    function token(nombre, respaldo = '#2F6B9E') {
        try {
            const v = getComputedStyle(document.documentElement)
                .getPropertyValue(nombre).trim();
            return v || respaldo;
        } catch (e) { return respaldo; }
    }

    return { apply, token, PALETA: C, _fallos: () => [...new Set(_fallos)] };
})();
