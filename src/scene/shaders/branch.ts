export const branchVertex = /* glsl */ `
varying float vT;
void main() {
  vT = uv.x;
  gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
}
`

export const branchFragment = /* glsl */ `
uniform vec3 colorA;
uniform vec3 colorB;
uniform float reveal;
uniform float time;
uniform float opacity;
varying float vT;

void main() {
  if (vT > reveal) discard;
  vec3 col = mix(colorA, colorB, smoothstep(0.0, 1.0, vT));
  // pulses travelling forward in time
  float pulse = smoothstep(0.04, 0.0, abs(fract(vT * 2.5 - time * 0.25) - 0.5) - 0.46);
  col *= 1.0 + pulse * 0.8;
  // bright growing tip
  float tip = exp(-pow((vT - reveal) / 0.015, 2.0));
  col += vec3(1.0, 0.9, 0.7) * tip * 2.0;
  gl_FragColor = vec4(col * opacity, opacity);
}
`
