@tool
extends RefCounted

# One opaque surface per module; separate simple bodies supply gameplay collision.
const MATERIAL = preload("res://assets/village/opaque_palette.tres")
var vertices := PackedVector3Array()
var normals := PackedVector3Array()
var colours := PackedColorArray()
var indices := PackedInt32Array()

func patch(points: PackedVector3Array, normal: Vector3, colour: Color) -> void:
	var first := vertices.size()
	for point in points:
		vertices.append(point)
		normals.append(normal)
		colours.append(colour)
	for i in range(1, points.size() - 1):
		indices.append_array([first, first + i, first + i + 1])

func append(mesh: PrimitiveMesh, at: Vector3, colour: Color, scale_value := Vector3.ONE, rotation_value := Vector3.ZERO) -> void:
	var arrays := mesh.get_mesh_arrays()
	var points: PackedVector3Array = arrays[Mesh.ARRAY_VERTEX]
	var source_normals: PackedVector3Array = arrays[Mesh.ARRAY_NORMAL]
	var source_indices: PackedInt32Array = arrays[Mesh.ARRAY_INDEX]
	var basis := Basis.from_euler(rotation_value).scaled(scale_value)
	var normal_basis := basis.inverse().transposed()
	var offset := vertices.size()
	for i in points.size():
		vertices.append(basis * points[i] + at)
		normals.append((normal_basis * source_normals[i]).normalized())
		colours.append(colour)
	for index in source_indices:
		indices.append(offset + index)

func box(at: Vector3, dimensions: Vector3, colour: Color, rotation_value := Vector3.ZERO) -> void:
	var mesh := BoxMesh.new()
	mesh.size = dimensions
	append(mesh, at, colour, Vector3.ONE, rotation_value)

func cylinder(at: Vector3, radius: float, height: float, colour: Color, top_radius := -1.0, rotation_value := Vector3.ZERO) -> void:
	var mesh := CylinderMesh.new()
	mesh.bottom_radius = radius
	mesh.top_radius = radius if top_radius < 0 else top_radius
	mesh.height = height
	mesh.radial_segments = 10
	mesh.rings = 1
	append(mesh, at, colour, Vector3.ONE, rotation_value)

func foliage(at: Vector3, dimensions: Vector3, colour: Color) -> void:
	var mesh := SphereMesh.new()
	mesh.radius = 1.0
	mesh.height = 2.0
	mesh.radial_segments = 8
	mesh.rings = 3
	append(mesh, at, colour, dimensions)

func jar(at: Vector3, radius: float, height: float, clay: Color) -> void:
	var profile := [Vector2(.48, 0), Vector2(.81, .20), Vector2(1, .48), Vector2(.83, .71),
		Vector2(.47, .85), Vector2(.48, .94), Vector2(.55, 1), Vector2(.36, .99), Vector2(.18, .79)]
	var segments := 10
	var offset := vertices.size()
	for row in profile.size():
		var ring: Vector2 = profile[row]
		var tangent: Vector2 = profile[mini(row + 1, profile.size() - 1)] - profile[maxi(row - 1, 0)]
		var tint := clay.darkened(.48) if row >= 7 else clay.lightened(.09 if row == 6 else 0.0)
		for i in segments:
			var angle := TAU * i / segments
			var radial := Vector3(cos(angle), 0, sin(angle))
			vertices.append(at + radial * ring.x * radius + Vector3.UP * ring.y * height)
			normals.append((radial * tangent.y * height - Vector3.UP * tangent.x * radius).normalized())
			colours.append(tint)
			if row < profile.size() - 1:
				var a := offset + row * segments + i
				var b := offset + row * segments + (i + 1) % segments
				indices.append_array([a, b, a + segments, b, b + segments, a + segments])
	cylinder(at + Vector3.UP * height * .786, radius * .19, .008, clay.darkened(.58))

func finish(parent: Node3D, mesh_name := "BatchedGeometry") -> MeshInstance3D:
	var arrays := []
	arrays.resize(Mesh.ARRAY_MAX)
	arrays[Mesh.ARRAY_VERTEX] = vertices
	arrays[Mesh.ARRAY_NORMAL] = normals
	arrays[Mesh.ARRAY_COLOR] = colours
	arrays[Mesh.ARRAY_INDEX] = indices
	var mesh := ArrayMesh.new()
	mesh.add_surface_from_arrays(Mesh.PRIMITIVE_TRIANGLES, arrays)
	mesh.surface_set_material(0, MATERIAL)
	var instance := MeshInstance3D.new()
	instance.name = mesh_name
	instance.mesh = mesh
	instance.cast_shadow = GeometryInstance3D.SHADOW_CASTING_SETTING_OFF
	parent.add_child(instance)
	return instance

func collider(parent: Node3D, at: Vector3, dimensions: Vector3, rotation_value := Vector3.ZERO) -> void:
	var body := StaticBody3D.new()
	var collision := CollisionShape3D.new()
	var shape := BoxShape3D.new()
	shape.size = dimensions
	collision.shape = shape
	body.add_child(collision)
	parent.add_child(body)
	body.position = at
	body.rotation = rotation_value
