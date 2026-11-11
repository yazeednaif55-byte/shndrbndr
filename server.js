const express = require('express');
const http = require('http');
const WebSocket = require('ws');
const path = require('path');

const app = express();
const server = http.createServer(app);
const wss = new WebSocket.Server({ server });

const PORT = process.env.PORT || 3000;

app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));

// Broadcast events to all connected clients
function broadcast(data) {
    wss.clients.forEach(client => {
        if (client.readyState === WebSocket.OPEN) {
            client.send(JSON.stringify(data));
        }
    });
}

wss.on('connection', (ws) => {
    ws.on('message', (message) => {
        try {
            const parsed = JSON.parse(message);
            if (parsed.type === 'APPLY_DISCOUNT') {
                broadcast({ type: 'GLOBAL_DISCOUNT', percent: parsed.percent });
            } else if (parsed.type === 'ADD_PRODUCT') {
                broadcast({ type: 'NEW_PRODUCT', product: parsed.product });
            } else if (parsed.type === 'SET_THEME') {
                broadcast({ type: 'THEME_CHANGE', theme: parsed.theme });
            }
        } catch (e) {
            console.error('Invalid WS message:', e);
        }
    });
});

app.get('*', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

server.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
});
