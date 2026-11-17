extends RefCounted

enum Stage { JESSE, PROVISIONS, GATE, COMPLETE }
var stage: int = Stage.JESSE

func accept(event: String) -> bool:
	var required := ["jesse_spoken", "provisions_collected", "gate_reached"]
	if stage >= Stage.COMPLETE or event != required[stage]:
		return false
	stage += 1
	return true

func reset() -> void:
	stage = Stage.JESSE

func objective() -> String:
	return ["Speak to Jesse", "Collect the provisions", "Reach the village gate", "Courtyard complete"][stage]

func target_id() -> String:
	return ["jesse", "provisions", "gate", ""][stage]
