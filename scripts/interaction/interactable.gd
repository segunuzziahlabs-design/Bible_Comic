extends Node3D

@export var interaction_id := ""
@export var event_id := ""
@export var prompt := "Interact"
@export_range(0.1, 10.0, 0.1) var interaction_range := 2.0
@export var focus_offset := Vector3(0, 1, 0)
@export var own_collider_path: NodePath
@export var enabled := true
@export var one_shot := true
var busy := false
var consumed := false
var completion_count := 0

func is_available() -> bool:
	return is_inside_tree() and not is_queued_for_deletion() and is_visible_in_tree() and enabled and not busy and not consumed and not interaction_id.is_empty()

func focus_position() -> Vector3:
	return to_global(focus_offset)

func own_collider() -> CollisionObject3D:
	return get_node_or_null(own_collider_path) as CollisionObject3D if not own_collider_path.is_empty() else null

func begin_interaction() -> bool:
	if not is_available():
		return false
	# Reserve before emitting a request so synchronous/reentrant handlers cannot repeat it.
	busy = true
	return true

func finish_interaction(accepted: bool) -> bool:
	if not busy:
		return false
	busy = false
	if accepted:
		completion_count += 1
		consumed = one_shot
	return true

func reset_interaction() -> void:
	busy = false
	consumed = false
	completion_count = 0
