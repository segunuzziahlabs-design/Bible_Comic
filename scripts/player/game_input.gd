extends Control

signal interact_requested
signal pause_requested

var movement := Vector2.ZERO
var look_delta := Vector2.ZERO
var move_id := -1
var look_id := -1
var origin := Vector2.ZERO
var thumb := Vector2.ZERO
var mouse_looking := false
var touch_visible := false
var active := false:
	set(value):
		if active and not value:
			clear()
		active = value
var held_keys: Dictionary = {}

func _ready() -> void:
	mouse_filter = Control.MOUSE_FILTER_IGNORE
	touch_visible = DisplayServer.is_touchscreen_available()

func clear() -> void:
	movement = Vector2.ZERO
	look_delta = Vector2.ZERO
	move_id = -1
	look_id = -1
	mouse_looking = false
	held_keys.clear()
	queue_redraw()

func _input(event: InputEvent) -> void:
	# Releases must clear ownership even when a finger leaves the control region.
	if event is InputEventKey and not event.pressed:
		held_keys.erase(event.physical_keycode)
	if event is InputEventScreenTouch and (not event.pressed or event.canceled):
		if event.index == move_id:
			move_id = -1
			movement = Vector2.ZERO
		if event.index == look_id:
			look_id = -1
		queue_redraw()
	if event is InputEventMouseButton and event.button_index == MOUSE_BUTTON_LEFT and not event.pressed:
		mouse_looking = false

func _unhandled_input(event: InputEvent) -> void:
	# Action requests also work in dialogue/pause; the owning controller decides eligibility.
	if event is InputEventKey:
		if event.pressed and not event.echo:
			if event.is_action_pressed("interact"):
				interact_requested.emit()
			elif event.is_action_pressed("pause_game"):
				pause_requested.emit()
			elif active:
				held_keys[event.physical_keycode] = event
		return
	if not active:
		return
	# GUI buttons use Godot's touch-to-mouse adapter; world look owns raw touch IDs.
	if (event is InputEventMouseButton or event is InputEventMouseMotion) and event.device == InputEvent.DEVICE_ID_EMULATION:
		return
	if event is InputEventScreenTouch and event.pressed and not event.canceled:
		touch_visible = true
		if event.position.x < size.x * 0.44 and event.position.y > size.y * 0.48 and move_id < 0:
			move_id = event.index
			origin = event.position
			thumb = origin
		elif event.position.x > size.x * 0.44 and event.position.y > 130 and look_id < 0:
			look_id = event.index
		queue_redraw()
	elif event is InputEventScreenDrag:
		if event.index == move_id:
			thumb = origin + (event.position - origin).limit_length(48)
			movement = (thumb - origin) / 48.0
			if movement.length() < 0.13:
				movement = Vector2.ZERO
		elif event.index == look_id:
			look_delta += event.relative
		queue_redraw()
	elif event is InputEventMouseButton and event.button_index == MOUSE_BUTTON_LEFT:
		mouse_looking = event.pressed
	elif event is InputEventMouseMotion and mouse_looking:
		if event.button_mask & MOUSE_BUTTON_MASK_LEFT:
			look_delta += event.relative
		else:
			mouse_looking = false

func _held(action: StringName) -> bool:
	for event in held_keys.values():
		if InputMap.event_is_action(event, action):
			return true
	return false

func get_movement() -> Vector2:
	var keyboard := Vector2(
		float(_held(&"move_right")) - float(_held(&"move_left")),
		float(_held(&"move_back")) - float(_held(&"move_forward")))
	return (movement + keyboard).limit_length(1)

func take_look() -> Vector2:
	var result := look_delta
	look_delta = Vector2.ZERO
	return result

func _draw() -> void:
	if not active or not touch_visible:
		return
	var center := origin if move_id >= 0 else Vector2(80, size.y - 88)
	draw_circle(center, 52, Color(0.07, 0.12, 0.14, 0.42))
	draw_arc(center, 52, 0, TAU, 48, Color(0.96, 0.89, 0.72, 0.70), 2, true)
	draw_circle(thumb if move_id >= 0 else center, 22, Color(0.96, 0.89, 0.72, 0.75))
	draw_string(ThemeDB.fallback_font, Vector2(center.x - 21, center.y - 62), "MOVE", HORIZONTAL_ALIGNMENT_LEFT, -1, 13, Color(1, 0.95, 0.83, 0.9))
