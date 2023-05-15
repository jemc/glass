#version 300 es
precision highp float;

in vec2 position;
in vec2 texture;

uniform vec2 viewOffset;
uniform vec2 viewportSize;
uniform vec2 inverseTileDataSize;
uniform vec2 inverseTileSize;

out vec2 varyingPixelCoord;
out vec2 varyingTexCoord;

void main(void) {
  varyingPixelCoord = (texture * viewportSize) + viewOffset;
  varyingTexCoord = varyingPixelCoord * inverseTileDataSize * inverseTileSize;

  gl_Position = vec4(position, 0.0, 1.0);
}
