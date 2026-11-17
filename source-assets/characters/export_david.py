"""Open the Q02 David acting .blend in Blender and export the Q03 character."""
from math import sin, tau
from pathlib import Path

import bpy
from mathutils import Quaternion


root = Path.cwd()
scene = bpy.context.scene
rig = next(obj for obj in scene.objects if obj.type == 'ARMATURE')
idle = bpy.data.actions['listen'].copy()
idle.name = 'idle_relaxed'
idle.use_fake_user = True
idle.use_cyclic = True
rig.animation_data.action = idle
rig.animation_data.action_slot = idle.slots[0]
head = rig.pose.bones['Head']
spine = rig.pose.bones['spine_03']

for frame in range(61):
    scene.frame_set(frame)
    breath = sin(tau * frame / 60.)
    head_axes = head.bone.matrix_local.to_quaternion()
    spine_axes = spine.bone.matrix_local.to_quaternion()
    head.rotation_quaternion = head_axes.inverted() @ Quaternion((1, 0, 0), .022 + .008 * breath) @ head_axes
    spine.rotation_quaternion = (spine_axes.inverted() @ Quaternion((0, 0, 1), -.10)
                                 @ spine_axes @ spine.rotation_quaternion)
    for bone in (head, spine):
        bone.keyframe_insert('rotation_quaternion', frame=frame, group=bone.name)

scene.frame_start = 0
scene.frame_end = 60
scene.frame_set(0)
parts = [obj for obj in scene.objects if obj.type == 'MESH']
bpy.ops.object.select_all(action='DESELECT')
for obj in parts:
    obj.select_set(True)
rig.select_set(True)
bpy.context.view_layer.objects.active = rig
bpy.ops.wm.save_as_mainfile(filepath=str(root / 'source-assets/characters/david.blend'), compress=True)

# The editable file keeps separate wardrobe pieces. The GLB draws one surface.
rig.select_set(False)
bpy.context.view_layer.objects.active = parts[0]
bpy.ops.object.join()
mesh = bpy.context.object
mesh.name = 'David dressed'
while mesh.data.uv_layers:
    mesh.data.uv_layers.remove(mesh.data.uv_layers[-1])
for attribute in list(mesh.data.color_attributes):
    if attribute.name != 'Palette':
        mesh.data.color_attributes.remove(attribute)
rig.select_set(True)
bpy.ops.export_scene.gltf(filepath=str(root / 'assets/characters/david.glb'), export_format='GLB',
                          use_selection=True, export_animations=True, export_animation_mode='ACTIONS',
                          export_force_sampling=True, export_yup=True, export_vertex_color='NAME',
                          export_vertex_color_name='Palette')
