"""Original procedural A05 samples. Run with pinned Blender --background --python.

No external models, textures, rigs, motion capture or audio are imported.
Regeneration is explicit: add -- --overwrite to replace these generated files.
"""
from pathlib import Path
import bpy, math, json, struct, sys, wave
from mathutils import Vector

ROOT = Path(__file__).resolve().parents[1]
SOURCE = ROOT / 'source-assets/proof'
OUTPUT = ROOT / 'assets/proof'
SOURCE.mkdir(parents=True, exist_ok=True)
OUTPUT.mkdir(parents=True, exist_ok=True)
targets = [SOURCE/'shepherd.blend', SOURCE/'courtyard-gate.blend', OUTPUT/'shepherd.glb', OUTPUT/'courtyard-gate.glb', OUTPUT/'confirmation.wav']
if '--overwrite' not in sys.argv and any(p.exists() for p in targets):
    raise RuntimeError('Generated samples already exist. Review changes, then use -- --overwrite for intentional regeneration.')

def clean():
    bpy.ops.wm.read_factory_settings(use_empty=True)
    bpy.context.scene.unit_settings.system = 'METRIC'
    bpy.context.scene.unit_settings.scale_length = 1
    bpy.context.scene.render.fps = 24

def material(name, rgb):
    m=bpy.data.materials.new(name)
    m.diffuse_color=(*rgb,1)
    m.use_nodes=True
    m.use_backface_culling=True
    bsdf=m.node_tree.nodes.get('Principled BSDF')
    bsdf.inputs['Base Color'].default_value=(*rgb,1)
    bsdf.inputs['Roughness'].default_value=.88
    return m

parts=[]
def finish(obj,name,mat,bone=None):
    obj.name=name
    bpy.ops.object.transform_apply(location=False,rotation=False,scale=True)
    obj.data.materials.append(mat)
    if bone:
        group=obj.vertex_groups.new(name=bone)
        group.add(list(range(len(obj.data.vertices))),1.0,'REPLACE')
    parts.append(obj)
    return obj

def box(name,loc,size,mat,bone=None):
    bpy.ops.mesh.primitive_cube_add(size=1,location=loc)
    ob=bpy.context.object; ob.scale=size
    return finish(ob,name,mat,bone)

def ico(name,loc,size,mat,bone=None,detail=1):
    bpy.ops.mesh.primitive_ico_sphere_add(subdivisions=detail,radius=1,location=loc)
    ob=bpy.context.object; ob.scale=size
    return finish(ob,name,mat,bone)

def cone(name,loc,r1,r2,depth,mat,bone=None,vertices=10):
    bpy.ops.mesh.primitive_cone_add(vertices=vertices,radius1=r1,radius2=r2,depth=depth,location=loc)
    return finish(bpy.context.object,name,mat,bone)

def limb(name,a,b,radius,mat,bone):
    a,b=Vector(a),Vector(b)
    ob=cone(name,(a+b)/2,radius,radius*.87,(b-a).length,mat,bone,8)
    ob.rotation_euler=(b-a).to_track_quat('Z','Y').to_euler()
    return ob

def save_export(name,animated):
    bpy.context.scene.frame_set(1)
    bpy.ops.wm.save_as_mainfile(filepath=str(SOURCE/f'{name}.blend'))
    bpy.ops.export_scene.gltf(filepath=str(OUTPUT/f'{name}.glb'),export_format='GLB',
        export_yup=True,export_animations=animated,export_animation_mode='ACTIONS',
        export_force_sampling=True,export_skins=True,export_def_bones=True,
        export_cameras=False,export_lights=False)

