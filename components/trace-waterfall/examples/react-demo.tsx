// React usage demo — bundled to examples/react.html by `npm run build:react-demo`.
import { useState } from 'react';
import { createRoot } from 'react-dom/client';
import { TraceWaterfall } from '../react/TraceWaterfall';
import type { Span } from '../src/index.js';
import { SPANS, ICONS } from '../demo/demo-data.js';

function App() {
  const [spans, setSpans] = useState<Span[]>(SPANS as Span[]);
  const [theme, setTheme] = useState<'light' | 'dark'>('light');
  const [opened, setOpened] = useState<string>('—');
  return (
    <div style={{ width: 'min(720px, 100%)', display: 'grid', gap: 12 }}>
      <div style={{ display: 'flex', gap: 8 }}>
        <button onClick={() => setTheme(theme === 'light' ? 'dark' : 'light')}>Toggle theme</button>
        <button onClick={() => setSpans((s) => s.filter((x) => x.parentId !== 'launcher' && x.id !== 'launcher'))}>Remove launcher</button>
        <span id="opened">Opened: {opened}</span>
      </div>
      <TraceWaterfall spans={spans} icons={ICONS} theme={theme} onOpen={(s) => setOpened(s.name)} />
    </div>
  );
}
createRoot(document.getElementById('root')!).render(<App />);
