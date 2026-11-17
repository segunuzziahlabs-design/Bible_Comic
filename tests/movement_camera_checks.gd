extends SceneTree

const PLAYER = preload("res://scenes/player/david.tscn")
const CAMERA = preload("res://scenes/player/exploration_camera.tscn")
const INPUT = preload("res://scenes/player/game_input.tscn")
const GAME = preload("res://scenes/proof/courtyard_proof.tscn")
const DT := 1.0 / 60.0
var passed: Array[String] = []
var failures: Array[String] = []
var measurements := {}

func _initialize() -> void:
	call_deferred("run")

func check(ok: bool, label: String) -> void:
	(passed if ok else failures).append(label)
	if not ok:
		push_error(label)

func fixture() -> SubViewport:
	var view := SubViewport.new()
	view.size = Vector2i(960, 540)
	view.own_world_3d = true
	root.add_child(view)
	return view

func box(view: Node, at: Vector3, dimensions: Vector3, tilt := 0.0) -> StaticBody3D:
	var body := StaticBody3D.new()
	var collision := CollisionShape3D.new()
	var shape := BoxShape3D.new()
	shape.size = dimensions
	collision.shape = shape
	body.add_child(collision)
	view.add_child(body)
	body.position = at
	body.rotation.x = tilt
	return body

func walk(player: CharacterBody3D, movement: Vector2, frames: int, yaw := 0.0) -> void:
	for frame in frames:
		await physics_frame
		player.step(DT, movement, yaw, true)

func mouse(button: MouseButton, pressed: bool) -> InputEventMouseButton:
	var event := InputEventMouseButton.new()
	event.button_index = button
	event.pressed = pressed
	return event

func finger(id: int, at: Vector2, pressed := true, canceled := false) -> InputEventScreenTouch:
	var event := InputEventScreenTouch.new()
	event.index = id
	event.position = at
	event.pressed = pressed
	event.canceled = canceled
	return event

func drag(id: int, at: Vector2, relative: Vector2) -> InputEventScreenDrag:
	var event := InputEventScreenDrag.new()
	event.index = id
	event.position = at
	event.relative = relative
	return event

