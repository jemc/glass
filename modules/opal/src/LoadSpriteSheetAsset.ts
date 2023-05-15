import Aseprite from "ase-parser"
import { World, Vector2, Box2, registerComponent } from "@glass/core"
import { Context } from "./Context"
import { LoadAsepriteAsset } from "./LoadAsepriteAsset"
import { Render } from "./Render"
import { SpriteAnimation } from "./Sprite"
import { Texture } from "./Texture"
import { TextureSurface } from "./TextureSurface"
import { ColorPalette } from "./ColorPalette"

export class LoadSpriteSheetAsset extends LoadAsepriteAsset {
  static readonly componentId = registerComponent(this)

  constructor(
    url: string,
    readonly config: Config = {},
  ) {
    super(url)
  }
}

type Config = {
  animations?: {
    [key: string]: {
      frames: string[]
      frameCounts?: number[]
    }
  }
}

export const LoadSpriteSheetAssetsSystem = (world: World) =>
  world.systemFor([Context, LoadSpriteSheetAsset], {
    runEach(entity, context, asset) {
      const ase = asset.result
      if (!ase) return
      world.destroy(entity)

      assertExactlyOneCel(ase)
      const texture = loadTextureSurfaceFromCel(context.render, ase, 0, 0)
      const palette = maybeLoadColorPalette(context.render, ase)
      loadSlices(context, ase, texture, palette)

      if (palette) context.colorPalettes.set(ase.name, palette)

      Object.entries(asset.config.animations ?? {}).forEach(
        ([name, animation]) => {
          context.animations.set(
            name,
            new SpriteAnimation(name, animation.frames, animation.frameCounts),
          )
        },
      )
    },
  })

function assertExactlyOneCel(ase: Aseprite) {
  if (ase.frames.length !== 1)
    throw new Error(`Sprite ${ase.name} has more than one frame`)

  if (ase.frames[0]?.cels.length !== 1)
    throw new Error(`Sprite ${ase.name} has more than one cel`)
}

function loadTextureSurfaceFromCel(
  render: Render,
  ase: Aseprite,
  frameIndex: number,
  celIndex: number,
): TextureSurface {
  const cel = ase.frames[frameIndex]?.cels[celIndex]
  if (!cel)
    throw new Error(
      `Sprite ${ase.name} has no cel at [${frameIndex}, ${celIndex}]`,
    )

  const bytesPerPixel = 4

  if (ase.colorDepth === 32) {
    const imageData = new ImageData(ase.width, ase.height)
    const imageRowWidth = ase.width * bytesPerPixel

    const celRowWidth = cel.w * bytesPerPixel

    cel.rawCelData.forEach((byte, celByteIndex) => {
      const celIndexInRow = celByteIndex % celRowWidth
      const celRowLevelIndex = Math.floor(celByteIndex / celRowWidth)
      const imageIndexInRow = celIndexInRow + cel.xpos * bytesPerPixel
      const imageRowLevelIndex = celRowLevelIndex + cel.ypos
      const imageByteIndex =
        imageRowLevelIndex * imageRowWidth + imageIndexInRow
      imageData.data[imageByteIndex] = byte
    })

    return TextureSurface.fromImage(render, imageData)
  } else if (ase.colorDepth === 8) {
    const indexedPixels = new Uint8Array(ase.width * ase.height)
    const celRowWidth = cel.w

    cel.rawCelData.forEach((byte, celByteIndex) => {
      const celIndexInRow = celByteIndex % celRowWidth
      const celRowLevelIndex = Math.floor(celByteIndex / celRowWidth)
      const emitIndexInRow = celIndexInRow + cel.xpos
      const emitRowLevelIndex = celRowLevelIndex + cel.ypos
      const emitByteIndex = emitRowLevelIndex * ase.width + emitIndexInRow

      indexedPixels[emitByteIndex] = byte
    })

    return TextureSurface.fromIndexedPixels(
      render,
      new Vector2(ase.width, ase.height),
      cel.rawCelData,
    )
  } else {
    throw new Error(`Unsupported color depth: ${ase.colorDepth}`)
  }
}

function maybeLoadColorPalette(
  render: Render,
  ase: Aseprite,
): ColorPalette | undefined {
  if (ase.colorDepth !== 8) return undefined

  return new ColorPalette(render, ase.palette.colors)
}

function loadSlices(
  context: Context,
  ase: Aseprite,
  surface: TextureSurface,
  palette?: ColorPalette,
) {
  ase.slices.forEach((slice) => {
    const info = slice.keys[0]
    if (!info) return

    const texture = new Texture(
      slice.name,
      Box2.fromLeftTopWidthHeight(info.x, info.y, info.width, info.height),
      new Vector2(
        info.pivot?.x ?? Math.round(info.width / 2),
        info.pivot?.y ?? Math.round(info.height / 2),
      ),
      surface,
      palette,
    )

    context.textures.set(slice.name, texture)

    context.animations.set(
      slice.name,
      new SpriteAnimation(slice.name, [slice.name]),
    )
  })
}
