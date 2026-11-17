extends Control

signal start_requested
signal interact_requested
signal continue_requested
signal pause_requested
signal restart_requested
signal mute_requested
signal quality_requested
signal help_requested
signal help_closed
signal skip_requested

const INK := Color("182d32")
const PAPER := Color("f5edda")
const GOLD := Color("c99d57")
var header: PanelContainer
var objective: Label
var route_hint: Label
var context_button: Button
var toolbar: GridContainer
var help_button: Button
var pause_button: Button
var mute_button: Button
var quality_button: Button
var modal_shade: ColorRect
var card: PanelContainer
var eyebrow: Label
var title: Label
var body: Label
var primary: Button
var secondary: Button
var toast: Label
var help: Label
var stats: Label
var mode := "welcome"
var compact := false
var location_name := "courtyard"
var location_label: Label
var content: VBoxContainer
var body_scroll: ScrollContainer
var footer: GridContainer
var exchange_panel: PanelContainer
var exchange_style: StyleBoxFlat
var exchange_line: Label
var exchange_pause: Button
var exchange_skip: Button

func panel_style(fill: Color, border: Color = Color.TRANSPARENT) -> StyleBoxFlat:
	var style := StyleBoxFlat.new()
	style.bg_color = fill
	style.border_color = border
	style.set_border_width_all(1)
	style.set_corner_radius_all(12)
	style.content_margin_left = 20
	style.content_margin_right = 20
	style.content_margin_top = 16
	style.content_margin_bottom = 16
	return style

func label(text: String, font_size: int, colour: Color) -> Label:
	var result := Label.new()
	result.text = text
	result.add_theme_font_size_override("font_size", font_size)
	result.add_theme_color_override("font_color", colour)
	if colour != INK and colour != Color("826438"):
		result.add_theme_color_override("font_outline_color", INK)
		result.add_theme_constant_override("outline_size", 3)
	result.mouse_filter = Control.MOUSE_FILTER_IGNORE
	return result

func button(text: String, action: Callable, accent := false) -> Button:
	var result := Button.new()
	result.text = text
	result.custom_minimum_size.y = 48
	result.size_flags_horizontal = Control.SIZE_EXPAND_FILL
	result.add_theme_font_size_override("font_size", 17)
	result.add_theme_color_override("font_color", INK if accent else PAPER)
	result.add_theme_color_override("font_hover_color", INK if accent else Color.WHITE)
	result.add_theme_color_override("font_focus_color", INK if accent else PAPER)
	result.add_theme_color_override("font_pressed_color", INK if accent else PAPER)
	result.add_theme_color_override("font_disabled_color", Color("c0c6bb"))
	result.add_theme_stylebox_override("normal", panel_style(GOLD if accent else INK))
	result.add_theme_stylebox_override("hover", panel_style(Color("dfb878") if accent else Color("25434a"), GOLD))
	result.add_theme_stylebox_override("pressed", panel_style(Color("b58c4b") if accent else Color("35565d")))
	result.add_theme_stylebox_override("disabled", panel_style(Color(0.09, 0.15, 0.17, 0.8)))
	for kind in ["normal", "hover", "pressed", "disabled"]:
		var style := result.get_theme_stylebox(kind) as StyleBoxFlat
		style.content_margin_left = 12
		style.content_margin_right = 12
		style.content_margin_top = 10
		style.content_margin_bottom = 10
	var focus := panel_style(Color.TRANSPARENT, GOLD)
	focus.draw_center = false
	focus.set_border_width_all(3)
	result.add_theme_stylebox_override("focus", focus)
	result.pressed.connect(action)
	return result

