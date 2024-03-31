#version 300 es
precision highp float;

in vec2 varyingPixelCoord;
in vec2 varyingTexCoord;

uniform sampler2D tileData;
uniform sampler2D tileSet;

uniform vec2 inverseTileSetSize;
uniform vec2 tileSize;

out vec4 fragColor;

void main(void) {
  // Read the tile ID bytes from this pixel's position in the tile data texture,
  // and use those to reconstruct the expected tile ID.
  vec4 tileIdBytes = texture(tileData, varyingTexCoord) * 256.0;
  float tileId = floor(tileIdBytes.r + tileIdBytes.g * 32.0);

  // Use the tile ID to calculate the position of this tile in the tile set.
  vec2 tileSetCoord = vec2(0.0, tileId) * tileSize;
  vec2 intraTileCoord = mod(varyingPixelCoord, tileSize);
  vec2 tileSetUV = (tileSetCoord + intraTileCoord) * inverseTileSetSize;

  fragColor = texture(tileSet, tileSetUV);
}
