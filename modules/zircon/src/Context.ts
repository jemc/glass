import { registerComponent } from "@glass/core"
import { Opal } from "@glass/opal"

export class Context {
  static readonly componentId = registerComponent(this)

  constructor(public opal: Opal.Context) {}
}
