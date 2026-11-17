"""Original loaned armour, fitting/removal and grounded stone pickup for the teenage David."""
from math import cos, pi, sin, tau
from pathlib import Path
import json,sys
import bpy
from mathutils import Vector
sys.path.insert(0,str(Path(__file__).parent))
from elah_combat import action,aim,apply_pose,ellipse,key,material,mesh,mix_keys,move,rotate,sample_pose

out=Path(sys.argv[sys.argv.index('--')+1]).resolve();out.mkdir(parents=True,exist_ok=True)
rig=next(obj for obj in bpy.context.scene.objects if obj.type=='ARMATURE')
idle=sample_pose(rig,bpy.data.actions['idle_relaxed'],0)
walking=[sample_pose(rig,bpy.data.actions['walk_forward'],i) for i in range(33)]
apply_pose(rig,{})
bronze=material('Loaned hammered bronze',(.43,.25,.085),.56,.3)
leather=material('Loaned dark leather',(.13,.066,.029),.89)
edge=material('Loaned bronze edge',(.59,.39,.13),.48,.35)
coat=[];helmet=[]
n=24
rings=[(1.02,.205,.170),(1.22,.25,.185),(1.43,.27,.185),(1.49,.225,.155)]
vertices=[(w*cos(tau*i/n),.012+d*sin(tau*i/n),z) for z,w,d in rings for i in range(n)]
body=mesh('Loaned coat shell',vertices,[(r*n+i,r*n+(i+1)%n,(r+1)*n+(i+1)%n,(r+1)*n+i) for r in range(3) for i in range(n)],rig,'spine_03',leather);coat.append(body)
for v in body.data.vertices:
    lower=max(0,min(1,(1.30-v.co.z)/.15));body.vertex_groups['spine_03'].add([v.index],1-lower,'REPLACE')
    group=body.vertex_groups.get('spine_02') or body.vertex_groups.new(name='spine_02');group.add([v.index],lower,'REPLACE')
for row in range(6):
    z=1.43-row*.066;w=.25-(1.43-z)*.09
    for side in [-1,1]:
        for col in range(7):
            x=w*(col-3)/3.6;y=.012+side*(.19-.04*(x/w)**2);dx=w/8
            points=[(x-dx,y,z+.027),(x+dx,y,z+.027),(x+dx,y,z-.018),(x,y+side*.012,z-.038),(x-dx,y,z-.018),(x,y+side*.017,z)]
            faces=[(0,1,5),(1,2,5),(2,3,5),(3,4,5),(4,0,5)]
            if side==1:faces=[face[::-1] for face in faces]
            coat.append(mesh('Loaned coat scale',points,faces,rig,'spine_03' if z>1.25 else 'spine_02',bronze))
rings=[(1.714,1),(1.77,.95),(1.835,.62),(1.865,.08)]
vertices=[(.143*r*cos(tau*i/n),.016+.163*r*sin(tau*i/n),z) for z,r in rings for i in range(n)]
helmet.append(mesh('Loaned helmet cap',vertices,[(r*n+i,r*n+(i+1)%n,(r+1)*n+(i+1)%n,(r+1)*n+i) for r in range(3) for i in range(n)],rig,'Head',bronze))
for side in [-1,1]:helmet.append(ellipse('Loaned helmet cheek',(side*.123,-.032,1.695),(.02,.06,.063),rig,'Head',edge))
sheath=ellipse('Loaned sword sheath',(-.245,.025,.73),(.046,.055,.26),rig,'pelvis',leather);coat.append(sheath)
coat.append(ellipse('Loaned sword grip',(-.245,.025,1.035),(.027,.029,.085),rig,'pelvis',edge))

