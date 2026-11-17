extends SceneTree

const UI = preload("res://scenes/ui/game_ui.tscn")
const GAME = preload("res://scenes/proof/village_proof.tscn")
var passed: Array[String] = []
var failures: Array[String] = []

func _initialize() -> void:
	call_deferred("run")

func check(ok: bool, label: String) -> void:
	(passed if ok else failures).append(label)
	if not ok:
		push_error(label)

func settle() -> void:
	for i in 6:
		await process_frame

func inside(control: Control, bounds: Rect2) -> bool:
	return bounds.grow(1).encloses(control.get_global_rect())

func run() -> void:
	var view := SubViewport.new()
	view.own_world_3d = true
	root.add_child(view)
	var ui = UI.instantiate()
	view.add_child(ui)
	for dimensions in [Vector2i(320,568), Vector2i(390,844), Vector2i(568,320), Vector2i(800,360), Vector2i(1280,720)]:
		view.size = dimensions
		await settle()
		var bounds := Rect2(Vector2.ZERO, Vector2(dimensions))
		var tag := "%dx%d" % [dimensions.x, dimensions.y]
		ui.show_game()
		ui.set_objective("Collect the provisions")
		ui.set_progress("STEP 2 OF 3 · 15 m to your objective")
		ui.set_context("Take provisions", true)
		await settle()
		var actions: Array = ui.toolbar.get_children() + [ui.context_button]
		var fit := inside(ui.header, bounds)
		var clear: bool = not ui.header.get_global_rect().intersects(ui.toolbar.get_global_rect())
		for action in actions:
			fit = fit and inside(action, bounds) and action.size.y >= 48
			for other in actions:
				if action != other:
					clear = clear and not action.get_global_rect().intersects(other.get_global_rect())
		check(fit, tag + ": HUD and all action buttons fit with 48 px minimum height")
		check(clear, tag + ": toolbar, header and action buttons do not overlap")
		if not fit or not clear:
			print("LAYOUT_FAILURE=" + JSON.stringify(ui.diagnostic_layout()))
		check(ui.objective.get_minimum_size().y <= ui.objective.size.y + 1, tag + ": objective text has enough height")
		for mode in ["welcome", "help", "dialogue", "pause", "complete"]:
			ui.show_card(mode, "A shepherd's morning", ("Read the story and continue when ready.\n").repeat(60), "Continue")
			await settle()
			check(inside(ui.card, bounds) and inside(ui.primary, bounds) and (not ui.secondary.visible or inside(ui.secondary, bounds)), tag + " " + mode + ": card and pinned actions fit")
			check(ui.primary.size.y >= 48 and (not ui.secondary.visible or ui.secondary.size.y >= 48) and ui.body_scroll.get_global_rect().end.y <= ui.primary.get_global_rect().position.y + 1, tag + " " + mode + ": readable body scrolls separately from actions")
			var scroll: VScrollBar = ui.body_scroll.get_v_scroll_bar()
			ui.body_scroll.scroll_vertical = int(scroll.max_value)
			await settle()
			check(scroll.max_value > scroll.page and ui.body_scroll.scroll_vertical > 0, tag + " " + mode + ": long text remains scrollable")
			check(view.gui_get_focus_owner() == ui.primary, tag + " " + mode + ": keyboard focus starts on primary action")
	view.free()
	view = SubViewport.new()
	view.size = Vector2i(390, 844)
	view.own_world_3d = true
	root.add_child(view)
	var game = GAME.instantiate()
	view.add_child(game)
	game.muted = true
	await settle()
	game.ui.secondary.pressed.emit()
	check(game.help_open and not game.started and game.ui.mode == "help", "Controls opens from entry without starting gameplay")
	game.ui.primary.pressed.emit()
	check(not game.help_open and not game.started and game.ui.mode == "welcome", "Controls returns to entry before starting")
	game.ui.primary.pressed.emit()
	game.state.accept("jesse_spoken")
	game.player.velocity = Vector3(2, 0, 0)
	game.ui.help_button.pressed.emit()
	var at: Vector3 = game.player.global_position
	game._physics_process(1.0 / 60)
	game._interact()
	game._interaction_requested()
	check(game.help_open and game.player.velocity == Vector3.ZERO and game.player.global_position.is_equal_approx(at) and game.state.stage == 1 and game.interactor.request_count == 0, "In-game Controls stops movement and rejects interactions without changing objective")
	game._pause_for_focus_loss()
	check(game.ui.mode == "help" and game.help_open, "Focus loss does not dismiss Controls or resume play")
	game._toggle_pause()
	check(not game.help_open and game.ui.mode == "game" and game.state.stage == 1 and view.gui_get_focus_owner() == null, "Escape closes Controls, preserves objective and releases modal focus")
	game._toggle_pause()
	game.ui.secondary.pressed.emit()
	check(game.state.stage == 0 and game.ui.mode == "game" and not game.paused, "Pause restart returns to fresh gameplay")
	view.free()
	await process_frame
	print("UI_CHECKS=" + JSON.stringify({"passed": passed, "failures": failures}))
	quit(0 if failures.is_empty() else 1)