clean()
skin=material('Skin',(.48,.26,.15)); tunic=material('Linen',(.70,.52,.30))
sash=material('Indigo cloth',(.12,.25,.29)); hair=material('Hair',(.10,.055,.028))
leather=material('Leather',(.22,.12,.062)); eyes=material('Eyes',(.025,.02,.018))
# Blender metres, Z up; the face points toward -Y, exported as +Z in Godot.
bones={
 'hips':((0,0,.80),(0,0,1.00),None),
 'chest':((0,0,1.00),(0,0,1.32),'hips'),
 'head':((0,0,1.32),(0,0,1.62),'chest'),
 'upper_arm.L':((.22,0,1.27),(.29,0,1.02),'chest'),
 'forearm.L':((.29,0,1.02),(.32,-.025,.80),'upper_arm.L'),
 'upper_arm.R':((-.22,0,1.27),(-.29,0,1.02),'chest'),
 'forearm.R':((-.29,0,1.02),(-.32,-.025,.80),'upper_arm.R'),
 'thigh.L':((.11,0,.84),(.11,0,.45),'hips'),
 'shin.L':((.11,0,.45),(.11,0,.10),'thigh.L'),
 'thigh.R':((-.11,0,.84),(-.11,0,.45),'hips'),
 'shin.R':((-.11,0,.45),(-.11,0,.10),'thigh.R')}
cone('Tunic skirt',(0,0,.84),.25,.18,.38,tunic,'hips')
torso=cone('Tunic body',(0,0,1.12),.18,.24,.35,tunic,'chest');torso.scale.y=.65
box('Sash',(0,-.132,1.14),(.075,.035,.37),sash,'chest').rotation_euler.y=-.30
cone('Belt',(0,0,.98),.19,.19,.055,leather,'hips')
limb('Neck',(0,0,1.28),(0,0,1.40),.065,skin,'head')
ico('Face',(0,-.015,1.50),(.145,.13,.19),skin,'head',2)
ico('Hair cap',(0,.01,1.61),(.151,.135,.105),hair,'head',2)
ico('Hair back',(0,.08,1.51),(.145,.08,.14),hair,'head',1)
ico('Nose',(0,-.145,1.49),(.034,.045,.035),skin,'head')
for side in (-1,1):
    ico('Eye',(.054*side,-.131,1.53),(.014,.012,.012),eyes,'head')
    ico('Ear',(.145*side,0,1.50),(.027,.035,.05),skin,'head')
    suffix='L' if side==1 else 'R'
    for part in ('upper_arm','forearm','thigh','shin'):
        a,b,_=bones[f'{part}.{suffix}']
        limb(part,a,b,.062 if part in ('upper_arm','thigh') else .045,tunic if part=='upper_arm' else skin,f'{part}.{suffix}')
    ico('Hand',(.32*side,-.025,.78),(.045,.035,.065),skin,f'forearm.{suffix}')
    box('Sandal',(.11*side,-.055,.065),(.115,.23,.07),leather,f'shin.{suffix}')
ico('Provisions pouch',(.18,.06,.85),(.10,.08,.14),leather,'hips')

bpy.ops.object.select_all(action='DESELECT')
for ob in parts: ob.select_set(True)
bpy.context.view_layer.objects.active=parts[0]
bpy.ops.object.join(); mesh=bpy.context.object; mesh.name='ShepherdMesh'
bpy.ops.object.transform_apply(location=True,rotation=True,scale=True)
rig_data=bpy.data.armatures.new('ShepherdSkeleton')
rig=bpy.data.objects.new('ShepherdRig',rig_data); bpy.context.collection.objects.link(rig)
bpy.context.view_layer.objects.active=rig; mesh.select_set(False);rig.select_set(True)
bpy.ops.object.mode_set(mode='EDIT')
for name,(head,tail,parent) in bones.items():
    bone=rig_data.edit_bones.new(name);bone.head=head;bone.tail=tail
    if parent: bone.parent=rig_data.edit_bones[parent]
