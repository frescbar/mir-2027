const {test}=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');
const {JSDOM,VirtualConsole}=require('jsdom');
const {IDBFactory}=require('fake-indexeddb');
const root=path.join(__dirname,'..');
const fixture={questions:Array.from({length:60},(_,i)=>({id:'q'+i,kind:'question',stem:`Ejercicio de prueba ${i}: elige la opción señalada en este conjunto sintético.`,options:['A','B','C','D'],answer:2,subject:'Prueba',status:'historico_documental',commentary:'Explicación de prueba',references:[],images:[]})),readings:Array.from({length:60},(_,i)=>({id:'r'+i,title:'Lectura '+i,subject:'Prueba',sections:[{title:'Sección',text:'Texto completo '+i}]})),flashcards:[],atlas:[],sources:[],topicStats:[],media:{},manifest:{}};
const bank=process.env.MIR_TEST_BANK?JSON.parse(fs.readFileSync(process.env.MIR_TEST_BANK,'utf8')):fixture;
async function until(check){for(let i=0;i<120;i++){if(check())return;await new Promise(r=>setTimeout(r,15));}throw new Error('Expected application state did not appear');}
async function boot(db,content=bank){
 const errors=[],vc=new VirtualConsole();vc.on('jsdomError',e=>errors.push(e.message));
 const dom=new JSDOM(fs.readFileSync(path.join(root,'docs/index.html'),'utf8'),{url:'https://local-test.invalid/',runScripts:'outside-only',virtualConsole:vc});
 const w=dom.window;w.indexedDB=db;w.MIR_PRIVATE_BANK=structuredClone(content);w.structuredClone=structuredClone;w.scrollTo=()=>{};w.confirm=()=>true;
 for(const name of ['core-v1','store-v1','print-v1','launcher','app-v1'])w.eval(fs.readFileSync(path.join(root,'docs',name+'.js'),'utf8'));
 await until(()=>w.document.querySelector('[data-action="daily"]'));
 return{dom,w,errors,click:selector=>{const e=w.document.querySelector(selector);assert.ok(e,selector);e.click();}};
}
test('study, correction and persistence across page recreation',async()=>{
 const db=new IDBFactory();let app=await boot(db);
 try{
  const size=app.w.document.querySelector('#daily-size');size.value='5';size.dispatchEvent(new app.w.Event('change'));
  app.click('[data-action="daily"]');await until(()=>app.w.document.querySelector('.options'));
  assert.match(app.w.document.querySelector('.session-bar').textContent,/1\/5/);
  app.click('.option');app.click('[data-action="answer"]');await until(()=>app.w.document.querySelector('.correction'));
  assert.ok(app.w.document.querySelector('.answer-key').textContent.length);
  assert.equal(app.w.document.querySelectorAll('.option:disabled').length,app.w.document.querySelectorAll('.option').length);
  const saved=await app.w.MIRStore.loadState();assert.equal(saved.attempts.length,1);assert.equal(saved.preferences.dailySize,5);
  assert.equal(Object.values(saved.sessions)[0].items.length,5);
  assert.ok(Object.values(saved.sessions)[0].items[0].data);
  assert.deepEqual(app.errors,[]);
 }finally{app.dom.window.close();}
 app=await boot(db);
 try{assert.equal((await app.w.MIRStore.loadState()).attempts.length,1);app.click('[data-action="daily"]');await until(()=>app.w.document.querySelector('.correction'));await until(()=>app.w.document.querySelector('#save-label').textContent==='Guardado en este dispositivo');assert.deepEqual(app.errors,[]);}finally{app.dom.window.close();}
});
test('all reading pages and full-text search remain accessible',async()=>{
 const app=await boot(new IDBFactory());try{
  app.click('[data-view="topics"]');await until(()=>app.w.document.querySelector('#reading-search'));
  assert.equal(app.w.document.querySelectorAll('.reading-link').length,40);
  app.click('[data-action="reading-page"][data-page="1"]');assert.match(app.w.document.querySelector('#reading-results').textContent,/página 2/);
  assert.deepEqual(app.errors,[]);
 }finally{app.dom.window.close();}
});
test('printing honors shuffled choices and protects unfinished exam solutions',async()=>{
 const app=await boot(new IDBFactory());try{
  const C=app.w.MIRCore,s=C.blank(),q=bank.questions.find(C.eligible);
  const session=C.makeSession(bank,s,[{id:q.id,kind:'question'}],{mode:'exam'});
  await assert.rejects(()=>app.w.MIRPrint.build(session,()=>q,async()=>null,{solutions:true}),/Entrega el examen/);
  C.finish(s,session,()=>q);const html=await app.w.MIRPrint.build(session,()=>q,async()=>null,{solutions:true});
  assert.match(html,/Cuaderno explicado/);assert.ok(html.includes('Clave de la fuente'));
  assert.deepEqual(app.errors,[]);
 }finally{app.dom.window.close();}
});
test('questions with observations keep the answer-first study flow without changing accuracy',async()=>{
 const content=structuredClone(fixture);content.questions[0].status='requiere_revision';content.questions[0].eligible=false;
 const app=await boot(new IDBFactory(),content);
 try{
  const trigger=app.w.document.createElement('button');trigger.dataset.action='open-question';trigger.dataset.id='q0';app.w.document.querySelector('#main').append(trigger);trigger.click();
  await until(()=>app.w.document.querySelector('.options'));
  assert.match(app.w.document.querySelector('.observation-notice').textContent,/sin puntuación/);assert.equal(app.w.document.querySelector('.correction'),null);
  app.click('.option');app.click('[data-action="answer"]');await until(()=>app.w.document.querySelector('.correction'));
  const saved=await app.w.MIRStore.loadState();assert.equal(saved.attempts.length,1);assert.equal(saved.attempts[0].scored,false);assert.equal(saved.studySchedule.q0.intervalDays,7);assert.equal(app.w.MIRCore.stats(saved).first.total,0);
  assert.equal(app.w.document.querySelectorAll('.option.correct,.option.wrong').length,0);assert.deepEqual(app.errors,[]);
 }finally{app.dom.window.close();}
});
test('the bank defaults to all questions and its observations filter can launch study',async()=>{
 const content=structuredClone(fixture);content.questions[0].isAnnulled=true;content.questions[0].answer=null;
 const app=await boot(new IDBFactory(),content);
 try{
  app.click('[data-view="bank"]');await until(()=>app.w.document.querySelector('#filter-status'));
  const filter=app.w.document.querySelector('#filter-status');assert.equal(filter.value,'all');assert.match(app.w.document.querySelector('.results-bar').textContent,/60/);
  filter.value='pending';filter.dispatchEvent(new app.w.Event('change'));assert.equal(app.w.document.querySelectorAll('.bank-row').length,1);
  app.click('[data-action="practice-filter"]');await until(()=>app.w.document.querySelector('.options'));assert.match(app.w.document.querySelector('.observation-notice').textContent,/Anulada según/);assert.equal(app.w.document.querySelector('.correction'),null);
  app.click('[data-action="blank"]');await until(()=>app.w.document.querySelector('.correction'));assert.match(app.w.document.querySelector('.answer-key').textContent,/no aporta una clave única/);
  assert.deepEqual(app.errors,[]);
 }finally{app.dom.window.close();}
});
test('observation preference applies to new sessions and survives reload',async()=>{
 const db=new IDBFactory();let app=await boot(db);const checkbox=app.w.document.querySelector('#include-observations');assert.equal(checkbox.checked,false);checkbox.checked=true;checkbox.dispatchEvent(new app.w.Event('change'));
 await until(()=>app.w.document.querySelector('#save-label').textContent==='Guardado en este dispositivo');app.dom.window.close();app=await boot(db);
 try{assert.equal(app.w.document.querySelector('#include-observations').checked,true);assert.equal((await app.w.MIRStore.loadState()).preferences.dailySize,10);}finally{app.dom.window.close();}
});
test('the atlas exposes question, explanation and unlinked images without downloading every image',async()=>{
 const content=structuredClone(fixture);content.questions[0].images=['question-image'];content.questions[0].commentaryImages=['commentary-image'];content.media=Object.fromEntries(['question-image','commentary-image','unlinked-image'].map(id=>[id,{id,title:id,data:'data:image/jpeg;base64,c3ludGhldGlj'}]));
 const app=await boot(new IDBFactory(),content);
 try{
  app.click('[data-view="atlas"]');await until(()=>app.w.document.querySelector('#atlas-scope'));assert.equal(app.w.document.querySelectorAll('.atlas-image').length,3);
  const scope=app.w.document.querySelector('#atlas-scope');scope.value='commentary';scope.dispatchEvent(new app.w.Event('change'));await until(()=>app.w.document.querySelectorAll('.atlas-image').length===1);assert.ok(app.w.document.querySelector('[data-media="commentary-image"]'));assert.deepEqual(app.errors,[]);
 }finally{app.dom.window.close();}
});
test('printed study copies retain observations and show documentary keys without declaring a winner',async()=>{
 const app=await boot(new IDBFactory());try{
  const C=app.w.MIRCore,q={...fixture.questions[0],sourceDiscrepancy:true,sourceCommentaries:[{title:'Source A',text:'Document A',options:['A','B','C','D'],answer:0},{title:'Source B',text:'Document B',options:['A','B','C','D'],answer:1}]},content={...fixture,questions:[q]},s=C.blank(),session=C.makeSession(content,s,[{id:q.id,kind:'question'}]);
  const plain=await app.w.MIRPrint.build(session,()=>q,async()=>null);assert.match(plain,/sin puntuación/);assert.ok(!plain.includes('Document A'));
  const explained=await app.w.MIRPrint.build(session,()=>q,async()=>null,{solutions:true});assert.match(explained,/Clave en esta fuente: A/);assert.match(explained,/Clave en esta fuente: B/);assert.deepEqual(app.errors,[]);
 }finally{app.dom.window.close();}
});
test('source excerpts follow option identity and commentary images appear only after answering',async()=>{
 const content=structuredClone(fixture);content.questions=content.questions.slice(0,1);
 const q=content.questions[0];q.commentaryImages=['solution-picture'];q.optionEvidence=[{optionIndex:0,text:'Literal documentary explanation of A',sourceId:'synthetic'}];content.media={'solution-picture':{data:'data:image/jpeg;base64,c3ludGhldGlj'}};
 const app=await boot(new IDBFactory(),content);
 try{
  app.click('[data-action="daily"]');await until(()=>app.w.document.querySelector('.options'));
  assert.equal(app.w.document.querySelector('[data-media="solution-picture"]'),null);
  app.click('[data-action="select-option"][data-index="0"]');app.click('[data-action="answer"]');await until(()=>app.w.document.querySelector('.correction'));
  const option=Array.from(app.w.document.querySelectorAll('.option-reason')).find(el=>el.querySelector('blockquote'));
  assert.match(option.querySelector('summary').textContent,/A$/);assert.equal(option.querySelector('blockquote').textContent,'Literal documentary explanation of A');assert.ok(app.w.document.querySelector('[data-media="solution-picture"]'));assert.deepEqual(app.errors,[]);
 }finally{app.dom.window.close();}
});
