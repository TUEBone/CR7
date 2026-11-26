"""Bundle the actual current entry point and every local resource into one HTML."""
from pathlib import Path
import base64
import mimetypes
import re
import sys

repo = Path(__file__).resolve().parents[1]
destination = Path(sys.argv[1]) if len(sys.argv) > 1 else repo.parent / 'CR7-Challenge-Offline.html'

def data_url(path):
    mime = mimetypes.guess_type(path.name)[0] or 'application/octet-stream'
    return 'data:' + mime + ';base64,' + base64.b64encode(path.read_bytes()).decode('ascii')

html = (repo / 'index.html').read_text()
source = (repo / 'js/game.js').read_text()
memory = (repo / 'js/memory.js').read_text().replace('export ', '')
source = source.replace('import {MemoryTable} from "./memory.js";', memory)
# Resolve local photos, sprites and home assets without an HTTP server.
resources = {f'../{path.relative_to(repo).as_posix()}': data_url(path)
             for folder in ('assets/home', 'assets/pets', 'assets/audio')
             for path in (repo / folder).iterdir() if path.suffix in ('.png', '.mp3')}
resources.update({f'../{path}': data_url(repo / path) for path in (
    'assets/sprites/messi/run_front.png', 'assets/messi-run-front-mask.png',
    'assets/memory-photos-1.webp', 'assets/memory-photos-2.webp',
)})
import json
source = 'const OFFLINE_ASSETS=' + json.dumps(resources) + ';\n' + source
source = source.replace('new URL(path,import.meta.url).href', 'OFFLINE_ASSETS[path]')
html = html.replace('<script type="module" src="./js/game.js"></script>',
                    '<script type="module">\n' + source + '\n</script>')
html = html.replace('<script src="./home-images-ac3bf84c8921.js"></script>',
                    '<script>\n' + (repo / 'home-images-ac3bf84c8921.js').read_text() + '\n</script>')
html = html.replace('<link rel="stylesheet" href="./enhancements.css">',
                    '<style>' + (repo / 'enhancements.css').read_text() + '</style>')
# Remaining football sheets are referenced by the current inline sprite map.
for path in sorted((repo / 'assets').rglob('*.png')):
    relative = './' + path.relative_to(repo).as_posix()
    if relative in html:
        html = html.replace(relative, data_url(path))
if re.search(r'<script[^>]+src=', html):
    raise RuntimeError('Unbundled external script remains')
destination.parent.mkdir(parents=True, exist_ok=True)
destination.write_text(html)
print(f'{destination}: {destination.stat().st_size / 1024 / 1024:.1f} MiB')
