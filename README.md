# PromptLab

Evaluate prompts, auto-improve them, and catalog the winners. Prompt Lab + Prompt Library + serverless Anthropic proxy, deployable to Vercel in under 10 minutes.

## What's here

```
PromptLab/
├── index.html                   → /         (Prompt Lab)
├── library/
│   ├── index.html               → /library/ (public-facing library)
│   ├── internal.html            → /library/internal/ (team view, incl. internal prompts)
│   └── prompts/                 → /library/prompts/<slug>/
│       └── evaluation-dataset-generator.html
├── api/
│   └── messages.js              → /api/messages  (Anthropic proxy)
├── vercel.json
├── .gitignore
└── README.md
```

Everything is pre-built. Push to GitHub, import to Vercel, set two environment variables, done.

## Deploy in 5 steps

### 1. Push to GitHub

From the folder containing this README:

```bash
git init
git add .
git commit -m "Initial PromptLab deploy"
git branch -M main
git remote add origin https://github.com/JeffreyDMills/PromptLab.git
git push -u origin main
```

### 2. Import into Vercel

1. Go to [vercel.com/new](https://vercel.com/new)
2. Import your `PromptLab` GitHub repo
3. Framework Preset: **Other** (it's a static site with serverless functions — don't let Vercel guess a framework)
4. Root Directory: leave blank (the repo root)
5. Build & Output Settings: leave all defaults
6. Click **Deploy**

### 3. Set environment variables

Once the first deploy finishes, go to **Project Settings → Environment Variables** and add:

| Name | Value | Environments |
|---|---|---|
| `ANTHROPIC_API_KEY` | your Anthropic key (`sk-ant-...`) | Production, Preview, Development |
| `PROXY_TOKEN` | a long random string you pick (e.g., `openssl rand -hex 32`) | Production, Preview, Development |

Both are server-side only. They're never sent to the browser.

After adding them, trigger a redeploy from the **Deployments** tab (ellipsis menu → Redeploy) so the new env vars take effect.

### 4. Test the deployment

```bash
# Health check — you should get a 401 without a token, 200 with one
curl -i https://<your-app>.vercel.app/api/messages \
  -X POST -H 'Content-Type: application/json' \
  -d '{"model":"claude-haiku-4-5-20251001","max_tokens":32,"messages":[{"role":"user","content":"ping"}]}'

# With token — should return a proper Anthropic response
curl -i https://<your-app>.vercel.app/api/messages \
  -X POST \
  -H 'Content-Type: application/json' \
  -H 'Authorization: Bearer <YOUR_PROXY_TOKEN>' \
  -d '{"model":"claude-haiku-4-5-20251001","max_tokens":32,"messages":[{"role":"user","content":"ping"}]}'
```

### 5. Use the deployed Lab

1. Open `https://<your-app>.vercel.app/` — this is the Lab.
2. In **Setup**, switch to **Proxy** mode.
3. Proxy URL: `https://<your-app>.vercel.app/api/messages`
4. Token: whatever you set `PROXY_TOKEN` to.
5. Paste your draft prompt, generate a dataset, run.

The library is at `https://<your-app>.vercel.app/library/` (public prompts). Internal view at `https://<your-app>.vercel.app/library/internal/`.

## Publishing a new prompt to the library

1. Run an evaluation in the Lab.
2. Click **Publish to Library →** in the final card.
3. Fill in title, category, tags, description, visibility.
4. Click **Generate page**. You get a downloaded `.html` file and a JSON snippet.
5. Locally: drop the `.html` into `library/prompts/` and paste the JSON into the `PROMPTS` array in both `library/index.html` and (if internal) `library/internal.html`.
6. Commit, push. Vercel auto-redeploys in seconds.

## Security notes

- **`PROXY_TOKEN` is a shared secret.** Anyone with it can burn your Anthropic budget. Rotate it if it leaks, and keep it out of screenshots.
- **No per-user auth.** For customer-facing use, replace the static token with real auth (SSO, JWT, or a session-cookie layer) before handing the URL to anyone outside the team.
- **Rate limiting.** There's no per-user rate limit in this proxy — relies on Anthropic's own limits. Add [Vercel KV](https://vercel.com/docs/storage/vercel-kv) + a token-bucket check to `api/messages.js` if you need to cap spend.
- **CORS.** Defaults to `*`. Tighten by setting `ALLOWED_ORIGIN` env var to a specific URL if you want the proxy reachable only from your own domain.

## Cost expectations

- **Vercel Hobby tier**: free. Covers anything short of heavy external usage.
- **Anthropic API**: this is where the money goes. A typical Lab run (10 cases × 3 iterations × [generator + grader + improver calls]) is roughly 60-90 API calls. At Sonnet 4.6 pricing, that's a few dollars per evaluation. Haiku is ~10x cheaper.

## Rolling back

Vercel keeps every deployment. If a change breaks something, **Deployments → pick a previous one → Promote to Production**. Or `git revert` and push.

## Running locally

You don't need to — Vercel preview deploys are faster to iterate on. But if you want to:

```bash
npm i -g vercel
vercel dev
```

That boots the static site + serverless functions locally at `http://localhost:3000`.
