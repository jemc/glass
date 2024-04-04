import { registerComponent } from "@glass/core"

export class Context {
  static readonly componentId = registerComponent(this)

  constructor() {}
}
