"""Author separate Chapter 3 speaking/reaction variants; retain original battle and camp assets."""
from math import cos, exp, pi, sin, tau
from pathlib import Path
import sys
import bpy
from mathutils import Vector
sys.path.insert(0,str(Path(__file__).parent))
from elah_combat import action,aim,apply_pose,champion_pose,key,material,mesh,mix_keys,rotate,sample_pose

args=sys.argv[sys.argv.index('--')+1:]
kind=args[0];output=Path(args[1]).resolve();output.parent.mkdir(parents=True,exist_ok=True)
rig=next(obj for obj in bpy.context.scene.objects if obj.type=='ARMATURE')

def morph(obj,name,deform):
    if not obj.data.shape_keys:obj.shape_key_add(name='Basis')
    shape=obj.shape_key_add(name=name)
    for point in shape.data:point.co=deform(point.co.copy())

if kind=='goliath':
    idle=sample_pose(rig,bpy.data.actions['goliath_ready'],0)
    apply_pose(rig,{})
    # Existing broad beard has no mouth opening. Place a small articulated lip
    # surface on its front and move the jaw/beard together during speech.
    z=1.606;y=-.180
    dark=material('Goliath mouth interior',(.065,.010,.008),.98)
    lip=material('Goliath lips',(.30,.086,.050),.83)
    teeth=material('Goliath teeth',(.64,.57,.43),.73)
    n=24
    vertices=[(0,y,z)]+[(.030*cos(tau*i/n),y,z+.004*sin(tau*i/n)) for i in range(n)]
    inner=mesh('Goliath speaking mouth',vertices,[(0,1+i,1+(i+1)%n) for i in range(n)],rig,'Head',dark)
    vertices=[(.030*r*cos(tau*i/n),y-.0015,z+.004*r*sin(tau*i/n)) for r in [1,1.14] for i in range(n)]
    rim=mesh('Goliath lip edge',vertices,[(i,(i+1)%n,n+(i+1)%n,n+i) for i in range(n)],rig,'Head',lip)
    for part in [inner,rim]:
        def opening(p):
            p.z+=(p.z-z)/.004*.021-.008;return p
        def rounding(p):p.x*=.73;p.y-=.002;return p
        morph(part,'SpeakOpen',opening);morph(part,'SpeakRound',rounding)
    mesh('Goliath upper teeth',[(-.020,y-.0007,z+.001),(.020,y-.0007,z+.001),(.018,y-.0007,z-.001),(-.018,y-.0007,z-.001)],[(0,1,2,3)],rig,'Head',teeth)
    for obj in list(bpy.context.scene.objects):
        if obj.type!='MESH' or obj in [inner,rim]:continue
        if obj.name in ['Goliath Sun-worn skin','Goliath Charcoal beard']:
            world=obj.matrix_world.copy();inverse=world.inverted()
            # Mesh coordinates predate the actor's 1.61 root scale.
            def jaw(p):
                q=world@p/1.61
                weight=exp(-(q.x/.087)**4)*max(0,min(1,(-q.y-.04)/.06))*max(0,min(1,(1.633-q.z)/.035))*max(0,min(1,(q.z-1.48)/.05))
                q.z-=.023*weight
                return inverse@(q*1.61)
            morph(obj,'SpeakOpen',jaw)
    bones=tuple(b.name for b in rig.pose.bones if b.name not in ['Goliath forehead','Spear tip'])
    frames=[(0,(-.06,-.35,.10,0,0,0,0,0)),(20,(-.03,-.14,.06,-4,-7,0,0,.6)),(50,(.01,-.25,.12,-2,6,-.01,0,1)),(85,(-.04,-.28,.09,2,3,0,0,.4)),(110,(-.03,-.12,.08,-3,-8,0,0,.8)),(145,(.02,-.27,.12,-4,7,-.01,0,1)),(175,(-.04,-.29,.10,0,2,0,0,.4)),(192,(-.06,-.35,.10,0,0,0,0,0))]
    action(rig,'goliath_speak')
    for frame in range(193):champion_pose(rig,idle,mix_keys(frames,frame));key(rig,frame,bones,('pelvis',))
    initial='goliath_ready'
else:
    idle=sample_pose(rig,bpy.data.actions['idle_relaxed'],0)
    walking=[sample_pose(rig,bpy.data.actions['walk_forward'],i) for i in range(33)]
    bones=tuple(b.name for b in rig.pose.bones)
    action(rig,'react_alarm')
    for frame in range(53):
        # Reverse the lower-body walk for a short backward step, then settle.
        fade=min(1,frame/6,max(0,(52-frame)/10))
        source=walking[(32-int(frame*.68))%33]
        pose={name:(idle[name][0].slerp(value[0],fade),idle[name][1].lerp(value[1],fade)) for name,value in source.items()}
        apply_pose(rig,pose)
        strength=mix_keys([(0,(0,)),(7,(1,)),(20,(.85,)),(37,(.6,)),(52,(0,))],frame)[0]
        rotate(rig,'spine_03',(1,0,0),-10*strength);rotate(rig,'Head',(1,0,0),-6*strength)
        for side,suffix in [(-1,'r'),(1,'l')]:
            aim(rig,'upperarm_'+suffix,(side*.24,-.20-strength*.15,-.95+strength*.22))
            aim(rig,'lowerarm_'+suffix,(-side*.12,-.62,-.72+strength*.55))
        key(rig,frame,bones,('pelvis',))
    action(rig,'speak_rebuke')
    frames=[(0,(0,0)),(16,(.8,-3)),(40,(1,-5)),(65,(.4,0)),(91,(.8,-3)),(127,(.65,2)),(157,(.2,0)),(180,(0,0))]
    for frame in range(181):
        apply_pose(rig,idle);gesture,tilt=mix_keys(frames,frame)
        rotate(rig,'spine_03',(0,0,1),tilt);rotate(rig,'Head',(1,0,0),3*gesture)
        if gesture:
            aim(rig,'upperarm_r',(-.18,-.12-gesture*.3,-.95+gesture*.25))
            aim(rig,'lowerarm_r',(.08,-.82,-.50+gesture*.65))
            aim(rig,'hand_r',(.05,-.95,.15))
        key(rig,frame,bones)
    initial='idle_relaxed'

rig.animation_data.action=bpy.data.actions[initial];rig.animation_data.action_slot=rig.animation_data.action.slots[0]
bpy.context.scene.frame_set(0);bpy.ops.object.select_all(action='SELECT');bpy.context.view_layer.objects.active=rig
bpy.ops.wm.save_as_mainfile(filepath=str(output.with_suffix('.blend')),compress=True)
bpy.ops.export_scene.gltf(filepath=str(output),export_format='GLB',use_selection=True,export_animations=True,export_animation_mode='ACTIONS',export_force_sampling=True,export_yup=True,export_vertex_color='NONE' if kind=='goliath' else 'NAME',export_vertex_color_name='Palette')
print('CHALLENGE_VARIANT',kind,str(output),flush=True)
