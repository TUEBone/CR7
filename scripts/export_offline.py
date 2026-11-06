"""Export the static game as one HTML file using the original PNG bytes."""
from pathlib import Path
import base64
import json
import re
import sys

repo = Path(__file__).resolve().parents[1]
destination = Path(sys.argv[1]) if len(sys.argv) > 1 else repo.parent / 'CR7-Challenge-Offline.html'
images = {}
for image in sorted((repo / 'assets/sprites').glob('*/*.png')):
    key = str(image.relative_to(repo / 'assets/sprites').with_suffix(''))
    images[key] = 'data:image/png;base64,' + base64.b64encode(image.read_bytes()).decode('ascii')
code = ['const INLINE_SPRITES = ' + json.dumps(images, separators=(',', ':')) + ';']
for name in ['models', 'save', 'sprites', 'renderer', 'app']:
    source = (repo / f'js/{name}.js').read_text()
    source = re.sub(r'^import .*?;\n', '', source, flags=re.MULTILINE)
    source = re.sub(r'\bexport\s+', '', source)
    source = source.replace('new URL(`../assets/sprites/${key}.png`, import.meta.url).href', 'INLINE_SPRITES[key]')
    code.append(source)
sticker = 'data:image/png;base64,' + base64.b64encode((repo / 'assets/stickers/ronaldo.png').read_bytes()).decode('ascii')
script = '\n'.join(code).replace('./assets/stickers/ronaldo.png', sticker)
html = (repo / 'index.html').read_text()
html = html.replace('<link rel="stylesheet" href="./style.css">', '<style>' + (repo / 'style.css').read_text() + '</style>')
html = html.replace('<script type="module" src="./js/app.js"></script>', '<script type="module">\n' + script + '\n</script>')
destination.parent.mkdir(parents=True, exist_ok=True)
destination.write_text(html)
print(f'{destination}: {destination.stat().st_size / 1024 / 1024:.1f} MiB, {len(images)} echte PNG-Sheets eingebettet')
