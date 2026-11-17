"""Align retained spear performances with David-sized physical targets; preserve source GLB."""
from pathlib import Path
import bpy,math,json,sys
from mathutils import Vector
sys.path.insert(0,str(Path(__file__).parent))
from elah_combat import sample_pose,apply_pose,action,key,aim,rotate,move
root=Path.cwd();bpy.ops.wm.read_factory_settings(use_empty=True)
bpy.ops.import_scene.gltf(filepath=str(root/'apps/playcanvas/src/assets/goliath-encounter.glb'))
rig=next(o for o in bpy.data.objects if o.type=='ARMATURE');scene=bpy.context.scene;scene.render.fps=24
names=['goliath_spear','goliath_spear_1','goliath_spear_2','goliath_spear_3']
source={name:[sample_pose(rig,bpy.data.actions[name],f) for f in range(79)] for name in names}
for track in list(rig.animation_data.nla_tracks):rig.animation_data.nla_tracks.remove(track)
rig.animation_data.action=None
for name in names:bpy.data.actions.remove(bpy.data.actions[name],do_unlink=True)
bones=tuple(b.name for b in rig.pose.bones)
def to_blender(point):return Vector((point[0],-point[2],point[1]))
def smooth(t):t=max(0,min(1,t));return t*t*(3-2*t)
targets=[];constraints=[]
for suffix in ['r','l']:
 node=bpy.data.objects.new('Temporary planted foot '+suffix,None);bpy.context.collection.objects.link(node);targets.append(node)
 c=rig.pose.bones['calf_'+suffix].constraints.new('IK');c.target=node;c.chain_count=2;c.use_stretch=False;constraints.append(c)
hand=bpy.data.objects.new('Temporary thrust hand',None);bpy.context.collection.objects.link(hand)
arm=rig.pose.bones['lowerarm_r'].constraints.new('IK');arm.target=hand;arm.chain_count=2;arm.use_stretch=False;constraints.append(arm)
measurements=[]
for name in names:
 kind=0 if name.endswith('_1') else 2 if name.endswith('_3') else 1
 action(rig,name)
 for f,pose in enumerate(source[name]):
  for c in constraints:c.influence=0
  apply_pose(rig,pose);bpy.context.view_layer.update()
  old_grip=rig.matrix_world@rig.pose.bones['Spear grip'].head
  old_hand=rig.matrix_world@rig.pose.bones['hand_r'].head
  for suffix,node in zip(['r','l'],targets):node.location=rig.matrix_world@rig.pose.bones['foot_'+suffix].head
  weight=smooth((f-29)/11)*(1-smooth((f-49)/14));pulse=math.sin(math.pi*max(0,min(1,(f-38)/12)))
  move(rig,'pelvis',(0,0,-(.075 if kind==0 else .015 if kind==1 else 0)*weight))
  rotate(rig,'spine_02',(1,0,0),(9 if kind==0 else 3)*weight)
  desired=to_blender((-.20,[1.15,1.48,1.70][kind],1.0+.30*pulse))
  desired=old_grip.lerp(desired,weight)
  hand.location=old_hand+(desired-old_grip)
  for c in constraints:c.influence=weight
  for _ in range(5):
   bpy.context.view_layer.update();current=rig.matrix_world@rig.pose.bones['Spear grip'].head;hand.location+=desired-current
  bpy.context.view_layer.update()
  actual=rig.matrix_world@rig.pose.bones['Spear grip'].head
  target=to_blender((0,[.32,.98,1.52][kind],2.45))
  if weight>0:
   original=rig.pose.bones['Spear grip'].rotation_quaternion.copy()
   direction=rig.matrix_world.inverted().to_3x3()@(target-actual)
   aim(rig,'Spear grip',direction)
   rig.pose.bones['Spear grip'].rotation_quaternion=original.slerp(rig.pose.bones['Spear grip'].rotation_quaternion,weight)
  bpy.context.view_layer.update();matrices={b.name:b.matrix.copy() for b in rig.pose.bones}
  for c in constraints:c.influence=0
  for b in rig.pose.bones:b.matrix=matrices[b.name]
  key(rig,f,bones,('pelvis',))
 for f in [41,44,47]:
  scene.frame_set(f);bpy.context.view_layer.update();row={'clip':name,'frame':f}
  for k,n in [('grip','Spear grip'),('tip','Spear tip')]:
   p=rig.matrix_world@rig.pose.bones[n].head;row[k]=[round(p.x,5),round(p.z,5),round(-p.y,5)]
  measurements.append(row)
for c in constraints:
 owner=next(b for b in rig.pose.bones if c in list(b.constraints));owner.constraints.remove(c)
for o in targets+[hand]:bpy.data.objects.remove(o,do_unlink=True)
rig.animation_data.action=bpy.data.actions['goliath_ready'];rig.animation_data.action_slot=rig.animation_data.action.slots[0];scene.frame_set(0)
bpy.context.preferences.filepaths.save_version=0
bpy.ops.wm.save_as_mainfile(filepath=str(root/'source-assets/characters/goliath-collision.blend'),compress=True)
bpy.ops.object.select_all(action='DESELECT')
for o in scene.objects:
 if o.type in ['ARMATURE','MESH']:o.select_set(True)
bpy.context.view_layer.objects.active=rig
bpy.ops.export_scene.gltf(filepath=str(root/'apps/playcanvas/src/assets/goliath-collision.glb'),export_format='GLB',use_selection=True,export_animations=True,export_animation_mode='ACTIONS',export_force_sampling=True,export_yup=True,export_vertex_color='NONE')
(root/'source-assets/characters/goliath-collision.json').write_text(json.dumps({'source':'Retained goliath-encounter.glb; original low/middle/high alignment, planted feet and hand IK baked by this script.','measurements':measurements},indent=2),encoding='utf-8')
print('COLLISION_SPEAR_POSES',json.dumps(measurements),flush=True)
