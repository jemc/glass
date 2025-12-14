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
    this[RESET_MARKS]() // TODO: don't reset this all the time
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

// TODO: It may be possible to get rid of this
export const ResetBlockedBySystem = (coral: Context) =>
  System.for(coral, [BlockedBy], {
    runEach(entity, blockedBy) {
      blockedBy[RESET_MARKS]()
    },
  })

export const RefreshBlockedBySystem = (coral: Context) =>
  System.for(coral, [BlockedBy, Body, Opal.Position], {
    shouldMatchAll: [BlockedBy],
    runEach(entity, blockedBy, body, position) {
      blockedBy.updateForSubstep(coral, entity, body, position)
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
    if (a.checkSurfaceRightward(coral, posA, b, posB)) {
      return false
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
    if (b.checkSurfaceRightward(coral, posB, a, posA)) {
      return false
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
    if (b.checkSurfaceDownward(coral, posB, a, posA)) {
      return false
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
    if (a.checkSurfaceDownward(coral, posA, b, posB)) {
      // TODO: allow "riding" on things in more than just the downward direction
      coral.world.set(entityA, [new Riding(entityB)])
      return false
    }
  }

  if (blockedBy.additionalQueries.downwardOnly) {
    for (const [entityB, [posB, b]] of queryListValues(
      blockedBy.additionalQueries.downwardOnly,
    )) {
      if (a.checkSurfaceDownward(coral, posA, b, posB)) {
        // TODO: allow "riding" on things in more than just the downward direction
        coral.world.set(entityA, [new Riding(entityB)])
        return false
      }
    }
  }

  return true
}
