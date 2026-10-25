export const fractureVertex = /* glsl */ `
attribute vec3 velocity;
attribute vec3 color;
attribute float seed;
uniform float time;
uniform float duration;
uniform float size;
uniform float pixelRatio;
varying vec3 vColor;
varying float vLife;

void main() {
  float t = clamp(time, 0.0, duration);
  // shards burst out then slow down (drag), with a slight swirl
  float travel = (1.0 - exp(-t * 2.4)) / 2.4;
  vec3 p = position + velocity * travel;
  p += vec3(sin(seed * 31.0 + t * 3.0), cos(seed * 17.0 + t * 2.0), sin(seed * 7.0 + t)) * 0.015 * t;
  vColor = color;
  vLife = 1.0 - t / duration;
  vec4 mv = modelViewMatrix * vec4(p, 1.0);
  gl_PointSize = size * pixelRatio * (0.6 + seed) * (1.0 / -mv.z) * mix(1.0, 0.4, 1.0 - vLife);
  gl_Position = projectionMatrix * mv;
}
`

export const fractureFragment = /* glsl */ `
varying vec3 vColor;
varying float vLife;

void main() {
  vec2 c = gl_PointCoord - 0.5;
  if (abs(c.x) > 0.5 || abs(c.y) > 0.5) discard;
  // square shards that glow hotter as they break apart
  vec3 hot = mix(vColor, vec3(1.0, 0.82, 0.55), 0.35 * (1.0 - vLife));
  gl_FragColor = vec4(hot * 1.4, vLife * vLife);
}
`
