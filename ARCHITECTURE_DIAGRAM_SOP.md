# SOP: Generate an Interactive Architecture Diagram

**Audience:** Claude Code (or any coding agent) working in the repository that contains this file.
**Output:** a single self-contained `architecture.html` at the repo root. It maps the app from its entry point through every component and module, shows the fields and methods of each, and draws the connections between them.

When a user says something like "generate the architecture diagram" or "follow the diagram SOP", do everything below, start to finish.

---

## 1. Ground rules

1. **Read the code first; never guess.** Every box, field, method, and connection must trace back to real source you have read in this session. If something is ambiguous, read more code; don't invent it.
2. **Single file, zero dependencies.** Inline all CSS and JS. No CDNs, no web fonts, no build step. It must work when opened with `file://`.
3. **Don't modify application code.** This is documentation only. Report bugs in the "Things noticed" section instead of fixing them.
4. **Flat, Material-style visuals.** Neutral elevation shadows only (`rgba(0,0,0,…)`). No colored or tinted shadows, glows, or gradients.
5. **Theme-aware.** Define light tokens on `:root` and override them under `@media (prefers-color-scheme: dark)`.
6. **Scale to the project.** A 30-file app should get about 20–40 boxes. For larger codebases, group modules by folder or feature so there are at most about 60 boxes. Mention any grouping in the page intro.

---

## 2. Discovery (read before writing)

Work through these in order. Small projects can be read directly. For large ones, fan out searches, but still read the key files yourself.

### 2.1 Inventory
- `git ls-files`, ignoring lockfiles, assets, and generated output.
- Read the manifest (`package.json`, `pyproject.toml`, `go.mod`, `Cargo.toml`, `composer.json`, …) for the framework, scripts, dependencies, and deploy target.
- Read any `README`, `AGENTS.md`, `CLAUDE.md`, or `docs/` notes for intended architecture.
- Note uncommitted or untracked files from `git status`. They are part of the current app, so tag them `new` or `wip`.

### 2.2 Find the entry point
| Stack | Typical entry |
|---|---|
| Vite / SPA | `index.html` → `src/main.*` → root component |
| Next.js / Remix / SvelteKit / Nuxt | `app/` or `pages/` or `routes/` layout + route files |
| Node server | `package.json` `main`/`start` script → `server.*`/`index.*` |
| Python | `__main__.py`, `manage.py`, `app.py`/`main.py` (FastAPI/Flask app object) |
| Go | `cmd/*/main.go` |
| Mobile / desktop | app delegate, `main.dart`, `electron main` |
| Workers / serverless | `wrangler.*` / handler exports |

### 2.3 Trace outward from the entry
For **every** source module, record:
- **Identity:** display name, repo-relative path, and a short role tag (`entry`, `root`, `route`, `screen`, `view`, `child`, `modal`, `store`, `service`, `util`, `cache`, `cloud`, `lib`, `ext`, …).
- **Inputs:** props, constructor args, route params, env vars.
- **State and fields:** reactive state, class fields, module-level constants, derived or computed values.
- **Methods and exports:** public first, then private ones (`#x`, `_x`) collapsed onto one line.
- **Listeners and side effects:** DOM/window events, lifecycle hooks, timers, subscriptions.
- **Events:** anything it emits or subscribes to on an event bus, store, or pub/sub.
- **Row or data shapes** for stores and models.

Useful grep sweeps (adapt to the language):
```bash
grep -rnE "^import|require\(" src
grep -rnE "\.(emit|on|sub|subscribe|dispatch|publish)\(" src
grep -rnE "localStorage|sessionStorage|indexedDB|fetch\(|axios|supabase|firebase|prisma|db\." src
grep -rnE "\$props|\$state|\$derived|useState|useEffect|defineProps|@Input|signal\(" src
```
Find where child components are rendered by grepping for `<ComponentName` in templates or JSX.

### 2.4 Record every connection
Keep an edge list of `[from, to, kind, label]` using exactly these four kinds:

| kind | meaning | label = |
|---|---|---|
| `render` | parent renders, mounts, or routes to a child | condition and props passed, e.g. `view 'goals' · bind:open` |
| `call` | module imports and uses another | the members actually used, e.g. `sync() · reset()` |
| `signal` | event emitter → subscriber (drawn **directly**, not through the bus box) | event name(s) |
| `io` | code → storage, network, or external service | mechanism, e.g. `HTTPS`, `getItem · setItem` |

