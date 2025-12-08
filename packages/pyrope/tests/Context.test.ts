import { describe, expect, test } from "vitest"
import { World, Phase } from "@glass/core"
import { Agate } from "@glass/agate"
import { Opal } from "@glass/opal"
import { Pyrope } from "@glass/pyrope"
import { Coral } from "@glass/coral"

describe("Context", () => {
  test("it sets up Pyrope systems in the correct order", () => {
    const world = new World()
    const agate = new Agate.Context(world)
    const opal = new Opal.Context(agate, {
      canvas: document.createElement("canvas"),
    })
    const coral = new Coral.Context(opal)
    const pyrope = new Pyrope.Context(coral, { tileSize: 16 })

    expect([...world.phasesAndSystemFactories()]).toEqual([
      [Phase.Load, Opal.LoadSpriteSheetAssetsSystem],
      [Phase.Load, Opal.LoadTileMapAssetsSystem],
      [Phase.Load, Opal.LoadTileMapSlicesSystem],
      [Phase.Impetus, Coral.StatusOnContactSystem],
      [Phase.Impetus, Pyrope.DamageOnContactSystem],
      [Phase.Action, Agate.StatusBringsComponentsSystem],
      [Phase.Action, Agate.StatusRemovesComponentsSystem],
      [Phase.Action, Agate.StatusAffectsGaugesSystem],
      [Phase.Action, Agate.GaugesSetStatusSystem],
      [Phase.Action, Agate.DestroyOnStatusSystem],
      [Phase.Action, Pyrope.SpawnOnStatusSystem],
      [Phase.Action, Pyrope.MoveSystem],
      [Phase.Action, Pyrope.OrbitSystem],
      [Phase.Reaction, Coral.ResetBlockedBySystem],
      [Phase.Reaction, Coral.StatusSetsBoundsSystem],
      [Phase.Reaction, Coral.VelocitySystem],
      [Phase.Reaction, Coral.SensorSystem],
      [Phase.Reaction, Pyrope.CameraFocusSystem],
      [Phase.Correction, Opal.PositionWrapsAtEdgesSystem],
      [Phase.Correction, Opal.GaugesWatchPositionOfNearestSystem],
      [Phase.PreRender, Opal.StatusSetsSpriteSystem],
      [Phase.PreRender, Opal.SpriteAnimationSystem],
      [Phase.PreRender, Opal.AnimatePositionSystem],
      [Phase.PreRender, Opal.AnimateAlphaOnStatusSystem],
      [Phase.PreRender, Opal.ColorPaletteAnimationSystem],
      [Phase.Render, Opal.RenderBeginSystem],
      [Phase.Render, Opal.RenderRenderablesSystem],
      [Phase.Render, Opal.RenderTileMapSystem],
      [Phase.Advance, Agate.StatusAdvanceSystem],
    ])
  })
})
