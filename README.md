# AI Chat Assistant

A compact Express application with a Groq streaming chat interface and MongoDB-backed conversation history.

## Run locally

1. Copy `.env.example` to `.env` and provide `GROQ_API_KEY` and `MONGODB_URI`.
2. Install packages with `npm install`.
3. Run `npm run dev` and open `http://localhost:3000`.

The server validates `professional`, `casual`, and `concise` tone values, converts each to a Groq system instruction, streams response chunks to the browser, and saves each user/assistant message pair to MongoDB.
