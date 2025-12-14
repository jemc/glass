import { Query, QueryCache, registerComponent } from "@glass/core"
import { Coral } from "@glass/coral"
import { Opal } from "@glass/opal"
import { Context } from "./Context"

export class SolidWalls {
  static readonly componentId = registerComponent(this)

  constructor() {}
}

export class SolidWallsDownwardOnly {
  static readonly componentId = registerComponent(this)

  constructor() {}
}

export const BlockedBySolidWallsQuery = (cache: QueryCache, context: Context) =>
  Query.for(context, [Opal.Position, Coral.Body, SolidWalls], {
    shouldMatchAll: [SolidWalls],
  })

export const BlockedBySolidWallsDownwardOnlyQuery = (
  cache: QueryCache,
  context: Context,
) =>
  Query.for(context, [Opal.Position, Coral.Body, SolidWallsDownwardOnly], {
    shouldMatchAll: [SolidWallsDownwardOnly],
  })