# Join by wardrobe group/material while preserving skin weights.
parts=[]
for group,names in [(coat,'Loaned coat'),(helmet,'Loaned helmet')]:
    grouped={mat:[obj for obj in group if obj.data.materials[0]==mat] for mat in set(obj.data.materials[0] for obj in group)}
    for mat,selected in grouped.items():
        bpy.ops.object.select_all(action='DESELECT')
        for obj in selected:obj.select_set(True)
        bpy.context.view_layer.objects.active=selected[0]
        if len(selected)>1:bpy.ops.object.join()
        obj=bpy.context.object;obj.name=names+' '+mat.name;parts.append(obj)

bones=tuple(b.name for b in rig.pose.bones)
for name,remove in [('don_armour',False),('remove_armour',True)]:
    action(rig,name)
    frames=[(0,(0,0)),(18,(.15,.25)),(44,(1,.75)),(70,(1,1)),(100,(.2,.25)),(144,(0,0))]
    for frame in range(145):
        apply_pose(rig,idle);lift,head=mix_keys(frames,frame)
        rotate(rig,'Head',(1,0,0),head*(5 if remove else 8));rotate(rig,'spine_03',(1,0,0),lift*3)
        if lift:
            for side,suffix in [(-1,'r'),(1,'l')]:
                aim(rig,'upperarm_'+suffix,(side*(.25+.40*lift),-.10,-.95+.95*lift))
                aim(rig,'lowerarm_'+suffix,(-side*.28,-.30,.90))
                aim(rig,'hand_'+suffix,(-side*.15,-.90,.30))
                if lift<1:
                    for joint in ['upperarm_'+suffix,'lowerarm_'+suffix,'hand_'+suffix]:rig.pose.bones[joint].rotation_quaternion=idle[joint][0].slerp(rig.pose.bones[joint].rotation_quaternion,lift)
        key(rig,frame,bones)
action(rig,'armour_walk')
for frame,pose in enumerate(walking):
    apply_pose(rig,pose);rotate(rig,'spine_03',(1,0,0),-4)
    for side,suffix in [(-1,'r'),(1,'l')]:
        aim(rig,'upperarm_'+suffix,(side*.28,-.06,-.96));aim(rig,'lowerarm_'+suffix,(side*.05,-.34,-.94))
    key(rig,frame,bones,('pelvis',))

# Two-bone IK is baked into ordinary joint keys. Targets do not ship.
apply_pose(rig,idle);bpy.context.view_layer.update()
targets=[];constraints=[]
def target(name,point):
    obj=bpy.data.objects.new(name,None);bpy.context.collection.objects.link(obj);obj.location=rig.matrix_world@Vector(point);targets.append(obj);return obj
for suffix in ['l','r']:
    bone=rig.pose.bones['calf_'+suffix];at=bone.tail.copy();obj=target('Pickup ankle '+suffix,at)
    pole=target('Pickup knee '+suffix,(at.x,-1,.5));constraint=bone.constraints.new('IK');constraint.target=obj;constraint.chain_count=2;constraint.use_stretch=False;constraint.pole_target=pole;constraints.append(constraint)
hand=target('Pickup palm',(-.15,-.32,.115));arm=rig.pose.bones['lowerarm_r'];constraint=arm.constraints.new('IK');constraint.target=hand;constraint.chain_count=2;constraint.use_stretch=False;constraints.append(constraint)
action(rig,'gather_stone');metrics={}
for frame in range(73):
    for constraint in constraints:constraint.influence=0
    apply_pose(rig,idle)
    crouch=mix_keys([(0,(0,)),(12,(.45,)),(28,(1,)),(36,(1,)),(54,(.05,)),(72,(0,))],frame)[0]
    move(rig,'pelvis',(0,.035*crouch,-.74*crouch));rotate(rig,'spine_02',(1,0,0),32*crouch);rotate(rig,'spine_03',(1,0,0),35*crouch);rotate(rig,'Head',(1,0,0),10*crouch)
    if 'spine_01' in rig.pose.bones:rotate(rig,'spine_01',(1,0,0),20*crouch)
    for constraint in constraints:constraint.influence=crouch
    pocket=max(0,min(1,(frame-38)/17));pocket=pocket*pocket*(3-2*pocket)
    hand.location=rig.matrix_world@Vector((-.15+(.17+.15)*pocket,-.32+(.06+.32)*pocket,.115+(.95-.115)*pocket))
    bpy.context.view_layer.update();matrices={b.name:b.matrix.copy() for b in rig.pose.bones}
    for constraint in constraints:constraint.influence=0
    for bone in rig.pose.bones:bone.matrix=matrices[bone.name]
    key(rig,frame,bones,('pelvis',))
    if frame in [0,28,32,36,54,72]:metrics[str(frame)]={'wrist_source_world':list(rig.matrix_world@rig.pose.bones['hand_r'].matrix.translation),'palm_source_world':list(rig.matrix_world@rig.pose.bones['hand_r'].matrix@Vector((0,.05,0))),'left_ankle':list(rig.matrix_world@rig.pose.bones['calf_l'].tail),'right_ankle':list(rig.matrix_world@rig.pose.bones['calf_r'].tail)}
