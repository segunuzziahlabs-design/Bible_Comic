extends Node3D

const STATE = preload("res://scripts/proof/proof_state.gd")
@export var world_path := NodePath("Courtyard")
@export var location_name := "courtyard"
@export var build_id := "B05-courtyard-v1"
@export var render_limit := Vector2(1280, 720)
var state = STATE.new()
@onready var world: Node3D = get_node(world_path)
@onready var player: CharacterBody3D = $David
@onready var jesse: Node3D = $Jesse
@onready var camera_rig: Node3D = $ExplorationCamera
@onready var ui: Control = $Interface/GameUI
@onready var input_surface: Control = $Interface/GameInput
@onready var marker: Node3D = $ObjectiveMarker
@onready var marker_text: Label3D = $ObjectiveMarker/Label
@onready var cue: AudioStreamPlayer = $Confirmation
@onready var interactor: Node = $Interactor
@onready var exchange: Node = get_node_or_null("Exchange")
@onready var village_life: Node3D = get_node_or_null("VillageLife")
var dialogue_target: Node3D
var sequence_target: Node3D
var accepted_story_events: Array[String] = []
var started := false
var paused := false
var dialogue := false
var help_open := false
var muted := false
var extra_light := false
var target := ""
var toast_timer := 0.0
var telemetry_timer := 0.0
var diagnostics := false
var motion_trace: JavaScriptObject
var audio_events := 0
var recoveries := 0
var web_blur_callback: JavaScriptObject
var web_visibility_callback: JavaScriptObject

func _ready() -> void:
	Engine.max_fps = 60
	ui.configure_location(location_name)
	player.reset_at(world.spawn_position())
	jesse.global_position = world.target_position("jesse")
	jesse.play("Wave")
	if exchange:
		exchange.configure(player, jesse, camera_rig, world.provisions_bundle(), village_life)
		exchange.finished.connect(_finish_exchange)
		ui.skip_requested.connect(_skip_exchange)
	interactor.configure(player, world.interaction_targets())
	interactor.interaction_requested.connect(_on_interaction_requested)
	input_surface.interact_requested.connect(_interaction_requested)
	input_surface.pause_requested.connect(_toggle_pause)
	ui.start_requested.connect(_start)
	ui.interact_requested.connect(_interact)
	ui.continue_requested.connect(_continue_requested)
	ui.pause_requested.connect(_toggle_pause)
	ui.restart_requested.connect(_restart)
	ui.mute_requested.connect(_toggle_mute)
	ui.quality_requested.connect(_toggle_quality)
	ui.help_requested.connect(_show_help)
	ui.help_closed.connect(_close_help)
	get_viewport().size_changed.connect(_resize)
	get_window().mouse_exited.connect(_cancel_controls)
	if OS.has_feature("web"):
		diagnostics = bool(JavaScriptBridge.eval("new URLSearchParams(location.search).has('diagnostics')", true))
		if diagnostics and JavaScriptBridge.eval("new URLSearchParams(location.search).has('motion')", true):
			motion_trace = JavaScriptBridge.create_object("Array")
			JavaScriptBridge.get_interface("window").__bibleMotion = motion_trace
		web_blur_callback = JavaScriptBridge.create_callback(_web_blur)
		web_visibility_callback = JavaScriptBridge.create_callback(_web_visibility)
		JavaScriptBridge.get_interface("window").addEventListener("blur", web_blur_callback)
		JavaScriptBridge.get_interface("document").addEventListener("visibilitychange", web_visibility_callback)
	ui.enable_diagnostics(diagnostics)
	_resize()
	_update_camera(1.0)
	_update_objective()
	print("A04_PROOF_READY")

func _resize() -> void:
	var view := get_viewport().get_visible_rect().size
	var max_long := 854.0 if extra_light else render_limit.x
	var max_short := 480.0 if extra_light else render_limit.y
	get_viewport().scaling_3d_scale = minf(0.75 if extra_light else 1.0, minf(max_long / maxf(view.x, view.y), max_short / minf(view.x, view.y)))
	camera_rig.set_viewport_size(view)
	_cancel_controls()
	ui.layout()

