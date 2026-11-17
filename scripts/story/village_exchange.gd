extends Node

signal finished(completed: bool)

enum Phase { IDLE, TALK, APPROACH, PICKUP }
const CONTACT := 1.0
const STOW_START := 2.62
const STOW_END := 2.92
const PICKUP_CLIP := &"pickup_provisions"
@export var story: Resource

var phase := Phase.IDLE
var elapsed := 0.0
var beat := -1
var line := ""
var shot := "establish"
var point_until := 0.0
var glance_until := 0.0
var yard: Node3D
var player: CharacterBody3D
var jesse: Node3D
var camera: Node3D
var bundle: Node3D
var bundle_home: Transform3D
var pickup_mark: Vector3
var wrist_offset: Transform3D
var stow_from: Transform3D
var attached := false
var stowing := false
var pickup_completed := false
var contact_count := 0


func configure(david: CharacterBody3D, father: Node3D, view: Node3D, parcel: Node3D, activity: Node3D) -> void:
	player = david
	jesse = father
	camera = view
	bundle = parcel
	bundle_home = parcel.transform
	yard = activity
	jesse.animation_player.callback_mode_process = AnimationMixer.ANIMATION_CALLBACK_MODE_PROCESS_MANUAL
	player.actor.action_finished.connect(_action_finished)


func active() -> bool:
	return phase != Phase.IDLE


func begin_talk() -> void:
	phase = Phase.TALK
	elapsed = 0.0
	beat = -1
	line = ""
	shot = "establish"
	point_until = 0.0
	glance_until = 0.0
	_read_beats()
	player.actor.set_listening(true)
	jesse.play("Idle")


func begin_pickup() -> bool:
	pickup_mark = bundle.global_position - bundle.global_basis * Vector3(.04, 0, .50)
	pickup_mark.y = player.global_position.y
	if player.test_move(player.global_transform, pickup_mark - player.global_position):
		return false
	phase = Phase.APPROACH
	elapsed = 0.0
	line = "Collecting the provisions"
	attached = false
	stowing = false
	pickup_completed = false
	contact_count = 0
	return true


func step(delta: float) -> void:
	jesse.animation_player.advance(delta)
	elapsed += delta
	match phase:
		Phase.TALK: step_talk(delta)
		Phase.APPROACH: step_approach(delta)
		Phase.PICKUP: step_pickup(delta)


func face(actor: Node3D, yaw: float, delta: float) -> void:
	actor.global_rotation.y = rotate_toward(actor.global_rotation.y, yaw, delta * 5.5)


func heading(direction: Vector3) -> float:
	return atan2(direction.x, direction.z)


func step_talk(delta: float) -> void:
	if elapsed >= story.duration:
		finish(true)
		return
	var previous_shot := shot
	_read_beats()
	var separation := player.global_position - jesse.global_position
	separation.y = 0.0
	var talk_heading := heading(separation) if separation.length_squared() > .04 else 0.0
	var provisions := bundle.get_parent_node_3d().to_global(bundle_home.origin)
	var provision_direction := provisions - jesse.global_position
	var pointing := elapsed < point_until
	face(jesse, heading(provision_direction) - atan2(.76, .60) if pointing else talk_heading, delta)
	var looking_at_bundle := elapsed < glance_until
	face(player.actor, heading(provisions - player.global_position) if looking_at_bundle
		else talk_heading + PI - .68, delta)
	if not jesse.animation_player.is_playing():
		jesse.play("Idle")
	player.step(delta, Vector2.ZERO, 0.0, false)
	var along := separation.normalized() if separation.length_squared() > .04 else Vector3.BACK
	var direction := Vector3(along.z, .14, -along.x) + along * .19
	var subject := (player.global_position + jesse.global_position) * .5 + Vector3.UP * 1.06
	var viewport_size := get_viewport().get_visible_rect().size
	var aspect := viewport_size.x / maxf(1.0, viewport_size.y)
	var span := separation.length() + (1.1 if aspect < 1.0 else .7)
	var half_fov := deg_to_rad(camera.camera.fov * .5)
	var distance := maxf(2.8, span / (2.0 * tan(half_fov) * aspect) * 1.14)
	match shot:
		"establish":
			distance *= 1.19
			direction.y += .08
		"response":
			distance *= .96 if aspect < 1.0 else .90
			subject = subject.lerp(player.global_position + Vector3.UP * 1.12, .16)
		"yard":
			if is_instance_valid(yard):
				subject = yard.story_focus()
				direction = Vector3(1, .23, .47)
				distance = maxf(4.15, 4.25 / (2.0 * tan(half_fov) * aspect))
				if aspect >= 1.0 and viewport_size.y < 400.0:
					subject.y -= .42
					distance *= 1.10
	if elapsed >= story.duration - .7:
		camera.release_stage()
	else:
		camera.stage_shot(subject, direction, distance, player, previous_shot != shot)


