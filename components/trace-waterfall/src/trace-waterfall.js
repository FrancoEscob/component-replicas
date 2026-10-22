// Trace Waterfall — framework-free rebuild of kobra.systems/components/trace-waterfall.
// Usage: new TraceWaterfall(element, { spans, ...options }). See DEFAULTS for every knob.

const SVG_NS = 'http://www.w3.org/2000/svg';

// Tabler icons (MIT) used by the chrome.
const UI = {
  search: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M3 10a7 7 0 1 0 14 0a7 7 0 1 0 -14 0"/><path d="M21 21l-6 -6"/></svg>',
  searchOff: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M5.039 5.062a7 7 0 0 0 9.91 9.89m1.584 -2.434a7 7 0 0 0 -9.038 -9.057"/><path d="M3 3l18 18"/></svg>',
  sitemap: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M3 17a2 2 0 0 1 2 -2h2a2 2 0 0 1 2 2v2a2 2 0 0 1 -2 2h-2a2 2 0 0 1 -2 -2z"/><path d="M15 17a2 2 0 0 1 2 -2h2a2 2 0 0 1 2 2v2a2 2 0 0 1 -2 2h-2a2 2 0 0 1 -2 -2z"/><path d="M9 5a2 2 0 0 1 2 -2h2a2 2 0 0 1 2 2v2a2 2 0 0 1 -2 2h-2a2 2 0 0 1 -2 -2z"/><path d="M6 15v-1a2 2 0 0 1 2 -2h8a2 2 0 0 1 2 2v1"/><path d="M12 9l0 3"/></svg>',
  chevron: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M6 9l6 6l6 -6"/></svg>',
  x: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M18 6l-12 12"/><path d="M6 6l12 12"/></svg>',
  xBold: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3.5" stroke-linecap="round" stroke-linejoin="round"><path d="M18 6l-12 12"/><path d="M6 6l12 12"/></svg>',
  rotate: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M19.95 11a8 8 0 1 0 -.5 4m.5 5v-5h-5"/></svg>',
  corner: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M6 6v6a3 3 0 0 0 3 3h10l-4 -4m0 8l4 -4"/></svg>',
  alert: '<svg viewBox="0 0 24 24" fill="currentColor"><path d="M12 1.67c.955 0 1.845 .467 2.39 1.247l.105 .16l8.114 13.548a2.914 2.914 0 0 1 -2.307 4.363l-.195 .008h-16.225a2.914 2.914 0 0 1 -2.582 -4.2l.099 -.185l8.11 -13.538a2.914 2.914 0 0 1 2.491 -1.403zm.01 13.33l-.127 .007a1 1 0 0 0 0 1.986l.117 .007l.127 -.007a1 1 0 0 0 0 -1.986l-.117 -.007zm-.01 -7a1 1 0 0 0 -.993 .883l-.007 .117v4l.007 .117a1 1 0 0 0 1.986 0l.007 -.117v-4l-.007 -.117a1 1 0 0 0 -.993 -.883z"/></svg>',
  spinner: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round"><path d="M12 3a9 9 0 1 0 9 9" /></svg>',
};

// Play ⇄ pause is one SVG whose two path `d`s morph (CSS `d` transition, 200ms quint).
const PP = {
  play: ['M 7.5 4.5 L 13 8.25 L 13 15.75 L 7.5 19.5 Z', 'M 13 8.25 L 18.5 12 L 18.5 12 L 13 15.75 Z'],
  pause: ['M 6.5 5 L 9.5 5 L 9.5 19 L 6.5 19 Z', 'M 14.5 5 L 17.5 5 L 17.5 19 L 14.5 19 Z'],
};

const IS_MAC = typeof navigator !== 'undefined' && /Mac|iPhone|iPad/.test(navigator.platform || navigator.userAgent);

export const DEFAULTS = {
  spans: [],
  icons: {},                 // name → svg string; a span's `icon` may also be raw svg
  title: 'Trace',
  theme: 'system',           // 'light' | 'dark' | 'system'
  tokens: {},                // CSS variable overrides, e.g. { '--tw-card': '#111' }

  // playback
  autoplay: true,
  loop: false,
  loopDelay: 1200,           // ms to hold the finished trace before looping
  speed: 1,
  speeds: [0.5, 1, 1.5, 2, 4],
  timeScale: 2.6,            // trace seconds per real second at 1x (measured on the original)
  startAt: 0,
  clock: 'replay',           // 'replay' (play/pause/speed) | 'live' (wall clock) | 'controlled' (you call setNow)
  controlled: false,         // legacy alias for clock: 'controlled'
  startedAt: null,           // live clock origin (epoch ms, Date or ISO). Defaults to the earliest span start

  // data input
  timeUnit: 's',             // unit of numeric start/end: 's' | 'ms' | 'us' | 'ns'. Dates and ISO strings also work
  origin: 'auto',            // 'auto' → absolute times are rebased so the trace starts at 0; or a number (same unit)
  mapSpan: null,             // (raw, index) => Span. Adapt any shape (see adapters.js for OpenTelemetry)
  validate: true,            // console.warn on duplicate ids, unknown parents, end < start

  // render hooks
  colorFor: null,            // (span) => CSS color | null. Default: own color, else inherited from the parent lane
  renderIcon: null,          // (span) => Node | svg string | null
  figure: null,              // (span, ctx) => string shown after the bar
  renderDetails: null,       // (span, ctx) => [[label, value], …] | Node, appended to the popover card

  // time axis
  domain: {
    min: 9,                  // seconds shown before the run outgrows it
    headroom: 1.55,          // visible window = now × headroom while live
    maxTicks: 5.2,           // pick the smallest "nice" step with ≤ this many ticks
    steps: [0.1, 0.2, 0.5, 1, 2, 5, 10, 15, 20, 30, 60, 120, 300, 600, 900, 1800, 3600],
  },
  zoom: { enabled: true, wheelFactor: 0.0024, minDomain: 0.5 },

  // geometry (px)
  layout: {
    rowHeight: 36, laneBarHeight: 20, stepBarHeight: 16, laneBarRadius: 6, stepBarRadius: 5,
    indent: 20, baseIndent: 10, leafOffset: 6, maxHeight: 448, minLabel: 140, labelWidth: null,
    popoverWidth: 320, popoverGap: 4, radius: 14,
  },

  // bar colors: percent of the agent color mixed into the card color
  mix: { model: 100, tool: 50, gap: 24, neutral: 0.45, hatch: 22, glow: 45, hatchGap: 6 },

  features: {
    header: true, search: true, shortcut: true, stats: true, axis: true, gridlines: true, nowLine: true,
    nowLineIdle: false, handoffs: true, slowest: true, stickyLanes: true, popover: true, collapse: true,
    resize: true, figures: true, controls: true, speedSelect: true, legend: true, follow: true,
    numberMorph: true, treeGuides: true, hoverRows: true, statusIcons: true, failShake: true,
  },
  stats: ['duration', 'cost', 'tokens', 'llmCalls', 'toolCalls', 'errors'],
  collapsed: [],

  motion: {
    reduced: 'auto',         // 'auto' | true | false
    statThrottle: 700,       // ms between header number updates while live
  },

  labels: {
    search: 'Search', searchAria: 'Search steps', steps: 'Steps',
    duration: 'Duration', cost: 'Cost', tokens: 'Tokens', llmCalls: 'LLM calls', toolCalls: 'Tool calls', errors: 'Errors',
    started: 'Started', tokensIn: 'Tokens in', tokensOut: 'Tokens out', spans: 'Spans', input: 'Input', output: 'Output',
    running: 'Running', done: 'Done', failed: 'Failed', slowest: 'Slowest', close: 'Close',
    play: 'Play', pause: 'Pause', replay: 'Replay from the start', speed: 'Speed',
    emptyTitle: 'No matching steps', emptyText: (q) => `Nothing in this trace matches “${q}”`,
    legendModel: 'Model call', legendTool: 'Tool call', legendWaiting: 'Waiting', legendHandoff: 'Handoff', legendFailed: 'Failed',
    collapse: (n) => `Collapse ${n}`, expand: (n) => `Expand ${n}`, details: (n) => `Details for ${n}`, resize: 'Resize the span column',
    shortcut: IS_MAC ? '⌘F' : 'Ctrl F',
  },

  format: {
    duration: (s) => (s < 10 ? `${Math.max(0, s).toFixed(1)}s` : s < 600 ? `${Math.round(s)}s` : `${Math.floor(s / 60)}m ${Math.round(s % 60)}s`),
    cost: (c) => (c > 0 && c < 0.01 ? `$${c.toFixed(3)}` : `$${(c || 0).toFixed(2)}`),
    tokens: (n) => (n < 1000 ? String(Math.round(n)) : `${(n / 1000).toFixed(1)}k`),
    tick: (v) => `${+v.toFixed(2)}s`,
    started: null,           // defaults to '+' + duration
    speed: (x) => `${x}x`,
  },

  // events (also available as tw.on('open', fn) etc.)
  onOpen: null, onClose: null, onNow: null, onPlayChange: null, onToggle: null, onSearch: null, onSpanClick: null, onComplete: null,
};

const UNIT = { s: 1, ms: 1e3, us: 1e6, ns: 1e9 };

/* ------------------------------------------------------------------ utils */
const isObj = (v) => v && typeof v === 'object' && !Array.isArray(v) && !(v instanceof Node);
function merge(base, over) {
  const out = { ...base };
  for (const k of Object.keys(over || {})) out[k] = isObj(base[k]) && isObj(over[k]) ? merge(base[k], over[k]) : over[k];
  return out;
}
function el(tag, cls, attrs) {
  const n = document.createElement(tag);
  if (cls) n.className = cls;
  if (attrs) for (const [k, v] of Object.entries(attrs)) if (v != null && v !== false) n.setAttribute(k, v === true ? '' : v);
  return n;
}
function svgEl(tag, attrs) {
  const n = document.createElementNS(SVG_NS, tag);
  for (const [k, v] of Object.entries(attrs || {})) n.setAttribute(k, v);
  return n;
}
function html(str) { const t = document.createElement('template'); t.innerHTML = str.trim(); return t.content.firstElementChild; }
const clamp = (v, a, b) => Math.min(b, Math.max(a, v));
const setAttr = (n, k, on) => (on ? n.setAttribute(k, '') : n.removeAttribute(k));
// Next-paint helper for enter transitions: double rAF, with a timer fallback that
// forces a style flush first so the "from" state is committed either way.
const raf2 = (fn) => {
  let done = false;
  const go = () => { if (done) return; done = true; void document.body.offsetHeight; fn(); };
  requestAnimationFrame(() => requestAnimationFrame(go));
  setTimeout(go, 60);
};
const pos = (t) => `((${t} - var(--ts)) / var(--td) * 100%)`;

