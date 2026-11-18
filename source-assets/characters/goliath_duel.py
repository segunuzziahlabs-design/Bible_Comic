"""Derive the duel sword performance from the retained weighted Goliath asset.
Original project-authored weapon/poses; no additional third-party asset source.
"""
from pathlib import Path
import sys, math, json
import bpy
from mathutils import Vector
sys.path.insert(0, str(Path(__file__).parent))
from elah_combat import sample_pose, apply_pose, aim, rotate, move, action, key, mix_keys, mesh, material

root = Path.cwd()
bpy.ops.wm.read_factory_settings(use_empty=True)
bpy.ops.import_scene.gltf(filepath=str(root / 'apps/playcanvas/src/assets/goliath-ranged.glb'))
rig = next(o for o in bpy.data.objects if o.type == 'ARMATURE')
scene = bpy.context.scene
scene.render.fps = 24
idle = sample_pose(rig, bpy.data.actions['goliath_ready'], 0)
for track in list(rig.animation_data.nla_tracks):
    rig.animation_data.nla_tracks.remove(track)
apply_pose(rig, {})
bpy.context.view_layer.objects.active = rig
bpy.ops.object.mode_set(mode='EDIT')
grip = rig.data.edit_bones['Spear grip'].head.copy()
for name, at, parent in [('Sword grip', grip, 'hand_r'), ('Sword tip', grip + Vector((0, 0, 1.19)), 'Sword grip')]:
    bone = rig.data.edit_bones.new(name)
    bone.head, bone.tail, bone.parent = at, at + Vector((0, 0, .08)), rig.data.edit_bones[parent]
bpy.ops.object.mode_set(mode='OBJECT')
iron = material('Duel sword iron', (.40, .43, .44), .33, .64)
bronze = material('Duel sword bronze', (.48, .29, .10), .44, .45)
leather = material('Duel sword hide', (.10, .043, .021), .88)

def solid(name, vertices, faces, joint, surface):
    return mesh(name, [tuple(grip + Vector(v)) for v in vertices], faces, rig, joint, surface)

faces = [(0, 1, 2, 3), (4, 7, 6, 5), (0, 4, 5, 1), (1, 5, 6, 2), (2, 6, 7, 3), (3, 7, 4, 0)]
def box(name, half, centre, joint, surface):
    x, y, z = half
    c = Vector(centre)
    return solid(name, [tuple(c + Vector(p)) for p in [(-x,-y,-z),(x,-y,-z),(x,y,-z),(-x,y,-z),(-x,-y,z),(x,-y,z),(x,y,z),(-x,y,z)]], faces, joint, surface)

# A tapered blade with a raised central ridge, cross guard, leather grip and pommel.
solid('Goliath drawn sword blade', [(-.057,0,.12),(.057,0,.12),(.044,0,1.02),(0,0,1.19),(-.044,0,1.02),(0,-.022,.15),(0,-.018,.96),(0,.022,.15),(0,.018,.96)],
      [(0,1,5),(1,2,6,5),(2,3,6),(3,4,6),(4,0,5,6),(1,0,7),(2,1,7,8),(3,2,8),(4,3,8),(0,4,8,7)], 'Sword grip', iron)
box('Goliath drawn sword guard', (.13,.037,.025), (0,0,.085), 'Sword grip', bronze)
box('Goliath drawn sword handle', (.021,.023,.10), (0,0,-.035), 'Sword grip', leather)
box('Goliath drawn sword pommel', (.032,.030,.027), (0,0,-.16), 'Sword grip', bronze)
# The sheath remains on the hip; the visible hilt is toggled once the draw reaches the hand.
original_grip = grip.copy()
grip = Vector((.28,.045,1.05))
sheath = box('Goliath sword sheath', (.045,.035,.31), (0,0,-.24), 'pelvis', leather)
box('Goliath sheathed sword hilt', (.09,.035,.065), (0,0,.09), 'pelvis', bronze)
grip = original_grip

bones = tuple(b.name for b in rig.pose.bones)
def pose(values):
    apply_pose(rig, idle)
    ux,uy,uz,lx,ly,lz,sx,sy,sz,brace,twist,dip = values
    rotate(rig, 'spine_02', (1,0,0), brace*.4)
    rotate(rig, 'spine_03', (1,0,0), brace*.6)
    rotate(rig, 'spine_03', (0,0,1), twist)
    rotate(rig, 'Head', (0,0,1), -twist*.65)
    move(rig, 'pelvis', (0,0,dip))
    aim(rig, 'upperarm_r', (ux,uy,uz))
    aim(rig, 'lowerarm_r', (lx,ly,lz))
    aim(rig, 'Sword grip', (sx,sy,sz))
    aim(rig, 'upperarm_l', (.5,-.4,-.75))
    aim(rig, 'lowerarm_l', (.15,-.75,.25))

ready = (-.12,-.25,-.95,-.05,-.4,-.90,0,-.25,.97,0,0,0)
raised = (-.15,.03,.98,.12,-.20,.97,0,-.08,1,-9,-13,-.025)
ground = (.23,-.97,-.03,.05,-.88,-.48,0,-.55,-.84,20,8,-.14)
draw = [(0,ready),(9,(.75,-.4,-.51,.7,-.4,-.3,0,-.2,1,2,-12,0)),(17,(.45,-.25,-.85,.15,-.55,.8,0,-.08,1,0,-10,-.01)),(30,ready)]
strike = [(0,ready),(16,raised),(24,raised),(26,raised),(31,ground),(35,ground),(43,(.17,-.6,-.72,.05,-.6,-.6,0,-.3,.9,5,3,-.02)),(55,ready)]
for name, frames in [('goliath_draw_sword',draw),('goliath_sword_strike',strike)]:
    action(rig,name)
    for frame in range(frames[-1][0]+1):
        pose(mix_keys(frames,frame))
        key(rig,frame,bones,('pelvis',))

action(rig,'goliath_hit')
for frame in range(13):
    apply_pose(rig,idle)
    recoil=math.sin(math.pi*frame/24)
    rotate(rig,'Head',(1,0,0),-26*recoil)
    rotate(rig,'spine_03',(1,0,0),-14*recoil)
    aim(rig,'upperarm_l',(.3,-.4,.7))
    key(rig,frame,bones,('pelvis',))

rig.animation_data.action = bpy.data.actions['goliath_ready']
rig.animation_data.action_slot = rig.animation_data.action.slots[0]
scene.frame_set(0)
bpy.context.preferences.filepaths.save_version = 0
bpy.ops.wm.save_as_mainfile(filepath=str(root/'source-assets/characters/goliath-duel.blend'),compress=True)
bpy.ops.object.select_all(action='DESELECT')
for obj in scene.objects:
    if obj.type in ['MESH','ARMATURE']: obj.select_set(True)
bpy.context.view_layer.objects.active = rig
bpy.ops.export_scene.gltf(filepath=str(root/'apps/playcanvas/src/assets/goliath-duel.glb'),export_format='GLB',use_selection=True,export_animations=True,export_animation_mode='ACTIONS',export_force_sampling=True,export_yup=True,export_vertex_color='NONE')
print('CINEMATIC_DUEL_EXPORT_COMPLETE',flush=True)
