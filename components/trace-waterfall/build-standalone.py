"""Bundle index.html + src + demo into standalone.html (opens from file://, no server)."""
import re, pathlib
d = pathlib.Path(__file__).parent
css = (d / 'src/trace-waterfall.css').read_text()
lib = (d / 'src/trace-waterfall.js').read_text()
data = (d / 'demo/demo-data.js').read_text()
strip = lambda s: re.sub(r'^export (default \w+;|(?=const|class|function))', '', s, flags=re.M)
page = (d / 'index.html').read_text()
page = page.replace('<link rel="stylesheet" href="./src/trace-waterfall.css" />', f'<style>\n{css}\n</style>')
page = re.sub(r"import \{ TraceWaterfall, DEFAULTS \} from './src/trace-waterfall.js';\nimport \{ SPANS, ICONS \} from './demo/demo-data.js';",
              lambda m: strip(lib) + '\n' + strip(data), page)
assert 'import {' not in page, 'imports left in standalone'
(d / 'standalone.html').write_text(page)
print('standalone.html', len(page), 'bytes')
