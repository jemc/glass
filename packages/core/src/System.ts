import { Entity } from "./Entity"
import { World } from "./World"
import {
  Component,
  ComponentClass,
  ComponentClasses,
  ComponentInstances,
} from "./Component"
import { Query } from "./Query"

export abstract class SystemContext implements Component {
  isPaused: boolean = false

  abstract world: World

  abstract create(...components: Component[]): Entity
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
  return Object.assign(
    new System<C, T>(Query.for(context, componentTypes, overrides)),
    overrides,
  )
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

  constructor(readonly query: Query<C, T>) {}

  get world() {
    return this.query.world
  }
  get context() {
    return this.query.context
  }
  get componentTypes() {
    return this.query.componentTypes
  }

  setEntityComponents(entity: Entity, components: ComponentInstances<T>) {
    if (this.query.addEntity(entity, components)) {
      this.runEachAdded(entity, ...components)
    } else {
      this.runEachModified(entity, ...components)
    }
    this.runEachSet(entity, ...components)
  }

  removeEntityIfPresent(entity: Entity) {
    if (this.query.removeEntity(entity)) {
      this.runEachRemoved(entity)
    }
  }

  run(entities: ReadonlyMap<Entity, ComponentInstances<T>>) {
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
