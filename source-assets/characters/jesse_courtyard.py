"""Export the retained Q02 Jesse with a small speaking mouth for PlayCanvas.

Open source-assets/characters/jesse.blend; pass an output directory after --.
The original clay mantle, grey beard, greeting and pointing clips are retained.
"""
from pathlib import Path
from math import cos, sin, tau, exp
import sys
import bpy

sys.path.insert(0, str(Path(__file__).parent))
from elah_combat import apply_pose, material, mesh

out = Path(sys.argv[sys.argv.index('--') + 1]).resolve()
out.mkdir(parents=True, exist_ok=True)
rig = next(o for o in bpy.context.scene.objects if o.type == 'ARMATURE')
apply_pose(rig, {})
rig.data.pose_position = 'POSE'

# The editable Q02 source preserves many wardrobe parts. Merge its shared-palette
# body for the browser, as the earlier Godot export did, before adding face keys.
parts = [o for o in bpy.context.scene.objects if o.type == 'MESH']
bpy.ops.object.select_all(action='DESELECT')
for obj in parts:
    obj.select_set(True)
bpy.context.view_layer.objects.active = parts[0]
bpy.ops.object.join()
bpy.context.object.name = 'Jesse face beard and clothing'

def morph(obj, name, deform):
    if not obj.data.shape_keys:
        obj.shape_key_add(name='Basis')
    key = obj.shape_key_add(name=name)
    for point in key.data:
        point.co = deform(point.co.copy())

# The retained beard leaves the mouth free immediately below the moustache.
height, front, segments = 1.619, -.109, 24
inside = material('Jesse mouth interior', (.055, .015, .012), .95)
lips = material('Jesse lips', (.26, .12, .075), .86)
vertices = [(0, front, height)] + [(.024*cos(tau*i/segments), front,
    height+.0035*sin(tau*i/segments)) for i in range(segments)]
opening = mesh('Jesse speaking mouth', vertices,
    [(0, 1+i, 1+(i+1)%segments) for i in range(segments)], rig, 'Head', inside)
vertices = [(.024*r*cos(tau*i/segments), front-.001,
    height+.0035*r*sin(tau*i/segments)) for r in [1, 1.12] for i in range(segments)]
edge = mesh('Jesse lip edge', vertices,
    [(i,(i+1)%segments,segments+(i+1)%segments,segments+i) for i in range(segments)], rig, 'Head', lips)

def open_mouth(p):
    p.z += (p.z-height)/.0035*.012-.005
    return p

def round_mouth(p):
    p.x *= .75
    p.y -= .001
    return p

for obj in [opening, edge]:
    morph(obj, 'SpeakOpen', open_mouth)
    morph(obj, 'SpeakRound', round_mouth)

# A restrained jaw shift affects the existing weighted face/beard vertices.
for obj in list(bpy.context.scene.objects):
    if obj.type != 'MESH' or obj in [opening, edge]:
        continue
    world, inverse = obj.matrix_world.copy(), obj.matrix_world.inverted()
    def jaw(p):
        q = world @ p
        weight = exp(-(q.x/.065)**4) * max(0,min(1,(-q.y-.04)/.04))
        weight *= max(0,min(1,(1.63-q.z)/.035)) * max(0,min(1,(q.z-1.51)/.04))
        q.z -= .012*weight
        return inverse @ q
    if 'face' in obj.name.lower() or 'beard' in obj.name.lower():
        morph(obj, 'SpeakOpen', jaw)

rig.animation_data.action = bpy.data.actions['idle_relaxed']
rig.animation_data.action_slot = rig.animation_data.action.slots[0]
bpy.context.scene.frame_set(0)
bpy.ops.object.select_all(action='DESELECT')
for obj in bpy.context.scene.objects:
    if obj.type in ['ARMATURE', 'MESH']:
        obj.select_set(True)
bpy.context.view_layer.objects.active = rig
bpy.ops.wm.save_as_mainfile(filepath=str(out/'jesse-courtyard.blend'), compress=True)
bpy.ops.export_scene.gltf(filepath=str(out/'jesse-courtyard.glb'), export_format='GLB',
    use_selection=True, export_animations=True, export_animation_mode='ACTIONS',
    export_force_sampling=True, export_yup=True,
    export_vertex_color='NAME', export_vertex_color_name='Palette')
print('JESSE_COURTYARD_EXPORTED', flush=True)
