"""Original non-graphic pursuit, spear-strike and collapse poses on our soldier rig.
Run with the retained victory-soldier.blend; writes a separate crowd atlas.
"""
from math import pi, sin
from pathlib import Path
import sys, json
import bpy
from mathutils import Vector
sys.path.insert(0, str(Path(__file__).parent))
from elah_combat import action, aim, apply_pose, key, move, rotate, sample_pose

output=Path(sys.argv[sys.argv.index('--')+1]).resolve()
output.parent.mkdir(parents=True,exist_ok=True)
rig=next(o for o in bpy.context.scene.objects if o.type=='ARMATURE')
idle=sample_pose(rig,bpy.data.actions['idle_relaxed'],0)
bones=tuple(b.name for b in rig.pose.bones)
for name in ['pursuit_strike','pursuit_fall']:
    action(rig,name)
    for f in range(25):
        apply_pose(rig,idle)
        u=f/24
        if name=='pursuit_strike':
            thrust=sin(pi*u)
            aim(rig,'upperarm_r',(-.20,-.55-.4*thrust,.58-.5*thrust))
            aim(rig,'lowerarm_r',(.08,-.65-.33*thrust,.72-.7*thrust))
            rotate(rig,'spine_02',(1,0,0),12*thrust)
            rotate(rig,'spine_03',(0,0,1),-16*thrust)
            move(rig,'pelvis',(0,-.09*thrust,-.06*thrust))
        else:
            bend=min(1,u*2)
            rotate(rig,'spine_02',(1,0,0),20*sin(pi*u))
            rotate(rig,'thigh_r',(1,0,0),-22*sin(pi*u))
            rotate(rig,'thigh_l',(1,0,0),18*sin(pi*u))
            rotate(rig,'root',(1,0,0),84*u*u*(3-2*u))
            aim(rig,'upperarm_r',(-.60,-.3,-.72))
            aim(rig,'upperarm_l',(.55,-.3,-.72))
        key(rig,f,bones,('root','pelvis'))

sources=[o for o in bpy.context.scene.objects if o.type=='MESH']
material=bpy.data.materials.new('Original pursuit soldier colours');material.use_nodes=True
colour_node=material.node_tree.nodes.new('ShaderNodeVertexColor');colour_node.layer_name='Palette'
material.node_tree.links.new(colour_node.outputs['Color'],material.node_tree.nodes.get('Principled BSDF').inputs['Base Color'])
poses=[(f'Pursue {i}','retreat_run',i*16/6,True) for i in range(6)]
poses += [(f'Strike {i}','pursuit_strike',i*6,True) for i in range(5)]
poses += [(f'Fall {i}','pursuit_fall',i*24/5,False) for i in range(6)]
atlas=[];counts={}
for name,clip,frame,israel in poses:
    rig.animation_data.action=bpy.data.actions[clip];rig.animation_data.action_slot=rig.animation_data.action.slots[0]
    bpy.context.scene.frame_set(int(frame),subframe=frame%1)
    deps=bpy.context.evaluated_depsgraph_get();verts=[];faces=[];colours=[]
    for original in sources:
        mesh=bpy.data.meshes.new_from_object(original.evaluated_get(deps),depsgraph=deps);mesh.transform(original.matrix_world)
        temp=bpy.data.objects.new('Pursuit bake temporary',mesh);bpy.context.collection.objects.link(temp);bpy.context.view_layer.objects.active=temp
        if len(mesh.polygons)>100:
            modifier=temp.modifiers.new('Crowd budget','DECIMATE');modifier.ratio=.18
            bpy.ops.object.modifier_apply(modifier=modifier.name);mesh=temp.data
        start=len(verts);verts.extend(tuple(v.co) for v in mesh.vertices);local=[None]*len(mesh.vertices)
        for polygon in mesh.polygons:
            mat=mesh.materials[min(polygon.material_index,len(mesh.materials)-1)] if len(mesh.materials) else None
            rgb=tuple(mat.diffuse_color[:3]) if mat else (.5,.4,.3)
            if mat and mat.name=='Cloth':rgb=(.12,.31,.15) if israel else (.38,.16,.08)
            for li in polygon.loop_indices:local[mesh.loops[li].vertex_index]=(*rgb,1)
            faces.append(tuple(start+i for i in polygon.vertices))
        colours.extend(c or (.5,.4,.3,1) for c in local);bpy.data.objects.remove(temp,do_unlink=True)
    # Ground each baked collapse so the body remains on the terrain, not below it.
    if name.startswith('Fall'):
        floor=min(v[2] for v in verts);verts=[(x,y,z-floor) for x,y,z in verts]
    data=bpy.data.meshes.new(name);data.from_pydata(verts,[],faces);data.validate();data.update()
    colour=data.color_attributes.new(name='Palette',type='FLOAT_COLOR',domain='POINT')
    for item,value in zip(colour.data,colours):item.color=value
    for polygon in data.polygons:polygon.use_smooth=True
    node=bpy.data.objects.new(name,data);bpy.context.collection.objects.link(node);node.data.materials.append(material);atlas.append(node)
    counts[name]=sum(len(p.vertices)-2 for p in data.polygons)
bpy.ops.object.select_all(action='DESELECT')
for node in atlas:node.select_set(True)
bpy.ops.export_scene.gltf(filepath=str(output),export_format='GLB',use_selection=True,export_animations=False,export_yup=True,export_vertex_color='NAME',export_vertex_color_name='Palette')
output.with_suffix('.json').write_text(json.dumps(counts,indent=2)+'\n',encoding='utf8')
print('PURSUIT_ASSET',counts,flush=True)
