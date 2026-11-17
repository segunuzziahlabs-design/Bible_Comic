"""Run in Blender with the editable David file open. Pass an output directory and optional --teen."""
from array import array
from math import exp, pi, sin, cos
from pathlib import Path
import sys

import bpy
from mathutils import Vector


def texture(label, kind, normal=False):
    size = 128
    pixels = array('f')
    for y in range(size):
        for x in range(size):
            u, v = x / size * 2 * pi, y / size * 2 * pi
            grain = sin(13 * u + 9 * v) * cos(17 * v - 5 * u)
            if kind == 'cloth':
                h = .027 * (sin(32 * u) + cos(32 * v)) + .025 * sin(3 * u + 2 * v)
                nx, ny = .085 * cos(32 * u), -.085 * sin(32 * v)
            else:
                strength = .018 if kind == 'skin' else .042
                h = strength * (sin(7 * u + 3 * v) * cos(6 * v) + grain / 2)
                nx, ny = strength * cos(7 * u + 3 * v), -strength * sin(6 * v)
            rgb = (.5 + nx, .5 + ny, .99) if normal else (max(.62, min(1, .94 + h)),) * 3
            pixels.extend((*rgb, 1))
    image = bpy.data.images.new(label, width=size, height=size, alpha=False)
    if normal:
        image.colorspace_settings.name = 'Non-Color'
    image.pixels.foreach_set(pixels)
    image.pack()
    return image


def material(name, roughness, detail=False):
    mat = bpy.data.materials.new(name.title())
    mat.use_nodes = True
    nodes, links = mat.node_tree.nodes, mat.node_tree.links
    shader = nodes.get('Principled BSDF')
    shader.inputs['Roughness'].default_value = roughness
    if detail:
        color = nodes.new('ShaderNodeTexImage')
        color.image = texture(name + '-tone', name)
        links.new(color.outputs['Color'], shader.inputs['Base Color'])
        normals = nodes.new('ShaderNodeTexImage')
        normals.image = texture(name + '-normal', name, normal=True)
        mapping = nodes.new('ShaderNodeNormalMap')
        links.new(normals.outputs['Color'], mapping.inputs['Color'])
        links.new(mapping.outputs['Normal'], shader.inputs['Normal'])
    return mat


def category(name):
    if name.startswith(('Face', 'Arm', 'Lower legs')):
        return 'skin'
    if name.startswith(('Tunic', 'Woven')):
        return 'cloth'
    if name.startswith(('Leather', 'Satchel', 'Belt', 'Sandal')):
        return 'leather'
    if name.startswith(('Eyes', 'Iris', 'Pupil')):
        return 'eyes'
    if name.startswith('Eyebrows'):
        return 'brows'
    return 'hair'


def prepare(obj, mat, kind):
    mesh = obj.data
    while mesh.uv_layers:
        mesh.uv_layers.remove(mesh.uv_layers[-1])
    for name in [attribute.name for attribute in mesh.color_attributes if attribute.name != 'Palette']:
        mesh.color_attributes.remove(mesh.color_attributes[name])
    uv = mesh.uv_layers.new(name='Surface detail')
    repeat = {'cloth': 2.2, 'leather': 4.0}.get(kind, 2.0)
    for polygon in mesh.polygons:
        direction = max(range(3), key=lambda axis: abs(polygon.normal[axis]))
        a, b = ((1, 2), (0, 2), (0, 1))[direction]
        for index in polygon.loop_indices:
            position = obj.matrix_world @ mesh.vertices[mesh.loops[index].vertex_index].co
            uv.data[index].uv = (repeat * position[a], repeat * position[b])
    mesh.materials.clear()
    mesh.materials.append(mat)


def combine(objects, kind):
    bpy.ops.object.select_all(action='DESELECT')
    for obj in objects:
        obj.select_set(True)
    bpy.context.view_layer.objects.active = objects[0]
    if len(objects) > 1:
        bpy.ops.object.join()
    mesh = bpy.context.object
    mesh.name = 'David ' + kind
    return mesh


def shape(obj, name, deform):
    if not obj.data.shape_keys:
        obj.shape_key_add(name='Basis')
    key = obj.shape_key_add(name=name)
    inverse = obj.matrix_world.to_3x3().inverted()
    for point in key.data:
        x, y, z = obj.matrix_world @ point.co
        point.co += inverse @ Vector(deform(x, y, z))


def smile(x, y, z):
    # Keep displacement close to the corners of the mouth.
    weight = exp(-((abs(x) - .026) / .014) ** 2 - ((z - 1.607) / .021) ** 2)
    weight *= min(1, max(0, (-y - .06) / .035))
    return (.003 * weight * (1 if x > 0 else -1), 0, .009 * weight)


def blink(x, _y, z):
    center = 1.674
    return (0, 0, (.12 - 1) * (z - center))


def brow(_x, _y, _z):
    return (0, 0, .013)


arguments = sys.argv[sys.argv.index('--') + 1:]
output = Path(arguments[0]).resolve()
output.mkdir(parents=True, exist_ok=True)
scene = bpy.context.scene
rig = next(obj for obj in scene.objects if obj.type == 'ARMATURE')
groups = {}
for obj in scene.objects:
    if obj.type == 'MESH':
        groups.setdefault(category(obj.name), []).append(obj)
roughness = {'skin': .62, 'cloth': .91, 'leather': .52, 'eyes': .36, 'hair': .78, 'brows': .82}
meshes = {}
for kind, parts in groups.items():
    mat = material(kind, roughness[kind], detail=kind in ('skin', 'cloth', 'leather'))
    for obj in parts:
        prepare(obj, mat, kind)
    meshes[kind] = combine(parts, kind)

shape(meshes['skin'], 'Smile', smile)
shape(meshes['brows'], 'BrowLift', brow)
shape(meshes['eyes'], 'Blink', blink)
if '--teen' in arguments[1:] or '--sling' in arguments[1:]:
    sys.path.insert(0, str(Path(__file__).resolve().parents[2] / 'source-assets' / 'characters'))
if '--teen' in arguments[1:]:
    from david_teen import apply_teen_fit
    apply_teen_fit(rig, meshes)
if '--sling' in arguments[1:]:
    from elah_combat import add_david_sling
    add_david_sling(rig)
    rig.animation_data.action = bpy.data.actions['idle_relaxed']
    rig.animation_data.action_slot = rig.animation_data.action.slots[0]
scene.frame_set(0)
bpy.ops.object.select_all(action='DESELECT')
for obj in (*meshes.values(), rig):
    obj.select_set(True)
bpy.context.view_layer.objects.active = rig
bpy.ops.wm.save_as_mainfile(filepath=str(output / 'david-comparison.blend'), compress=True)
bpy.ops.export_scene.gltf(
    filepath=str(output / 'david.glb'), export_format='GLB', use_selection=True,
    export_animations=True, export_animation_mode='ACTIONS', export_force_sampling=True,
    export_yup=True, export_vertex_color='NAME', export_vertex_color_name='Palette',
)
