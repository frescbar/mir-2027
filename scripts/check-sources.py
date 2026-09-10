"""Snapshot public references and propose a change queue; never edit medical answers.
Usage: python3 check-sources.py registry.json output-directory
The registry has a sources array with id, url, title and questionIds.
"""
import sys,json,hashlib,re,datetime,urllib.request,urllib.parse,ipaddress,difflib
from pathlib import Path
from html.parser import HTMLParser
class Text(HTMLParser):
 def __init__(self):super().__init__();self.skip=0;self.parts=[]
 def handle_starttag(self,t,a):
  if t in ('script','style','noscript'):self.skip+=1
 def handle_endtag(self,t):
  if t in ('script','style','noscript'):self.skip=max(0,self.skip-1)
 def handle_data(self,d):
  if not self.skip and d.strip():self.parts.append(d.strip())
def public_url(url):
 u=urllib.parse.urlsplit(url)
 if u.scheme!='https' or not u.hostname or u.username or u.password:raise ValueError('Expected a public HTTPS reference')
 if u.hostname.lower() in ('localhost','localhost.localdomain') or '.' not in u.hostname:raise ValueError('Local references are not allowed')
 try:ip=ipaddress.ip_address(u.hostname)
 except ValueError:return
 if not ip.is_global:raise ValueError('Private addresses are not allowed')
def main():
 registry=json.loads(Path(sys.argv[1]).read_text());folder=Path(sys.argv[2]);folder.mkdir(parents=True,exist_ok=True);results=[]
 for source in registry['sources']:
  record={**source,'checkedAt':datetime.datetime.now(datetime.timezone.utc).isoformat(),'clinicalStatus':'pending-review'}
  try:
   public_url(source['url'])
   req=urllib.request.Request(source['url'],headers={'User-Agent':'MIR27-reference-check/1.5'})
   with urllib.request.urlopen(req,timeout=20) as response:
    public_url(response.geturl());raw=response.read(12_000_001);mime=response.headers.get('Content-Type','')
   if len(raw)>12_000_000:raise ValueError('Reference exceeds 12 MB limit')
   if raw.startswith(b'%PDF'):
    import fitz
    doc=fitz.open(stream=raw,filetype='pdf');body='\n'.join(p.get_text() for p in doc)
   elif 'html' in mime:
    parser=Text();parser.feed(raw.decode('utf-8',errors='replace'));body='\n'.join(parser.parts)
   else:body=raw.decode('utf-8',errors='replace')
   body=re.sub(r'[ \t]+',' ',body).strip()
   if len(body)<200:raise ValueError('No usable reference text returned')
   digest=hashlib.sha256(body.encode()).hexdigest();path=folder/(source['id']+'.txt');old=path.read_text() if path.exists() else None
   record.update(status='baseline' if old is None else 'unchanged' if old==body else 'change-needs-review',contentSha256=digest,previousSha256=hashlib.sha256(old.encode()).hexdigest() if old is not None else None)
   if old is not None and old!=body:
    (folder/(source['id']+'-previous.txt')).write_text(old)
    (folder/(source['id']+'.diff')).write_text('\n'.join(difflib.unified_diff(old.splitlines(),body.splitlines(),fromfile='previous',tofile='current')))
   path.write_text(body)
  except Exception as e:record.update(status='unavailable',error=str(e)[:240])
  results.append(record)
 (folder/'results.json').write_text(json.dumps({'sources':results,'notice':'A changed page is a review candidate, not proof of changed clinical guidance. Unavailable sources are not marked current.'},ensure_ascii=False,indent=2))
 print(json.dumps({'checked':len(results),'statuses':{k:sum(r['status']==k for r in results) for k in sorted(set(r['status'] for r in results))}}))
if __name__=='__main__':main()
