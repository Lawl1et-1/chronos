export const earthVertex = /* glsl */ `
varying vec2 vUv;
varying vec3 vNormalW;
varying vec3 vPosW;

void main() {
  vUv = uv;
  vNormalW = normalize(mat3(modelMatrix) * normal);
  vec4 wp = modelMatrix * vec4(position, 1.0);
  vPosW = wp.xyz;
  gl_Position = projectionMatrix * viewMatrix * wp;
}
`

export const earthFragment = /* glsl */ `
uniform sampler2D dayMap;
uniform sampler2D nightMap;
uniform sampler2D waterMap;
uniform sampler2D idMap;
uniform vec3 sunDir;
uniform float hovered;
uniform float selected;
uniform float focus;
uniform float time;

varying vec2 vUv;
varying vec3 vNormalW;
varying vec3 vPosW;

void main() {
  vec3 N = normalize(vNormalW);
  vec3 V = normalize(cameraPosition - vPosW);
  float ndl = dot(N, sunDir);
  float dayMix = smoothstep(-0.18, 0.28, ndl);

  vec3 day = texture2D(dayMap, vUv).rgb;
  vec3 night = texture2D(nightMap, vUv).rgb;
  float water = texture2D(waterMap, vUv).r;

  vec3 col = day * (0.035 + max(ndl, 0.0) * 1.15);
  // city lights only on the night side, pushed above the bloom threshold
  col += night * night * (1.0 - dayMix) * vec3(1.6, 1.25, 0.85) * 2.4;

  vec3 H = normalize(sunDir + V);
  float spec = pow(max(dot(N, H), 0.0), 70.0) * water * dayMix;
  col += vec3(1.0, 0.92, 0.8) * spec * 0.55;

  float fresnel = pow(1.0 - max(dot(N, V), 0.0), 3.0);
  col += vec3(0.32, 0.62, 1.0) * fresnel * (0.12 + 0.6 * dayMix);

  // country highlights from the index map (row 0 = north)
  float id = floor(texture2D(idMap, vec2(vUv.x, 1.0 - vUv.y)).r * 255.0 + 0.5);
  float land = step(0.5, id);
  float isHover = land * (1.0 - step(0.5, abs(id - hovered)));
  float isSel = land * (1.0 - step(0.5, abs(id - selected)));

  col *= mix(1.0, 0.45, focus * (1.0 - isSel));
  col = mix(col, col * 0.75 + vec3(0.3, 0.75, 1.0) * 0.32, isHover * (1.0 - isSel));
  col += vec3(1.0, 0.72, 0.32) * isSel * (0.1 + 0.05 * sin(time * 2.2));

  gl_FragColor = vec4(col, 1.0);
  #include <tonemapping_fragment>
  #include <colorspace_fragment>
}
`

export const cloudsFragment = /* glsl */ `
uniform sampler2D cloudMap;
uniform vec3 sunDir;
uniform float opacity;

varying vec2 vUv;
varying vec3 vNormalW;
varying vec3 vPosW;

void main() {
  vec3 N = normalize(vNormalW);
  float ndl = dot(N, sunDir);
  float a = texture2D(cloudMap, vUv).r;
  float light = 0.03 + smoothstep(-0.2, 0.5, ndl) * 0.95;
  gl_FragColor = vec4(vec3(light), a * opacity * (0.25 + 0.75 * smoothstep(-0.3, 0.2, ndl)));
  #include <colorspace_fragment>
}
`

export const atmosphereVertex = /* glsl */ `
varying vec3 vNormalV;
varying vec3 vNormalW;

void main() {
  vNormalV = normalize(normalMatrix * normal);
  vNormalW = normalize(mat3(modelMatrix) * normal);
  gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
}
`

export const atmosphereFragment = /* glsl */ `
uniform vec3 sunDir;
varying vec3 vNormalV;
varying vec3 vNormalW;

void main() {
  float rim = pow(clamp(0.7 - dot(vNormalV, vec3(0.0, 0.0, 1.0)), 0.0, 1.0), 3.4);
  float lit = 0.25 + 0.75 * smoothstep(-0.35, 0.45, dot(vNormalW, sunDir));
  vec3 col = mix(vec3(0.25, 0.5, 1.0), vec3(0.55, 0.8, 1.0), lit);
  gl_FragColor = vec4(col * rim * lit * 1.35, rim);
}
`

export const starsVertex = /* glsl */ `
attribute float size;
attribute float phase;
attribute vec3 tint;
uniform float time;
uniform float pixelRatio;
varying vec3 vTint;
varying float vTwinkle;

void main() {
  vTint = tint;
  vTwinkle = 0.65 + 0.35 * sin(time * (0.6 + phase * 1.7) + phase * 40.0);
  vec4 mv = modelViewMatrix * vec4(position, 1.0);
  gl_PointSize = size * pixelRatio * (60.0 / -mv.z);
  gl_Position = projectionMatrix * mv;
}
`

export const starsFragment = /* glsl */ `
varying vec3 vTint;
varying float vTwinkle;

void main() {
  float d = length(gl_PointCoord - 0.5);
  float a = smoothstep(0.5, 0.0, d);
  gl_FragColor = vec4(vTint * vTwinkle, a * a);
}
`
