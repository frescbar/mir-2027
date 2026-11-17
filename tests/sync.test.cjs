const {test}=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');
const {JSDOM}=require('jsdom');
const {IDBFactory}=require('fake-indexeddb');
const C=require('../docs/core-v1.js');

const docs=path.join(__dirname,'..','docs');
const html=fs.readFileSync(path.join(docs,'index.html'),'utf8');
const scripts=['core-v1','learning-v1','store-v1','print-v1','originals-v1','app-v1']
 .map(name=>fs.readFileSync(path.join(docs,name+'.js'),'utf8'));
const questions=[2025,2026].flatMap(year=>[1,2,3].map(number=>({
 id:'mediplus-'+year+'-00'+number,year,number,stem:'Synthetic '+year+' question '+number,
 options:['A','B','C','D'],answer:1,status:'historico_documental',subject:'Synthetic subject'
})));
const bank={questions,readings:[],flashcards:[]};
const rows=questions.map(data=>({kind:'question',external_id:data.id,data}));
const response=value=>new Response(JSON.stringify(value));

function server(){
 return {
  state:C.blank(),revision:0,conflicts:0,
  fetch(url,{body}){
   const route=new URL(url).pathname;
   if(route.endsWith('/app_members'))return response([{role:'member'}]);
   if(route.endsWith('/mir_content'))return response(rows);
   if(route.endsWith('/user_state'))return response([{state:this.state,revision:this.revision}]);
   if(route.endsWith('/mir_save_state')){
    const input=JSON.parse(body);
    if(input.p_expected_revision!==this.revision){
     this.conflicts++;
     return response({ok:false,state:this.state,revision:this.revision});
    }
    this.state=input.p_state;
    return response({ok:true,revision:++this.revision});
   }
   assert.fail('Unexpected mock endpoint: '+route);
  }
 };
}

async function until(check,message){
 for(let i=0;i<150;i++){
  if(check())return;
  await new Promise(resolve=>setTimeout(resolve,10));
 }
 assert.fail(message);
}
function boot(t,remote){
 const dom=new JSDOM(html,{url:'https://mir-test.invalid/',runScripts:'outside-only'});
 t.after(()=>dom.window.close());
 const w=dom.window;
 w.indexedDB=new IDBFactory();
 w.scrollTo=()=>{};
 w.localStorage.setItem('mir27.auth.v1',JSON.stringify({
  access_token:'synthetic',user:{id:'synthetic-student'},expires_at:Math.floor(Date.now()/1000)+3600
 }));
 w.fetch=(url,options)=>remote.fetch(url,options);
 for(const script of scripts)w.eval(script);
 const $=selector=>w.document.querySelector(selector);
 return {w,$,store:w.MIRStore,click(selector){
  const element=$(selector);
  assert.ok(element,selector);
  element.click();
 }};
}
async function startOriginal(app,year){
 app.click('[data-view="originals"]');
 await until(()=>app.$('#mir-original-form'),'Original exams did not open');
 app.$('#mir-o-year').value=String(year);
 app.$('#mir-o-count').value='3';
 app.click('#mir-original-form button[type="submit"]');
 await until(()=>app.$('.stem')?.textContent==='Synthetic '+year+' question 1','Session did not open');
 await app.store.waitForWrites();
}
function answer(app,option){
 app.click('.option[data-index="'+option+'"]');
 app.click('[data-action="answer"]');
}
function holdRead(app){
 const fetch=app.w.fetch;
 const started=Promise.withResolvers(),release=Promise.withResolvers();
 app.w.fetch=async(url,options)=>{
  const result=fetch(url,options);
  if(new URL(url).pathname.endsWith('/user_state')){
   app.w.fetch=fetch;
   started.resolve();
   await release.promise;
  }
  return result;
 };
 return {started:started.promise,release:release.resolve};
}