func _ready() -> void:
	mouse_filter = Control.MOUSE_FILTER_IGNORE
	header = PanelContainer.new()
	header.add_theme_stylebox_override("panel", panel_style(Color(0.08, 0.15, 0.17, 0.94)))
	header.mouse_filter = Control.MOUSE_FILTER_IGNORE
	add_child(header)
	var stack := VBoxContainer.new()
	stack.mouse_filter = Control.MOUSE_FILTER_IGNORE
	header.add_child(stack)
	location_label = label("DAVID & GOLIATH  /  COURTYARD PROOF", 11, GOLD)
	stack.add_child(location_label)
	objective = label("Speak to Jesse", 22, PAPER)
	objective.autowrap_mode = TextServer.AUTOWRAP_WORD_SMART
	stack.add_child(objective)
	route_hint = label("", 14, Color("c4cec6"))
	stack.add_child(route_hint)
	toolbar = GridContainer.new()
	toolbar.add_theme_constant_override("h_separation", 8)
	toolbar.add_theme_constant_override("v_separation", 8)
	add_child(toolbar)
	mute_button = button("Sound on", func(): mute_requested.emit())
	quality_button = button("Low detail", func(): quality_requested.emit())
	pause_button = button("Pause", func(): pause_requested.emit())
	help_button = button("Controls", func(): help_requested.emit())
	toolbar.add_child(mute_button)
	toolbar.add_child(quality_button)
	toolbar.add_child(help_button)
	toolbar.add_child(pause_button)
	context_button = button("Approach Jesse", func(): interact_requested.emit(), true)
	add_child(context_button)
	help = label("WASD / arrows  ·  Drag to look  ·  E interact  ·  Esc pause", 14, PAPER)
	help.horizontal_alignment = HORIZONTAL_ALIGNMENT_CENTER
	add_child(help)
	toast = label("", 17, PAPER)
	toast.horizontal_alignment = HORIZONTAL_ALIGNMENT_CENTER
	toast.autowrap_mode = TextServer.AUTOWRAP_WORD_SMART
	add_child(toast)
	stats = label("", 12, PAPER)
	stats.visible = false
	add_child(stats)
	exchange_panel = PanelContainer.new()
	exchange_style = panel_style(Color(0.06, 0.12, 0.14, .96))
	exchange_panel.add_theme_stylebox_override("panel", exchange_style)
	exchange_panel.resized.connect(_anchor_exchange_panel)
	exchange_panel.hide()
	add_child(exchange_panel)
	var exchange_content := VBoxContainer.new()
	exchange_content.add_theme_constant_override("separation", 8)
	exchange_panel.add_child(exchange_content)
	exchange_line = label("", 18, PAPER)
	exchange_line.autowrap_mode = TextServer.AUTOWRAP_WORD_SMART
	exchange_content.add_child(exchange_line)
	var exchange_controls := HBoxContainer.new()
	exchange_controls.add_theme_constant_override("separation", 8)
	exchange_content.add_child(exchange_controls)
	exchange_pause = button("Pause", func(): pause_requested.emit())
	exchange_skip = button("Skip conversation", func(): skip_requested.emit())
	exchange_controls.add_child(exchange_pause)
	exchange_controls.add_child(exchange_skip)
	modal_shade = ColorRect.new()
	modal_shade.color = Color(0.035, 0.075, 0.085, 0.48)
	modal_shade.set_anchors_and_offsets_preset(Control.PRESET_FULL_RECT)
	add_child(modal_shade)
	card = PanelContainer.new()
	card.add_theme_stylebox_override("panel", panel_style(PAPER))
	modal_shade.add_child(card)
	content = VBoxContainer.new()
	content.add_theme_constant_override("separation", 10)
	card.add_child(content)
	eyebrow = label("A SMALL STEP INTO THE STORY", 12, Color("826438"))
	content.add_child(eyebrow)
	title = label("A shepherd's morning", 34, INK)
	title.autowrap_mode = TextServer.AUTOWRAP_WORD_SMART
	content.add_child(title)
	body_scroll = ScrollContainer.new()
	body_scroll.horizontal_scroll_mode = ScrollContainer.SCROLL_MODE_DISABLED
	body_scroll.size_flags_vertical = Control.SIZE_EXPAND_FILL
	body_scroll.custom_minimum_size.y = 48
	body_scroll.follow_focus = true
	body_scroll.scroll_deadzone = 8
	body_scroll.scroll_hint_mode = ScrollContainer.SCROLL_HINT_MODE_ALL
	content.add_child(body_scroll)
	body = label("", 18, INK)
	body.autowrap_mode = TextServer.AUTOWRAP_WORD_SMART
	body.size_flags_horizontal = Control.SIZE_EXPAND_FILL
	body_scroll.add_child(body)
	footer = GridContainer.new()
	footer.add_theme_constant_override("h_separation", 10)
	footer.add_theme_constant_override("v_separation", 8)
	content.add_child(footer)
	primary = button("Enter the courtyard", _primary_pressed, true)
	secondary = button("Controls", _secondary_pressed)
	footer.add_child(primary)
	footer.add_child(secondary)
	resized.connect(layout)
	header.resized.connect(_position_stacked_toolbar)
	header.minimum_size_changed.connect(func(): call_deferred("_fit_header"))
	show_welcome()
	call_deferred("layout")

