extends CharacterBody3D

const SPEED := 1.8
const ACCELERATION := 11.5
const BRAKING := 17.0
const GRAVITY := 18.0
const TURN_RATE := TAU * 5.0 / 3.0
const TURN_ALLOWANCE := PI / 12.0
@onready var actor: Node3D = $Visuals

func _ready() -> void:
	actor.rotation.y = PI

func step(delta: float, movement: Vector2, yaw: float, enabled: bool) -> void:
	if not enabled or actor.action != &"":
		stop()
		actor.advance_motion(delta, 0.0)
		return
	var bounded := movement.limit_length(1.0)
	var direction := Basis(Vector3.UP, yaw) * Vector3(bounded.x, 0, bounded.y)
	var desired := Vector2(direction.x, direction.z) * SPEED
	var steering := not bounded.is_zero_approx()
	if steering:
		var heading_error := absf(angle_difference(actor.rotation.y, atan2(direction.x, direction.z)))
		desired *= maxf(0.0, cos(maxf(0.0, heading_error - TURN_ALLOWANCE)))
	var current := Vector2(velocity.x, velocity.z)
	var rate := BRAKING if desired.length_squared() < current.length_squared() else ACCELERATION
	var horizontal := current.move_toward(desired, rate * delta)
	velocity.x = horizontal.x
	velocity.z = horizontal.y
	velocity.y = -0.5 if is_on_floor() else maxf(velocity.y - GRAVITY * delta, -30.0)
	move_and_slide()
	var actual := get_real_velocity()
	var speed := Vector2(actual.x, actual.z).length()
	if steering:
		var facing := actual if is_on_wall() and speed > .08 else direction
		actor.rotation.y = rotate_toward(actor.rotation.y, atan2(facing.x, facing.z), TURN_RATE * delta)
	actor.advance_motion(delta, speed if is_on_floor() else 0.0)

func stop() -> void:
	velocity = Vector3.ZERO

func reset_at(spawn: Vector3) -> void:
	global_position = spawn
	stop()
	actor.rotation.y = PI
	actor.visible = true
	actor.reset_pose()
