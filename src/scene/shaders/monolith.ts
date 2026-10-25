export const monolithVertex = /* glsl */ `
varying vec2 vUv;
void main() {
  vUv = uv;
  gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
}
`

export const monolithFragment = /* glsl */ `
uniform sampler2D map;
uniform float appear;
uniform float hover;
uniform float dim;
uniform float selected;
uniform float loading;
uniform float time;
varying vec2 vUv;

void main() {
  // reveal top to bottom, with a bright scan edge
  float edge = 1.0 - appear * 1.1;
  if (vUv.y < edge) discard;
  vec4 tex = texture2D(map, vUv);
  vec3 col = tex.rgb;
  float a = tex.a;

  float scan = 0.94 + 0.06 * sin(vUv.y * 900.0 + time * 6.0);
  col *= scan;
  float flicker = 0.97 + 0.03 * sin(time * 23.0 + vUv.y * 7.0);
  col *= flicker;

  // sweeping bar while waiting for data
  float bar = exp(-pow((vUv.y - fract(1.0 - time * 0.45)) * 14.0, 2.0)) * loading;
  col += vec3(0.5, 0.82, 1.0) * bar * 0.35;
  a = max(a, bar * 0.3 * step(0.02, a));

  float scanEdge = smoothstep(0.035, 0.0, abs(vUv.y - edge)) * step(appear, 0.98);
  col += vec3(0.6, 0.9, 1.0) * scanEdge * 1.5;
  a = max(a, scanEdge);

  col *= mix(1.0, 1.18, hover) * mix(1.0, 0.45, dim);
  col += vec3(1.0, 0.75, 0.35) * selected * 0.06;
  gl_FragColor = vec4(col * 0.86, a * mix(1.0, 0.6, dim));
}
`
