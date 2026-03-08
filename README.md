# Tree of Thoughts (ToT) — Implementation

A small implementation of the **Tree of Thoughts** approach from the paper, with:

- **Game of 24** — Use four numbers and +, −, ×, ÷ to reach 24.
- **Creative Writing** — Generate a short story from four seed sentences.

The solver uses BFS with a beam: it **proposes** next steps (thoughts), **evaluates** them (sure / maybe / impossible), and **prunes** bad paths. You can call the REST API or watch the tree grow in real time in the Next.js client over WebSocket.

---

## Prerequisites

- **Node.js** 18+ (LTS recommended)
- **OpenAI API key** (for the server)

---

## Setup

### 1. Server (`javascript/server`)

```bash
cd javascript/server
npm install
```

Create a `.env` file in `javascript/server/`:

```env
OPENAI_API_KEY=your_openai_api_key_here
PORT=3005
WS_PORT=3006
```

- `OPENAI_API_KEY` — Required. Get one from [OpenAI](https://platform.openai.com/api-keys).
- `PORT` — Optional. REST API port (default: 3000).
- `WS_PORT` — Optional. WebSocket server port (default: 3006).

### 2. Client (`javascript/client`)

```bash
cd javascript/client
npm install
```

Optional: if the WebSocket server runs on another host/port, copy `.env.local.example` to `.env.local` and set:

```env
NEXT_PUBLIC_WS_URL=ws://localhost:3006
```

---

## Run

You need **three** processes: REST API, WebSocket server, and the Next.js client.

**Terminal 1 — REST API**

```bash
cd javascript/server
npm run dev
```

- API base: `http://localhost:3005` (or whatever you set as `PORT`).

**Terminal 2 — WebSocket server**

```bash
cd javascript/server
npm run dev:ws
```

- WebSocket: `ws://localhost:3006` (or `WS_PORT` from `.env`).

**Terminal 3 — Client**

```bash
cd javascript/client
npm run dev
```

- Open **http://localhost:3000** in the browser.

---

## Usage

### REST API

- **Game of 24:**  
  `POST /api/game24`  
  Body: `{ "numbers": [4, 9, 10, 13] }` (exactly 4 numbers).

- **Creative Writing:**  
  `POST /api/creative-writing`  
  Body: `{ "sentences": ["First sentence.", "Second.", "Third.", "Fourth."] }` (exactly 4 strings).

- **Health:**  
  `GET /health`

Response shape: `{ success, solution, steps [, partial] }`.

### Client (browser)

1. Open http://localhost:3000.
2. **Game of 24:** Enter 4 numbers, click **Run Game of 24**.
3. **Creative Writing:** Enter 4 seed sentences, click **Run Creative Writing**.

The tree (nodes and verdicts) updates in real time. When the run finishes, the solution (or best partial) is shown below.

---

## Project layout

```
javascript/
├── server/          # Express API + WebSocket server
│   ├── index.js    # REST API (game24, creative-writing)
│   ├── wsServer.js # WebSocket server (run with npm run dev:ws)
│   ├── services/   # ToT solvers (tot.js, totCreativeWriting.js)
│   ├── prompts/    # LLM prompts
│   └── schemas/    # Zod validation for LLM responses
└── client/         # Next.js app (tree visualization)
    └── app/        # Pages and styles
```

---

## More detail

- **Server:** [javascript/server/README.md](javascript/server/README.md) — API and WebSocket message format.
- **Client:** [javascript/client/README.md](javascript/client/README.md) — Client setup and WebSocket URL.
