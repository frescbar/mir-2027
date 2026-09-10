/* Validate a private teaching batch. Structural checks do not certify clinical truth. */
'use strict';
const crypto=require('node:crypto');
const C=require('../docs/core-v1.js');
const normalize=x=>String(x||'').normalize('NFKC').replace(/\s+/g,' ').trim();
const forbidden=/la fuente no explica|explicaci[oó]n individual queda pendiente|consulta el razonamiento completo|lorem ipsum/i;
const allowed=new Set(['id','previousVersion','optionTexts','explanation','takeaway','optionTeaching','sources','clinicalUpdate','imageTeaching','learningConcept','qualityChecks']);
function validate(q,p){
 const errors=[];
 if(!q||q.id!==p.id)return['unknown question'];
 if(q.versionHash!==p.previousVersion)errors.push('stale version');
 if(JSON.stringify(q.options)!==JSON.stringify(p.optionTexts))errors.push('option identity changed');
 for(const k of Object.keys(p))if(!allowed.has(k))errors.push('disallowed field: '+k);
 if(normalize(p.explanation).length<180)errors.push('case explanation too short');
 if(normalize(p.takeaway).length<25)errors.push('missing memory phrase');
 if(p.optionTeaching?.length!==q.options.length)errors.push('incomplete options');
 const reasons=[];
 for(const [i,x]of (p.optionTeaching||[]).entries()){
  if(x.optionText!==q.options[i])errors.push('option text mismatch: '+i);
  for(const [key,min]of [['reason',90],['contrast',40],['pitfall',30]])if(normalize(x[key]).length<min||forbidden.test(x[key]||''))errors.push('inadequate '+key+': '+i);
  reasons.push(normalize(x.reason).toLowerCase());
 }
 if(new Set(reasons).size!==reasons.length)errors.push('repeated alternative explanation');
 if(!p.sources?.length||p.sources.some(r=>!r.title||!/^https:\/\//.test(r.url||'')||!/^\d{4}-\d{2}-\d{2}$/.test(r.checkedAt||'')||normalize(r.supports).length<30))errors.push('unverified source record');
 for(const k of ['caseRead','negativeQuestionChecked','optionSpecificity','sourceSupportChecked','historicalKeyPreserved'])if(p.qualityChecks?.[k]!==true)errors.push('missing editorial check: '+k);
 if(p.imageTeaching&&(!q.images?.length&&!q.image||p.qualityChecks?.imageInspected!==true))errors.push('image guide without inspected image');
 if(p.clinicalUpdate&&!normalize(p.clinicalUpdate).length)errors.push('empty clinical update');
 return errors;
}
function apply(bank,proposals,date=new Date().toISOString().slice(0,10)){
 const map=new Map(bank.questions.map(q=>[q.id,q])),seen=new Set(),patches=[];
 for(const p of proposals){
  if(seen.has(p.id))throw Error('Repeated proposal '+p.id);seen.add(p.id);
  const q=map.get(p.id),errors=validate(q,p);if(errors.length)throw Error(p.id+': '+errors.join('; '));
  const data={explanation:p.explanation,takeaway:p.takeaway,optionTeaching:p.optionTeaching,optionExplanations:p.optionTeaching.map(x=>x.reason),
   teachingReview:{date,method:'Elaboración por IA con lectura de la pregunta y consulta de las fuentes indicadas. Control editorial automático; revisión clínica externa pendiente.',sources:p.sources},
   editorialChecks:{...p.qualityChecks,checkedAt:date,kind:'ai_editorial_check',externalClinicalValidation:false},
   editorialHistory:[...(q.editorialHistory||[]),{at:date,previousVersion:q.versionHash,previousTeaching:{explanation:q.explanation||null,optionTeaching:q.optionTeaching||null,optionExplanations:q.optionExplanations||null,takeaway:q.takeaway||null,teachingReview:q.teachingReview||null},change:'Ampliación por opción; enunciado, opciones, clave y comentario histórico conservados.'}]};
  if(p.clinicalUpdate)data.clinicalUpdate={date,text:p.clinicalUpdate,sources:p.sources};
  if(p.imageTeaching)data.imageTeaching=p.imageTeaching;
  if(p.learningConcept)data.learningConcept=p.learningConcept;
  // Replace the ready-made reminder coherently, keeping its previous identity when present.
  data.memory={...(q.memory||{}),id:q.memory?.id||'memory-'+q.id,front:q.memory?.front||'Para recordarlo',mnemonic:p.takeaway,clue:p.takeaway,trap:p.optionTeaching[q.answer]?.pitfall||p.optionTeaching[0].pitfall,webReferences:p.sources};
  const next={...q,...data};delete next.versionHash;
  data.versionHash=crypto.createHash('sha256').update(JSON.stringify(next)).digest('hex').slice(0,16);
  if(p.optionTeaching.some((_,i)=>C.optionReason({...q,...data},i).kind!=='authored'))throw Error('Renderer did not accept teaching '+q.id);
  patches.push({external_id:q.id,previousVersion:q.versionHash,data});
 }
 return patches;
}
if(require.main===module){const fs=require('node:fs'),[bankPath,proposalPath,outPath]=process.argv.slice(2);if(!outPath)throw Error('Usage: node editorial-batch.cjs bank.json proposals.json patches.json');const patches=apply(JSON.parse(fs.readFileSync(bankPath)),JSON.parse(fs.readFileSync(proposalPath)));fs.writeFileSync(outPath,JSON.stringify(patches,null,2));console.log(JSON.stringify({validated:patches.length,clinicalExternalApproval:false}));}
module.exports={validate,apply};
