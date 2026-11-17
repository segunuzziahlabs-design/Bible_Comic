extends SceneTree

const INPUT = preload("res://scenes/player/game_input.tscn")
const PLAYER = preload("res://scenes/player/david.tscn")
const WORLD = preload("res://scenes/world/courtyard.tscn")
const GAME = preload("res://scenes/proof/courtyard_proof.tscn")
var passed: Array[String] = []
var failures: Array[String] = []
var interaction_count := 0
var pause_count := 0

func _initialize() -> void:
	call_deferred("run")

func check(condition: bool, label: String) -> void:
	(passed if condition else failures).append(label)
	if not condition:
		push_error(label)

func key(code: Key, pressed := true) -> InputEventKey:
	var event := InputEventKey.new()
	event.physical_keycode = code
	event.pressed = pressed
	return event

func viewport() -> SubViewport:
	var view := SubViewport.new()
	view.size = Vector2i(960, 540)
	view.own_world_3d = true
	root.add_child(view)
	return view

func run() -> void:
	for definition in [["move_forward", [KEY_W, KEY_UP]], ["move_back", [KEY_S, KEY_DOWN]], ["move_left", [KEY_A, KEY_LEFT]], ["move_right", [KEY_D, KEY_RIGHT]], ["interact", [KEY_E]], ["pause_game", [KEY_ESCAPE]]]:
		var correct := InputMap.has_action(definition[0])
		for code in definition[1]:
			correct = correct and InputMap.event_is_action(key(code), definition[0])
		check(correct, "Input Map binds " + definition[0])
	var input = INPUT.instantiate()
	root.add_child(input)
	input.active = true
	input.interact_requested.connect(func(): interaction_count += 1)
	input.pause_requested.connect(func(): pause_count += 1)
	input._unhandled_input(key(KEY_W))
	input._unhandled_input(key(KEY_UP))
	input._input(key(KEY_W, false))
	check(input.get_movement() == Vector2(0, -1), "Alternate forward key survives release of the other binding")
	input._unhandled_input(key(KEY_D))
	check(is_equal_approx(input.get_movement().length(), 1.0), "Diagonal movement stays normalised")
	input.clear()
	check(input.get_movement() == Vector2.ZERO, "Focus reset clears all keyboard bindings")
	input.active = false
	input._unhandled_input(key(KEY_W))
	check(input.get_movement() == Vector2.ZERO, "Inactive adapter ignores new movement")
	input._unhandled_input(key(KEY_E))
	var repeated := key(KEY_E)
	repeated.echo = true
	input._unhandled_input(repeated)
	input._unhandled_input(key(KEY_ESCAPE))
	check(interaction_count == 1 and pause_count == 1, "Actions signal once without enabling movement in modal state")
	input.active = true
	var remapped := key(KEY_I)
	InputMap.action_add_event("move_forward", remapped)
	input._unhandled_input(remapped)
	check(input.get_movement() == Vector2(0, -1), "Adapter follows Input Map rather than hardcoded WASD")
	InputMap.action_erase_event("move_forward", remapped)
	input.free()
	var view := viewport()
	var player_a = PLAYER.instantiate()
	var player_b = PLAYER.instantiate()
	view.add_child(player_a)
	view.add_child(player_b)
	player_a.reset_at(Vector3(3, 0.1, 5))
	player_b.reset_at(Vector3(-3, 0.1, 5))
	await process_frame
	check(player_a.get_node("CollisionShape3D").shape is CapsuleShape3D, "Player scene supplies its authored collider")
	check(player_a.actor.skeleton != player_b.actor.skeleton, "Character instances own independent skeletons")
	player_a.actor.advance_motion(.2, 1.0)
	check(player_a.actor.walk_weight == 1.0 and player_b.actor.walk_weight == 0.0,
		"Changing one animation does not change another actor")
	var actions: Array[String] = []
	player_a.actor.action_started.connect(func(clip): actions.append("start " + clip))
	player_a.actor.action_finished.connect(func(clip): actions.append("finish " + clip))
	player_a.actor.action_cancelled.connect(func(clip): actions.append("cancel " + clip))
	check(player_a.actor.request_action(&"pickup_provisions") and not player_a.actor.request_action(&"acknowledge"),
		"A reserved pickup rejects a second action")
	var reserved_at: Vector3 = player_a.position
	player_a.step(.1, Vector2.ONE, 0., true)
	check(player_a.position == reserved_at and player_a.actor.action == &"pickup_provisions",
		"Movement cannot interrupt a reserved pickup")
	for frame in 184:
		player_a.step(1.0 / 60.0, Vector2.ZERO, 0., false)
	check(player_a.actor.action == &"" and actions == ["start pickup_provisions", "finish pickup_provisions"],
		"Pickup completes exactly once while movement is suspended")
	player_a.actor.request_action(&"acknowledge")
	player_a.velocity = Vector3(2, -3, 1)
	player_a.reset_at(Vector3(8, 0.1, -2))
	check(player_a.actor.action == &"" and player_a.actor.walk_phase == 0.0 and actions.back() == "cancel acknowledge",
		"Reset cancels a pending action and resets the walk pose")
	check(player_a.global_position.is_equal_approx(Vector3(8, 0.1, -2)) and player_a.velocity == Vector3.ZERO, "Player reset uses world coordinates and clears velocity")
	check(player_b.global_position.is_equal_approx(Vector3(-3, 0.1, 5)), "Player reset does not reposition another instance")
	view.free()
	view = viewport()
	var world_a = WORLD.instantiate()
	world_a.position = Vector3(10, 0, 2)
	view.add_child(world_a)
	var world_b = WORLD.instantiate()
	world_a.show_provisions(false)
	check(world_b.get_node("Anchors/Provisions/Bundle").visible, "World instances do not share pickup visibility")
	check(world_a.spawn_position().is_equal_approx(Vector3(10, 0.1, 7)), "Spawn anchor respects environment placement")
	check(world_a.target_position("jesse").is_equal_approx(Vector3(10, 0, 3.3)), "Interaction anchor respects environment placement")
	world_b.free()
	view.free()
	var view_a := viewport()
	var view_b := viewport()
	var game_a = GAME.instantiate()
	game_a.position = Vector3(10, 0, 2)
	var game_b = GAME.instantiate()
	view_a.add_child(game_a)
	view_b.add_child(game_b)
	await process_frame
	check(game_a.player.global_position.distance_to(game_a.world.spawn_position()) < .2, "Composition spawns David at the transformed world anchor")
	game_a.state.accept("jesse_spoken")
	check(game_b.state.stage == 0, "Each courtyard owns independent story state")
	game_a.world.show_provisions(false)
	game_a.player.global_position = game_a.world.spawn_position() + Vector3(0, -12, 0)
	game_a._physics_process(1.0 / 60.0)
	check(game_a.recoveries == 1 and game_a.state.stage == 1 and game_a.player.global_position.distance_to(game_a.world.spawn_position()) < .2, "Safe recovery keeps objective state and uses the world anchor")
	game_a._restart()
	check(game_a.state.stage == 0 and game_a.world.get_node("Anchors/Provisions/Bundle").visible, "Composition restart restores state and world presentation together")
	view_a.free()
	view_b.free()
	print("FOUNDATION_CHECKS=" + JSON.stringify({"passed": passed, "failures": failures}))
	quit(0 if failures.is_empty() else 1)
