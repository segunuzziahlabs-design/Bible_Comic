"""Additional original acting clips on the retained licensed character rigs; no mesh replacement."""
from pathlib import Path
import sys,math
import bpy
from mathutils import Vector
sys.path.insert(0,str(Path(__file__).parent))
from elah_combat import sample_pose,apply_pose,action,key,rotate,move,aim
out=Path(sys.argv[sys.argv.index('--')+1]);kind=sys.argv[sys.argv.index('--')+2];out.mkdir(parents=True,exist_ok=True)
rig=next(o for o in bpy.context.scene.objects if o.type=='ARMATURE');bones=tuple(b.name for b in rig.pose.bones)
if kind=='david':
 idle=sample_pose(rig,bpy.data.actions['idle_relaxed'],0)
 for side,name in [(-1,'dodge_left'),(1,'dodge_right')]:
  action(rig,name)
  for f in range(19):
   p=f/18;push=math.sin(math.pi*p)**1.3;apply_pose(rig,idle)
   move(rig,'pelvis',(0,0,-.16*push));rotate(rig,'spine_02',(0,1,0),side*18*push);rotate(rig,'spine_03',(1,0,0),16*push);rotate(rig,'Head',(0,1,0),-side*8*push)
   for s,suffix in [(-1,'r'),(1,'l')]:
    rotate(rig,'thigh_'+suffix,(1,0,0),(-24 if s==side else -9)*push);rotate(rig,'calf_'+suffix,(1,0,0),(42 if s==side else 21)*push)
    rotate(rig,'upperarm_'+suffix,(1,0,0),-24*push);rotate(rig,'upperarm_'+suffix,(0,1,0),s*22*push);rotate(rig,'lowerarm_'+suffix,(1,0,0),-30*push)
   key(rig,f,bones,('pelvis',))
 apply_pose(rig,idle);bpy.context.view_layer.update()
 ik=[];targets=[];starts={suffix:rig.pose.bones['hand_'+suffix].matrix.translation.copy() for suffix in ['l','r']}
 for suffix in ['l','r']:
  node=bpy.data.objects.new('Temporary tending hand '+suffix,None);bpy.context.collection.objects.link(node);targets.append(node)
  constraint=rig.pose.bones['lowerarm_'+suffix].constraints.new('IK');constraint.target=node;constraint.chain_count=2;constraint.use_stretch=False;ik.append(constraint)
 action(rig,'care_for_lamb')
 for f in range(85):
  p=f/84;bend=min(1,p/.24,(1-p)/.22);bend=max(0,bend);bend=bend*bend*(3-2*bend);apply_pose(rig,idle)
  move(rig,'pelvis',(0,0,-.12*bend));rotate(rig,'spine_02',(1,0,0),25*bend);rotate(rig,'spine_03',(1,0,0),15*bend);rotate(rig,'Head',(1,0,0),15*bend)
  rotate(rig,'thigh_l',(1,0,0),-16*bend);rotate(rig,'calf_l',(1,0,0),28*bend);rotate(rig,'thigh_r',(1,0,0),-13*bend);rotate(rig,'calf_r',(1,0,0),25*bend)
  for suffix,sign in [('r',-1),('l',1)]:
   aim(rig,'upperarm_'+suffix,(sign*.18,-.64,-.74));aim(rig,'lowerarm_'+suffix,(sign*.10,-.63,-.77))
   for joint in ['upperarm_'+suffix,'lowerarm_'+suffix]:rig.pose.bones[joint].rotation_quaternion=idle[joint][0].slerp(rig.pose.bones[joint].rotation_quaternion,bend)
  for constraint in ik:constraint.influence=1
  for index,suffix in enumerate(['l','r']):
   sign=1 if suffix=='l' else -1;contact=Vector((sign*.12,-.44,.58+.012*math.sin(p*math.pi*8)))
   targets[index].location=rig.matrix_world@starts[suffix].lerp(contact,bend)
  bpy.context.view_layer.update();matrices={bone.name:bone.matrix.copy() for bone in rig.pose.bones}
  for constraint in ik:constraint.influence=0
  for bone in rig.pose.bones:bone.matrix=matrices[bone.name]
  key(rig,f,bones,('pelvis',))
 for constraint in ik:
  owner=next(b for b in rig.pose.bones if constraint in list(b.constraints));owner.constraints.remove(constraint)
 for node in targets:bpy.data.objects.remove(node,do_unlink=True)

 name='david-adventure';base='idle_relaxed'
else:
 source=bpy.data.actions['goliath_spear'];poses=[sample_pose(rig,source,f) for f in range(79)]
 for number,direction in [(1,-1),(2,1),(3,0)]:
  action(rig,f'goliath_spear_{number}')
  for f,pose in enumerate(poses):
   apply_pose(rig,pose);emphasis=math.sin(math.pi*min(1,f/78))
   rotate(rig,'spine_02',(0,0,1),direction*11*emphasis);rotate(rig,'spine_03',(0,0,1),direction*9*emphasis)
   if number==3:rotate(rig,'spine_03',(1,0,0),-8*emphasis);rotate(rig,'upperarm_r',(0,1,0),-8*emphasis)
   rotate(rig,'Head',(0,0,1),-direction*12*emphasis);key(rig,f,bones,('pelvis',))
 name='goliath-encounter';base='goliath_ready'
rig.animation_data.action=bpy.data.actions[base];rig.animation_data.action_slot=rig.animation_data.action.slots[0];bpy.context.scene.frame_set(0)
bpy.ops.object.select_all(action='DESELECT')
for o in bpy.context.scene.objects:
 if o.type in ['ARMATURE','MESH']:o.select_set(True)
bpy.context.view_layer.objects.active=rig
bpy.ops.wm.save_as_mainfile(filepath=str(out/(name+'.blend')),compress=True)
bpy.ops.export_scene.gltf(filepath=str(out/(name+'.glb')),export_format='GLB',use_selection=True,export_animations=True,export_animation_mode='ACTIONS',export_force_sampling=True,export_yup=True,export_vertex_color='NAME',export_vertex_color_name='Palette')
print('ADVENTURE_ASSET',name,flush=True)