Keep the bus or store module as its own box that lists its API, but draw event edges straight from emitter to subscriber. Routing everything through a central hub makes the diagram unreadable.

### 2.5 Collect the supporting facts
- **Event catalog:** each event, its emitters (`Module.method`), subscribers (with sub ids if any), and payload. Flag events with **no subscribers**.
- **Persistence map:** storage keys, remote tables or collections, row shapes, and who writes each.
- **Key flows:** the 3–5 most important runtime sequences, e.g. boot/auth, write path, sync/fetch, sign-out/teardown, request lifecycle.
- **Observations:** real inconsistencies you noticed. Examples: dead events, stale copies of reactive state, dropped fields, empty branches, unhandled buttons, bypassed abstractions. Be specific and cite `Module.method`.

---

## 3. Layout: columns = architectural tiers

Order columns left → right by dependency depth, so most `call` edges flow rightward. Adapt the names to the stack:

```
Entry → Root/App → Screens/Routes → Child components → State/Stores/Services
      → Shared utils & event bus & sync → Infrastructure (cache, db, auth, http)
      → Clients & libraries → External (DB service, browser storage, 3rd-party APIs)
```

- Backend-only projects: `Entry → Router → Controllers/Handlers → Services → Repositories/Models → Clients → External`.
- Within a column, order boxes so connected neighbors sit near each other vertically (e.g. a view directly above its children).
- The first and last columns may be narrower (200px vs 250px).
- **Avoid same-column edges.** If two modules in a column talk to each other, move one into the next column.

---

## 4. Page structure

1. `<h1>` project name + "architecture", followed by a 1–2 sentence summary of how the app works.
2. **Toolbar:** four legend chips that double as edge-kind filter checkboxes, plus zoom controls (`−`, `100%` reset, `+`, `Fit`).
3. **Hint line:** "Hover a box to trace its connections… Click to pin… Scroll to zoom at the cursor; hold Space and drag (or middle-drag) to pan."
4. **Diagram viewport:** a bordered, scrollable area about `82vh` tall containing the board.
5. **Key flows:** a responsive grid of panels, each an ordered list of steps with inline `.m` code chips for module and method names.
6. **Event catalog table** (omit if the project has no events).
7. **Persistence table:** local keys and remote tables with row shapes (omit if none).
8. **Things noticed while mapping:** a bullet list of observations.

Wrap wide tables in `overflow-x: auto`. The page body must not scroll horizontally at ~400px width.

---

## 5. Data model inside the page

Keep all content in two arrays so the rendering engine stays generic:

```js
const COLS = ['Entry', 'Root', 'Screens & overlays', /* … */ 'External'];

const NODES = [
  { id: 'App', col: 1, name: 'App', file: 'src/App.svelte', tag: 'root',
    secs: [
      ['state',     ['user  <span class="c">← cache</span>', 'isLoading, isSyncing']],
      ['methods',   ['connect()', 'activate(user)']],
      ['listeners', ["window 'online' → connect()"]],
      ['signals',   ['sub NAVIGATE_TO_DATE', 'emit OPEN_FORM']], // section named 'signals' is tinted
    ],
    note: 'Optional one-line note: row shape, defaults, dev globals.' },
];

// [fromId, toId, kind, label]
const EDGES = [
  ['main', 'App', 'render', 'mount()'],
  ['App', 'budgetApi', 'call', 'sync() · reset()'],
  ['SearchOverlay', 'MonthView', 'signal', 'NAVIGATE_TO_DATE'],
  ['localCache', 'storage', 'io', 'getItem · setItem'],
];
```

Section names to use as they apply: `props`, `state`, `fields`, `methods`, `exports`, `listeners`, `signals`, `renders`, `keys`, `tables`, `env`. Use `<span class="c">…</span>` for short gray annotations.

---

## 6. Rendering engine (required behavior)

Implement the following. The reference code in §9 does all of it.

