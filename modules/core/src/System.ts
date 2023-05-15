import { BitMask } from "./BitMask"
import { Entity } from "./Entity"
import {
  ComponentClass,
  ComponentClasses,
  ComponentInstances,
} from "./Component"

export class System<T extends ComponentClasses = ComponentClass[]> {
  constructor(public componentTypes: T) {}

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
