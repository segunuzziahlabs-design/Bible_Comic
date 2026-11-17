"""Reshape the benchmark rig for David's teenage PlayCanvas design."""

from math import copysign, exp

import bpy
from mathutils import Vector


def smooth(start, end, value):
    t = min(1, max(0, (value - start) / (end - start)))
    return t * t * (3 - 2 * t)


def fit_width(x):
    width = abs(x)
    return copysign(.79 * min(.212, width) + .91 * max(0, width - .212), x)


def fit_point(point, part):
    x, y, z = point
    if part in ('eyes', 'brows', 'hair') or part == 'skin' and z >= 1.523:
        # Keep the facial parts aligned. Change the lower front of the face
        # separately from the cranium, then blend the neck into the collar.
        face = smooth(1.56, 1.63, z) * smooth(.025, .086, -y)
        jaw = face * (1 - smooth(1.644, 1.686, z))
        nose = .011 * exp(-(x / .023) ** 2 - ((z - 1.668) / .025) ** 2) * face
        cheek = .005 * exp(-((abs(x) - .05) / .023) ** 2 - ((z - 1.669) / .020) ** 2) * face
        width = .84 + .215 * smooth(1.54, 1.64, z)
        if part == 'hair':
            # Lift the front hairline slightly to show the brows.
            z += .023 * smooth(.035, .105, -y) * (1 - smooth(1.71, 1.80, z))
        return Vector((x * width * (1 - .17 * jaw), y + nose - cheek,
                       z + .015 * jaw + .012 * smooth(1.69, 1.83, z)))

    if part == 'skin' and z < 1:
        # Keep the thigh and calf centred on the narrower leg joints.
        centre_x = copysign(.1143, x)
        centre_y = .0875 - .0515 * smooth(.086, .542, z)
        slimming = smooth(.11, .30, z)
        new_x = (1 - slimming) * fit_width(x) + slimming * (fit_width(centre_x) + .74 * (x - centre_x))
        return Vector((new_x, y - .22 * slimming * (y - centre_y), z))

    arm = smooth(.20, .37, abs(x))
    hand = smooth(.58, .72, abs(x))
    sleeve_slimming = .23 if part == 'cloth' else .33
    bulk = 1 - sleeve_slimming * arm * (1 - .48 * hand)
    trunk_y = .025 + (.87 + .08 * (1 - smooth(.81, 1.05, z))) * (y - .025)
    arm_y = .066 + bulk * (y - .066)
    return Vector((fit_width(x), trunk_y + arm * (arm_y - trunk_y),
                   1.456 + bulk * (z - 1.456)))


def apply_teen_fit(rig, meshes):
    for part, obj in meshes.items():
        matrix = obj.matrix_world.copy()
        inverse = matrix.inverted()
        point_sets = ([key.data for key in obj.data.shape_keys.key_blocks]
                      if obj.data.shape_keys else [obj.data.vertices])
        for points in point_sets:
            for point in points:
                point.co = inverse @ fit_point(matrix @ point.co, part)
        obj.data.update()

    # Move the rest joints with the fitted shoulders and legs. Keep the same
    # joint hierarchy, weights and action curves, then scale the whole actor.
    bpy.context.view_layer.objects.active = rig
    bpy.ops.object.mode_set(mode='EDIT')
    for bone in rig.data.edit_bones:
        bone.head.x = fit_width(bone.head.x)
        bone.tail.x = fit_width(bone.tail.x)
    bpy.ops.object.mode_set(mode='OBJECT')
    rig.scale = (.885,) * 3

    hair = meshes['hair']
    hair.shape_key_add(name='Basis')
    fuller = hair.shape_key_add(name='FullerHair')
    for point in fuller.data:
        x, y, z = point.co
        crown = smooth(1.66, 1.82, z)
        point.co = (x * (1.06 + .12 * crown), .018 + (y - .018) * (1.04 + .14 * crown),
                    z + .027 * crown)
