export * from "./Context"
export * from "./RenderText"

import { World, Phase } from "@glass/core"
import { Opal } from "@glass/opal"
import { RenderTextSystem } from "."

export function setup(world: World) {
  Opal.setup(world)

  world.addSystem(Phase.PreRender, RenderTextSystem)
}
