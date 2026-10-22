// Type definitions for trace-waterfall

export type SpanKind = 'agent' | 'model' | 'tool';
/** Seconds (or `timeUnit`), epoch ms/ns as number or bigint, a Date, or an ISO string. */
export type TimeInput = number | bigint | string | Date;

interface SpanFields {
  id: string | number;
  parentId?: string | number | null;
  /** 'agent' = lane whose bar is derived from its children. Defaults to 'agent' when it has children, else 'tool'. */
  kind?: SpanKind;
  name: string;
  subtitle?: string;
  /** Key into `icons`, a raw `<svg>` string, or anything `renderIcon` understands. */
  icon?: string;
  /** Lane color; children inherit it. Omit for a neutral lane. */
  color?: string;
  start: TimeInput;
  /** `null`/omitted = still running. */
  end?: TimeInput | null;
  status?: 'ok' | 'error' | 'failed';
  cost?: number;
  tokensIn?: number;
  tokensOut?: number;
  input?: string;
  output?: string;
  error?: string;
}
export interface Span extends SpanFields {
  [extra: string]: unknown;
}

/** A span after normalization (times in seconds from the trace start, tree links resolved). */
export interface ResolvedSpan extends Omit<SpanFields, 'start' | 'end' | 'id' | 'parentId'> {
  [extra: string]: unknown;
  id: string;
  parentId: string | null;
  kind: SpanKind;
  start: number;
  end: number | null;
  raw: unknown;
  parent: ResolvedSpan | null;
  children: ResolvedSpan[];
  depth: number;
  isLane: boolean;
  failed: boolean;
  agg?: { cost: number; tin: number; tout: number; n: number };
}

export interface Formatters {
  duration(seconds: number): string;
  cost(usd: number): string;
  tokens(n: number): string;
  tick(seconds: number): string;
  started: ((seconds: number) => string) | null;
  speed(x: number): string;
}

export interface Summary { duration: number; cost: number; tokens: number; llmCalls: number; toolCalls: number; errors: number }

export type BuiltInStat = 'duration' | 'cost' | 'tokens' | 'llmCalls' | 'toolCalls' | 'errors';
export interface CustomStat {
  key: string;
  label: string;
  /** Return display text, or [text, numeric value] so the number morph knows the direction. */
  value(ctx: Summary & { now: number; spans: ResolvedSpan[]; format: Formatters }): string | number | [string, number | null];
}

export interface Features {
  header: boolean; search: boolean; shortcut: boolean; stats: boolean; axis: boolean; gridlines: boolean;
  nowLine: boolean; nowLineIdle: boolean; handoffs: boolean; slowest: boolean; stickyLanes: boolean;
  popover: boolean; collapse: boolean; resize: boolean; figures: boolean; controls: boolean; speedSelect: boolean;
  legend: boolean; follow: boolean; numberMorph: boolean; treeGuides: boolean; hoverRows: boolean;
  statusIcons: boolean; failShake: boolean;
}

export interface Labels {
  search: string; searchAria: string; steps: string;
  duration: string; cost: string; tokens: string; llmCalls: string; toolCalls: string; errors: string;
  started: string; tokensIn: string; tokensOut: string; spans: string; input: string; output: string;
  running: string; done: string; failed: string; slowest: string; close: string;
  play: string; pause: string; replay: string; speed: string;
  emptyTitle: string; emptyText(query: string): string;
  legendModel: string; legendTool: string; legendWaiting: string; legendHandoff: string; legendFailed: string;
  collapse(name: string): string; expand(name: string): string; details(name: string): string; resize: string;
  shortcut: string;
}

type DeepPartial<T> = { [K in keyof T]?: T[K] extends (...a: any[]) => any ? T[K] : T[K] extends object ? DeepPartial<T[K]> : T[K] };

export interface FigureContext { now: number; running: boolean; duration: number; cost: number; format: Formatters }
export interface DetailsContext { now: number; running: boolean; status: 'running' | 'done' | 'failed'; duration: number; format: Formatters }

export interface TraceWaterfallOptions<Raw = Span> {
  spans: NoInfer<Raw>[];
  icons?: Record<string, string>;
  title?: string;
  theme?: 'light' | 'dark' | 'system';
  /** Any `--tw-*` CSS variable (colors, radii, durations, easings, font…). */
  tokens?: Record<`--${string}`, string>;

  clock?: 'replay' | 'live' | 'controlled';
  /** @deprecated use clock: 'controlled' */
  controlled?: boolean;
  /** Live clock origin. Defaults to the earliest absolute span start, else mount time. */
  startedAt?: number | string | Date | null;
  autoplay?: boolean;
  loop?: boolean;
  loopDelay?: number;
  speed?: number;
  speeds?: number[];
  /** Trace seconds per real second at 1x (replay clock). */
  timeScale?: number;
  startAt?: number;

