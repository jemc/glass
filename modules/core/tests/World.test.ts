import { describe, expect, test } from "vitest"
import {
  World,
  Entity,
  registerComponent,
  prerequisiteComponents,
} from "../src"

// An example relationship component, referring to a given parent entity.
class LocatedIn {
  static readonly componentId = registerComponent(this)

  constructor(readonly collectionEntity: Entity) {}
}

// An example "color" component, with a named color.
class Color {
  static readonly componentId = registerComponent(this)

  constructor(readonly name: string) {}
}

// An example component that requires the two above components as prerequisites.
class RequiresColorAndLocatedIn {
  static readonly componentId = registerComponent(this)
  static readonly prerequisiteComponentIds = prerequisiteComponents(
    Color,
    LocatedIn,
  )
}

// A system for entities with color, which only tracks its members.
const colorSystemEntities = new Set<Entity>()
const ColorSystem = (world: World) =>
  world.systemFor([Color], {
    runEachSet(entity, color) {
      colorSystemEntities.add(entity)
    },
    runEachRemoved(entity) {
      colorSystemEntities.delete(entity)
    },
  })

describe("World", () => {
  test("can relate entities via one-to-many collection relationships", () => {
    const world = new World()
    const f = world.create()
    const b = world.create()
    const foo = world.create([new LocatedIn(f)])
    const bar = world.create([new LocatedIn(b)])
    const baz = world.create([new LocatedIn(b)])

    expect(world.get(foo, LocatedIn)?.collectionEntity).toBe(f)
    expect(world.get(bar, LocatedIn)?.collectionEntity).toBe(b)
    expect(world.get(baz, LocatedIn)?.collectionEntity).toBe(b)

    expect([...world.getCollected(f, LocatedIn).values()]).toEqual([foo])
    expect([...world.getCollected(b, LocatedIn).values()]).toEqual([bar, baz])

    world.set(baz, [new LocatedIn(b)]) // no effect - it was already related
    expect([...world.getCollected(b, LocatedIn).values()]).toEqual([bar, baz])

    world.set(bar, [new LocatedIn(b)]) // no effect again and order is the same
    expect([...world.getCollected(b, LocatedIn).values()]).toEqual([bar, baz])

    world.set(foo, [new LocatedIn(b)]) // removes from f and adds to b
    expect([...world.getCollected(f, LocatedIn).values()]).toEqual([])
    expect([...world.getCollected(b, LocatedIn).values()]).toEqual([
      bar,
      baz,
      foo, // it was inserted last, so it is returned last
    ])

    world.remove(baz, [LocatedIn]) // removes from b
    expect([...world.getCollected(b, LocatedIn).values()]).toEqual([bar, foo])
    world.set(baz, [new LocatedIn(b)]) // adds back to b
    expect([...world.getCollected(b, LocatedIn).values()]).toEqual([
      bar,
      foo,
      baz, // it was inserted last, so it is the new last one returned
    ])

    world.destroy(bar) // implicitly removes from b
    expect([...world.getCollected(b, LocatedIn).values()]).toEqual([foo, baz])

    world.destroy(b) // implicitly removes LocatedIn from foo and baz
    expect(world.get(foo, LocatedIn)).toBeUndefined()
    expect(world.get(baz, LocatedIn)).toBeUndefined()
  })

  test("can cleanly reuse an old entity ID after it has been destroyed", () => {
    const world = new World()
    const example = world.create()
    const parent = world.create()
    const child = world.create()
    world.addSystem(ColorSystem)

    // Create an example entity with a color and in the middle of a hierarchy.
    world.set(example, [new Color("red"), new LocatedIn(parent)])
    world.set(child, [new LocatedIn(example)])

    // The example entity has that color, is referred to by its child,
    // collects its child, and is collected by its parent.
    // It is also a member of a system that tracks entities with color.
    expect(world.get(example, Color)?.name).toBe("red")
    expect(world.get(child, LocatedIn)?.collectionEntity).toBe(example)
    expect([...world.getCollected(example, LocatedIn).values()]).toEqual([
      child,
    ])
    expect([...world.getCollected(parent, LocatedIn).values()]).toEqual([
      example,
    ])
    expect([...colorSystemEntities.values()]).toEqual([example])

    // The example entity is destroyed, destroying the above relationships
    // and freeing its entity ID to be reused in the next created entity.
    world.destroy(example)

    // The child entity is now orphaned, and the parent entity no longer
    // has any children. It's also no longer tracked by the system.
    expect(world.get(child, LocatedIn)).toBeUndefined()
    expect(world.getCollected(parent, LocatedIn).size).toBe(0)
    expect(colorSystemEntities.size).toBe(0)

    // A new entity is created, which reuses the ID of the destroyed entity.
    const newEntity = world.create()
    expect(newEntity).toBe(example)

    // The reuse is clean - the new entity has no associations.
    expect(world.get(newEntity, Color)).toBeUndefined()
    expect(world.get(child, LocatedIn)).toBeUndefined()
    expect(world.getCollected(newEntity, LocatedIn).size).toBe(0)
    expect(world.getCollected(parent, LocatedIn).size).toBe(0)
    expect(colorSystemEntities.size).toBe(0)
  })

  test("can scan for warnings about missing prerequisite components", () => {
    const world = new World()
    const entity1 = world.create([new RequiresColorAndLocatedIn()])
    const entity2 = world.create([
      new RequiresColorAndLocatedIn(),
      new Color("red"),
    ])
    const entity3 = world.create([
      new RequiresColorAndLocatedIn(),
      new LocatedIn(entity1),
    ])
    const entity4 = world.create([
      new RequiresColorAndLocatedIn(),
      new Color("blue"),
      new LocatedIn(entity3),
    ]) // no warnings for this one

    expect(world.debugScanForWarnings()).toEqual([
      {
        "entity is missing prerequisite components": {
          entity: world.debugInfoFor(entity1),
          missing: ["LocatedIn", "Color"],
        },
      },
      {
        "entity is missing prerequisite components": {
          entity: world.debugInfoFor(entity2),
          missing: ["LocatedIn"],
        },
      },
      {
        "entity is missing prerequisite components": {
          entity: world.debugInfoFor(entity3),
          missing: ["Color"],
        },
      },
    ])
  })
})
