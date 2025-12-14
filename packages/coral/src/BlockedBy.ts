import {
  registerComponent,
  QueryLike,
  System,
  Entity,
  queryListValues,
} from "@glass/core"
import { Opal } from "@glass/opal"
import { Context } from "./Context"
import { Body } from "./Body"
import { Riding } from "./Riding"

const RESET_MARKS = Symbol("BlockedBy._resetMarks")

export class BlockedBy {
  static readonly componentId = registerComponent(this)

  constructor(
    readonly queries: ReadonlyArray<
      QueryLike<[typeof Opal.Position, typeof Body]>
    >,
    readonly additionalQueries: {
      downwardOnly?: ReadonlyArray<
        QueryLike<[typeof Opal.Position, typeof Body]>
      >
    } = {},
  ) {}

  private _bits: number = 0

  public [RESET_MARKS]() {
    this._bits = 0
  }

  private markBlockedOnTop() {
    this._bits |= BlockedBy.Bits.Top
  }

  private markBlockedOnBottom() {
    this._bits |= BlockedBy.Bits.Bottom
  }

  private markBlockedOnLeft() {
    this._bits |= BlockedBy.Bits.Left
  }

  private markBlockedOnRight() {
    this._bits |= BlockedBy.Bits.Right
  }

  get wasBlockedOnTop() {
    return (this._bits & BlockedBy.Bits.Top) !== 0
  }

  get wasBlockedOnBottom() {
    return (this._bits & BlockedBy.Bits.Bottom) !== 0
  }

  get wasBlockedOnLeft() {
    return (this._bits & BlockedBy.Bits.Left) !== 0
  }

  get wasBlockedOnRight() {
    return (this._bits & BlockedBy.Bits.Right) !== 0
  }

  updateForSubstep(
    context: Context,
    entity: Entity,
    body: Body,
    pos: Opal.Position,
  ) {
    const {
      wasBlockedOnRight,
      wasBlockedOnLeft,
      wasBlockedOnBottom,
      wasBlockedOnTop,
    } = this
    if (!wasBlockedOnRight && !checkRight(context, entity, this, body, pos))
      this.markBlockedOnRight()
    if (!wasBlockedOnLeft && !checkLeft(context, entity, this, body, pos))
      this.markBlockedOnLeft()
    if (!wasBlockedOnBottom && !checkBottom(context, entity, this, body, pos))
      this.markBlockedOnBottom()
    if (!wasBlockedOnTop && !checkTop(context, entity, this, body, pos))
      this.markBlockedOnTop()
  }
}

export namespace BlockedBy {
  export enum Bits {
    Top = 0b1,
    Bottom = 0b10,
    Left = 0b100,
    Right = 0b1000,
  }
}

export const ResetBlockedBySystem = (coral: Context) =>
  System.for(coral, [BlockedBy], {
    runEach(entity, blockedBy) {
      blockedBy[RESET_MARKS]()
    },
  })

function checkRight(
  coral: Context,
  entityA: Entity,
  blockedBy: BlockedBy,
  a: Body,
  posA: Opal.Position,
) {
  for (const [entityB, [posB, b]] of queryListValues(blockedBy.queries)) {
    if (a.shape === Body.Shape.Box && b.shape === Body.Shape.TileMap) {
      const a = coral.world.get(entityA, Body)
      if (!a) continue

      // TODO: Take posB into account for tilemaps not at (0,0)
      const x = posA.coords.x + a.relativeX1 + 1
      const y0 = posA.coords.y + a.relativeY0
      const y1 = posA.coords.y + a.relativeY1 - 1
      if (b.tileMapIsSolidInXYRange(coral, x, x, y0, y1)) {
        return false
      }
    }
  }
  return true
}

function checkLeft(
  coral: Context,
  entityA: Entity,
  blockedBy: BlockedBy,
  a: Body,
  posA: Opal.Position,
) {
  for (const [entityB, [posB, b]] of queryListValues(blockedBy.queries)) {
    if (a.shape === Body.Shape.Box && b.shape === Body.Shape.TileMap) {
      // TODO: Take posB into account for tilemaps not at (0,0)
      const x = posA.coords.x + a.relativeX0 - 1
      const y0 = posA.coords.y + a.relativeY0
      const y1 = posA.coords.y + a.relativeY1 - 1
      if (b.tileMapIsSolidInXYRange(coral, x, x, y0, y1)) {
        return false
      }
    }
  }
  return true
}

function checkTop(
  coral: Context,
  entityA: Entity,
  blockedBy: BlockedBy,
  a: Body,
  posA: Opal.Position,
) {
  for (const [entityB, [posB, b]] of queryListValues(blockedBy.queries)) {
    if (a.shape === Body.Shape.Box && b.shape === Body.Shape.TileMap) {
      // TODO: Take posB into account for tilemaps not at (0,0)
      const x0 = posA.coords.x + a.relativeX0
      const x1 = posA.coords.x + a.relativeX1 - 1
      const y = posA.coords.y + a.relativeY0 - 1
      if (b.tileMapIsSolidInXYRange(coral, x0, x1, y, y)) {
        return false
      }
    }
  }
  return true
}

function checkBottom(
  coral: Context,
  entityA: Entity,
  blockedBy: BlockedBy,
  a: Body,
  posA: Opal.Position,
) {
  for (const [entityB, [posB, b]] of queryListValues(blockedBy.queries)) {
    if (a.shape === Body.Shape.Box && b.shape === Body.Shape.TileMap) {
      // TODO: Take posB into account for tilemaps not at (0,0)
      const x0 = posA.coords.x + a.relativeX0
      const x1 = posA.coords.x + a.relativeX1 - 1
      const y = posA.coords.y + a.relativeY1 + 1
      if (b.tileMapIsSolidInXYRange(coral, x0, x1, y, y)) {
        // TODO: allow "riding" on things in more than just the downward direction
        coral.world.set(entityA, [new Riding(entityB)])
        return false
      }
    }
  }

  if (blockedBy.additionalQueries.downwardOnly) {
    for (const [entityB, [posB, b]] of queryListValues(
      blockedBy.additionalQueries.downwardOnly,
    )) {
      if (a.shape === Body.Shape.Box && b.shape === Body.Shape.Box) {
        const a = coral.world.get(entityA, Body)
        if (!a) continue

        // Only block if the bottom edge of A is one pixel above the top of B.
        if (
          b.relativeY0 + posB.coords.y == posA.coords.y + a.relativeY1 + 1 &&
          b.relativeX0 + posB.coords.x <= posA.coords.x + a.relativeX1 - 1 &&
          b.relativeX1 + posB.coords.x - 1 >= posA.coords.x + a.relativeX0
        ) {
          // TODO: allow "riding" on things in more than just the downward direction
          coral.world.set(entityA, [new Riding(entityB)])
          return false
        }
      } else if (a.shape === Body.Shape.Box && b.shape === Body.Shape.TileMap) {
        const a = coral.world.get(entityA, Body)
        if (!a) continue

        // TODO: Take posB into account for tilemaps not at (0,0)
        const x0 = posA.coords.x + a.relativeX0
        const x1 = posA.coords.x + a.relativeX1 - 1
        const y = posA.coords.y + a.relativeY1 + 1
        if (b.tileMapIsSolidInXYRange(coral, x0, x1, y, y)) {
          // TODO: allow "riding" on things in more than just the downward direction
          coral.world.set(entityA, [new Riding(entityB)])
          return false
        }
      } else {
        throw new Error(
          `BlockedBy.downwardOnly hasn't implemented this shape pair yet: ${a.shape} ${b.shape}`,
        )
      }
    }
  }

  return true
}
