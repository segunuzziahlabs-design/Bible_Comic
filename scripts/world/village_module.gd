@tool
extends Node3D

const MESH = preload("res://scripts/world/village_mesh.gd")
const STONE := Color("a58f73")
const WOOD := Color("675040")
const FOUNDATION := [Color("8e7b62"), Color("b09b7d"), Color("9e896c"), Color("a6947c")]
@export_enum("House", "Well", "Olive", "Stall", "Wall", "Storage hut") var kind := 0
@export var dimensions := Vector3(5, 3, 4)
@export var plaster := Color("b9a586")

func _ready() -> void:
	if has_node("Generated"):
		return
	var generated := Node3D.new()
	generated.name = "Generated"
	add_child(generated)
	var mesh = MESH.new()
	match kind:
		0: _house(mesh, generated)
		1: _well(mesh, generated)
		2: _olive(mesh, generated)
		3: _stall(mesh, generated)
		4: _wall(mesh, generated)
		5: _storage_hut(mesh, generated)
	mesh.finish(generated)

func _house(mesh, parent: Node3D) -> void:
	var w := dimensions.x
	var h := dimensions.y
	var d := dimensions.z
	mesh.box(Vector3(0, h / 2, 0), dimensions, plaster)
	mesh.collider(parent, Vector3(0, h / 2, 0), dimensions)
	mesh.box(Vector3(0, .22, 0), Vector3(w + .06, .44, d + .06), STONE.darkened(.14))
	# Exposed courses interrupt the eroded plaster near the foot of the facade.
	for row in 4:
		for column in range(-4, 5):
			if posmod(column * 3 + row * 2, 7) > 3:
				continue
			var x := (column + .26 * (row % 2)) * w / 9.4
			var y := .52 + row * .22
			var z := d * .5 + .004
			var half_width := w * .050
			var tint := plaster.darkened(.08 + .03 * sin(float(column + row)))
			mesh.patch(PackedVector3Array([Vector3(x - half_width, y + .086, z),
				Vector3(x + half_width, y + .073, z), Vector3(x + half_width * .88, y - .082, z),
				Vector3(x - half_width * .93, y - .088, z)]), Vector3.BACK, tint)
	for row in 2:
		for column in range(-4, 5):
			var x: float = (column + .32 * row) * w / 9.3
			var colour: Color = FOUNDATION[posmod(column + row * 3, FOUNDATION.size())]
			mesh.box(Vector3(x, .105 + .197 * row, d / 2 + .056),
				Vector3(w * (.100 + .004 * sin(float(column * 3 + row))), .168 + .025 * cos(float(column * 2)), .12),
				colour, Vector3(0, 0, .06 * sin(float(column + row))))
	for side in [-1, 1]:
		for i in 6:
			var colour: Color = FOUNDATION[(i + (1 if side < 0 else 0)) % FOUNDATION.size()]
			mesh.box(Vector3(side * (w / 2 + .035), .20 + .024 * sin(float(i)), (i - 2.5) * d / 6),
				Vector3(.09, .30 + .04 * cos(float(i)), d * .145), colour)
		mesh.box(Vector3(side * w * .265, .62, d / 2 + .006), Vector3(.70, .17, .012), plaster.darkened(.085), Vector3(0, 0, side * .08))
		mesh.box(Vector3(side * w * .405, 2.52, d / 2 + .006), Vector3(.51, .12, .012), plaster.lightened(.075), Vector3(0, 0, side * .11))
	mesh.box(Vector3(0, h + .08, 0), Vector3(w + .32, .16, d + .32), plaster.lightened(.12))
	mesh.collider(parent, Vector3(0, h + .08, 0), Vector3(w + .32, .16, d + .32))
	mesh.box(Vector3(0, h + .2, -d / 2), Vector3(w, .35, .18), STONE)
	for side in [-1, 1]:
		mesh.box(Vector3(side * w / 2, h + .2, 0), Vector3(.18, .35, d), STONE)
		mesh.collider(parent, Vector3(side * w / 2, h + .2, 0), Vector3(.18, .35, d))
	mesh.box(Vector3(0, .95, d / 2 + .017), Vector3(1.05, 1.9, .044), WOOD.darkened(.44))
	for i in 6:
		var tint := WOOD.darkened(.10 + .10 * float(i % 3))
		mesh.box(Vector3((i - 2.5) * .168, .97, d / 2 + .047), Vector3(.158, 1.85, .022), tint)
	mesh.box(Vector3(0, 1.48, d / 2 + .064), Vector3(1.06, .093, .038), WOOD)
	for side in [-1, 1]:
		mesh.box(Vector3(side * .62, 1.02, d / 2 + .06), Vector3(.19, 2.04, .16), STONE)
	mesh.box(Vector3(0, 2.07, d / 2 + .08), Vector3(1.43, .23, .2), WOOD)
	for side in [-1, 1]:
		var window_x: float = side * w * .33
		mesh.box(Vector3(window_x, 1.8, d / 2 + .025), Vector3(.46, .61, .045), Color("433a2e"))
		mesh.box(Vector3(window_x, 2.14, d / 2 + .054), Vector3(.66, .11, .13), WOOD)
		for slat in [-1, 1]:
			mesh.box(Vector3(window_x + slat * .092, 1.8, d / 2 + .063), Vector3(.043, .59, .055), WOOD)
		mesh.box(Vector3(window_x, 1.45, d / 2 + .095), Vector3(.65, .10, .21), STONE.lightened(.10))
	for x in [-w * .4, -w * .2, 0, w * .2, w * .4]:
		mesh.box(Vector3(x, h - .12, d / 2 + .15), Vector3(.13, .15, .5), WOOD)
	# Pots are set against the facade; collision keeps the walkable apron honest.
	for side in [-1, 1]:
		var at := Vector3(side * w * .35, 0, d / 2 + .48)
		mesh.jar(at, .27, .65 if side < 0 else .52, Color("9f674d") if side < 0 else Color("b68161"))
		mesh.collider(parent, Vector3(at.x, .36, at.z), Vector3(.56, .72, .56))

