"""Append ?v=<content hash> to local asset URLs in the demo pages so browsers never serve stale CSS/JS."""
import hashlib, pathlib, re
d = pathlib.Path(__file__).parent
def stamp(page):
    p = d / page
    html = p.read_text()
    def repl(m):
        attr, url = m.group(1), m.group(2)
        f = (p.parent / url).resolve()
        if not f.exists(): return m.group(0)
        h = hashlib.sha1(f.read_bytes()).hexdigest()[:8]
        return f'{attr}"{url}?v={h}"'
    html = re.sub(r'((?:href|src)=)"(\.{1,2}/[^"?]+\.(?:css|js))(?:\?v=[0-9a-f]+)?"', repl, html)
    p.write_text(html)
for page in ['index.html', 'examples/live.html', 'examples/react.html']: stamp(page)
print('stamped')
