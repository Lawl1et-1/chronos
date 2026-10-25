export const spiralVertex = /* glsl */ `
varying float vT;
void main() {
  vT = uv.x;
  gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
}
`

export const spiralFragment = /* glsl */ `
uniform float reveal;
uniform float cursor;
uniform float time;
varying float vT;

void main() {
  if (vT > reveal) discard;
  // dim in the deep past, brighter towards the present
  vec3 past = vec3(0.16, 0.32, 0.55);
  vec3 present = vec3(0.5, 0.82, 1.0);
  vec3 col = mix(past, present, smoothstep(0.0, 1.0, vT));
  // a soft pulse travelling up the timeline
  float pulse = smoothstep(0.03, 0.0, abs(fract(vT * 3.0 - time * 0.08) - 0.5) - 0.47);
  col += present * pulse * 0.35;
  // glow around the cursor
  float d = (vT - cursor) / 0.012;
  col += vec3(1.0, 0.78, 0.4) * exp(-d * d) * 1.8;
  // fade the leading edge of the reveal
  float edge = smoothstep(reveal, reveal - 0.04, vT);
  gl_FragColor = vec4(col * edge, edge);
}
`
