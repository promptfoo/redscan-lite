# RedScan Lite - Promptfoo Target App

## Quick Start
```bash
npm install
node index.js    # Runs on port 8080
```

## Endpoints

### POST /auth
Get authentication token
```bash
curl -X POST http://localhost:8080/auth
```
Response: `{ "token": "<uuid>", "ttl": 300 }`

### POST /session
Create new session
```bash
curl -X POST http://localhost:8080/session
```
Response: `{ "sessionId": "<uuid>" }`

### POST /chat
Send chat message
```bash
curl -X POST http://localhost:8080/chat \
  -H "Authorization: Bearer <token>" \
  -H "x-session-id: <sessionId>" \
  -H "Content-Type: application/json" \
  -d '{"input": "Hello", "role": "engineering"}'
```
Response: `{ "message": "<response>" }`
Headers: Returns `x-session-id` if not provided

## Environment
Set `OPENAI_API_KEY` to use GPT-4o, otherwise echoes input
