/**
 * Custom GLSL Shader – Wasser, Bloom (Auto-Detect)
 */
export function initShaders(renderer, settings) {
  const gl = renderer.getContext();
  const ext = gl.getExtension('WEBGL_debug_renderer_info');
  const gpu = ext ? gl.getParameter(ext.UNMASKED_RENDERER_WEBGL) : '';

  settings.shaderTier = 'none';
  if (/RTX 30|RTX 40|RX 6/i.test(gpu) && settings.bloom) {
    settings.shaderTier = 'ultra';
    settings.shadows = true;
    settings.ssao = true;
    settings.godRays = true;
  } else if (/GTX 10|GTX 16/i.test(gpu)) {
    settings.shaderTier = 'high';
    settings.waterShader = true;
    settings.bloom = true;
  } else if (/Iris/i.test(gpu)) {
    settings.shaderTier = 'medium';
    settings.bloom = true;
  }

  console.log(`[Shaders] Tier: ${settings.shaderTier} (${gpu})`);
}

export const WATER_VERTEX = `
varying vec2 vUv;
void main() {
  vUv = uv;
  gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
}`;

export const WATER_FRAGMENT = `
uniform float time;
varying vec2 vUv;
void main() {
  vec2 uv = vUv + sin(time + vUv.x * 10.0) * 0.02;
  gl_FragColor = vec4(0.2, 0.4, 0.8, 0.7);
}`;
