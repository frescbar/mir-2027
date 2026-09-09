"""Prepare an existing private bank without adding clinical claims or source text.

The input and output files must stay outside the public repository.
"""
import collections, hashlib, json, re, sys, unicodedata
from pathlib import Path

def key(text):
    return ''.join(c for c in unicodedata.normalize('NFD', text.upper()) if unicodedata.category(c) != 'Mn')

SUBJECTS = {
    'CARDIOLOGIA':'Cardiología y Cirugía Cardiovascular', 'DIGESTIVO':'Digestivo y Cirugía General',
    'NEUMOLOGIA':'Neumología y Cirugía Torácica', 'NEUROLOGIA':'Neurología y Neurocirugía',
    'INFECCIOSAS':'Infecciosas y Microbiología', 'MICROBIOLOGIA':'Infecciosas y Microbiología',
    'GINECOLOGIA':'Ginecología y Obstetricia', 'TRAUMATOLOGIA':'Traumatología y Cirugía Ortopédica',
    'PREVENTIVA':'Medicina Preventiva', 'MEDICINA PREVENTIVA':'Medicina Preventiva',
    'ANATOMIA PATOLOGICA':'Anatomía Patológica', 'A. PATOLOGICA':'Anatomía Patológica',
    'CUIDADOS PALIATIVOS':'Cuidados Paliativos', 'PALIATIVOS':'Cuidados Paliativos',
    'VASCULAR':'Cirugía Vascular', 'C. VASCULAR':'Cirugía Vascular',
    'PLASTICA':'Cirugía Plástica', 'CIRUGIA PLASTICA':'Cirugía Plástica',
}
for name in ['Endocrinología','Pediatría','Nefrología','Psiquiatría','Hematología','Reumatología','Dermatología','Urología','Oftalmología','Otorrinolaringología','Inmunología','Farmacología','Fisiología','Anatomía','Genética','Oncología','Urgencias','Gestión','Anestesia','Geriatría','Medicina Legal','Comunicación']:
    SUBJECTS[key(name)] = name

def canonical_subject(text):
    normalized = key(text)
    for label in sorted(SUBJECTS, key=len, reverse=True):
        if re.search(r'(?<![A-Z])'+re.escape(label)+r'(?![A-Z])', normalized):
            return SUBJECTS[label]
    return text

def prepare(bank):
    changes = collections.Counter()
    for group in ['questions','readings','flashcards','atlas']:
        for item in bank[group]:
            if item.get('subject'):
                original=item['subject']; canonical=canonical_subject(original)
                if canonical!=original:
                    item['sourceSubject']=original;item['subject']=canonical;changes['normalizedSubjects']+=1
    for q in bank['questions']:
        # A next-question heading is a source extraction boundary, never part of this answer.
        def trim(text):
            m=re.search(r'\n\s*(?:Pregunta\s*)+\d{4,}\s*:',text)
            if m and m.start()>120:
                changes['trimmedNextQuestionHeadings']+=1
                return text[:m.start()].rstrip()
            return text
        q['commentary']=trim(q.get('commentary',''))
        for c in q.get('sourceCommentaries',[]): c['text']=trim(c.get('text',''))
        lines=[x.strip() for x in q['stem'].splitlines() if x.strip()]
        repetitions=sum(a==b and len(a)>3 for a,b in zip(lines,lines[1:]))
        if repetitions>=3 or len(q['stem'])>6000 or len(q['commentary'])>15000:
            q.setdefault('flags',[]).append('Extracción con repeticiones o extensión anómala; cotejar el documento original.')
            q['status']='requiere_revision';q['eligible']=False;changes['quarantinedExtraction']+=1
        q['versionHash']=hashlib.sha256(json.dumps({k:q.get(k) for k in ['stem','options','answer','commentary','status']},ensure_ascii=False,sort_keys=True).encode()).hexdigest()[:16]
    stats={}
    for q in bank['questions']:
        k=(q['subject'],q.get('topic') or 'Sin tema específico');s=stats.setdefault(k,{'subject':k[0],'topic':k[1],'count':0,'years':set()})
        s['count']+=1
        if q.get('year'):s['years'].add(q['year'])
    bank['topicStats']=[{**s,'years':sorted(s['years']),'distinctYears':len(s['years'])} for s in stats.values()]
    bank['manifest'].update({'preparedAt':'2026-09-09','preparation':dict(changes),'eligibleQuestions':sum(bool(q.get('eligible')) for q in bank['questions']),'pendingQuestions':sum(not q.get('eligible') for q in bank['questions']),'byStatus':dict(collections.Counter(q['status'] for q in bank['questions']))})
    return bank

if __name__=='__main__':
    bank=prepare(json.loads(Path(sys.argv[1]).read_text()))
    Path(sys.argv[2]).write_text(json.dumps(bank,ensure_ascii=False,separators=(',',':')))
    print(json.dumps(bank['manifest'],ensure_ascii=False))
