"""Author the Elah actors using the project's weighted Blender character rig."""
from math import cos, pi, sin, tau
from pathlib import Path
import sys

import bpy
from mathutils import Quaternion, Vector


def sample_pose(rig, action, frame):
    rig.animation_data.action = action
    rig.animation_data.action_slot = action.slots[0]
    bpy.context.scene.frame_set(frame)
    return {b.name: (b.rotation_quaternion.copy(), b.location.copy()) for b in rig.pose.bones}


def apply_pose(rig, pose):
    for b in rig.pose.bones:
        b.rotation_mode = 'QUATERNION'
        b.rotation_quaternion, b.location = pose.get(b.name, (Quaternion(), Vector((0, 0, 0))))
    bpy.context.view_layer.update()


def aim(rig, name, direction):
    """Aim the joint in character space while keeping its inherited twist."""
    b = rig.pose.bones[name]
    axes = b.matrix.to_quaternion()
    swing = (b.tail - b.head).rotation_difference(Vector(direction))
    b.rotation_quaternion = b.rotation_quaternion @ axes.inverted() @ swing @ axes
    bpy.context.view_layer.update()


def rotate(rig, name, axis, degrees):
    b = rig.pose.bones[name]
    rest = b.bone.matrix_local.to_quaternion()
    b.rotation_quaternion = rest.inverted() @ Quaternion(axis, degrees * pi / 180) @ rest @ b.rotation_quaternion
    bpy.context.view_layer.update()


def move(rig, name, offset):
    b = rig.pose.bones[name]
    b.location += b.bone.matrix_local.to_quaternion().inverted() @ Vector(offset)


def action(rig, name):
    result = bpy.data.actions.new(name)
    result.use_fake_user = True
    rig.animation_data.action = result
    return result


def key(rig, frame, bones, translation=()):
    for name in bones:
        b = rig.pose.bones[name]
        b.keyframe_insert('rotation_quaternion', frame=frame, group=name)
        if name in translation:
            b.keyframe_insert('location', frame=frame, group=name)


def mix_keys(frames, at):
    for (start, first), (end, second) in zip(frames, frames[1:]):
        if at <= end:
            t = (at - start) / (end - start)
            return tuple(a + (b - a) * t for a, b in zip(first, second))
    return frames[-1][1]


def add_david_sling(rig):
    # Shoulder draw, overhead sling arc, whip and cross-body follow-through.
    idle = sample_pose(rig, bpy.data.actions['idle_relaxed'], 0)
    bones = ('spine_02', 'spine_03', 'upperarm_r', 'lowerarm_r', 'hand_r',
             'upperarm_l', 'lowerarm_l', 'Head')
    poses = [
        (0, (-.12, -.16, -.96, -.12, -.70, -.70, 0, 0)),
        (3, (-.52, .27, -.78, -.32, -.86, .35, 12, -5)),
        (6, (-.86, .35, .37, -.48, -.23, .84, 22, -9)),
        (9, (-.68, .44, .58, -.18, -.68, .71, 30, -11)),
        (11, (-.62, -.51, .61, .10, -.96, .26, 14, -2)),
        (13, (-.31, -.94, .13, .13, -.98, .05, -12, 9)),
        (16, (.39, -.86, -.32, .48, -.79, -.28, -31, 15)),
        (19, (.20, -.69, -.68, .43, -.84, -.32, -21, 8)),
        (23, (-.12, -.16, -.96, -.12, -.70, -.70, 0, 0)),
    ]
    action(rig, 'sling_throw')
    for frame in range(24):
        apply_pose(rig, idle)
        ux, uy, uz, ex, ey, ez, turn, lean = mix_keys(poses, frame)
        rotate(rig, 'spine_02', (0, 0, 1), turn * .35)
        rotate(rig, 'spine_03', (0, 0, 1), turn * .65)
        rotate(rig, 'spine_03', (1, 0, 0), lean)
        rotate(rig, 'Head', (0, 0, 1), -turn * .75)
        aim(rig, 'upperarm_r', (ux, uy, uz))
        aim(rig, 'lowerarm_r', (ex, ey, ez))
        aim(rig, 'hand_r', (ex * .9, ey, ez - .12))
        if 2 <= frame <= 22:
            opening = sin(pi * (frame - 2) / 20)
            aim(rig, 'upperarm_l', (.14 + .56 * opening, -.14 - .36 * opening, -.95 + .57 * opening))
            aim(rig, 'lowerarm_l', (.12 + .43 * opening, -.56, -.75 + .6 * opening))
        key(rig, frame, bones)


