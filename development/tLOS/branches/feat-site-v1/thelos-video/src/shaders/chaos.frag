varying vec2 vUv;

uniform sampler2D uTexture;
uniform float uBlurAmount;
uniform vec2 uVelocity;

void main() {
  vec4 color = vec4(0.0);
  
  // Motion blur: sample texture 5 times along velocity vector
  const int samples = 5;
  float blurScale = uBlurAmount * 0.02; // Adjust blur strength
  
  for (int i = 0; i < samples; i++) {
    float offset = float(i) - 2.0; // -2, -1, 0, 1, 2
    vec2 sampleUv = vUv + uVelocity * offset * blurScale;
    color += texture2D(uTexture, sampleUv);
  }
  
  color /= float(samples);
  
  gl_FragColor = color;
}
