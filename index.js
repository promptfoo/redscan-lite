const express = require("express");
const cors = require("cors");
const { v4: uuidv4 } = require("uuid");
const { OpenAI } = require("openai");

const app = express();
const PORT = 8080;

app.use(cors());
app.use(express.json());

const sessions = new Map();
const tokenStore = new Map();

const openai = process.env.OPENAI_API_KEY
  ? new OpenAI({ apiKey: process.env.OPENAI_API_KEY })
  : null;

function logRequest(endpoint, method, headers, body) {
  console.log(
    `[${new Date().toISOString()}] ${method} ${endpoint} - Headers: ${JSON.stringify(headers)} - Body: ${JSON.stringify(body)}`,
  );
}

/**
 * Returns an auth token and its TTL.
 *
 * Example request:
 * ```sh
 * curl -X POST http://localhost:8080/auth
 * ```
 *
 * Response:
 * ```json
 * { "token": "550e8400-e29b-41d4-a716-446655440001", "ttl": 300 }
 * ```
 */
app.post("/auth", (req, res) => {
  logRequest("/auth", "POST", req.headers, req.body);

  const token = uuidv4();
  const ttl = 300;

  tokenStore.set(token, {
    createdAt: Date.now(),
    ttl: ttl * 1000,
  });

  setTimeout(() => {
    tokenStore.delete(token);
  }, ttl * 1000);

  res.json({ token, ttl });
});

/**
 * Creates a session.
 *
 * Example request:
 * ```sh
 * curl -X POST http://localhost:8080/session
 * ```
 *
 * Response:
 * ```json
 * { "sessionId": "660e8400-e29b-41d4-a716-446655440002" }
 * ```
 */
app.post("/session", (req, res) => {
  logRequest("/session", "POST", req.headers, req.body);

  const sessionId = uuidv4();
  sessions.set(sessionId, {
    createdAt: Date.now(),
    messages: [],
    requestCount: 0,
  });

  res.json({ sessionId });
});

/**
 * Sends a message to the API.
 *
 * Example request:
 * ```sh
 * curl -X POST http://localhost:8080/chat \
 *   -H "Authorization: Bearer YOUR_TOKEN" \
 *   -H "x-session-id: YOUR_SESSION_ID" \
 *   -H "Content-Type: application/json" \
 *   -d '{"input": "Hello", "role": "engineering"}'
 * ```
 *
 * Response:
 * ```json
 * {
 *   "message": "Hello, how can I help you today?",
 *   "usage": {
 *     "prompt_tokens": 10,
 *     "completion_tokens": 15,
 *     "total_tokens": 25
 *   }
 * }
 * 
 * Note: If no SessionID is provided, one will be created and returned in the `x-session-id` response header.
 * ```
 */
app.post("/chat", async (req, res) => {
  logRequest("/chat", "POST", req.headers, req.body);

  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    return res
      .status(401)
      .json({ error: "Missing or invalid Authorization header" });
  }

  const token = authHeader.substring(7);
  const tokenData = tokenStore.get(token);

  if (!tokenData) {
    return res.status(401).json({ error: "Invalid or expired token" });
  }

  const tokenAge = Date.now() - tokenData.createdAt;
  if (tokenAge > tokenData.ttl) {
    tokenStore.delete(token);
    return res.status(401).json({ error: "Token expired" });
  }

  const { input, role } = req.body;

  if (!input || !role) {
    return res
      .status(400)
      .json({ error: "Missing required fields: input and role" });
  }

  let sessionId = req.headers["x-session-id"];
  const responseHeaders = {};

  if (!sessionId) {
    sessionId = uuidv4();
    sessions.set(sessionId, {
      createdAt: Date.now(),
      messages: [],
      requestCount: 0,
    });
    responseHeaders["x-session-id"] = sessionId;
  }

  const session = sessions.get(sessionId);
  if (session) {
    session.requestCount = (session.requestCount || 0) + 1;
    session.messages.push({ role: "user", content: input });
  }

  // Check if this is the 3rd request (or multiple of 3) for this session
  if (session && session.requestCount % 3 === 0) {
    // Return an irregular response for debugging practice
    const mockUsage = {
      prompt_tokens: Math.floor(Math.random() * 50) + 10,
      completion_tokens: Math.floor(Math.random() * 100) + 20,
      total_tokens: 0,
    };
    mockUsage.total_tokens =
      mockUsage.prompt_tokens + mockUsage.completion_tokens;

    const irregularResponses = [
      { msg: "Irregular response format", status: "ok", usage: mockUsage }, // Different structure
      {
        data: { text: "Response corrupted", original: input },
        error: null,
        tokenInfo: mockUsage,
      }, // Nested structure, different key
      { output: ["Multiple", "responses", "in", "array"], tokens: mockUsage }, // Array response
      {
        message: "Response",
        metadata: { debug: true, sessionRequests: session.requestCount },
        usage: mockUsage,
      }, // Extra fields
      {
        response: { message: "Wrapped response", timestamp: Date.now() },
        usage: { tokens: mockUsage },
      }, // Different key name, nested usage
      { content: "Different key", usage: mockUsage.total_tokens }, // Usage as just a number
    ];

    const randomIrregular =
      irregularResponses[Math.floor(Math.random() * irregularResponses.length)];
    console.log(
      `[DEBUG] Returning irregular response for session ${sessionId}, request #${session.requestCount}`,
    );
    return res.set(responseHeaders).json(randomIrregular);
  }

  let message;
  let tokenUsage = null;

  if (openai) {
    try {
      const completion = await openai.chat.completions.create({
        model: "gpt-4.1-nano",
        messages: [
          {
            role: "system",
            content: `You are a helpful assistant in the ${role} domain.`,
          },
          { role: "user", content: input },
        ],
        temperature: 0.7,
        max_tokens: 500,
      });

      message = completion.choices[0].message.content;
      // Extract token usage from OpenAI response
      if (completion.usage) {
        tokenUsage = {
          prompt_tokens: completion.usage.prompt_tokens,
          completion_tokens: completion.usage.completion_tokens,
          total_tokens: completion.usage.total_tokens,
        };
      }
    } catch (error) {
      console.error("OpenAI API error:", error);
      message = `You said: ${input}`;
      // Mock token usage for fallback
      tokenUsage = {
        prompt_tokens: input.length,
        completion_tokens: message.length,
        total_tokens: input.length + message.length,
      };
    }
  } else {
    message = `You said: ${input}`;
    // Mock token usage for echo mode
    tokenUsage = {
      prompt_tokens: input.length,
      completion_tokens: message.length,
      total_tokens: input.length + message.length,
    };
  }

  if (session) {
    session.messages.push({ role: "assistant", content: message });
  }

  res.set(responseHeaders).json({ message, usage: tokenUsage });
});

app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
  console.log("Available endpoints:");
  console.log("  POST /auth");
  console.log("  POST /session");
  console.log("  POST /chat");
  console.log(
    openai
      ? "OpenAI API configured (using gpt-4.1-nano)"
      : "OpenAI API not configured - using echo mode",
  );
});