function highlight(node, text, q) {
  node.textContent = '';
  if (!q) { node.textContent = text; return; }
  const lo = text.toLowerCase();
  let i = 0;
  for (;;) {
    const j = lo.indexOf(q, i);
    if (j < 0) { node.append(text.slice(i)); break; }
    node.append(text.slice(i, j));
    const m = document.createElement('mark');
    m.textContent = text.slice(j, j + q.length);
    node.append(m);
    i = j + q.length;
  }
}

/* --------------------------------------------- text morph (odometer-ish) */
class Morph {
  constructor(node, enabled) { this.node = node; this.enabled = enabled; this.text = null; node.classList.add('tw-morph'); }
  set(text, num) {
    text = String(text);
    if (text === this.text) return;
    const prev = this.text, prevNum = this.num;
    this.text = text; this.num = num;
    if (!this.enabled || prev == null || document.hidden) { this.render(text); return; }
    const dir = num != null && prevNum != null ? (num >= prevNum ? 1 : -1) : 1;
    const w0 = this.node.getBoundingClientRect().width;
    const old = [...prev], next = [...text];
    // align from the right so units/decimals keep their slot
    const pad = Math.max(old.length, next.length);
    const a = Array(pad - old.length).fill('').concat(old);
    const b = Array(pad - next.length).fill('').concat(next);
    this.node.textContent = '';
    this.node.append(el('span', 'tw-sr'));
    this.node.firstChild.textContent = text;
    for (let i = 0; i < pad; i++) {
      if (!b[i] && !a[i]) continue;
      const slot = el('span', 'tw-morph-ch', { 'aria-hidden': 'true' });
      if (a[i] === b[i]) { slot.textContent = b[i]; this.node.append(slot); continue; }
      slot.classList.add('is-anim');
      const inn = el('span', 'tw-morph-in'); inn.textContent = b[i] || '';
      inn.style.cssText = `translate:0 ${0.9 * dir}em;opacity:0;filter:blur(1px)`;
      slot.append(inn);
      if (a[i]) {
        const out = el('span', 'tw-morph-out'); out.textContent = a[i];
        slot.append(out);
        raf2(() => { out.style.cssText = `translate:0 ${-0.9 * dir}em;opacity:0;filter:blur(1px)`; });
      }
      raf2(() => { inn.style.cssText = ''; });
      this.node.append(slot);
    }
    const w1 = this.node.scrollWidth;
    this.node.style.width = `${w0}px`;
    raf2(() => { this.node.style.width = `${w1}px`; });
    clearTimeout(this.t);
    this.t = setTimeout(() => this.render(this.text), 420);
  }
  render(text) {
    this.node.style.width = '';
    this.node.textContent = '';
    for (const ch of text) { const s = el('span', 'tw-morph-ch'); s.textContent = ch; this.node.append(s); }
  }
}

/* =================================================================== main */
export class TraceWaterfall {
  constructor(target, options = {}) {
    this.target = target;
    this.o = merge(DEFAULTS, options);
    this._listeners = new Map();
    this._state = { now: null, playing: false };
    this._mount();
  }

  /* ------------------------------------------------------------ public */
  get clock() { return this.o.controlled ? 'controlled' : this.o.clock; }
  play() {
    if (this.clock !== 'replay') return;
    if (this.now >= this.end - 1e-6) this.seek(0);
    this.playing = true; this._last = null; this._syncPlay();
  }
  pause() { if (!this.playing) return; this.playing = false; this._syncPlay(); }
  toggle() { this.playing ? this.pause() : this.play(); }
  replay() {
    if (this.clock !== 'replay') return;
    this.seek(0); this.playing = true; this._last = null; this._syncPlay(); this._pinBottom = true; this.viewport.scrollTop = 0;
  }
  seek(t) { this._setNow(clamp(t, 0, this.end)); }
  setNow(t) { this._setNow(Math.max(0, t)); }
  setSpeed(x) { this.o.speed = +x; if (this.speedSel) this.speedSel.value = String(x); }
  /** Replace the data. Rows that already exist keep their DOM, scroll and popover (no full re-render). */
  setSpans(spans) { this.o.spans = spans; this._patch(); }
  /** Add or update spans by id; ideal for streaming a live trace. */
  upsertSpans(spans) {
    const list = Array.isArray(spans) ? spans : [spans];
    const map = new Map(this.o.spans.map((s, i) => [this._idOf(s, i), s]));
    list.forEach((s, i) => map.set(this._idOf(s, i), { ...(map.get(this._idOf(s, i)) || {}), ...s }));
    this.o.spans = [...map.values()];
    this._patch();
  }
  removeSpans(ids) {
    const kill = new Set(Array.isArray(ids) ? ids : [ids]);
    this.o.spans = this.o.spans.filter((s, i) => !kill.has(this._idOf(s, i)));
    this._patch();
  }
  getSpan(id) { return this.byId.get(id) || null; }
  /** Subscribe: 'open' | 'close' | 'now' | 'playchange' | 'toggle' | 'search' | 'spanclick' | 'complete'. Returns unsubscribe. */
  on(name, fn) {
    const k = name.toLowerCase();
    if (!this._listeners.has(k)) this._listeners.set(k, new Set());
    this._listeners.get(k).add(fn);
    return () => this._listeners.get(k)?.delete(fn);
  }
  _emit(name, ...args) {
    const cb = this.o['on' + name];
    if (typeof cb === 'function') cb(...args);
    this._listeners.get(name.toLowerCase())?.forEach((fn) => fn(...args));
  }
  _idOf(s, i) { return this.o.mapSpan ? this.o.mapSpan(s, i).id : s.id; }
  setTheme(theme) { this.o.theme = theme; this._applyTheme(); }
  setQuery(q) { this.input && (this.input.value = q); this._search(q); }
  resetZoom() { this.zoomed = false; this._view(); }
  update(options) {
    const keep = { now: this.now, playing: this.playing, query: this.query, collapsed: [...this.collapsed], label: this.labelPx };
    this.destroy();
    this.o = merge(this.o, options);
    if (options.collapsed == null) this.o.collapsed = keep.collapsed;
    this._state = keep;
    this._mount();
  }
  destroy() {
    cancelAnimationFrame(this._raf);
    clearInterval(this._watch);
    this._ac?.abort();
    this._ro?.disconnect();
    this._mq?.removeEventListener?.('change', this._onScheme); this._mq = null;
    this._closePopover(true);
    this.portal?.remove();
    this.root?.remove();
  }

  /* ------------------------------------------------------------ build */
  _mount() {
    const o = this.o;
    this._ac = new AbortController();
    this._normalize(o.spans);
    const st = this._state;
    const replay = this.clock === 'replay';
    this.now = st.now != null ? Math.min(st.now, this.end) : (replay && o.autoplay ? o.startAt : this.clock === 'live' ? this._liveNow() : this.end);
    if (!isFinite(this.now)) this.now = 0;
    this.playing = replay && (st.now != null ? st.playing : o.autoplay);
    this.collapsed = new Set(st.collapsed || o.collapsed);
    this.query = st.query || '';
    this.labelPx = st.label ?? o.layout.labelWidth;
    this.zoomed = false; this.vStart = 0; this.vDomain = o.domain.min; this.whole = o.domain.min;
    this._pinBottom = true;
    this._ticks = new Map();
    this._eventIdx = -1;
    this._lastStat = 0;

    this.root = el('div', 'tw', { 'data-slot': 'trace-waterfall' });
    this.portal = el('div', 'tw-portal');
    this._applyTokens();
    this._applyTheme();
    this._applyReduced();

    if (o.features.header) this.root.append(this._buildHeader());
    if (o.features.stats && o.stats.length) this.root.append(this._buildStats());
    this.root.append(this._buildBody());
    if (o.features.controls || o.features.legend) this.root.append(this._buildFooter());
    this.target.append(this.root);
    document.body.append(this.portal);

    this._bindGlobal();
    this._ro = new ResizeObserver(() => { this._measure(); this._view(true); });
    this._ro.observe(this.root);
    this._measure();
    this._sync(true);
    this._view(true);
    this._updateStats(true);
    if (this.query) this._search(this.query);
    this._syncPlay();
    // rAF drives frames; a slow timer keeps the clock honest where rAF is paused
    // (embedded/hidden webviews), so playback time never stalls.
    let lastRaf = 0;
    const loop = (ts) => { lastRaf = performance.now(); this._frame(ts); this._raf = requestAnimationFrame(loop); };
    this._raf = requestAnimationFrame(loop);
    this._watch = setInterval(() => { if (performance.now() - lastRaf > 200) this._frame(performance.now()); }, 100);
  }

  _applyTokens() {
    const l = this.o.layout, t = { ...this.o.tokens };
    const geo = {
      '--tw-row-h': `${l.rowHeight}px`, '--tw-lane-bar-h': `${l.laneBarHeight}px`, '--tw-step-bar-h': `${l.stepBarHeight}px`,
      '--tw-lane-bar-r': `${l.laneBarRadius}px`, '--tw-step-bar-r': `${l.stepBarRadius}px`, '--tw-max-h': `${l.maxHeight}px`,
      '--tw-popover-w': `${l.popoverWidth}px`, '--tw-radius': `${l.radius}px`,
    };
    for (const node of [this.root, this.portal]) {
      for (const [k, v] of Object.entries({ ...geo, ...t })) node.style.setProperty(k, v);
    }
  }
  _applyTheme() {
    const set = () => {
      const dark = this.o.theme === 'dark' || (this.o.theme === 'system' && this._mq.matches);
      this.root.dataset.theme = this.portal.dataset.theme = dark ? 'dark' : 'light';
    };
    if (!this._mq) { this._mq = matchMedia('(prefers-color-scheme: dark)'); this._onScheme = set; this._mq.addEventListener('change', set); }
    set();
  }
  _applyReduced() {
    const r = this.o.motion.reduced;
    const on = r === 'auto' ? matchMedia('(prefers-reduced-motion: reduce)').matches : !!r;
    this.reduced = on;
    setAttr(this.root, 'data-reduced', on); setAttr(this.portal, 'data-reduced', on);
  }

