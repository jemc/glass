#version 300 es
precision mediump float;

in vec2 varyingTextureUV;
in float varyingAlpha;

uniform sampler2D spriteSheet;

out vec4 fragColor;

void main(void) {
  // Get the color from the sprite sheet.
  vec4 color = texture(spriteSheet, varyingTextureUV);

  // Apply alpha to the color, setting the final color value.
  fragColor = color * vec4(1.0, 1.0, 1.0, varyingAlpha);

  // Fully transparent pixels should not write to the depth buffer.
  // This prevents transparent sprite pixels from occluding other sprites.
  if (fragColor.a == 0.0) { discard; }
}
