extends SceneTree

func files_in(directory: String) -> PackedStringArray:
	var files := PackedStringArray()
	for name in DirAccess.get_files_at(directory):
		files.append(directory.path_join(name))
	for name in DirAccess.get_directories_at(directory):
		files.append_array(files_in(directory.path_join(name)))
	return files

func _initialize() -> void:
	var files := files_in("res://")
	for path in files:
		for prefix in ["res://docs/", "res://tools/", "res://source-assets/", "res://tests/", "res://web/"]:
			if path.begins_with(prefix):
				push_error("Source-only path exported: " + path)
				quit(1)
				return
		if path.ends_with(".docx") or path.ends_with(".blend") or path.ends_with("toolchain.lock.json"):
			push_error("Source-only file exported: " + path)
			quit(1)
			return
	for path in ["res://scenes/interaction/interactable.tscn", "res://scenes/interaction/interactor.tscn", "res://scripts/interaction/interactable.gd", "res://scripts/interaction/interactor.gd", "res://scenes/proof/village_proof.tscn", "res://scenes/world/village.tscn", "res://scenes/world/village/house.tscn", "res://scenes/world/village/well.tscn", "res://scenes/world/village/olive.tscn", "res://scenes/world/village/stall.tscn", "res://scenes/world/village/wall.tscn", "res://scripts/world/village.gd", "res://scripts/world/village_module.gd", "res://scripts/world/village_mesh.gd", "res://assets/village/opaque_palette.tres", "res://scenes/player/exploration_camera.tscn", "res://scripts/player/exploration_camera.gd", "res://scenes/proof/courtyard_proof.tscn", "res://scenes/world/courtyard.tscn", "res://scenes/world/provisions.tscn", "res://scenes/characters/shepherd.tscn", "res://scenes/player/david.tscn", "res://scenes/player/game_input.tscn", "res://scenes/ui/game_ui.tscn", "res://scenes/ui/objective_marker.tscn", "res://assets/proof/shepherd.glb", "res://assets/proof/courtyard-gate.glb", "res://assets/proof/confirmation.wav", "res://scripts/proof/proof_state.gd", "res://scripts/characters/character_visual.gd", "res://scripts/player/player_controller.gd", "res://scripts/ui/game_ui.gd", "res://scripts/player/game_input.gd", "res://scripts/world/courtyard.gd"]:
		if not ResourceLoader.exists(path) or load(path) == null:
			push_error("Required runtime dependency missing: " + path)
			quit(1)
			return
	for path in ["res://scenes/characters/david_visual.tscn", "res://scripts/characters/david_visual.gd",
		"res://assets/characters/david.glb", "res://assets/characters/david-palette.tres",
		"res://scenes/characters/jesse_visual.tscn", "res://assets/characters/jesse.glb",
		"res://assets/characters/jesse-palette.tres", "res://scripts/story/village_exchange.gd",
		"res://scenes/world/village/provisions_table.tscn"]:
		if not ResourceLoader.exists(path) or load(path) == null:
			push_error("Required character or exchange dependency missing: " + path)
			quit(1)
			return
	print("PROOF_PACK_FILES=" + JSON.stringify(files))
	quit(0)