  // Absolute instants → seconds since epoch; plain numbers → seconds in `timeUnit`.
  _toSec(v) {
    if (v == null || v === '') return null;
    if (v instanceof Date) return v.getTime() / 1000;
    if (typeof v === 'string' && isNaN(+v)) { const t = Date.parse(v); return isNaN(t) ? null : t / 1000; }
    if (typeof v === 'bigint') return Number(v) / UNIT[this.o.timeUnit];
    return +v / (UNIT[this.o.timeUnit] || 1);
  }
  _liveNow() { return Math.max(0, Date.now() / 1000 - (this._liveOrigin ?? Date.now() / 1000)); }

  _normalize(input = []) {
    const o = this.o, warn = (...a) => o.validate && console.warn('[TraceWaterfall]', ...a);
    const raw = input.map((r, i) => (o.mapSpan ? o.mapSpan(r, i) : r)).filter(Boolean);
    const spans = raw.map((r) => ({ ...r, raw: r, id: r.id != null ? String(r.id) : r.id, parentId: r.parentId != null ? String(r.parentId) : null, start: this._toSec(r.start), end: this._toSec(r.end), children: [] }));
    // rebase absolute timestamps so the trace starts at 0
    const starts = spans.map((s) => s.start).filter((t) => t != null);
    const min = starts.length ? Math.min(...starts) : 0;
    const origin = o.origin === 'auto' ? (min > 1e6 ? min : 0) : this._toSec(o.origin) || 0;
    for (const s of spans) {
      if (s.start == null) { warn(`span "${s.id}" has no start; using 0`); s.start = origin; }
      s.start -= origin; if (s.end != null) s.end -= origin;
      if (s.end != null && s.end < s.start) { warn(`span "${s.id}" ends before it starts`); s.end = s.start; }
    }
    this.origin = origin;
    // live clock origin: explicit startedAt (epoch ms / Date / ISO), else the first span's absolute start, else mount time
    const startedAt = o.startedAt == null ? null : typeof o.startedAt === 'number' ? o.startedAt / 1000 : new Date(o.startedAt).getTime() / 1000;
    if (this._liveOrigin == null || o.startedAt != null) this._liveOrigin = startedAt ?? (origin > 0 ? origin : Date.now() / 1000);

    const byId = new Map();
    for (const s of spans) {
      if (s.id == null) { warn('span without id skipped', s.raw); continue; }
      if (byId.has(s.id)) warn(`duplicate span id "${s.id}"; the last one wins`);
      byId.set(s.id, s);
    }
    const roots = [];
    for (const s of byId.values()) {
      let p = s.parentId != null ? byId.get(s.parentId) : null;
      if (s.parentId != null && !p) warn(`span "${s.id}" points to unknown parent "${s.parentId}"; shown as a root`);
      for (let q = p; q; q = q.parentId != null ? byId.get(q.parentId) : null) if (q === s) { warn(`cycle at "${s.id}"`); p = null; break; }
      s.parent = p || null;
      (p ? p.children : roots).push(s);
    }
    const sortRec = (list, depth) => {
      list.sort((a, b) => a.start - b.start);
      for (const s of list) { s.depth = depth; sortRec(s.children, depth + 1); }
    };
    sortRec(roots, 0);
    const order = [];
    const walk = (list) => { for (const s of list) { order.push(s); walk(s.children); } };
    walk(roots);
    for (const s of order) {
      s.kind = s.kind || (s.children.length ? 'agent' : 'tool');
      s.isLane = s.children.length > 0 || s.kind === 'agent';
      s.failed = s.status === 'error' || s.status === 'failed';
    }
    // aggregate cost/tokens/spans upward
    const agg = (s) => {
      if (!s.isLane) return { cost: s.cost || 0, tin: s.tokensIn || 0, tout: s.tokensOut || 0, n: 0 };
      const a = { cost: s.cost || 0, tin: 0, tout: 0, n: 0 };
      for (const c of s.children) { const r = agg(c); a.cost += r.cost; a.tin += r.tin; a.tout += r.tout; a.n += 1 + r.n; }
      s.agg = a;
      return a;
    };
    roots.forEach(agg);
    this.spans = order; this.roots = roots; this.byId = byId;
    this.leaves = order.filter((s) => !s.isLane);
    const ends = order.map((s) => (s.end == null ? Infinity : s.end));
    this.end = ends.length ? Math.max(...ends) : 0;
    if (!isFinite(this.end)) this.end = Infinity;
    // lane segments + event times (anything that changes discrete state)
    const ev = new Set();
    for (const s of order) {
      ev.add(s.start); if (s.end != null) ev.add(s.end);
      s.segments = s.isLane ? this._segments(s) : [{ start: s.start, end: s.end, type: s.failed ? 'error' : s.kind === 'model' ? 'model' : 'tool', span: s }];
      for (const g of s.segments) { ev.add(g.start); if (g.end != null) ev.add(g.end); }
    }
    this.events = [...ev].filter(isFinite).sort((a, b) => a - b);
  }

  // A lane's bar is split into: leaf children (model/tool/error), "waiting" while a child
  // agent runs (hatched), and "gap" (thinking) everywhere else — split at every boundary.
  _segments(lane) {
    const end = lane.end == null ? Infinity : lane.end;
    const b = new Set([lane.start, end]);
    for (const c of lane.children) { b.add(c.start); b.add(c.end == null ? Infinity : c.end); }
    const pts = [...b].filter((t) => t >= lane.start && t <= end).sort((x, y) => x - y);
    const segs = [];
    for (let i = 0; i < pts.length - 1; i++) {
      const a = pts[i], z = pts[i + 1], mid = isFinite(z) ? (a + z) / 2 : a + 1e-6;
      const covers = (c) => c.start <= mid && (c.end == null || c.end >= mid);
      const leaf = lane.children.find((c) => !c.isLane && covers(c));
      const sub = lane.children.find((c) => c.isLane && covers(c));
      const type = leaf ? (leaf.failed ? 'error' : leaf.kind === 'model' ? 'model' : 'tool') : sub ? 'wait' : 'gap';
      segs.push({ start: a, end: isFinite(z) ? z : null, type, span: leaf || null, lane: true });
    }
    return segs;
  }

  _fill(type, color) {
    const m = this.o.mix;
    const neutral = !color;
    const c = color || 'var(--tw-foreground)';
    const k = neutral ? m.neutral : 1;
    if (type === 'wait') {
      const line = `color-mix(in oklab, var(--tw-foreground) ${m.hatch}%, transparent)`;
      return {
        background: `repeating-linear-gradient(-45deg, ${line} 0 1px, transparent 1px ${m.hatchGap}px)`,
        boxShadow: `inset 0 0 0 1px ${line}`,
        glow: `color-mix(in oklab, var(--tw-foreground) 30%, transparent)`,
      };
    }
    const bg = type === 'error' ? 'var(--tw-destructive)' : `color-mix(in oklab, ${c} ${+(m[type] * k).toFixed(2)}%, var(--tw-card))`;
    return { background: bg, boxShadow: '', glow: `color-mix(in oklab, ${bg} ${m.glow}%, white)` };
  }
  _paint(node, type, color) {
    const f = this._fill(type, color);
    node.style.background = f.background;
    node.style.boxShadow = f.boxShadow;
    node.style.setProperty('--tw-glow', f.glow);
  }
  _icon(span) {
    let v = this.o.renderIcon ? this.o.renderIcon(span) : span.icon;
    if (v == null || v === false) return null;
    if (v instanceof Node) return v.cloneNode(true);
    v = String(v);
    const src = v.trim().startsWith('<') ? v : this.o.icons[v];
    return src ? html(src) : null;
  }
  _laneColor(s) {
    if (this.o.colorFor) { const c = this.o.colorFor(s); if (c !== undefined) return c; }
    for (let p = s; p; p = p.parent) if (p.color) return p.color;
    return null;
  }

  _buildHeader() {
    const o = this.o, L = o.labels;
    const head = el('div', 'tw-head');
    const title = el('span', 'tw-title'); title.textContent = o.title;
    head.append(title);
    if (o.features.search) {
      const label = el('label', 'tw-search');
      label.append(html(UI.search));
      this.input = el('input', '', { type: 'search', 'aria-label': L.searchAria, placeholder: L.search, spellcheck: 'false', autocomplete: 'off' });
      this.input.value = this.query;
      this.input.addEventListener('input', () => this._search(this.input.value));
      this.input.addEventListener('keydown', (e) => { if (e.key === 'Escape') { e.preventDefault(); if (this.input.value) this.setQuery(''); else this.input.blur(); } });
      label.append(this.input);
      if (o.features.shortcut) { const k = el('kbd', 'tw-kbd', { 'aria-hidden': 'true' }); k.textContent = L.shortcut; label.append(k); }
      head.append(label);
    }
    return head;
  }

  _buildStats() {
    const dl = el('dl', 'tw-stats');
    dl.style.setProperty('--tw-stat-count', this.o.stats.length);
    this.statEls = {};
    this.statDefs = {};
    for (const def of this.o.stats) {
      const key = typeof def === 'string' ? def : def.key;
      if (typeof def === 'object') this.statDefs[key] = def;
      const d = el('div', 'tw-stat');
      const dt = el('dt'); dt.textContent = (typeof def === 'object' && def.label) || this.o.labels[key] || key;
      const dd = el('dd', '', { dir: 'ltr' });
      const span = el('span'); dd.append(span);
      d.append(dt, dd); dl.append(d);
      this.statEls[key] = new Morph(span, this.o.features.numberMorph);
    }
    return dl;
  }

