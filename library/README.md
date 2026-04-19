# Toptal Prompt Library

A static site that catalogs prompts evaluated with Prompt Lab. Every prompt page carries its final prompt, the evaluation dataset, the full iteration history, and its final rubric scores — so each entry is trustworthy on its own.

## Layout

```
library/
├── index.html                   # customer-facing (public prompts only)
├── internal.html                # team view (includes internal-only prompts)
├── prompts/
│   └── <slug>.html              # one self-contained page per prompt
└── README.md
```

Each file is fully self-contained. No server, no build step required to view. Works from `file://`, any static host, or behind the Prompt Lab proxy.

## Adding a new prompt

1. Open **Prompt Lab** (`../prompt-lab.html`), paste your draft, generate or paste a dataset, and run the evaluation.
2. When the run finishes, click **Publish to Library →** in the final card.
3. Fill in the form (title, category, tags, description, visibility).
4. Click **Generate page**. You get:
   - A downloaded `<slug>.html` file.
   - A JSON snippet describing the entry.
5. Save the `.html` file into `library/prompts/`.
6. Open `library/index.html` (and `library/internal.html` if you publish internal prompts too), find the `const PROMPTS = [...]` array, and paste the JSON snippet into it.

That's the whole flow. Two file drops, one paste.

## Visibility

Every prompt has a `visibility` flag: `"public"` or `"internal"`.

- `index.html` filters to **public only**. This is the one you share externally.
- `internal.html` shows **everything**, including internal-only prompts. This is the team view.

Internal prompts render with an amber "Internal" chip on their card and hero.

## Categories

Cards auto-group by category in the filter bar. Pick a category when publishing — the library collects the list dynamically from what's been added. For the first batch we're building depth in **Executive Search**; later batches will expand to Brand Engine, Recruiting Outreach, Client Prep, and others.

## Tips

- **Name prompts by outcome, not tool.** "Executive Search Sourcing — CTO" beats "Sourcing prompt v3". Customers and teammates scan for what they need.
- **Tag aggressively.** Tags are full-text searchable in the filter bar. Include the role, the domain, the stage of workflow.
- **Republish when you improve a prompt.** Use the same slug to overwrite, or a new slug to version (`exec-search-cto` → `exec-search-cto-v2`).
- **Use internal visibility for anything with private data in the test cases.** Client names, unreleased products, compensation numbers — keep them off the public index.

## Design notes

- Prompt pages embed three Proxima Nova weights (~260 KB each); the index pages embed five weights (~420 KB) for the hero typography.
- The prompt page's "Re-run in Prompt Lab" button deep-links to `../../prompt-lab.html` — adjust if your folder structure differs.
- The `PROMPTS` registry is baked into each index file as a JS constant, on purpose. Keeps everything portable, works over `file://`, no CORS issues. Downside: two files to edit per publish. Worth it.
