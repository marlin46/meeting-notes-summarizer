# Meeting Notes Summarizer

Paste a meeting transcript and get back:

- **Executive Summary**
- **Action Items** (with owner and due date when the transcript states them)
- **Risks**
- **Next Steps**

```
frontend/   React 19 + Vite 8 + Tailwind CSS 4   → deploys to Vercel
backend/    Node.js + Express 5 + Claude API     → deploys to Railway
```

## How it works

1. The user pastes a transcript in the frontend and clicks **Summarize**.
2. The frontend sends `POST {VITE_API_URL}/api/summarize` with `{ "transcript": "..." }`.
3. The backend validates the input, then sends it to Claude with a strict JSON schema (structured outputs).
4. The backend returns:

```json
{
  "executiveSummary": "string",
  "actionItems": [{ "task": "string", "owner": "string|null", "dueDate": "string|null" }],
  "risks": ["string"],
  "nextSteps": ["string"]
}
```

## Backend features

| Feature | Details |
|---|---|
| Validation | `transcript` must be a string, 50–100,000 characters after trimming. Body limit 200 KB. |
| Rate limiting | 20 requests per IP per 15 minutes on `/api/summarize` (configurable). |
| CORS | Only origins in `ALLOWED_ORIGINS` can call the API from a browser. |
| Error handling | Invalid JSON → 400, bad input → 400, too large → 413, rate limited → 429, Claude API errors → 502/503 with safe messages (details are logged on the server only). |
| Health check | `GET /` and `GET /health` → `{"status":"ok"}` (Railway uses `/health`). |

## Run locally

Requires Node.js 20 or newer.

```bash
# Terminal 1: backend
cd backend
cp .env.example .env        # then set CLAUDE_API_KEY in .env
npm install
npm run dev                 # http://localhost:3001

# Terminal 2: frontend
cd frontend
cp .env.example .env        # VITE_API_URL=http://localhost:3001
npm install
npm run dev                 # http://localhost:5173
```

## Environment variables

### backend/.env

| Variable | Required | Default | Purpose |
|---|---|---|---|
| `CLAUDE_API_KEY` | Yes | — | Your Claude API key from https://platform.claude.com/settings/keys |
| `CLAUDE_MODEL` | No | `claude-opus-5-5` | Claude model to use |
| `ALLOWED_ORIGINS` | No | `http://localhost:5173` | Comma-separated frontend URLs allowed by CORS |
| `PORT` | No | `3001` | Set automatically by Railway |
| `RATE_LIMIT_MAX` | No | `20` | Requests per IP per window |
| `RATE_LIMIT_WINDOW_MS` | No | `900000` | Window length (15 minutes) |

### frontend/.env

| Variable | Required | Purpose |
|---|---|---|
| `VITE_API_URL` | Yes in production | Backend URL, e.g. `https://your-backend.up.railway.app` |

`VITE_` variables are baked in at build time. After changing `VITE_API_URL` on Vercel, redeploy.

## Deployment

Deploy the backend first, because the frontend needs its URL.

### 1. Backend → Railway

**Dashboard:**

1. Railway → **New Project** → **Deploy from GitHub repo** → pick this repo.
2. Open the service → **Settings** → **Root Directory**: `backend`.
3. **Variables**: add `CLAUDE_API_KEY` and `ALLOWED_ORIGINS` (set this to your Vercel URL after step 2; use `http://localhost:5173` for now).
4. **Settings** → **Networking** → **Generate Domain**. Copy the URL.
5. Check `https://<your-backend>.up.railway.app/health` returns `{"status":"ok"}`.

`backend/railway.json` sets the start command (`npm start`) and health check (`/health`).

**CLI:** see the commands at the end of this file.

### 2. Frontend → Vercel

**Dashboard:**

1. Vercel → **Add New** → **Project** → import this repo.
2. **Root Directory**: `frontend`. Vercel detects Vite automatically (build `npm run build`, output `dist`).
3. **Environment Variables**: `VITE_API_URL` = your Railway URL (no trailing slash).
4. **Deploy**. Copy the production URL.

### 3. Connect them

On Railway, set `ALLOWED_ORIGINS` to your Vercel URL, for example:

```
ALLOWED_ORIGINS=https://meeting-notes-summarizer.vercel.app
```

Railway redeploys automatically. To also allow local development, add it after a comma:
`https://meeting-notes-summarizer.vercel.app,http://localhost:5173`

## Troubleshooting

| Symptom | Fix |
|---|---|
| Browser shows a CORS error | `ALLOWED_ORIGINS` on Railway must exactly match the Vercel URL (scheme included, no trailing slash). |
| "Could not reach the server" | `VITE_API_URL` on Vercel is wrong or missing; fix it and redeploy the frontend. |
| "The AI service rejected the server credentials" | `CLAUDE_API_KEY` on Railway is wrong. |
| "The AI service is busy or out of quota" | Claude API rate limit or billing; check your Claude Console account. |
| "The AI declined to summarize this transcript" | Claude's safety checks refused the content (rare for meeting notes). |
| Railway deploy crashes immediately | Check logs for `Missing CLAUDE_API_KEY`. |
