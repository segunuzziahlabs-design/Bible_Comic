extends Node3D

const DISTANCE := 5.5
const MIN_PITCH := 0.15
const MAX_PITCH := 0.85
const CLEARANCE := 0.22
const FOCUS_HEIGHT := 1.15
@onready var camera: Camera3D = $Camera
var yaw := 0.0
var pitch := 0.4
var boom_length := DISTANCE
var obstructed := false
var origin_overlapped := false
var focus := Vector3.ZERO
var snap_pending := true
var stage_requested := false
var stage_mix := 0.0
var stage_focus: Vector3
var stage_direction: Vector3
var stage_distance := DISTANCE
var probe := SphereShape3D.new()
var query := PhysicsShapeQueryParameters3D.new()

func _ready() -> void:
	probe.radius = CLEARANCE
	query.shape = probe
	query.collision_mask = 1
	query.collide_with_areas = false
	query.margin = 0.01

func apply_look(delta: Vector2) -> void:
	yaw = wrapf(yaw - delta.x * 0.005, -PI, PI)
	pitch = clampf(pitch + delta.y * 0.004, MIN_PITCH, MAX_PITCH)

func set_viewport_size(view: Vector2) -> void:
	camera.fov = 68.0 if view.x < view.y else 58.0

func reset() -> void:
	yaw = 0.0
	pitch = 0.4
	boom_length = DISTANCE
	snap_pending = true
	stage_requested = false
	stage_mix = 0.0

func stage_shot(subject: Vector3, direction: Vector3, distance: float, player: CharacterBody3D, cut := false) -> void:
	stage_requested = true
	if cut and stage_mix >= 1.0:
		snap_pending = true
	stage_focus = subject
	stage_direction = direction.normalized()
	stage_distance = distance
	if clearance(subject, stage_direction, distance, player) < distance * .7:
		var alternate := Vector3(-direction.x, direction.y, -direction.z).normalized()
		if clearance(subject, alternate, distance, player) > clearance(subject, stage_direction, distance, player):
			stage_direction = alternate

func release_stage() -> void:
	stage_requested = false

func step(delta: float, player: CharacterBody3D) -> void:
	focus = player.global_position + Vector3.UP * FOCUS_HEIGHT
	var direction := Vector3(sin(yaw) * cos(pitch), sin(pitch), cos(yaw) * cos(pitch))
	stage_mix = move_toward(stage_mix, 1.0 if stage_requested else 0.0, delta / .65)
	var distance := DISTANCE
	if stage_mix > 0.0:
		var weight := smoothstep(0.0, 1.0, stage_mix)
		focus = focus.lerp(stage_focus, weight)
		direction = direction.slerp(stage_direction, weight).normalized()
		distance = lerpf(DISTANCE, stage_distance, weight)
	var safe_length := clearance(focus, direction, distance, player)
	obstructed = safe_length < distance - 0.01
	# Retract before rendering; easing a world position can cross a corner or wall.
	if snap_pending or safe_length < boom_length:
		boom_length = safe_length
	else:
		boom_length = lerpf(boom_length, safe_length, 1.0 - exp(-8.0 * delta))
	snap_pending = false
	camera.global_position = focus + direction * boom_length
	# A fixed direction remains valid even when an overlap collapses the boom to zero.
	camera.look_at(camera.global_position - direction)
	player.actor.visible = boom_length >= 0.65

func clearance(subject: Vector3, direction: Vector3, distance: float, player: CharacterBody3D) -> float:
	query.transform = Transform3D(Basis.IDENTITY, subject)
	query.exclude = [player.get_rid()]
	query.motion = Vector3.ZERO
	var space := get_world_3d().direct_space_state
	# A motion cast ignores initial overlap; never cast through a wall from inside it.
	origin_overlapped = not space.intersect_shape(query, 1).is_empty()
	if origin_overlapped:
		return 0.0
	query.motion = direction * distance
	var fractions := space.cast_motion(query)
	return maxf(0.0, distance * fractions[0] - 0.03) if fractions[0] < 1.0 else distance

func evidence() -> Dictionary:
	return {"pitch": pitch, "distance": boom_length, "obstructed": obstructed,
		"origin_overlapped": origin_overlapped, "fov": camera.fov, "stage_mix": stage_mix,
		"position": [camera.global_position.x, camera.global_position.y, camera.global_position.z]}
