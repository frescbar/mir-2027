/* MIR/27 original MIR 2025–2026 private study interface. Source text lives only in Supabase. */
(()=>{'use strict';
const esc=x=>String(x??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const original=q=>/^mediplus-202[56]-\d{3}$/.test(q?.id||'');
const sorted=(a,b)=>(Number(a.year)-Number(b.year))||(Number(a.number)-Number(b.number));
const selectHTML=(id,opts)=>'<select id="'+id+'">'+opts.map(o=>'<option value="'+esc(o[0])+'">'+esc(o[1])+'</option>').join('')+'</select>';
function render(ctx){
 const {bank,state,C,shell,start,toast}=ctx,all=bank.questions.filter(original).sort(sorted),
 counts={2025:all.filter(q=>Number(q.year)===2025).length,2026:all.filter(q=>Number(q.year)===2026).length},
 subjects=[...new Set(all.map(x=>x.subject).filter(Boolean))].sort((a,b)=>a.localeCompare(b,'es'));
 let html='<section class="card"><h2>Exámenes originales MIR 2025 y 2026</h2>'+
 '<p>Elige cuántas preguntas quieres contestar. La corrección se muestra al responder en modo estudio o al finalizar en modo examen. Se guardan tus intentos.</p>'+
 '<p><strong>MIR 2025: '+counts[2025]+'/210</strong> · <strong>MIR 2026: '+counts[2026]+'/210</strong> · <strong>Total: '+all.length+'/420</strong> preguntas incorporadas.</p>'+
 (all.length<420?'<p class="notice warning">El banco original todavía no está completo. Desde Biblioteca y copias, el administrador puede importar el paquete privado MIR 2025–2026. No se muestran preguntas inventadas para completar el total.</p>':'')+
 '<form id="mir-original-form"><div class="two-columns"><label>Convocatoria'+selectHTML('mir-o-year',[['2026','MIR 2026'],['2025','MIR 2025'],['ambos','Ambos años']])+'</label>'+
 '<label>Modalidad'+selectHTML('mir-o-mode',[['study','Estudio: corrección tras cada respuesta'],['exam','Examen: corrección al entregar']])+'</label></div>'+
 '<div class="two-columns"><label>Cantidad de preguntas<input id="mir-o-count" type="number" min="1" max="420" value="20" required></label>'+
 '<label>Orden'+selectHTML('mir-o-order',[['original','Numeración original'],['random','Aleatorias']])+'</label></div>'+
 '<div class="toolbar">'+[5,10,20,45,100,210].map(n=>'<button type="button" class="ghost" data-original-count="'+n+'">'+n+'</button>').join('')+'</div>'+
 '<div class="two-columns"><label>Qué practicar'+selectHTML('mir-o-filter',[['all','Todas'],['unseen','No realizadas'],['failed','Falladas'],['doubt','Acertadas con dudas / azar']])+'</label>'+
 '<label>Especialidad'+selectHTML('mir-o-subject',[['','Todas las especialidades'],...subjects.map(s=>[s,s])])+'</label></div>'+
 '<label>Número inicial (solo orden original)<input id="mir-o-from" type="number" min="1" max="210" value="1"></label>'+
 '<p class="small muted">Las preguntas anuladas o pendientes de verificar se indican en pantalla y no computan en las netas. Las que requieren una imagen no vinculada quedan señaladas.</p>'+
 '<button class="primary" type="submit">Comenzar mi sesión</button></form></section>';
 if(all.length) html+='<section class="card"><h3>Aprender de cada respuesta</h3><p>Tras contestar encontrarás la explicación de la fuente, el análisis disponible de las opciones, la imagen clínica si está vinculada y el enlace a la videoclase de Mediplus. También puedes guardar la pregunta para repasar.</p></section>';
 const cards=Object.entries(state.notes||{}).filter(([id,v])=>id.startsWith('original-card:')&&v&&typeof v==='object'&&v.front);
 html+='<section class="card"><h3>Mis fichas · '+cards.length+'</h3><p>Las fichas guardadas al corregir las preguntas se conservan en tu cuenta.</p>'+
 (cards.length?cards.slice().reverse().map(([key,v])=>'<details class="sourcebox"><summary>'+esc(v.front)+'</summary><p>'+esc(v.back||'')+'</p><p class="small muted">'+esc(v.questionId||'')+'</p></details>').join(''):'<p class="small muted">Todavía no has guardado fichas.</p>')+'</section>';

 shell('MIR originales 2025–2026',html,'Practicar los exámenes originales, con sesiones a tu medida.');
 const form=document.getElementById('mir-original-form');
 form.querySelectorAll('[data-original-count]').forEach(b=>b.addEventListener('click',e=>{e.stopPropagation();document.getElementById('mir-o-count').value=b.dataset.originalCount;}));
 form.addEventListener('submit',e=>{
  e.preventDefault();e.stopPropagation();
  const val=id=>document.getElementById(id).value;
  const year=val('mir-o-year'),mode=val('mir-o-mode'),ord=val('mir-o-order'),filter=val('mir-o-filter'),sub=val('mir-o-subject');
  const count=Number(val('mir-o-count')),from=Number(val('mir-o-from'));
  if(!Number.isInteger(count)||count<1||count>420)return toast('Elige entre 1 y 420 preguntas.');
  if(!Number.isInteger(from)||from<1||from>210)return toast('El número inicial debe estar entre 1 y 210.');
  let pool=all.filter(q=>(year==='ambos'||String(q.year)===year)&&(!sub||q.subject===sub));
  if(ord==='original')pool=pool.filter(q=>Number(q.number)>=from);
  const last=C.latest(state,bank),attempted=new Set(state.attempts.filter(a=>a.kind==='question').map(a=>a.itemId));
  if(filter==='unseen')pool=pool.filter(q=>!attempted.has(q.id));
  else if(filter==='failed')pool=pool.filter(q=>last.get(q.id)?.correct===false);
  else if(filter==='doubt')pool=pool.filter(q=>{const a=last.get(q.id);return a?.correct===true&&a.confidence!=='sure';});
  pool=pool.filter(q=>C.studyable(q)&&Number.isInteger(q.answer)&&q.options.length===4);
  if(ord==='random')pool=C.shuffled(pool,'mir-original-'+Date.now());
  else pool.sort(sorted);
  if(!pool.length)return toast('No hay preguntas disponibles con esos filtros. Modifica la selección.');
  const chosen=pool.slice(0,count);
  if(chosen.length<count)toast('Solo hay '+chosen.length+' preguntas disponibles para esa selección.');
  start(chosen.map(q=>({kind:'question',id:q.id})),{title:'MIR '+(year==='ambos'?'2025–2026':year)+' · '+chosen.length+' preguntas',kind:mode==='exam'?'exam':'originals',mode,minutes:mode==='exam'?Math.ceil(chosen.length*1.35):0,mainCount:chosen.length,shuffleOptions:false});
 });
}
window.MIROriginals={render,original};
})();