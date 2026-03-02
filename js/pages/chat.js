window.KindrChat = {
    render: (container) => {
        container.innerHTML = `
            <div class="chat-container">
                <div class="chat-header premium-glass">
                    <div class="bot-avatar gradient-bg">🐦</div>
                    <div>
                        <h3>KINDR IA</h3>
                        <div class="status-indicator"><span class="pulse-dot"></span> Online</div>
                    </div>
                </div>
                <div id="chat-messages" class="chat-messages premium-bg">
                    <div class="message bot entry-anim">
                        <p>¡Hola! Soy tu asistente KINDR. ¿En qué puedo ayudarte hoy?</p>
                    </div>
                </div>
                <div class="chat-input-area premium-glass">
                    <input type="text" id="chat-input" placeholder="Pregunta lo que necesites..." autocomplete="off">
                    <button id="send-btn" class="send-btn premium-shadow">➤</button>
                </div>
            </div>
            <!-- Styles moved to main.css -->
        `;

        const input = document.getElementById('chat-input');
        const sendBtn = document.getElementById('send-btn');
        const messages = document.getElementById('chat-messages');

        const chatHistory = [];

        const sendMessage = async () => {
            const text = input.value.trim();
            if (!text) return;

            // User Message
            appendMessage(text, 'user');
            input.value = '';
            chatHistory.push({ role: 'user', content: text });

            // Simulate Typing
            const loadingId = appendLoading();

            // Real AI Response
            try {
                const response = await window.KindrAI.chat(text, chatHistory);
                removeLoading(loadingId);
                appendMessage(response, 'bot');
                chatHistory.push({ role: 'assistant', content: response });

                // Gana puntos por interactuar con la IA
                window.KindrPoints.addPoints('COMMENT');
            } catch (e) {
                removeLoading(loadingId);
                appendMessage("Lo siento, estoy teniendo problemas para conectar. Inténtalo de nuevo.", 'bot');
            }
        };

        sendBtn.addEventListener('click', sendMessage);
        input.addEventListener('keypress', (e) => {
            if (e.key === 'Enter') sendMessage();
        });

        function appendMessage(text, sender) {
            const div = document.createElement('div');
            div.className = `message ${sender}`;
            div.innerHTML = `<p>${text}</p>`;
            messages.appendChild(div);
            messages.scrollTop = messages.scrollHeight;
        }

        function appendLoading() {
            const id = 'loading-' + Date.now();
            const div = document.createElement('div');
            div.id = id;
            div.className = 'message bot entry-anim';
            div.innerHTML = `<div class="typing-dots"><span></span><span></span><span></span></div>`;
            messages.appendChild(div);
            messages.scrollTop = messages.scrollHeight;
            return id;
        }

        function removeLoading(id) {
            const el = document.getElementById(id);
            if (el) el.remove();
        }
    }
};
