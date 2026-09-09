"""Recover documentary text and image placement; never infer clinical answers."""
import argparse, base64, collections, hashlib, json, pathlib, re
import fitz
import pdfplumber

def clean(text):
    lines=[line for line in text.splitlines() if not re.match(r'^\s*(?:Curso\b|ensivo MIR Asturias|Examen MIR \d|\d{1,3}\s*$)',line)]
    text='\n'.join(lines)
    text=re.sub(r'(?<=[A-Za-zÀ-ÿ])-\s*\n(?=[A-Za-zÀ-ÿ])','',text)
    return re.sub(r'\s+',' ',text).strip()

def reextract_2015(path):
    chunks=[]; offsets=[]; cursor=0
    with pdfplumber.open(path) as doc:
        for number,page in enumerate(doc.pages,1):
            page=page.dedupe_chars(tolerance=1)
            for left,right in [(0,page.width/2),(page.width/2,page.width)]:
                text=page.crop((left,45,right,page.height-30)).extract_text(x_tolerance=2,y_tolerance=2) or ''
                text='\n'.join(line for line in text.splitlines() if not re.match(r'^\s*(?:Curso\b|ensivo MIR Asturias|Examen MIR \d|\d{1,3}\s*$)',line))
                chunks.append(text);offsets.append((cursor,number));cursor+=len(text)+1
    text='\n'.join(chunks);headers=list(re.finditer(r'Pregunta\s+\(?\d+\)?\s*:\s*\((\d+)\)',text));out={}
    for i,h in enumerate(headers):
        part=text[h.end():headers[i+1].start() if i+1<len(headers) else len(text)]
        key=re.search(r'Soluci[oó]n\s*:\s*([0-5])\b',part,re.I)
        if not key:continue
        before=part[:key.start()];options=list(re.finditer(r'(?m)^\s*([1-5])\.\s+',before))
        if [int(m[1]) for m in options] not in [[1,2,3,4],[1,2,3,4,5]]:continue
        stem=clean(before[:options[0].start()]);vals=[]
        for j,m in enumerate(options):
            value=before[m.end():options[j+1].start() if j+1<len(options) else len(before)]
            value=re.split(r'(?m)^\s*\d{5,7}\b',value)[0]
            vals.append(clean(value))
        commentary=part[key.end():];commentary=re.split(r'Pregunta vinculada a la imagen',commentary,flags=re.I)[0]
        page=max((x for x in offsets if x[0]<=h.start()),key=lambda x:x[0])[1]
        out[int(h[1])]={'stem':stem,'options':vals,'answer':int(key[1])-1 if int(key[1]) else None,'commentary':clean(commentary),'pdfPage':page}
    return out

def image_positions(path,source_id):
    doc=fitz.open(path);out={};current=None;phase=None;linked=None
    for page_number,page in enumerate(doc,1):
        events=[]
        for block in page.get_text('dict')['blocks']:
            for line in block.get('lines',[]):
                text=''.join(s['text'] for s in line['spans']);x0,y0,x1,y1=line['bbox']
                events.append((0 if (x0+x1)/2<page.rect.width/2 else 1,y0,0,text,None))
        seen=set();tiles=[]
        for raw in page.get_images(full=True):
            xref=raw[0]
            for rect in page.get_image_rects(xref):
                signature=(xref,tuple(round(x,1) for x in rect))
                if signature in seen:continue
                seen.add(signature)
                tiles.append(([xref],rect))
        # Some PDFs store a single photograph as many narrow adjacent strips.
        # Reassemble aligned, touching tiles before applying the size threshold.
        changed=True
        while changed:
            changed=False
            for i,(ids,a) in enumerate(tiles):
                for j in range(i+1,len(tiles)):
                    other,b=tiles[j]
                    vertical=abs(a.x0-b.x0)<1 and abs(a.x1-b.x1)<1 and min(abs(a.y1-b.y0),abs(b.y1-a.y0))<1
                    horizontal=abs(a.y0-b.y0)<1 and abs(a.y1-b.y1)<1 and min(abs(a.x1-b.x0),abs(b.x1-a.x0))<1
                    if vertical or horizontal:
                        tiles[i]=(ids+other,a|b);tiles.pop(j);changed=True;break
                if changed:break
        for ids,rect in tiles:
            if rect.width<65 or rect.height<45:continue
            events.append((0 if (rect.x0+rect.x1)/2<page.rect.width/2 else 1,rect.y0,1,'',('-'.join(map(str,sorted(ids))),rect)))
        for col,y,typ,text,picture in sorted(events,key=lambda x:(x[0],x[1],x[2])):
            if typ==0:
                marker=re.search(r'Pregunta vinculada a la imagen\s*n[ºo°.]*\s*(\d+|l)\b',text,re.I)
                if marker:linked=1 if marker[1].lower()=='l' else int(marker[1])
                h=re.search(r'Pregunta\s+\(?\d+\)?\s*:\s*\((\d+)\)',text)
                if h:
                    current=int(h[1]);phase='question';out.setdefault(current,{'question':[],'commentary':[],'pdfPage':page_number,'linkedImageNumber':linked});linked=None
                if re.search(r'Soluci[oó]n\s*:',text,re.I):phase='commentary'
                continue
            if current is None or phase is None:continue
            xref,rect=picture
            out[current][phase].append({'page':page_number,'xref':xref,'rect':list(rect)})
    return out

if __name__=='__main__':
    parser=argparse.ArgumentParser();parser.add_argument('sources');parser.add_argument('output');args=parser.parse_args()
    root=pathlib.Path(args.sources);result={'text2015':{},'images':{}}
    for filename,source in [('2010.pdf','asturias-documento-2010'),('2012.pdf','asturias-documento-2012'),('2013.pdf','asturias-documento-2013'),('2014.pdf','asturias-documento-2014'),('2015.pdf','asturias-documento-2015'),('676584722-mir-2022-comentado.pdf','asturias-documento-2022')]:
        path=root/filename
        if not path.exists():continue
        result['images'][source]=image_positions(path,source)
        print(json.dumps({'source':source,'image_records':len(result['images'][source])}),flush=True)
    if (root/'2015.pdf').exists():result['text2015']=reextract_2015(root/'2015.pdf')
    pathlib.Path(args.output).write_text(json.dumps(result,ensure_ascii=False,indent=2))
    print(json.dumps({'reextracted_2015':len(result['text2015']),'output':args.output}),flush=True)
