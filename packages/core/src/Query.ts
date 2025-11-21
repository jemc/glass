import { SystemContext } from "./System"
import { BitMask } from "./BitMask"
import { Entity } from "./Entity"
import {
  ComponentClass,
  ComponentClasses,
  ComponentInstances,
  setComponentPrerequisite,
} from "./Component"
import { World } from "./World"

function QueryFor<
  C extends SystemContext,
  T extends ComponentClasses,
  S extends Partial<Query<C, T>>,
>(
  context: C,
  componentTypes: T,
  overrides: S & { shouldMatchAll?: ComponentClass[] },
): Query<C, T> & S {
  // If the `shouldMatchAll` property is set, then for every component type
  // in that list, set a prerequisite relationship with every other component
  // type in the list.
  if (overrides.shouldMatchAll) {
    overrides.shouldMatchAll.forEach((componentType) => {
      componentTypes.forEach((prerequisiteType) => {
        if (componentType !== prerequisiteType)
          setComponentPrerequisite(componentType, prerequisiteType)
      })
      setComponentPrerequisite(
        componentType,
        context.constructor as unknown as ComponentClass<C>,
      )
    })
  }

  // Return the Query object.
  return Object.assign(new Query<C, T>(context, componentTypes), overrides)
}

export class Query<
  C extends SystemContext = SystemContext,
  T extends ComponentClasses = ComponentClass[],
> {
  static readonly for = QueryFor

  readonly _contextComponentType: ComponentClass
  readonly _requiredBits = new BitMask()
  readonly _entities = new Map<Entity, ComponentInstances<T>>()

  get entities(): ReadonlyMap<Entity, ComponentInstances<T>> {
    return this._entities
  }

  constructor(
    readonly context: C,
    readonly componentTypes: T,
  ) {
    this._contextComponentType = this.context
      .constructor as unknown as ComponentClass
    // TODO: How to enforce this properly with the type system?
    if (this._contextComponentType.componentId === undefined)
      throw new Error("System context must be a component")

    this.initBits()
  }

  private initBits() {
    this._requiredBits.set(this._contextComponentType.componentId, true)
    this.componentTypes.forEach(({ componentId }) => {
      this._requiredBits.set(componentId, true)
    })
  }

  get world() {
    return this.context.world
  }

  addEntity(entity: Entity, components: ComponentInstances<T>): boolean {
    const priorSize = this._entities.size
    this._entities.set(entity, components)
    return priorSize !== this._entities.size
  }

  removeEntity(entity: Entity): boolean {
    const priorSize = this._entities.size
    this._entities.delete(entity)
    return priorSize !== this._entities.size
  }

  matchesEntityWithBits(world: World, entity: Entity, bits: BitMask): boolean {
    return (
      this.matchesBits(bits) &&
      world.get(entity, this._contextComponentType) === this.context
    )
  }

  matchesBits(bits: BitMask): boolean {
    return bits.isSuperSetOf(this._requiredBits)
  }
}