- **Cards:** built from `NODES` into column divs. Each has a header (tag chip, name, monospace file path) and a body of sections.
- **Edges:** one absolutely positioned `<svg>` covering the board, drawn beneath the cards (cards get `z-index: 1`).
  - Measure positions with `offsetLeft`/`offsetTop` walked up to the board, **not** `getBoundingClientRect`, so zoom transforms don't break the math.
  - Choose sides: if the target is to the right, go from the source's right edge to the target's left edge. If it's to the left, reverse. If they overlap, bulge out from the right sides of both.
  - **Spread ports:** group edge endpoints by (node, side), sort each group by the other end's vertical center, and space them evenly along the card's height. Otherwise edges pile up at one point.
  - Draw cubic Béziers with horizontal tangents.
- **Edge styles:** `render` solid, `call` solid in a second hue, `signal` dashed (`6 4`), `io` dotted with round caps. Default opacity is about 0.38.
- **Focus:** hovering a card adds `.focus` to the board, which dims all cards to ~0.28 and edges to ~0.05. Connected edges and neighbor cards return to full opacity. Each lit edge gets a text label placed along the path with `getPointAtLength`, using a background-colored stroke as a halo. Clicking pins the focus; clicking the same card or empty space clears it.
- **Filters:** legend checkboxes toggle `.hide-<kind>` on the board, which hides those edges and their labels.
- **Zoom:**
  - CSS `transform: scale()` on the board, with `transform-origin: 0 0`.
  - A sizer wrapper set to the scaled width and height, so scrollbars stay correct.
  - Keep the anchor point fixed while zooming. Compute the content point `(scroll + anchor) / oldScale`, apply the new scale, then set `scroll = point * newScale - anchor`.
  - The wheel zooms at the cursor. Use `{ passive: false }` + `preventDefault`, `scale *= exp(-deltaY * 0.0015)`, and treat `deltaMode === 1` (lines) as ×16 pixels.
  - Buttons zoom ×1.2 around the viewport center. Clamp zoom to 0.2–2.5. Fit uses `viewportWidth / boardWidth` and scrolls back to the origin.
- **Pan:**
  - Holding Space (unless focus is in an input) prevents page scroll and adds a `grab` cursor. Space + left-drag, or middle-drag, adjusts `scrollLeft`/`scrollTop`, with a `grabbing` cursor and `user-select: none` while dragging.
  - A capture-phase click handler on the board swallows the click that ends a drag, or any Space+click, so panning never pins cards.
  - Reset the drag flag on every mousedown, and clear the Space state on window `blur`.
- **Redraw** on `resize` and after `document.fonts.ready`.

---

## 7. Verification (must run before reporting done)

```bash
# 1. Script parses
awk '/<script>/{f=1;next}/<\/script>/{f=0}f' architecture.html > "$TMPDIR/arch.js" && node --check "$TMPDIR/arch.js" && echo OK

# 2. Every edge references a real node id
node -e '
const s=require("fs").readFileSync(process.env.TMPDIR+"/arch.js","utf8");
const N=eval(s.match(/const NODES = (\[[\s\S]*?\n\]);/)[1]);
const E=eval(s.match(/const EDGES = (\[[\s\S]*?\n\]);/)[1]);
const ids=new Set(N.map(n=>n.id));
const bad=E.filter(e=>!ids.has(e[0])||!ids.has(e[1]));
const orphan=N.filter(n=>!E.some(e=>e[0]===n.id||e[1]===n.id)).map(n=>n.id);
console.log(N.length,"nodes",E.length,"edges","bad:",bad,"orphans:",orphan)'
```
- Nodes with no edges ("orphans") usually mean a connection was missed. Go back and check them.
- Spot-check about five labels against the source, e.g. confirm a method named on an edge is really called by that module.
- If a browser or screenshot tool is available, open the file and confirm that edges attach to cards, hover works, and wheel zoom and Space-drag behave. If not, **tell the user it hasn't been viewed in a browser.**

---

## 8. Reporting back

Keep it short:
- Link the file.
- Say what the diagram covers: box count, column tiers, and the lower sections.
- List the most important **observations** (likely bugs), since those are the most actionable part.
- Say what was verified and what wasn't (e.g. not visually checked in a browser).

When re-running on a project that already has `architecture.html`, regenerate the `NODES`/`EDGES` data and lower sections from the current code, keep the engine, and summarize what changed architecturally.

---

## 9. Reference implementation (engine + styles)

Copy this skeleton, then fill in the title, intro, `COLS`, `NODES`, `EDGES`, and the lower sections.

