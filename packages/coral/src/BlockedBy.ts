import { registerComponent, QueryLike } from "@glass/core"
import { Opal } from "@glass/opal"
import { Collisions } from "./Coral"

export class BlockedBy {
  static readonly componentId = registerComponent(this)

  constructor(
    readonly queries: ReadonlyArray<
      QueryLike<[typeof Collisions, typeof Opal.Position]>
    >,
  ) {}
}
