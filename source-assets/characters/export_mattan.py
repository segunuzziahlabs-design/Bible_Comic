"""Derive the background worker from the editable David rig and wardrobe."""
from pathlib import Path

import bpy
from mathutils import Color


root = Path.cwd()
rig = next(obj for obj in bpy.context.scene.objects if obj.type == 'ARMATURE')
clips = {'idle_relaxed', 'walk_forward', 'pickup_provisions'}
for action in list(bpy.data.actions):
    if action.name not in clips:
        bpy.data.actions.remove(action, do_unlink=True)
idle = bpy.data.actions['idle_relaxed']
rig.animation_data.action = idle
rig.animation_data.action_slot = idle.slots[0]

bpy.ops.object.select_all(action='DESELECT')
parts = []
for obj in list(bpy.context.scene.objects):
    if obj.type != 'MESH':
        continue
    if obj.name.startswith(('Satchel', 'Curl', 'Belt knot')):
        bpy.data.objects.remove(obj, do_unlink=True)
        continue
    colour = None
    if obj.name.startswith(('Tunic', 'Woven hem')):
        colour = Color((.30, .18, .095)) if 'hem' not in obj.name else Color((.38, .27, .17))
    elif obj.name == 'Short curl cap':
        colour = Color((.46, .38, .26))
    palette = obj.data.color_attributes.get('Palette')
    if palette and colour:
        for entry in palette.data:
            shade = .84 + .16 * max(entry.color[:3])
            entry.color = (*[channel * shade for channel in colour], 1.0)
    obj.select_set(True)
    parts.append(obj)

bpy.context.view_layer.objects.active = parts[0]
bpy.ops.object.join()
mesh = bpy.context.object
mesh.name = 'Mattan dressed'
while mesh.data.uv_layers:
    mesh.data.uv_layers.remove(mesh.data.uv_layers[-1])
for attribute in list(mesh.data.color_attributes):
    if attribute.name != 'Palette':
        mesh.data.color_attributes.remove(attribute)
rig.select_set(True)
bpy.ops.export_scene.gltf(filepath=str(root / 'assets/characters/mattan.glb'), export_format='GLB',
                          use_selection=True, export_animations=True, export_animation_mode='ACTIONS',
                          export_force_sampling=True, export_yup=True, export_vertex_color='NAME',
                          export_vertex_color_name='Palette')
