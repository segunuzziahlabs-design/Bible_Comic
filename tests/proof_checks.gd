extends SceneTree

const STATE = preload("res://scripts/proof/proof_state.gd")
const ACTOR = preload("res://scenes/characters/shepherd.tscn")
const INPUT = preload("res://scenes/player/game_input.tscn")
var failures: Array[String] = []
var passed: Array[String] = []

func _initialize() -> void:
	call_deferred("run")

func check(condition: bool, label: String) -> void:
	if condition:
		passed.append(label)
	else:
		failures.append(label)
		push_error(label)

func run() -> void:
	var state = STATE.new()
	check(not state.accept("gate_reached") and state.stage == 0, "Cannot skip objectives")
	check(not state.accept("provisions_collected"), "Pickup requires Jesse dialogue")
	check(state.accept("jesse_spoken") and state.stage == 1, "Dialogue unlocks pickup")
	check(not state.accept("jesse_spoken") and state.stage == 1, "Duplicate dialogue is idempotent")
	check(state.accept("provisions_collected") and state.accept("gate_reached"), "Ordered path reaches completion")
	check(not state.accept("gate_reached") and state.stage == 3, "Completion only occurs once")
	state.reset()
	check(state.stage == 0 and state.target_id() == "jesse", "Restart resets all proof objectives")
	var input = INPUT.instantiate()
	root.add_child(input)
	input.move_id = 2
	input.look_id = 5
	input.movement = Vector2(1, 0)
	var cancel := InputEventScreenTouch.new()
	cancel.index = 2
	cancel.canceled = true
	cancel.pressed = true
	input._input(cancel)
	input.active = true
	input._unhandled_input(cancel)
	check(input.move_id == -1 and input.movement == Vector2.ZERO and input.look_id == 5, "Cancelled move touch clears only its finger")
	var release := InputEventScreenTouch.new()
	release.index = 5
	release.pressed = false
	input._input(release)
	check(input.look_id == -1, "Look finger releases independently")
	input.look_delta = Vector2.ONE
	input.mouse_looking = true
	var forward := InputEventKey.new()
	forward.physical_keycode = KEY_W
	forward.pressed = true
	input._unhandled_input(forward)
	input.clear()
	check(input.look_delta == Vector2.ZERO and not input.mouse_looking and input.get_movement() == Vector2.ZERO, "Focus/pause clear removes held look and keyboard movement")
	var actor = ACTOR.instantiate()
	root.add_child(actor)
	await process_frame
	check(actor.skeleton != null and actor.skeleton.get_bone_count() == 11, "GLB imports eleven skeleton bones")
	for clip in ["Idle", "Walk", "Wave"]:
		check(actor.clips.has(clip), "GLB imports " + clip + " animation")
	# Sample the clip directly; a transition blend deliberately delays its full pose.
	actor.animation_player.play(actor.clips["Walk"], 0)
	actor.animation_player.seek(0, true)
	var thigh: int = actor.skeleton.find_bone("thigh.L")
	var before: Quaternion = actor.skeleton.get_bone_pose_rotation(thigh)
	actor.animation_player.advance(.25)
	var after: Quaternion = actor.skeleton.get_bone_pose_rotation(thigh)
	check(before.angle_to(after) > .1, "Walk clip changes a skinned bone pose")
	check(actor.animation_player.get_animation(actor.clips["Walk"]).loop_mode == Animation.LOOP_LINEAR, "Locomotion repeats as a loop")
	var gate = load("res://assets/proof/courtyard-gate.glb").instantiate()
	root.add_child(gate)
	check(gate.find_children("*", "MeshInstance3D", true, false).size() > 0, "Environment GLB imports meshes")
	print("PROOF_CHECKS=" + JSON.stringify({"passed": passed, "failures": failures}))
	quit(0 if failures.is_empty() else 1)
