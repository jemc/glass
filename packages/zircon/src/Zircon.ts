export * from "./Context"
export * from "./Menu"
export * from "./RenderText"

import { World, Phase } from "@glass/core"
import { Opal } from "@glass/opal"
import { MenuNavigateSystem, MenuSetsStatusSystem, RenderTextSystem } from "."

export function setup(world: World) {
  Opal.setup(world)

  world.addSystem(Phase.Impetus, MenuNavigateSystem)
  world.addSystem(Phase.Impetus, MenuSetsStatusSystem)
  world.addSystem(Phase.PreRender, RenderTextSystem)
}
