"""Bake a lightweight standing soldier from the existing prepared CC0 adult character."""
from pathlib import Path
import sys
import bpy
from mathutils import Matrix, Vector

output=Path(sys.argv[sys.argv.index('--')+1]).resolve()
rig=next(obj for obj in bpy.context.scene.objects if obj.type=='ARMATURE')
rig.animation_data.action=bpy.data.actions['idle_relaxed']
rig.animation_data.action_slot=rig.animation_data.action.slots[0]
bpy.context.scene.frame_set(0)

def material(name, colour, roughness=.8):
    mat=bpy.data.materials.new(name);mat.use_nodes=True
    shader=mat.node_tree.nodes.get('Principled BSDF')
    shader.inputs['Base Color'].default_value=(*colour,1)
    shader.inputs['Roughness'].default_value=roughness
    return mat

wood=material('Soldier spear wood',(.20,.12,.06))
bronze=material('Soldier bronze',(.43,.27,.10),.5)
hide=material('Soldier shield hide',(.22,.12,.055))
hand=rig.matrix_world @ rig.pose.bones['hand_r'].matrix.translation
bpy.ops.mesh.primitive_cylinder_add(vertices=8,radius=.013,depth=1.95,location=hand+Vector((0,-.025,.35)))
bpy.context.object.name='Soldier spear';bpy.context.object.data.materials.append(wood)
bpy.ops.mesh.primitive_cone_add(vertices=6,radius1=.047,radius2=0,depth=.19,location=hand+Vector((0,-.025,1.40)))
bpy.context.object.name='Soldier spearhead';bpy.context.object.data.materials.append(bronze)
shield=rig.matrix_world @ rig.pose.bones['lowerarm_l'].matrix.translation
for name,delta,scale,mat in [('Soldier oval shield',(0,-.12,-.1),(.23,.045,.32),hide),('Soldier shield boss',(0,-.17,-.1),(.065,.03,.065),bronze)]:
    bpy.ops.mesh.primitive_uv_sphere_add(segments=12,ring_count=6,location=shield+Vector(delta))
    obj=bpy.context.object;obj.name=name;obj.scale=scale;obj.data.materials.append(mat)

depsgraph=bpy.context.evaluated_depsgraph_get()
for obj in list(bpy.context.scene.objects):
    if obj.type!='MESH':continue
    world=obj.matrix_world.copy()
    baked=bpy.data.meshes.new_from_object(obj.evaluated_get(depsgraph),depsgraph=depsgraph)
    baked.transform(world)
    obj.modifiers.clear();obj.data=baked;obj.parent=None;obj.matrix_world=Matrix.Identity(4)
    if len(obj.data.polygons)>150:
        modifier=obj.modifiers.new('Distant soldier triangle budget','DECIMATE');modifier.ratio=.32
        bpy.context.view_layer.objects.active=obj
        bpy.ops.object.modifier_apply(modifier=modifier.name)
    for polygon in obj.data.polygons:polygon.use_smooth=True

bpy.ops.object.select_all(action='DESELECT')
for obj in bpy.context.scene.objects:
    if obj.type=='MESH':obj.select_set(True)
output.parent.mkdir(parents=True,exist_ok=True)
bpy.ops.export_scene.gltf(filepath=str(output),export_format='GLB',use_selection=True,export_animations=False,
    export_yup=True,export_vertex_color='NAME',export_vertex_color_name='Palette')
triangles=sum(sum(len(face.vertices)-2 for face in obj.data.polygons) for obj in bpy.context.selected_objects if obj.type=='MESH')
print('BAKED_SOLDIER_TRIANGLES',triangles,flush=True)
