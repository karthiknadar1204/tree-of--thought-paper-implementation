import { WebSocketServer } from 'ws';
import dotenv from 'dotenv';
import { solveGameOf24 } from './services/tot.js';
import { solveCreativeWriting } from './services/totCreativeWriting.js';

dotenv.config();

const WS_PORT = Number(process.env.WS_PORT) || 3006;

const wss = new WebSocketServer({ port: WS_PORT });

function send(ws, event) {
  if (ws.readyState === 1) {
    try {
      ws.send(JSON.stringify(event));
    } catch (err) {
      console.error('[WS] send error:', err.message);
    }
  }
}

wss.on('listening', () => {
  console.log(`WebSocket server listening on ws://localhost:${WS_PORT}`);
});

wss.on('connection', (ws) => {
  console.log('[WS] client connected');

  ws.on('message', async (data) => {
    let msg;
    try {
      msg = JSON.parse(data.toString());
    } catch {
      send(ws, { type: 'error', message: 'Invalid JSON' });
      return;
    }

    if (msg.type !== 'run' || !msg.task) {
      send(ws, { type: 'error', message: 'Expected { type: "run", task: "game24"|"creativeWriting", payload: {...} }' });
      return;
    }

    const onProgress = (event) => send(ws, event);

    try {
      if (msg.task === 'game24') {
        const numbers = msg.payload?.numbers;
        if (!Array.isArray(numbers) || numbers.length !== 4) {
          send(ws, { type: 'error', message: 'game24 requires payload.numbers (array of 4 numbers)' });
          return;
        }
        await solveGameOf24(numbers, 5, 4, onProgress);
      } else if (msg.task === 'creativeWriting') {
        const sentences = msg.payload?.sentences;
        if (!Array.isArray(sentences) || sentences.length !== 4) {
          send(ws, { type: 'error', message: 'creativeWriting requires payload.sentences (array of 4 strings)' });
          return;
        }
        await solveCreativeWriting(sentences, 5, 4, onProgress);
      } else {
        send(ws, { type: 'error', message: 'Unknown task. Use "game24" or "creativeWriting".' });
      }
    } catch (err) {
      console.error('[WS] run error:', err);
      send(ws, { type: 'error', message: err.message ?? 'Run failed' });
    }
  });

  ws.on('close', () => {
    console.log('[WS] client disconnected');
  });
});