test('an answer recorded during refresh preserves the other device’s attempt and both original sessions',async t=>{
 const remote=server(),a=boot(t,remote);
 await until(()=>a.$('[data-view="originals"]'),'Browser A did not load');
 await startOriginal(a,2025);
 const localId=remote.state.activeSession;
 const b=boot(t,remote);
 await until(()=>b.$('[data-view="originals"]'),'Browser B did not load');
 await startOriginal(b,2026);
 const remoteId=remote.state.activeSession;
 answer(b,1);
 await b.store.waitForWrites();
 assert.equal(remote.state.attempts.length,1);

 const read=holdRead(a);
 a.click('#sync-now');
 await read.started;
 // Let the read resume in the same task that queues a stale local snapshot.
 read.release();
 answer(a,0);
 await a.store.waitForWrites();
 assert.deepEqual(remote.state.attempts.map(x=>x.itemId).sort(),[questions[0].id,questions[3].id]);
 assert.equal(remote.state.sessions[localId].answers[0].selected,0);
 assert.equal(remote.state.sessions[remoteId].answers[0].selected,1);
 assert.equal(a.$('.stem').textContent,questions[0].stem);
 b.click('#sync-now');
 await b.store.waitForWrites();
 b.click('[data-view="originals"]');
 await until(()=>b.$('[data-action="open-session"][data-id="'+localId+'"]'),'Browser B did not receive the 2025 session');
 b.click('[data-action="open-session"][data-id="'+localId+'"]');
 await until(()=>b.$('.correction'),'Browser B did not receive the 2025 answer');
 assert.equal(b.$('.option.selected').dataset.index,'0');
});

test('queued answers from two browsers merge into the same original session after a revision conflict',async t=>{
 const remote=server();
 const session=C.makeSession(bank,C.blank(),questions.slice(0,3).map(q=>({id:q.id})),{id:'shared-original'});
 remote.state.sessions[session.id]=session;
 remote.state.activeSession=session.id;
 remote.revision=1;
 const a=boot(t,remote),b=boot(t,remote);
 await until(()=>a.$('[data-view="originals"]')&&b.$('[data-view="originals"]'),'Browsers did not load');
 const [left,right]=await Promise.all([a.store.loadState(),b.store.loadState()]);
 C.answer(left,left.sessions[session.id],0,{selected:1},()=>null);
 C.answer(right,right.sessions[session.id],2,{selected:2},()=>null);
 await b.store.saveState(right);
 const first=a.store.saveState(left);
 C.answer(left,left.sessions[session.id],1,{selected:0},()=>null);
 const second=a.store.saveState(left);
 await Promise.all([first,second]);
 assert.ok(remote.conflicts>=1);
 for(const state of await Promise.all([a.store.loadState(),b.store.loadState()])){
  assert.deepEqual(Array.from(state.attempts,x=>x.id).sort(),[0,1,2].map(i=>session.id+':'+i));
  assert.deepEqual(Object.values(state.sessions[session.id].answers).map(x=>x.selected),[1,0,2]);
 }
});

test('starting a new original session during refresh keeps it open and retains the other browser’s progress',async t=>{
 const remote=server(),a=boot(t,remote),b=boot(t,remote);
 await until(()=>a.$('[data-view="originals"]')&&b.$('[data-view="originals"]'),'Browsers did not load');
 await startOriginal(a,2025);
 const firstId=remote.state.activeSession;
 await startOriginal(b,2026);
 const remoteId=remote.state.activeSession;
 answer(b,1);
 await b.store.waitForWrites();

 a.click('[data-view="originals"]');
 await until(()=>a.$('#mir-original-form'),'Original exams did not open');
 const read=holdRead(a);
 a.click('#sync-now');
 await read.started;
 a.$('#mir-o-year').value='2025';
 a.$('#mir-o-from').value='2';
 a.$('#mir-o-count').value='2';
 a.click('#mir-original-form button[type="submit"]');
 await until(()=>a.$('.stem')?.textContent===questions[1].stem,'New local session did not open');
 read.release();
 await a.store.waitForWrites();

 const localId=remote.state.activeSession;
 assert.notEqual(localId,firstId);
 assert.deepEqual(Object.keys(remote.state.sessions).sort(),[firstId,remoteId,localId].sort());
 assert.equal(remote.state.sessions[remoteId].answers[0].selected,1);
 assert.equal(a.$('.stem').textContent,questions[1].stem);
 answer(a,2);
 await a.store.waitForWrites();
 assert.equal(remote.state.sessions[localId].answers[0].selected,2);
 assert.deepEqual(remote.state.attempts.map(x=>x.itemId).sort(),[questions[1].id,questions[3].id]);
});
