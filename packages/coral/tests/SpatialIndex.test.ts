import { describe, expect, test } from "vitest"
import { World, Entity, Vector2 } from "@glass/core"
import { Agate } from "@glass/agate"
import { Opal } from "@glass/opal"
import { Coral } from "@glass/coral"

describe("SpatialIndex", () => {
  test("it tracks presence of entities in a 64x64 pixel grid of cells", () => {
    const world = new World()
    const agate = new Agate.Context(world)
    const opal = new Opal.Context(agate, {
      canvas: document.createElement("canvas"),
    })
    const coral = new Coral.Context(opal)

    const spaceA = new Coral.SpatialIndex()
    const spaceB = new Coral.SpatialIndex()
    const a = coral.create(spaceA)
    const b = coral.create(spaceB)

    function tick() {
      world.clock.tick(world.clock.timestamp + 1)
    }
    function createPoint(within: Entity, x: number, y: number) {
      return coral.create(
        new Opal.Position(x, y),
        new Opal.PositionWithin(within),
      )
    }
    function createRect(
      within: Entity,
      x: number,
      y: number,
      ...statusNames: string[]
    ) {
      const status = new Agate.Status({
        point: { stops: ["wide", "tall"] },
        wide: { stops: ["point"] },
        tall: { stops: ["point"] },
      })
      for (const name of statusNames) status.set(name)
      return coral.create(
        status,
        new Opal.Position(x, y),
        new Opal.PositionWithin(within),
        new Coral.Bounds(),
        new Coral.StatusSetsBounds([
          [
            ["wide", "tall", "upperRight"],
            [100, 100, 50, -50],
          ],
          [
            ["wide", "tall"],
            [100, 100, 0, 0],
          ],
          [
            ["wide", "upperRight"],
            [100, 4, 50, -2],
          ],
          [["wide"], [100, 4, 0, 0]],
          [
            ["tall", "upperRight"],
            [4, 100, 2, -50],
          ],
          [["tall"], [4, 100, 0, 0]],
          [
            ["point", "upperRight"],
            [0, 0, 2, -2],
          ],
          [["point"], [0, 0, 0, 0]],
          [["upperRight"], [4, 4, 2, -2]],
          [[], [4, 4, 0, 0]],
        ]),
      )
    }
    function queryPoint(space: Coral.SpatialIndex, x: number, y: number) {
      return [...space.entitiesInCellForPoint(world, new Vector2(x, y))]
    }
    function queryEntity(space: Coral.SpatialIndex, entity: Entity) {
      return [...Coral.SpatialIndex.entitiesInCellsForEntity(world, entity)]
    }

    const pointA_8_8 = createPoint(a, 8, 8)
    const pointA_8_neg8 = createPoint(a, 8, -8)
    const pointA_neg8_8 = createPoint(a, -8, 8)
    const pointA_neg8_neg8 = createPoint(a, -8, -8)
    const pointA_63_63 = createPoint(a, 63, 63)
    const pointA_63_64 = createPoint(a, 63, 64)
    const pointA_64_63 = createPoint(a, 64, 63)
    const pointA_64_64 = createPoint(a, 64, 64)
    const pointA_63_neg64 = createPoint(a, 63, -64)
    const pointA_63_neg65 = createPoint(a, 63, -65)
    const pointA_64_neg64 = createPoint(a, 64, -64)
    const pointA_64_neg65 = createPoint(a, 64, -65)

    const pointB_8_8 = createPoint(b, 8, 8)

    tick()
    expect(queryPoint(spaceA, 0, 0)).toEqual([pointA_8_8, pointA_63_63])
    expect(queryPoint(spaceB, 0, 0)).toEqual([pointB_8_8])
    expect(queryPoint(spaceA, 0, -1)).toEqual([pointA_8_neg8, pointA_63_neg64])
    expect(queryPoint(spaceA, -1, 0)).toEqual([pointA_neg8_8])
    expect(queryPoint(spaceA, -1, -1)).toEqual([pointA_neg8_neg8])
    expect(queryPoint(spaceA, 50, 50)).toEqual([pointA_8_8, pointA_63_63])
    expect(queryPoint(spaceA, 50, 100)).toEqual([pointA_63_64])
    expect(queryPoint(spaceA, 100, 50)).toEqual([pointA_64_63])
    expect(queryPoint(spaceA, 100, 100)).toEqual([pointA_64_64])
    expect(queryPoint(spaceA, 50, -100)).toEqual([pointA_63_neg65])
    expect(queryPoint(spaceA, 100, -50)).toEqual([pointA_64_neg64])
    expect(queryPoint(spaceA, 100, -100)).toEqual([pointA_64_neg65])

    const rectA_0_0 = createRect(a, 0, 0)
    const rectA_32_32 = createRect(a, 32, 32)
    const rectA_64_64 = createRect(a, 64, 64)
    const rectA_64_neg64 = createRect(a, 64, -64)

    tick()
    // A small rectangle at (0,0 has) a presence in 4 cells,
    // because it sits on a grid corner.
    expect(queryEntity(spaceA, rectA_0_0)).toEqual([
      pointA_neg8_neg8,
      pointA_8_neg8,
      pointA_63_neg64,
      rectA_64_neg64,
      pointA_neg8_8,
      pointA_8_8,
      pointA_63_63,
      rectA_32_32,
      rectA_64_64,
    ])
    // A small rectangle at (32,32) has a presence in only one cell,
    // because it sits in the middle of that grid cell.
    expect(queryEntity(spaceA, rectA_32_32)).toEqual([
      pointA_8_8,
      pointA_63_63,
      rectA_0_0,
      rectA_64_64,
    ])
    // A small rectangle at (64,64) has a presence in 4 cells,
    // because it sits on a grid corner.
    expect(queryEntity(spaceA, rectA_64_64)).toEqual([
      pointA_8_8,
      pointA_63_63,
      rectA_0_0,
      rectA_32_32,
      pointA_64_63,
      pointA_63_64,
      pointA_64_64,
    ])
    // A small rectangle at (64,-64) has a presence in 4 cells,
    // because it sits on a grid corner.
    expect(queryEntity(spaceA, rectA_64_neg64)).toEqual([
      pointA_63_neg65,
      pointA_64_neg65,
      pointA_8_neg8,
      pointA_63_neg64,
      rectA_0_0,
      pointA_64_neg64,
    ])

    // A wide rectangle at (32,32) has a presence in 3 cells,
    // because it is centered in the middle of a cell and reaches
    // horizontally into two other cells.
    world
      .get(rectA_32_32, Agate.Status)!
      .setMany({ wide: true, upperRight: false })
    tick()
    expect(queryEntity(spaceA, rectA_32_32)).toEqual([
      pointA_8_8,
      pointA_63_63,
      rectA_0_0,
      rectA_64_64,
      pointA_neg8_8,
      pointA_64_63,
    ])

    // A wide rectangle offset to the upper right has a presence in 3 cells,
    // because it begins just to the upper-right of the middle of a cell,
    // and reaches the two next cells to the right.
    world
      .get(rectA_32_32, Agate.Status)!
      .setMany({ wide: true, upperRight: true })
    tick()
    expect(queryEntity(spaceA, rectA_32_32)).toEqual([
      pointA_8_8,
      pointA_63_63,
      rectA_0_0,
      rectA_64_64,
      pointA_64_63,
    ])

    // A tall rectangle at (32,32) has a presence in 3 cells,
    // because it is centered in the middle of a cell and reaches
    // vertically into two other cells.
    world
      .get(rectA_32_32, Agate.Status)!
      .setMany({ wide: false, tall: true, upperRight: false })
    tick()
    expect(queryEntity(spaceA, rectA_32_32)).toEqual([
      pointA_8_8,
      pointA_63_63,
      rectA_0_0,
      rectA_64_64,
      pointA_8_neg8,
      pointA_63_neg64,
      rectA_64_neg64,
      pointA_63_64,
    ])

    // A tall rectangle offset to the upper right has a presence in 3 cells,
    // because it begins just to the upper-right of the middle of a cell,
    // and reaches the two next cells above.
    world
      .get(rectA_32_32, Agate.Status)!
      .setMany({ tall: true, upperRight: true })
    tick()
    expect(queryEntity(spaceA, rectA_32_32)).toEqual([
      pointA_8_8,
      pointA_63_63,
      rectA_0_0,
      rectA_64_64,
      pointA_8_neg8,
      pointA_63_neg64,
      rectA_64_neg64,
      pointA_63_neg65,
    ])

    // A wide and tall rectangle at (32,32) has a presence in 9 cells,
    // because it is centered in the middle of a cell and reaches
    // horizontally and vertically in a 3x3 set of cells.
    world
      .get(rectA_32_32, Agate.Status)!
      .setMany({ wide: true, tall: true, upperRight: false })
    tick()
    expect(queryEntity(spaceA, rectA_32_32)).toEqual([
      pointA_8_8,
      pointA_63_63,
      rectA_0_0,
      rectA_64_64,
      pointA_8_neg8,
      pointA_63_neg64,
      rectA_64_neg64,
      pointA_neg8_neg8,
      pointA_64_neg64,
      pointA_neg8_8,
      pointA_64_63,
      pointA_63_64,
      pointA_64_64,
    ])

    // A wide&tall rectangle offset to the upper right has presence in 9 cells,
    // because it begins just to the upper-right of the middle of a cell,
    // and reaches the two next rows above and columns to the right.
    world
      .get(rectA_32_32, Agate.Status)!
      .setMany({ wide: true, tall: true, upperRight: true })
    tick()
    expect(queryEntity(spaceA, rectA_32_32)).toEqual([
      pointA_8_8,
      pointA_63_63,
      rectA_0_0,
      rectA_64_64,
      pointA_8_neg8,
      pointA_63_neg64,
      rectA_64_neg64,
      pointA_64_neg64,
      pointA_64_63,
      pointA_63_neg65,
      pointA_64_neg65,
    ])

    // A point at (32,32) has a presence in just one cell again.
    world
      .get(rectA_32_32, Agate.Status)!
      .setMany({ point: true, upperRight: false })
    tick()
    expect(queryEntity(spaceA, rectA_32_32)).toEqual([
      pointA_8_8,
      pointA_63_63,
      rectA_0_0,
      rectA_64_64,
    ])

    // Can't query an entity which isn't in the spatial index.
    const notInSpace = coral.create(new Opal.Position(0, 0))
    tick()
    expect(() => queryEntity(spaceA, notInSpace)).toThrow(
      /not in a SpatialIndex/,
    )
    // Setting it within space B will make it queryable in SpatialIndex B.
    world.set(notInSpace, [new Opal.PositionWithin(b)])
    tick()
    expect(queryEntity(spaceB, notInSpace)).toEqual([pointB_8_8])
  })
})