  _buildBody() {
    const o = this.o, f = o.features, L = o.labels;
    const body = this.body = el('div', 'tw-body');

    this.gridLayer = el('div', 'tw-layer tw-grid', { 'aria-hidden': 'true' });
    const gl = el('div', 'tw-layer-clip'); this.gridLayer.append(gl); this.gridClip = gl;
    if (!f.gridlines) this.gridLayer.style.borderInlineStartColor = 'transparent';
    body.append(this.gridLayer);

    this.nowLayer = el('div', 'tw-layer tw-nowlayer', { 'aria-hidden': 'true' });
    const nl = el('div', 'tw-layer-clip');
    this.nowEl = el('span', 'tw-now', { 'data-hide-idle': f.nowLineIdle ? null : '' });
    this.nowEl.style.left = `calc(${pos('var(--tn)')})`;
    this.nowEl.append(el('span', 'tw-now-dot'));
    nl.append(this.nowEl); this.nowLayer.append(nl);
    if (f.nowLine) body.append(this.nowLayer);

    if (f.axis) {
      const wrap = el('div', 'tw-axis-wrap'), inner = el('div'), axis = el('div', 'tw-axis');
      const lab = el('span', 'tw-axis-label', { 'data-slot': 'trace-waterfall-label' });
      lab.append(html(UI.sitemap), document.createTextNode(L.steps));
      this.tickBox = el('span', 'tw-ticks', { dir: 'ltr' });
      axis.append(lab, this.tickBox); inner.append(axis); wrap.append(inner); body.append(wrap);
      this.axis = axis;
      axis.addEventListener('dblclick', () => this.resetZoom(), { signal: this._ac.signal });
    }

    const scroll = el('div', 'tw-scroll', { 'data-slot': 'trace-waterfall-scroll-area' });
    this.viewport = el('div', 'tw-viewport', { tabindex: '0' });
    this.content = el('div', 'tw-content');
    // explicit 0×0 so the default 150px SVG box never creates phantom scroll overflow
    this.svg = svgEl('svg', { class: 'tw-handoffs', 'aria-hidden': 'true', width: '0', height: '0' });
    this.content.append(this.svg);
    this.tree = el('ul', 'tw-tree');
    this.rows = new Map();
    for (const s of this.spans) this._buildRow(s);
    this._placeTree();
    this._ticksDirty = false;
    this.content.append(this.tree);

    const ew = el('div', 'tw-empty-wrap', { inert: '' }), ei = el('div');
    const empty = el('div', 'tw-empty', { role: 'status' });
    const ic = el('span', 'tw-empty-icon'); ic.append(html(UI.searchOff));
    const et = el('span', 'tw-empty-title'); et.textContent = L.emptyTitle;
    this.emptyText = el('span', 'tw-empty-text', { dir: 'auto' });
    empty.append(ic, et, this.emptyText); ei.append(empty); ew.append(ei);
    this.content.append(ew);
    this.emptyWrap = ew;

    this.viewport.append(this.content);
    this.vbar = el('div', 'tw-vbar', { 'data-slot': 'trace-waterfall-scrollbar' });
    this.vthumb = el('div', 'tw-vthumb');
    this.vbar.append(this.vthumb);
    scroll.append(this.viewport, this.vbar);
    body.append(scroll);
    this.scroll = scroll;

    this.hbar = el('div', 'tw-hbar', { 'aria-hidden': 'true' });
    const ht = el('div', 'tw-hbar-track', { dir: 'ltr' });
    this.hthumb = el('div', 'tw-hthumb', { 'data-slot': 'trace-waterfall-thumb' });
    this.hthumb.style.left = 'calc(var(--ts) / var(--tw-whole) * 100%)';
    this.hthumb.style.width = 'calc(var(--td) / var(--tw-whole) * 100%)';
    ht.append(this.hthumb); this.hbar.append(ht); body.append(this.hbar);

    if (f.resize) {
      this.resizer = el('div', 'tw-resizer', { role: 'separator', 'aria-orientation': 'vertical', 'aria-label': L.resize, tabindex: '0' });
      body.append(this.resizer);
    }
    if (this.labelPx) body.style.setProperty('--tw-label-user', `${this.labelPx}px`);
    this._bindBody();
    return body;
  }

  // Row = shell (li + sticky row + timeline) + label + track. Label and track are rebuilt
  // independently by _patch() so streaming updates never re-create untouched rows.
  _buildRow(s) {
    const li = el('li', 'tw-li');
    li.hidden = true;
    const inner = el('div', 'tw-li-in');
    const row = el('div', 'tw-row', { 'data-slot': 'trace-row', 'data-trace-id': s.id });
    if (!this.o.features.hoverRows) row.classList.add('tw-nohover');
    const timeline = el('div', 'tw-timeline', { 'data-slot': 'trace-timeline' });
    const track = el('div', 'tw-track');
    timeline.append(track);
    row.append(timeline);
    inner.append(row);
    li.append(inner);
    const r = { s, li, inner, row, timeline, track, rowGrid: null, label: null, kids: null, kidsUl: null, bars: [], st: {} };
    this.rows.set(s.id, r);
    this._buildLabel(r);
    this._buildTrack(r);
    return r;
  }

  _shapeKey(s) { return `${s.isLane}|${s.children.length > 0}|${s.depth}|${s.parent?.id ?? ''}`; }

  _buildLabel(r) {
    const s = r.s, o = this.o, f = o.features, L = o.labels, lay = o.layout;
    const hasKids = s.children.length > 0;
    r.shape = this._shapeKey(s);
    setAttr(r.row, 'data-parent', hasKids);
    // sticky lanes carry their own gridlines (they paint over the shared layer while stuck)
    const sticky = f.stickyLanes && hasKids;
    setAttr(r.row, 'data-sticky', sticky);
    r.row.style.top = sticky ? `${s.depth * lay.rowHeight}px` : '';
    r.row.style.zIndex = sticky ? 39 - s.depth : '';
    if (sticky && !r.rowGrid) {
      r.rowGrid = el('div', 'tw-layer tw-grid tw-row-grid', { 'aria-hidden': 'true' });
      const c = el('div', 'tw-layer-clip'); r.rowGrid.append(c); r.rowGrid.clip = c;
      if (!f.gridlines) r.rowGrid.style.borderInlineStartColor = 'transparent';
      r.row.prepend(r.rowGrid);
      this._ticksDirty = true;
    } else if (!sticky && r.rowGrid) { r.rowGrid.remove(); r.rowGrid = null; r.st.stuck = false; r.row.removeAttribute('data-stuck'); }

    const label = el('div', 'tw-label');
    const pad = lay.baseIndent + s.depth * lay.indent + (hasKids && f.collapse ? 0 : lay.leafOffset + (s.depth === 0 ? lay.indent : 0));
    label.style.paddingInlineStart = `${pad}px`;
    r.chevron = null;
    if (hasKids && f.collapse) {
      const c = this.collapsed.has(s.id);
      r.chevron = el('button', 'tw-chevron', { type: 'button', 'aria-expanded': String(!c), 'aria-label': (c ? L.expand : L.collapse)(s.name) });
      r.chevron.append(html(UI.chevron));
      r.chevron.addEventListener('click', (e) => { e.stopPropagation(); this._toggle(s.id); });
      label.append(r.chevron);
      label.addEventListener('click', () => this._toggle(s.id));
    }
    const iconBox = el('span', 'tw-icon', { 'aria-hidden': 'true' });
    const ic = this._icon(s); if (ic) iconBox.append(ic);
    label.append(iconBox);
    const names = el('span', 'tw-names');
    const status = el('span', 'tw-status');
    r.prefix = null;
    if (!s.isLane && f.statusIcons) {
      r.prefix = el('span', 'tw-prefix', { 'aria-hidden': 'true', 'data-state': r.st.prefix || null });
      const run = el('span', 'tw-p-run'); run.append(html(UI.spinner));
      const fail = el('span', 'tw-p-fail'); fail.append(html(UI.alert));
      r.prefix.append(run, fail);
      status.append(r.prefix);
    }
    setAttr(status, 'data-failed', r.st.prefix === 'failed');
    const name = el('span', 'tw-name', { dir: 'auto' });
    status.append(name);
    names.append(status);
    r.sub = null;
    if (s.subtitle) { r.sub = el('span', 'tw-sub', { dir: 'auto' }); names.append(r.sub); }
    label.append(names);
    r.status = status; r.name = name;
    r.st.q = null; // force highlight refresh
    if (r.label) r.label.replaceWith(label); else r.row.insertBefore(label, r.timeline);
    r.label = label;

    if (s.isLane && !r.kids) {
      r.kids = el('div', 'tw-kids');
      setAttr(r.kids, 'data-collapsed', this.collapsed.has(s.id));
      r.kidsUl = el('ul');
      if (f.treeGuides) {
        const guide = el('span', 'tw-guide', { 'aria-hidden': 'true' });
        guide.style.insetInlineStart = `${lay.baseIndent + 8 + s.depth * lay.indent}px`;
        r.kidsUl.append(guide);
      }
      r.kids.append(r.kidsUl);
      r.inner.append(r.kids);
    }
    if (r.kids) r.kids.hidden = !hasKids;
  }

  _trackKey(s) {
    return JSON.stringify([this._laneColor(s), s.segments.map((g) => [g.start, g.end, g.type, g.span?.id]), s.start, s.end, s.name]);
  }

  _buildTrack(r) {
    const s = r.s, f = this.o.features, L = this.o.labels;
    r.trackKey = this._trackKey(s);
    const track = r.track;
    track.textContent = '';
    const color = this._laneColor(s);
    r.bars = [];
    for (const g of s.segments) {
      const bar = el('span', 'tw-bar', { 'data-lane': s.isLane ? '' : null, 'data-type': g.type });
      bar.hidden = true;
      this._paint(bar, g.type, color);
      const item = { seg: g, bar, trig: null, wrap: null };
      if (s.isLane && g.span && f.popover) {
        const wrap = el('span', 'tw-step');
        const trig = el('button', 'tw-trig', { type: 'button', 'data-scope': 'step', 'data-span': g.span.id, 'aria-label': L.details(g.span.name), 'aria-haspopup': 'dialog' });
        const target = g.span.id;
        trig.addEventListener('click', (e) => this._openFrom(e, this.byId.get(target), trig));
        wrap.append(trig, bar);
        track.append(wrap);
        item.trig = trig; item.wrap = wrap;
      } else track.append(bar);
      r.bars.push(item);
    }
    r.laneTrig = null;
    if (f.popover) {
      r.laneTrig = el('button', 'tw-trig', { type: 'button', 'data-scope': 'lane', 'data-span': s.id, 'aria-label': L.details(s.name), 'aria-haspopup': 'dialog' });
      r.laneTrig.addEventListener('click', (e) => this._openFrom(e, this.byId.get(s.id), r.laneTrig));
      track.append(r.laneTrig);
    }
    r.fig = el('span', 'tw-fig');
    r.figText = el('span', 'tw-fig-text', { 'data-trace-figure': s.id });
    r.figText.textContent = r.st.fig || '';
    r.fig.append(r.figText);
    if (f.figures) track.append(r.fig);
    if (this._slowId === s.id) this._slowId = undefined;
  }

