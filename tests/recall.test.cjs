const {test}=require('node:test');
const assert=require('node:assert/strict');
const C=require('../docs/core-v1.js');
const q={id:'synthetic-recall',kind:'question',stem:'¿Cuál es el mecanismo descrito en este ejemplo?',options:['Mecanismo azul','Mecanismo verde','Mecanismo rojo','Mecanismo gris'],answer:1,commentary:'El mecanismo verde conserva la señal cuando el circuito está cerrado. No mantiene la señal si el circuito está abierto. El mecanismo rojo interrumpe la señal.',references:[],images:[]};
test('memory cards contain source-specific material, keep conditions and never mutate the question',()=>{
 const before=JSON.stringify(q),r=C.recall(q);assert.equal(r.key,'Mecanismo verde');assert.match(r.excerpts.join(' '),/cuando el circuito está cerrado/);assert.match(r.excerpts.join(' '),/No mantiene la señal/);
 for(const excerpt of r.excerpts)assert.ok(q.commentary.includes(excerpt));assert.equal(JSON.stringify(q),before);
});
test('negative questions are clearly scoped even when a colon follows the closing question mark',()=>{
 const negative=C.recall({...q,stem:'¿Cuál de estos mecanismos NO es relevante en este ejemplo?:'});assert.equal(negative.negative,true);assert.match(negative.keyLabel,/Excepción/);assert.match(negative.warnings.join(' '),/no debe memorizarse/);
 assert.equal(C.recall({...q,stem:'El circuito no está abierto. ¿Cuál es el mecanismo responsable?'}).negative,false);
});
test('authored ideas remain intact and disputed answers are not promoted as a correct rule',()=>{
 assert.equal(C.recall({...q,takeaway:'Circuito cerrado → señal conservada.'}).idea,'Circuito cerrado → señal conservada.');
 const disputed=C.recall({...q,takeaway:'Claim to avoid endorsing',sourceDiscrepancy:true});assert.equal(disputed.idea,'');assert.equal(disputed.key,'');assert.match(disputed.warnings.join(' '),/sin dar una respuesta por válida/);
});
test('source numbering follows option text and frozen sessions keep their own memory content',()=>{
 const specific={...q,sourceCommentaries:[{title:'Synthetic source',pdfPage:4,text:'El mecanismo gris elimina la señal (respuesta 1 incorrecta). El mecanismo verde conserva la señal cuando se cierra el circuito (respuesta 3 correcta).',options:['Mecanismo gris','Mecanismo rojo','Mecanismo verde','Mecanismo azul']}]};delete specific.commentary;
 const bank={questions:[specific],readings:[],flashcards:[]},session=C.makeSession(bank,C.blank(),[{kind:'question',id:specific.id}]);specific.answer=0;specific.sourceCommentaries[0].text='Replacement text';
 const r=C.recall(session.items[0].data);assert.equal(r.key,'Mecanismo verde');assert.ok(r.excerpts.some(t=>t.includes('respuesta 3 correcta')));assert.equal(r.source.pdfPage,4);assert.ok(!JSON.stringify(r).includes('Replacement text'));
});
