// Explicit synthetic weapon for pure state-rule tests; production requires the rendered rig sampler.
module.exports=state=>{
 const angle=state.attack==='advance'?state.foeYaw:state.attackYaw,s=Math.sin(angle),c=Math.cos(angle),y=state.attackIndex===0?.35:state.attackIndex===1?1:1.5;
 return{grip:{x:state.foe.x+s*1.15,y,z:state.foe.z+c*1.15},tip:{x:state.foe.x+s*2.5,y,z:state.foe.z+c*2.5}};
};