  // Put every row's <li> under its parent in start order, moving only what is out of place.
  _placeTree() {
    const place = (ul, list) => {
      let ref = ul.firstElementChild;
      const nextLi = (n) => { while (n && n.tagName !== 'LI') n = n.nextElementSibling; return n; };
      ref = nextLi(ref);
      for (const s of list) {
        const li = this.rows.get(s.id).li;
        if (li === ref) { ref = nextLi(ref.nextElementSibling); continue; }
        ul.insertBefore(li, ref);
      }
    };
    place(this.tree, this.roots);
    for (const s of this.spans) if (s.isLane) place(this.rows.get(s.id).kidsUl, s.children);
  }

  /* ------------------------------------------------------------ incremental data updates */
  _patch() {
    if (!this.rows) return;
    const pop = this.pop ? { id: this.pop.span.id, scope: this.pop.trig.dataset.scope, rowId: this.pop.rowId } : null;
    this._normalize(this.o.spans);
    const alive = new Set(this.spans.map((s) => s.id));
    // drop rows whose span disappeared or moved to another parent (their subtree is rebuilt)
    for (const [id, r] of [...this.rows]) {
      const s = this.byId.get(id);
      if (!alive.has(id) || (s && (s.parent?.id ?? null) !== (r.s.parent?.id ?? null))) {
        r.li.remove();
        this.rows.delete(id);
      }
    }
    for (const [id, r] of this.rows) if (!r.li.isConnected && !this._inTree(r.li)) this.rows.delete(id);
    for (const s of this.spans) {
      let r = this.rows.get(s.id);
      if (!r) { this._buildRow(s); continue; }
      const prev = r.s;
      r.s = s;
      if (r.shape !== this._shapeKey(s) || prev.name !== s.name || prev.subtitle !== s.subtitle || prev.icon !== s.icon || prev.kind !== s.kind) this._buildLabel(r);
      if (r.trackKey !== this._trackKey(s)) { r.st.figKey = null; this._buildTrack(r); }
    }
    this._placeTree();
    if (this._ticksDirty) this._resetTicks();
    this._eventIdx = -1;
    this._statsDone = false;
    this._sync();
    this._updateStats(true);
    this._view(true);
    // keep the popover attached to the (possibly re-created) trigger
    if (pop) {
      const span = this.byId.get(pop.id), r = this.rows.get(pop.rowId);
      const trig = r && (pop.scope === 'lane' ? r.laneTrig : r.track.querySelector(`.tw-trig[data-span="${CSS.escape(pop.id)}"]`));
      if (!span || !trig) this._closePopover(true);
      else { this.pop.span = span; this.pop.trig = trig; trig.setAttribute('data-open', ''); this._renderCard(span, true); }
    }
  }
  _inTree(li) { return this.tree.contains(li); }

  _resetTicks() {
    this._ticksDirty = false;
    for (const t of this._ticks.values()) t.nodes.forEach((n) => n.remove());
    this._ticks.clear();
    const ready = this._ticksReady;
    this._ticksReady = false;
    this._tickKey = null;
    this._renderTicks(true);
    this._ticksReady = ready;
  }

  _buildFooter() {
    const o = this.o, L = o.labels, f = o.features;
    const foot = el('div', 'tw-foot');
    if (f.controls && this.clock === 'replay') {
      this.ppBtn = el('button', 'tw-btn tw-btn-outline', { type: 'button', 'aria-label': L.play });
      const svg = svgEl('svg', { viewBox: '0 0 24 24', class: 'tw-pp', 'aria-hidden': 'true' });
      this.ppPaths = PP.play.map((d) => { const p = svgEl('path', { fill: 'currentColor', stroke: 'currentColor', 'stroke-width': '2.5', 'stroke-linejoin': 'round' }); p.style.d = `path("${d}")`; svg.append(p); return p; });
      this.ppBtn.append(svg);
      this.ppBtn.addEventListener('click', () => this.toggle());
      const rp = el('button', 'tw-btn tw-btn-ghost', { type: 'button', 'aria-label': L.replay, title: L.replay });
      const ri = el('span', 'tw-replay-icon', { 'data-slot': 'trace-replay-icon' }); ri.append(html(UI.rotate)); rp.append(ri);
      rp.addEventListener('click', () => this.replay());
      foot.append(this.ppBtn, rp);
      if (f.speedSelect) {
        const w = el('div', 'tw-select-wrap');
        this.speedSel = el('select', 'tw-select', { 'aria-label': L.speed });
        for (const x of o.speeds) { const op = el('option', '', { value: String(x) }); op.textContent = o.format.speed(x); this.speedSel.append(op); }
        this.speedSel.value = String(o.speed);
        this.speedSel.addEventListener('change', () => { this.o.speed = +this.speedSel.value; });
        w.append(this.speedSel, html(UI.chevron));
        foot.append(w);
      }
    }
    if (f.legend) {
      const ul = el('ul', 'tw-legend');
      const item = (swatch, text) => { const li = el('li'); const sp = el('span', 'tw-legend-icon', { 'aria-hidden': 'true' }); sp.append(swatch); li.append(sp, document.createTextNode(text)); ul.append(li); };
      const sw = (type) => { const s = el('span', 'tw-swatch'); this._paint(s, type, null); return s; };
      item(sw('model'), L.legendModel);
      item(sw('tool'), L.legendTool);
      item(sw('wait'), L.legendWaiting);
      const corner = html(UI.corner); corner.style.color = 'var(--tw-muted-foreground)';
      item(corner, L.legendHandoff);
      const fs = el('span', 'tw-swatch'); fs.style.background = 'var(--tw-destructive)'; fs.append(html(UI.xBold));
      item(fs, L.legendFailed);
      foot.append(ul);
    }
    return foot;
  }

  /* ------------------------------------------------------------ events */
  _bindGlobal() {
    const sig = { signal: this._ac.signal };
    this._hover = false;
    this.root.addEventListener('pointerenter', () => { this._hover = true; }, sig);
    this.root.addEventListener('pointerleave', () => { this._hover = false; }, sig);
    window.addEventListener('keydown', (e) => {
      if (!this.root.isConnected) return;
      const mod = IS_MAC ? e.metaKey : e.ctrlKey;
      const inside = this._hover || this.root.contains(document.activeElement);
      if (mod && e.key.toLowerCase() === 'f' && this.input && this.o.features.shortcut && inside) {
        e.preventDefault(); this.input.focus(); this.input.select();
      } else if (e.key === ' ' && this.root.contains(document.activeElement) && !/INPUT|SELECT|BUTTON/.test(document.activeElement.tagName)) {
        e.preventDefault(); this.toggle();
      }
    }, sig);
    document.addEventListener('pointerdown', (e) => {
      if (!this.pop) return;
      if (this.pop.pos.contains(e.target) || e.target.closest?.('.tw-trig')) return;
      this._closePopover();
    }, sig);
    document.addEventListener('visibilitychange', () => { this._last = null; }, sig);
  }

  _bindBody() {
    const sig = { signal: this._ac.signal };
    const vp = this.viewport;
    // scroll: custom scrollbar + follow-the-latest pinning
    let scrollT;
    vp.addEventListener('scroll', () => {
      this.vbar.setAttribute('data-active', '');
      clearTimeout(scrollT);
      scrollT = setTimeout(() => { if (!this._vbarHover) this.vbar.removeAttribute('data-active'); }, 600);
      if (!this._autoScrolling) this._pinBottom = vp.scrollTop + vp.clientHeight >= vp.scrollHeight - 4;
      this._autoScrolling = false;
    }, sig);
    this.scroll.addEventListener('pointerenter', () => { this._vbarHover = true; this.vbar.setAttribute('data-active', ''); }, sig);
    this.scroll.addEventListener('pointerleave', () => { this._vbarHover = false; this.vbar.removeAttribute('data-active'); }, sig);
    this._drag(this.vthumb, (dx, dy, s0) => {
      const r = vp.scrollHeight - vp.clientHeight, track = vp.clientHeight - this.vthumb.offsetHeight;
      vp.scrollTop = s0 + (dy / Math.max(1, track)) * r;
    }, () => vp.scrollTop);

    // zoom / pan on the timeline
    this.body.addEventListener('wheel', (e) => {
      if (!this.o.zoom.enabled) return;
      const tl = this._tlRect();
      if (!tl || e.clientX < tl.left) return;
      const zoom = e.ctrlKey || e.metaKey;
      const panX = e.shiftKey ? e.deltaY : e.deltaX;
      if (!zoom && Math.abs(panX) < 0.5) return;
      if (!zoom && !this.zoomed) return;
      e.preventDefault();
      if (!this.zoomed) { this.zoomed = true; }
      if (zoom) {
        const frac = clamp((e.clientX - tl.left) / tl.width, 0, 1);
        const at = this.vStart + frac * this.vDomain;
        const d = clamp(this.vDomain * Math.exp(e.deltaY * this.o.zoom.wheelFactor), this.o.zoom.minDomain, this.whole);
        this.vDomain = d;
        this.vStart = at - frac * d;
      } else {
        this.vStart += (panX / tl.width) * this.vDomain;
      }
      if (this.vDomain >= this.whole - 1e-6) this.zoomed = false;
      this._view();
    }, { passive: false, signal: this._ac.signal });

    this._drag(this.hthumb, (dx, dy, s0) => {
      const w = this.hthumb.parentElement.clientWidth;
      this.vStart = s0 + (dx / w) * this.whole; this._view();
    }, () => this.vStart);

    if (this.resizer) {
      this._drag(this.resizer, (dx, dy, w0) => this._setLabel(w0 + (this._rtl ? -dx : dx)), () => this._labelW, (on) => setAttr(this.resizer, 'data-dragging', on));
      this.resizer.addEventListener('keydown', (e) => {
        const step = e.shiftKey ? 48 : 16;
        if (e.key === 'ArrowLeft') { e.preventDefault(); this._setLabel(this._labelW - step); }
        if (e.key === 'ArrowRight') { e.preventDefault(); this._setLabel(this._labelW + step); }
        if (e.key === 'Home' || e.key === 'Escape') { e.preventDefault(); this._setLabel(null); }
      }, sig);
      this.resizer.addEventListener('dblclick', () => this._setLabel(null), sig);
    }
  }

