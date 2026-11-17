"""Original cheer/run variants and a compact baked-pose crowd; preserve previous exports."""
from math import pi, sin, cos
from pathlib import Path
import sys, json
import bpy
from mathutils import Matrix, Quaternion, Vector
sys.path.insert(0,str(Path(__file__).parent))
from elah_combat import action, aim, apply_pose, bind, ellipse, key, material, move, rotate, sample_pose

output=Path(sys.argv[sys.argv.index('--')+1]).resolve();output.mkdir(parents=True,exist_ok=True)
rig=next(obj for obj in bpy.context.scene.objects if obj.type=='ARMATURE')
idle=sample_pose(rig,bpy.data.actions['idle_relaxed'],0)
walking=[sample_pose(rig,bpy.data.actions['walk_forward'],i) for i in range(33)]
for obj in list(bpy.context.scene.objects):
    if any(n in obj.name.lower() for n in ['saul beard','saul moustache','saul circlet','mantle','clasp']):bpy.data.objects.remove(obj,do_unlink=True)
apply_pose(rig,{})
wood=material('Soldier spear wood',(.20,.12,.06));bronze=material('Soldier bronze',(.43,.27,.10),.5)
hide=material('Soldier shield hide',(.22,.12,.055))
hand=rig.matrix_world@rig.pose.bones['hand_r'].matrix.translation
bpy.ops.mesh.primitive_cylinder_add(vertices=8,radius=.014,depth=1.9,location=hand+Vector((0,-.025,.40)))
obj=bpy.context.object;obj.name='Soldier spear';bpy.ops.object.transform_apply(location=True,rotation=False,scale=True);bind(obj,rig,'hand_r',wood)
shield=rig.matrix_world@rig.pose.bones['lowerarm_l'].matrix.translation
ellipse('Soldier oval shield',shield+Vector((0,-.10,-.06)),(.23,.045,.32),rig,'lowerarm_l',hide)
ellipse('Soldier shield boss',shield+Vector((0,-.15,-.06)),(.065,.025,.065),rig,'lowerarm_l',bronze)
bones=tuple(b.name for b in rig.pose.bones)
action(rig,'victory_cheer')
for frame in range(73):
    apply_pose(rig,idle)
    raise_=min(1,frame/12);wave=sin((frame-12)*pi/18)*raise_
    for side,suffix in [(-1,'r'),(1,'l')]:
        aim(rig,'upperarm_'+suffix,(side*(.38+.10*wave),-.12,.89*raise_-(1-raise_)))
        aim(rig,'lowerarm_'+suffix,(side*.10,-.14,.98*raise_-(1-raise_)))
    rotate(rig,'spine_03',(1,0,0),-3*raise_+2*wave)
    rotate(rig,'Head',(1,0,0),-4*raise_);move(rig,'pelvis',(0,0,.012*abs(wave)))
    key(rig,frame,bones,('pelvis',))
action(rig,'retreat_run')
for frame in range(17):
    base=walking[(frame*2)%32];pose={}
    for name,(rotation,location) in base.items():
        relative=idle[name][0].inverted()@rotation;axis,angle=relative.to_axis_angle()
        strength=1.35 if any(part in name for part in ['thigh','shin','upperarm','lowerarm']) else 1
        pose[name]=(idle[name][0]@Quaternion(axis,angle*strength),location)
    apply_pose(rig,pose);rotate(rig,'spine_02',(1,0,0),9);rotate(rig,'spine_03',(1,0,0),4)
    key(rig,frame,bones,('pelvis',))
rig.animation_data.action=bpy.data.actions['idle_relaxed'];rig.animation_data.action_slot=rig.animation_data.action.slots[0];bpy.context.scene.frame_set(0)
bpy.ops.object.select_all(action='SELECT');bpy.context.view_layer.objects.active=rig
bpy.ops.wm.save_as_mainfile(filepath=str(output/'victory-soldier.blend'),compress=True)
bpy.ops.export_scene.gltf(filepath=str(output/'victory-soldier.glb'),export_format='GLB',use_selection=True,export_animations=True,export_animation_mode='ACTIONS',export_force_sampling=True,export_yup=True,export_vertex_color='NAME',export_vertex_color_name='Palette')

sources=[obj for obj in bpy.context.scene.objects if obj.type=='MESH'];atlas=[];counts={}
crowd_material=material('Original baked soldier colours',(1,1,1))
attribute=crowd_material.node_tree.nodes.new('ShaderNodeVertexColor');attribute.layer_name='Palette'
crowd_material.node_tree.links.new(attribute.outputs['Color'],crowd_material.node_tree.nodes.get('Principled BSDF').inputs['Base Color'])
for name,clip,frame in [(f'Run {i}','retreat_run',i*16/6) for i in range(6)]+[(f'Cheer {i}','victory_cheer',i*12) for i in range(3)]:
    rig.animation_data.action=bpy.data.actions[clip];rig.animation_data.action_slot=rig.animation_data.action.slots[0];bpy.context.scene.frame_set(int(frame),subframe=frame%1)
    deps=bpy.context.evaluated_depsgraph_get();verts=[];faces=[];colours=[]
    for original in sources:
        mesh=bpy.data.meshes.new_from_object(original.evaluated_get(deps),depsgraph=deps);mesh.transform(original.matrix_world)
        temp=bpy.data.objects.new('Bake temporary',mesh);bpy.context.collection.objects.link(temp);bpy.context.view_layer.objects.active=temp
        if len(mesh.polygons)>100:
            modifier=temp.modifiers.new('Crowd budget','DECIMATE');modifier.ratio=.18;bpy.ops.object.modifier_apply(modifier=modifier.name);mesh=temp.data
        start=len(verts);verts.extend(tuple(v.co) for v in mesh.vertices)
        colour=mesh.color_attributes.get('Palette');local=[None]*len(mesh.vertices)
        for polygon in mesh.polygons:
            mat=mesh.materials[min(polygon.material_index,len(mesh.materials)-1)] if len(mesh.materials) else None
            rgb=tuple(mat.diffuse_color[:3]) if mat else (.5,.4,.3)
            if mat and mat.name=='Cloth':rgb=(.38,.16,.08) if name.startswith('Run') else (.12,.31,.15)
            for li in polygon.loop_indices:
                vi=mesh.loops[li].vertex_index
                # The source palette already contains albedo, not a multiplicative mask.
                # Bake one material colour per vertex rather than darkening albedo twice.
                local[vi]=(*rgb,1)
            faces.append(tuple(start+i for i in polygon.vertices))
        colours.extend(c or (.5,.4,.3,1) for c in local);bpy.data.objects.remove(temp,do_unlink=True)
    data=bpy.data.meshes.new(name);data.from_pydata(verts,[],faces);data.update();colour=data.color_attributes.new(name='Palette',type='FLOAT_COLOR',domain='POINT')
    for item,value in zip(colour.data,colours):item.color=value
    for p in data.polygons:p.use_smooth=True
    node=bpy.data.objects.new(name,data);bpy.context.collection.objects.link(node);node.data.materials.append(crowd_material);atlas.append(node);counts[name]=sum(len(p.vertices)-2 for p in data.polygons)
bpy.ops.object.select_all(action='DESELECT')
for node in atlas:node.select_set(True)
bpy.ops.export_scene.gltf(filepath=str(output/'victory-crowd.glb'),export_format='GLB',use_selection=True,export_animations=False,export_yup=True,export_vertex_color='NAME',export_vertex_color_name='Palette')
(output/'crowd-triangles.json').write_text(json.dumps(counts,indent=2)+'\n',encoding='utf8')
print('VICTORY_ASSETS',counts,flush=True)