func _well(mesh, parent: Node3D) -> void:
	mesh.cylinder(Vector3(0, .43, 0), 1.08, .86, STONE)
	mesh.cylinder(Vector3(0, .88, 0), 1.16, .16, plaster)
	mesh.cylinder(Vector3(0, .97, 0), .78, .025, Color("314b4e"))
	mesh.collider(parent, Vector3(0, .48, 0), Vector3(2.25, .96, 2.25))
	for side in [-1, 1]:
		mesh.box(Vector3(side * 1.05, 1.5, 0), Vector3(.18, 3, .18), WOOD)
		mesh.collider(parent, Vector3(side * 1.05, 1.5, 0), Vector3(.18, 3, .18))
	mesh.box(Vector3(0, 2.9, 0), Vector3(2.6, .2, .22), WOOD)
	mesh.box(Vector3(0, 3.06, 0), Vector3(2.8, .13, 2.2), Color("8f7850"))
	mesh.collider(parent, Vector3(0, 3.06, 0), Vector3(2.8, .13, 2.2))
	mesh.cylinder(Vector3(.1, 1.96, 0), .025, 1.8, Color("b39560"))
	mesh.cylinder(Vector3(.1, 1.1, 0), .2, .28, WOOD, .26)

func _olive(mesh, parent: Node3D) -> void:
	mesh.cylinder(Vector3(0, 1, 0), .18, 2.0, WOOD, .12)
	mesh.collider(parent, Vector3(0, 1, 0), Vector3(.38, 2, .38))
	mesh.cylinder(Vector3(.28, 1.65, 0), .1, .95, WOOD, .07, Vector3(0, 0, -.7))
	mesh.foliage(Vector3(0, 2.65, 0), Vector3(1.5, .85, 1.2), Color("69744d"))
	mesh.foliage(Vector3(.85, 2.25, .15), Vector3(.95, .6, .9), Color("7f8859"))
	mesh.foliage(Vector3(-.65, 2.4, -.3), Vector3(.95, .7, .9), Color("566545"))

