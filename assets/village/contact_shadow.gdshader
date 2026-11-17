shader_type spatial;
render_mode unshaded, shadows_disabled, depth_draw_never, blend_mix;

uniform vec4 ink : source_color = vec4(0.20, 0.16, 0.11, 1.0);
varying vec2 ground_offset;

void vertex() {
	ground_offset = VERTEX.xz;
}

void fragment() {
	vec2 away_from_sun = normalize(vec2(-0.44, -0.90));
	vec2 across = vec2(-away_from_sun.y, away_from_sun.x);
	vec2 point = vec2(dot(ground_offset, across), dot(ground_offset, away_from_sun));
	float cast = 1.0 - smoothstep(0.18, 1.0, length((point - vec2(0.0, 0.34)) / vec2(0.38, 0.86)));
	float contact = 1.0 - smoothstep(0.19, 1.0, length(point / vec2(0.38, 0.36)));
	ALBEDO = ink.rgb;
	ALPHA = 0.27 * cast + 0.23 * contact * (1.0 - 0.27 * cast);
}
