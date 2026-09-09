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
async function boot(db){
 const errors=[],vc=new VirtualConsole();vc.on('jsdomError',e=>errors.push(e.message));
 const dom=new JSDOM(fs.readFileSync(path.join(root,'docs/index.html'),'utf8'),{url:'https://local-test.invalid/',runScripts:'outside-only',virtualConsole:vc});
 const w=dom.window;w.indexedDB=db;w.MIR_PRIVATE_BANK=structuredClone(bank);w.structuredClone=structuredClone;w.scrollTo=()=>{};w.confirm=()=>true;
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
