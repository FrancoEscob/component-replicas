'use client';
// React wrapper. Data changes are patched in place (no remount); other option changes call update().
import { forwardRef, useEffect, useImperativeHandle, useRef, type CSSProperties } from 'react';
import { TraceWaterfall as Engine, type Span, type TraceWaterfallOptions } from '../src/index.js';
import '../src/trace-waterfall.css';

export type TraceWaterfallProps<Raw = Span> = TraceWaterfallOptions<Raw> & {
  className?: string;
  style?: CSSProperties;
  /** Controlled time (seconds). Implies clock: 'controlled'. */
  now?: number;
};

const EVENT_KEYS = ['onOpen', 'onClose', 'onNow', 'onPlayChange', 'onToggle', 'onSearch', 'onSpanClick', 'onComplete'] as const;

// Stable fingerprint of non-data options so a new object literal each render does not re-render the chart.
function fingerprint(o: Record<string, unknown>) {
  return JSON.stringify(o, (_k, v) => (typeof v === 'function' ? `fn:${v.toString().length}:${v.toString().slice(0, 64)}` : v instanceof Node ? 'node' : v));
}

export const TraceWaterfall = forwardRef<Engine | null, TraceWaterfallProps<any>>(function TraceWaterfall(props, ref) {
  const { className, style, now, spans, ...rest } = props;
  const host = useRef<HTMLDivElement>(null);
  const inst = useRef<Engine | null>(null);
  const latest = useRef(props);
  latest.current = props;
  useImperativeHandle(ref, () => inst.current as Engine, []);

  const options = { ...rest } as Record<string, unknown>;
  for (const k of EVENT_KEYS) delete options[k];
  if (now != null) options.clock = 'controlled';
  const fp = fingerprint(options);

  // mount once
  useEffect(() => {
    const events = Object.fromEntries(EVENT_KEYS.map((k) => [k, (...a: unknown[]) => (latest.current as any)[k]?.(...a)]));
    inst.current = new Engine(host.current!, { ...(options as object), ...events, spans } as TraceWaterfallOptions<any>);
    if (now != null) inst.current.setNow(now);
    return () => { inst.current?.destroy(); inst.current = null; };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // options changed → update (keeps time, search, collapsed lanes)
  const first = useRef(true);
  useEffect(() => {
    if (first.current) { first.current = false; return; }
    inst.current?.update(options as never);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [fp]);

  // data changed → incremental patch
  const firstData = useRef(true);
  useEffect(() => {
    if (firstData.current) { firstData.current = false; return; }
    inst.current?.setSpans(spans as never);
  }, [spans]);

  useEffect(() => { if (now != null) inst.current?.setNow(now); }, [now]);

  return <div ref={host} className={className} style={style} />;
});

export default TraceWaterfall;
export type { Span, TraceWaterfallOptions } from '../src/index.js';
