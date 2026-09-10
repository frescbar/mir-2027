/* Explicit learning checks. No medical content or user data is bundled here. */
(function(root,factory){const api=factory(typeof module==='object'&&module.exports?require('./core-v1.js'):root.MIRCore);if(typeof module==='object'&&module.exports)module.exports=api;else root.MIRLearning=api;})(globalThis,function(C){
'use strict';
const CAUSES={knowledge:{label:'No lo sabía',advice:'Estudia la idea clave y aplícala después en otro caso.'},confusion:{label:'Confundí diagnósticos',advice:'Compara las dos alternativas y localiza el dato que las separa.'},reading:{label:'Leí mal el enunciado',advice:'Identifica qué pide la pregunta, las negaciones y las unidades antes de elegir.'},calculation:{label:'Fallé el cálculo',advice:'Escribe la fórmula, convierte las unidades y comprueba el orden de magnitud.'}};
function classify(s,id,cause,at=Date.now()){
 const a=s.attempts.find(a=>a.id===id);
 if(!a||a.kind!=='question'||a.scored===false||a.correct!==false||!Object.hasOwn(CAUSES,cause))return false;
 (s.errorReviews??={})[id]={cause,at};return true;
}
function errorProfile(s){
 const counts=Object.fromEntries(Object.keys(CAUSES).map(k=>[k,0]));let unknown=0;
 const errors=s.attempts.filter(a=>a.kind==='question'&&a.scored!==false&&a.correct===false);
 for(const a of errors){const c=s.errorReviews?.[a.id]?.cause;if(Object.hasOwn(counts,c))counts[c]++;else unknown++;}
 return{counts,unknown,total:errors.length};
}
function expose(s,key,kind='study',at=Date.now()){
 if(!key)return;const old=s.conceptExposures?.[key];
 if(!old||old.at<at)(s.conceptExposures??={})[key]={at,kind};
}
function preciseKey(q){return q?.learningConcept||q?.memory?.concept||null;}
function queue(bank,s,now=Date.now()){
 const map=new Map(bank.questions.map(q=>[q.id,q])),knownKeys=new Set(bank.questions.map(preciseKey).filter(Boolean)),groups=new Map(),seen=new Set(),reserved=new Set();
 for(const a of s.attempts){const q=map.get(a.itemId);if(q)seen.add(C.family(q));const key=preciseKey(q)||(!q&&knownKeys.has(a.concept)?a.concept:null);if(!key||a.kind!=='question'||a.scored===false)continue;if(!groups.has(key))groups.set(key,[]);groups.get(key).push(a);}
 for(const session of Object.values(s.sessions))if(session.status!=='complete')for(const item of session.items||[]){if(item.data){seen.add(C.family(item.data));const key=preciseKey(item.data);if(key)reserved.add(key);}}
 return [...groups].map(([key,attempts])=>{
  attempts.sort((a,b)=>a.at-b.at);const last=attempts.at(-1),q=map.get(last.itemId),lastCheck=attempts.filter(a=>a.retention?.valid).at(-1);
  const latestFailure=attempts.filter(a=>!a.correct||a.help||a.confidence!=='sure').at(-1);
  const advance=lastCheck?.correct&&lastCheck.confidence==='sure'&&!lastCheck.help&&(!latestFailure||latestFailure.at<lastCheck.at);
  const stageDays=advance?30:7,anchorAt=Math.max(last.at,s.conceptExposures?.[key]?.at||0),dueAt=anchorAt+stageDays*C.DAY;
  const candidates=C.uniqueQuestions(bank.questions.filter(x=>C.eligible(x)&&preciseKey(x)===key&&!seen.has(C.family(x))));
  const candidate=C.shuffled(candidates,'delayed-'+key+'-'+anchorAt).sort((a,b)=>Number(!a.transfer)-Number(!b.transfer))[0];
  return{key,label:q?.memory?.front||q?.topic||key,subject:q?.subject,stageDays,anchorAt,dueAt,ready:dueAt<=now&&!reserved.has(key)&&!!candidate,blocked:reserved.has(key)?'session':!candidate?'cases':null,item:candidate?{id:candidate.id,kind:'question',reason:'Comprobar recuerdo sin pista',retention:{concept:key,stageDays,anchorAt,family:C.family(candidate)}}:null,lastCheck:lastCheck?{at:lastCheck.at,stageDays:lastCheck.retention.stageDays,correct:lastCheck.correct,confidence:lastCheck.confidence}:null};
 }).sort((a,b)=>a.dueAt-b.dueAt);
}
function validateCheck(s,item,at){
 const r=item.retention;if(!r)return null;
 const recent=s.conceptExposures?.[r.concept]?.at||0;
 const seen=s.attempts.some(a=>a.family===r.family||a.itemId===item.id);
 const laterPractice=s.attempts.some(a=>a.concept===r.concept&&a.at>r.anchorAt);
 return{...r,valid:[7,30].includes(r.stageDays)&&at-r.anchorAt>=r.stageDays*C.DAY&&recent<=r.anchorAt&&!seen&&!laterPractice&&!item.assisted};
}
function coverage(bank){
 const out={total:bank.questions.length,authored:0,structured:0,external:0,imagesPending:0};
 for(const q of bank.questions){if(q.options?.every((_,i)=>C.optionReason(q,i).kind==='authored'))out.authored++;if(q.options?.every((_,i)=>C.optionReason(q,i).sections))out.structured++;if(q.externalClinicalReview?.status==='approved'&&q.externalClinicalReview?.contentVersion===q.versionHash)out.external++;if(q.imageRequired&&!q.image&&!q.images?.length)out.imagesPending++;}return out;
}
return{CAUSES,classify,errorProfile,expose,preciseKey,queue,validateCheck,coverage};
});