  _drag(node, move, read, flag) {
    node.addEventListener('pointerdown', (e) => {
      if (e.button !== 0) return;
      e.preventDefault(); e.stopPropagation();
      node.setPointerCapture(e.pointerId);
      const x0 = e.clientX, y0 = e.clientY, s0 = read();
      flag?.(true);
      const mv = (ev) => move(ev.clientX - x0, ev.clientY - y0, s0);
      const up = () => { node.removeEventListener('pointermove', mv); node.removeEventListener('pointerup', up); node.removeEventListener('pointercancel', up); flag?.(false); };
      node.addEventListener('pointermove', mv); node.addEventListener('pointerup', up); node.addEventListener('pointercancel', up);
    }, { signal: this._ac.signal });
  }

  _setLabel(px) {
    if (px == null) { this.labelPx = null; this.body.style.removeProperty('--tw-label-user'); }
    else {
      const w = this.body.clientWidth;
      this.labelPx = clamp(px, this.o.layout.minLabel, w * 0.75);
      this.body.style.setProperty('--tw-label-user', `${this.labelPx}px`);
    }
    this._measure(); this._view(true);
  }

  _measure() {
    const anyLabel = this.body.querySelector('.tw-axis-label') || this.tree.querySelector('.tw-label');
    this._labelW = anyLabel ? anyLabel.getBoundingClientRect().width : this.body.clientWidth / 2;
    this._rtl = getComputedStyle(this.root).direction === 'rtl';
  }
  _tlRect() {
    const r = this.body.getBoundingClientRect();
    return { left: r.left + this._labelW, width: Math.max(1, r.width - this._labelW) };
  }

  /* ------------------------------------------------------------ clock */
  _setNow(t) {
    this.now = t;
    if (t <= 0) { this._pinBottom = true; }
    this._sync();
    this._view();
    this._updateStats(true);
  }
  _syncPlay() {
    if (this.ppBtn) {
      const L = this.o.labels;
      this.ppBtn.setAttribute('aria-label', this.playing ? L.pause : L.play);
      this.ppBtn.title = this.playing ? L.pause : L.play;
      (this.playing ? PP.pause : PP.play).forEach((d, i) => { this.ppPaths[i].style.d = `path("${d}")`; });
    }
    if (this._lastPlaying !== this.playing) { this._lastPlaying = this.playing; this._emit('PlayChange', this.playing); }
  }

  _frame(ts) {
    if (this.clock === 'live') {
      // wall clock: now = time since the trace started, frozen once every span has ended
      const t = Math.min(this.end, this._liveNow());
      if (t !== this.now) { this.now = t; this._sync(); this._emit('Now', t); }
      if (isFinite(this.end) && this.now >= this.end) this._complete();
    } else if (this.playing && this.clock === 'replay') {
      if (this._last != null) {
        const dt = Math.min(0.1, (ts - this._last) / 1000);
        this.now = Math.min(this.end, this.now + dt * this.o.speed * this.o.timeScale);
        if (this.now >= this.end) {
          this.playing = false; this._syncPlay();
          this._complete();
          if (this.o.loop) setTimeout(() => { if (this.root.isConnected && !this.playing) this.replay(); }, this.o.loopDelay);
        }
        this._sync();
        this._emit('Now', this.now);
      }
      this._last = ts;
    } else this._last = null;
    if (this.now < this.end) this._completed = false;

    this._view();
    if (ts - this._lastStat >= this.o.motion.statThrottle) {
      this._lastStat = ts; this._updateStats(); this._updateFigures();
      if (this.pop && this.root.hasAttribute('data-live')) this._renderCard(this.pop.span, true);
    }
    this._layoutFrame();
  }

  _complete() { if (this._completed) return; this._completed = true; this._emit('Complete', this._summary()); }
  /** Totals for the trace up to `now` (same numbers as the header). */
  _summary() {
    const now = this.now;
    let cost = 0, tokens = 0, llm = 0, tools = 0, errors = 0;
    for (const s of this.leaves) {
      if (s.start > now) continue;
      if (s.kind === 'model') llm++; else tools++;
      if (s.end != null && s.end <= now) { cost += s.cost || 0; tokens += (s.tokensIn || 0) + (s.tokensOut || 0); if (s.failed) errors++; }
    }
    return { duration: Math.min(now, this.end), cost, tokens, llmCalls: llm, toolCalls: tools, errors };
  }

  /* ------------------------------------------------------------ discrete state */
  _sync(force) {
    // only rebuild when `now` crosses an event boundary
    let idx = 0;
    const ev = this.events, now = this.now;
    let lo = 0, hi = ev.length;
    while (lo < hi) { const m = (lo + hi) >> 1; if (ev[m] <= now) lo = m + 1; else hi = m; }
    idx = lo;
    if (!force && idx === this._eventIdx) return;
    this._eventIdx = idx;
    const live = now < this.end;
    setAttr(this.root, 'data-live', live);

    for (const r of this.rows.values()) {
      const s = r.s, st = r.st;
      const visible = s.start <= now + 1e-9;
      const running = visible && (s.end == null || s.end > now);
      if (visible !== st.visible) {
        st.visible = visible;
        if (visible) {
          r.li.hidden = false;
          if (!force && !this.reduced) { r.li.setAttribute('data-enter', ''); raf2(() => r.li.removeAttribute('data-enter')); }
        } else { r.li.hidden = true; r.li.removeAttribute('data-enter'); }
      }
      // status prefix
      if (r.prefix) {
        const state = running ? 'running' : visible && s.failed ? 'failed' : 'none';
        if (state !== st.prefix) {
          const becameFailed = state === 'failed' && st.prefix === 'running';
          st.prefix = state; r.prefix.dataset.state = state;
          setAttr(r.status, 'data-failed', state === 'failed');
          if (becameFailed && this.o.features.failShake && !this.reduced) {
            r.status.classList.remove('tw-shake'); void r.status.offsetWidth; r.status.classList.add('tw-shake');
          }
        }
      }
      // bars
      for (const b of r.bars) {
        const g = b.seg;
        const segVisible = g.start < now || (g.start <= now && g.end === g.start);
        const segRunning = segVisible && (g.end == null || g.end > now);
        const key = `${segVisible}|${segRunning}`;
        if (b.key === key) continue;
        b.key = key;
        b.bar.hidden = !segVisible;
        if (b.wrap) b.wrap.hidden = !segVisible;
        if (b.trig) b.trig.hidden = !segVisible;
        if (!segVisible) continue;
        const E = segRunning ? 'var(--tn)' : g.end;
        b.bar.style.left = `calc(${pos(g.start)} + 1px)`;
        b.bar.style.width = `calc((${E} - ${g.start}) / var(--td) * 100% - 2px)`;
        setAttr(b.bar, 'data-running', segRunning && !this.reduced);
        if (b.trig) {
          b.trig.style.left = `calc(${pos(g.start)})`;
          b.trig.style.width = `calc((${E} - ${g.start}) / var(--td) * 100%)`;
        }
      }
      const E = running ? 'var(--tn)' : s.end;
      if (r.laneTrig) { r.laneTrig.style.left = `calc(${pos(s.start)})`; r.laneTrig.style.width = `calc((${E} - ${s.start}) / var(--td) * 100%)`; }
      r.fig.style.left = `calc(${pos(E)})`;
      st.running = running;
    }
    this._applyFilter();
    this._updateFigures(true);
    this._updateSlowest();
    this._handoffDirty = true;
    if (this.pop) this._renderCard(this.pop.span, true);
  }

  _updateFigures(structural) {
    if (!this.o.features.figures) return;
    const fmt = this.o.format;
    for (const r of this.rows.values()) {
      const s = r.s, st = r.st;
      if (!st.visible) continue;
      if (!structural && !st.running) continue;
      const d = (st.running ? this.now : s.end) - s.start;
      let cost = 0;
      if (s.isLane) cost = this._costUntil(s);
      else if (!st.running) cost = s.cost || 0;
      const text = this.o.figure ? String(this.o.figure(s, { now: this.now, running: st.running, duration: d, cost, format: fmt }) ?? '')
        : cost > 0 ? `${fmt.duration(d)} · ${fmt.cost(cost)}` : fmt.duration(d);
      if (text !== st.fig) {
        if (st.fig == null && !this.reduced) { r.figText.setAttribute('data-enter', ''); raf2(() => r.figText.removeAttribute('data-enter')); }
        st.fig = text; r.figText.textContent = text;
      }
    }
  }
  _costUntil(lane) {
    let c = 0;
    const walk = (s) => { for (const k of s.children) { if (k.isLane) walk(k); else if (k.end != null && k.end <= this.now) c += k.cost || 0; } };
    walk(lane);
    return c;
  }

  _updateSlowest() {
    if (!this.o.features.slowest) return;
    let best = null, bestD = -1;
    for (const s of this.leaves) {
      if (s.end == null || s.end > this.now) continue;
      const d = s.end - s.start;
      if (d > bestD) { bestD = d; best = s; }
    }
    const id = best?.id;
    if (id === this._slowId) return;
    this._slowId = id;
    this.slowBadge?.remove();
    if (!best) return;
    const b = el('span', 'tw-badge tw-slowest', { 'data-variant': 'amber' });
    b.textContent = this.o.labels.slowest;
    if (!this.reduced) { b.setAttribute('data-enter', ''); raf2(() => b.removeAttribute('data-enter')); }
    this.rows.get(id).fig.append(b);
    this.slowBadge = b;
  }

  _updateStats(force) {
    if (!this.statEls) return;
    if (!force && !this.root.hasAttribute('data-live') && this._statsDone) return;
    this._statsDone = !this.root.hasAttribute('data-live');
    const now = this.now, fmt = this.o.format;
    let cost = 0, tokens = 0, llm = 0, tools = 0, errors = 0;
    for (const s of this.leaves) {
      if (s.start > now) continue;
      if (s.kind === 'model') llm++; else tools++;
      if (s.end != null && s.end <= now) {
        cost += s.cost || 0; tokens += (s.tokensIn || 0) + (s.tokensOut || 0);
        if (s.failed) errors++;
      }
    }
    const values = {
      duration: [fmt.duration(Math.min(now, this.end)), now],
      cost: [fmt.cost(cost), cost], tokens: [fmt.tokens(tokens), tokens],
      llmCalls: [String(llm), llm], toolCalls: [String(tools), tools], errors: [String(errors), errors],
    };
    for (const [k, m] of Object.entries(this.statEls)) {
      const def = this.statDefs[k];
      let v = values[k];
      if (def?.value) { const r = def.value({ ...this._summary(), now, spans: this.spans, format: fmt }); v = Array.isArray(r) ? r : [String(r), typeof r === 'number' ? r : null]; }
      if (!v) v = ['—', null];
      m.set(v[0], v[1]);
    }
  }

