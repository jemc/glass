#version 300 es
precision mediump float;

in vec3 position;
in vec2 textureUV;
in float alpha;

uniform vec2 projectionVector;

out vec2 varyingTextureUV;
out float varyingAlpha;

void main(void) {
  gl_Position = vec4(
    position.x / projectionVector.x - 1.0,
    position.y / -projectionVector.y + 1.0,
    position.z,
    1.0
  );

  varyingTextureUV = textureUV;
  varyingAlpha = alpha;
}
