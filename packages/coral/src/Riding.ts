import { Entity, registerComponent } from "@glass/core"

export class Riding {
  static readonly componentId = registerComponent(this)

  constructor(readonly collectionEntity: Entity) {}
}
