extends SceneTree

# Run against the exported PCK, not against the source project's resource tree.
func _initialize() -> void:
	var files := _files_in("res://")
	for path in files:
		if path.begins_with("res://docs/") or path.begins_with("res://tools/") or path.ends_with(".docx") or path.ends_with("toolchain.lock.json"):
			push_error("Source-only file included in export: " + path)
			quit(1)
			return
	if not ResourceLoader.exists("res://scenes/proof/toolchain_check.tscn"):
		push_error("Toolchain check scene missing from exported package")
		quit(1)
		return
	print("A03_PACK_FILES=" + JSON.stringify(files))
	quit(0)

func _files_in(directory: String) -> PackedStringArray:
	var result := PackedStringArray()
	for name in DirAccess.get_files_at(directory):
		result.append(directory.path_join(name))
	for name in DirAccess.get_directories_at(directory):
		result.append_array(_files_in(directory.path_join(name)))
	return result
