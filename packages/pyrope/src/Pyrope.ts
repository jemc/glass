export * from "./Body"
export * from "./Camera"
export * from "./Context"
export * from "./Jump"
export * from "./Move"
export * from "./Spawn"

import { World, Phase } from "@glass/core"
import { Agate } from "@glass/agate"
import { Opal } from "@glass/opal"
import {
  SpawnOnStatusSystem,
  MoveSystem,
  JumpSystem,
  BodyUpdateSystem,
  CameraFocusSystem,
} from "."

export function setup(world: World) {
  Agate.setup(world)
  Opal.setup(world)

  world.addSystem(Phase.Action, SpawnOnStatusSystem)
  world.addSystem(Phase.Action, MoveSystem)
  world.addSystem(Phase.Action, JumpSystem)
  world.addSystem(Phase.Action, BodyUpdateSystem)

  world.addSystem(Phase.Reaction, CameraFocusSystem)
}
