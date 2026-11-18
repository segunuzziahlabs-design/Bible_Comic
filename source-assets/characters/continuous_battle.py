"""Original aftermath performances, derived from the retained, licensed project actors.
Run from repository root in pinned Blender. No blood, wound or separated body meshes.
"""
from pathlib import Path
import sys, math
import bpy
sys.path.insert(0, str(Path(__file__).parent))
from elah_combat import sample_pose, apply_pose, aim, rotate, move, action, key
root=Path.cwd()

def load(name):
    bpy.ops.wm.read_factory_settings(use_empty=True)
    bpy.ops.import_scene.gltf(filepath=str(root/f'apps/playcanvas/src/assets/{name}.glb'))
    rig=next(o for o in bpy.data.objects if o.type=='ARMATURE')
    bpy.context.scene.render.fps=24
    for t in list(rig.animation_data.nla_tracks): rig.animation_data.nla_tracks.remove(t)
    return rig

def export(rig,name,idle):
    rig.animation_data.action=bpy.data.actions[idle]
    rig.animation_data.action_slot=rig.animation_data.action.slots[0]
    bpy.context.scene.frame_set(0)
    bpy.ops.object.select_all(action='DESELECT')
    for obj in bpy.context.scene.objects:
        if obj.type in ['MESH','ARMATURE']: obj.select_set(True)
    bpy.context.view_layer.objects.active=rig
    bpy.ops.export_scene.gltf(filepath=str(root/f'apps/playcanvas/src/assets/{name}.glb'),export_format='GLB',use_selection=True,export_animations=True,export_animation_mode='ACTIONS',export_force_sampling=True,export_yup=True,export_vertex_color='ACTIVE')

rig=load('goliath-duel')
idle=sample_pose(rig,bpy.data.actions['goliath_ready'],0)
walk=bpy.data.actions['goliath_advance']
walks=[sample_pose(rig,walk,i) for i in range(33)]
fall=bpy.data.actions['goliath_fall']
fallposes=[sample_pose(rig,fall,i) for i in range(47)]
bones=tuple(b.name for b in rig.pose.bones)
action(rig,'goliath_stagger')
# A single, slow, stepped full turn: baked quaternions preserve the turn across export.
for f in range(145):
    t=f/24
    turn=max(0,min(1,(t-1.0)/4.1))
    moving=math.sin(math.pi*turn)**.5
    base=walks[int((t*20)%32)] if moving>.05 else idle
    apply_pose(rig,base)
    rotate(rig,'root',(0,0,1),360*turn)
    # Small shifts follow the planted stepping cycle; no entity teleport or orbit.
    move(rig,'root',(.12*math.sin(2*math.pi*turn),.10*(1-math.cos(2*math.pi*turn)),0))
    wobble=math.sin(t*3.8)*(4+5*moving)
    rotate(rig,'spine_02',(1,0,0),-6*math.sin(min(1,t)*math.pi)+8*max(0,(t-5)))
    rotate(rig,'spine_03',(0,1,0),wobble)
    rotate(rig,'Head',(1,0,0),-18*math.exp(-t*1.8)+5*math.sin(t*4))
    aim(rig,'upperarm_l',(.5,-.35,.55))
    aim(rig,'lowerarm_l',(-.3,-.2,.8))
    aim(rig,'upperarm_r',(-.35,-.15,-.8))
    # Knees begin yielding at the end, then blend into the heavy collapse.
    yield_=max(0,(t-5.3)/.7)
    rotate(rig,'calf_l',(1,0,0),14*yield_)
    rotate(rig,'calf_r',(1,0,0),11*yield_)
    move(rig,'pelvis',(0,0,-.05*yield_))
    key(rig,f,bones,('root','pelvis'))
stagger_end=sample_pose(rig,bpy.data.actions['goliath_stagger'],144)
action(rig,'goliath_heavy_fall')
for f in range(65):
    # Slow anticipation into the existing weighted fall, then hold its ground contact.
    src=fallposes[min(46,max(0,int((f-8)*46/48)))]
    blend=min(1,f/14)
    pose={n:(stagger_end[n][0].slerp(src[n][0],blend),stagger_end[n][1].lerp(src[n][1],blend)) for n in bones}
    apply_pose(rig,pose)
    key(rig,f,bones,('root','pelvis'))
export(rig,'goliath-continuous','goliath_ready')

rig=load('david-adventure')
idle=sample_pose(rig,bpy.data.actions['idle_relaxed'],0)
bones=tuple(b.name for b in rig.pose.bones)
for name,last in [('sword_carry',32),('sword_finish',60)]:
    action(rig,name)
    for f in range(last+1):
        apply_pose(rig,idle)
        t=f/24
        raised=math.sin(math.pi*min(1,t/1.3)) if name=='sword_finish' else 0
        # Both arms support the oversized sword; shoulders, spine and knees carry its weight.
        swing=max(0,min(1,(t-1.3)/.35)) if name=='sword_finish' else 0
        aim(rig,'upperarm_r',(-.2,-.65+.5*raised,-.7+1.5*raised))
        aim(rig,'lowerarm_r',(.1,-.8+.65*raised,.55+.35*raised))
        aim(rig,'upperarm_l',(.24,-.65+.5*raised,-.7+1.5*raised))
        aim(rig,'lowerarm_l',(-.2,-.8+.65*raised,.55+.35*raised))
        rotate(rig,'spine_02',(1,0,0),-7*raised+20*swing)
        rotate(rig,'spine_03',(0,0,1),-6*raised+12*swing)
        move(rig,'pelvis',(0,0,-.035*raised-.065*swing))
        key(rig,f,bones,('pelvis',))
export(rig,'david-aftermath','idle_relaxed')
print('CONTINUOUS_BATTLE_ASSETS_COMPLETE',flush=True)
