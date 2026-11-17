extends Resource

@export_range(1.0, 120.0, .1) var duration := 30.0
# Each beat uses seconds, subtitle text, a named shot and optional actor cue.
@export var beats: Array[Dictionary] = []