func _physics_process(delta: float) -> void:
	if not player or not ui:
		return
	var in_sequence := _playing_exchange()
	if village_life and started and not paused and not help_open and state.stage < 3:
		village_life.advance(delta)
	var active: bool = started and not paused and not dialogue and not in_sequence and not help_open and state.stage < 3
	input_surface.active = active
	var look: Vector2 = input_surface.take_look() if active else Vector2.ZERO
	camera_rig.apply_look(look)
	if in_sequence:
		if not paused:
			exchange.step(delta)
			ui.set_exchange_line(exchange.line)
	else:
		player.step(delta, input_surface.get_movement() if active else Vector2.ZERO, camera_rig.yaw, active)
		if exchange and not paused:
			jesse.animation_player.advance(delta)
	if motion_trace and motion_trace.length < 3600:
		var visual: Node3D = player.actor
		motion_trace.push(JSON.stringify([Engine.get_physics_frames(), player.position.x, player.position.z,
			visual.rotation.y, visual.travel_speed, visual.walk_rate, visual.walk_weight, visual.walk_phase]))
	var local_player := world.to_local(player.global_position)
	if local_player.y < -5 or absf(local_player.x) > 25 or absf(local_player.z) > 25:
		if _playing_exchange():
			exchange.finish(false)
		player.reset_at(world.spawn_position())
		camera_rig.reset()
		recoveries += 1
		input_surface.clear()
		_message("Returned to a safe place. Your objective is unchanged.")
	if not (paused and _playing_exchange()):
		_update_camera(delta)
	_sync_interactions()
	interactor.step(delta)
	_refresh_prompt()
	if state.stage < 3:
		var objective_id: String = state.target_id()
		var destination := target_position(objective_id)
		var packing_table := exchange != null and objective_id == "provisions"
		var view := get_viewport().get_visible_rect().size
		var portrait_table := packing_table and view.x < view.y
		marker.global_position = destination + world.global_basis * Vector3(0, 0, .55) if packing_table else destination
		marker_text.position = Vector3(-.62, 1.83, 0) if portrait_table else Vector3(0, 3.04 if packing_table else 2.35, 0)
		marker_text.pixel_size = .0046 if portrait_table else .006
		marker.visible = started and not _playing_exchange()
		marker_text.text = "PACKING TABLE" if packing_table else {"jesse": "JESSE", "provisions": "PROVISIONS", "gate": "VILLAGE GATE"}[objective_id]
		var distance := Vector2(player.global_position.x - destination.x, player.global_position.z - destination.z).length()
		ui.set_progress("STEP %d OF 3   ·   %d m to your objective" % [state.stage + 1, ceili(distance)])
	else:
		marker.visible = false
	if toast_timer > 0:
		toast_timer -= delta
		if toast_timer <= 0:
			ui.set_toast("")
	telemetry_timer += delta
	if telemetry_timer >= .25:
		telemetry_timer = 0
		_publish_diagnostics()

func _update_camera(delta: float) -> void:
	camera_rig.step(delta, player)

func _cancel_controls() -> void:
	input_surface.clear()
	player.stop()

func target_position(id: String) -> Vector3:
	return world.target_position(id)

func _playing_exchange() -> bool:
	return exchange != null and exchange.active()

func _sync_interactions() -> void:
	for item in interactor.targets:
		match item.interaction_id:
			"jesse":
				item.enabled = state.stage < 3
				if exchange:
					item.prompt = "Speak to Jesse" if state.stage == 0 else "Replay Jesse's request"
			"provisions": item.enabled = state.stage == 1
			"gate": item.enabled = state.stage == 2
	interactor.active = started and not paused and not dialogue and not _playing_exchange() and not help_open and state.stage < 3

func _refresh_prompt() -> void:
	var item: Node3D = interactor.refresh()
	target = item.interaction_id if item != null else ""
	var copy: String = item.prompt if item != null else "Follow the marker"
	if item != null and not input_surface.touch_visible:
		copy = "E · " + copy
	ui.set_context(copy, item != null)

func _suspend_interactions() -> void:
	interactor.suspend()
	target = ""
	ui.set_context("Follow the marker", false)

func _continue_requested() -> void:
	if interactor.cooldown_remaining <= 0:
		_finish_dialogue()

func _interaction_requested() -> void:
	if not started or help_open or _playing_exchange():
		return
	if dialogue:
		_continue_requested()
	elif not paused:
		_interact()

func _notification(what: int) -> void:
	if what == NOTIFICATION_APPLICATION_FOCUS_OUT and is_instance_valid(input_surface):
		_pause_for_focus_loss()

func _web_blur(_arguments: Array) -> void:
	_pause_for_focus_loss()

func _web_visibility(_arguments: Array) -> void:
	if JavaScriptBridge.get_interface("document").hidden:
		_pause_for_focus_loss()

