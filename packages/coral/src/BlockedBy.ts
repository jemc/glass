import { registerComponent, QueryLike, System, Entity } from "@glass/core"
import { Opal } from "@glass/opal"
import { Context } from "./Context"
import { Bounds } from "./Bounds"
import { Body } from "./Body"

export class BlockedBy {
  static readonly componentId = registerComponent(this)

  constructor(
    readonly queries: ReadonlyArray<
      QueryLike<[typeof Opal.Position, typeof Bounds, typeof Body]>
    >,
  ) {}

  private _bits: number = 0

  resetMarks() {
    this._bits = 0
  }

  markBlockedOnTop() {
    this._bits |= BlockedBy.Bits.Top
  }

  markBlockedOnBottom() {
    this._bits |= BlockedBy.Bits.Bottom
  }

  markBlockedOnLeft() {
    this._bits |= BlockedBy.Bits.Left
  }

  markBlockedOnRight() {
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

  entitiesThatMayBlock(): Iterable<
    [Entity, [Opal.Position, Bounds, Body, ...unknown[]]]
  > {
    let outerIter = this.queries.values()
    let innerIter: Iterator<
      [Entity, [Opal.Position, Bounds, Body, ...unknown[]]]
    > | null = null

    return {
      [Symbol.iterator]() {
        return {
          next: () => {
            while (true) {
              if (innerIter) {
                const innerResult = innerIter.next()
                if (!innerResult.done) return innerResult

                innerIter = null
              }

              const outerResult = outerIter.next()
              if (outerResult.done) return { done: true, value: undefined }

              innerIter = outerResult.value.entities[Symbol.iterator]()
            }
          },
        }
      },
    }
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
      blockedBy.resetMarks()
    },
  })
