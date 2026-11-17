@tool
extends Node3D

const MESH = preload("res://scripts/world/village_mesh.gd")
var geometry_metrics := {}

func _ready() -> void:
	if has_node("GroundAndLandscape"):
		return
	var generated := Node3D.new()
	generated.name = "GroundAndLandscape"
	add_child(generated)
	var mesh = MESH.new()
	mesh.box(Vector3(0, -.18, -3), Vector3(65, .36, 75), Color("a99a7b"))
	mesh.collider(generated, Vector3(0, -.18, -3), Vector3(65, .36, 75))
	# Worn earth lanes keep the route legible through the square and to the stall.
	mesh.box(Vector3(0, .012, -3), Vector3(3.5, .024, 24), Color("c3ad88"))
	mesh.box(Vector3(-3, .014, -4.2), Vector3(7.5, .028, 3), Color("bba783"))
	mesh.box(Vector3(-5, .014, -7.4), Vector3(3, .028, 6), Color("bba783"))
	mesh.box(Vector3(-2.5, .014, -10), Vector3(7.5, .028, 2.4), Color("bba783"))
	mesh.box(Vector3(3, .014, .6), Vector3(4, .028, 2.2), Color("beaa85"))
	# Subtle worn-earth variation shares the terrain surface and adds no colliders.
	for i in 72:
		var x := fposmod(i * 3.723, 23.2) - 11.6
		var z := fposmod(i * 1.913, 22.5) - 14.3
		var on_lane := absf(x) < 1.78
		var tint := Color("c3ad88") if on_lane else Color("a99a7b")
		if z > -11.3 and z < -2.7 and x > -6.4 and x < -1.78:
			tint = Color("bba783")
		if z > -.54 and z < 1.74 and x > 1.0 and x < 5.0:
			tint = Color("beaa85")
		tint = tint.lightened(.025) if i % 3 == 0 else tint.darkened(.028)
		var width := .17 + .24 * absf(sin(i * 1.51))
		var depth := .08 + .20 * absf(cos(i * 1.81))
		mesh.patch(PackedVector3Array([Vector3(x - width, .031, z), Vector3(x - width * .3, .031, z - depth),
			Vector3(x + width, .031, z - depth * .37), Vector3(x + width * .48, .031, z + depth),
			Vector3(x - width * .54, .031, z + depth * .54)]), Vector3.UP, tint)
	for side in [-1, 1]:
		for i in 14:
			var offset := float(i * side)
			var z := 6.8 - i * 1.52 + .24 * sin(offset * 2.2)
			var x: float = side * (1.48 + .12 * cos(offset * 1.6))
			var size := Vector3(.23 + .045 * sin(offset), .036, .31 + .15 * cos(offset * 1.4))
			var stone := Color("a29073").lightened(.055 * float(i % 3))
			mesh.box(Vector3(x, .033, z), size, stone, Vector3(0, .28 * sin(offset), 0))
			if i % 4 == 1:
				mesh.box(Vector3(x + side * .27, .023, z + .21), Vector3(.13, .028, .17), stone.darkened(.08))
	# Small beds and planted margins distinguish paths from optional exploration.
	for at in [Vector3(10, .04, -3), Vector3(-11, .04, -2)]:
		mesh.box(at, Vector3(3.6, .08, 3.5), Color("92825a"))
		for row in 4:
			for col in 4:
				mesh.foliage(at + Vector3(-1.2 + col * .8, .12, -1.1 + row * .7), Vector3(.15, .16, .18), Color("727b49"))
	for at in [Vector3(-5.5, .015, 5.5), Vector3(9.5, .015, 6), Vector3(6, .015, -4.5), Vector3(-10.5, .015, -4)]:
		mesh.cylinder(at, 1.4, .025, Color("9a936b"))
	# Distant silhouettes are scenery outside the closed playable boundary.
	for i in 7:
		mesh.foliage(Vector3(-28 + i * 9, -.4, -32 - (i % 2) * 4), Vector3(9, 3 + (i % 3), 6), Color("8e997a"))
	# Low stones join the gateway's existing masonry to the earth at its flanks.
	for side in [-1, 1]:
		mesh.box(Vector3(side * 1.58, .11, -14.55), Vector3(.87, .22, .31), Color("a79373"))
		mesh.box(Vector3(side * 2.10, .145, -14.70), Vector3(.55, .29, .46), Color("978365"), Vector3(0, side * .10, 0))
	mesh.finish(generated, "TerrainBatch")
	# Explicit collision for the imported gateway pillars and arch.
	for side in [-1, 1]:
		mesh.collider(generated, Vector3(side * 1.42, 1.15, -15), Vector3(.95, 2.3, .85))
	mesh.collider(generated, Vector3(0, 2.5, -15), Vector3(2, .7, .85))
	geometry_metrics = _measure_geometry()

func spawn_position() -> Vector3:
	return $Anchors/DavidSpawn.global_position

func target_position(id: String) -> Vector3:
	match id:
		"jesse": return $Anchors/Jesse.global_position
		"provisions": return $Anchors/Provisions.global_position
		"gate": return $Anchors/Gate.global_position
	return spawn_position()

func show_provisions(value: bool) -> void:
	provisions_bundle().visible = value

func provisions_bundle() -> Node3D:
	return $Anchors/Provisions/Table/Parcel

func interaction_targets() -> Array:
	return $Anchors.get_children()

func _measure_geometry() -> Dictionary:
	var surfaces := 0
	var triangles := 0
	var instances := find_children("*", "MeshInstance3D", true, false)
	for instance in instances:
		var mesh: Mesh = instance.mesh
		for surface in mesh.get_surface_count():
			surfaces += 1
			var arrays := mesh.surface_get_arrays(surface)
			triangles += (arrays[Mesh.ARRAY_INDEX].size() if arrays[Mesh.ARRAY_INDEX] != null else arrays[Mesh.ARRAY_VERTEX].size()) / 3
	return {"mesh_instances": instances.size(), "surfaces": surfaces, "triangles": triangles}
