export * from "./Arrangement"
export * from "./AudioWorklet"
export * from "./Context"
export * from "./Key"
export * from "./Riff"
export * from "./Voice"
export * from "./NESNoise"

import { World, Phase } from "@glass/core"
import { ArrangementPlaySystem } from "."

export function setup(world: World) {
  world.addSystem(Phase.PreRender, ArrangementPlaySystem)
}
