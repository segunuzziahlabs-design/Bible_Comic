extends Node3D

const MESH = preload("res://scripts/world/village_mesh.gd")
const WORKER = preload("res://scenes/characters/mattan_visual.tscn")
const SHADOW = preload("res://scenes/world/village/contact_shadow.tscn")
const WOOD := Color("685140")
const REED := Color("aa8a57")
const STONE := Color("9b876d")
const WORK_MARK := Vector3(.46, 0, -.73)
const WORK_PERIOD := 9.6

var worker: Node3D
var flock: Array[Dictionary] = []
var elapsed := 0.0


func _ready() -> void:
	var yard := MESH.new()
	_build_shelter(yard)
	_build_pen(yard)
	yard.finish(self, "YardDetails")
	worker = WORKER.instantiate()
	add_child(worker)
	worker.position = WORK_MARK
	worker.scale = Vector3(.91, .95, .91)
	worker.animation_player.callback_mode_process = AnimationMixer.ANIMATION_CALLBACK_MODE_PROCESS_MANUAL
	worker.animation_player.get_animation(&"walk_forward").loop_mode = Animation.LOOP_LINEAR
	_add_shadow(worker, Vector3(.71, 1, .71))
	_add_goat(Vector3(.45, 0, 1.47), Color("c6b894"), Color("7d6b52"))
	_add_goat(Vector3(-.58, 0, 2.10), Color("957254"), Color("59483b"))
	reset()


func _build_shelter(mesh) -> void:
	# A low work shelter against the family house. The open face looks onto the lane.
	for z in [-1.9, .20]:
		mesh.cylinder(Vector3(-.40, .94, z), .064, 1.88, WOOD, .047, Vector3(0, 0, .025))
		mesh.cylinder(Vector3(.98, 1.15, z), .069, 2.30, WOOD, .049, Vector3(0, 0, -.035))
		mesh.box(Vector3(.27, 2.14, z), Vector3(1.60, .095, .095), WOOD, Vector3(0, 0, .23))
	mesh.box(Vector3(.98, 2.27, -.85), Vector3(.13, .12, 2.35), WOOD)
	mesh.box(Vector3(.27, 2.20, -.85), Vector3(1.62, .11, 2.38), REED, Vector3(0, 0, .23))
	for i in 18:
		var z := -1.96 + i * .131
		var tint := REED.lightened(.032 * float(i % 4)).darkened(.047 * float(i % 3))
		mesh.box(Vector3(.27, 2.262, z), Vector3(1.64 + .07 * sin(i * 2.4), .038, .107), tint, Vector3(0, 0, .23))
	# Rough storage bench, clay and woven storage around the shaded work mark.
	mesh.box(Vector3(-.02, .40, -.87), Vector3(.47, .09, 1.30), WOOD.lightened(.15))
	for z in [-1.37, -.37]:
		mesh.box(Vector3(-.02, .19, z), Vector3(.35, .38, .12), WOOD)
	mesh.jar(Vector3(-.23, 0, -1.72), .25, .61, Color("a46c52"))
	mesh.jar(Vector3(.20, 0, -1.80), .19, .49, Color("ba8763"))
	mesh.cylinder(Vector3(-.02, .47, -.56), .20, .10, Color("a98859"), .24)
	mesh.cylinder(Vector3(-.02, .53, -.56), .16, .028, Color("d2b681"), .19)
	mesh.box(Vector3(.25, .085, .13), Vector3(.52, .17, .39), Color("a48a5b"), Vector3(0, -.2, 0))
	for i in 7:
		var z := -.95 + i * .19
		mesh.box(Vector3(-.33, .14, z), Vector3(.21, .22 + .06 * sin(i * 1.8), .18), STONE.darkened(.045 * (i % 3)))


func _build_pen(mesh) -> void:
	# Stone footings and irregular timber poles keep the corral distinct from the lane.
	for i in 9:
		var z := .65 + i * .25
		mesh.box(Vector3(-1.0, .15, z), Vector3(.28, .24 + .09 * sin(i * 2.1), .25),
			STONE.lightened(.045 * (i % 3)), Vector3(0, .15 * sin(i * 2.0), .09))
	for z in [.61, 2.91]:
		for x in [-.98, -.02, 1.06]:
			mesh.cylinder(Vector3(x, .39, z), .052, .78, WOOD, .034)
		mesh.box(Vector3(.03, .43, z), Vector3(2.16, .092, .066), WOOD, Vector3(0, 0, .03))
		mesh.box(Vector3(.02, .66, z), Vector3(2.12, .078, .060), WOOD.lightened(.12), Vector3(0, 0, -.04))
	mesh.box(Vector3(-.97, .60, 1.77), Vector3(.08, .081, 2.36), WOOD)
	mesh.box(Vector3(.02, .17, 2.62), Vector3(.84, .16, .24), WOOD)
	mesh.box(Vector3(.02, .257, 2.62), Vector3(.73, .025, .16), Color("b8a478"))


