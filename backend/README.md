# Mind Brother Backend Proxy

This is a backend proxy server that handles Anthropic API calls securely, keeping the API key hidden from the frontend.

## Setup

1. **Install dependencies:**
   ```bash
   cd backend
   npm install
   ```

2. **Create environment file:**
   Create a `.env` file in the backend directory with:
   ```
   PORT=3001
   ANTHROPIC_API_KEY=your_actual_anthropic_api_key_here
   ```

3. **Start the server:**
   ```bash
   npm run dev
   ```

The server will run on `http://localhost:3001`

## API Endpoints

- `GET /health` - Health check
- `POST /api/chat` - Chat with Claude

### Chat Endpoint

**Request:**
```json
{
  "userMessage": "Hello, how are you?",
  "conversationHistory": [
    { "role": "user", "content": "Previous message" },
    { "role": "assistant", "content": "Previous response" }
  ],
  "systemPrompt": "You are a helpful assistant."
}
```

**Response:**
```json
{
  "success": true,
  "response": "I'm doing well, thank you!",
  "usage": {
    "input_tokens": 10,
    "output_tokens": 15
  }
}
```











