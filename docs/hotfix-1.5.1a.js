/* MIR/27 hotfix 1.5.1a: tolerate non-question media records in UI uniqueness counts. */
(()=>{'use strict';
if(!globalThis.MIRCore)return;
const original=MIRCore.uniqueQuestions;
MIRCore.uniqueQuestions=function(items){
  const safe=(Array.isArray(items)?items:[]).filter(q=>q&&typeof q.stem==='string'&&Array.isArray(q.options));
  return original(safe);
};
})();
