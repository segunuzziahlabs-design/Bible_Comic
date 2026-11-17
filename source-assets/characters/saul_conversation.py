"""Add speaking faces and camp performances to prepared David and adult rigs."""
from math import cos, exp, pi, sin, tau
from pathlib import Path
import sys

import bpy
from mathutils import Vector

sys.path.insert(0, str(Path(__file__).parent))
from elah_combat import action, aim, apply_pose, bind, ellipse, key, material, mesh, mix_keys, rotate, sample_pose


arguments = sys.argv[sys.argv.index('--') + 1:]
output = Path(arguments[0]).resolve()
teen = '--teen' in arguments
output.mkdir(parents=True, exist_ok=True)
rig = next(obj for obj in bpy.context.scene.objects if obj.type == 'ARMATURE')
idle = sample_pose(rig, bpy.data.actions['idle_relaxed'], 0)
apply_pose(rig, {})
mouth_z = 1.618 if teen else 1.606


def mouth_shape(obj, name, deform):
    if not obj.data.shape_keys:
        obj.shape_key_add(name='Basis')
    shape = obj.shape_key_add(name=name)
    for point in shape.data:
        point.co = deform(point.co.copy())


def open_jaw(point):
    x, y, z = point
    weight = exp(-(x / .065) ** 4) * max(0, min(1, (-y - .043) / .04))
    weight *= max(0, min(1, (mouth_z + .013 - z) / .031))
    weight *= max(0, min(1, (z - 1.515) / .045))
    point.z -= .020 * weight
    point.y -= .002 * weight
    return point


skin = next(obj for obj in bpy.context.scene.objects if obj.type == 'MESH' and obj.name == 'David skin')
mouth_shape(skin, 'SpeakOpen', open_jaw)
dark = material('Mouth interior', (.047, .010, .008), .98)
lip = material('Lips', (.31, .11, .075) if teen else (.22, .066, .035), .71)
teeth = material('Teeth', (.71, .64, .51), .67)
segments = 24
vertices = [(0, -.0960, mouth_z)]
vertices += [(.025 * cos(tau * i / segments), -.0959,
              mouth_z + .0035 * sin(tau * i / segments)) for i in range(segments)]
inner = mesh('Speaking mouth', vertices, [(0, 1+i, 1+(i+1) % segments) for i in range(segments)], rig, 'Head', dark)
vertices = []
for radius in (1, 1.16):
    vertices += [(.025 * radius * cos(tau * i / segments), -.0974,
                  mouth_z + .0035 * radius * sin(tau * i / segments)) for i in range(segments)]
rim = mesh('Lip edge', vertices, [(i, (i+1) % segments, segments+(i+1) % segments, segments+i)
                                for i in range(segments)], rig, 'Head', lip)


def open_mouth(point):
    normal = (point.z - mouth_z) / .0035
    point.z += .0130 * normal - .0065
    return point


def round_mouth(point):
    point.x *= .73
    point.y -= .0017
    return point


for part in (inner, rim):
    mouth_shape(part, 'SpeakOpen', open_mouth)
    mouth_shape(part, 'SpeakRound', round_mouth)

# A narrow upper tooth strip stays inside the moving lip edge.
tooth = mesh('Upper teeth', [(-.016, -.0967, mouth_z+.0015), (.016, -.0967, mouth_z+.0015),
                            (.014, -.0967, mouth_z-.0006), (-.014, -.0967, mouth_z-.0006)],
             [(0, 1, 2, 3)], rig, 'Head', teeth)

