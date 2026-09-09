"""Build a self-contained private study copy outside the public repository."""
import json, re, sys
from pathlib import Path
ROOT=Path(__file__).resolve().parents[1]
bank=json.loads(Path(sys.argv[1]).read_text())
for source in bank.get('sources', []):
    source['originalIncluded']=False
html=(ROOT/'docs/index.html').read_text()
css=(ROOT/'docs/styles-v1.css').read_text()
html=re.sub(r'<link rel="stylesheet"[^>]+>',lambda _: '<style>'+css+'</style>',html)
html=re.sub(r'<link rel="(?:icon|manifest)"[^>]+>','',html)
payload=json.dumps(bank,ensure_ascii=False,separators=(',',':')).replace('<','\\u003c').replace('\u2028','\\u2028').replace('\u2029','\\u2029')
inline='<script id="mir-private-bank" type="application/json">'+payload+'</script><script>window.MIR_PRIVATE_BANK=JSON.parse(document.getElementById("mir-private-bank").textContent);</script>'
html=re.sub(r'(?=<script src="\./core-v1\.js\?)',lambda _:inline,html,count=1)
html=re.sub(r'<script src="\./([^?]+)\?[^\"]+"></script>',lambda m:'<script>'+(ROOT/'docs'/m[1]).read_text()+'</script>',html)
Path(sys.argv[2]).write_text(html)
print(json.dumps({'file':str(Path(sys.argv[2]).resolve()),'bytes':len(html.encode()),'questions':len(bank['questions'])}))
