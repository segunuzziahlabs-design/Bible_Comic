extends MeshInstance3D

@export var subject: Node3D
@onready var ground_y := get_parent_node_3d().global_position.y + .057


func _ready() -> void:
	_physics_process(0.0)


func _physics_process(_delta: float) -> void:
	var feet := subject.global_position
	global_position = Vector3(feet.x, ground_y, feet.z)
	visible = subject.is_visible_in_tree() and absf(feet.y - ground_y) < .32
