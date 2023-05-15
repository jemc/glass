import { describe, expect, test } from "@jest/globals"
import { AutoMap } from "../src/AutoMap"

describe("AutoMap", () => {
  test("can get or create a creatable value by key", () => {
    const map = new AutoMap<string, number[]>(Array)

    map.getOrCreate("a").push(1)
    map.getOrCreate("a").push(2)
    map.getOrCreate("b").push(3)
    map.getOrCreate("b").push(4)

    expect(map.get("a")).toEqual([1, 2])
    expect(map.get("b")).toEqual([3, 4])
  })
})
