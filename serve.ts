import app from './src/server/app.js';
import { getDb } from './src/server/db.js';
import handler from "./dist/server/server.js";
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import express from 'express';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const PORT = 3000;
const CLIENT_DIR = path.join(__dirname, 'dist', 'client');

// Static files (must be before SSR handler)
app.use(express.static(CLIENT_DIR));

// TanStack Start SSR Handler
app.all('*', async (req, res, next) => {
  // If it's an API route that didn't match anything in app.ts, we could let it through
  // but app.ts should handle /api/*
  if (req.path.startsWith('/api') || req.path === '/sms') {
    return next();
  }

  // Convert Express request to Fetch request for TanStack Start
  const url = new URL(req.url, `${req.protocol}://${req.get('host')}`);
  const fetchReq = new Request(url.href, {
    method: req.method,
    headers: req.headers as any,
    body: ['POST', 'PUT', 'PATCH'].includes(req.method) ? JSON.stringify(req.body) : undefined,
  });

  try {
    const fetchRes = await (handler as any).fetch(fetchReq);
    
    // Copy headers
    fetchRes.headers.forEach((value: string, key: string) => {
      res.setHeader(key, value);
    });

    res.status(fetchRes.status);
    const body = await fetchRes.arrayBuffer();
    res.send(Buffer.from(body));
  } catch (error) {
    console.error('SSR Error:', error);
    res.status(500).send('Internal Server Error');
  }
});

getDb().then(() => {
  app.listen(PORT, '0.0.0.0', () => {
    console.log(`LeadFlow AI serving on http://0.0.0.0:${PORT}`);
  });
}).catch(err => {
  console.error('Failed to initialize database:', err);
  process.exit(1);
});
