# ToT Visual Client (Next.js)

Watch the Tree of Thoughts (Game of 24 and Creative Writing) being built in real time over WebSocket.

## Setup

```bash
cd javascript/client
npm install
```

Optional: copy `.env.local.example` to `.env.local` and set `NEXT_PUBLIC_WS_URL` if your WebSocket server runs on a different host/port (default: `ws://localhost:3006`).

## Run

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000). Click **Game of 24** or **Creative Writing** to start a run; the tree will update live as nodes are created and evaluated.

## Requirements

- The **WebSocket server** must be running (see server README: `npm run dev:ws` in `javascript/server`).
