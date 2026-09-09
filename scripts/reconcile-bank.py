"""Reconcile supplied PDFs with a private MIR bank, keeping an audit of changes."""
import argparse,base64,collections,hashlib,json,pathlib,re,unicodedata
import fitz

DATE='2026-09-09'
SOURCE_FILES={**{'asturias-documento-'+y:y+'.pdf' for y in ['2010','2012','2013','2014','2015','2016','2018','2019']},'asturias-documento-2020':'781408653-MIR-2020-Oviedo.pdf','asturias-documento-2021':'781409136-MIR-2021-Oviedo.pdf','asturias-documento-2022':'676584722-mir-2022-comentado.pdf'}
def norm(text):
    text=re.sub(r'Pregunta\s+(?:vinculada|asociada)\s+a\s+la\s+imagen\s*(?:n[ºo°.\s]*)?\d+\.?','',text,flags=re.I)
    return re.sub(r'[^a-z0-9]','',unicodedata.normalize('NFKD',text.lower()).encode('ascii','ignore').decode())
def valid(q):
    return len(q.get('stem','').strip())>=8 and len(q.get('options',[])) in (4,5) and all(isinstance(o,str) and o.strip() for o in q['options']) and isinstance(q.get('answer'),int) and 0<=q['answer']<len(q['options'])
def can_practice(q):
    return valid(q) and not q.get('isAnnulled') and not q.get('sourceDiscrepancy') and q.get('status') not in ['requiere_revision','imagen_pendiente','duplicado_documental','retired'] and (not q.get('imageRequired') or bool(q.get('images')))
def option_evidence(q):
    result=[];seen=set()
    sources=q.get('sourceCommentaries') or [{'text':q.get('commentary',''),'sourceId':(q.get('references') or [{}])[0].get('id'),'pdfPage':(q.get('references') or [{}])[0].get('pdfPage')}]
    for source in sources:
        text=re.sub(r'\s+',' ',source.get('text','')).strip()
        for match in re.finditer(r'\b(?:respuesta|opci[oó]n)(?:s|es)?\s+([1-5])\b',text,re.I):
            original_index=int(match[1])-1
            original_options=source.get('options') or q['options']
            if original_index>=len(original_options):continue
            matches=[i for i,option in enumerate(q['options']) if norm(option)==norm(original_options[original_index])]
            if len(matches)!=1:continue
            index=matches[0]
            left=max(text.rfind('. ',0,match.start()),text.rfind('? ',0,match.start()),text.rfind('! ',0,match.start()))+2
            if left<2:left=0
            if match.start()-left<35:
                previous=text.rfind('. ',0,max(0,left-2));left=previous+2 if previous>=0 else 0
            end=text.find('. ',match.end());end=len(text) if end<0 else end+1
            quote=text[left:end].strip()
            if len(quote)<45 or len(quote)>1100:continue
            key=(index,quote)
            if key in seen:continue
            seen.add(key);result.append({'optionIndex':index,'text':quote,'sourceId':source.get('sourceId'),'pdfPage':source.get('pdfPage'),'type':'source_excerpt'})
    return result