def material(name, colour, roughness=.73, metallic=0):
    result = bpy.data.materials.new(name)
    result.diffuse_color = (*colour, 1)
    result.use_nodes = True
    shader = result.node_tree.nodes['Principled BSDF']
    shader.inputs['Base Color'].default_value = result.diffuse_color
    shader.inputs['Roughness'].default_value = roughness
    shader.inputs['Metallic'].default_value = metallic
    return result


def bind(obj, rig, joint, mat):
    obj.data.materials.append(mat)
    obj.vertex_groups.new(name=joint).add(list(range(len(obj.data.vertices))), 1, 'REPLACE')
    obj.parent = rig
    modifier = obj.modifiers.new('Weighted rig', 'ARMATURE')
    modifier.object = rig
    for face in obj.data.polygons:
        face.use_smooth = True
    return obj


def mesh(name, vertices, faces, rig, joint, mat):
    data = bpy.data.meshes.new(name)
    data.from_pydata(vertices, [], faces)
    data.update()
    obj = bpy.data.objects.new(name, data)
    bpy.context.collection.objects.link(obj)
    return bind(obj, rig, joint, mat)


def ellipse(name, location, radii, rig, joint, mat):
    bpy.ops.mesh.primitive_uv_sphere_add(segments=14, ring_count=8, location=location)
    obj = bpy.context.object
    obj.name = name
    obj.scale = radii
    bpy.ops.object.transform_apply(location=True, rotation=False, scale=True)
    return bind(obj, rig, joint, mat)


def armour(rig, bronze, aged_bronze, strap, beard):
    # The cheek guards and lower rear rim leave the brows and face visible.
    segments = 20
    rings = []
    for radius, rise in ((1, 0), (.97, .055), (.80, .106), (.47, .14), (.08, .153)):
        rings.append([
            (.135 * radius * cos(tau * i / segments), .018 + .151 * radius * sin(tau * i / segments),
             1.727 + rise + min(0, -sin(tau * i / segments)) * .055 * radius)
            for i in range(segments)
        ])
    vertices = [v for ring in rings for v in ring]
    faces = [(row * segments + i, row * segments + (i + 1) % segments,
              (row + 1) * segments + (i + 1) % segments, (row + 1) * segments + i)
             for row in range(len(rings) - 1) for i in range(segments)]
    faces.append(tuple(range(len(vertices) - segments, len(vertices))))
    mesh('Bronze helmet', vertices, faces, rig, 'Head', bronze)
    for side, suffix in ((-1, 'r'), (1, 'l')):
        ellipse('Bronze cheek guard', (side * .114, -.039, 1.668), (.025, .071, .084),
                rig, 'Head', aged_bronze)
        ellipse('Leather shoulder guard', (side * .252, .025, 1.45), (.111, .155, .066),
                rig, f'clavicle_{suffix}', strap)
        ellipse('Bronze bracer', (side * .619, .067, 1.45), (.079, .066, .061),
                rig, f'lowerarm_{suffix}', aged_bronze)
        ellipse('Bronze greave', (side * .131, -.048, .32), (.076, .04, .19),
                rig, f'calf_{suffix}', aged_bronze)
    ellipse('Beard under jaw', (0, -.072, 1.568), (.099, .069, .096), rig, 'Head', beard)
    for side in (-1, 1):
        ellipse('Beard cheek', (side * .072, -.079, 1.603), (.036, .057, .062), rig, 'Head', beard)
        ellipse('Moustache', (side * .028, -.117, 1.624), (.038, .022, .014), rig, 'Head', beard)

    # Overlapping hammered scale tiles across the curved front and back.
    for row in range(7):
        z = 1.452 - row * .046
        width = .285 - row * .010
        for side in (-1, 1):
            for col in range(7):
                x = width * (col - 3 + (.22 if row % 2 else -.22)) / 3.55
                y = .022 + side * (.178 - .044 * (x / width) ** 2)
                w = width / 7.9
                vertices = [(x-w, y, z+.021), (x+w, y, z+.021), (x+w, y, z-.016),
                            (x, y+side*.01, z-.034), (x-w, y, z-.016), (x, y+side*.015, z)]
                faces = [(0, 1, 5), (1, 2, 5), (2, 3, 5), (3, 4, 5), (4, 0, 5)]
                if side == 1:
                    faces = [face[::-1] for face in faces]
                mesh('Bronze scale', vertices, faces, rig, 'spine_03' if row < 4 else 'spine_02',
                     aged_bronze if (row + col * 3) % 5 == 0 else bronze)


