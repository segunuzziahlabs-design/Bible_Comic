"""Add an upper-body carry and deliberate provisions set-down to the prepared teenage David."""
from pathlib import Path
import json
import sys
import bpy
from mathutils import Vector
sys.path.insert(0,str(Path(__file__).parent))
from elah_combat import action,apply_pose,aim,key,mix_keys,rotate,sample_pose

output=Path(sys.argv[sys.argv.index('--')+1]).resolve();output.parent.mkdir(parents=True,exist_ok=True)
rig=next(obj for obj in bpy.context.scene.objects if obj.type=='ARMATURE')
idle=sample_pose(rig,bpy.data.actions['idle_relaxed'],0)
bones=('spine_02','spine_03','Head','upperarm_l','lowerarm_l','hand_l','upperarm_r','lowerarm_r','hand_r')
poses=[(0,(0,1)),(16,(0,1)),(32,(.6,1)),(42,(1,1)),(50,(1,1)),(64,(.45,.3)),(82,(0,0))]
action(rig,'deliver_provisions')
for frame in range(83):
    apply_pose(rig,idle)
    reach,hold=mix_keys(poses,frame)
    rotate(rig,'spine_03',(1,0,0),reach*14)
    rotate(rig,'Head',(1,0,0),reach*7)
    if hold>0:
        for side,suffix in [(-1,'r'),(1,'l')]:
            aim(rig,'upperarm_'+suffix,(side*(.22-.08*reach),-.37-.25*reach,-.9+.08*reach))
            aim(rig,'lowerarm_'+suffix,(-side*.16,-.88,.42-.62*reach))
            aim(rig,'hand_'+suffix,(-side*.10,-.98,-.08))
            if hold<1:
                for name in ['upperarm_'+suffix,'lowerarm_'+suffix,'hand_'+suffix]:
                    rig.pose.bones[name].rotation_quaternion=idle[name][0].slerp(rig.pose.bones[name].rotation_quaternion,hold)
    key(rig,frame,bones)
metrics={}
for frame in [0,42,50,82]:
    bpy.context.scene.frame_set(frame)
    hands=[rig.matrix_world @ rig.pose.bones[name].matrix.translation for name in ['hand_l','hand_r']]
    centre=(hands[0]+hands[1])/2
    metrics[str(frame)]={'hands_source_world':list(centre),'hand_gap':(hands[0]-hands[1]).length}
rig.animation_data.action=bpy.data.actions['idle_relaxed'];rig.animation_data.action_slot=rig.animation_data.action.slots[0]
bpy.context.scene.frame_set(0)
bpy.ops.object.select_all(action='SELECT')
bpy.context.view_layer.objects.active=rig
bpy.ops.wm.save_as_mainfile(filepath=str(output.with_suffix('.blend')),compress=True)
bpy.ops.export_scene.gltf(filepath=str(output),export_format='GLB',use_selection=True,export_animations=True,export_animation_mode='ACTIONS',export_force_sampling=True,export_yup=True,export_vertex_color='NAME',export_vertex_color_name='Palette')
output.with_suffix('.json').write_text(json.dumps(metrics,indent=2)+'\n',encoding='utf-8')
print('DELIVERY_HAND_METRICS',json.dumps(metrics),flush=True)
