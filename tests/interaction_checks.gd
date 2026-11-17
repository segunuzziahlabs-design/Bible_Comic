extends SceneTree

const TARGET = preload("res://scenes/interaction/interactable.tscn")
const DETECTOR = preload("res://scenes/interaction/interactor.tscn")
const VILLAGE = preload("res://scenes/proof/village_proof.tscn")
const COURTYARD = preload("res://scenes/proof/courtyard_proof.tscn")
var passed: Array[String] = []
var failures: Array[String] = []
var detector: Node
var calls := 0
var finish_on_request := false
var reentrant := true
var reserved_before_signal := false

func _initialize() -> void:
	call_deferred("run")

func check(ok: bool, label: String) -> void:
	(passed if ok else failures).append(label)
	if not ok:
		push_error(label)

func new_view() -> SubViewport:
	var view := SubViewport.new()
	view.size = Vector2i(960, 540)
	view.own_world_3d = true
	root.add_child(view)
	return view

func body(parent: Node, at: Vector3, size: Vector3) -> StaticBody3D:
	var wall := StaticBody3D.new()
	var collision := CollisionShape3D.new()
	var shape := BoxShape3D.new()
	shape.size = size
	collision.shape = shape
	wall.add_child(collision)
	parent.add_child(wall)
	wall.position = at
	return wall

func target_node(parent: Node, id: String, at: Vector3) -> Node3D:
	var item: Node3D = TARGET.instantiate()
	item.interaction_id = id
	parent.add_child(item)
	item.position = at
	return item

func settle() -> void:
	await physics_frame
	await physics_frame

func on_request(item: Node3D) -> void:
	calls += 1
	reserved_before_signal = item.busy
	reentrant = detector.attempt()
	if finish_on_request:
		item.finish_interaction(true)

