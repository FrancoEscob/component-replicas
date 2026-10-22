// Data adapters: turn whatever your backend emits into TraceWaterfall spans.

/**
 * Build a `mapSpan` function from a field map. Each entry is a dot path ("attributes.model")
 * or a function (raw) => value. Unmapped fields fall back to the same key on the raw object.
 *
 *   new TraceWaterfall(el, { spans: rows, mapSpan: fieldMapper({ id: 'span_id', parentId: 'parent_id',
 *     start: 'started_at', end: 'ended_at', name: 'name', kind: (r) => r.type === 'llm' ? 'model' : 'tool' }) })
 */
export function fieldMapper(fields) {
  const KEYS = ['id', 'parentId', 'kind', 'name', 'subtitle', 'icon', 'color', 'start', 'end', 'status', 'cost', 'tokensIn', 'tokensOut', 'input', 'output', 'error'];
  const read = (obj, path) => path.split('.').reduce((o, k) => (o == null ? o : o[k]), obj);
  return (raw) => {
    const out = {};
    for (const k of KEYS) {
      const f = fields[k];
      out[k] = typeof f === 'function' ? f(raw) : typeof f === 'string' ? read(raw, f) : raw[k];
    }
    return out;
  };
}

/* ------------------------------------------------------------ OpenTelemetry */

const ATTR_VALUE = (v) => {
  if (v == null || typeof v !== 'object') return v;
  if ('stringValue' in v) return v.stringValue;
  if ('intValue' in v) return Number(v.intValue);
  if ('doubleValue' in v) return v.doubleValue;
  if ('boolValue' in v) return v.boolValue;
  if ('arrayValue' in v) return (v.arrayValue.values || []).map(ATTR_VALUE);
  return v;
};
function attrs(span) {
  const a = span.attributes;
  if (!a) return {};
  if (Array.isArray(a)) return Object.fromEntries(a.map((x) => [x.key, ATTR_VALUE(x.value)]));
  return a;
}
// OTLP nanosecond strings, numbers, SDK HrTime tuples [sec, nanos], ms numbers or ISO strings → epoch seconds
function seconds(v) {
  if (v == null || v === '' || v === '0') return null;
  if (Array.isArray(v)) return v[0] + v[1] / 1e9;
  if (typeof v === 'bigint') return Number(v / 1000n) / 1e6;
  if (typeof v === 'string' && /^\d+$/.test(v)) return v.length > 15 ? Number(BigInt(v) / 1000n) / 1e6 : Number(v) / 1e3;
  if (typeof v === 'string') return Date.parse(v) / 1000;
  if (v > 1e17) return v / 1e9;   // ns
  if (v > 1e14) return v / 1e6;   // µs
  if (v > 1e11) return v / 1e3;   // ms
  return v;                       // s
}
function flattenOtlp(input) {
  if (Array.isArray(input)) return input;
  const out = [];
  for (const rs of input.resourceSpans || []) for (const ss of rs.scopeSpans || rs.instrumentationLibrarySpans || []) out.push(...(ss.spans || []));
  return out;
}
const pick = (a, ...keys) => { for (const k of keys) if (a[k] != null && a[k] !== '') return a[k]; return undefined; };
const preview = (v, max = 280) => {
  if (v == null) return undefined;
  const s = typeof v === 'string' ? v : JSON.stringify(v);
  return s.length > max ? `${s.slice(0, max - 1)}…` : s;
};

/**
 * OpenTelemetry → spans. Accepts an OTLP/JSON export ({ resourceSpans: [...] }), an array of OTLP spans,
 * or SDK ReadableSpans. Understands the GenAI semantic conventions (gen_ai.*) and OpenInference (llm.*, input.value…).
 *
 * options.kind(span, attrs) / options.cost(span, attrs) / options.icon(span, attrs) override the defaults.
 */
export function fromOpenTelemetry(input, options = {}) {
  const spans = flattenOtlp(input);
  const ids = new Set(spans.map((s) => s.spanId || s.spanContext?.().spanId));
  return spans.map((sp) => {
    const a = attrs(sp);
    const id = sp.spanId || sp.spanContext?.().spanId;
    const parentId = sp.parentSpanId || sp.parentSpanContext?.spanId || sp.parentSpanId;
    const op = pick(a, 'gen_ai.operation.name', 'openinference.span.kind');
    const opl = String(op || '').toLowerCase();
    const kind = options.kind?.(sp, a) ?? (
      /agent|chain|invoke_agent|create_agent/.test(opl) ? 'agent'
        : /chat|text_completion|generate_content|llm|embeddings/.test(opl) ? 'model'
          : /tool|execute_tool|retriever/.test(opl) ? 'tool'
            : undefined);
    const model = pick(a, 'gen_ai.response.model', 'gen_ai.request.model', 'llm.model_name');
    const statusCode = sp.status?.code;
    const failed = statusCode === 2 || statusCode === 'STATUS_CODE_ERROR' || statusCode === 'ERROR';
    const tin = pick(a, 'gen_ai.usage.input_tokens', 'gen_ai.usage.prompt_tokens', 'llm.token_count.prompt');
    const tout = pick(a, 'gen_ai.usage.output_tokens', 'gen_ai.usage.completion_tokens', 'llm.token_count.completion');
    return {
      id,
      parentId: parentId && ids.has(parentId) ? parentId : null,
      kind,
      name: pick(a, 'gen_ai.agent.name', 'gen_ai.tool.name', 'tool.name') || sp.name,
      subtitle: kind === 'tool' ? pick(a, 'gen_ai.tool.description', 'server.address') : model,
      icon: options.icon?.(sp, a),
      start: seconds(sp.startTimeUnixNano ?? sp.startTime),
      end: seconds(sp.endTimeUnixNano ?? sp.endTime),
      status: failed ? 'error' : undefined,
      error: failed ? sp.status?.message || pick(a, 'error.type', 'exception.message') : undefined,
      cost: options.cost?.(sp, a) ?? pick(a, 'gen_ai.usage.cost', 'llm.cost.total'),
      tokensIn: tin != null ? Number(tin) : undefined,
      tokensOut: tout != null ? Number(tout) : undefined,
      input: preview(pick(a, 'input.value', 'gen_ai.prompt', 'gen_ai.tool.call.arguments', 'gen_ai.input.messages')),
      output: preview(pick(a, 'output.value', 'gen_ai.completion', 'gen_ai.tool.call.result', 'gen_ai.output.messages')),
    };
  });
}
