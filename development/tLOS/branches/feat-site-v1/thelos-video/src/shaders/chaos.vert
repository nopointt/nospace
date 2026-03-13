varying vec2 vUv;

uniform float uTime;
uniform float uJitterIntensity;

void main() {
  vUv = uv;

  vec3 newPosition = position;

  // Jitter effect - random offset based on time and position
  float jitterSeed = sin(position.x * 10.0 + uTime * 20.0) * cos(position.y * 15.0 + uTime * 25.0);
  newPosition.x += jitterSeed * uJitterIntensity * 0.02;
  newPosition.y += jitterSeed * uJitterIntensity * 0.015;

  gl_Position = projectionMatrix * modelViewMatrix * vec4(newPosition, 1.0);
}