func layout() -> void:
	compact = size.x < 900 or size.y < 500
	var margin := 12.0 if compact else 24.0
	var stacked := size.x < 520
	var short_view := size.y < 500
	var toolbar_width := size.x - margin * 2 if stacked else (232.0 if compact else 424.0)
	toolbar.columns = 2 if compact else 4
	header.position = Vector2(margin, margin)
	header.size = Vector2(size.x - margin * 2 if stacked else minf(440, size.x - toolbar_width - margin * 3), 96)
	objective.add_theme_font_size_override("font_size", 20 if compact else 22)
	route_hint.add_theme_font_size_override("font_size", 12 if compact else 14)
	toolbar.position = Vector2(margin, 116) if stacked else Vector2(size.x - toolbar_width - margin, margin)
	toolbar.size = Vector2(toolbar_width, 104 if compact else 48)
	for item in toolbar.get_children():
		item.add_theme_font_size_override("font_size", 14)
	context_button.add_theme_font_size_override("font_size", 14 if compact else 17)
	context_button.position = Vector2(size.x - margin - (174 if compact else 234), size.y - (68 if short_view else 92))
	context_button.size = Vector2(174 if compact else 234, 56)
	help.visible = mode == "game" and not compact
	help.position = Vector2(10, size.y - 35)
	help.size = Vector2(size.x - 20, 24)
	toast.add_theme_font_size_override("font_size", 16)
	toast.position = Vector2(margin, 132 if short_view else size.y - 190)
	toast.size = Vector2(size.x - 2 * margin, 48)
	stats.position = Vector2(margin, 224 if stacked else 112)
	stats.size = Vector2(size.x - margin * 2, 20)
	_place_exchange_panel()
	var width := minf(size.x - margin * 2, 620)
	var preferred_height: float = {"welcome": 460, "help": 460, "dialogue": 370, "pause": 390, "complete": 410}.get(mode, 400)
	card.size = Vector2(width, minf(preferred_height, size.y - margin * 2))
	footer.columns = 2 if size.x >= 520 else 1
	title.add_theme_font_size_override("font_size", 24 if compact else 30)
	body.add_theme_font_size_override("font_size", 17 if compact else 18)
	for item in [primary, secondary]:
		item.add_theme_font_size_override("font_size", 16 if compact else 17)
	call_deferred("_center_card")
	_position_stacked_toolbar()

func _position_stacked_toolbar() -> void:
	if size.x < 520:
		toolbar.position.y = header.position.y + header.size.y + 8
		stats.position.y = toolbar.position.y + toolbar.size.y + 4

func _fit_header() -> void:
	# Wrapped labels can initially report a tall minimum before their width is laid out.
	header.size.y = maxf(96, header.get_combined_minimum_size().y)

func _center_card() -> void:
	card.position = Vector2((size.x - card.size.x) / 2, maxf(8, (size.y - card.size.y) / 2))

func _primary_pressed() -> void:
	match mode:
		"welcome": start_requested.emit()
		"dialogue": continue_requested.emit()
		"pause": pause_requested.emit()
		"complete": restart_requested.emit()
		"help": help_closed.emit()

func _secondary_pressed() -> void:
	if mode == "welcome":
		help_requested.emit()
	elif mode == "pause":
		restart_requested.emit()

func show_card(kind: String, heading: String, copy: String, action: String) -> void:
	mode = kind
	title.text = heading
	body.text = copy
	primary.text = action
	secondary.visible = kind in ["pause", "welcome"]
	secondary.text = "Controls" if kind == "welcome" else "Restart " + location_name
	modal_shade.visible = true
	exchange_panel.hide()
	context_button.visible = false
	toolbar.visible = false
	header.visible = false
	toast.visible = false
	help.visible = false
	eyebrow.text = {"welcome": "DAVID & GOLIATH", "dialogue": "JESSE", "pause": "TAKE YOUR TIME", "complete": "VILLAGE VISIT COMPLETE", "help": "HOW TO PLAY"}.get(kind, "")
	body_scroll.set_deferred("scroll_vertical", 0)
	layout()
	primary.call_deferred("grab_focus")

func show_welcome() -> void:
	show_card("welcome", "A shepherd's morning", "Play as David. Speak to Jesse, collect provisions and reach the gate.\n\nMove with WASD or the arrow keys, or drag the left touch control. Follow the gold marker.\n\nThis is a development sample. Reloading starts a new visit.", "Enter the " + location_name)

