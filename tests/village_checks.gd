extends SceneTree

const GAME = preload("res://scenes/proof/village_proof.tscn")
const DT := 1.0 / 60.0
var passed: Array[String] = []
var failures: Array[String] = []
var steps := 0
var camera_overlaps := 0
var game: Node3D

func _initialize() -> void:
	call_deferred("run")

func check(ok: bool, label: String) -> void:
	(passed if ok else failures).append(label)
	if not ok:
		push_error(label)

func walk_to(point: Vector2) -> bool:
	var destination: Vector3 = game.world.to_global(Vector3(point.x, 0, point.y))
	for frame in 900:
		var delta := Vector2(destination.x - game.player.global_position.x, destination.z - game.player.global_position.z)
		if delta.length() < .12:
			game.player.stop()
			return true
		await physics_frame
		game.player.step(DT, delta.normalized(), 0, true)
		game.camera_rig.step(DT, game.player)
		game.interactor.step(DT)
		steps += 1
		if steps % 30 == 0:
			var query := PhysicsShapeQueryParameters3D.new()
			query.shape = game.camera_rig.probe
			query.exclude = [game.player.get_rid()]
			query.transform = Transform3D(Basis.IDENTITY, game.camera_rig.camera.global_position)
			if not game.get_world_3d().direct_space_state.intersect_shape(query, 1).is_empty():
				camera_overlaps += 1
		if game.player.global_position.y < -1:
			return false
	print("ROUTE_BLOCKED=" + JSON.stringify({"target": [point.x, point.y], "player": [game.player.position.x, game.player.position.y, game.player.position.z]}))
	return false

func run() -> void:
	var view := SubViewport.new()
	view.size = Vector2i(960, 540)
	view.own_world_3d = true
	root.add_child(view)
	game = GAME.instantiate()
	view.add_child(game)
	game.set_physics_process(false)
	game.muted = true
	game._start()
	await physics_frame
	for i in 30:
		await physics_frame
		game.player.step(DT, Vector2.ZERO, 0, true)
	check(game.player.is_on_floor() and game.player.global_position.distance_to(game.world.spawn_position()) < .2, "Village spawn settles on ground without overlap recovery")
	var metrics: Dictionary = game.world.geometry_metrics
	check(metrics.triangles < 15000 and metrics.surfaces < 70, "Village stays inside provisional 15000 triangle / 70 surface environment budget")
	var before: int = game.world.get_child_count()
	game.world._ready()
	check(game.world.get_child_count() == before, "Re-entering world setup does not duplicate generated geometry")
	check(await walk_to(Vector2(0, -13)), "Central route reaches exit before story unlock")
	game._interact()
	check(game.state.stage == 0 and game.ui.mode == "game", "Early exit cannot skip the errand")
	check(await walk_to(Vector2(0, .6)) and await walk_to(Vector2(3.2, .6)), "Provisions have a reachable approach")
	game._interact()
	check(game.state.stage == 0 and game.world.provisions_bundle().visible, "Early pickup leaves provisions and story state intact")
	check(await walk_to(Vector2(0, 2.4)), "Player returns to Jesse without collision trap")
	game._interact()
	check(game.dialogue, "Jesse can be spoken to from his approach")
	for frame in ceili(game.exchange.story.duration / DT) + 2:
		await physics_frame
		game._physics_process(DT)
	check(game.state.stage == 1, "Jesse dialogue unlocks village provisions")
	check(await walk_to(Vector2(3.2, .6)), "Player can walk from Jesse to the stall")
	game._interact()
	check(game.exchange.active() and game.state.stage == 1, "Take reserves the pickup before it changes the objective")
	for frame in 360:
		if not game.exchange.active():
			break
		await physics_frame
		game._physics_process(DT)
	check(game.state.stage == 2 and not game.world.provisions_bundle().visible and game.exchange.contact_count == 1,
		"Stall pickup attaches the bundle once and stows it before advancing the objective")
	var well_route := true
	for point in [Vector2(0, .6), Vector2(0, -3), Vector2(-6, -3), Vector2(-6, -9.5), Vector2(0, -9.5)]:
		well_route = await walk_to(point) and well_route
	check(well_route, "Public well loop is walkable in full")
	var perimeter := true
	for point in [Vector2(0, -13), Vector2(-12.5, -13), Vector2(-12.5, 7), Vector2(12.5, 7), Vector2(12.5, -13), Vector2(0, -13)]:
		perimeter = await walk_to(point) and perimeter
	check(perimeter, "Outer public loop remains navigable around all four homes")
	check(camera_overlaps == 0, "Camera volume stays outside solids along sampled village routes")
	game._interact()
	check(game.state.stage == 3 and game.ui.mode == "complete", "Village gate completes the ordered sample")
	game._restart()
	check(game.state.stage == 0 and game.world.provisions_bundle().visible and game.player.position.distance_to(game.world.spawn_position()) < .01, "Restart restores village spawn and provisions together")
	# Traverse through the imported arch before pressing against the visible outer wall.
	check(await walk_to(Vector2(0, -15.4)), "Gateway opening admits the player capsule")
	for i in 90:
		await physics_frame
		game.player.step(DT, Vector2(0, -1), 0, true)
	check(game.player.position.z > -16.05 and game.player.position.z < -15.8, "North boundary prevents leaving the playable village")
	check(await walk_to(Vector2(0, 8)), "Player can return from north boundary")
	for i in 90:
		await physics_frame
		game.player.step(DT, Vector2(0, 1), 0, true)
	check(game.player.position.z < 9.01 and game.player.position.z > 8.8, "Rear boundary contains the player")
	check(await walk_to(Vector2(12.5, 7)), "East boundary approach is reachable")
	for i in 90:
		await physics_frame
		game.player.step(DT, Vector2(1, 0), 0, true)
	check(game.player.position.x < 14.01 and game.player.position.x > 13.8, "East boundary contains the player")
	check(await walk_to(Vector2(-12.5, 7)), "West boundary approach is reachable")
	for i in 90:
		await physics_frame
		game.player.step(DT, Vector2(-1, 0), 0, true)
	check(game.player.position.x > -14.01 and game.player.position.x < -13.8, "West boundary contains the player")
	game.state.accept("jesse_spoken")
	game.player.position.y = -12
	game._physics_process(DT)
	check(game.recoveries == 1 and game.state.stage == 1 and game.player.position.distance_to(game.world.spawn_position()) < .01, "Village recovery preserves the current objective")
	view.free()
	await process_frame
	print("VILLAGE_CHECKS=" + JSON.stringify({"passed": passed, "failures": failures, "physics_steps": steps, "camera_overlaps": camera_overlaps, "geometry": metrics}))
	quit(0 if failures.is_empty() else 1)
