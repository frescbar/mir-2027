"""Create a self-contained private review package, without publishing any content."""
import json,sys,zipfile
from pathlib import Path
root=Path(__file__).resolve().parents[1]
bank=json.loads(Path(sys.argv[1]).read_text());inventory=json.loads(Path(sys.argv[2]).read_text());output=Path(sys.argv[3]);output.mkdir(parents=True,exist_ok=True)
payload={'version':bank['version'],'questions':bank['questions'],'media':bank['media'],'inventory':inventory}
text=json.dumps(payload,ensure_ascii=False,separators=(',',':')).replace('<','\\u003c').replace('\u2028','\\u2028').replace('\u2029','\\u2029')
html=(root/'scripts/review-template.html').read_text().replace('__REVIEW_DATA__',text)
page=output/'MIR27_revision_clinica.html';page.write_text(html)
archive=output/'MIR27_revision_clinica.zip'
with zipfile.ZipFile(archive,'w',zipfile.ZIP_DEFLATED) as z:
 z.write(page,page.name);z.write(Path(sys.argv[2]),'inventario_completo.json')
 z.writestr('LEEME.txt','MIR/27: revisión clínica independiente pendiente.\n\nAbre MIR27_revision_clinica.html en un navegador. Contiene todas las preguntas e imágenes disponibles, sin datos de progreso del usuario. Identifica al profesional. Cada decisión se conserva en memoria hasta exportarla con el botón; exporta antes de cerrar. Puedes recuperar el JSON exportado. Las decisiones de versiones antiguas se apartan.\n\nEl archivo no escribe en MIR/27 ni cambia las claves históricas. Antes de incorporar una revisión hay que comprobar la identidad y cualificación del firmante, contrastar las propuestas y verificar la versión de cada pregunta.\n')
print(json.dumps({'reviewQuestions':len(bank['questions']),'archive':str(archive.resolve()),'bytes':archive.stat().st_size}))