func _read_beats() -> void:
	while beat + 1 < story.beats.size() and elapsed >= float(story.beats[beat + 1]["at"]):
		beat += 1
		var entry: Dictionary = story.beats[beat]
		line = entry.get("line", line)
		shot = entry.get("shot", shot)
		match entry.get("cue", ""):
			"greet": jesse.play("Greet")
			"point":
				jesse.play("Point")
				point_until = elapsed + 2.5
			"listen":
				player.actor.request_action(&"listen_to_provisions")
				glance_until = elapsed + 1.55
			"acknowledge": player.actor.request_action(&"acknowledge")


func step_approach(delta: float) -> void:
	var offset := pickup_mark - player.global_position
	offset.y = 0.0
	if elapsed >= 2.75:
		finish(false)
		return
	if offset.length() > .05:
		var movement := Vector2(offset.x, offset.z) * 4.5
		player.step(delta, movement.limit_length(.85), 0.0, true)
		return
	player.stop()
	if offset.length() > .007:
		player.move_and_collide(offset, false, .001)
		var remaining := Vector2(pickup_mark.x - player.global_position.x, pickup_mark.z - player.global_position.z)
		if remaining.length() > .046:
			return
	var target_yaw := heading(bundle.global_basis.z)
	face(player.actor, target_yaw, delta)
	player.step(delta, Vector2.ZERO, 0.0, false)
	if absf(angle_difference(player.actor.global_rotation.y, target_yaw)) > .02:
		return
	if not player.actor.request_action(PICKUP_CLIP):
		finish(false)
		return
	phase = Phase.PICKUP
	elapsed = 0.0
	stage_pickup_shot()


func stage_pickup_shot() -> void:
	var subject := (player.global_position + bundle.get_parent_node_3d().global_position) * .5 + Vector3.UP * 1.13
	var viewport_size := get_viewport().get_visible_rect().size
	var distance := 3.25 if viewport_size.x < viewport_size.y else 2.62
	# Look from the side of the table, clear of Jesse's mark in the lane.
	camera.stage_shot(subject, Vector3(-.98, .22, -.10), distance, player)


func step_pickup(delta: float) -> void:
	player.step(delta, Vector2.ZERO, 0.0, false)
	if player.actor.action != PICKUP_CLIP and not pickup_completed:
		finish(false)
		return
	stage_pickup_shot()
	var wrist: Transform3D = player.actor.right_hand_transform()
	if elapsed >= CONTACT and not attached:
		wrist_offset = wrist.affine_inverse() * bundle.global_transform
		attached = true
		contact_count += 1
	if not attached:
		return
	if elapsed < STOW_START:
		bundle.global_transform = wrist * wrist_offset
	else:
		if not stowing:
			stow_from = bundle.global_transform
			stowing = true
		var weight := smoothstep(STOW_START, STOW_END, elapsed)
		var satchel: Vector3 = player.actor.to_global(Vector3(.17, 1.044, .104))
		bundle.global_position = stow_from.origin.lerp(satchel, weight)
		bundle.global_basis = stow_from.basis.scaled(Vector3.ONE * lerpf(1.0, .12, weight))
		if elapsed >= STOW_END:
			bundle.hide()
	if pickup_completed:
		finish(elapsed >= STOW_END)


func _action_finished(clip: StringName) -> void:
	if phase == Phase.PICKUP and clip == PICKUP_CLIP:
		pickup_completed = true


func skip() -> void:
	if phase == Phase.TALK:
		finish(true)


func finish(completed: bool) -> void:
	if not active():
		return
	if phase != Phase.TALK and not completed:
		restore_bundle()
	release()
	finished.emit(completed)


func reset() -> void:
	release()
	restore_bundle()
	elapsed = 0.0
	contact_count = 0
	jesse.rotation.y = 0.0


func release() -> void:
	phase = Phase.IDLE
	line = ""
	player.actor.cancel_action()
	player.actor.set_listening(false)
	jesse.play("Idle")
	camera.release_stage()


func restore_bundle() -> void:
	bundle.transform = bundle_home
	bundle.show()
	attached = false
	stowing = false


func evidence() -> Dictionary:
	var position := bundle.global_position
	return {"phase": ["idle", "talk", "approach", "pickup"][phase], "seconds": elapsed,
		"line": line, "shot": shot if phase == Phase.TALK else "", "contact_count": contact_count, "attached": attached, "stowing": stowing,
		"bundle_visible": bundle.visible, "bundle": [position.x, position.y, position.z]}
