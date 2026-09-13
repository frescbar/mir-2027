/* MIR/27 hotfix 1.5.1b: tolerate non-question records in learning queues and uniqueness counts. */
(()=>{'use strict';
if(!globalThis.MIRCore)return;
const originalUnique=MIRCore.uniqueQuestions;
const originalFamily=MIRCore.family;
MIRCore.uniqueQuestions=function(items){
  const safe=(Array.isArray(items)?items:[]).filter(q=>q&&typeof q.stem==='string'&&Array.isArray(q.options));
  return originalUnique(safe);
};
MIRCore.family=function(q){
  if(q&&typeof q.stem==='string'&&Array.isArray(q.options))return originalFamily(q);
  const base=String(q?.id||q?.title||q?.front||q?.concept||'non-question');
  return 'non-question-'+MIRCore.hash(base);
};
})();
