# ☁️ Webhook Relay Server (Cloud Bridge)

This is the cloud-hosted backend for the [local-webhook-relay](https://www.npmjs.com/package/local-webhook-relay) CLI. It acts as a high-performance, secure bridge between third-party webhook providers (Stripe, Paystack, GitHub) and your local development environment.

## 🏗️ Architecture

The relay solves the "localhost visibility" problem without relying on ngrok's rate limits. 

1. **Express HTTP Server:** Listens for incoming public `POST` requests from payment gateways. It captures the raw body to ensure cryptographic signatures (like `x-paystack-signature`) remain valid.
2. **WebSocket Server (`ws`):** Maintains persistent, low-latency connections with developers' local CLI clients.
3. **Channel Routing:** Uses URL parameters (`?channel=your-app`) to multiplex connections, allowing an entire engineering team to share a single relay server without receiving each other's webhooks.

## 🚀 One-Click Deployment (Recommended)

This service is optimized for deployment on [Render](https://render.com). Render automatically handles TLS termination, meaning your webhooks and WebSocket connections are secured over `https://` and `wss://` out of the box.

1. Fork or clone this repository.
2. Go to Render dashboard -> **New Web Service**.
3. Connect your repository.
4. Set the Build Command to `npm install`.
5. Set the Start Command to `npm start`.
6. Click **Deploy**.

## 💻 Manual Deployment (Ubuntu / GCP / AWS)

If you prefer to host this on your own VPS (like Google Cloud Platform), you can run it using PM2.

```bash
# Clone the repository
git clone [https://github.com/oluibk2020/webhook-relay-server.git](https://github.com/oluibk2020/webhook-relay-server.git)
cd webhook-relay-server

# Install dependencies
npm install

# Start with PM2 for background process management
pm2 start relay-server.js --name "webhook-relay"