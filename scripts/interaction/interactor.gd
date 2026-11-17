extends Node

signal interaction_requested(target: Node3D)

const TARGET = preload("res://scripts/interaction/interactable.gd")
@export_flags_3d_physics var obstruction_mask := 1
@export var origin_offset := Vector3(0, 1, 0)
@export_range(0.05, 1.0, 0.05) var debounce_seconds := 0.25
var actor: CharacterBody3D
var targets: Array[Node3D] = []
var selected: Node3D
var active := false
var cooldown_remaining := 0.0
var request_count := 0

func configure(player: CharacterBody3D, candidates: Array) -> bool:
	actor = player
	targets.clear()
	selected = null
	var ids := {}
	for candidate in candidates:
		if not is_instance_valid(candidate) or not candidate is TARGET:
			continue
		if candidate.interaction_id.is_empty() or ids.has(candidate.interaction_id):
			targets.clear()
			return false
		ids[candidate.interaction_id] = true
		targets.append(candidate)
	return is_instance_valid(actor)

func step(delta: float) -> void:
	cooldown_remaining = maxf(0.0, cooldown_remaining - delta)
	refresh()

func suspend() -> void:
	active = false
	selected = null

func refresh() -> Node3D:
	selected = null
	if not active or not is_instance_valid(actor) or not actor.is_inside_tree() or actor.is_queued_for_deletion():
		return null
	var best_distance := INF
	for candidate in targets:
		if not is_instance_valid(candidate) or not _eligible(candidate):
			continue
		var distance := actor.global_position.distance_squared_to(candidate.global_position)
		if distance < best_distance or (is_equal_approx(distance, best_distance) and candidate.interaction_id < selected.interaction_id):
			selected = candidate
			best_distance = distance
	return selected

func _eligible(candidate: Node3D) -> bool:
	if not is_instance_valid(candidate) or not candidate.is_available():
		return false
	if candidate.get_world_3d() != actor.get_world_3d():
		return false
	if actor.global_position.distance_squared_to(candidate.global_position) > candidate.interaction_range * candidate.interaction_range:
		return false
	var origin := actor.to_global(origin_offset)
	var destination: Vector3 = candidate.focus_position()
	if origin.is_equal_approx(destination):
		return true
	var query := PhysicsRayQueryParameters3D.create(origin, destination, obstruction_mask, [actor.get_rid()])
	query.hit_from_inside = true
	var hit := actor.get_world_3d().direct_space_state.intersect_ray(query)
	return hit.is_empty() or hit.collider == candidate.own_collider()

func attempt() -> bool:
	# Never trust the previous frame's prompt: availability, position or walls may change.
	var candidate := refresh()
	if candidate == null or cooldown_remaining > 0 or not candidate.begin_interaction():
		return false
	cooldown_remaining = debounce_seconds
	request_count += 1
	selected = null
	interaction_requested.emit(candidate)
	return true

func reset_interactions() -> void:
	for candidate in targets:
		if is_instance_valid(candidate):
			candidate.reset_interaction()
	cooldown_remaining = 0.0
	request_count = 0
	selected = null

func evidence() -> Dictionary:
	var values := {}
	for candidate in targets:
		if is_instance_valid(candidate):
			values[candidate.interaction_id] = {"enabled": candidate.enabled, "busy": candidate.busy, "consumed": candidate.consumed, "completions": candidate.completion_count}
	return {"active": active, "requests": request_count, "targets": values}
