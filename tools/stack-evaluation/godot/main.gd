extends Node3D

var _model: Node3D
var _camera := Camera3D.new()
var _player: AnimationPlayer
var _morphs: Dictionary = {}
var _step_callback: JavaScriptObject
var _snapshot_callback: JavaScriptObject
var _stack: JavaScriptObject
var _metrics: JavaScriptObject


func _ready() -> void:
	var environment := Environment.new()
	environment.background_mode = Environment.BG_COLOR
	environment.background_color = Color.html("#3b5155")
	environment.ambient_light_source = Environment.AMBIENT_SOURCE_COLOR
	environment.ambient_light_color = Color(0.91, 0.89, 0.86)
	environment.ambient_light_energy = 0.63
	var world := WorldEnvironment.new()
	world.environment = environment
	add_child(world)

	var light := DirectionalLight3D.new()
	light.rotation_degrees = Vector3(-48, -28, 0)
	light.light_color = Color(1.0, 0.94, 0.85)
	light.light_energy = 1.30
	light.shadow_enabled = true
	light.directional_shadow_mode = DirectionalLight3D.SHADOW_ORTHOGONAL
	light.directional_shadow_max_distance = 8.0
	light.shadow_normal_bias = 1.0
	add_child(light)

	var floor_mesh := BoxMesh.new()
	floor_mesh.size = Vector3(14.0, 0.10, 12.0)
	var floor_material := StandardMaterial3D.new()
	floor_material.albedo_color = Color(0.40, 0.37, 0.33)
	floor_material.roughness = 0.88
	floor_mesh.material = floor_material
	var floor_node := MeshInstance3D.new()
	floor_node.mesh = floor_mesh
	floor_node.cast_shadow = GeometryInstance3D.SHADOW_CASTING_SETTING_OFF
	floor_node.position.y = -0.05
	add_child(floor_node)

	_camera.fov = 38.0
	_camera.near = 0.05
	_camera.far = 32.0
	add_child(_camera)
	_camera.make_current()

	_model = preload("res://david.glb").instantiate()
	add_child(_model)
	_player = _model.find_children("*", "AnimationPlayer", true, false)[0]
	for clip in ["idle_relaxed", "walk_forward"]:
		_player.get_animation(clip).loop_mode = Animation.LOOP_LINEAR
	for mesh_node: MeshInstance3D in _model.find_children("*", "MeshInstance3D", true, false):
		for i in mesh_node.mesh.get_surface_count():
			var material := mesh_node.mesh.surface_get_material(i) as StandardMaterial3D
			material.vertex_color_use_as_albedo = true
		for i in mesh_node.get_blend_shape_count():
			_morphs[mesh_node.mesh.get_blend_shape_name(i)] = [mesh_node, i]
	_sample(["idle_relaxed", false, -1, 0, 0, 0, .70, 1.29, 4.20, 0, .93, 0, 0, 0, 0])
	if not OS.has_feature("web"):
		return
	_stack = JavaScriptBridge.get_interface("stack")
	_metrics = JavaScriptBridge.get_interface("stackTest")
	_metrics.backend = "webgl2"
	_metrics.clips = ",".join(_player.get_animation_list())
	_metrics.morphs = ",".join(_morphs.keys())
	for name in ["Blink", "BrowLift", "Smile"]:
		if not _morphs.has(name):
			_stack.fail("Missing facial pose " + name)
			return
	_step_callback = JavaScriptBridge.create_callback(_sample)
	_snapshot_callback = JavaScriptBridge.create_callback(_snapshot)
	_stack.snapshot = _snapshot_callback
	_stack.configure("Godot " + Engine.get_version_info().string, _step_callback)
	RenderingServer.frame_post_draw.connect(func() -> void: _stack.rendered())


func _sample(args: Array) -> void:
	var clip: String = args[0]
	var paused: bool = args[1]
	var sample: float = args[2]
	if clip != "":
		_player.play(clip, 0.0 if sample >= 0.0 else .23)
	if sample >= 0.0:
		_player.seek(sample, true)
		_player.speed_scale = 0.0
	else:
		_player.speed_scale = 0.0 if paused else 1.0
	_model.position = Vector3(args[3], 0.0, args[4])
	_model.rotation.y = args[5]
	_camera.position = Vector3(args[6], args[7], args[8])
	_camera.look_at(Vector3(args[9], args[10], args[11]))
	_set_morph("Blink", args[12])
	_set_morph("BrowLift", args[13])
	_set_morph("Smile", args[14])


func _set_morph(key: String, value: float) -> void:
	if _morphs.has(key):
		var target: Array = _morphs[key]
		target[0].set_blend_shape_value(target[1], value)


func _snapshot(_args: Array) -> void:
	var faces := {}
	for name: String in _morphs:
		var target: Array = _morphs[name]
		faces[name] = target[0].get_blend_shape_value(target[1])
	_metrics.enginePose = JSON.stringify({"clip": _player.current_animation, "seconds": _player.current_animation_position, "faces": faces})
