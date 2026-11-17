extends Node3D

signal action_started(clip: StringName)
signal action_finished(clip: StringName)
signal action_cancelled(clip: StringName)

const IDLE := &"idle_relaxed"
const WALK := &"walk_forward"
const ACTIONS := [&"listen_to_provisions", &"acknowledge", &"pickup_provisions"]
const AUTHORED_WALK_SPEED := 1.05
const WALK_SEEK := "parameters/Stride/seek_request"
const WALK_BLEND := "parameters/Locomotion/blend_amount"
const SHOT_REQUEST := "parameters/Act/request"
const SHOT_ACTIVE := "parameters/Act/active"

@export var palette: Material
var animation_player: AnimationPlayer
var skeleton: Skeleton3D
var tree: AnimationTree
var idle_node: AnimationNodeAnimation
var action_node: AnimationNodeAnimation
var action: StringName
var walk_length: float
var walk_phase := 0.0
var walk_weight := 0.0
var walk_rate := 0.0
var travel_speed := 0.0


func _ready() -> void:
	var model := $Model
	animation_player = model.find_children("*", "AnimationPlayer", true, false)[0] as AnimationPlayer
	skeleton = model.find_children("*", "Skeleton3D", true, false)[0] as Skeleton3D
	for mesh in model.find_children("*", "MeshInstance3D", true, false):
		mesh.material_override = palette
	walk_length = animation_player.get_animation(WALK).length
	for clip in [IDLE, WALK, &"listen"]:
		animation_player.get_animation(clip).loop_mode = Animation.LOOP_LINEAR
	configure_tree()
	reset_pose()


func configure_tree() -> void:
	var graph := AnimationNodeBlendTree.new()
	idle_node = AnimationNodeAnimation.new()
	idle_node.animation = IDLE
	var walk := AnimationNodeAnimation.new()
	walk.animation = WALK
	var stride := AnimationNodeTimeSeek.new()
	var locomotion := AnimationNodeBlend2.new()
	locomotion.sync = true
	var one_shot := AnimationNodeOneShot.new()
	one_shot.fadein_time = .15
	one_shot.fadeout_time = .18
	action_node = AnimationNodeAnimation.new()
	action_node.animation = &"acknowledge"
	graph.add_node(&"Idle", idle_node)
	graph.add_node(&"Walk", walk)
	graph.add_node(&"Stride", stride)
	graph.add_node(&"Locomotion", locomotion)
	graph.add_node(&"Action", action_node)
	graph.add_node(&"Act", one_shot)
	graph.connect_node(&"Stride", 0, &"Walk")
	graph.connect_node(&"Locomotion", 0, &"Idle")
	graph.connect_node(&"Locomotion", 1, &"Stride")
	graph.connect_node(&"Act", 0, &"Locomotion")
	graph.connect_node(&"Act", 1, &"Action")
	graph.connect_node(&"output", 0, &"Act")

	tree = AnimationTree.new()
	tree.active = false
	add_child(tree)
	tree.tree_root = graph
	tree.root_node = tree.get_path_to(animation_player.get_node(animation_player.root_node))
	tree.anim_player = tree.get_path_to(animation_player)
	tree.callback_mode_process = AnimationMixer.ANIMATION_CALLBACK_MODE_PROCESS_MANUAL
	animation_player.stop()
	tree.active = true


func advance_motion(delta: float, speed: float) -> void:
	travel_speed = speed
	walk_rate = clampf(speed / AUTHORED_WALK_SPEED, 0.0, 1.8)
	walk_phase = fposmod(walk_phase + walk_rate * delta, walk_length)
	var target := smoothstep(.045, .4, speed)
	walk_weight = move_toward(walk_weight, target, delta / (.14 if target > walk_weight else .17))
	tree.set(WALK_SEEK, walk_phase)
	tree.set(WALK_BLEND, walk_weight)
	tree.advance(delta)
	if action != &"" and not tree.get(SHOT_ACTIVE):
		var finished := action
		action = &""
		action_finished.emit(finished)


func request_action(clip: StringName) -> bool:
	if action != &"" or clip not in ACTIONS:
		return false
	action_node.animation = clip
	action = clip
	tree.set(SHOT_REQUEST, AnimationNodeOneShot.ONE_SHOT_REQUEST_FIRE)
	tree.advance(0.0)
	action_started.emit(clip)
	return true


func set_listening(enabled: bool) -> void:
	idle_node.animation = &"listen" if enabled else IDLE


func right_hand_transform() -> Transform3D:
	return skeleton.global_transform * skeleton.get_bone_global_pose(skeleton.find_bone(&"hand_r"))


func cancel_action() -> void:
	if action == &"":
		return
	var cancelled := action
	action = &""
	tree.set(SHOT_REQUEST, AnimationNodeOneShot.ONE_SHOT_REQUEST_ABORT)
	tree.advance(0.0)
	action_cancelled.emit(cancelled)


func reset_pose() -> void:
	cancel_action()
	set_listening(false)
	walk_phase = 0.0
	walk_weight = 0.0
	advance_motion(0.0, 0.0)


func animation_evidence() -> Dictionary:
	return {"ready": true, "bones": skeleton.get_bone_count(),
		"clip": action if action != &"" else (WALK if walk_weight > 0.0 else idle_node.animation),
		"time": walk_phase, "walk_weight": walk_weight, "walk_rate": walk_rate,
		"actual_speed": travel_speed, "authored_speed": AUTHORED_WALK_SPEED, "facing": rotation.y,
		"foot_l": str(skeleton.get_bone_global_pose(skeleton.find_bone(&"foot_l")).origin)}