def run(bank,index,sources):
    audit={'date':DATE,'changes':[],'unresolved':[]};counts=collections.Counter();docs={}
    def note(q,kind,**details):audit['changes'].append({'id':q['id'],'kind':kind,**details});counts[kind]+=1
    def image(source,picture):
        signature=f"{source}|{picture['page']}|{picture['xref']}|{picture['rect']}"
        image_id='pdf12-'+hashlib.sha256(signature.encode()).hexdigest()[:24]
        if image_id not in bank['media']:
            doc=docs.setdefault(source,fitz.open(sources/SOURCE_FILES[source]));page=doc[picture['page']-1]
            pix=page.get_pixmap(matrix=fitz.Matrix(2,2),clip=fitz.Rect(picture['rect']),alpha=False)
            data=pix.tobytes('jpeg',jpg_quality=92)
            if len(data)>1600000:data=pix.tobytes('jpeg',jpg_quality=80)
            if len(data)>1750000:raise ValueError('Image too large: '+image_id)
            bank['media'][image_id]={'id':image_id,'data':'data:image/jpeg;base64,'+base64.b64encode(data).decode(),'mime':'image/jpeg','width':pix.width,'height':pix.height,'sourceId':source,'pdfPage':picture['page'],'alt':f"Imagen del documento, página PDF {picture['page']}",'title':f"{source} · PDF p. {picture['page']}",'documentReview':{'method':'pdf_layout_before_or_after_solution','date':DATE,'rect':picture['rect']}}
            counts['media_recovered']+=1
        return image_id
    for q in bank['questions']:
        q['images']=list(dict.fromkeys(q.get('images') or []))
        refs=q.get('references') or [];source=refs[0].get('id') if refs else None;number=str(q.get('number'))
        if source=='asturias-documento-2015' and any('Extracción con repeticiones' in f for f in q.get('flags',[])):
            recovered=index['text2015'].get(number)
            if recovered and valid(recovered) and recovered['answer']==q.get('answer') and len(recovered['options'])==len(q['options']):
                for key in ['stem','options','commentary']:q[key]=recovered[key]
                for comment in q.get('sourceCommentaries',[]):
                    if comment.get('sourceId')==source:
                        comment['text']=recovered['commentary'];comment['options']=recovered['options'][:]
                if q.get('concept')==q.get('sourceSubject'):q['concept']=q['subject']
                q['flags']=[f for f in q.get('flags',[]) if 'Extracción con repeticiones' not in f]
                q['documentReview']={'date':DATE,'method':'deduplicated_pdf_glyphs','sourceId':source,'pdfPage':recovered['pdfPage'],'answerUnchanged':True}
                if not q['flags'] and not q.get('isAnnulled') and not q.get('sourceDiscrepancy'):q['status']='historico_documental'
                note(q,'text_reextracted',pdfPage=recovered['pdfPage'])
        record=index.get('images',{}).get(source,{}).get(number)
        if not record or not record['question']:
            for ref in refs:
                alternate=index.get('images',{}).get(ref.get('id'),{}).get(str(ref.get('numberInSource')))
                comment=next((c for c in q.get('sourceCommentaries',[]) if c.get('sourceId')==ref.get('id') and c.get('numberInSource')==ref.get('numberInSource')),None)
                matching=comment and sorted(map(norm,comment.get('options',[])))==sorted(map(norm,q['options'])) and isinstance(comment.get('answer'),int) and comment['answer']>=0 and norm(comment['options'][comment['answer']])==norm(q['options'][q['answer']]) if valid(q) else False
                if alternate and alternate['question'] and matching:
                    source=ref['id'];number=str(ref['numberInSource']);record=alternate;break
        if record:
            pictures=record['question'];link=record.get('linkedImageNumber')
            if link is not None:q['imageRequired']=True
            if not pictures and link is not None:
                donors=[r for r in index['images'][source].values() if r.get('linkedImageNumber')==link and r['question']]
                if len(donors)==1:pictures=donors[0]['question']
            new_images=[image(source,p) for p in pictures]
            if new_images:
                was_missing=not q['images'];q['images']=list(dict.fromkeys(new_images));q['imageRequired']=True
                q['imageReview']={'date':DATE,'method':'question_region_before_solution','sourceId':source,'numberInSource':int(number)}
                q['flags']=[f for f in q.get('flags',[]) if f!='imagen_pendiente_de_vincular']
                if q.get('status')=='imagen_pendiente':q['status']='historico_documental'
                note(q,'missing_image_recovered' if was_missing else 'image_placement_checked')
            elif q.get('imageRequired') and not q['images']:
                if 'imagen_pendiente_de_vincular' not in q.get('flags',[]):q.setdefault('flags',[]).append('imagen_pendiente_de_vincular')
                if q.get('status')=='historico_documental':q['status']='imagen_pendiente'
            q['commentaryImages']=list(dict.fromkeys(image(source,p) for p in record['commentary']))
        q['eligible']=can_practice(q)
    # Transfer images only between identical normalized stems, identical options and identical answer text.
    groups=collections.defaultdict(list)
    for q in bank['questions']:
        if valid(q):groups[(norm(q['stem']),tuple(sorted(norm(o) for o in q['options'])))].append(q)
    for group in groups.values():
        answers={norm(q['options'][q['answer']]) for q in group}
        if len(answers)>1:
            for q in group:q['sourceDiscrepancy']=True;q['eligible']=False;q['status']='requiere_revision';note(q,'answer_discrepancy')
            continue
        donors=[q for q in group if q.get('images') and q.get('imageReview')]
        if donors:
            donor=donors[0]
            for q in group:
                if q.get('imageRequired') and not q.get('images'):
                    q['images']=donor['images'][:];q['imageReview']={'date':DATE,'method':'identical_stem_options_answer','fromQuestion':donor['id']}
                    q['references']+= [r for r in donor.get('references',[]) if r not in q['references']]
                    q['flags']=[f for f in q.get('flags',[]) if f!='imagen_pendiente_de_vincular']
                    if q['status']=='imagen_pendiente':q['status']='historico_documental'
                    q['eligible']=can_practice(q);note(q,'identical_question_image_linked',fromQuestion=donor['id'])
        active=[q for q in group if q['eligible']]
        if len(active)>1:
            canonical=max(active,key=lambda q:(bool(q.get('documentReview')),bool(q.get('images')),len(q.get('commentary',''))))
            canonical['equivalentIds']=[q['id'] for q in group if q is not canonical]
            family='documental-'+hashlib.sha256(norm(canonical['stem']).encode()).hexdigest()[:24]
            for q in group:q['family']=family
            for q in active:
                if q is canonical:continue
                q['duplicateOf']=canonical['id'];q['eligible']=False;q['status']='duplicado_documental';note(q,'duplicate_grouped',canonical=canonical['id'])
                for ref in q.get('references',[]):
                    if ref not in canonical['references']:canonical['references'].append(ref)
                for comment in q.get('sourceCommentaries',[]):
                    if comment not in canonical.setdefault('sourceCommentaries',[]):canonical['sourceCommentaries'].append(comment)
    for q in bank['questions']:
        evidence=option_evidence(q)
        if evidence:q['optionEvidence']=evidence;counts['questions_with_option_evidence']+=1;counts['options_with_evidence']+=len({x['optionIndex'] for x in evidence})
        q['versionHash']=hashlib.sha256(json.dumps({k:q.get(k) for k in ['stem','options','answer','commentary','images']},ensure_ascii=False,sort_keys=True).encode()).hexdigest()[:16]
        if not q['eligible'] and not q.get('duplicateOf'):audit['unresolved'].append({'id':q['id'],'status':q['status'],'flags':q.get('flags',[])})
    bank['version']='1.2.0';bank['manifest'].update({'version':'1.2.0','preparedAt':DATE,'images':len(bank['media']),'questionsWithImages':sum(bool(q.get('images')) for q in bank['questions']),'atlasCards':sum(bool(q.get('images')) and not q.get('duplicateOf') for q in bank['questions']),'eligibleQuestions':sum(q['eligible'] for q in bank['questions']),'pendingQuestions':sum(not q['eligible'] and not q.get('duplicateOf') for q in bank['questions']),'duplicateQuestions':sum(bool(q.get('duplicateOf')) for q in bank['questions']),'byStatus':dict(collections.Counter(q['status'] for q in bank['questions'])),'qualityAudit':dict(counts)})
    audit['counts']=dict(counts);audit['manifest']=bank['manifest'];return bank,audit

if __name__=='__main__':
    parser=argparse.ArgumentParser();parser.add_argument('bank');parser.add_argument('index');parser.add_argument('sources');parser.add_argument('output');parser.add_argument('audit');args=parser.parse_args()
    bank,audit=run(json.loads(pathlib.Path(args.bank).read_text()),json.loads(pathlib.Path(args.index).read_text()),pathlib.Path(args.sources))
    pathlib.Path(args.output).write_text(json.dumps(bank,ensure_ascii=False,separators=(',',':')))
    pathlib.Path(args.audit).write_text(json.dumps(audit,ensure_ascii=False,indent=2))
    print(json.dumps({'counts':audit['counts'],'manifest':bank['manifest']},ensure_ascii=False),flush=True)