if not teen:
    for obj in list(bpy.context.scene.objects):
        if obj.type == 'MESH' and obj.name == 'David leather':
            bpy.data.objects.remove(obj, do_unlink=True)
    colours = {
        'Skin': (.46, .265, .15), 'Cloth': (.265, .045, .038), 'Hair': (.075, .047, .028),
        'Brows': (.060, .037, .021), 'Eyes': (.75, .70, .61),
    }
    for name, colour in colours.items():
        mat = bpy.data.materials.get(name)
        if mat:
            shader = mat.node_tree.nodes.get('Principled BSDF')
            shader.inputs['Base Color'].default_value = (*colour, 1)
            # Preserve the woven texture while tinting it at runtime.
            mat.diffuse_color = (*colour, 1)
    wool = material('Royal mantle', (.27, .036, .03), .94)
    gold = material('Worked bronze', (.51, .31, .09), .48, .35)
    brown = material('Saul beard', (.075, .045, .028), .89)
    hide = material('Saul sandals', (.13, .072, .035), .9)
    for side, suffix in ((-1, 'r'), (1, 'l')):
        ellipse('Saul beard cheek', (side * .057, -.069, 1.579), (.026, .025, .045), rig, 'Head', brown)
        ellipse('Saul moustache', (side * .025, -.100, 1.621), (.026, .010, .007), rig, 'Head', brown)
        ellipse('Saul sandal', (side * .145, -.01, .045), (.071, .15, .030), rig, 'foot_' + suffix, hide)
    beard = ellipse('Saul beard jaw', (0, -.067, 1.558), (.057, .035, .041), rig, 'Head', brown)
    mouth_shape(beard, 'SpeakOpen', lambda p: p + Vector((0, 0, -.008)))
    ellipse('Mantle clasp', (.18, -.134, 1.445), (.031, .013, .031), rig, 'spine_03', gold)
    # Open circlet with a restrained hammered-metal silhouette.
    vertices = []
    for row, z in enumerate((1.715, 1.744)):
        for i in range(32):
            angle = tau * i / 32
            rise = .014 if row and i % 4 == 0 else 0
            vertices.append((.119*cos(angle), .018 + .139*sin(angle), z + rise))
    mesh('Saul circlet', vertices, [(i, (i+1) % 32, 32+(i+1) % 32, 32+i) for i in range(32)], rig, 'Head', gold)
    mantle_vertices = []
    for row in range(7):
        z = 1.49 - row * .102
        for col in range(9):
            x = -.27 + col * .068
            y = .166 + .016*cos(col*pi/2) + .045*(row/6)
            mantle_vertices.append((x, y, z))
    mantle = mesh('Saul mantle back', mantle_vertices,
        [(r*9+c, r*9+c+1, (r+1)*9+c+1, (r+1)*9+c) for r in range(6) for c in range(8)],
        rig, 'spine_03', wool)
    for face in mantle.data.polygons:
        face.use_smooth = True
    solid = mantle.modifiers.new('Wool thickness', 'SOLIDIFY')
    solid.thickness = .006
    for modifier in list(mantle.modifiers):
        if modifier.type == 'SOLIDIFY':
            bpy.context.view_layer.objects.active = mantle
            bpy.ops.object.modifier_apply(modifier=modifier.name)
    # A shoulder fold gives the mantle depth in the dialogue two-shot.
    ellipse('Mantle shoulder fold', (.238, .036, 1.456), (.105, .157, .065), rig, 'clavicle_l', wool)
    rig.scale = (1.075,) * 3

bones = ('spine_02', 'spine_03', 'Head', 'upperarm_l', 'lowerarm_l', 'hand_l',
         'upperarm_r', 'lowerarm_r', 'hand_r')
poses = ([(0, (0, 0)), (13, (.55, -8)), (31, (.85, -4)), (57, (.65, 4)), (82, (.25, 1)), (106, (0, 0))]
         if teen else [(0, (0, 0)), (13, (.5, 4)), (32, (.7, 7)), (51, (.3, -2)), (77, (0, 0))])
action(rig, 'speak_resolve' if teen else 'speak_concern')
for frame in range(poses[-1][0] + 1):
    apply_pose(rig, idle)
    gesture, tilt = mix_keys(poses, frame)
    rotate(rig, 'spine_03', (0, 0, 1), tilt)
    rotate(rig, 'Head', (1, 0, 0), -2.5 * gesture)
    if gesture:
        aim(rig, 'upperarm_r', (-.20, -.10-gesture*.40, -.96+gesture*.20))
        aim(rig, 'lowerarm_r', (.04 + .2*gesture, -.73, -.60+gesture*.66))
        aim(rig, 'hand_r', (.10, -.92, -.25+gesture*.55))
    key(rig, frame, bones)

rig.animation_data.action = bpy.data.actions['idle_relaxed']
rig.animation_data.action_slot = rig.animation_data.action.slots[0]
bpy.context.scene.frame_set(0)
bpy.ops.object.select_all(action='SELECT')
bpy.context.view_layer.objects.active = rig
name = 'david-dialogue' if teen else 'saul'
bpy.ops.wm.save_as_mainfile(filepath=str(output / (name + '.blend')), compress=True)
bpy.ops.export_scene.gltf(filepath=str(output / (name + '.glb')), export_format='GLB', use_selection=True,
    export_animations=True, export_animation_mode='ACTIONS', export_force_sampling=True,
    export_yup=True, export_vertex_color='NAME', export_vertex_color_name='Palette')