func _stall(mesh, parent: Node3D) -> void:
	mesh.box(Vector3(0, .42, 0), Vector3(2.3, .84, .8), WOOD)
	mesh.box(Vector3(0, .88, 0), Vector3(2.5, .08, 1), Color("a98353"))
	mesh.collider(parent, Vector3(0, .46, 0), Vector3(2.5, .92, 1))
	for side in [-1, 1]:
		mesh.box(Vector3(side * 1.6, 1.3, -.5), Vector3(.13, 2.6, .13), WOOD)
		mesh.collider(parent, Vector3(side * 1.6, 1.3, -.5), Vector3(.13, 2.6, .13))
	mesh.box(Vector3(0, 2.54, .53), Vector3(3.62, .075, .083), WOOD)
	for panel in 3:
		var linen := Color("c7b389").darkened(.045 * float(panel % 2))
		var x := (panel - 1) * 1.19
		mesh.box(Vector3(x, 2.63, -.45), Vector3(1.192, .052, 2.10), linen)
		mesh.box(Vector3(x, 2.48, .57), Vector3(1.19, .24, .045), linen.darkened(.05),
			Vector3(0, 0, .017 * (panel - 1)))
		if panel > 0:
			mesh.box(Vector3(x - .59, 2.662, -.45), Vector3(.025, .016, 2.08), Color("9d8d6e"))
	mesh.collider(parent, Vector3(0, 2.63, -.45), Vector3(3.6, .06, 2.1))
	mesh.cylinder(Vector3(.67, .948, 0), .42, .066, Color("8f6a46"), .46)
	for x in [.5, .75, 1.0]:
		mesh.foliage(Vector3(x, 1.04, -.08), Vector3(.13, .065, .18), Color("af804d"))
	mesh.jar(Vector3(-.8, .92, -.16), .175, .32, Color("945d46"))

func _wall(mesh, parent: Node3D) -> void:
	mesh.box(Vector3(0, dimensions.y / 2, 0), dimensions, STONE)
	mesh.box(Vector3(0, dimensions.y + .07, 0), Vector3(dimensions.x + .1, .14, dimensions.z + .1), plaster)
	mesh.collider(parent, Vector3(0, (dimensions.y + .14) / 2, 0), Vector3(dimensions.x + .1, dimensions.y + .14, dimensions.z + .1))
	var count := maxi(1, int(dimensions.x / 1.1))
	for i in count:
		var x := -dimensions.x / 2 + (i + .5) * dimensions.x / count
		mesh.box(Vector3(x, dimensions.y * .55, dimensions.z / 2 + .012), Vector3(.018, dimensions.y * .75, .025), STONE.darkened(.14))


func _storage_hut(mesh, parent: Node3D) -> void:
	var w := dimensions.x
	var h := dimensions.y
	var d := dimensions.z
	mesh.box(Vector3(0, h * .5, 0), dimensions, plaster)
	mesh.collider(parent, Vector3(0, h * .5, 0), dimensions)
	mesh.box(Vector3(0, .18, 0), Vector3(w + .08, .36, d + .10), STONE.darkened(.10))
	for i in 6:
		var tint: Color = FOUNDATION[i % FOUNDATION.size()]
		mesh.box(Vector3((i - 2.5) * w / 6.0, .18, d * .5 + .05), Vector3(w / 6.1, .32 + .04 * sin(i), .12), tint)
	mesh.box(Vector3(.20, .70, d * .5 + .014), Vector3(.65, 1.40, .03), WOOD.darkened(.50))
	mesh.box(Vector3(.20, 1.45, d * .5 + .07), Vector3(.92, .16, .23), WOOD)
	mesh.box(Vector3(0, h, 0), Vector3(w + .30, .18, d + .37), Color("a0865e"), Vector3(.12, 0, 0))
	for i in 9:
		var x := (i - 4) * (w + .15) / 9.0
		var tint := Color("b1996a").darkened(.044 * (i % 4))
		mesh.box(Vector3(x, h + .102, 0), Vector3(w / 10.5, .043, d + .41), tint, Vector3(.12, 0, 0))
	mesh.box(Vector3(-.66, .13, d * .5 + .27), Vector3(.36, .24, .32), Color("966a4d"))
