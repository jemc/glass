export * from "./Body"
export * from "./Camera"
export * from "./Context"
export * from "./Direction"
export * from "./LoadTileMapSpawns"
export * from "./SetBodyDepthSystem"
export * from "./Walk"
export * from "./WarpPlayer"

import { World, Phase } from "@glass/core"
import { Agate } from "@glass/agate"
import { Opal } from "@glass/opal"
import {
  LoadTileMapSpawnsSystem,
  WalkSystem,
  WarpPlayerSystem,
  CameraFocusSystem,
  SetBodyDepthSystem,
} from "."

export function setup(world: World) {
  Agate.setup(world)
  Opal.setup(world)

  world.addSystem(Phase.Load, LoadTileMapSpawnsSystem)

  world.addSystem(Phase.Action, WalkSystem)
  world.addSystem(Phase.Action, WarpPlayerSystem)

  world.addSystem(Phase.Reaction, CameraFocusSystem)

  world.addSystem(Phase.PreRender, SetBodyDepthSystem)
}
