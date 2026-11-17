extends Node3D

@export var palette: Material
@export var authored_clips: Dictionary
var animation_player: AnimationPlayer
var skeleton: Skeleton3D
var clips: Dictionary = {}

func _ready() -> void:
	var model := $Model
	for node in model.find_children("*", "AnimationPlayer", true, false):
		animation_player = node
	for node in model.find_children("*", "Skeleton3D", true, false):
		skeleton = node
	if palette:
		for mesh in model.find_children("*", "MeshInstance3D", true, false):
			mesh.material_override = palette
	if not authored_clips.is_empty():
		clips = authored_clips
		animation_player.get_animation(clips["Idle"]).loop_mode = Animation.LOOP_LINEAR
	elif animation_player:
		for name in animation_player.get_animation_list():
			for key in ["Idle", "Walk", "Wave"]:
				if String(name).ends_with(key):
					clips[key] = name
					animation_player.get_animation(name).loop_mode = Animation.LOOP_LINEAR
	play("Idle")

func play(clip: String) -> void:
	if animation_player and clips.has(clip) and animation_player.current_animation != clips[clip]:
		animation_player.play(clips[clip], 0.16)

func animation_evidence() -> Dictionary:
	if not animation_player or not skeleton:
		return {"ready": false}
	var bone := skeleton.find_bone("chest")
	return {"ready": true, "clip": animation_player.current_animation,
		"time": animation_player.current_animation_position, "bones": skeleton.get_bone_count(),
		"chest_rotation": str(skeleton.get_bone_pose_rotation(bone)) if bone >= 0 else "missing"}
