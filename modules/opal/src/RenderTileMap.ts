import {
  Box2,
  MutableVector2,
  ReadVector2,
  registerComponent,
  Vector2,
  World,
} from "@glass/core"
import { Context } from "./Context"
import { Render } from "./Render"
import { Renderable } from "./Renderable"
import { Texture } from "./Texture"
import { TextureSurface } from "./TextureSurface"
import { TextureSurfaceDrawable } from "./TextureSurfaceDrawable"
import { TileMapShader } from "./TileMapShader"

export class RenderTileMap {
  static readonly componentId = registerComponent(this)

  _state?: _RenderTileMapLayerState // TODO: private?

  constructor(
    readonly url: string,
    readonly layerName: string,
    public cameraPosition: ReadVector2,
  ) {}
}

export const RenderTileMapSystem = (world: World, context: Context) => {
  const shader = new TileMapShader(context.render)

  return world.systemFor([RenderTileMap, Renderable], {
    run(entities) {
      for (const [entity, [component, renderable]] of entities.entries()) {
        if (!component._state) {
          const tileMap = context.tileMaps.get(component.url)
          if (tileMap) {
            const layer = tileMap.layer(component.layerName)

            component._state = new _RenderTileMapLayerState(
              layer.tileset.makeTextureSurface(context.render),
              layer.makeDataTextureSurface(context.render),
              layer.tileset.tileSize,
            )
          } else {
            continue
          }
        }

        const { _state } = component
        _state.maybeCreateOrResizeTexture(context.render, renderable)
        _state.updatePosition(component.cameraPosition, renderable)
        _state.draw(context.render, shader)
      }
    },
  })
}

class _RenderTileMapLayerState {
  texture?: Texture<TextureSurfaceDrawable>

  private tileSize = new Float32Array(2)
  private inverseTileSize = new Float32Array(2)
  private inverseTileSetSize = new Float32Array(2)
  private inverseTileDataSize = new Float32Array(2)

  private cachedSize = new Vector2()

  private snappedPosition = new MutableVector2()

  constructor(
    private readonly tileSetSurface: TextureSurface,
    private readonly tileDataSurface: TextureSurface,
    tileSize: ReadVector2,
  ) {
    this.tileSize[0] = tileSize.x
    this.tileSize[1] = tileSize.y

    this.inverseTileSize[0] = 1 / tileSize.x
    this.inverseTileSize[1] = 1 / tileSize.y

    this.inverseTileSetSize[0] = 1 / this.tileSetSurface.width
    this.inverseTileSetSize[1] = 1 / this.tileSetSurface.height

    this.inverseTileDataSize[0] = 1 / this.tileDataSurface.width
    this.inverseTileDataSize[1] = 1 / this.tileDataSurface.height
  }

  draw(render: Render, shader: TileMapShader) {
    const { surface } = this.texture! // TODO: no bang
    surface.drawToSurface(() =>
      shader.drawTilesToDrawSurface(render, {
        drawSurface: surface,
        tileSetSurface: this.tileSetSurface,
        tileDataSurface: this.tileDataSurface,
        tileSize: this.tileSize,
        inverseTileSize: this.inverseTileSize,
        inverseTileSetSize: this.inverseTileSetSize,
        inverseTileDataSize: this.inverseTileDataSize,
        snappedPosition: this.snappedPosition.clone(),
      }),
    )
  }

  maybeCreateOrResizeTexture(render: Render, renderable: Renderable) {
    if (this.texture && this.cachedSize.isEqualTo(render.size)) return
    this.cachedSize = render.size.clone()

    const viewportSize = new Vector2(
      render.width + 2 * this.tileSize[0]!,
      render.height + 2 * this.tileSize[1]!,
    )
    const viewportSizeHalf = viewportSize.scale(0.5)

    this.texture = new Texture<TextureSurfaceDrawable>(
      "", // TODO: nice name
      new Box2(viewportSizeHalf, viewportSizeHalf),
      new Vector2(),
      new TextureSurfaceDrawable(render, viewportSize),
    )

    renderable.texture = this.texture
    renderable.scale.setTo(1, 1)
    renderable.pivot.copyFrom(this.texture.frame.radii)
  }

  updatePosition(center: ReadVector2, renderable: Renderable) {
    if (!this.texture) return

    // Calculate the correct snap value for shifting the tile map position,
    // based on the current viewport (such that we only render visible tiles).
    this.snappedPosition
      .setTo(center.x, center.y)
      .multiplyEquals(
        new Vector2(-this.inverseTileSize[0]!, -this.inverseTileSize[1]!),
      ) // TODO: avoid new?
      .toFloor()
      .minusScalarEquals(1)
      .multiplyEquals(new Vector2(this.tileSize[0]!, this.tileSize[1]!)) // TODO: avoid new?
      .plusEquals(this.texture.frame.radii)

    renderable.position
      .copyFrom(this.snappedPosition)
      .plusEquals(this.texture!.frame.radii)
  }
}
