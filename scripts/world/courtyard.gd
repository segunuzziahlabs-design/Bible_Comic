@tool
extends Node3D

func interaction_targets() -> Array:
	return $Anchors.get_children()

const GATE = preload("res://assets/proof/courtyard-gate.glb")
var materials: Dictionary = {}

func _ready() -> void:
	_build_world()

func spawn_position() -> Vector3:
	return $Anchors/DavidSpawn.global_position

func target_position(id: String) -> Vector3:
	match id:
		"jesse": return $Anchors/Jesse.global_position
		"provisions": return $Anchors/Provisions.global_position
		"gate": return $Anchors/Gate.global_position
	return spawn_position()

func show_provisions(visible_value: bool) -> void:
	$Anchors/Provisions/Bundle.visible = visible_value

func mat(key: String, colour: Color) -> StandardMaterial3D:
	if materials.has(key):
		return materials[key]
	var result := StandardMaterial3D.new()
	result.albedo_color = colour
	result.roughness = 0.95
	materials[key] = result
	return result

func mesh_at(mesh: Mesh, position_value: Vector3, material: Material, parent: Node3D = null) -> MeshInstance3D:
	var instance := MeshInstance3D.new()
	instance.mesh = mesh
	instance.material_override = material
	(parent if parent else self).add_child(instance)
	instance.position = position_value
	return instance

func box(position_value: Vector3, dimensions: Vector3, material: Material, solid := false) -> void:
	var mesh := BoxMesh.new()
	mesh.size = dimensions
	mesh_at(mesh, position_value, material)
	if solid:
		collision_box(position_value, dimensions)

func collision_box(position_value: Vector3, dimensions: Vector3) -> void:
	var body := StaticBody3D.new()
	var shape := CollisionShape3D.new()
	var bounds := BoxShape3D.new()
	bounds.size = dimensions
	shape.shape = bounds
	body.add_child(shape)
	add_child(body)
	body.position = position_value

func cylinder(position_value: Vector3, radius: float, height: float, material: Material, parent: Node3D = null) -> MeshInstance3D:
	var mesh := CylinderMesh.new()
	mesh.top_radius = radius
	mesh.bottom_radius = radius
	mesh.height = height
	mesh.radial_segments = 10
	mesh.rings = 1
	return mesh_at(mesh, position_value, material, parent)

func foliage(position_value: Vector3, scale_value: Vector3, material: Material) -> void:
	var mesh := SphereMesh.new()
	mesh.radius = 1
	mesh.height = 2
	mesh.radial_segments = 10
	mesh.rings = 4
	mesh_at(mesh, position_value, material).scale = scale_value

func _build_world() -> void:
	var environment := WorldEnvironment.new()
	var settings := Environment.new()
	settings.background_mode = Environment.BG_COLOR
	settings.background_color = Color("a5c2c0")
	settings.ambient_light_source = Environment.AMBIENT_SOURCE_COLOR
	settings.ambient_light_color = Color("cbd4c4")
	settings.ambient_light_energy = 0.65
	settings.tonemap_mode = Environment.TONE_MAPPER_FILMIC
	environment.environment = settings
	add_child(environment)
	var sun := DirectionalLight3D.new()
	sun.rotation_degrees = Vector3(-48, -28, 0)
	sun.light_color = Color("ffe4b4")
	sun.light_energy = 1.5
	sun.shadow_enabled = false
	add_child(sun)
	var sand := mat("sand", Color("bbaa7e"))
	var stone := mat("stone", Color("c7b28b"))
	var cap := mat("cap", Color("ded1af"))
	var clay := mat("clay", Color("956948"))
	var wood := mat("wood", Color("715136"))
	var olive := mat("olive", Color("6f7950"))
	box(Vector3(0, -0.28, 0), Vector3(40, 0.5, 40), sand, true)
	box(Vector3(-8.6, 0.7, 0), Vector3(0.55, 1.4, 19), stone, true)
	box(Vector3(8.6, 0.7, 0), Vector3(0.55, 1.4, 19), stone, true)
	box(Vector3(0, 0.7, 9.5), Vector3(17.7, 1.4, 0.5), stone, true)
	for side in [-1, 1]:
		box(Vector3(side * 5.6, 0.8, -8), Vector3(7.1, 1.6, 0.6), stone, true)
		box(Vector3(side * 8.6, 1.45, 0), Vector3(0.72, 0.16, 19.1), cap, true)
		collision_box(Vector3(side * 1.42, 1.15, -8), Vector3(0.95, 2.3, 0.85))
	# Invisible boundary beyond the gate keeps this small proof self-contained.
	collision_box(Vector3(0, 1, -9.5), Vector3(18, 2, 0.4))
	var gate := GATE.instantiate()
	add_child(gate)
	gate.position = Vector3(0, 0, -8)
	box(Vector3(-5.75, 1.3, 1), Vector3(4.6, 2.6, 4.0), stone, true)
	box(Vector3(-5.75, 2.66, 1), Vector3(4.9, 0.18, 4.3), cap, true)
	box(Vector3(-5.4, 0.85, 3.02), Vector3(1.0, 1.7, 0.06), wood)
	box(Vector3(-6.9, 1.7, 3.03), Vector3(0.55, 0.6, 0.08), mat("window", Color("444a3a")))
	box(Vector3(-5.4, 0.10, 3.4), Vector3(1.5, 0.2, 0.6), cap, true)
	box(Vector3(4.0, 0.45, -0.7), Vector3(2.1, 0.9, 0.8), wood, true)
	for i in range(8):
		box(Vector3(0, 0.012, 6 - i * 1.7), Vector3(2.5, 0.025, 1.2), mat("path", Color("c4b58d")))
	for location in [Vector3(6,0,5), Vector3(-6,0,-5), Vector3(6.5,0,-5.5)]:
		cylinder(location + Vector3(0, 0.9, 0), 0.16, 1.8, wood)
		collision_box(location + Vector3(0, .8, 0), Vector3(.35, 1.6, .35))
		foliage(location + Vector3(0, 2.4, 0), Vector3(1.25, 0.95, 1.1), olive)
		foliage(location + Vector3(.75, 2.1, .15), Vector3(.8, .65, .8), olive)
	for x in [-18, -10, 9, 18]:
		foliage(Vector3(x, 0, -22), Vector3(9, 4 + absf(x) * .08, 7), mat("hills", Color("8a9779")))
	for x in [-7, -6.2]:
		cylinder(Vector3(x, .36, 4), .30, .72, clay)
		cylinder(Vector3(x, .77, 4), .17, .15, clay)
