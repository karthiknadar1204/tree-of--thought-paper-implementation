# ToT API & WebSocket Server

## 1. REST API (Express)

Serves Game of 24 and Creative Writing over HTTP.

```bash
npm install
npm run dev
```

- API: `http://localhost:3000` (or `PORT` from `.env`)
- **Endpoints:** `POST /api/game24`, `POST /api/creative-writing`
- Health: `GET /health`

Uses `PORT` from `.env` (default 3000).

---

## 2. WebSocket server (separate process)

Streams tree-of-thoughts events in real time for the visual client.

```bash
npm run dev:ws
```

- Listens on **port 3006** (or `WS_PORT` in `.env`)
- URL: `ws://localhost:3006`

**Client message to start a run:**

```json
{
  "type": "run",
  "task": "game24",
  "payload": { "numbers": [4, 9, 10, 13] }
}
```

or

```json
{
  "type": "run",
  "task": "creativeWriting",
  "payload": { "sentences": ["s1", "s2", "s3", "s4"] }
}
```

Server sends events: `init`, `round`, `node`, `evaluate`, `prune`, `solution`, `error`.

---

## Running both

1. **Terminal 1 – API:** `npm run dev`
2. **Terminal 2 – WebSocket:** `npm run dev:ws`
3. **Terminal 3 – Client:** from `javascript/client`, run `npm run dev` and open http://localhost:3000

The REST API does not include WebSocket; the WS server is a separate process so existing API behaviour is unchanged.
