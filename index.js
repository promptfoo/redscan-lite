const express = require('express');
const cors = require('cors');
const { v4: uuidv4 } = require('uuid');
const { OpenAI } = require('openai');

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
  console.log(`[${new Date().toISOString()}] ${method} ${endpoint} - Headers: ${JSON.stringify(headers)} - Body: ${JSON.stringify(body)}`);
}

app.post('/auth', (req, res) => {
  logRequest('/auth', 'POST', req.headers, req.body);
  
  const token = uuidv4();
  const ttl = 300;
  
  tokenStore.set(token, {
    createdAt: Date.now(),
    ttl: ttl * 1000
  });
  
  setTimeout(() => {
    tokenStore.delete(token);
  }, ttl * 1000);
  
  res.json({ token, ttl });
});

app.post('/session', (req, res) => {
  logRequest('/session', 'POST', req.headers, req.body);
  
  const sessionId = uuidv4();
  sessions.set(sessionId, {
    createdAt: Date.now(),
    messages: []
  });
  
  res.json({ sessionId });
});

app.post('/chat', async (req, res) => {
  logRequest('/chat', 'POST', req.headers, req.body);
  
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ error: 'Missing or invalid Authorization header' });
  }
  
  const token = authHeader.substring(7);
  const tokenData = tokenStore.get(token);
  
  if (!tokenData) {
    return res.status(401).json({ error: 'Invalid or expired token' });
  }
  
  const tokenAge = Date.now() - tokenData.createdAt;
  if (tokenAge > tokenData.ttl) {
    tokenStore.delete(token);
    return res.status(401).json({ error: 'Token expired' });
  }
  
  const { input, role } = req.body;
  
  if (!input || !role) {
    return res.status(400).json({ error: 'Missing required fields: input and role' });
  }
  
  let sessionId = req.headers['x-session-id'];
  const responseHeaders = {};
  
  if (!sessionId) {
    sessionId = uuidv4();
    sessions.set(sessionId, {
      createdAt: Date.now(),
      messages: []
    });
    responseHeaders['x-session-id'] = sessionId;
  }
  
  const session = sessions.get(sessionId);
  if (session) {
    session.messages.push({ role: 'user', content: input });
  }
  
  let message;
  
  if (openai) {
    try {
      const completion = await openai.chat.completions.create({
        model: 'gpt-4o',
        messages: [
          { role: 'system', content: `You are a helpful assistant in the ${role} domain.` },
          { role: 'user', content: input }
        ],
        temperature: 0.7,
        max_tokens: 500
      });
      
      message = completion.choices[0].message.content;
    } catch (error) {
      console.error('OpenAI API error:', error);
      message = `You said: ${input}`;
    }
  } else {
    message = `You said: ${input}`;
  }
  
  if (session) {
    session.messages.push({ role: 'assistant', content: message });
  }
  
  res.set(responseHeaders).json({ message });
});

app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
  console.log('Available endpoints:');
  console.log('  POST /auth');
  console.log('  POST /session');
  console.log('  POST /chat');
  console.log(openai ? 'OpenAI API configured' : 'OpenAI API not configured - using echo mode');
});