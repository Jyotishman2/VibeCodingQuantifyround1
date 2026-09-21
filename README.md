<div align="center">

# 💬 AI Chat Assistant

### *Real-time streaming conversations, powered by Groq*

A focused, real-time chat application built with **Express**, **Groq**, and **MongoDB**.
It streams AI responses into a clean conversation interface, saves every completed exchange, and lets users revisit past threads.

![Node](https://img.shields.io/badge/Node.js-18%2B-339933?style=for-the-badge&logo=node.js&logoColor=white)
![Express](https://img.shields.io/badge/Express-Backend-000000?style=for-the-badge&logo=express&logoColor=white)
![Groq](https://img.shields.io/badge/Groq-AI%20Streaming-F55036?style=for-the-badge&logo=groq&logoColor=white)
![MongoDB](https://img.shields.io/badge/MongoDB-Persistence-47A248?style=for-the-badge&logo=mongodb&logoColor=white)

</div>

---

## ✨ Highlights

| | |
|---|---|
| ⚡ **Live streaming** | Assistant text arrives progressively as Groq generates it |
| 🎭 **Three response tones** | *Professional*, *Casual*, and *Concise* — sent to the backend and translated into system instructions |
| 🗂️ **Conversation history** | MongoDB stores each thread, including timestamps, prompts, and assistant replies |
| 📱 **Responsive interface** | A dedicated history sidebar, distinct user/assistant bubbles, and a scrollable conversation area |
| 🔒 **Safe server-side keys** | Groq and MongoDB credentials stay in `.env` — never sent to the browser |

---

## 🧱 Tech Stack

| Layer | Technology |
|---|---|
| 🖥️ **Client** | Vanilla HTML, CSS, and JavaScript |
| ⚙️ **Server** | Node.js + Express |
| 🤖 **AI streaming** | Groq SDK |
| 💾 **Persistence** | MongoDB |

---

## 📋 Prerequisites

- ✅ Node.js **18** or newer
- ✅ A **Groq API key**
- ✅ A reachable **MongoDB** database — local MongoDB or MongoDB Atlas

---

## 🚀 Getting Started

### 1️⃣ Install dependencies

```bash
cd D:\QuantifyVibeCodingRound
npm install
```

### 2️⃣ Configure environment variables

Create a local environment file from the example:

```bash
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

> 💡 **Tip:** `GROQ_MODEL` is optional. The default, `openai/gpt-oss-20b`, is used when no model is supplied.

### 3️⃣ Start the application

```bash
npm run dev
```

Open the address printed in the terminal. The server uses port **3000** by default and automatically tries the next port if it's already occupied.

---

## 🔍 How It Works

```
 1. Choose a tone  →  Professional / Casual / Concise
 2. Send a message from the conversation composer
 3. Browser POSTs { prompt, tone } to /api/chat/stream
 4. Server validates input + builds the matching system instruction
 5. Groq streams the completion back, chunk by chunk
 6. Text renders live in the assistant bubble
 7. MongoDB saves the prompt, reply, and timestamps
 8. Saved threads appear in the history sidebar for later
```

---

## 🎭 Tone Behavior

| Tone | Backend System Instruction |
|---|---|
| 💼 **Professional** | *Respond in a professional, clear, and structured tone.* |
| 😊 **Casual** | *Respond in a friendly, conversational, and natural tone.* |
| ⚡ **Concise** | *Respond briefly and directly while preserving important information.* |

> ⚠️ Only `professional`, `casual`, and `concise` are accepted by the API.

---

## 🌐 API Endpoints

| Method | Endpoint | Purpose |
|---|---|---|
| `GET` | `/api/conversations` | Return saved conversation summaries, newest first |
| `GET` | `/api/conversations/:id` | Retrieve a conversation and its messages |
| `POST` | `/api/chat/stream` | Stream an AI response and persist the exchange |

**Streaming endpoint payload:**

```json
{
  "prompt": "Explain event loops.",
  "tone": "professional",
  "conversationId": "optional-existing-mongodb-id"
}
```

---

## 📁 Project Structure

```
.
├── public/
│   ├── index.html       # Chat interface
│   ├── app.js            # Browser state, history, and stream reader
│   └── styles.css        # Responsive visual design
├── server.js              # API, Groq integration, and MongoDB persistence
├── .env.example           # Required configuration template
└── package.json           # Scripts and dependencies
```

---

## 🛠️ Troubleshooting

| Message | Resolution |
|---|---|
| `GROQ_API_KEY is not set` | Add `GROQ_API_KEY` to `.env`, then stop and restart the server |
| `model_not_found` | Set `GROQ_MODEL=openai/gpt-oss-20b`, or use a model available to your Groq account |
| `MongoDB storage unavailable` | Confirm `MONGODB_URI` is reachable and that the account has database access |
| `Port already in use` | Open the fallback URL printed by the server, or stop the other process using the requested port |

---

## 📜 Scripts

| Command | Description |
|---|---|
| `npm run dev` | Start the server in watch mode for development |
| `npm start` | Start the server normally |

---

## 🔐 Security Notes

- 🚫 Keep `.env` private — it is already excluded from Git
- 🚫 Never put Groq or MongoDB credentials in browser code
- 🔄 Rotate an API key immediately if it is ever exposed publicly

---

<div align="center">

**Built with Node.js, Express, Groq, and MongoDB**

</div>