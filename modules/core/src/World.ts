import {
  Component,
  ComponentClass,
  ComponentClasses,
  getComponentClassById,
  newEntityPoolWithStaticComponentsReserved,
} from "./Component"
import { Entity } from "./Entity"
import { System } from "./System"
import { Clock } from "./Clock"
import { BitMask } from "./BitMask"

const ComponentStorage = Array
type ComponentStorage = unknown[]

export class World {
  private storage: ComponentStorage[] = []
  private entityBitMasks: BitMask[] = []

  private entityPool = newEntityPoolWithStaticComponentsReserved()
  private systems: System[] = []

  clock: Clock

  constructor() {
    this.clock = new Clock(() => this.run())
  }

  startRunning() {
    this.clock.startRunning()
  }

  systemFor<T extends ComponentClasses>(
    componentTypes: T,
    overrides: Partial<System<T>>,
  ): System<T> {
    return Object.assign(new System<T>(componentTypes), overrides)
  }

  create(components?: Component[]): Entity {
    const entity = this.entityPool.alloc()
    if (components) this.set(entity, components)
    return entity
  }

  // Returns a debug-friendly object with the components of the given entity.
  debugInfoFor(entity: Entity) {
    const info: { [key: string]: unknown } = {}
    this.storage.forEach((componentStorage, componentId) => {
      const component = componentStorage?.[entity]
      if (!component) return

      const componentName =
        getComponentClassById(componentId)?.name ?? `${componentId}`
      info[componentName] = component
    })
    return info
  }

  destroy(entity: Entity): void {
    this.systems.forEach((system) => system.removeEntityIfPresent(entity))
    this.entityBitMasks[entity]?.clear()
    this.storage.forEach((componentStorage) =>
      componentStorage ? (componentStorage[entity] = undefined) : undefined,
    )
    this.entityPool.free(entity)
  }

  get<T extends ComponentClass>(
    entity: Entity,
    componentType: T,
  ): T["prototype"] | undefined {
    return this.storage[componentType.componentId]?.[entity] as
      | T["prototype"]
      | undefined
  }

  set(entity: Entity, components: ComponentClass["prototype"][]) {
    const bitMask = (this.entityBitMasks[entity] ??= new BitMask(62))

    for (const component of components) {
      const { componentId } = component.constructor

      bitMask.set(componentId, true)
      const componentStorage = (this.storage[componentId] ??=
        new ComponentStorage())

      componentStorage[entity] = component
    }

    this.updateSystemsForEntity(entity, bitMask)
  }

  remove(entity: Entity, componentTypes: ComponentClasses) {
    const bitMask = this.entityBitMasks[entity]
    if (!bitMask) return

    for (const componentType of componentTypes) {
      const { componentId } = componentType

      bitMask.set(componentId, false)
      const componentStorage = this.storage[componentId]
      if (componentStorage) componentStorage[entity] = undefined
    }

    this.updateSystemsForEntity(entity, bitMask)
  }

  addSystem(system: System) {
    this.systems.push(system)
    system.componentTypes.forEach(({ componentId }) => {
      system._requiredBits.set(componentId, true)
    })
    this.entityBitMasks.forEach((bitMask, entity) => {
      this.updateSystemForEntity(system, entity, bitMask)
    })
  }

  addSystems(systems: System[] = []) {
    for (const system of systems) this.addSystem(system)
  }

  run() {
    for (const system of this.systems) system.run(system._entities)
  }

  private updateSystemsForEntity(entity: Entity, bits: BitMask) {
    for (const system of this.systems) {
      this.updateSystemForEntity(system, entity, bits)
    }
  }

  private updateSystemForEntity(system: System, entity: Entity, bits: BitMask) {
    if (bits.isSuperSetOf(system._requiredBits)) {
      system.setEntityComponents(
        entity,
        system.componentTypes.map((component) => this.get(entity, component)!),
      )
    } else {
      system.removeEntityIfPresent(entity)
    }
  }
}
