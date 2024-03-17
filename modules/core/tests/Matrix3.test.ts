import { describe, expect, test } from "vitest"
import { Matrix3 } from "../src/Matrix3"
import { MutableVector2, Vector2 } from "../src/Vector2"

describe("Matrix3", () => {
  test("creates an identity matrix at the start", () => {
    expect(Matrix3.create()).toEqual(
      new Float32Array([
        ...[1, 0, 0], //
        ...[0, 1, 0], //
        ...[0, 0, 1], //
      ]),
    )
  })

  test("can set position, scale, and rotation", () => {
    const position = new Vector2(10, 20)
    const scale = new Vector2(2, 3)
    const rotation = new MutableVector2().setUnitRotationDegrees(0)

    const matrix = Matrix3.create()
    Matrix3.setTransformRows(matrix, position, scale, rotation.x, rotation.y)

    expect(matrix[0]).toBeCloseTo(2)
    expect(matrix[1]).toBeCloseTo(0)
    expect(matrix[2]).toBeCloseTo(10)
    expect(matrix[3]).toBeCloseTo(0)
    expect(matrix[4]).toBeCloseTo(3)
    expect(matrix[5]).toBeCloseTo(20)
    expect(matrix[6]).toBeCloseTo(0)
    expect(matrix[7]).toBeCloseTo(0)
    expect(matrix[8]).toBeCloseTo(1)

    rotation.setUnitRotationDegrees(90)
    Matrix3.setTransformRows(matrix, position, scale, rotation.x, rotation.y)

    expect(matrix[0]).toBeCloseTo(0)
    expect(matrix[1]).toBeCloseTo(-3)
    expect(matrix[2]).toBeCloseTo(10)
    expect(matrix[3]).toBeCloseTo(2)
    expect(matrix[4]).toBeCloseTo(0)
    expect(matrix[5]).toBeCloseTo(20)
    expect(matrix[6]).toBeCloseTo(0)
    expect(matrix[7]).toBeCloseTo(0)
    expect(matrix[8]).toBeCloseTo(1)
  })

  test("can multiply two matrices", () => {
    const a = new Float32Array([
      ...[1, 2, 3], //
      ...[4, 5, 6], //
      ...[7, 8, 9], //
    ])
    const b = new Float32Array([
      ...[9, 8, 7], //
      ...[6, 5, 4], //
      ...[3, 2, 1], //
    ])
    const dest = Matrix3.create()

    Matrix3.multiply(a, b, dest)

    expect(dest).toEqual(
      new Float32Array([
        ...[90, 114, 138], //
        ...[54, 69, 84], //
        ...[18, 24, 30], //
      ]),
    )
  })

  test("can be applied to a vector", () => {
    const matrix = new Float32Array([
      ...[1, 2, 3], //
      ...[4, 5, 6], //
      ...[7, 8, 9], //
    ])
    const vector = new Vector2(10, 20)

    expect(Matrix3.applyToVector2(matrix, vector)).toEqual(new Vector2(53, 146))
  })
})