func run() -> void:
	var view := fixture()
	box(view, Vector3(0, -0.25, 0), Vector3(50, 0.5, 50))
	var player = PLAYER.instantiate()
	view.add_child(player)
	player.reset_at(Vector3(0, 0.05, 0))
	await walk(player, Vector2.ZERO, 20)
	await walk(player, Vector2(0, -1), 60)
	var start: Vector3 = player.global_position
	var planted_travel := 0.0
	var planted_samples := 0
	var first_plant := Vector3.ZERO
	var in_plant := false
	var foot: int = player.actor.skeleton.find_bone(&"foot_l")
	for frame in 30:
		await walk(player, Vector2(0, -1), 1)
		var planted: bool = player.actor.walk_phase >= .21 and player.actor.walk_phase <= .57
		if planted:
			var ankle: Vector3 = player.actor.skeleton.to_global(player.actor.skeleton.get_bone_global_pose(foot).origin)
			if not in_plant:
				first_plant = ankle
			planted_travel = maxf(planted_travel, Vector2(ankle.x - first_plant.x, ankle.z - first_plant.z).length())
			planted_samples += 1
		in_plant = planted
	measurements["planted_ankle_travel_m"] = planted_travel
	check(planted_samples >= 5 and planted_travel < .10, "Blended walk keeps the planted ankle near its world position")
	var straight: float = Vector2(player.position.x - start.x, player.position.z - start.z).length()
	player.reset_at(Vector3(0, 0.05, 0))
	await walk(player, Vector2(1, -1), 60)
	start = player.global_position
	await walk(player, Vector2(1, -1), 30)
	var diagonal: float = Vector2(player.position.x - start.x, player.position.z - start.z).length()
	measurements["straight_diagonal_metres"] = [straight, diagonal]
	check(absf(straight - diagonal) < 0.015, "Full-speed straight and diagonal travel cover equal distance")
	check(absf(diagonal * 2.0 - player.SPEED) < .02, "Oversized movement vector cannot exceed walk speed")
	check(absf(player.actor.walk_rate * player.actor.AUTHORED_WALK_SPEED - diagonal * 2.0) < .02,
		"Animation cadence matches full horizontal travel")
	player.reset_at(Vector3(0, 0.05, 0))
	await walk(player, Vector2(0, -1), 60, PI / 2)
	check(player.position.x < -1.35 and absf(player.position.z) < .03, "Forward travel follows camera yaw")
	player.reset_at(Vector3(0, 0.05, 0))
	await walk(player, Vector2(0, -.35), 45)
	var slow_rate: float = player.actor.walk_rate
	var before_turn: float = player.actor.rotation.y
	await walk(player, Vector2.RIGHT, 1)
	var first_turn: float = absf(angle_difference(before_turn, player.actor.rotation.y))
	await walk(player, Vector2.RIGHT, 35)
	before_turn = player.actor.rotation.y
	await walk(player, Vector2.LEFT, 1)
	var reverse_turn: float = absf(angle_difference(before_turn, player.actor.rotation.y))
	await walk(player, Vector2.LEFT, 35)
	measurements["walk_rates"] = [slow_rate, player.actor.walk_rate]
	measurements["first_turn_degrees"] = [rad_to_deg(first_turn), rad_to_deg(reverse_turn)]
	check(absf(slow_rate * player.actor.AUTHORED_WALK_SPEED - .35 * player.SPEED) < .02,
		"Partial input lowers walk cadence in proportion to travel")
	check(first_turn > 0.0 and first_turn <= player.TURN_RATE * DT + .001 and reverse_turn <= player.TURN_RATE * DT + .001
		and player.velocity.x < -1.7, "Side turns and reversals rotate gradually and settle in the new direction")
	var stop_at: Vector3 = player.position
	player.step(DT, Vector2.ONE, 0, false)
	check(player.position == stop_at and player.velocity == Vector3.ZERO, "Disabled movement freezes immediately without residual drift")
	await walk(player, Vector2(0, -1), 30)
	stop_at = player.position
	await walk(player, Vector2.ZERO, 15)
	check(player.velocity.x == 0 and player.velocity.z == 0 and player.position.distance_to(stop_at) < .2, "Released movement brakes within 0.2 metres")
	player.reset_at(Vector3(0, 0.05, 0))
	box(view, Vector3(0, 2, -2), Vector3(12, 4, .4))
	box(view, Vector3(2, 2, 0), Vector3(.4, 4, 4))
	await walk(player, Vector2(0, -1), 90)
	check(player.position.z > -1.6 and player.actor.walk_weight == 0.0 and player.actor.walk_rate < .01,
		"Wall stops penetration and blocked feet return to idle")
	await walk(player, Vector2(1, -1), 100)
	check(player.position.x > 1.4 and player.position.x < 1.6 and player.position.z > -1.6, "Player slides along wall into bounded corner")
	await walk(player, Vector2(-1, 1), 90)
	check(player.position.x < .2 and player.position.z > -.2, "Reversing input escapes a concave corner")
	view.free()

	view = fixture()
	box(view, Vector3(0, -.25, 0), Vector3(30, .5, 30))
	box(view, Vector3(0, 1.4, 0), Vector3(4, .3, 8), deg_to_rad(20))
	player = PLAYER.instantiate()
	view.add_child(player)
	player.reset_at(Vector3(0, 1, 3))
	await walk(player, Vector2.ZERO, 45)
	await walk(player, Vector2(0, -1), 100)
	check(player.is_on_floor() and player.position.y > 1.3, "Player climbs a 20-degree ramp and stays grounded")
	stop_at = player.position
	await walk(player, Vector2.ZERO, 120)
	check(player.position.distance_to(stop_at) < .2 and player.is_on_floor(), "Player does not slide downhill while idle")
	await walk(player, Vector2(0, -1), 110)
	measurements["ramp_high_position"] = [player.position.x, player.position.y, player.position.z]
	check(player.position.y > 2.3 and player.position.z < -2, "Uphill route reaches the high end without trapping")
	await walk(player, Vector2(0, 1), 215)
	check(player.position.z > 2.5 and player.position.y < .8 and player.is_on_floor(), "Descending ramp stays attached and reaches its low end")
	view.free()

	view = fixture()
	box(view, Vector3(0, -.25, 0), Vector3(20, .5, 20))
	box(view, Vector3(0, 1.7, 0), Vector3(4, .3, 4), deg_to_rad(60))
	player = PLAYER.instantiate()
	view.add_child(player)
	player.reset_at(Vector3(0, .1, 2.8))
	await walk(player, Vector2(0, -1), 120)
	measurements["steep_position"] = [player.position.x, player.position.y, player.position.z]
	check(player.position.z > .7 and player.position.y < .8, "60-degree slope is rejected rather than climbed")
	await walk(player, Vector2(0, 1), 68)
	check(player.position.z > 2.4, "Player can retreat from an unwalkable slope")
	view.free()

	view = fixture()
	player = PLAYER.instantiate()
	view.add_child(player)
	player.reset_at(Vector3.ZERO)
	var rig = CAMERA.instantiate()
	view.add_child(rig)
	await physics_frame
	rig.step(DT, player)
	check(is_equal_approx(rig.boom_length, 5.5) and not rig.obstructed, "Unobstructed camera uses full boom")
	var wall := box(view, Vector3(0, 2, 3), Vector3(6, 6, .3))
	await physics_frame
	rig.step(DT, player)
	check(rig.obstructed and rig.camera.position.z < 2.62, "Camera retracts before rendering a newly obstructed frame")
	var short_boom: float = rig.boom_length
	wall.free()
	await physics_frame
	rig.step(DT, player)
	check(rig.boom_length > short_boom and rig.boom_length < 5.5, "Camera eases outward after a wall clears")
	for i in 120:
		rig.step(DT, player)
	check(rig.boom_length > 5.49, "Camera returns to normal distance after clearance")
	# Centre ray misses this thin edge; the camera volume must still collide.
	wall = box(view, Vector3(.3, 2, 3), Vector3(.3, 6, .3))
	await physics_frame
	rig.reset()
	rig.step(DT, player)
	check(rig.obstructed and rig.boom_length < 3.5, "Camera volume catches an off-axis corner that a centre ray misses")
	wall.free()
	box(view, Vector3(0, 2, 0), Vector3(6, .2, 6))
	await physics_frame
	rig.step(DT, player)
	check(rig.camera.global_position.y < 1.68, "Low roof constrains the camera volume")
	var clear := true
	for aspect in [Vector2(390, 844), Vector2(844, 390)]:
		rig.set_viewport_size(aspect)
		for angle in [0, 45, 90, 180, 270]:
			rig.yaw = deg_to_rad(angle)
			rig.step(DT, player)
			var query := PhysicsShapeQueryParameters3D.new()
			query.shape = rig.probe
			query.exclude = [player.get_rid()]
			query.transform = Transform3D(Basis.IDENTITY, rig.camera.global_position)
			clear = clear and rig.get_world_3d().direct_space_state.intersect_shape(query, 1).is_empty()
	check(clear, "Camera volume remains outside roof across yaw and both framing modes")
	rig.apply_look(Vector2(100000, 100000))
	check(absf(rig.yaw) <= PI and is_equal_approx(rig.pitch, rig.MAX_PITCH), "Large look input wraps yaw and clamps upper pitch")
	rig.apply_look(Vector2(0, -100000))
	check(is_equal_approx(rig.pitch, rig.MIN_PITCH), "Lower pitch is clamped")
	player.reset_at(Vector3(10, 0, 5))
	rig.reset()
	rig.step(DT, player)
	check(rig.yaw == 0 and rig.pitch == .4 and rig.camera.global_position.x > 9.9 and player.actor.visible, "Reset snaps camera to new spawn and restores actor visibility")
	wall = box(view, player.position + Vector3.UP * 1.15, Vector3.ONE)
	await physics_frame
	rig.step(DT, player)
	check(rig.origin_overlapped and rig.boom_length == 0 and not player.actor.visible, "Initial overlap collapses boom without casting through wall or invalid look direction")
	view.free()

	var input = INPUT.instantiate()
	root.add_child(input)
	input.set_anchors_preset(Control.PRESET_TOP_LEFT)
	input.size = Vector2(390, 844)
	input.active = true
	input._unhandled_input(mouse(MOUSE_BUTTON_LEFT, true))
	input._input(mouse(MOUSE_BUTTON_RIGHT, false))
	check(input.mouse_looking, "Releasing an unrelated mouse button preserves left drag")
	var motion := InputEventMouseMotion.new()
	motion.relative = Vector2(30, 0)
	input._unhandled_input(motion)
	check(not input.mouse_looking and input.take_look() == Vector2.ZERO, "Motion without left held cancels a missed mouse release")
	input._unhandled_input(finger(1, Vector2(80, 750)))
	input._unhandled_input(finger(2, Vector2(300, 400)))
	input._unhandled_input(drag(1, Vector2(80, 702), Vector2(0, -48)))
	input._unhandled_input(drag(2, Vector2(320, 400), Vector2(20, 0)))
	check(input.get_movement() == Vector2(0, -1) and input.take_look() == Vector2(20, 0), "Two touch IDs independently move and look")
	input._input(finger(2, Vector2.ZERO, false, true))
	check(input.look_id == -1 and input.move_id == 1 and input.get_movement().length() == 1, "Canceling look finger preserves movement finger")
	input.active = false
	check(input.move_id == -1 and input.look_id == -1 and input.get_movement() == Vector2.ZERO, "Deactivating input immediately clears gesture ownership")
	input.active = true
	input._unhandled_input(drag(1, Vector2(80, 700), Vector2(0, -10)))
	check(input.get_movement() == Vector2.ZERO, "Stale drag cannot reacquire canceled movement")
	input._unhandled_input(finger(3, Vector2(80, 750)))
	input._unhandled_input(drag(3, Vector2(80, 702), Vector2(0, -48)))
	check(input.move_id == 3 and input.get_movement() == Vector2(0, -1), "Fresh touch reacquires control after cancellation")
	input.free()

	view = fixture()
	var game = GAME.instantiate()
	view.add_child(game)
	game.set_physics_process(false)
	await physics_frame
	game.muted = true # Audio is exercised in browser; keep this physics fixture silent.
	game._start()
	game.player.velocity = Vector3(2, 0, 0)
	game._toggle_pause()
	check(game.player.velocity == Vector3.ZERO, "Pause callback immediately cancels velocity before next frame")
	game._toggle_pause()
	game.player.velocity = Vector3(2, 0, 0)
	game._resize()
	check(game.player.velocity == Vector3.ZERO, "Resize immediately stops movement")
	game.state.accept("jesse_spoken")
	game.player.position = Vector3(0, -12, 0)
	game.camera_rig.yaw = 2
	game._physics_process(DT)
	check(game.recoveries == 1 and game.state.stage == 1 and game.camera_rig.yaw == 0 and game.camera_rig.camera.position.distance_to(game.camera_rig.focus) <= 5.51 and game.player.position.distance_to(game.world.spawn_position()) < .01, "Fall recovery preserves objective and snaps camera to spawn")
	view.free()
	await process_frame
	print("MOVEMENT_CAMERA_CHECKS=" + JSON.stringify({"passed": passed, "failures": failures, "measurements": measurements}))
	quit(0 if failures.is_empty() else 1)
