// Vercel serverless function — Anthropic Messages API proxy.
// Lives at /api/messages. Keeps ANTHROPIC_API_KEY server-side.
//
// Required env vars (set in Vercel dashboard → Settings → Environment Variables):
//   ANTHROPIC_API_KEY   — your Anthropic key. Never exposed to clients.
//   PROXY_TOKEN         — optional. If set, clients must send "Authorization: Bearer <token>".
//                         Strongly recommended for any deployment that's publicly reachable.

export const config = {
  runtime: 'nodejs',
  maxDuration: 60, // seconds; Anthropic calls are usually 2-8s
};

const ANTHROPIC_URL = 'https://api.anthropic.com/v1/messages';
const ANTHROPIC_VERSION = '2023-06-01';

export default async function handler(req, res) {
  // ---- CORS ------------------------------------------------------------
  // Open by default so the Lab works from any Vercel preview URL.
  // Tighten by setting ALLOWED_ORIGIN if you want to lock this down.
  const origin = req.headers.origin || '*';
  const allowedOrigin = process.env.ALLOWED_ORIGIN || '*';
  const allow = allowedOrigin === '*' || allowedOrigin === origin ? origin : null;
  if (allow) {
    res.setHeader('Access-Control-Allow-Origin', allow);
    res.setHeader('Vary', 'Origin');
  }
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  res.setHeader('Access-Control-Max-Age', '600');

  if (req.method === 'OPTIONS') return res.status(204).end();
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  // ---- Auth ------------------------------------------------------------
  const PROXY_TOKEN = process.env.PROXY_TOKEN;
  if (PROXY_TOKEN) {
    const auth = req.headers.authorization || '';
    const m = /^Bearer\s+(.+)$/i.exec(auth);
    if (!m || m[1] !== PROXY_TOKEN) {
      return res.status(401).json({ error: 'Unauthorized' });
    }
  }

  // ---- Server key check ------------------------------------------------
  const ANTHROPIC_API_KEY = process.env.ANTHROPIC_API_KEY;
  if (!ANTHROPIC_API_KEY) {
    return res.status(500).json({ error: 'Server misconfigured: ANTHROPIC_API_KEY not set' });
  }

  // ---- Forward to Anthropic --------------------------------------------
  // Vercel parses JSON bodies automatically when content-type is application/json.
  const payload = req.body;
  if (!payload || typeof payload !== 'object') {
    return res.status(400).json({ error: 'Invalid JSON body' });
  }

  try {
    const upstream = await fetch(ANTHROPIC_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': ANTHROPIC_API_KEY,
        'anthropic-version': ANTHROPIC_VERSION,
      },
      body: JSON.stringify(payload),
    });
    const text = await upstream.text();
    res.status(upstream.status);
    res.setHeader('Content-Type', upstream.headers.get('content-type') || 'application/json');
    return res.send(text);
  } catch (e) {
    return res.status(502).json({ error: 'Upstream error: ' + (e && e.message || String(e)) });
  }
}