func _pause_for_focus_loss() -> void:
	_cancel_controls()
	if help_open:
		return
	if _playing_exchange():
		if not paused:
			_toggle_pause()
		return
	if started and not dialogue and state.stage < 3:
		paused = true
		_suspend_interactions()
		ui.show_card("pause", "The " + location_name + " can wait", "Your place is kept while this page stays open.", "Continue exploring")

func _exit_tree() -> void:
	if get_window().mouse_exited.is_connected(_cancel_controls):
		get_window().mouse_exited.disconnect(_cancel_controls)
	if OS.has_feature("web") and web_blur_callback:
		JavaScriptBridge.get_interface("window").removeEventListener("blur", web_blur_callback)
		JavaScriptBridge.get_interface("document").removeEventListener("visibilitychange", web_visibility_callback)

func _start() -> void:
	started = true
	paused = false
	help_open = false
	ui.show_game()
	input_surface.clear()
	_sound()
	_message("Drag left to move; drag right to look. Follow the gold marker." if input_surface.touch_visible else "Find Jesse by the golden marker. Move with WASD or the arrow keys.")

func _interact() -> void:
	if not started or paused or dialogue or _playing_exchange() or help_open or state.stage == 3:
		return
	_sync_interactions()
	interactor.attempt()
	_refresh_prompt()

func _accept_story_event(item: Node3D) -> bool:
	if not state.accept(item.event_id):
		return false
	accepted_story_events.append(item.event_id)
	return true

func _on_interaction_requested(item: Node3D) -> void:
	if exchange and item.interaction_id in ["jesse", "provisions"]:
		_begin_exchange(item)
		return
	match item.interaction_id:
		"jesse":
			dialogue_target = item
			dialogue = true
			_cancel_controls()
			_suspend_interactions()
			ui.show_card("dialogue", "A task for David", "Take these provisions for your brothers. Pick up the bundle, then meet the road at the village gate." if state.stage == 0 else "The bundle is beside the table. The road begins through the stone gate.", "I am ready")
			_sound()
		"provisions":
			var accepted := _accept_story_event(item)
			item.finish_interaction(accepted)
			if accepted:
				world.show_provisions(false)
				_update_objective()
				_sound()
				_message("Provisions collected. Find the village gate.")
		"gate":
			var accepted := _accept_story_event(item)
			item.finish_interaction(accepted)
			if accepted:
				_cancel_controls()
				_suspend_interactions()
				_update_objective()
				_sound()
				ui.show_card("complete", "The journey begins", "You spoke to Jesse, collected the provisions and reached the gate.\n\nThis " + location_name + " is a playable sample. The David and Goliath episode is still in development.", "Explore again")
		_:
			item.finish_interaction(false)

func _begin_exchange(item: Node3D) -> void:
	var talk: bool = item.interaction_id == "jesse"
	if talk:
		exchange.begin_talk()
		dialogue_target = item
		dialogue = true
		_sound()
	elif not exchange.begin_pickup():
		item.finish_interaction(false)
		_message("Move to the front of the packing table to take the provisions.")
		return
	sequence_target = item
	_cancel_controls()
	input_surface.active = false
	_suspend_interactions()
	ui.set_exchange_line(exchange.line)
	ui.show_exchange(talk)

func _finish_exchange(completed: bool) -> void:
	var item := sequence_target
	sequence_target = null
	dialogue_target = null
	dialogue = false
	if is_instance_valid(item):
		var accepted := completed and _accept_story_event(item)
		var pickup: bool = item.interaction_id == "provisions"
		item.finish_interaction(accepted if pickup else completed)
		if pickup:
			if accepted:
				world.show_provisions(false)
				_sound()
				_message("Provisions collected. Find the village gate.")
			else:
				exchange.restore_bundle()
				_message("The provisions are still on the table. Try Take again.")
	interactor.cooldown_remaining = interactor.debounce_seconds
	_cancel_controls()
	_update_objective()
	ui.show_game()

func _skip_exchange() -> void:
	if _playing_exchange() and not paused:
		exchange.skip()

func _finish_dialogue() -> void:
	if not dialogue or _playing_exchange():
		return
	dialogue = false
	if is_instance_valid(dialogue_target):
		_accept_story_event(dialogue_target)
		dialogue_target.finish_interaction(true)
	dialogue_target = null
	interactor.cooldown_remaining = interactor.debounce_seconds
	jesse.play("Idle")
	_update_objective()
	ui.show_game()
	input_surface.clear()