func run() -> void:
	var view := new_view()
	var actor := CharacterBody3D.new()
	view.add_child(actor)
	var collider := CollisionShape3D.new()
	var capsule := CapsuleShape3D.new()
	capsule.radius = .3
	capsule.height = 1.8
	collider.shape = capsule
	collider.position.y = .9
	actor.add_child(collider)
	detector = DETECTOR.instantiate()
	view.add_child(detector)
	var a := target_node(view, "elder", Vector3(0, 0, -1.5))
	var b := target_node(view, "jar", Vector3(1.5, 0, 0))
	check(detector.configure(actor, [b, a, actor]), "Configure accepts local targets and ignores unrelated nodes")
	detector.interaction_requested.connect(on_request)
	detector.active = true
	await settle()
	check(detector.refresh() == a, "Equidistant targets use stable ID ordering independent of registration order")
	b.position.x = 1
	check(detector.refresh() == b, "Closest eligible target wins without story-specific rules")
	b.enabled = false
	check(detector.refresh() == a, "Disabled nearby target does not mask an available target")
	a.hide()
	check(detector.refresh() == null and not detector.attempt(), "Hidden targets cannot show a prompt or dispatch")
	a.show()
	a.position = Vector3(0, 0, -2)
	check(detector.refresh() == a, "Authored range boundary is inclusive")
	a.position.z = -2.01
	check(detector.refresh() == null and not detector.attempt(), "Target just beyond range cannot dispatch")
	a.position = Vector3(0, 2.01, 0)
	check(detector.refresh() == null, "Vertical separation counts toward range")
	a.position = Vector3(0, 0, -1.5)
	var wall := body(view, Vector3(0, 1, -.75), Vector3(2, 2, .15))
	await settle()
	check(detector.refresh() == null and not detector.attempt(), "An intervening wall suppresses both prompt and activation")
	wall.position.z = 0
	await settle()
	check(detector.refresh() == null, "Ray starting inside a solid still blocks the target")
	wall.position.x = 5
	await settle()
	check(detector.refresh() == a, "Player collider is excluded and moving a wall restores detection")
	var own := body(a, Vector3(0, 1, 0), Vector3(.5, 1, .5))
	await settle()
	check(detector.refresh() == null, "Unassigned object collider blocks the ray")
	a.own_collider_path = a.get_path_to(own)
	check(detector.refresh() == a, "Explicit own collider may be the first ray hit")
	wall.position = Vector3(0, 1, -.75)
	await settle()
	check(not detector.attempt(), "Allowing own collider never bypasses an intervening wall")
	wall.position.x = 5
	await settle()
	detector.refresh()
	a.enabled = false
	check(not detector.attempt() and calls == 0, "Click revalidates newly disabled target instead of trusting old selection")
	a.enabled = true
	detector.refresh()
	a.position.z = -4
	check(not detector.attempt(), "Click revalidates distance after a stale selection")
	a.position.z = -1.5
	await settle()
	check(detector.attempt() and calls == 1 and a.busy, "Eligible action dispatches once and remains reserved until acknowledged")
	check(reserved_before_signal and not reentrant, "Reservation precedes callback and blocks reentrant activation")
	detector.step(.3)
	check(not detector.attempt() and calls == 1, "Unresolved action cannot repeat after debounce expires")
	check(a.finish_interaction(false) and not a.consumed, "Rejected action releases reservation without consuming object")
	finish_on_request = true
	check(detector.attempt() and calls == 2 and a.consumed and a.completion_count == 1, "Acknowledged one-shot action consumes once")
	check(not a.finish_interaction(true) and a.completion_count == 1, "Duplicate acknowledgement cannot duplicate completion")
	detector.step(.3)
	check(not detector.attempt(), "Consumed object cannot dispatch again")
	detector.reset_interactions()
	check(not a.consumed and not a.busy and a.completion_count == 0, "Reset clears target reservation and consumption")
	a.one_shot = false
	check(detector.attempt() and not a.consumed, "Repeatable character remains available after acknowledgement")
	check(not detector.attempt(), "Rapid second activation is debounced even when target resolves synchronously")
	detector.step(.3)
	check(detector.attempt() and a.completion_count == 2, "Repeatable character can activate after debounce")
	detector.suspend()
	check(detector.selected == null and not detector.attempt(), "Suspension clears prompt selection and rejects activation")
	detector.active = true
	detector.step(.3)
	a.queue_free()
	check(detector.refresh() == null, "Queued-for-deletion target is ignored immediately")
	await settle()
	check(not detector.attempt(), "Freed target references are ignored safely")
	b.enabled = true
	var second_view := new_view()
	var foreign := target_node(second_view, "foreign", Vector3(0, 0, -.1))
	detector.configure(actor, [foreign, b])
	check(detector.refresh() == b, "Targets in a different physics world cannot be selected")
	var duplicate := target_node(view, "jar", Vector3(0, 0, -.1))
	check(not detector.configure(actor, [b, duplicate]) and not detector.attempt(), "Duplicate target IDs fail configuration closed")
	second_view.free()
	view.free()
	await integrated_checks(COURTYARD, "Courtyard")
	await integrated_checks(VILLAGE, "Village")
	await process_frame
	print("INTERACTION_CHECKS=" + JSON.stringify({"passed": passed, "failures": failures}))
	quit(0 if failures.is_empty() else 1)

