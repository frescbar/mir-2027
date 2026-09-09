"""Validate private documentary reconciliation without publishing its content."""
import argparse,base64,collections,io,json,pathlib,re
from PIL import Image

def verify(bank,baseline=None):
    questions=bank['questions'];by_id={q['id']:q for q in questions}
    assert len(by_id)==len(questions),'Duplicate IDs'
    for q in questions:
        for image_id in q.get('images',[])+q.get('commentaryImages',[])+q.get('context',{}).get('images',[]):
            assert image_id in bank['media'],('Missing image',q['id'],image_id)
        if q.get('eligible'):
            assert not q.get('isAnnulled') and not q.get('sourceDiscrepancy') and not q.get('flags'),q['id']
            assert q.get('status') not in ['requiere_revision','imagen_pendiente','duplicado_documental'],q['id']
            assert not q.get('imageRequired') or q.get('images') or q.get('image'),q['id']
        if q.get('duplicateOf'):
            target=by_id[q['duplicateOf']]
            assert target.get('eligible') and not target.get('duplicateOf'),q['id']
            assert q['id'] in target.get('equivalentIds',[]),q['id']
        comments=q.get('sourceCommentaries') or [{'text':q.get('commentary','')}]
        for evidence in q.get('optionEvidence',[]):
            assert 0<=evidence['optionIndex']<len(q['options']),q['id']
            assert any(evidence['text'] in re.sub(r'\s+',' ',c.get('text','')).strip() for c in comments),q['id']
    for image_id,media in bank['media'].items():
        raw=base64.b64decode(media['data'].split(',',1)[1],validate=True)
        with Image.open(io.BytesIO(raw)) as image:image.verify()
    if baseline:
        before={q['id']:q for q in baseline['questions']}
        assert before.keys()==by_id.keys(),'Question identity changed'
        for q in questions:assert q['answer']==before[q['id']]['answer'],('Answer changed',q['id'])
    return {'questions':len(questions),'eligible':sum(bool(q.get('eligible')) for q in questions),'images':len(bank['media']),'statuses':dict(collections.Counter(q['status'] for q in questions)),'allImageReferencesResolve':True,'allMediaDecode':True,'allOptionExcerptsAreLiteral':True,'answerKeysUnchanged':bool(baseline)}

if __name__=='__main__':
    parser=argparse.ArgumentParser();parser.add_argument('bank');parser.add_argument('--baseline');args=parser.parse_args()
    print(json.dumps(verify(json.loads(pathlib.Path(args.bank).read_text()),json.loads(pathlib.Path(args.baseline).read_text()) if args.baseline else None),ensure_ascii=False))
