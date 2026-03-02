window.KindrAI = {
    // Especialización en Crianza
    SYSTEM_PROMPT: `Eres KINDR IA, la asistente oficial de la App KINDR, experta líder en crianza consciente, salud infantil (0-15 años), psicología positiva y nutrición. 
    Tu misión es ayudar a padres modernos a encontrar planes y soluciones.
    - Estilo: Empático, ultra-personalizado, premium.
    - Seguridad: Si detectas consultas médicas críticas, ofrece consejos de calma pero siempre recomienda visitar al pediatra.
    - Conocimiento: Conoces perfectamente Castilla y León y las ayudas/becas estatales vigentes.`,

    // Buscar Noticias Regionales
    getNews: async (coordinates = "41.6520, -4.7286") => {
        const prompt = `Busca las 3 noticias más relevantes de hoy sobre crianza, ayudas económicas, becas o trámites familiares en un radio de 30km de las coordenadas ${coordinates}. 
        Prioriza contenido local de Castilla y León.
        Formato JSON estricto: [ { "title": "", "summary": "", "source": "url", "sourceName": "" } ]`;

        return await window.KindrAI._callGemini(prompt);
    },

    // Buscar Eventos Infantiles (0-15 años)
    getEvents: async (coordinates = "41.6520, -4.7286") => {
        const prompt = `Busca eventos infantiles (0-15 años) para los próximos 7 días en un radio de 30km de las coordenadas ${coordinates}.
        Incluye: Teatro, talleres, cuentacuentos, ocio activo.
        IMPORTANTE: Necesito las coordenadas aproximadas del evento para el mapa.
        Formato JSON estricto: [ { "name": "", "date": "", "info": "", "url": "", "lat": 0.0, "lng": 0.0 } ]`;

        return await window.KindrAI._callGemini(prompt);
    },

    // Chat Especializado
    chat: async (userMessage, history = []) => {
        const prompt = `${window.KindrAI.SYSTEM_PROMPT}\n\nHistorial: ${JSON.stringify(history)}\nUsuario: ${userMessage}`;
        const response = await window.KindrAI._callGemini(prompt, false); // false = return text, not json
        return response;
    },

    // Helper para llamadas a Gemini
    _callGemini: async (prompt, expectJson = true) => {
        if (!window.GEMINI_KEY || window.GEMINI_KEY.includes('PEGAR_AQUI')) {
            return window.KindrAI._getMockData(prompt);
        }

        try {
            const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash-latest:generateContent?key=${window.GEMINI_KEY}`, {
                method: 'POST',
                body: JSON.stringify({ contents: [{ parts: [{ text: prompt }] }] })
            });

            const data = await response.json();
            const text = data.candidates[0].content.parts[0].text;

            if (expectJson) {
                const cleanJson = text.replace(/```json|```/g, '').trim();
                return JSON.parse(cleanJson);
            }
            return text;
        } catch (e) {
            console.error("Error en KindrAI:", e);
            return expectJson ? [] : "Lo siento, tengo problemas para conectarme ahora mismo.";
        }
    },

    _getMockData: (prompt) => {
        // Fallback robusto para demos sin internet/clave
        if (prompt.includes('noticia')) return [
            { title: "Bono Cuidado Regional", summary: "Nuevas ayudas para la conciliación familiar disponibles este mes.", source: "https://ejemplo.es", sourceName: "BOE" }
        ];
        return [];
    }
};
