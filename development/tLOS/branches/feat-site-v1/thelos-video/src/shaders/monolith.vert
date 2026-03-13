precision mediump float;

uniform float uTime;

varying vec2 vUv;

void main() {
  vUv = uv;
  
  vec3 newPosition = position;
  
  // Calculate distance to edges (0.0 at edges, 1.0 at center)
  float edgeX = min(uv.x, 1.0 - uv.x);
  float edgeY = min(uv.y, 1.0 - uv.y);
  float edgeDistance = min(edgeX, edgeY);
  
  // Edge threshold - only deform vertices close to edges
  float edgeThreshold = 0.15;
  float edgeFactor = smoothstep(0.0, edgeThreshold, edgeThreshold - edgeDistance);
  
  // Sinusoidal deformation based on time and position
  float deformX = sin(uTime * 1.2 + uv.y * 8.0) * 0.003;
  float deformY = cos(uTime * 0.8 + uv.x * 6.0) * 0.002;
  
  // Apply deformation only near edges
  newPosition.x += deformX * edgeFactor;
  newPosition.y += deformY * edgeFactor;
  
  gl_Position = projectionMatrix * modelViewMatrix * vec4(newPosition, 1.0);
}