func _toggle_pause() -> void:
	if help_open:
		_close_help()
		return
	if not started or (dialogue and not _playing_exchange()) or state.stage == 3:
		return
	paused = not paused
	_cancel_controls()
	if _playing_exchange():
		cue.stream_paused = paused
		if paused:
			ui.show_card("pause", "Take a moment", "The scene will continue when you resume.", "Resume scene")
		else:
			ui.show_exchange(dialogue)
		return
	if paused:
		_suspend_interactions()
		ui.show_card("pause", "Take a moment", "Your objective is kept in this session. Reloading the page starts a new visit.", "Continue exploring")
	else:
		ui.show_game()

func _show_help() -> void:
	if dialogue or _playing_exchange() or paused or state.stage == 3:
		return
	help_open = true
	_cancel_controls()
	input_surface.active = false
	_suspend_interactions()
	ui.show_help(input_surface.touch_visible, state.objective())

func _close_help() -> void:
	if not help_open:
		return
	help_open = false
	_cancel_controls()
	if started:
		ui.show_game()
	else:
		ui.show_welcome()
	_sync_interactions()
	_refresh_prompt()

func _restart() -> void:
	if exchange:
		exchange.reset()
	if village_life:
		village_life.reset()
	sequence_target = null
	cue.stream_paused = false
	state.reset()
	interactor.reset_interactions()
	dialogue_target = null
	accepted_story_events.clear()
	player.reset_at(world.spawn_position())
	camera_rig.reset()
	started = true
	paused = false
	dialogue = false
	help_open = false
	world.show_provisions(true)
	jesse.play("Wave")
	input_surface.clear()
	ui.set_toast("")
	_update_objective()
	_update_camera(1)
	ui.show_game()
	_sync_interactions()
	_refresh_prompt()

func _toggle_mute() -> void:
	muted = not muted
	AudioServer.set_bus_mute(0, muted)
	ui.set_sound_enabled(not muted)

func _toggle_quality() -> void:
	extra_light = not extra_light
	ui.set_extra_light(extra_light)
	_resize()

func _update_objective() -> void:
	ui.set_objective(location_name.capitalize() + " complete" if state.stage == 3 else state.objective())

func _message(copy: String) -> void:
	ui.set_toast(copy)
	toast_timer = 5

func _sound() -> void:
	if not muted:
		cue.play()
		audio_events += 1

func _publish_diagnostics() -> void:
	if not diagnostics:
		return
	var fps := Engine.get_frames_per_second()
	ui.set_diagnostics("PROOF  ·  %d FPS  ·  3D scale %.2f" % [fps, get_viewport().scaling_3d_scale])
	if OS.has_feature("web"):
		var result := {"build": build_id, "location": location_name, "stage": state.stage, "objective": state.objective(),
			"mode": ui.mode, "started": started, "paused": paused, "dialogue": dialogue, "help_open": help_open,
			"player": [player.global_position.x, player.global_position.y, player.global_position.z], "yaw": camera_rig.yaw,
			"velocity": [player.velocity.x, player.velocity.y, player.velocity.z], "grounded": player.is_on_floor(),
			"walk_speed": player.SPEED,
			"camera": camera_rig.evidence(), "mouse_looking": input_surface.mouse_looking,
			"target": target, "animation": player.actor.animation_evidence(), "jesse_animation": jesse.animation_evidence(),
			"interaction": interactor.evidence(), "story_events": accepted_story_events,
			"context": {"text": ui.context_button.text, "enabled": not ui.context_button.disabled, "visible": ui.context_button.visible},
			"audio_events": audio_events, "muted": muted, "extra_light": extra_light, "recoveries": recoveries,
			"fps": fps, "frame_ms": Performance.get_monitor(Performance.TIME_PROCESS) * 1000,
			"draw_calls": Performance.get_monitor(Performance.RENDER_TOTAL_DRAW_CALLS_IN_FRAME),
			"visible_primitives": Performance.get_monitor(Performance.RENDER_TOTAL_PRIMITIVES_IN_FRAME),
			"scale_3d": get_viewport().scaling_3d_scale, "layout": ui.diagnostic_layout(),
			"touch": {"move_id": input_surface.move_id, "look_id": input_surface.look_id, "movement": [input_surface.movement.x, input_surface.movement.y]}}
		if world.get("geometry_metrics") != null:
			result["world_geometry"] = world.geometry_metrics
		if exchange:
			result["exchange"] = exchange.evidence()
		JavaScriptBridge.eval("window.__bibleProof=" + JSON.stringify(result) + ";", true)