def weapon(rig, wood, iron):
    grip = Vector((-.840, .047, 1.45))
    top = grip + Vector((0, 0, .86))
    bpy.context.view_layer.objects.active = rig
    bpy.ops.object.mode_set(mode='EDIT')
    bones = rig.data.edit_bones
    for name, at, parent in [('Spear grip', grip, 'hand_r'), ('Spear tip', top, 'Spear grip'),
                             ('Goliath forehead', Vector((0, -.113, 1.714)), 'Head')]:
        bone = bones.new(name)
        bone.head, bone.tail, bone.parent = at, at + Vector((0, 0, .08)), bones[parent]
    bpy.ops.object.mode_set(mode='OBJECT')
    bpy.ops.mesh.primitive_cylinder_add(vertices=10, radius=.014, depth=1.2, location=grip + Vector((0, 0, .13)))
    shaft = bpy.context.object
    shaft.name = 'Ash spear shaft'
    bpy.ops.object.transform_apply(location=True, rotation=False, scale=False)
    bind(shaft, rig, 'Spear grip', wood)
    bpy.ops.mesh.primitive_cone_add(vertices=8, radius1=.037, depth=.16, location=top - Vector((0, 0, .08)))
    tip = bpy.context.object
    tip.name = 'Iron spear head'
    bpy.ops.object.transform_apply(location=True, rotation=False, scale=False)
    bind(tip, rig, 'Spear grip', iron)


def champion_pose(rig, base, pose):
    apply_pose(rig, base)
    upper, lower, spear, brace, twist, dip, shift, gesture = pose
    rotate(rig, 'spine_02', (1, 0, 0), brace * .38)
    rotate(rig, 'spine_03', (1, 0, 0), brace * .62)
    rotate(rig, 'spine_03', (0, 0, 1), twist)
    rotate(rig, 'Head', (0, 0, 1), -twist * .65)
    move(rig, 'pelvis', (0, shift, dip))
    aim(rig, 'upperarm_r', (-.18, -sin(upper), -cos(upper)))
    aim(rig, 'lowerarm_r', (-.09, -cos(lower), sin(lower)))
    aim(rig, 'Spear grip', (0, -sin(spear), cos(spear)))
    if gesture:
        aim(rig, 'upperarm_l', (.38, -.56 * gesture, -.9 + gesture * .48))
        aim(rig, 'lowerarm_l', (.12, -.74, -.5 + gesture * .84))