  timeUnit?: 's' | 'ms' | 'us' | 'ns';
  origin?: 'auto' | number;
  mapSpan?: ((raw: Raw, index: number) => Span | null | undefined) | null;
  validate?: boolean;

  colorFor?: ((span: ResolvedSpan) => string | null | undefined) | null;
  renderIcon?: ((span: ResolvedSpan) => Node | string | null | undefined) | null;
  figure?: ((span: ResolvedSpan, ctx: FigureContext) => string) | null;
  renderDetails?: ((span: ResolvedSpan, ctx: DetailsContext) => Array<[string, string]> | Node | null | undefined) | null;

  domain?: Partial<{ min: number; headroom: number; maxTicks: number; steps: number[] }>;
  zoom?: Partial<{ enabled: boolean; wheelFactor: number; minDomain: number }>;
  layout?: Partial<{
    rowHeight: number; laneBarHeight: number; stepBarHeight: number; laneBarRadius: number; stepBarRadius: number;
    indent: number; baseIndent: number; leafOffset: number; maxHeight: number; minLabel: number; labelWidth: number | null;
    popoverWidth: number; popoverGap: number; radius: number;
  }>;
  /** Percent of the lane color mixed into the card per segment type; `neutral` scales lanes without a color. */
  mix?: Partial<{ model: number; tool: number; gap: number; neutral: number; hatch: number; glow: number; hatchGap: number }>;
  features?: Partial<Features>;
  stats?: Array<BuiltInStat | CustomStat>;
  collapsed?: string[];
  motion?: Partial<{ reduced: 'auto' | boolean; statThrottle: number }>;
  labels?: Partial<Labels>;
  format?: Partial<Formatters>;

  onOpen?: ((span: ResolvedSpan) => void) | null;
  onClose?: (() => void) | null;
  onNow?: ((now: number) => void) | null;
  onPlayChange?: ((playing: boolean) => void) | null;
  onToggle?: ((id: string, expanded: boolean) => void) | null;
  onSearch?: ((query: string) => void) | null;
  /** Call `event.preventDefault()` to stop the built-in popover. */
  onSpanClick?: ((span: ResolvedSpan, event: MouseEvent) => void) | null;
  onComplete?: ((summary: Summary) => void) | null;
}

export interface TraceWaterfallEvents {
  open: (span: ResolvedSpan) => void;
  close: () => void;
  now: (now: number) => void;
  playchange: (playing: boolean) => void;
  toggle: (id: string, expanded: boolean) => void;
  search: (query: string) => void;
  spanclick: (span: ResolvedSpan, event: MouseEvent) => void;
  complete: (summary: Summary) => void;
}

export declare const DEFAULTS: Required<Omit<TraceWaterfallOptions, 'domain' | 'zoom' | 'layout' | 'mix' | 'features' | 'motion' | 'labels' | 'format'>> & {
  domain: { min: number; headroom: number; maxTicks: number; steps: number[] };
  features: Features; labels: Labels; format: Formatters;
};

export declare class TraceWaterfall<Raw = Span> {
  constructor(target: HTMLElement, options: TraceWaterfallOptions<Raw>);
  readonly root: HTMLElement;
  readonly clock: 'replay' | 'live' | 'controlled';
  readonly now: number;
  /** End of the trace in seconds; Infinity while any span is still running. */
  readonly end: number;
  readonly playing: boolean;
  readonly spans: ResolvedSpan[];

  play(): void;
  pause(): void;
  toggle(): void;
  replay(): void;
  seek(seconds: number): void;
  setNow(seconds: number): void;
  setSpeed(x: number): void;
  /** Replace all data; existing rows are patched in place. */
  setSpans(spans: Raw[]): void;
  /** Add or merge spans by id (streaming). */
  upsertSpans(spans: Raw | Raw[]): void;
  removeSpans(ids: string | string[]): void;
  getSpan(id: string): ResolvedSpan | null;
  setTheme(theme: 'light' | 'dark' | 'system'): void;
  setQuery(query: string): void;
  resetZoom(): void;
  /** Change any option (re-renders, keeps time, play state, search, collapsed lanes and column width). */
  update(options: DeepPartial<TraceWaterfallOptions<Raw>>): void;
  on<K extends keyof TraceWaterfallEvents>(event: K, fn: TraceWaterfallEvents[K]): () => void;
  destroy(): void;
}
export default TraceWaterfall;

export declare function fieldMapper<Raw = any>(fields: Partial<Record<keyof Span, string | ((raw: Raw) => unknown)>>): (raw: Raw) => Span;
export declare function fromOpenTelemetry(
  input: unknown,
  options?: {
    kind?: (span: any, attrs: Record<string, unknown>) => SpanKind | undefined;
    cost?: (span: any, attrs: Record<string, unknown>) => number | undefined;
    icon?: (span: any, attrs: Record<string, unknown>) => string | undefined;
  },
): Span[];