  /* ------------------------------------------------------------ view (domain, ticks) */
  _view(forceTicks) {
    const o = this.o;
    const auto = Math.max(o.domain.min, Math.min(this.now, this.end) * o.domain.headroom);
    this.whole = auto;
    if (!this.zoomed) { this.vStart = 0; this.vDomain = auto; }
    this.vDomain = Math.min(this.vDomain, this.whole);
    this.vStart = clamp(this.vStart, 0, Math.max(0, this.whole - this.vDomain));
    const s = this.root.style;
    const key = `${this.vStart}|${this.vDomain}|${this.now}|${this.whole}`;
    if (key !== this._viewKey) {
      this._viewKey = key;
      s.setProperty('--ts', this.vStart);
      s.setProperty('--td', this.vDomain);
      s.setProperty('--tn', Math.min(this.now, this.end));
      s.setProperty('--tw-whole', this.whole);
      this._handoffDirty = true;
    }
    setAttr(this.hbar, 'data-active', this.zoomed);
    this._renderTicks(forceTicks);
  }

  _tickStep(domain) {
    const { steps, maxTicks } = this.o.domain;
    for (const st of steps) if (domain / st <= maxTicks) return st;
    return steps[steps.length - 1];
  }

  _renderTicks(force) {
    const step = this._tickStep(this.vDomain);
    const first = Math.floor(this.vStart / step) * step;
    const last = this.vStart + this.vDomain;
    const want = [];
    for (let v = first; v <= last + 1e-9; v += step) want.push(+v.toFixed(4));
    const key = `${step}|${want[0]}|${want[want.length - 1]}`;
    if (!force && key === this._tickKey) return;
    this._tickKey = key;
    const containers = [this.gridClip, ...[...this.rows.values()].filter((r) => r.rowGrid).map((r) => r.rowGrid.clip)];
    const wantSet = new Set(want);
    // fade out stale ticks
    for (const [v, t] of this._ticks) {
      if (wantSet.has(v)) continue;
      this._ticks.delete(v);
      for (const n of t.nodes) {
        if (this.reduced) { n.remove(); continue; }
        n.setAttribute('data-exit', '');
        setTimeout(() => n.remove(), 220);
      }
    }
    for (const v of want) {
      if (this._ticks.has(v)) continue;
      const nodes = [];
      const left = `calc(${pos(v)})`;
      if (this.tickBox) {
        const lab = el('span', 'tw-tick'); lab.textContent = this.o.format.tick(v); lab.style.left = left;
        this.tickBox.append(lab); nodes.push(lab);
      }
      if (this.o.features.gridlines) {
        for (const c of containers) { const g = el('span', 'tw-gridline'); g.style.left = left; c.append(g); nodes.push(g); }
      }
      if (!this.reduced && this._ticksReady) { nodes.forEach((n) => n.setAttribute('data-enter', '')); raf2(() => nodes.forEach((n) => n.removeAttribute('data-enter'))); }
      this._ticks.set(v, { nodes });
    }
    this._ticksReady = true;
  }

  /* ------------------------------------------------------------ per-frame layout */
  _layoutFrame() {
    const vp = this.viewport;
    // follow the newest row while live
    if (this.o.features.follow && this.root.hasAttribute('data-live') && this._pinBottom && this.playing) {
      const target = vp.scrollHeight - vp.clientHeight;
      if (Math.abs(vp.scrollTop - target) > 0.5) { this._autoScrolling = true; vp.scrollTop = target; }
    }
    // vertical scrollbar
    const sh = vp.scrollHeight, ch = vp.clientHeight;
    const over = sh > ch + 1;
    this.vbar.hidden = !over;
    if (over) {
      const th = Math.max(24, (ch / sh) * ch - 4);
      const y = (vp.scrollTop / (sh - ch)) * (ch - 4 - th);
      this.vthumb.style.height = `${th}px`;
      this.vthumb.style.transform = `translate3d(0, ${y}px, 0)`;
    }
    // sticky lanes: mark the ones currently pinned
    if (this.o.features.stickyLanes) {
      const top = vp.getBoundingClientRect().top;
      for (const r of this.rows.values()) {
        if (!r.rowGrid || !r.st.visible) continue;
        const li = r.li.getBoundingClientRect();
        const offset = r.s.depth * this.o.layout.rowHeight;
        const stuck = li.top < top + offset - 0.5 && li.bottom > top + offset + this.o.layout.rowHeight;
        if (stuck !== r.st.stuck) { r.st.stuck = stuck; setAttr(r.row, 'data-stuck', stuck); }
      }
    }
    if (this.o.features.handoffs) this._drawHandoffs();
    if (this.pop) this._placePopover();
  }

  _shown(s) {
    const r = this.rows.get(s.id);
    if (!r.st.visible || r.st.filtered) return false;
    for (let p = s.parent; p; p = p.parent) { if (this.collapsed.has(p.id)) return false; if (this.rows.get(p.id).st.filtered) return false; }
    return true;
  }

  _drawHandoffs() {
    const lanes = this.spans.filter((s) => s.isLane && s.parent && s.parent.isLane);
    const cr = this.content.getBoundingClientRect();
    const W = cr.width, lw = this._labelW, tw = W - lw;
    const x = (t) => (this._rtl ? W - lw - ((t - this.vStart) / this.vDomain) * tw : lw + ((t - this.vStart) / this.vDomain) * tw);
    const svg = this.svg;
    // size to the rows, never to scrollHeight (which includes the svg itself and could only grow)
    const H = this.tree.offsetHeight;
    if (svg._w !== W || svg._h !== H) { svg._w = W; svg._h = H; svg.setAttribute('width', W); svg.setAttribute('height', H); }
    svg.style.clipPath = this._rtl ? `inset(0 ${lw}px 0 0)` : `inset(0 0 0 ${lw}px)`;
    if (!this._hand) this._hand = new Map();
    const seen = new Set();
    const L = this.o.layout, rad = 6;
    for (const s of lanes) {
      if (!this._shown(s) || !this._shown(s.parent)) continue;
      const pr = this.rows.get(s.parent.id), cr2 = this.rows.get(s.id);
      const pTop = pr.li.getBoundingClientRect().top - cr.top;
      const cTop = cr2.li.getBoundingClientRect().top - cr.top;
      const py = pTop + L.rowHeight / 2 + L.laneBarHeight / 2;
      const cy = cTop + L.rowHeight / 2;
      if (cy - py < rad + 2) continue;
      const color = s.color || 'var(--tw-muted-foreground)';
      const dir = this._rtl ? -1 : 1;
      const parts = [];
      const x0 = x(s.start) + dir * 1;
      parts.push({ key: `${s.id}:out`, d: `M${x0} ${py}V${cy - rad}Q${x0} ${cy} ${x0 + dir * rad} ${cy}`, cx: x0, cy: py });
      if (s.end != null && s.end <= this.now) {
        const x1 = x(s.end) - dir * 1;
        parts.push({ key: `${s.id}:back`, d: `M${x1 - dir * rad} ${cy}Q${x1} ${cy} ${x1} ${cy - rad}V${py}`, cx: x1, cy: py });
      }
      for (const p of parts) {
        seen.add(p.key);
        let h = this._hand.get(p.key);
        if (!h) {
          const path = svgEl('path', { stroke: color, 'pathLength': '1' });
          const dot = svgEl('circle', { r: '3.5', fill: color });
          svg.append(path, dot);
          h = { path, dot };
          this._hand.set(p.key, h);
          if (!this.reduced) {
            path.style.strokeDasharray = '1'; path.style.strokeDashoffset = '1';
            dot.setAttribute('data-enter', '');
            raf2(() => { path.style.strokeDashoffset = '0'; dot.removeAttribute('data-enter'); });
            setTimeout(() => { path.style.strokeDasharray = ''; path.style.strokeDashoffset = ''; path.removeAttribute('pathLength'); }, 600);
          } else path.removeAttribute('pathLength');
        }
        if (h.color !== color) { h.color = color; h.path.setAttribute('stroke', color); h.dot.setAttribute('fill', color); }
        if (h.d !== p.d) { h.d = p.d; h.path.setAttribute('d', p.d); h.dot.setAttribute('cx', p.cx); h.dot.setAttribute('cy', p.cy); }
      }
    }
    for (const [k, h] of this._hand) if (!seen.has(k)) { h.path.remove(); h.dot.remove(); this._hand.delete(k); }
  }

  /* ------------------------------------------------------------ collapse + search */
  _toggle(id) {
    const r = this.rows.get(id);
    if (!r?.kids) return;
    const c = !this.collapsed.has(id);
    c ? this.collapsed.add(id) : this.collapsed.delete(id);
    setAttr(r.kids, 'data-collapsed', c);
    if (r.chevron) {
      r.chevron.setAttribute('aria-expanded', String(!c));
      r.chevron.setAttribute('aria-label', (c ? this.o.labels.expand : this.o.labels.collapse)(r.s.name));
    }
    this._emit('Toggle', id, !c);
  }

  _search(q) {
    const changed = q !== this.query;
    this.query = q;
    this._applyFilter();
    if (changed) this._emit('Search', q);
    if (this.pop && this.rows.get(this.pop.span.id)?.st.filtered) this._closePopover();
  }

  _applyFilter() {
    const q = this.query.trim().toLowerCase();
    const match = new Set();
    if (q) {
      for (const s of this.spans) {
        const hay = [s.name, s.subtitle, s.input, s.output, s.error].filter(Boolean).join('\n').toLowerCase();
        if (hay.includes(q)) for (let p = s; p; p = p.parent) match.add(p.id);
      }
    }
    let any = false;
    for (const r of this.rows.values()) {
      const filtered = !!q && !match.has(r.s.id);
      if (!filtered && r.st.visible) any = true;
      if (filtered !== r.st.filtered) { r.st.filtered = filtered; setAttr(r.li, 'data-filtered', filtered); }
      if (r.st.q !== q) {
        r.st.q = q;
        highlight(r.name, r.s.name, q);
        if (r.sub) highlight(r.sub, r.s.subtitle, q);
      }
    }
    const empty = !!q && !any;
    setAttr(this.body, 'data-empty', empty);
    if (empty) this.emptyText.textContent = this.o.labels.emptyText(this.query.trim());
    setAttr(this.emptyWrap, 'inert', !empty);
  }

