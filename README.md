# RedScan Lite

A simple chat API server for testing with Promptfoo - perfect for SE interviews.

## Getting Started

### Prerequisites

- Git
- Node.js v20 or higher
- npm (comes with Node.js)
- [Promptfoo CLI](https://www.promptfoo.dev/docs/getting-started) - Install with: `npm install -g promptfoo`

### Download the Code

**Option 1: Using Git** (recommended)

```bash
git clone https://github.com/promptfoo/redscan-lite.git
cd redscan-lite
```

**Option 2: Download ZIP**

1. Go to https://github.com/promptfoo/redscan-lite
2. Click the green "Code" button
3. Select "Download ZIP"
4. Extract the ZIP file and open the folder

### Setup

1. **Open in your editor**

   ```bash
   code .  # or use your preferred editor
   ```

   - Use any editor you're comfortable with (VS Code, IntelliJ, Vim, Cursor, etc.)
   - Please disable AI autocomplete/copilot features for the interview

2. **Install dependencies**

   ```bash
   npm install
   ```

3. **Start the server**

   ```bash
   npm start
   ```

   The server will run at http://localhost:8080

4. **Optional: Enable AI responses**
   ```bash
   export OPENAI_API_KEY=your-key-here
   npm start
   ```

## Using the API

The API requires authentication. Here's the complete flow:

### 1. Get an auth token

```bash
curl -X POST http://localhost:8080/auth
```

Response: `{ "token": "<uuid>", "ttl": 300 }`

### 2. Create a session

```bash
curl -X POST http://localhost:8080/session
```

Response: `{ "sessionId": "<uuid>" }`

### 3. Send messages

```bash
curl -X POST http://localhost:8080/chat \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "x-session-id: YOUR_SESSION_ID" \
  -H "Content-Type: application/json" \
  -d '{"input": "Hello", "role": "engineering"}'
```

Response: `{ "message": "<response>", "usage": { "prompt_tokens": 10, "completion_tokens": 15, "total_tokens": 25 } }`

Note: If no session ID is provided, one will be created and returned in the `x-session-id` response header.

## Testing with Promptfoo

Run Promptfoo evaluation:

```bash
promptfoo eval
```

See `promptfooconfig.yaml` for configuration details.
