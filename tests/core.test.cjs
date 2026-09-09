const {test}=require('node:test');
const assert=require('node:assert/strict');
const C=require('../docs/core-v1.js');
const q=(id,n=4)=>({id,kind:'question',stem:`Caso de entrenamiento ${id} con enunciado suficiente`,options:Array.from({length:n},(_,i)=>'Alternativa '+i),answer:n-1,subject:'Tema '+(+id.replace(/\D/g,'')%5),status:'historico_documental',commentary:'Comentario de prueba'});
const bank={questions:Array.from({length:80},(_,i)=>q('q'+i,i%2?4:5)),flashcards:[],readings:[]};
test('a new user receives ten questions, and can select 25 or 50',()=>{
 const s=C.blank();assert.equal(s.preferences.dailyMode,'questions');
 for(const n of [5,10,25,50]){const a=C.selectDaily(bank,s,'2026-09-09',n);assert.equal(a.length,n);assert.equal(new Set(a.map(x=>x.id)).size,n);assert.ok(a.every(x=>x.kind==='question'));}
 assert.equal(C.selectDaily(bank,s,'date',500).length,50);
});
test('invalid, missing-image and quarantined items never enter daily practice',()=>{
 for(const item of [{...q('bad1'),status:'imagen_pendiente',imageRequired:true},{...q('bad2'),eligible:false},{...q('bad3'),answer:10},{...q('bad4'),isAnnulled:true},{...q('bad5'),sourceDiscrepancy:true}])assert.equal(C.eligible(item),false);
});
test('a session keeps its question and correct answer when the source changes',()=>{
 const s=C.blank(),b=structuredClone(bank),session=C.makeSession(b,s,[{id:'q1',kind:'question'}]);
 b.questions[1].options.reverse();b.questions[1].answer=0;b.questions[1].stem='Changed';
 assert.equal(session.items[0].data.stem,bank.questions[1].stem);
 C.answer(s,session,0,{selected:session.items[0].answerKey,confidence:'sure'},()=>b.questions[1]);
 assert.equal(s.attempts[0].correct,true);
 assert.equal(C.answer(s,session,0,{selected:0},()=>b.questions[1]),false);
 assert.equal(s.attempts.length,1);
});
test('exam answers commit once on submission, with reserves excluded from score',()=>{
 const s=C.blank(),session=C.makeSession(bank,s,bank.questions.slice(0,4).map(x=>({id:x.id,kind:'question'})),{mode:'exam',mainCount:3});
 C.answer(s,session,0,{selected:session.items[0].answerKey},()=>null);
 C.answer(s,session,1,{selected:0},()=>null);
 C.answer(s,session,3,{selected:session.items[3].answerKey},()=>null);
 assert.equal(s.attempts.length,0);C.finish(s,session,()=>null);C.finish(s,session,()=>null);
 assert.equal(s.attempts.length,4);const score=C.score(session);assert.ok(Math.abs(score.net-2/3)<1e-12);assert.deepEqual({...score,net:0},{correct:1,wrong:1,blank:1,total:3,raw:2,net:0});
});
test('merging device progress preserves distinct attempts and newer note edits',()=>{
 const a=C.blank(),b=C.blank();a.attempts=[{id:'a',at:1}];b.attempts=[{id:'b',at:2}];
 a.notes.q1={text:'old',at:1};b.notes.q1={text:'new',at:2};
 a.marks.q1={value:true,at:1};b.marks.q1={value:false,at:2};
 const m=C.merge(a,b);assert.equal(m.attempts.length,2);assert.equal(m.notes.q1.text,'new');assert.equal(m.marks.q1.value,false);
});
test('errors are recalled when due, and guessed correct answers return the next day',()=>{
 const s=C.blank(),one={...bank,questions:[q('q1')]};
 let session=C.makeSession(one,s,[{id:'q1',kind:'question'}]);C.answer(s,session,0,{selected:0,confidence:'sure'},()=>null);
 assert.equal(C.selectQuestions(one,s,10,'now').length,0);
 s.schedule.q1.dueAt=Date.now()-1;assert.equal(C.selectQuestions(one,s,10,'later').length,1);
 session=C.makeSession(one,s,[{id:'q1',kind:'question'}]);C.answer(s,session,0,{selected:3,confidence:'guess'},()=>null);
 assert.equal(s.schedule.q1.intervalDays,1);assert.equal(s.schedule.q1.streak,0);
 for(const days of [3,7,14]){session=C.makeSession(one,s,[{id:'q1',kind:'question'}]);C.answer(s,session,0,{selected:3,confidence:'sure'},()=>null);assert.equal(s.schedule.q1.intervalDays,days);}
});
test('a consolidated documentary version retains the previous version’s learning history',()=>{
 const s=C.blank(),canonical={...q('canonical'),equivalentIds:['old'],family:'same'},old={...q('old'),duplicateOf:'canonical',family:'same',eligible:false},b={...bank,questions:[canonical,old]};
 s.attempts=[{id:'past',itemId:'old',kind:'question',correct:false,confidence:'sure',at:Date.now()}];s.schedule.old={lastAt:Date.now(),dueAt:Date.now()+C.DAY,intervalDays:1};
 assert.equal(C.selectQuestions(b,s,10,'today').length,0);s.schedule.old.dueAt=Date.now()-1;assert.equal(C.selectQuestions(b,s,10,'later')[0].id,'canonical');
 const session=C.makeSession(b,s,[{id:'canonical',kind:'question'}]);C.answer(s,session,0,{selected:3,confidence:'sure'},()=>null);assert.equal(s.attempts[1].first,false);assert.equal(s.attempts[0].itemId,'old');
});
