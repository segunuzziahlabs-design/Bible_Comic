"""Retained character, original overarm spear throw; split held weapon for real release."""
from pathlib import Path
import bpy,bmesh,sys,math
sys.path.insert(0,str(Path(__file__).parent))
from elah_combat import sample_pose,champion_pose,action,key,mix_keys
root=Path.cwd();bpy.ops.wm.read_factory_settings(use_empty=True)
bpy.ops.import_scene.gltf(filepath=str(root/'apps/playcanvas/src/assets/goliath-collision.glb'))
rig=next(o for o in bpy.data.objects if o.type=='ARMATURE');scene=bpy.context.scene;scene.render.fps=24
idle=sample_pose(rig,bpy.data.actions['goliath_ready'],0)
for track in list(rig.animation_data.nla_tracks):rig.animation_data.nla_tracks.remove(track)
action(rig,'goliath_throw')
poses=[(0,(-.06,-.35,.10,0,0,0,0,0)),(8,(-1.75,.75,1.0,-7,-16,0,.02,.4)),(17,(-2.35,1.05,1.28,-11,-24,-.02,.07,.65)),(21,(-1.0,.95,1.15,-2,-7,-.02,0,.7)),(24,(1.90,.25,1.02,12,14,-.025,-.08,.8)),(30,(1.40,-.32,1.65,17,22,-.04,-.12,.8)),(42,(.45,-.5,.50,5,7,-.02,-.04,.3)),(58,(-.06,-.35,.10,0,0,0,0,0)),(72,(-.06,-.35,.10,0,0,0,0,0))]
for frame in range(73):champion_pose(rig,idle,mix_keys(poses,frame));key(rig,frame,tuple(b.name for b in rig.pose.bones),('pelvis',))
# The old shaft shares a material/mesh with leather clothing. Split only spear-weighted faces.
for obj in list(scene.objects):
 if obj.type!='MESH' or obj.name=='Goliath Spear iron':continue
 group=obj.vertex_groups.get('Spear grip')
 if not group:continue
 ids={v.index for v in obj.data.vertices if any(g.group==group.index and g.weight>.99 for g in v.groups)}
 if not ids:continue
 copy=obj.copy();copy.data=obj.data.copy();copy.name='Goliath spear shaft';bpy.context.collection.objects.link(copy)
 for mesh,keep in [(copy.data,True),(obj.data,False)]:
  bm=bmesh.new();bm.from_mesh(mesh);bm.verts.ensure_lookup_table();remove=[v for v in bm.verts if (v.index not in ids if keep else v.index in ids)];bmesh.ops.delete(bm,geom=remove,context='VERTS');bm.to_mesh(mesh);bm.free();mesh.update()
scene.objects['Goliath Spear iron'].name='Goliath spear head'
rig.animation_data.action=bpy.data.actions['goliath_ready'];rig.animation_data.action_slot=rig.animation_data.action.slots[0];scene.frame_set(0)
bpy.context.preferences.filepaths.save_version=0
bpy.ops.wm.save_as_mainfile(filepath=str(root/'source-assets/characters/goliath-ranged.blend'),compress=True)
bpy.ops.object.select_all(action='DESELECT')
for obj in scene.objects:
 if obj.type in ['MESH','ARMATURE']:obj.select_set(True)
bpy.context.view_layer.objects.active=rig
bpy.ops.export_scene.gltf(filepath=str(root/'apps/playcanvas/src/assets/goliath-ranged.glb'),export_format='GLB',use_selection=True,export_animations=True,export_animation_mode='ACTIONS',export_force_sampling=True,export_yup=True,export_vertex_color='NONE')
print('RANGED_SPEAR_EXPORT_COMPLETE',flush=True)