bpy.ops.object.mode_set(mode='OBJECT')
mesh.parent=rig; mod=mesh.modifiers.new('Skin','ARMATURE');mod.object=rig
rig.animation_data_create()
for pose in rig.pose.bones: pose.rotation_mode='XYZ'
actions=[]
for clip,length in [('Idle',48),('Walk',24),('Wave',48)]:
    action=bpy.data.actions.new(clip); action.use_fake_user=True; rig.animation_data.action=action
    for frame in range(1,length+2,6):
        phase=(frame-1)/length*math.tau
        for pose in rig.pose.bones: pose.location=(0,0,0);pose.rotation_euler=(0,0,0)
        p=rig.pose.bones
        if clip=='Idle':
            p['chest'].rotation_euler.x=.025*math.sin(phase)
            p['head'].rotation_euler.z=.045*math.sin(phase)
        elif clip=='Walk':
            p['hips'].location.y=.025*(1-math.cos(phase*2))
            for side,sign in [('L',1),('R',-1)]:
                stride=math.sin(phase)*sign
                p[f'thigh.{side}'].rotation_euler.x=.55*stride
                p[f'shin.{side}'].rotation_euler.x=max(0,-stride)*.45
                p[f'upper_arm.{side}'].rotation_euler.x=-.45*stride
                p[f'forearm.{side}'].rotation_euler.x=-.15
        else:
            p['upper_arm.R'].rotation_euler.z=-1.3
            p['forearm.R'].rotation_euler.z=-.5+.22*math.sin(phase*2)
            p['head'].rotation_euler.z=.06*math.sin(phase)
        for pose in rig.pose.bones:
            pose.keyframe_insert('rotation_euler',frame=frame,group=pose.name)
            pose.keyframe_insert('location',frame=frame,group=pose.name)
    actions.append(action)
rig.animation_data.action=actions[0]
bpy.context.scene.frame_start=1;bpy.context.scene.frame_end=49
save_export('shepherd',True)

clean(); parts=[]
stone=material('Warm limestone',(.64,.53,.36));cap=material('Light limestone',(.76,.65,.47))
# A 4 m wide, 2.9 m tall gateway. Collision is authored separately in Godot.
for side in (-1,1):
    for row_index in range(5):
        box(f'Pier_{side}_{row_index}',(side*1.42,0,.25+row_index*.48),(.95,.85,.46),stone if row_index%2 else cap)
    box('Pier cap',(side*1.42,0,2.49),(1.08,.96,.18),cap)
for i in range(9):
    angle=math.pi*i/8
    ob=box(f'Arch stone {i}',(math.cos(angle)*.98,0,2.12+math.sin(angle)*.63),(.42,.79,.40),cap if i%2==0 else stone)
    ob.rotation_euler.y=-(angle-math.pi/2)
save_export('courtyard-gate',False)

# Short original confirmation tone; essential feedback also appears on screen.
with wave.open(str(OUTPUT/'confirmation.wav'),'wb') as sound:
    sound.setparams((1,2,22050,0,'NONE','not compressed'))
    samples=[]
    for i in range(int(.24*22050)):
        t=i/22050;env=min(1,t/.008)*max(0,1-t/.24)**2
        sample=.19*env*(math.sin(math.tau*660*t)+.45*math.sin(math.tau*990*t))
        samples.append(struct.pack('<h',int(sample*32767)))
    sound.writeframes(b''.join(samples))

def glb_stats(path):
    raw=path.read_bytes();size,kind=struct.unpack_from('<II',raw,12)
    data=json.loads(raw[20:20+size]);assert kind==0x4E4F534A
    triangles=sum(data['accessors'][p['indices']]['count']//3 for m in data.get('meshes',[]) for p in m['primitives'])
    return {'file':path.name,'bytes':len(raw),'triangles':triangles,'meshes':len(data.get('meshes',[])),
        'materials':len(data.get('materials',[])),'skins':len(data.get('skins',[])),
        'joints':sum(len(s['joints']) for s in data.get('skins',[])),
        'animations':[a['name'] for a in data.get('animations',[])]}
report={'generator':'tools/create-proof-assets.py','blender':bpy.app.version_string,'units':'metres',
    'source_axes':'Blender Z-up, character faces -Y','export_axes':'glTF/Godot Y-up, character faces +Z',
    'assets':[glb_stats(OUTPUT/'shepherd.glb'),glb_stats(OUTPUT/'courtyard-gate.glb')]}
(SOURCE/'asset-metrics.json').write_text(json.dumps(report,indent=2)+'\n')
print('A05_ASSETS='+json.dumps(report))
