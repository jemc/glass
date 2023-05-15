import { describe, expect, test } from "@jest/globals"
import { registerComponent, getComponentClassById } from "../src/Component"
import { World } from "../src/World"

class A {
  static readonly componentId = registerComponent(this)
}
class B {
  static readonly componentId = registerComponent(this)
}
class C {
  static readonly componentId = registerComponent(this)
}

describe("registerComponent", () => {
  test("assigns each new sequential id at each invocation", () => {
    const first = A.componentId

    expect(A.componentId).toBe(first + 0)
    expect(B.componentId).toBe(first + 1)
    expect(C.componentId).toBe(first + 2)

    expect(getComponentClassById(first + 0)).toBe(A)
    expect(getComponentClassById(first + 1)).toBe(B)
    expect(getComponentClassById(first + 2)).toBe(C)
  })

  test("throws an error if called after the first world is created", () => {
    registerComponent(A) // doesn't throw

    new World() // implicitly freezes the component pool

    expect(() => registerComponent(A)).toThrow()
  })
})
