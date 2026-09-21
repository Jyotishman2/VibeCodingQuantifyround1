import 'dotenv/config';
import express from 'express';
import { MongoClient, ObjectId } from 'mongodb';
import Groq from 'groq-sdk';

const app = express();
const requestedPort = Number(process.env.PORT || 3000);
const allowedTones = new Set(['professional', 'casual', 'concise']);
const toneInstructions = {
  professional: 'Respond in a professional, clear, and structured tone.',
  casual: 'Respond in a friendly, conversational, and natural tone.',
  concise: 'Respond briefly and directly while preserving important information.'
};

if (!process.env.GROQ_API_KEY) {
  console.warn('GROQ_API_KEY is not set. Streaming replies will be unavailable.');
}
if (!process.env.MONGODB_URI) {
  console.warn('MONGODB_URI is not set. Conversation history will be unavailable.');
}

const groq = new Groq({ apiKey: process.env.GROQ_API_KEY || 'missing-key' });
let clientPromise;

async function conversations() {
  if (!process.env.MONGODB_URI) throw new Error('MongoDB is not configured.');
  if (!clientPromise) {
    const client = new MongoClient(process.env.MONGODB_URI);
    clientPromise = client.connect().catch((error) => {
      clientPromise = undefined;
      throw error;
    });
  }
  const client = await clientPromise;
  return client.db(process.env.MONGODB_DB || 'ai_chat_assistant').collection('conversations');
}

function validId(id) {
  return ObjectId.isValid(id) && new ObjectId(id).toString() === id;
}

app.use(express.json());
app.use(express.static('public'));

app.get('/api/conversations', async (_req, res) => {
  try {
    const collection = await conversations();
    const items = await collection
      .find({}, { projection: { messages: 1, createdAt: 1, updatedAt: 1 } })
      .sort({ updatedAt: -1 })
      .toArray();
    res.json(items.map((item) => ({
      id: item._id.toString(),
      createdAt: item.createdAt,
      updatedAt: item.updatedAt,
      title: item.messages?.find((message) => message.role === 'user')?.content || 'New conversation'
    })));
  } catch (error) {
    res.status(503).json({ error: 'Could not load conversation history.' });
  }
});

app.get('/api/conversations/:id', async (req, res) => {
  if (!validId(req.params.id)) return res.status(400).json({ error: 'Invalid conversation ID.' });
  try {
    const conversation = await (await conversations()).findOne({ _id: new ObjectId(req.params.id) });
    if (!conversation) return res.status(404).json({ error: 'Conversation not found.' });
    res.json({ ...conversation, id: conversation._id.toString(), _id: undefined });
  } catch (error) {
    res.status(503).json({ error: 'Could not retrieve conversation.' });
  }
});

app.post('/api/chat/stream', async (req, res) => {
  const prompt = typeof req.body?.prompt === 'string' ? req.body.prompt.trim() : '';
  const tone = req.body?.tone;
  const conversationId = req.body?.conversationId;

  if (!prompt) return res.status(400).json({ error: 'A message is required.' });
  if (!allowedTones.has(tone)) return res.status(400).json({ error: 'Tone must be professional, casual, or concise.' });
  if (conversationId && !validId(conversationId)) return res.status(400).json({ error: 'Invalid conversation ID.' });
  if (!process.env.GROQ_API_KEY) return res.status(503).json({ error: 'AI service is not configured.' });

  let collection;
  try {
    collection = await conversations();
  } catch (error) {
    return res.status(503).json({ error: 'Conversation storage is unavailable.' });
  }

  const now = new Date();
  let priorMessages = [];
  if (conversationId) {
    const existing = await collection.findOne({ _id: new ObjectId(conversationId) });
    if (!existing) return res.status(404).json({ error: 'Conversation not found.' });
    priorMessages = existing.messages || [];
  }

  // Create/update the user side before the response starts. This lets the
  // client receive the conversation ID in a normal response header while the
  // assistant text is still streaming. The completed assistant message is
  // appended only after OpenAI finishes successfully.
  let id = conversationId;
  try {
    if (conversationId) {
      await collection.updateOne(
        { _id: new ObjectId(conversationId) },
        { $push: { messages: { role: 'user', content: prompt, timestamp: now } }, $set: { updatedAt: now } }
      );
    } else {
      const result = await collection.insertOne({
        createdAt: now,
        updatedAt: now,
        messages: [{ role: 'user', content: prompt, timestamp: now }]
      });
      id = result.insertedId.toString();
    }
  } catch (error) {
    return res.status(503).json({ error: 'Could not save this conversation.' });
  }

  let answer = '';
  try {
    const stream = await groq.chat.completions.create({
      model: process.env.GROQ_MODEL || 'openai/gpt-oss-20b',
      stream: true,
      messages: [
        { role: 'system', content: toneInstructions[tone] },
        ...priorMessages.map(({ role, content }) => ({ role, content })),
        { role: 'user', content: prompt }
      ]
    });

    // Do not send streaming headers until Groq accepts the request. If the
    // provider rejects it (for example, an invalid key), the client can still
    // receive a useful JSON error rather than an empty completed stream.
    res.status(200);
    res.set({
      'Content-Type': 'text/plain; charset=utf-8',
      'Cache-Control': 'no-cache, no-transform',
      Connection: 'keep-alive',
      'X-Content-Type-Options': 'nosniff',
      'X-Conversation-Id': id
    });
    res.flushHeaders();

    for await (const chunk of stream) {
      const text = chunk.choices[0]?.delta?.content || '';
      if (text) {
        answer += text;
        res.write(text);
      }
    }

    await collection.updateOne(
      { _id: new ObjectId(id) },
      { $push: { messages: { role: 'assistant', content: answer, timestamp: new Date() } }, $set: { updatedAt: new Date() } }
    );
    res.end();
  } catch (error) {
    console.error('Streaming error:', error);
    if (!res.headersSent) return res.status(502).json({ error: 'The AI service could not complete this response.' });
    res.end();
  }
});

function startServer(port) {
  const server = app.listen(port, () => {
    console.log(`AI Chat Assistant running at http://localhost:${port}`);
  });

  server.once('error', (error) => {
    if (error.code === 'EADDRINUSE') {
      const nextPort = port + 1;
      console.warn(`Port ${port} is already in use. Trying http://localhost:${nextPort} instead.`);
      startServer(nextPort);
      return;
    }
    console.error('Unable to start the server:', error);
    process.exitCode = 1;
  });
}

startServer(requestedPort);