def export_goliath(output):
    scene = bpy.context.scene
    rig = next(obj for obj in scene.objects if obj.type == 'ARMATURE')
    idle = sample_pose(rig, bpy.data.actions['idle_relaxed'], 0)
    walk = [sample_pose(rig, bpy.data.actions['walk_forward'], i) for i in range(33)]
    rig.animation_data_clear()
    for item in list(bpy.data.actions):
        bpy.data.actions.remove(item)
    rig.animation_data_create()
    apply_pose(rig, {})

    skin = material('Sun-worn skin', (.31, .152, .083))
    crimson = material('Madder wool', (.22, .045, .023), .95)
    edging = material('Woven gold edge', (.36, .18, .056))
    leather = material('Dark hide', (.078, .037, .019))
    beard = material('Charcoal beard', (.028, .018, .015))
    white = material('Eye whites', (.55, .44, .31))
    bronze = material('Hammered bronze', (.43, .245, .079), .54, .34)
    patina = material('Dark bronze', (.27, .137, .049), .68, .27)
    iron = material('Spear iron', (.27, .29, .30), .42, .43)
    for obj in list(scene.objects):
        if obj.type != 'MESH':
            continue
        name = obj.name
        if name.startswith(('Curl', 'Short curl', 'Satchel')):
            bpy.data.objects.remove(obj, do_unlink=True)
            continue
        mat = (skin if name.startswith(('Face', 'Arm', 'Lower legs')) else crimson if name.startswith('Tunic')
               else edging if name.startswith('Woven') else white if name.startswith('Eyes')
               else beard if name.startswith(('Iris', 'Pupil', 'Eyebrows')) else leather)
        obj.data.materials.clear()
        obj.data.materials.append(mat)

    armour(rig, bronze, patina, leather, beard)
    weapon(rig, leather, iron)

    # Broaden the adult mesh and the corresponding rest joints together.
    for obj in list(scene.objects):
        if obj.type != 'MESH':
            continue
        world = obj.matrix_world.copy()
        inverse = world.inverted()
        for v in obj.data.vertices:
            p = world @ v.co
            p.x *= 1.16
            p.y *= 1.10
            v.co = inverse @ p
    bpy.context.view_layer.objects.active = rig
    bpy.ops.object.mode_set(mode='EDIT')
    for b in rig.data.edit_bones:
        for point in (b.head, b.tail):
            point.x *= 1.16
            point.y *= 1.10
    bpy.ops.object.mode_set(mode='OBJECT')

    # Merge skin pieces and props by material while preserving vertex groups.
    materials = {obj.data.materials[0] for obj in scene.objects if obj.type == 'MESH'}
    for mat in sorted(materials, key=lambda m: m.name):
        objects = [obj for obj in scene.objects if obj.type == 'MESH' and obj.data.materials[0] == mat]
        bpy.ops.object.select_all(action='DESELECT')
        for obj in objects:
            obj.select_set(True)
        bpy.context.view_layer.objects.active = objects[0]
        if len(objects) > 1:
            bpy.ops.object.join()
        bpy.context.object.name = 'Goliath ' + mat.name

    bones = tuple(b.name for b in rig.pose.bones if b.name not in ('Goliath forehead', 'Spear tip'))
    neutral = (-.06, -.35, .10, 0, 0, 0, 0, 0)
    poses = {
        'goliath_ready': [(0, neutral), (25, (-.04, -.34, .07, -2, 2, .01, 0, 0)), (50, neutral)],
        'goliath_challenge': [
            (0, neutral), (10, (-.03, -.05, -.12, -8, -8, 0, 0, .68)),
            (32, (.04, -.22, .14, -5, 6, -.014, 0, 1)),
            (49, (-.08, -.27, .08, 1, 4, -.014, 0, .55)), (67, neutral),
        ],
        'goliath_spear': [
            (0, neutral), (11, (-.19, .17, -.22, -6, -11, -.02, .028, .3)),
            (31, (-.62, .39, -.54, -14, -23, -.082, .09, .58)),
            (38, (-.49, .31, -.40, -13, -19, -.065, .08, .48)),
            (41, (1.36, .02, 1.37, 19, 14, -.13, -.20, .85)),
            (45, (1.48, .01, 1.49, 23, 18, -.14, -.23, .90)),
            (48, (1.23, -.10, 1.26, 17, 13, -.10, -.16, .72)),
            (59, (.33, -.28, .42, 5, 3, -.035, -.03, .24)), (78, neutral),
        ],
    }
    for name, frames in poses.items():
        action(rig, name)
        for frame in range(frames[-1][0] + 1):
            pose = mix_keys(frames, frame)
            champion_pose(rig, idle, pose)
            dip = -pose[5]
            if dip:
                for suffix in ('l', 'r'):
                    rotate(rig, 'thigh_' + suffix, (1, 0, 0), -dip * 140)
                    rotate(rig, 'calf_' + suffix, (1, 0, 0), dip * 230)
            key(rig, frame, bones, ('pelvis',))

    action(rig, 'goliath_advance')
    for frame, pose in enumerate(walk):
        champion_pose(rig, pose, neutral)
        key(rig, frame, bones, ('pelvis',))

    action(rig, 'goliath_fall')
    collapse = [(0, (0, 0, 0)), (4, (-13, .11, -.04)), (11, (-7, .22, -.20)),
                (21, (-42, .42, -.51)), (33, (-87, .61, -.83)),
                (40, (-84, .62, -.81)), (46, (-88, .62, -.84))]
    for frame in range(47):
        angle, back, down = mix_keys(collapse, frame)
        champion_pose(rig, idle, (-.07, -.20, .12 + frame / 35, -angle / 7, -angle / 6, 0, 0, min(1, frame / 14)))
        rotate(rig, 'root', (1, 0, 0), angle)
        hip = Vector((0, 0, .94))
        move(rig, 'root', hip - Quaternion((1, 0, 0), angle * pi / 180) @ hip + Vector((0, back, down)))
        fold = sin(pi * min(1, frame / 46)) * 38
        rotate(rig, 'thigh_l', (1, 0, 0), -fold)
        rotate(rig, 'calf_l', (1, 0, 0), fold)
        settle = min(1, max(0, (frame - 23) / 15))
        if settle:
            # The arm and shaft lose their upright pose as his back meets the ground.
            settle = settle * settle * (3 - 2 * settle)
            for joint, direction in [
                ('upperarm_l', (.68, -.30, -.21)), ('lowerarm_l', (.53, -.85, -.10)),
                ('upperarm_r', (-.72, -.28, -.17)), ('lowerarm_r', (-.23, -.95, -.10)),
                ('Spear grip', (-.52, -.85, .02)),
            ]:
                b = rig.pose.bones[joint]
                aim(rig, joint, (b.tail - b.head).normalized().lerp(Vector(direction).normalized(), settle))
        key(rig, frame, bones, ('root', 'pelvis'))

    rig.scale = (1.61,) * 3
    rig.animation_data.action = bpy.data.actions['goliath_ready']
    rig.animation_data.action_slot = rig.animation_data.action.slots[0]
    scene.frame_set(0)
    bpy.ops.object.select_all(action='SELECT')
    bpy.context.view_layer.objects.active = rig
    bpy.ops.wm.save_as_mainfile(filepath=str(output / 'goliath.blend'), compress=True)
    bpy.ops.export_scene.gltf(filepath=str(output / 'goliath.glb'), export_format='GLB', use_selection=True,
                              export_animations=True, export_animation_mode='ACTIONS', export_force_sampling=True,
                              export_yup=True, export_vertex_color='NONE')


if __name__ == '__main__':
    output = Path(sys.argv[sys.argv.index('--') + 1]).resolve()
    output.mkdir(parents=True, exist_ok=True)
    export_goliath(output)
