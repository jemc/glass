#version 300 es
precision mediump float;

in vec2 varyingTextureUV;
in float varyingAlpha;

uniform sampler2D spriteSheet;
uniform sampler2D colorPalette;

out vec4 fragColor;

void main(void) {
  // Get the color index from the sprite sheet.
  float paletteIndex = texture(spriteSheet, varyingTextureUV).r;

  // Get the color itself from the palette.
  vec2 paletteUV = vec2(paletteIndex, 0.0);
  vec4 color = texture(colorPalette, paletteUV);

  // Apply alpha to the color, setting the final color value.
  fragColor = color * vec4(1.0, 1.0, 1.0, varyingAlpha);

  // Fully transparent pixels should not write to the depth buffer.
  // This prevents transparent sprite pixels from occluding other sprites.
  if (fragColor.a == 0.0) { discard; }
}