func _add_goat(at: Vector3, coat: Color, trim: Color) -> void:
	var goat := Node3D.new()
	add_child(goat)
	var body := MESH.new()
	body.foliage(Vector3(0, .49, -.08), Vector3(.19, .21, .40), coat)
	body.box(Vector3(0, .59, .23), Vector3(.19, .39, .22), coat, Vector3(-.52, 0, 0))
	body.box(Vector3(0, .64, -.49), Vector3(.095, .08, .23), trim, Vector3(.51, 0, 0))
	body.finish(goat)
	var head := Node3D.new()
	goat.add_child(head)
	head.position = Vector3(0, .73, .30)
	var face := MESH.new()
	face.foliage(Vector3(0, .025, .10), Vector3(.115, .123, .21), coat.lightened(.07))
	face.box(Vector3(0, -.02, .25), Vector3(.16, .091, .10), trim)
	face.box(Vector3(0, -.115, .19), Vector3(.055, .13, .055), trim, Vector3(.22, 0, 0))
	for side in [-1, 1]:
		face.box(Vector3(.13 * side, .065, .055), Vector3(.17, .044, .067), trim, Vector3(0, 0, .28 * side))
		face.cylinder(Vector3(.067 * side, .16, .00), .035, .23, Color("665b4a"), .008, Vector3(-.43, 0, -.19 * side))
		face.box(Vector3(.106 * side, .047, .143), Vector3(.022, .036, .035), Color("392e24"))
	face.finish(head)
	var legs: Array[Node3D] = []
	for pair in [-1, 1]:
		var stride := Node3D.new()
		goat.add_child(stride)
		stride.position.y = .40
		var leg_mesh := MESH.new()
		for side in [-1, 1]:
			var foot := Vector3(side * .119, -.19, side * pair * .25 - .075)
			leg_mesh.box(foot, Vector3(.071, .36, .073), trim)
			leg_mesh.box(foot + Vector3(0, -.171, .012), Vector3(.083, .062, .101), Color("4f4437"))
		leg_mesh.finish(stride)
		legs.append(stride)
	flock.append({"root": goat, "home": at, "head": head, "legs": legs})
	_add_shadow(goat, Vector3(.45, 1, .59))


func _add_shadow(subject: Node3D, size: Vector3) -> void:
	var shadow := SHADOW.instantiate()
	shadow.subject = subject
	add_child(shadow)
	shadow.scale = size


func advance(delta: float) -> void:
	elapsed += delta
	var cycle := fposmod(elapsed, WORK_PERIOD)
	var walk_out := cycle >= 3.0 and cycle < 4.4
	var walk_back := cycle >= 6.0 and cycle < 7.4
	var along := clampf((cycle - 3.0) / 1.4, 0.0, 1.0) - clampf((cycle - 6.0) / 1.4, 0.0, 1.0)
	worker.position = WORK_MARK + Vector3(0, 0, along * .94)
	var yaw := 0.0 if walk_out else PI if walk_back else -PI / 2.0
	worker.rotation.y = rotate_toward(worker.rotation.y, yaw, delta * 5.0)
	var clip := "Walk" if walk_out or walk_back else "Work" if cycle < 2.85 else "Idle"
	worker.play(clip)
	worker.animation_player.advance(delta * (.74 if clip == "Walk" else 1.0))
	for index in flock.size():
		var animal := flock[index]
		var time := elapsed + 2.8 * index
		var grazing := (1.0 + sin(time * .89)) * .5
		animal.root.position = animal.home + Vector3(.13 * sin(time * .54), 0, .25 * sin(time * .52))
		animal.root.rotation.y = -.32 - index * 1.16 + .27 * sin(time * .53)
		animal.head.rotation.x = lerpf(-.12, .85, smoothstep(.3, .82, grazing))
		animal.head.rotation.y = .19 * sin(time * 1.72)
		var stride := .20 * sin(time * 7.3) * (1.0 - grazing)
		animal.legs[0].rotation.x = stride
		animal.legs[1].rotation.x = -stride


func reset() -> void:
	elapsed = 0.0
	worker.rotation.y = -PI / 2.0
	worker.animation_player.stop()
	advance(0.0)


func story_focus() -> Vector3:
	return to_global(Vector3(.25, .91, .10))
