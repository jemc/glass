import { BitMask } from "./BitMask"
import { Entity } from "./Entity"
import { World } from "./World"
import {
  ComponentClass,
  ComponentClasses,
  ComponentInstances,
  setComponentPrerequisite,
} from "./Component"

function SystemFor<T extends ComponentClasses, S extends Partial<System<T>>>(
  componentTypes: T,
  overrides: S & { shouldMatchAll?: ComponentClass[] },
): System<T> & S {
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
  return Object.assign(new System<T>(componentTypes), overrides)
}

export type SystemFactory<T extends ComponentClasses = ComponentClass[]> = (
  world: World,
) => System<T>

export class System<T extends ComponentClasses = ComponentClass[]> {
  static readonly for = SystemFor

  constructor(readonly componentTypes: T) {}

  _requiredBits = new BitMask()
  _entities = new Map<Entity, ComponentInstances<T>>()

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
