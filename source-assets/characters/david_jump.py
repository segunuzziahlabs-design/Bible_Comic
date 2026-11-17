"""Original in-place CTRL-04 clips on the existing teenage David rig."""
from pathlib import Path
import math, sys, json
import bpy
from mathutils import Vector
sys.path.insert(0, str(Path(__file__).parent))
from elah_combat import sample_pose, apply_pose, action, key, rotate, move

root = Path.cwd()
bpy.ops.wm.read_factory_settings(use_empty=True)
bpy.ops.import_scene.gltf(filepath=str(root/'apps/playcanvas/src/assets/david-adventure.glb'))
rig = next(o for o in bpy.context.scene.objects if o.type == 'ARMATURE')
scene = bpy.context.scene
scene.render.fps = 30
idle = sample_pose(rig, bpy.data.actions['idle_relaxed'], 0)
bones = tuple(b.name for b in rig.pose.bones)
apply_pose(rig, idle)
feet = {s: rig.pose.bones['foot_'+s].matrix.translation.copy() for s in ('l','r')}
for track in list(rig.animation_data.nla_tracks): rig.animation_data.nla_tracks.remove(track)
rig.animation_data.action = None
for previous in list(bpy.data.actions): bpy.data.actions.remove(previous, do_unlink=True)
targets, constraints = [], []
for suffix in ('l','r'):
    target = bpy.data.objects.new('Temporary foot plant '+suffix, None)
    bpy.context.collection.objects.link(target)
    target.location = rig.matrix_world @ feet[suffix]
    constraint = rig.pose.bones['calf_'+suffix].constraints.new('IK')
    constraint.target = target
    constraint.chain_count = 2
    constraint.use_stretch = False
    targets.append(target); constraints.append(constraint)

def smooth(t):
    t = max(0, min(1, t)); return t*t*(3-2*t)

def bake(frame, planted):
    for constraint in constraints: constraint.influence = 1 if planted else 0
    bpy.context.view_layer.update()
    matrices = {b.name: b.matrix.copy() for b in rig.pose.bones}
    for constraint in constraints: constraint.influence = 0
    for bone in rig.pose.bones: bone.matrix = matrices[bone.name]
    key(rig, frame, bones, ('pelvis',))

clips = [('jump_takeoff', 6), ('jump_air', 20), ('jump_land', 8)]
for name, end in clips:
    action(rig, name)
    for frame in range(end+1):
        p = frame/end
        apply_pose(rig, idle)
        if name == 'jump_takeoff':
            crouch = math.sin(math.pi*p)**1.3
            move(rig, 'pelvis', (0, 0, -.105*crouch))
            rotate(rig, 'spine_02', (1,0,0), 11*crouch)
            rotate(rig, 'Head', (1,0,0), -7*crouch)
            arms = -18*crouch - 32*smooth(p)
            for suffix, sign in [('l',1),('r',-1)]:
                rotate(rig, 'upperarm_'+suffix, (1,0,0), arms)
                rotate(rig, 'upperarm_'+suffix, (0,1,0), sign*9*p)
                rotate(rig, 'lowerarm_'+suffix, (1,0,0), -18*smooth(p))
            bake(frame, True)
        elif name == 'jump_air':
            tuck = math.sin(math.pi*p)**1.2
            for suffix, sign in [('l',1),('r',-1)]:
                rotate(rig, 'thigh_'+suffix, (1,0,0), -(27 if suffix=='l' else 20)*tuck)
                rotate(rig, 'calf_'+suffix, (1,0,0), (57 if suffix=='l' else 48)*tuck)
                rotate(rig, 'foot_'+suffix, (1,0,0), 12*tuck)
                rotate(rig, 'upperarm_'+suffix, (1,0,0), -32*(1-p)-9*tuck)
                rotate(rig, 'upperarm_'+suffix, (0,1,0), sign*(9+14*tuck)*(1-p*.5))
                rotate(rig, 'lowerarm_'+suffix, (1,0,0), -18*(1-p)-9*tuck)
            rotate(rig, 'spine_02', (1,0,0), -3*tuck)
            bake(frame, False)
        else:
            compression = math.sin(math.pi*p)**1.1
            move(rig, 'pelvis', (0, 0, -.12*compression))
            rotate(rig, 'spine_02', (1,0,0), 12*compression)
            rotate(rig, 'Head', (1,0,0), -9*compression)
            for suffix, sign in [('l',1),('r',-1)]:
                rotate(rig, 'upperarm_'+suffix, (1,0,0), -15*compression)
                rotate(rig, 'upperarm_'+suffix, (0,1,0), sign*9*(1-p))
                rotate(rig, 'lowerarm_'+suffix, (1,0,0), -13*compression)
            bake(frame, True)

for constraint in constraints:
    owner = next(b for b in rig.pose.bones if constraint in list(b.constraints))
    owner.constraints.remove(constraint)
for target in targets: bpy.data.objects.remove(target, do_unlink=True)
rig.animation_data.action = bpy.data.actions['jump_takeoff']
rig.animation_data.action_slot = rig.animation_data.action.slots[0]
scene.frame_set(0)
scene.frame_start = 0; scene.frame_end = 20
bpy.context.preferences.filepaths.save_version = 0
bpy.ops.wm.save_as_mainfile(filepath=str(root/'source-assets/characters/david-jump.blend'), compress=True)
bpy.ops.object.select_all(action='DESELECT')
rig.select_set(True); bpy.context.view_layer.objects.active = rig
bpy.ops.export_scene.gltf(filepath=str(root/'apps/playcanvas/src/assets/david-jump.glb'),
    export_format='GLB', use_selection=True, export_animations=True,
    export_animation_mode='ACTIONS', export_force_sampling=True, export_yup=True)
record = {'source':'Existing project teenage David rig; original poses authored by this script.',
          'rootMotion':'None; controller supplies physical vertical motion.',
          'clips':[{'name':name,'frames':end+1,'fps':30} for name,end in clips],
          'rig':rig.name,'bones':len(bones)}
(root/'source-assets/characters/david-jump.json').write_text(json.dumps(record,indent=2),encoding='utf-8')
print('CTRL04_JUMP_ASSET', json.dumps(record), flush=True)
