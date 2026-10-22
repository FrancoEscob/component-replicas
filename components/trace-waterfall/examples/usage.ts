// Type-checked usage examples (not shipped). `npm run typecheck`.
import { TraceWaterfall, fromOpenTelemetry, fieldMapper, type Span } from '../src/index.js';

const host = document.createElement('div');

// 1. Plain spans, replay clock
const spans: Span[] = [
  { id: 'run', kind: 'agent', name: 'Support agent', subtitle: 'Sonnet 5.5', start: 0, end: 12, color: '#5b9cf6' },
  { id: 'llm', parentId: 'run', kind: 'model', name: 'Answer', start: 0.4, end: 6, tokensIn: 1200, tokensOut: 300, cost: 0.004 },
  { id: 'db', parentId: 'run', kind: 'tool', name: 'Lookup order', subtitle: 'Postgres', start: 6.2, end: 7.1 },
];
const tw = new TraceWaterfall(host, {
  spans,
  theme: 'dark',
  speed: 2,
  features: { legend: false },
  stats: ['duration', 'cost', { key: 'retries', label: 'Retries', value: (c) => [String(c.errors), c.errors] }],
  figure: (s, c) => `${c.format.duration(c.duration)}${s.tokensIn ? ` · ${s.tokensIn} tok` : ''}`,
  renderDetails: (s) => [['Span id', s.id]],
  onSpanClick: (s, e) => { if (s.kind === 'tool') e.preventDefault(); },
});
const off = tw.on('complete', (sum) => console.log(sum.cost));
off();

// 2. Live streaming with absolute timestamps
const live = new TraceWaterfall(host, { spans: [], clock: 'live', timeUnit: 'ms' });
live.upsertSpans({ id: 'a', kind: 'agent', name: 'Agent', start: Date.now(), end: null });
live.upsertSpans({ id: 'a', end: Date.now() + 1500 } as Span);

// 3. Any backend shape
type Row = { span_id: string; parent: string | null; t0: string; t1: string | null; label: string; type: 'llm' | 'tool' };
const rows: Row[] = [];
new TraceWaterfall<Row>(host, {
  spans: rows,
  mapSpan: fieldMapper<Row>({ id: 'span_id', parentId: 'parent', start: 't0', end: 't1', name: 'label', kind: (r) => (r.type === 'llm' ? 'model' : 'tool') }),
});

// 4. OpenTelemetry export
new TraceWaterfall(host, { spans: fromOpenTelemetry({ resourceSpans: [] }) });
