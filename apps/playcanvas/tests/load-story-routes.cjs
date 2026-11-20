// Resolve this browser module's extensionless import for Node's native TS loader.
// The hook is removed immediately and does not change the application build.
const {registerHooks}=require('node:module');
const hook=registerHooks({resolve(specifier,context,next){return next(specifier==='./episode-rules'&&context.parentURL?.endsWith('/story-route.ts')?'./episode-rules.ts':specifier,context);}});
try{module.exports=require('../src/gameplay/story-route.ts');}finally{hook.deregister();}