func integrated_checks(scene: PackedScene, label: String) -> void:
	var view := new_view()
	var game = scene.instantiate()
	view.add_child(game)
	game.set_physics_process(false)
	game.muted = true
	game._start()
	await settle()
	game.player.reset_at(game.world.target_position("gate") + Vector3(0, .1, 1))
	game._interact()
	check(game.state.stage == 0 and game.interactor.request_count == 0, label + ": locked gate does not dispatch")
	game.player.reset_at(Vector3(3.2, .1, .6))
	game._interact()
	check(game.state.stage == 0 and game.interactor.request_count == 0 and game.ui.context_button.disabled, label + ": locked provisions offer no actionable prompt")
	game.player.reset_at(Vector3(0, .1, 2.4))
	game._physics_process(1.0 / 60)
	check(game.target == "jesse" and game.ui.context_button.text == "E · Speak to Jesse", label + ": authored prompt includes keyboard action hint")
	game.ui.interact_requested.emit()
	game.ui.interact_requested.emit()
	game._interaction_requested()
	check(game.dialogue and game.dialogue_target.busy and game.interactor.request_count == 1 and game.state.stage == 0, label + ": rapid keyboard/button requests cannot skip new dialogue")
	check(game.target.is_empty() and game.ui.context_button.disabled, label + ": dialogue clears stale world action")
	game.interactor.step(.3)
	game.ui.continue_requested.emit()
	game.ui.continue_requested.emit()
	if game.exchange:
		check(game.state.stage == 0 and game.exchange.active(), "Village: Continue input cannot advance the automatic exchange")
		game.ui.skip_requested.emit()
	check(game.state.stage == 1 and game.accepted_story_events == ["jesse_spoken"], label + ": dialogue completion emits one accepted story event")
	game._interact()
	check(not game.dialogue and game.interactor.request_count == 1, label + ": confirmation cannot immediately reopen dialogue")
	game.interactor.step(.3)
	game._interact()
	game.interactor.step(.3)
	if game.exchange:
		game.ui.skip_requested.emit()
	else:
		game._finish_dialogue()
	check(game.state.stage == 1 and game.accepted_story_events.size() == 1, label + ": repeat conversation does not repeat progression")
	game._toggle_pause()
	game._interact()
	check(game.paused and game.target.is_empty() and game.interactor.request_count == 2, label + ": pause rejects world action and clears prompt")
	game._toggle_pause()
	game.player.reset_at(Vector3(3.2, .1, .6))
	game.interactor.step(.3)
	game._interact()
	game._interact()
	if game.exchange:
		for frame in 360:
			if not game.exchange.active():
				break
			await physics_frame
			game._physics_process(1.0 / 60)
	check(game.state.stage == 2 and game.interactor.request_count == 3 and game.world.get_node("Anchors/Provisions").consumed, label + ": pickup fires once and consumes the target")
	game.player.reset_at(game.world.target_position("gate") + Vector3(0, .1, 1))
	game.interactor.step(.3)
	game._interact()
	game._interact()
	check(game.state.stage == 3 and game.accepted_story_events == ["jesse_spoken", "provisions_collected", "gate_reached"], label + ": complete journey has exactly three ordered events")
	game._restart()
	check(game.state.stage == 0 and game.accepted_story_events.is_empty() and not game.world.get_node("Anchors/Provisions").consumed and game.interactor.request_count == 0, label + ": restart restores interaction and story state together")
	game.player.reset_at(Vector3(0, .1, 2.4))
	game._interact()
	game._restart()
	check(not game.dialogue and game.dialogue_target == null and not game.world.get_node("Anchors/Jesse").busy, label + ": restart cancels unresolved dialogue reservation")
	if game.exchange:
		game.state.accept("jesse_spoken")
		game.player.reset_at(Vector3(2.2, .1, -1.05))
		game._physics_process(1.0 / 60)
		game._interact()
		check(not game.exchange.active() and game.state.stage == 1,
			"Village: an approach through the table cannot reserve the lift")
		game.player.reset_at(Vector3(2.24, .04, .20))
		game.interactor.step(.3)
		game._interact()
		var bundle: Node3D = game.world.provisions_bundle()
		var home := bundle.transform
		for frame in 220:
			if game.exchange.attached:
				break
			await physics_frame
			game._physics_process(1.0 / 60)
		check(game.exchange.attached and game.state.stage == 1, "Village: wrist contact precedes acceptance")
		game.player.actor.cancel_action()
		await physics_frame
		game._physics_process(1.0 / 60)
		check(game.state.stage == 1 and bundle.visible and bundle.transform.is_equal_approx(home)
			and not game.world.get_node("Anchors/Provisions").busy and game.ui.mode == "game",
			"Village: cancelling an attached pickup restores the same bundle and keeps Take available")
	view.free()
