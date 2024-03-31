import { ReadVector2, Vector2 } from "./Vector2"

export class Matrix3 {
  static create(): Float32Array {
    return this.setToIdentity(new Float32Array(9))
  }

  static setToIdentity(matrix: Float32Array): Float32Array {
    matrix[0] = 1
    matrix[1] = 0
    matrix[2] = 0
    matrix[3] = 0
    matrix[4] = 1
    matrix[5] = 0
    matrix[6] = 0
    matrix[7] = 0
    matrix[8] = 1
    return matrix
  }

  static setTransformRows(
    matrix: Float32Array,
    position: ReadVector2,
    scale: ReadVector2,
    rotateCos: number,
    rotateSin: number,
  ) {
    matrix[0] = rotateCos * scale.x
    matrix[1] = -rotateSin * scale.y
    matrix[2] = Math.floor(position.x)

    matrix[3] = rotateSin * scale.x
    matrix[4] = rotateCos * scale.y
    matrix[5] = Math.floor(position.y)

    // The last row is left alone in its identity state:
    // matrix[6] = 0
    // matrix[7] = 0
    // matrix[8] = 1
  }

  static multiply(
    a: Float32Array,
    b: Float32Array,
    dest: Float32Array,
  ): Float32Array {
    // prettier-ignore
    {
      const a00 = a[0], a01 = a[1], a02 = a[2]
      const a10 = a[3], a11 = a[4], a12 = a[5]
      const a20 = a[6], a21 = a[7], a22 = a[8]
      const b00 = b[0], b01 = b[1], b02 = b[2]
      const b10 = b[3], b11 = b[4], b12 = b[5]
      const b20 = b[6], b21 = b[7], b22 = b[8]

      dest[0] = b00! * a00! + b01! * a10! + b02! * a20!
      dest[1] = b00! * a01! + b01! * a11! + b02! * a21!
      dest[2] = b00! * a02! + b01! * a12! + b02! * a22!

      dest[3] = b10! * a00! + b11! * a10! + b12! * a20!
      dest[4] = b10! * a01! + b11! * a11! + b12! * a21!
      dest[5] = b10! * a02! + b11! * a12! + b12! * a22!

      dest[6] = b20! * a00! + b21! * a10! + b22! * a20!
      dest[7] = b20! * a01! + b21! * a11! + b22! * a21!
      dest[8] = b20! * a02! + b21! * a12! + b22! * a22!
    }

    return dest
  }

  static applyToVector2(matrix: Float32Array, vector: ReadVector2): Vector2 {
    return new Vector2(
      vector.x * matrix[0]! + vector.y * matrix[1]! + matrix[2]!,
      vector.x * matrix[3]! + vector.y * matrix[4]! + matrix[5]!,
    )
  }
}