```html
<!doctype html>
<html lang="en">
<head>
<meta charset="UTF-8" />
<meta name="viewport" content="width=device-width, initial-scale=1.0" />
<title>PROJECT Architecture</title>
<style>
  :root {
    --bg:#f6f7f9; --surface:#fff; --surface-2:#f1f3f6; --border:#dfe3e8;
    --text:#1d2330; --muted:#5d6675; --faint:#8a93a1;
    --render:#4f5bd5; --call:#0f8a7e; --signal:#b86e00; --io:#c2415b;
    --shadow:0 1px 2px rgba(0,0,0,.08),0 1px 3px rgba(0,0,0,.06);
    --shadow-2:0 2px 6px rgba(0,0,0,.12),0 1px 3px rgba(0,0,0,.08);
  }
  @media (prefers-color-scheme: dark) { :root {
    --bg:#111318; --surface:#1b1e25; --surface-2:#232730; --border:#323743;
    --text:#e6e8ec; --muted:#a3aab6; --faint:#737b88;
    --render:#8d97ff; --call:#3cc2b3; --signal:#f0a53a; --io:#f27a92;
    --shadow:0 1px 2px rgba(0,0,0,.5); --shadow-2:0 3px 8px rgba(0,0,0,.6);
  } }
  *{box-sizing:border-box}
  body{margin:0;background:var(--bg);color:var(--text);font:14px/1.45 system-ui,-apple-system,"Segoe UI",Roboto,sans-serif}
  code{font-family:ui-monospace,Menlo,Consolas,monospace;font-size:12px}
  .wrap{max-width:1400px;margin:0 auto;padding:32px 20px 80px}
  h1{font-size:26px;margin:0 0 4px} h2{font-size:18px;margin:48px 0 12px} h3{font-size:14px;margin:0 0 8px}
  .lede{color:var(--muted);margin:0 0 20px;max-width:75ch}
  .toolbar{display:flex;flex-wrap:wrap;gap:8px 16px;align-items:center;margin-bottom:10px}
  .legend{display:flex;flex-wrap:wrap;gap:6px}
  .chip{display:inline-flex;align-items:center;gap:6px;padding:5px 10px;border-radius:999px;background:var(--surface);border:1px solid var(--border);cursor:pointer;user-select:none;font-size:13px}
  .swatch{width:22px;height:0;border-top:2px solid} .swatch.signal{border-top-style:dashed} .swatch.io{border-top-style:dotted;border-top-width:3px}
  .zoom{display:flex;gap:4px;margin-left:auto}
  button.btn{font:inherit;font-size:13px;padding:5px 10px;border-radius:8px;border:1px solid var(--border);background:var(--surface);color:var(--text);cursor:pointer}
  .hint{color:var(--faint);font-size:12px;margin:0 0 8px}
  .viewport{overflow:auto;border:1px solid var(--border);border-radius:12px;background:var(--surface-2);max-height:82vh}
  .viewport.can-pan,.viewport.can-pan .card{cursor:grab}
  .viewport.panning,.viewport.panning .card{cursor:grabbing;user-select:none}
  .sizer{position:relative}
  .board{position:relative;display:flex;gap:56px;padding:20px 28px 28px;transform-origin:0 0;width:max-content}
  .col{width:250px;display:flex;flex-direction:column;gap:14px} .col.narrow{width:200px}
  .col-title{font-size:11px;font-weight:600;letter-spacing:.08em;text-transform:uppercase;color:var(--faint);height:18px}
  svg.edges{position:absolute;inset:0;pointer-events:none;overflow:visible}
  .card{position:relative;z-index:1;background:var(--surface);border:1px solid var(--border);border-radius:10px;box-shadow:var(--shadow);cursor:pointer;transition:opacity .15s,box-shadow .15s}
  .card:hover{box-shadow:var(--shadow-2)}
  .card-h{padding:9px 11px 7px;border-bottom:1px solid var(--border)}
  .card-h .name{font-weight:650} .card-h .file{color:var(--faint);font-size:11px;font-family:ui-monospace,Menlo,monospace;word-break:break-all}
  .tag{float:right;font-size:10px;font-weight:600;text-transform:uppercase;padding:1px 6px;border-radius:4px;background:var(--surface-2);color:var(--muted);margin-left:6px}
  .card-b{padding:6px 11px 9px} .sec{margin-top:5px}
  .sec-t{font-size:10px;font-weight:600;text-transform:uppercase;letter-spacing:.06em;color:var(--faint)}
  .sec ul{list-style:none;margin:1px 0 0;padding:0}
  .sec li{font-family:ui-monospace,Menlo,monospace;font-size:11.5px;padding:1px 0;overflow-wrap:anywhere}
  .sec li .c{color:var(--faint);font-family:system-ui,sans-serif;font-size:11px}
  .sec.signals li{color:var(--signal)} .note{font-size:11.5px;color:var(--muted);margin-top:5px}
  .board.focus .card{opacity:.28} .board.focus .card.lit{opacity:1}
  .board.focus .card.sel{opacity:1;outline:2px solid var(--text);outline-offset:1px}
  path.edge{fill:none;stroke-width:1.4;opacity:.38}
  path.edge.render{stroke:var(--render)} path.edge.call{stroke:var(--call)}
  path.edge.signal{stroke:var(--signal);stroke-dasharray:6 4}
  path.edge.io{stroke:var(--io);stroke-dasharray:1.5 3.5;stroke-width:2.2;stroke-linecap:round}
  .board.focus path.edge{opacity:.05} .board.focus path.edge.lit{opacity:1;stroke-width:2}
  .hide-render .render,.hide-call .call,.hide-signal .signal,.hide-io .io{display:none}
  text.elabel{font:11px ui-monospace,Menlo,monospace;paint-order:stroke;stroke:var(--surface-2);stroke-width:4px;stroke-linejoin:round}
  text.elabel.render{fill:var(--render)} text.elabel.call{fill:var(--call)} text.elabel.signal{fill:var(--signal)} text.elabel.io{fill:var(--io)}
  .grid{display:grid;grid-template-columns:repeat(auto-fit,minmax(300px,1fr));gap:14px}
  .panel{background:var(--surface);border:1px solid var(--border);border-radius:10px;padding:14px 16px;box-shadow:var(--shadow)}
  ol.steps{margin:0;padding-left:20px} ol.steps li{margin:5px 0}
  .m{font-family:ui-monospace,Menlo,monospace;font-size:12px;background:var(--surface-2);border:1px solid var(--border);border-radius:4px;padding:0 4px;white-space:nowrap}
  .tbl-wrap{overflow-x:auto}
  table{border-collapse:collapse;width:100%;background:var(--surface);border:1px solid var(--border)}
  th,td{text-align:left;padding:8px 12px;border-bottom:1px solid var(--border);vertical-align:top}
  th{font-size:12px;color:var(--muted);background:var(--surface-2)}
  td.sig{color:var(--signal);font-family:ui-monospace,Menlo,monospace;font-size:12px;white-space:nowrap} .none{color:var(--io)}
</style>
</head>
<body>
<div class="wrap">
  <h1>PROJECT architecture</h1>
  <p class="lede">ONE-TO-TWO SENTENCE SUMMARY.</p>
  <div class="toolbar">
    <div class="legend" id="legend">
      <label class="chip"><input type="checkbox" data-kind="render" checked><span class="swatch" style="border-color:var(--render)"></span>renders / mounts</label>
      <label class="chip"><input type="checkbox" data-kind="call" checked><span class="swatch" style="border-color:var(--call)"></span>imports &amp; calls</label>
      <label class="chip"><input type="checkbox" data-kind="signal" checked><span class="swatch signal" style="border-color:var(--signal)"></span>event emit → sub</label>
      <label class="chip"><input type="checkbox" data-kind="io" checked><span class="swatch io" style="border-color:var(--io)"></span>storage / network</label>
    </div>
    <div class="zoom">
      <button class="btn" id="zout">−</button><button class="btn" id="zreset">100%</button>
      <button class="btn" id="zin">+</button><button class="btn" id="zfit">Fit</button>
    </div>
  </div>
  <p class="hint">Hover a box to trace its connections (labels show the members used). Click to pin, click empty space to clear. Scroll to zoom at the cursor; hold Space and drag (or middle-drag) to pan.</p>
  <div class="viewport" id="viewport"><div class="sizer" id="sizer">
    <div class="board" id="board"><svg class="edges" id="edges"></svg></div>
  </div></div>

  <!-- h2 Key flows (.grid > .panel > ol.steps), h2 Event catalog, h2 Persistence, h2 Things noticed -->
</div>

<script>
const COLS = [/* column titles */];
const NARROW = new Set([0, COLS.length - 1]);
const NODES = [/* see §5 */];
const EDGES = [/* see §5 */];

const board = document.getElementById('board'), svg = document.getElementById('edges');
const NS = 'http://www.w3.org/2000/svg', els = {};

COLS.forEach((title, i) => {
  const col = document.createElement('div');
  col.className = 'col' + (NARROW.has(i) ? ' narrow' : '');
  col.innerHTML = `<div class="col-title">${title}</div>`;
  NODES.filter(n => n.col === i).forEach(n => {
    const card = document.createElement('div');
    card.className = 'card'; card.dataset.id = n.id;
    const secs = (n.secs || []).map(([t, items]) =>
      `<div class="sec${t === 'signals' ? ' signals' : ''}"><div class="sec-t">${t}</div><ul>${items.map(x => `<li>${x}</li>`).join('')}</ul></div>`).join('');
    card.innerHTML = `<div class="card-h"><span class="tag">${n.tag}</span><div class="name">${n.name}</div><div class="file">${n.file}</div></div>
      <div class="card-b">${secs}${n.note ? `<div class="note">${n.note}</div>` : ''}</div>`;
    col.appendChild(card); els[n.id] = card;
  });
  board.appendChild(col);
});

function box(el) {
  let x = 0, y = 0, e = el;
  while (e && e !== board) { x += e.offsetLeft; y += e.offsetTop; e = e.offsetParent; }
  return { x, y, w: el.offsetWidth, h: el.offsetHeight };
}

let paths = [];
function draw() {
  svg.innerHTML = '';
  svg.setAttribute('width', board.scrollWidth); svg.setAttribute('height', board.scrollHeight);
  const B = {}; for (const id in els) B[id] = box(els[id]);
  const ports = {};
  const geo = EDGES.map(([f, t, kind, label], i) => {
    const a = B[f], b = B[t]; let fs, ts;
    if (a.x + a.w < b.x) { fs = 'r'; ts = 'l'; } else if (b.x + b.w < a.x) { fs = 'l'; ts = 'r'; } else { fs = 'r'; ts = 'r'; }
    (ports[f + fs] ??= []).push({ i, end: 'f', oy: b.y + b.h / 2 });
    (ports[t + ts] ??= []).push({ i, end: 't', oy: a.y + a.h / 2 });
    return { f, t, kind, label, fs, ts };
  });
  for (const key in ports) {
    const bx = B[key.slice(0, -1)], list = ports[key].sort((p, q) => p.oy - q.oy);
    const top = bx.y + 28, span = Math.max(bx.h - 40, 10);
    list.forEach((p, k) => { geo[p.i][p.end + 'y'] = top + span * (k + 1) / (list.length + 1); });
  }
  paths = geo.map(g => {
    const a = B[g.f], b = B[g.t];
    const x1 = g.fs === 'r' ? a.x + a.w : a.x, x2 = g.ts === 'r' ? b.x + b.w : b.x, y1 = g.fy, y2 = g.ty;
    let d;
    if (g.fs === g.ts) { const bx = Math.max(x1, x2) + 40; d = `M${x1},${y1} C${bx},${y1} ${bx},${y2} ${x2},${y2}`; }
    else { const dx = Math.max(Math.abs(x2 - x1) * 0.45, 30) * (g.fs === 'r' ? 1 : -1); d = `M${x1},${y1} C${x1 + dx},${y1} ${x2 - dx},${y2} ${x2},${y2}`; }
    const p = document.createElementNS(NS, 'path');
    p.setAttribute('d', d); p.setAttribute('class', `edge ${g.kind}`); svg.appendChild(p);
    return { ...g, el: p };
  });
  applyFocus();
}

let hover = null, pinned = null;
function applyFocus() {
  svg.querySelectorAll('text.elabel').forEach(t => t.remove());
  const id = pinned || hover;
  board.classList.toggle('focus', !!id);
  for (const k in els) els[k].classList.remove('lit', 'sel');
  paths.forEach(p => p.el.classList.remove('lit'));
  if (!id) return;
  els[id].classList.add('sel');
  paths.forEach(p => {
    if ((p.f !== id && p.t !== id) || board.classList.contains('hide-' + p.kind)) return;
    p.el.classList.add('lit'); els[p.f].classList.add('lit'); els[p.t].classList.add('lit');
    const pt = p.el.getPointAtLength(p.el.getTotalLength() * (p.f === id ? 0.62 : 0.38));
    const t = document.createElementNS(NS, 'text');
    t.setAttribute('class', `elabel ${p.kind}`); t.setAttribute('x', pt.x); t.setAttribute('y', pt.y - 4);
    t.setAttribute('text-anchor', 'middle'); t.textContent = p.label; svg.appendChild(t);
  });
}
board.addEventListener('mouseover', e => {
  const c = e.target.closest('.card'), id = c ? c.dataset.id : null;
  if (id !== hover) { hover = id; if (!pinned) applyFocus(); }
});
board.addEventListener('mouseleave', () => { hover = null; if (!pinned) applyFocus(); });
board.addEventListener('click', e => {
  const c = e.target.closest('.card');
  pinned = c && c.dataset.id !== pinned ? c.dataset.id : null; applyFocus();
});
document.querySelectorAll('#legend input').forEach(inp => inp.addEventListener('change', () => {
  board.classList.toggle('hide-' + inp.dataset.kind, !inp.checked); applyFocus();
}));

// zoom (anchored)
let scale = 1;
const sizer = document.getElementById('sizer'), viewport = document.getElementById('viewport');
function setScale(s, ax = viewport.clientWidth / 2, ay = viewport.clientHeight / 2) {
  const next = Math.min(2.5, Math.max(0.2, s));
  const cx = (viewport.scrollLeft + ax) / scale, cy = (viewport.scrollTop + ay) / scale;
  scale = next;
  board.style.transform = `scale(${scale})`;
  sizer.style.width = board.offsetWidth * scale + 'px'; sizer.style.height = board.offsetHeight * scale + 'px';
  viewport.scrollLeft = cx * scale - ax; viewport.scrollTop = cy * scale - ay;
  document.getElementById('zreset').textContent = Math.round(scale * 100) + '%';
}
document.getElementById('zin').onclick = () => setScale(scale * 1.2);
document.getElementById('zout').onclick = () => setScale(scale / 1.2);
document.getElementById('zreset').onclick = () => setScale(1);
document.getElementById('zfit').onclick = () => { setScale((viewport.clientWidth - 4) / board.offsetWidth); viewport.scrollTo(0, 0); };
viewport.addEventListener('wheel', e => {
  e.preventDefault();
  const r = viewport.getBoundingClientRect(), delta = e.deltaMode === 1 ? e.deltaY * 16 : e.deltaY;
  setScale(scale * Math.exp(-delta * 0.0015), e.clientX - r.left, e.clientY - r.top);
}, { passive: false });

// pan (Space + drag, or middle-drag)
let spaceDown = false, drag = null, dragged = false;
const typing = el => el && (el.isContentEditable || /^(INPUT|TEXTAREA|SELECT)$/.test(el.tagName));
window.addEventListener('keydown', e => {
  if (e.code !== 'Space' || typing(document.activeElement)) return;
  e.preventDefault(); if (!spaceDown) { spaceDown = true; viewport.classList.add('can-pan'); }
});
window.addEventListener('keyup', e => { if (e.code === 'Space') { spaceDown = false; viewport.classList.remove('can-pan'); } });
window.addEventListener('blur', () => { spaceDown = false; drag = null; viewport.classList.remove('can-pan', 'panning'); });
viewport.addEventListener('mousedown', e => {
  dragged = false;
  if (!(spaceDown && e.button === 0) && e.button !== 1) return;
  e.preventDefault();
  drag = { x: e.clientX, y: e.clientY, sl: viewport.scrollLeft, st: viewport.scrollTop };
  viewport.classList.add('panning');
});
window.addEventListener('mousemove', e => {
  if (!drag) return;
  const dx = e.clientX - drag.x, dy = e.clientY - drag.y;
  if (Math.abs(dx) + Math.abs(dy) > 3) dragged = true;
  viewport.scrollLeft = drag.sl - dx; viewport.scrollTop = drag.st - dy;
});
window.addEventListener('mouseup', () => { if (drag) { drag = null; viewport.classList.remove('panning'); } });
board.addEventListener('click', e => { if (dragged || spaceDown) { e.stopImmediatePropagation(); dragged = false; } }, true);

function layout() { draw(); setScale(scale); }
window.addEventListener('resize', layout);
if (document.fonts && document.fonts.ready) document.fonts.ready.then(layout);
layout();
</script>
</body>
</html>
```
