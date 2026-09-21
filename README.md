# AI Chat Assistant

A focused, real-time chat application built with Express, Groq, and MongoDB. It streams AI responses into a clean conversation interface, saves every completed exchange, and lets users revisit past threads.

## Highlights

- **Live streaming** — assistant text arrives progressively as Groq generates it.
- **Three response tones** — Professional, Casual, and Concise are sent to the backend and translated into system instructions.
- **Conversation history** — MongoDB stores each thread, including timestamps, prompts, and assistant replies.
- **Responsive interface** — a dedicated history sidebar, distinct user/assistant bubbles, and a scrollable conversation area.
- **Safe server-side keys** — Groq and MongoDB credentials stay in `.env`; they are never sent to the browser.

## Tech stack

| Layer | Technology |
| --- | --- |
| Client | Vanilla HTML, CSS, and JavaScript |
| Server | Node.js + Express |
| AI streaming | Groq SDK |
| Persistence | MongoDB |

## Prerequisites

- Node.js 18 or newer
- A [Groq API key](https://console.groq.com/keys)
- A reachable MongoDB database — local MongoDB or [MongoDB Atlas](https://www.mongodb.com/atlas)

## Getting started

### 1. Install dependencies

```powershell
cd D:\QuantifyVibeCodingRound
npm install
```

### 2. Configure environment variables

Create a local environment file from the example:

```powershell
Copy-Item .env.example .env
```

Then update `.env` with your credentials:

```env
GROQ_API_KEY=your_groq_api_key
GROQ_MODEL=openai/gpt-oss-20b
MONGODB_URI=mongodb://127.0.0.1:27017
MONGODB_DB=ai_chat_assistant
PORT=3000
```

`GROQ_MODEL` is optional. The default, `openai/gpt-oss-20b`, is used when no model is supplied.

### 3. Start the application

```powershell
npm run dev
```

Open the address printed in the terminal. The server uses port `3000` by default and automatically tries the next port if it is already occupied.

## How it works

1. Choose **Professional**, **Casual**, or **Concise**.
2. Send a message from the conversation composer.
3. The browser sends the prompt and selected tone to `POST /api/chat/stream`.
4. The server validates the input, creates the matching system instruction, and requests a streaming Groq completion.
5. Text chunks are written immediately to the browser and appear in the assistant bubble.
6. MongoDB saves the user prompt, full assistant response, and timestamps.
7. Saved threads are loaded into the history sidebar and can be reopened at any time.

## Tone behavior

| Tone | Backend system instruction |
| --- | --- |
| Professional | Respond in a professional, clear, and structured tone. |
| Casual | Respond in a friendly, conversational, and natural tone. |
| Concise | Respond briefly and directly while preserving important information. |

Only `professional`, `casual`, and `concise` are accepted by the API.

## API endpoints

| Method | Endpoint | Purpose |
| --- | --- | --- |
| `GET` | `/api/conversations` | Return saved conversation summaries, newest first. |
| `GET` | `/api/conversations/:id` | Retrieve a conversation and its messages. |
| `POST` | `/api/chat/stream` | Stream an AI response and persist the exchange. |

The streaming endpoint accepts:

```json
{
  "prompt": "Explain event loops.",
  "tone": "professional",
  "conversationId": "optional-existing-mongodb-id"
}
```

## Project structure

```text
.
├── public/
│   ├── index.html       # Chat interface
│   ├── app.js           # Browser state, history, and stream reader
│   └── styles.css       # Responsive visual design
├── server.js            # API, Groq integration, and MongoDB persistence
├── .env.example         # Required configuration template
└── package.json         # Scripts and dependencies
```

## Troubleshooting

| Message | Resolution |
| --- | --- |
| `GROQ_API_KEY is not set` | Add `GROQ_API_KEY` to `.env`, then stop and restart the server. |
| `model_not_found` | Set `GROQ_MODEL=openai/gpt-oss-20b`, or use a model available to your Groq account. |
| MongoDB storage unavailable | Confirm `MONGODB_URI` is reachable and that the account has database access. |
| Port already in use | Open the fallback URL printed by the server, or stop the other process using the requested port. |

## Scripts

| Command | Description |
| --- | --- |
| `npm run dev` | Start the server in watch mode for development. |
| `npm start` | Start the server normally. |

## Security notes

- Keep `.env` private. It is already excluded from Git.
- Never put Groq or MongoDB credentials in browser code.
- Rotate an API key immediately if it is ever exposed publicly.