func show_help(touch: bool, current_objective: String) -> void:
	var controls := "TOUCH\nDrag the lower-left area to move. Drag the right side to look around. Use separate fingers to move and look together. Tap the gold action button near a character or object."
	var keyboard := "KEYBOARD & MOUSE\nWASD or arrow keys: move. Drag with the mouse: look. E or the gold action button: interact. Escape: pause or close Controls. Tab and Enter: select and activate menu buttons."
	show_card("help", "Controls", (controls + "\n\n" + keyboard if touch else keyboard + "\n\n" + controls) + "\n\nYOUR OBJECTIVE\n" + current_objective + "\n\nFollow the gold marker. Actions appear when you are close enough.\n\nSound and detail settings are at the top of the screen. Extra light reduces 3D detail.\n\nPause keeps your place in this visit. Restart or reload begins again. Scroll here to read more.", "Back")

func configure_location(value: String) -> void:
	location_name = value
	location_label.text = value.to_upper() + "  /  DAVID & GOLIATH"
	secondary.text = "Restart " + value
	if mode == "welcome":
		show_welcome()

func show_game() -> void:
	mode = "game"
	modal_shade.visible = false
	exchange_panel.hide()
	toolbar.visible = true
	header.visible = true
	context_button.visible = true
	toast.visible = true
	layout()
	get_viewport().gui_release_focus()

func show_exchange(talk: bool) -> void:
	mode = "exchange" if talk else "pickup"
	modal_shade.hide()
	toolbar.hide()
	header.hide()
	context_button.hide()
	toast.hide()
	help.hide()
	exchange_skip.visible = talk
	exchange_panel.show()
	_place_exchange_panel()
	get_viewport().gui_release_focus()

func set_exchange_line(copy: String) -> void:
	if exchange_line.text == copy:
		return
	exchange_line.text = copy
	_place_exchange_panel()

func _place_exchange_panel() -> void:
	var margin := 12.0 if compact else 24.0
	var width := minf(size.x - 2.0 * margin, 690.0)
	var short_landscape := size.x >= size.y and size.y < 400
	var height := 96.0 if short_landscape else (154.0 if size.x < 520 else 114.0)
	exchange_style.content_margin_top = 8 if short_landscape else 16
	exchange_style.content_margin_bottom = exchange_style.content_margin_top
	exchange_line.add_theme_font_size_override("font_size", 14 if short_landscape else (16 if compact else 18))
	exchange_panel.size = Vector2(maxf(1.0, width), height)
	_anchor_exchange_panel()

func _anchor_exchange_panel() -> void:
	var margin := 12.0 if compact else 24.0
	var panel_size := exchange_panel.size
	exchange_panel.position = Vector2((size.x - panel_size.x) * .5, maxf(0.0, size.y - panel_size.y - margin))

func set_objective(copy: String) -> void:
	objective.text = copy

func set_progress(copy: String) -> void:
	route_hint.text = copy

func set_context(copy: String, available: bool) -> void:
	context_button.text = copy
	context_button.disabled = not available

func set_toast(copy: String) -> void:
	toast.text = copy

func set_sound_enabled(enabled: bool) -> void:
	mute_button.text = "Sound on" if enabled else "Sound off"

func set_extra_light(enabled: bool) -> void:
	quality_button.text = "Extra light" if enabled else "Low detail"

func enable_diagnostics(enabled: bool) -> void:
	stats.visible = enabled

func set_diagnostics(copy: String) -> void:
	stats.text = copy

func button_rect(control: Control) -> Array:
	var rect := control.get_global_rect()
	return [rect.position.x, rect.position.y, rect.size.x, rect.size.y]

func diagnostic_layout() -> Dictionary:
	return {"primary": button_rect(primary), "context": button_rect(context_button),
		"pause": button_rect(pause_button), "mute": button_rect(mute_button),
		"quality": button_rect(quality_button), "secondary": button_rect(secondary),
		"help": button_rect(help_button), "header": button_rect(header), "toolbar": button_rect(toolbar),
		"exchange": button_rect(exchange_panel), "exchange_pause": button_rect(exchange_pause), "exchange_skip": button_rect(exchange_skip),
		"body_scroll": button_rect(body_scroll), "body": button_rect(body), "scroll_y": body_scroll.scroll_vertical,
		"card": button_rect(card), "view": [size.x, size.y]}
