/* MIR/27 1.0 · deterministic learning logic, independent of UI and network. */
(function(root,factory){const api=factory();if(typeof module==='object'&&module.exports)module.exports=api;else root.MIRCore=api;})(globalThis,function(){
'use strict';
const DAY=86400000,VERSION='1.5.0';
const copy=x=>JSON.parse(JSON.stringify(x));
function hash(s){let h=2166136261;for(const c of String(s)){h^=c.charCodeAt(0);h=Math.imul(h,16777619);}return h>>>0;}
function shuffled(a,seed){let n=hash(seed),out=[...a];const r=()=>{n+=0x6D2B79F5;let t=n;t=Math.imul(t^(t>>>15),t|1);t^=t+Math.imul(t^(t>>>7),t|61);return((t^(t>>>14))>>>0)/4294967296;};for(let i=out.length-1;i>0;i--){const j=Math.floor(r()*(i+1));[out[i],out[j]]=[out[j],out[i]];}return out;}
const uid=()=>globalThis.crypto?.randomUUID?.()||Date.now().toString(36)+'-'+Math.random().toString(36).slice(2);
function dayKey(d=new Date(),tz='Europe/Madrid'){const p=Object.fromEntries(new Intl.DateTimeFormat('en-CA',{timeZone:tz,year:'numeric',month:'2-digit',day:'2-digit'}).formatToParts(d).map(p=>[p.type,p.value]));return`${p.year}-${p.month}-${p.day}`;}
function blank(){return{schema:'mir2027.state.v2',version:VERSION,revision:0,updatedAt:0,preferences:{dailySize:10,dailyMode:'questions',includeObservations:false,fontScale:1,timezone:'Europe/Madrid'},attempts:[],sessions:{},schedule:{},studySchedule:{},notes:{},marks:{},errorReviews:{},conceptExposures:{},favorites:[],reports:[],activeSession:null,readPositions:{}};}
function normalize(s){const v=Object.assign(blank(),s||{});v.preferences=Object.assign(blank().preferences,s?.preferences||{});for(const k of ['sessions','schedule','studySchedule','notes','marks','readPositions','errorReviews','conceptExposures'])if(!v[k]||Array.isArray(v[k])||typeof v[k]!=='object')v[k]={};for(const k of ['attempts','favorites','reports'])if(!Array.isArray(v[k]))v[k]=[];for(const id of v.favorites)if(!v.marks[id])v.marks[id]={value:true,at:0};v.preferences.dailySize=Math.max(1,Math.min(50,Math.floor(Number(v.preferences.dailySize)||10)));v.preferences.dailyMode=v.preferences.dailyMode==='mixed'?'mixed':'questions';v.preferences.includeObservations=v.preferences.includeObservations===true;v.schema='mir2027.state.v2';v.version=VERSION;return v;}
function valid(q){return !!(q&&typeof q.id==='string'&&typeof q.stem==='string'&&q.stem.trim().length>=8&&Array.isArray(q.options)&&[4,5].includes(q.options.length)&&q.options.every(o=>typeof o==='string'&&o.trim())&&Number.isInteger(q.answer)&&q.answer>=0&&q.answer<q.options.length);}
function eligible(q){return valid(q)&&q.eligible!==false&&!q.isChallenged&&q.challengeStatus!=='pending'&&!q.flags?.length&&!q.isAnnulled&&!q.sourceDiscrepancy&&!['requiere_revision','imagen_pendiente','importado_no_revisado','retired','retirado','suspendido','duplicado_documental'].includes(q.status)&&(!q.imageRequired||!!q.image||!!q.images?.length);}
// Access to study is separate from whether an answer can be scored.
function studyable(q){return !!(q&&typeof q.id==='string'&&typeof q.stem==='string'&&Array.isArray(q.options));}
function observations(q){
 const out=[];const add=(code,label)=>{if(!out.some(x=>x.code===code))out.push({code,label});};
 if(q.isAnnulled)add('annulled','Anulada según la fuente');
 if(q.challengeStatus==='pending'||q.isChallenged===true)add('challenged','Impugnación indicada en la fuente · resolución no confirmada');
 if(q.sourceDiscrepancy)add('conflict','Discrepancia entre fuentes o comentario pendiente de contraste');
 if(q.imageRequired&&!q.image&&!q.images?.length)add('image','Imagen necesaria todavía no localizada');
 if(q.duplicateOf)add('duplicate','Otra versión documental de la misma pregunta');
 const labels={anulada_en_la_fuente:'Anulada según la fuente',posible_discrepancia_en_comentario:'Posible discrepancia en el comentario',fuente_advierte_desactualizacion_o_anulacion:'La fuente advierte posible desactualización o anulación',fuente_advierte_discrepancia:'La fuente advierte una discrepancia',discrepancia_entre_fuentes:'Discrepancia entre fuentes',discrepancia_detectada:'Discrepancia pendiente de contraste',opciones_repetidas:'Opciones repetidas en la extracción',contexto_previo_no_disponible:'Falta el contexto de la pregunta anterior',imagen_pendiente_de_vincular:'Imagen necesaria todavía no localizada'};
 for(const f of q.flags||[]){if(f==='anulada_en_la_fuente'&&q.isAnnulled||f==='imagen_pendiente_de_vincular'&&out.some(x=>x.code==='image'))continue;add('flag-'+f,labels[f]||String(f).replace(/_/g,' '));}
 if(!valid(q))add('structure','Enunciado, opciones o clave requieren revisión');
 if(!eligible(q)&&!out.length)add('review','Revisión documental pendiente');
 return out;
}
function hasObservations(q){return observations(q).length>0;}
// A ready-to-read memory card, derived only from this question's frozen content.
// Excerpts keep complete source sentences, including negations and conditions.
function recall(q){
 const clean=s=>String(s||'').replace(/\s+/g,' ').trim();
 const norm=s=>clean(s).normalize('NFD').replace(/[\u0300-\u036f]/g,'').toLowerCase();
 const stop=new Set('para como cuando donde porque sobre entre desde hasta este esta estos estas esto eso una unos unas del las los que con por sus mas muy pero puede pueden paciente pacientes caso pregunta respuesta opcion correcta correcto incorrecta incorrecto falsa falso senale siguientes siguiente respecto relacion cual son tiene seria trata'.split(' '));
 const words=s=>new Set((norm(s).match(/[a-z0-9]+/g)||[]).filter(w=>w.length>2&&!stop.has(w)).map(w=>w.length>5?w.replace(/(?:es|s)$/,'').replace(/[oa]$/,''):w));
 const split=text=>{
  const all=clean(text),out=[];let start=0,depth=0;
  for(let i=0;i<all.length;i++){
   if(all[i]==='(')depth++;else if(all[i]===')')depth=Math.max(0,depth-1);
   if(depth||!/[.!?]/.test(all[i])||!/\s/.test(all[i+1]||''))continue;
   const prefix=all.slice(start,i+1),next=all.slice(i+1).trimStart();
   // Preserve decimal values, initials, species names and common abbreviations.
   if(!/^[A-ZÁÉÍÓÚÜÑ¿¡0-9•]/.test(next)||/(?:\b[A-ZÁÉÍÓÚÜÑ]|\b(?:Dr|Dra|Sr|Sra|nº|fig|Fig|aprox|p|pág|Pag|ed))\.$/.test(prefix))continue;
   if(/^(?:\(?(?:respuesta|opci[oó]n)\b)/i.test(next))continue;
   out.push(prefix.trim());start=i+1;
  }
  if(all.slice(start).trim())out.push(all.slice(start).trim());
  return out;
 };
 const key=Number.isInteger(q.answer)?clean(q.options?.[q.answer]):'';
 const instruction=clean(q.stem).split(/[¿?]/).filter(x=>/[a-záéíóúñ]/i.test(x)).at(-1)||'';
 const negative=/\b(?:incorrect[ao]s?|fals[ao]s?|excepto)\b|\bno\s+(?:es|son|se|ser[ií]a|corresponde|constituye|est[aá]|est[aá]n|forma|debe|deber[ií]a|incluye|presenta|resulta|puede)/i.test(instruction);
 const disputed=!!(q.sourceDiscrepancy||q.isAnnulled||q.isChallenged||q.challengeStatus==='pending'||q.flags?.some(f=>/discrepancia|anulacion|anulada/.test(f)));
 const warnings=[];
 if(negative)warnings.push('El enunciado pide la falsa o la excepción: la opción señalada no debe memorizarse como una afirmación verdadera.');
 if(disputed)warnings.push('La clave está cuestionada o la pregunta está anulada: este recordatorio conserva la explicación documental, sin dar una respuesta por válida.');
 if(q.imageRequired&&!q.images?.length&&!q.image)warnings.push('Falta la imagen original: el recordatorio procede del comentario, no de una comprobación visual.');
 const authored=typeof q.takeaway==='string'&&clean(q.takeaway)&&!/cierra el comentario|intenta explicar|anotar mi idea/i.test(q.takeaway)?clean(q.takeaway):'';
 const result={idea:!disputed?authored:'',key:disputed?'':key,keyLabel:negative?'Excepción señalada por la fuente':'Respuesta que retener según la fuente',negative,excerpts:[],warnings,source:null};
 if(authored&&!disputed)return result;
 const comment=clean(q.commentary||q.explanation),sources=(q.sourceCommentaries||[]).filter(c=>clean(c.text));
 const source=sources.find(c=>clean(c.text)===comment)||(!comment?sources[0]:null)||{text:comment,title:'Comentario de la fuente',pdfPage:q.references?.[0]?.pdfPage};
 const sourceText=clean(source.text);result.source={title:source.title||'Comentario de la fuente',pdfPage:source.pdfPage||null};
 if(!sourceText){result.warnings.push('La fuente no aporta un razonamiento suficiente para resumir esta pregunta.');return result;}
 const answerWords=words(key),stemWords=words(q.stem),sourceOptions=source.options||q.options||[];
 const keyIndex=sourceOptions.findIndex(x=>norm(x)===norm(key));
 const marker=keyIndex>=0?new RegExp('(?:respuesta|opci[oó]n)\\s*(?:n[.º°]?[ ]*)?'+(keyIndex+1)+'\\b','i'):null;
 const candidates=split(sourceText).map((text,index)=>{
  const terms=words(text),overlap=[...answerWords].filter(x=>terms.has(x)).length,stemOverlap=[...stemWords].filter(x=>terms.has(x)).length;
  const meta=/^(?:pregunta (?:f[aá]cil|sencilla|dif[ií]cil|compleja|relativamente|algo)|(?:esta|la) pregunta (?:es |se |puede |trata))/i.test(text);
  const meaningful=terms.size>=4&&!/^(?:harrison|farreras|bibliograf[ií]a|referencias)\b/i.test(text);
  const score=overlap*5+Math.min(stemOverlap,7)*.5+(marker?.test(text)?12:0)+(/\b(?:recuerda|recordar|recordamos|clave|pista|caracter[ií]stic[ao]|se diferencia|a diferencia|diagn[oó]stico|por tanto|por ello)\b/i.test(text)?3:0)-(text.length>800?8:0)-(meta?8:0)-(index===0?0:0.1);
  return{text,index,score,meaningful};
 }).filter(c=>c.meaningful);
 if(!candidates.length){result.warnings.push('El comentario disponible no permite aislar una idea breve con suficiente contexto.');return result;}
 candidates.sort((a,b)=>b.score-a.score||a.index-b.index);
 const best=candidates.find(c=>c.text.length<=1000)||candidates[0],selected=[best];
 // Dependent sentences need their preceding sentence to retain the subject.
 if(/^(?:adem[aá]s|asimismo|por (?:ello|tanto)|sin embargo|en cambio|pero|este tipo|esta (?:t[eé]cnica|enfermedad|prueba|medida)|su |estos |estas |esto |ello |dicha |dicho |tambi[eé]n)\b/i.test(best.text)){
  const previous=candidates.find(c=>c.index===best.index-1);if(previous)selected.unshift(previous);
 }else if(best.text.length<450){
  const next=candidates.find(c=>c.index===best.index+1);
  if(next&&next.text.length+best.text.length<780)selected.push(next);
 }
 result.excerpts=selected.map(c=>c.text);return result;
}

// Keep provenance and uncertainty visible: lexical matches are excerpts, never authored refutations.
function optionReason(q,i){
 const teaching=q.optionTeaching?.[i];
 if(teaching?.optionText===q.options?.[i]&&['reason','contrast','pitfall'].every(k=>typeof teaching[k]==='string'&&teaching[k].trim()))return{kind:'authored',text:[teaching.reason,'Cómo distinguirla: '+teaching.contrast,'Trampa de examen: '+teaching.pitfall].join('\n\n'),sections:teaching,evidence:[]};
 const authored=(!teaching||teaching.optionText===q.options?.[i])?q.optionExplanations?.[i]:null;if(typeof authored==='string'&&authored.trim())return{kind:'authored',text:authored,evidence:[]};
 const clean=x=>String(x||'').replace(/\s+/g,' ').trim(),norm=x=>clean(x).normalize('NFD').replace(/[\u0300-\u036f]/g,'').toLowerCase();
 const evidence=(q.optionEvidence||[]).filter(e=>e.optionIndex===i&&clean(e.text));
 if(evidence.length)return{kind:'excerpt',text:'',evidence};
 const terms=(norm(q.options?.[i]).match(/[a-z]{5,}/g)||[]).filter(w=>!['paciente','pacientes','tratamiento','realizar','enfermedad','siguiente','siempre','ninguna','correcta','puede','pueden','deberia','existe','tiene','tienen','aumento','disminucion'].includes(w));
 const candidates=[];
 for(const c of q.sourceCommentaries?.length?q.sourceCommentaries:[{text:q.commentary||q.explanation,pdfPage:q.references?.[0]?.pdfPage}]){
  // Paragraphs retain negations and qualifications; no sentence truncation.
  for(const part of clean(c.text).split(/(?<=[.!?])\s+(?=[A-ZÁÉÍÓÚÑ¿])/)){
   const hits=terms.filter(w=>new RegExp('\\b'+w+'\\b').test(norm(part))).length;
   if(hits>=Math.min(2,terms.length)&&hits>0&&part.length>=60&&part.length<=1400)candidates.push({text:part,pdfPage:c.pdfPage,sourceId:c.sourceId,hits});
  }
 }
 candidates.sort((a,b)=>b.hits-a.hits);
 if(candidates.length)return{kind:'related-excerpt',text:'',evidence:[candidates[0]]};
 return{kind:'context',text:clean(q.commentary||q.explanation||q.sourceCommentaries?.[0]?.text),evidence:[]};
}
// A source passage comparing several choices is shown once, never counted as several authored explanations.
function optionDiscussion(q){
 const reasons=(q.options||[]).map((_,i)=>optionReason(q,i)),passages=new Map();
 const key=t=>String(t||'').replace(/\s+/g,' ').trim().toLowerCase();
 reasons.forEach((r,i)=>r.evidence.forEach(e=>{const k=key(e.text);if(!passages.has(k))passages.set(k,{...e,indices:[]});const p=passages.get(k);if(!p.indices.includes(i))p.indices.push(i);}));
 const shared=[...passages.values()].filter(p=>p.indices.length>1);
 return{shared,pending:reasons.flatMap((r,i)=>r.kind==='context'?[i]:[]),reasons:reasons.map(r=>({...r,evidence:r.evidence.filter(e=>passages.get(key(e.text)).indices.length===1),shared:shared.filter(p=>r.evidence.some(e=>key(e.text)===key(p.text))).map(p=>shared.indexOf(p))}))};
}
function conceptKey(q){return q.learningConcept||q.memory?.concept||((q.concept&&!/^Tema\s/i.test(q.concept))?q.concept:(q.subject||'Sin clasificar')+' · '+(q.topic||q.concept||q.id));}
function conceptProgress(bank,s,now=Date.now()){
 const map=new Map(bank.questions.map(q=>[q.id,q])),groups=new Map();
 for(const a of [...s.attempts].sort((a,b)=>a.at-b.at)){
  if(a.kind!=='question'||a.scored===false||a.help)continue;
  const q=map.get(a.itemId),key=q?conceptKey(q):(a.concept||a.itemId);if(!key)continue;
  if(!groups.has(key))groups.set(key,{key,label:q?.memory?.front||q?.topic||a.concept||key,subject:q?.subject||a.subject,attempts:[],families:new Set()});
  const g=groups.get(key);g.attempts.push(a);g.families.add(q?family(q):a.itemId);
 }
 return [...groups.values()].map(g=>{
  const last=g.attempts.at(-1),days=new Map();for(const a of g.attempts)days.set(dayKey(new Date(a.at),s.preferences?.timezone||'Europe/Madrid'),a);
  const distinct=[...days.values()],previous=distinct.at(-2),success=a=>a?.correct&&a.confidence==='sure';
  const lastQ=map.get(last.itemId),previousQ=map.get(previous?.itemId),different=(lastQ?family(lastQ):last.itemId)!==(previousQ?family(previousQ):previous?.itemId);
  const retained=success(last)&&success(previous)&&last.at-previous.at>=7*DAY&&different&&now-last.at<=30*DAY;
  const status=last.correct===false?'reforzar':last.confidence!=='sure'?'con_dudas':retained?'retenido':'comprobar';
  return{key:g.key,label:g.label,subject:g.subject,status,total:g.attempts.length,correct:g.attempts.filter(a=>a.correct).length,days:days.size,distinctQuestions:g.families.size,lastAt:last.at,confidentError:last.correct===false&&last.confidence==='sure'};
 }).sort((a,b)=>({reforzar:0,con_dudas:1,comprobar:2,retenido:3}[a.status]-{reforzar:0,con_dudas:1,comprobar:2,retenido:3}[b.status])||b.lastAt-a.lastAt);
}
function conceptQuestions(bank,s,key,count=2){
 const q=uniqueQuestions(bank.questions.filter(q=>eligible(q)&&conceptKey(q)===key)),last=latest(s,bank);
 return shuffled(q,'concept-'+key+'-'+s.attempts.length).sort((a,b)=>Number(last.has(a.id))-Number(last.has(b.id))||Number(!a.transfer)-Number(!b.transfer)||(scheduleFor(a,s)?.lastAt||0)-(scheduleFor(b,s)?.lastAt||0)).slice(0,count).map(q=>({id:q.id,kind:'question',reason:'Otro caso del mismo concepto'}));
}
function memoryOfDay(bank,s,date){
 const cards=(bank.flashcards||[]).filter(c=>c.memoryCard&&c.mnemonic);if(!cards.length)return null;
 const protectedKeys=new Set();
 for(const session of Object.values(s.sessions||{}))if(session.status!=='complete')for(const item of session.items||[])if(item.data)protectedKeys.add(conceptKey(item.data));
 if(!s.sessions['daily-'+date])for(const item of selectDaily(bank,s,date,s.preferences.dailySize)){const q=bank.questions.find(q=>q.id===item.id);if(q)protectedKeys.add(conceptKey(q));}
 const available=cards.filter(c=>!protectedKeys.has(c.concept));if(!available.length)return null;
 return shuffled(available,'memory-'+date)[0];
}
function itemScored(item){return item.kind==='question'&&(typeof item.scored==='boolean'?item.scored:eligible(item.data));}
function selectionPool(bank,s){return bank.questions.filter(q=>!q.transfer&&studyable(q)&&(s.preferences.includeObservations||eligible(q))).sort((a,b)=>Number(!eligible(a))-Number(!eligible(b))||Number(!!a.duplicateOf)-Number(!!b.duplicateOf));}
function studyLatest(state){const out=new Map();for(const a of [...state.attempts].sort((a,b)=>(a.at||0)-(b.at||0)))if(a.kind==='question'&&a.scored===false)out.set(a.itemId,a);return out;}
function studySchedule(q,s){return s.studySchedule[q.id];}
function latest(state,bank){const aliases=new Map();for(const q of bank?.questions||[])for(const id of q.equivalentIds||[])aliases.set(id,q.id);const out=new Map();for(const a of [...state.attempts].sort((a,b)=>(a.at||0)-(b.at||0)))if(a.kind==='question'&&a.scored!==false)out.set(aliases.get(a.itemId)||a.itemId,a);return out;}
function scheduleFor(q,s){return[q.id,...(q.equivalentIds||[])].map(id=>s.schedule[id]).filter(Boolean).sort((a,b)=>(b.lastAt||0)-(a.lastAt||0))[0];}
function markFor(q,s){return q?[q.id,...(q.equivalentIds||[])].map(id=>s.marks[id]).filter(Boolean).sort((a,b)=>(b.at||0)-(a.at||0))[0]:null;}
function stats(s,bank){const a=s.attempts.filter(x=>x.kind==='question'&&x.scored!==false),pack=list=>({total:list.length,correct:list.filter(x=>x.correct).length,blank:list.filter(x=>x.blank).length,wrong:list.filter(x=>!x.correct&&!x.blank).length,percent:list.length?Math.round(list.filter(x=>x.correct).length*100/list.length):null});const subjects={};for(const t of a.filter(x=>x.first&&!x.help)){const k=t.subject||'Sin clasificar';(subjects[k]??=[]).push(t);}const last=[...latest(s,bank).values()];return{observations:s.attempts.filter(x=>x.kind==='question'&&x.scored===false).length,first:pack(a.filter(x=>x.first&&!x.help)),repeat:pack(a.filter(x=>!x.first&&!x.help)),assisted:pack(a.filter(x=>x.help)),subjects:Object.fromEntries(Object.entries(subjects).map(([k,v])=>[k,pack(v)])),unresolved:last.filter(x=>!x.correct).length,confidentErrors:last.filter(x=>!x.correct&&x.confidence==='sure').length,cards:s.attempts.filter(x=>x.kind==='flashcard').length,readings:s.attempts.filter(x=>x.kind==='reading').length,completed:Object.values(s.sessions).filter(x=>x.status==='complete').length};}
function family(q){return q.family||hash(q.stem.toLowerCase().replace(/[^\p{L}\p{N}]/gu,'')+'|'+q.options.slice().sort().join('|'));}
function uniqueQuestions(items){const families=new Set();return items.filter(q=>{const key=family(q);if(families.has(key))return false;families.add(key);return true;});}
function selectQuestions(bank,s,count,seed){
 const all=uniqueQuestions(selectionPool(bank,s)),last=latest(s,bank),studied=studyLatest(s),now=Date.now(),picked=[],used=new Set();
 const take=(q,reason)=>{if(picked.length<count&&!used.has(q.id)){used.add(q.id);picked.push({kind:'question',id:q.id,reason:eligible(q)?reason:'Con observaciones · '+reason});}};
 const planFor=q=>eligible(q)?scheduleFor(q,s):studySchedule(q,s);
 const due=q=>planFor(q)?.dueAt<=now||(!planFor(q)&&eligible(q)&&last.get(q.id)?.correct===false);
 const rank=q=>{const a=last.get(q.id),plan=planFor(q);return(!a?.correct&&a?.confidence==='sure'?100:0)+Math.min(30,Math.max(0,(now-(plan?.dueAt||now))/DAY))*2+(plan?.lapses||0)*5;};
 const reviews=shuffled(all.filter(due),seed+'reviews').sort((a,b)=>rank(b)-rank(a));
 const urgent=reviews.filter(q=>last.get(q.id)?.correct===false&&last.get(q.id)?.confidence==='sure');
 const quota=Math.min(reviews.length,Math.ceil(count*(urgent.length ? .5 : .4)));
 for(const q of reviews){if(picked.length>=quota)break;take(q,last.get(q.id)?.correct===false&&last.get(q.id)?.confidence==='sure'?'Repaso: error con alta seguridad':'Repaso: intervalo cumplido');}
 const performance={},concepts={};
 for(const a of s.attempts.filter(x=>x.kind==='question'&&x.scored!==false&&!x.help)){
  const weight=Math.exp(-Math.max(0,now-(a.at||now))/(60*DAY));
  const group=performance[a.subject]??={total:0,wrong:0};group.total+=weight;group.wrong+=a.correct?0:weight;
  if(a.concept){const c=concepts[a.concept]??={total:0,wrong:0};c.total+=weight;c.wrong+=a.correct?0:weight;}
 }
 const weakness=q=>{const p=performance[q.subject],c=concepts[q.concept||q.topic];return(p?(p.wrong+2)/(p.total+4):.5)+(c?.total>=2 ? .2*(c.wrong+1)/(c.total+2) : 0);};
 const fresh=shuffled(all.filter(q=>eligible(q)?!last.has(q.id):!studied.has(q.id)),seed+'new').sort((a,b)=>weakness(b)-weakness(a));
 const subjects={};for(const x of picked){const q=all.find(q=>q.id===x.id);subjects[q.subject]=(subjects[q.subject]||0)+1;}
 for(const q of fresh){if((subjects[q.subject]||0)>=Math.max(2,Math.ceil(count/3)))continue;const n=picked.length;take(q,weakness(q)>.6?'Pregunta nueva: tema que conviene reforzar':'Pregunta nueva: variedad de temas');if(picked.length>n)subjects[q.subject]=(subjects[q.subject]||0)+1;}
 for(const q of fresh)take(q,'Pregunta nueva');
 for(const q of reviews)take(q,'Repaso: intervalo cumplido');
 return picked;
}
function selectDaily(bank,s,date,size=10){size=Math.max(1,Math.min(50,Math.floor(Number(size)||10)));if(s.preferences.dailyMode==='questions')return selectQuestions(bank,s,size,date);const nq=Math.min(size,Math.ceil(size*.6)),nc=Math.floor((size-nq)/2),nr=size-nq-nc;const other=(items,n,kind)=>shuffled(items,date+kind).sort((a,b)=>(s.schedule[a.id]?.dueAt||0)-(s.schedule[b.id]?.dueAt||0)).slice(0,n).map(x=>({kind,id:x.id,reason:'Recuperación y lectura de fuentes'}));const out=[...selectQuestions(bank,s,nq,date),...other(bank.flashcards,nc,'flashcard'),...other(bank.readings,nr,'reading')];if(out.length<size){const used=new Set(out.map(x=>x.id));out.push(...selectQuestions(bank,s,size,date+'fill').filter(x=>!used.has(x.id)).slice(0,size-out.length));}return out;}
function makeSession(bank,s,items,{title='Práctica',kind='practice',mode='study',minutes=0,mainCount=items.length,id=null,shuffleOptions=true,assisted=false}={}){const sid=id||kind+'-'+uid(),now=Date.now(),map=new Map([...bank.questions,...bank.flashcards,...bank.readings].map(x=>[x.id,x]));return{id:sid,title,kind,mode,date:dayKey(),createdAt:now,updatedAt:now,startedAt:now,deadline:minutes?now+minutes*60000:null,mainCount,items:items.map(x=>{const d=x.data||map.get(x.id);if(!d)return null;return{kind:x.kind||'question',id:x.id,reason:x.reason||'Selección del banco',assisted:!!assisted,retention:x.retention?copy(x.retention):null,data:copy(d),order:d.options?(shuffleOptions&&mode!=='exam'?shuffled(d.options.map((_,i)=>i),sid+d.id):d.options.map((_,i)=>i)):null,answerKey:d.answer??null,scored:(x.kind||'question')==='question'?eligible(d):null,observationSnapshot:(x.kind||'question')==='question'?observations(d):[],sourceVersion:hash(d.stem||d.front||d.title||'')};}).filter(Boolean),answers:{},index:0,status:'active',attemptsCommitted:false};}
function schedule(prev,a){
 let days;const success=a.kind==='question'?a.correct&&!a.help&&a.confidence!=='guess':a.rating==='good';
 const streak=success?(prev?.streak||0)+1:0,lapses=(prev?.lapses||0)+(a.kind==='question'&&!a.correct?1:0);
 if(a.kind==='reading')days=7;
 else if(a.kind==='flashcard')days=a.rating==='again'?1:a.rating==='hard'?2:Math.min(60,Math.max(3,(prev?.intervalDays||1)*2));
 else if(!a.correct||a.help||a.confidence==='guess')days=1;
 else if(a.confidence==='sure')days=[3,7,14,30,60][Math.min(streak-1,4)];
 else days=Math.min(7,Math.max(2,Math.round((prev?.intervalDays||1)*1.5)));
 return{dueAt:a.at+days*DAY,lastAt:a.at,intervalDays:days,repetitions:(prev?.repetitions||0)+1,streak,lapses,lastConfidence:a.confidence||'unsure'};
}
function commit(s,session,i,lookup){const item=session.items[i],a=session.answers[i];if(!a?.submitted)return;const id=session.id+':'+i;if(s.attempts.some(x=>x.id===id))return;const q=item.data||lookup(item.id)||{},key=item.answerKey??q.answer,scored=itemScored(item);const record={id,sessionId:session.id,itemId:item.id,kind:item.kind,subject:q.subject||'Sin clasificar',concept:conceptKey(q),family:family(q),retention:a.retention||null,transfer:!!q.transfer,selected:a.selected??null,scored:item.kind==='question'?scored:null,correct:item.kind==='question'&&scored?a.selected!=null&&a.selected===key:null,blank:item.kind==='question'&&scored&&a.selected==null,confidence:a.confidence||'unsure',rating:a.rating,seconds:a.seconds||0,help:!!a.help||!!item.assisted,at:a.at||Date.now(),first:!s.attempts.some(x=>x.kind===item.kind&&(item.kind!=='question'||(x.scored!==false)===scored)&&[item.id,...(q.equivalentIds||[])].includes(x.itemId)),mode:session.mode,sourceVersion:item.sourceVersion};s.attempts.push(record);if(item.kind==='question'&&!scored){const prev=s.studySchedule[item.id];s.studySchedule[item.id]={dueAt:record.at+7*DAY,lastAt:record.at,intervalDays:7,repetitions:(prev?.repetitions||0)+1};}else s.schedule[item.id]=schedule(scheduleFor(q,s),record);}
function answer(s,session,i,a,lookup){if(session.status==='complete')return false;if(session.mode!=='exam'&&session.answers[i]?.submitted)return false;session.answers[i]={selected:a.selected??null,confidence:a.confidence||'unsure',rating:a.rating||null,seconds:Math.max(0,Math.min(3600,Math.round(a.seconds||0))),help:!!a.help,retention:a.retention?copy(a.retention):null,submitted:true,at:Date.now()};session.updatedAt=Date.now();if(session.mode!=='exam')commit(s,session,i,lookup);return true;}
function finish(s,session,lookup){if(session.status==='complete')return;session.items.forEach((item,i)=>{if(!session.answers[i]?.submitted&&item.kind==='question')session.answers[i]={selected:null,confidence:'unsure',submitted:true,at:Date.now(),seconds:0};commit(s,session,i,lookup);});session.status='complete';session.completedAt=Date.now();session.updatedAt=session.completedAt;session.attemptsCommitted=true;if(s.activeSession===session.id)s.activeSession=null;}
function score(session){let correct=0,wrong=0,blank=0;session.items.slice(0,session.mainCount??session.items.length).forEach((x,i)=>{if(x.kind!=='question'||!itemScored(x))return;const a=session.answers[i],key=x.answerKey??x.data?.answer;if(!Number.isInteger(key))return;if(a?.selected==null)blank++;else if(a.selected===key)correct++;else wrong++;});return{correct,wrong,blank,total:correct+wrong+blank,raw:correct*3-wrong,net:correct-wrong/3};}
function merge(a,b){a=normalize(a);b=normalize(b);const out=normalize((a.updatedAt||0)>=(b.updatedAt||0)?copy(a):copy(b));out.revision=Math.max(a.revision||0,b.revision||0);out.attempts=[...new Map([...a.attempts,...b.attempts].sort((x,y)=>(x.at||0)-(y.at||0)).map(x=>[x.id,x])).values()].sort((x,y)=>(x.at||0)-(y.at||0));const pick=(x,y)=>!x?y:!y?x:(x.updatedAt||x.lastAt||x.at||0)>=(y.updatedAt||y.lastAt||y.at||0)?x:y;for(const k of ['sessions','notes','marks','schedule','studySchedule','readPositions','errorReviews','conceptExposures']){out[k]={};for(const id of new Set([...Object.keys(a[k]),...Object.keys(b[k])])){const x=a[k][id],y=b[k][id];let v=pick(x,y);if(k==='sessions'&&x&&y){v=copy(v);v.answers={};for(const ix of new Set([...Object.keys(x.answers||{}),...Object.keys(y.answers||{})]))v.answers[ix]=pick(x.answers[ix],y.answers[ix]);if(x.status==='complete'||y.status==='complete')v.status='complete';}out[k][id]=v;}}out.reports=[...new Map([...a.reports,...b.reports].map(x=>[x.id||x.itemId,x])).values()];return out;}
function numeric(seed,type='nnt'){const r=shuffled([2,4,5,10],seed)[0],base=30,value=100/r,vals=shuffled([...new Set([value,r,base,100/(base-r),base+7])].slice(0,4),seed+'answers');return{id:'calc-'+hash(seed),kind:'question',origin:'Ejercicio matemático original · no pregunta oficial',status:'variante_matematica',subject:'Estadística y Epidemiología',topic:'NNT',concept:'nnt',learningConcept:'nnt',family:'nnt-generated-direct-risk',stem:`Ejemplo ficticio: en el mismo periodo el riesgo del grupo control es ${base}% y el tratado ${base-r}%. ¿Cuál es el NNT?`,options:vals.map(x=>Number(x.toFixed(2)).toLocaleString('es-ES')+' pacientes'),answer:vals.indexOf(value),commentary:`La reducción absoluta del riesgo es ${base} − ${base-r} = ${r} puntos porcentuales, equivalentes a ${r/100}. NNT = 1 / RAR = 100 / ${r} = ${value}. No se utiliza directamente el riesgo del grupo control ni el del tratado: se utiliza su diferencia absoluta. El NNT se refiere al periodo de seguimiento que comparten ambos grupos.`,references:[],images:[],imageRequired:false};}
return{VERSION,DAY,copy,hash,shuffled,uid,dayKey,blank,normalize,valid,eligible,studyable,observations,hasObservations,recall,optionReason,optionDiscussion,conceptKey,conceptProgress,conceptQuestions,memoryOfDay,itemScored,selectionPool,studyLatest,studySchedule,latest,stats,scheduleFor,markFor,family,uniqueQuestions,selectQuestions,selectDaily,makeSession,answer,finish,score,merge,numeric};
});
