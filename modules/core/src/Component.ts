import { Entity } from "./Entity"
import { EntityPool } from "./EntityPool"

export interface Component {
  readonly constructor: Function
  readonly collectionEntity?: Entity
}

export type ComponentClass<T extends {} = {}> = {
  readonly name: string
  readonly prototype: T & Component
  readonly componentId: Entity
}

// This hack forces TypeScript to treat the list of classes as a tuple
// instead of an array, when used as an inferred type parameter.
// This allows us to infer a type like `[Foo, Bar]` instead of `(Foo | Bar)[]`.
export type ComponentClasses = [ComponentClass] | ComponentClass[]

// This type maps a tuple of class types to their corresponding instance types.
// For example, the type `ComponentInstances<[typeof Foo, typeof Bar]>`
// evaluates to `[Foo, Bar]` (for a Foo and Bar that are component classes).
export type ComponentInstances<T extends ComponentClasses> = {
  [P in keyof T]: T[P]["prototype"]
}

// In this private pool we will allocate component IDs as entities.
// We control access to the pool by keeping it private - it is only usable via
// abstraction of the following functions which interact with it.
const pool = new EntityPool()
const componentsById: ComponentClass[] = []

// Register a new component statically with a line like this inside the class:
//   static readonly componentId = registerComponent(this)
//
// This will allocate a unique (sequential) ID for the component class,
// which is also usable as an Entity ID in later Worlds that get created.
export function registerComponent(constructor: ComponentClass): number {
  if (Object.isFrozen(pool))
    throw new Error(
      "A component can only be registered statically before any world is " +
        "created. After that they can only be registered dynamically " +
        "with an individual world (which is not yet supported).",
    )

  const componentId = pool.alloc()
  componentsById[componentId] = constructor

  return componentId
}

// Get the component class for a given component ID.
// This is intended for use by the World class.
export function getComponentClassById(id: number): ComponentClass | undefined {
  return componentsById[id]
}

// This function is intended for creating new Worlds, which reserve the
// entity IDs that were allocated for component IDs.
// Note that this requires freezing the pool, which prevents further
// components from being statically registered after this function is called.
export function newEntityPoolWithStaticComponentsReserved(): EntityPool {
  Object.freeze(pool)
  return new EntityPool(pool)
}
