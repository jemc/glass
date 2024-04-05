import { BitMask } from "./BitMask"
import { Entity } from "./Entity"
import { World } from "./World"
import {
  Component,
  ComponentClass,
  ComponentClasses,
  ComponentInstances,
  setComponentPrerequisite,
} from "./Component"

export abstract class SystemContext implements Component {
  isPaused: boolean = false
  abstract world: World
}

function SystemFor<
  C extends SystemContext,
  T extends ComponentClasses,
  S extends Partial<System<C, T>>,
>(
  context: C,
  componentTypes: T,
  overrides: S & { shouldMatchAll?: ComponentClass[] },
): System<C, T> & S {
  // If the `shouldMatchAll` property is set, then for every component type
  // in that list, set a prerequisite relationship with every other component
  // type in the list.
  if (overrides.shouldMatchAll) {
    overrides.shouldMatchAll.forEach((componentType) => {
      componentTypes.forEach((prerequisiteType) => {
        if (componentType !== prerequisiteType)
          setComponentPrerequisite(componentType, prerequisiteType)
      })
    })
  }

  // Return the System object.
  return Object.assign(new System<C, T>(context, componentTypes), overrides)
}

export type SystemFactory<
  C extends SystemContext = SystemContext,
  T extends ComponentClasses = ComponentClass[],
> = (context: C) => System<C, T>

export class System<
  C extends SystemContext = SystemContext,
  T extends ComponentClasses = ComponentClass[],
> {
  static readonly for = SystemFor

  readonly _contextComponentType: ComponentClass
  readonly _requiredBits = new BitMask()
  readonly _entities = new Map<Entity, ComponentInstances<T>>()

  constructor(
    readonly context: C,
    readonly componentTypes: T,
  ) {
    this._contextComponentType = this.context
      .constructor as unknown as ComponentClass
    // TODO: How to enforce this properly with the type system?
    if (this._contextComponentType.componentId === undefined)
      throw new Error("System context must be a component")
  }

  get world() {
    return this.context.world
  }

  setEntityComponents(entity: Entity, components: ComponentInstances<T>) {
    const priorSize = this._entities.size
    this._entities.set(entity, components)

    if (priorSize !== this._entities.size)
      this.runEachAdded(entity, ...components)
    else this.runEachModified(entity, ...components)

    this.runEachSet(entity, ...components)
  }

  removeEntityIfPresent(entity: Entity) {
    const priorSize = this._entities.size
    this._entities.delete(entity)

    if (priorSize !== this._entities.size) this.runEachRemoved(entity)
  }

  run(entities: Map<Entity, ComponentInstances<T>>) {
    for (const [entity, components] of entities.entries()) {
      this.runEach(entity, ...components)
    }
  }

  runEach(entity: Entity, ...components: ComponentInstances<T>) {}

  runEachAdded(entity: Entity, ...components: ComponentInstances<T>) {}
  runEachModified(entity: Entity, ...components: ComponentInstances<T>) {}
  runEachSet(entity: Entity, ...components: ComponentInstances<T>) {}
  runEachRemoved(entity: Entity) {}
}
