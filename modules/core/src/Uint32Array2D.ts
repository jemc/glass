import { Vector2 } from "./Vector2"

export class Uint32Array2D {
  readonly buffer: ArrayBuffer
  readonly rawBytes: Uint8Array
  readonly rawUint32s: Uint32Array

  get width() {
    return this.size.x
  }
  get height() {
    return this.size.y
  }

  constructor(
    readonly size: Vector2,
    readonly offset: Vector2 = new Vector2(0, 0),
  ) {
    this.buffer = new ArrayBuffer(this.width * this.height * 4)
    this.rawBytes = new Uint8Array(this.buffer)
    this.rawUint32s = new Uint32Array(this.buffer)
  }

  static fromArrayLiterals(
    arrayLiterals: number[][],
    offset: Vector2 = new Vector2(0, 0),
  ) {
    const size = new Vector2(
      arrayLiterals[0]?.length ?? 0,
      arrayLiterals.length,
    )
    const result = new Uint32Array2D(size, offset)
    result.rawUint32s.set(arrayLiterals.flat())
    return result
  }

  get(x: number, y: number): number {
    x -= this.offset.x
    y -= this.offset.y
    if (x < 0 || y < 0 || x >= this.width || y >= this.height) return 0

    return this.rawUint32s[x + y * this.width] ?? 0
  }

  set(x: number, y: number, value: number) {
    x -= this.offset.x
    y -= this.offset.y
    if (x < 0 || y < 0 || x >= this.width || y >= this.height)
      throw new Error(
        `set element out of bounds: (${x}, ${y}) within ${this.size.x} x ${this.size.y} size with offset (${this.offset.x}, ${this.offset.y})`,
      )

    this.rawUint32s[x + y * this.width] = value
  }

  forEach(callback: (value: number, x: number, y: number) => void) {
    for (var i = 0; i < this.rawUint32s.length; i++) {
      const x = i % this.width
      const y = Math.floor(i / this.width)
      callback(this.rawUint32s[i]!, x + this.offset.x, y + this.offset.y)
    }
  }

  // Return a copy of the same data without the x and y offset.
  // The left and top edges will be filled with zeros.
  cloneWithoutOffset() {
    const clone = new Uint32Array2D(this.size.plus(this.offset))

    clone.rawUint32s.fill(0)
    this.forEach((value, x, y) => {
      clone.rawUint32s[x + y * clone.width] = value
    })

    return clone
  }
}