for constraint in constraints:
    owner=next(b for b in rig.pose.bones if constraint in list(b.constraints));owner.constraints.remove(constraint)
for obj in targets:bpy.data.objects.remove(obj,do_unlink=True)

rig.animation_data.action=bpy.data.actions['idle_relaxed'];rig.animation_data.action_slot=rig.animation_data.action.slots[0];bpy.context.scene.frame_set(0)
bpy.ops.object.select_all(action='DESELECT')
for obj in bpy.context.scene.objects:
    if obj.type in ['MESH','ARMATURE']:obj.select_set(True)
bpy.context.view_layer.objects.active=rig
bpy.ops.wm.save_as_mainfile(filepath=str(out/'david-preparation.blend'),compress=True)
bpy.ops.export_scene.gltf(filepath=str(out/'david-preparation.glb'),export_format='GLB',use_selection=True,export_animations=True,export_animation_mode='ACTIONS',export_force_sampling=True,export_yup=True,export_vertex_color='NAME',export_vertex_color_name='Palette')

# Matching unskinned equipment for the stand and animated handoff.
apply_pose(rig,idle);bpy.context.view_layer.update()
props=[];anchors={};depsgraph=bpy.context.evaluated_depsgraph_get()
for prefix,label in [('Loaned coat','Coat prop'),('Loaned helmet','Helmet prop')]:
    baked=[]
    for obj in parts:
        if not obj.name.startswith(prefix):continue
        data=bpy.data.meshes.new_from_object(obj.evaluated_get(depsgraph),depsgraph=depsgraph)
        for vertex in data.vertices:vertex.co=obj.matrix_world@vertex.co
        baked.append(data)
    points=[v.co for data in baked for v in data.vertices]
    if label=='Coat prop':
        scales=[data for data in baked if any(mat and mat.name=='Loaned hammered bronze' for mat in data.materials)]
        if scales:points=[v.co for data in scales for v in data.vertices]
    centre=Vector(tuple((min(p[axis] for p in points)+max(p[axis] for p in points))/2 for axis in range(3)))
    bone=rig.pose.bones['Head' if label=='Helmet prop' else 'spine_03']
    anchors['helmet' if label=='Helmet prop' else 'coat']=list((rig.matrix_world@bone.matrix).inverted()@centre)
    for data in baked:
        for vertex in data.vertices:vertex.co-=centre
        copy=bpy.data.objects.new(label,data);bpy.context.collection.objects.link(copy);props.append(copy)
bpy.ops.object.select_all(action='DESELECT')
for obj in props:obj.select_set(True)
bpy.ops.export_scene.gltf(filepath=str(out/'preparation-armour.glb'),export_format='GLB',use_selection=True,export_animations=False,export_yup=True,export_vertex_color='NONE')
(out/'pickup-metrics.json').write_text(json.dumps(metrics,indent=2)+'\n',encoding='utf-8')
(out/'preparation-armour.json').write_text(json.dumps(anchors,indent=2)+'\n',encoding='utf-8')
print('PICKUP_METRICS',json.dumps(metrics),flush=True)
