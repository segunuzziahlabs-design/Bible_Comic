"""Run after opening source-assets/proof/shepherd.blend with pinned Blender."""
import bpy,json
rigs=[obj for obj in bpy.data.objects if obj.type=='ARMATURE']
actions=sorted(action.name for action in bpy.data.actions)
assert len(rigs)==1, 'Expected exactly one character rig'
assert len(rigs[0].data.bones)==11, 'Missing skeleton bones'
assert actions==['Idle','Walk','Wave'], 'Animation action was lost on save/reopen'
assert all(action.use_fake_user for action in bpy.data.actions), 'Clips must survive unused-action cleanup'
assert bpy.context.scene.unit_settings.scale_length==1, 'Expected metres'
print('A05_SOURCE='+json.dumps({'blender':bpy.app.version_string,'rigs':len(rigs),'bones':len(rigs[0].data.bones),'actions':actions,'unit_scale':1,'retained_actions':True}))
