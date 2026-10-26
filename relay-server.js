const express = require('express');
const { WebSocketServer } = require('ws');
const http = require('http');
const url = require('url');

const app = express();
// Capture raw body to preserve webhook signatures accurately
app.use(express.json({ verify: (req, res, buf) => { req.rawBody = buf; } }));

const server = http.createServer(app);
const wss = new WebSocketServer({ server });

// Map of channels to connected WebSocket clients
const channels = new Map();

wss.on('connection', (ws, req) => {
    // Parse the channel from the connection URL (e.g., ?channel=my-app)
    const parameters = url.parse(req.url, true);
    const channel = parameters.query.channel || 'default';

    if (!channels.has(channel)) {
        channels.set(channel, new Set());
    }
    channels.get(channel).add(ws);
    console.log(`Client connected to channel: ${channel}`);
    
    ws.on('close', () => {
        channels.get(channel).delete(ws);
        if (channels.get(channel).size === 0) channels.delete(channel);
        console.log(`Client disconnected from channel: ${channel}`);
    });
});

// The public endpoint that payment gateways send POST requests to
app.all('/webhook/:channel', (req, res) => {
    const channel = req.params.channel;
    
    const payload = JSON.stringify({
        method: req.method,
        path: req.path,
        headers: req.headers,
        body: req.body
    });

    const clients = channels.get(channel);
    
    if (clients && clients.size > 0) {
        for (const client of clients) {
            if (client.readyState === 1) { 
                client.send(payload);
            }
        }
        console.log(`Forwarded webhook to channel: ${channel}`);
        // Return 200 OK immediately so the payment gateway doesn't timeout
        res.status(200).send({ status: 'success', message: 'Webhook relayed' });
    } else {
        console.log(`Missed webhook: No active clients on channel ${channel}`);
        // Return 202 Accepted if no client is listening, but acknowledge receipt
        res.status(202).send({ status: 'queued', message: 'No local client connected' });
    }
});

const PORT = process.env.PORT || 4000;
server.listen(PORT, () => {
    console.log(`🚀 Cloud Relay Server running on port ${PORT}`);
});