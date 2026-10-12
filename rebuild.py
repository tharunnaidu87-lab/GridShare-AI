from pathlib import Path
root = Path(__file__).resolve().parent
src = root / 'source'
html = (src / 'layout.html').read_text(encoding='utf-8')
for token, filename in [('STYLE', 'style.css'), ('ENGINE', 'engine.js'), ('APP', 'app.js')]:
    html = html.replace('/*' + token + '*/', (src / filename).read_text(encoding='utf-8'))
(root / 'OPEN_GRIDSHARE.html').write_text(html, encoding='utf-8')
print('Built OPEN_GRIDSHARE.html')