  /* ------------------------------------------------------------ popover */
  _openFrom(e, span, trig) {
    e.stopPropagation();
    this._emit('SpanClick', span, e);
    if (e.defaultPrevented) return;
    if (!this.o.features.popover) return;
    const rect = trig.getBoundingClientRect();
    const ax = e.detail === 0 ? rect.left + Math.min(24, rect.width / 2) : e.clientX;
    if (this.pop && this.pop.span === span) { this._closePopover(); return; }
    this._openPopover(span, trig, ax - rect.left);
  }

  _visibleOrder() { return this.spans.filter((s) => this._shown(s)); }

  _openPopover(span, trig, offsetX) {
    const prev = this.pop;
    if (prev) {
      prev.trig.removeAttribute('data-open');
      this.rows.get(prev.rowId)?.row.removeAttribute('data-open');
    }
    const rowId = trig.closest('.tw-row').dataset.traceId;
    const vr = this.viewport.getBoundingClientRect(), tr = trig.getBoundingClientRect();
    if (tr.top < vr.top || tr.bottom > vr.bottom) { this._pinBottom = false; this.rows.get(rowId).row.scrollIntoView({ block: 'nearest' }); }
    trig.setAttribute('data-open', '');
    trig.setAttribute('aria-expanded', 'true');
    this.rows.get(rowId).row.setAttribute('data-open', '');

    if (!prev) {
      const posEl = el('div', 'tw-pop-pos', { role: 'presentation' });
      const panel = el('div', 'tw-pop', { role: 'dialog', tabindex: '-1', 'data-slot': 'popover-content' });
      const vp = el('div', 'tw-pop-vp');
      panel.append(vp); posEl.append(panel); this.portal.append(posEl);
      panel.addEventListener('keydown', (e) => this._popKey(e));
      this.pop = { pos: posEl, panel, vp, span, trig, rowId, offsetX, card: null };
      this._renderCard(span);
      if (!this.reduced) { panel.dataset.state = 'opening'; panel.addEventListener('animationend', () => { if (panel.dataset.state === 'opening') delete panel.dataset.state; }, { once: true }); }
      this._placePopover(true);
      panel.focus({ preventScroll: true });
    } else {
      const order = this._visibleOrder();
      const dir = order.indexOf(span) >= order.indexOf(prev.span) ? 'right' : 'left';
      Object.assign(prev, { span, trig, rowId, offsetX });
      this.pop.pos.setAttribute('data-gliding', '');
      clearTimeout(this._glideT);
      this._glideT = setTimeout(() => this.pop?.pos.removeAttribute('data-gliding'), this.reduced ? 0 : 300);
      this._renderCard(span, false, dir);
      this._placePopover();
    }
    this._emit('Open', span);
  }

  _popKey(e) {
    if (e.key === 'Escape') { e.preventDefault(); const t = this.pop.trig; this._closePopover(); t.focus({ preventScroll: true }); return; }
    if (e.key === 'ArrowRight' || e.key === 'ArrowLeft' || e.key === 'ArrowDown' || e.key === 'ArrowUp') {
      e.preventDefault();
      const order = this._visibleOrder();
      const i = order.indexOf(this.pop.span);
      const n = order[clamp(i + (e.key === 'ArrowRight' || e.key === 'ArrowDown' ? 1 : -1), 0, order.length - 1)];
      if (!n || n === this.pop.span) return;
      const r = this.rows.get(n.id);
      const trig = r.laneTrig;
      if (!trig) return;
      r.row.scrollIntoView({ block: 'nearest' });
      this._openPopover(n, trig, Math.min(24, trig.getBoundingClientRect().width / 2));
    }
  }

  _placePopover(first) {
    const p = this.pop;
    if (!p.trig.isConnected || p.trig.offsetParent === null) { this._closePopover(); return; }
    const r = p.trig.getBoundingClientRect();
    const w = p.panel.offsetWidth, h = p.panel.offsetHeight;
    const gap = this.o.layout.popoverGap;
    const ax = r.left + clamp(p.offsetX, 0, Math.max(0, r.width));
    let left = clamp(ax - 14, 8, innerWidth - w - 8);
    let top = r.bottom + gap, side = 'bottom';
    if (top + h > innerHeight - 8 && r.top - gap - h > 8) { top = r.top - gap - h; side = 'top'; }
    // hide when the anchor scrolled out of the viewport area
    const vr = this.viewport.getBoundingClientRect();
    const hidden = r.bottom < vr.top || r.top > vr.bottom;
    p.pos.style.visibility = hidden ? 'hidden' : '';
    const key = `${left}|${top}`;
    if (key === p.key) return;
    p.key = key;
    p.pos.style.left = `${left}px`; p.pos.style.top = `${top}px`;
    p.panel.style.setProperty('--tw-pop-origin', `${ax - left}px ${side === 'bottom' ? '0' : '100%'}`);
    p.panel.dataset.side = side;
  }

  _closePopover(instant) {
    const p = this.pop;
    if (!p) return;
    this.pop = null;
    p.trig.removeAttribute('data-open'); p.trig.setAttribute('aria-expanded', 'false');
    this.rows.get(p.rowId)?.row.removeAttribute('data-open');
    if (instant || this.reduced) { p.pos.remove(); }
    else { p.panel.dataset.state = 'closing'; setTimeout(() => p.pos.remove(), 160); }
    this._emit('Close');
  }

  _renderCard(span, live, dir) {
    const p = this.pop; if (!p) return;
    const L = this.o.labels, fmt = this.o.format;
    const now = this.now;
    const running = span.end == null || span.end > now;
    const status = running ? 'running' : span.failed ? 'failed' : 'done';
    const dur = (running ? now : span.end) - span.start;
    const started = fmt.started ? fmt.started(span.start) : `+${fmt.duration(span.start)}`;
    const isModel = span.kind === 'model';
    const stats = [[L.duration, fmt.duration(Math.max(0, dur))], [L.started, started]];
    if (span.isLane) {
      stats.push([L.cost, fmt.cost(this._costUntil(span))], [L.tokensIn, fmt.tokens(span.agg.tin)], [L.tokensOut, fmt.tokens(span.agg.tout)], [L.spans, String(span.agg.n)]);
    } else {
      stats.push([L.cost, fmt.cost(running ? 0 : span.cost || 0)]);
      if (isModel || span.tokensIn != null) stats.push([L.tokensIn, fmt.tokens(span.tokensIn || 0)], [L.tokensOut, fmt.tokens(running ? 0 : span.tokensOut || 0)]);
    }

    // live refresh of the same card: patch values in place, morph the status badge
    if (live && p.card && p.card.span === span) {
      const c = p.card;
      c.badge.dataset.variant = { running: 'amber', failed: 'red', done: 'green' }[status];
      c.badgeMorph.set(L[status]);
      stats.forEach(([, v], i) => { if (c.dds[i]) c.dds[i].textContent = v; });
      if (c.status !== status) { c.status = status; this._renderCard(span, false, null, true); }
      return;
    }

    const card = el('div', 'tw-card', { 'data-current': '' });
    const inn = el('div', 'tw-card-in');
    const head = el('div', 'tw-card-head');
    const ic = el('span', 'tw-card-icon', { 'aria-hidden': 'true' }); const svg = this._icon(span); if (svg) ic.append(svg);
    const titles = el('div', 'tw-card-titles');
    const h2 = el('h2'); h2.textContent = span.name;
    const badge = el('span', 'tw-badge', { 'data-variant': { running: 'amber', failed: 'red', done: 'green' }[status] });
    const bm = el('span'); badge.append(bm);
    const badgeMorph = new Morph(bm, this.o.features.numberMorph); badgeMorph.set(L[status]);
    titles.append(h2, badge);
    const close = el('button', 'tw-close', { type: 'button', 'aria-label': L.close });
    close.append(html(UI.x));
    close.addEventListener('click', () => { const t = this.pop?.trig; this._closePopover(); t?.focus({ preventScroll: true }); });
    head.append(ic, titles, close);
    const dl = el('dl', 'tw-card-stats');
    const dds = stats.map(([k, v]) => { const d = el('div'); const dt = el('dt'); dt.textContent = k; const dd = el('dd'); dd.textContent = v; d.append(dt, dd); dl.append(d); return dd; });
    inn.append(head, dl);
    if (span.failed && !running && span.error) {
      const er = el('p', 'tw-card-error', { dir: 'auto' }); er.append(html(UI.alert), document.createTextNode(span.error)); inn.append(er);
    }
    const field = (label, text) => { const d = el('div', 'tw-card-field'); const s = el('span'); s.textContent = label; const t = el('p', '', { dir: 'auto' }); t.textContent = text; d.append(s, t); inn.append(d); };
    if (span.input) field(L.input, span.input);
    if (span.output && !running && !span.failed) field(L.output, span.output);
    if (this.o.renderDetails) {
      const extra = this.o.renderDetails(span, { now, running, status, duration: dur, format: fmt });
      if (extra instanceof Node) inn.append(extra);
      else if (Array.isArray(extra)) for (const [k, v] of extra) field(k, v);
    }
    card.append(inn);

    const old = p.card?.node;
    const h0 = p.panel.offsetHeight;
    if (old && dir && !this.reduced) {
      old.removeAttribute('data-current'); old.setAttribute('data-previous', '');
      raf2(() => { old.setAttribute('data-ending', ''); old.dataset.to = dir === 'right' ? 'left' : 'right'; });
      setTimeout(() => old.remove(), 170);
      card.setAttribute('data-starting', ''); card.dataset.from = dir;
      raf2(() => card.removeAttribute('data-starting'));
    } else old?.remove();
    p.vp.append(card);
    p.card = { node: card, span, badge, badgeMorph, dds, status };
    // animate height between cards
    if (old && !this.reduced) {
      p.panel.style.height = 'auto';
      const h1 = card.offsetHeight + 28;
      p.panel.style.height = `${h0}px`;
      void p.panel.offsetHeight;
      p.panel.style.height = `${h1}px`;
      clearTimeout(p.hT); p.hT = setTimeout(() => { if (this.pop === p) p.panel.style.height = ''; }, 300);
    }
  }
}

export default TraceWaterfall;
