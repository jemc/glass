export * from "./Context"
export * from "./Status"

import { World, Phase } from "@glass/core"
import { StatusSystem } from "."

export function setup(world: World) {
  world.addSystem(Phase.Action, StatusSystem)
}
