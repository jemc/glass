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
import { AutoMap } from "./AutoMap"

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

export interface QueryLike<T extends ComponentClasses = ComponentClass[]> {
  readonly entities: ReadonlyMap<
    Entity,
    ComponentInstances<[...T, ...ComponentClass[]]>
  >

  readonly _requiredBits: BitMask
}

export class QueryCache {
  private queriesByContext: AutoMap<SystemContext, Map<QueryFactory, Query>> =
    new AutoMap(Map<QueryFactory, Query>)

  constructor(private world: World) {}

  get<
    C extends SystemContext = SystemContext,
    T extends ComponentClasses = ComponentClass[],
  >(context: C, factory: QueryFactory<C, T>): Query<C, T> {
    const byContext = this.queriesByContext.getOrCreate(context)
    const factoryCast = factory as unknown as QueryFactory // TODO: can we do without this?

    const query = byContext.get(factoryCast)
    if (query) return query as Query<C, T>

    const newQuery = factory(this, context)
    byContext.set(factoryCast, newQuery)

    this.world._registerNewQueryFromQueryCache(
      // TODO: can we do without this?
      newQuery as unknown as QueryLike,
    )

    return newQuery
  }

  values(): Iterable<Query> {
    const outer = this.queriesByContext
    return {
      [Symbol.iterator]() {
        const outerIter = outer.values()
        let innerIter: Iterator<Query> | null = null
        return {
          next(): IteratorResult<Query> {
            while (true) {
              if (!innerIter) {
                const outerResult = outerIter.next()
                if (outerResult.done) {
                  return { done: true, value: undefined }
                }
                innerIter = outerResult.value.values()
              }
              const innerResult = innerIter.next()
              if (!innerResult.done) {
                return { done: false, value: innerResult.value }
              } else {
                innerIter = null
              }
            }
          },
        }
      },
    }
  }
}

export type QueryFactory<
  C extends SystemContext = SystemContext,
  T extends ComponentClasses = ComponentClass[],
> = (cache: QueryCache, context: C) => Query<C, T>

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

// Utility function to iterate over the combined values for a list of queries.
export function queryListValues<T>(
  queries: Iterable<{ entities: Iterable<T> }> | undefined,
): Iterable<T> {
  if (!queries) return [].values()
  let outerIter = queries[Symbol.iterator]()
  let innerIter: Iterator<T> | null = null

  return {
    [Symbol.iterator]() {
      return {
        next: () => {
          while (true) {
            if (innerIter) {
              const innerResult = innerIter.next()
              if (!innerResult.done) return innerResult

              innerIter = null
            }

            const outerResult = outerIter.next()
            if (outerResult.done) return { done: true, value: undefined }

            innerIter = outerResult.value.entities[Symbol.iterator]()
          }
        },
      }
    },
  }
}

// Utility class to map from lists of queries to a associated values,
// where each different array identities comprised of the same queries
// are treated as the same key.
// TODO: This could be reimplemented as a more generic type similar to AutoMap.
export class QueryListMap<T> {
  // TODO: This should be a weak map to avoid keeping the arrays alive forever.
  // Need to use FinalizationRegistry to create an IterableWeakMap.
  // See https://github.com/tc39/proposal-weakrefs#iterable-weakmaps
  private map = new AutoMap<number, Map<QueryLike[], T>>(Map)

  private hash(queries: QueryLike[]): number {
    let hash = 0
    for (const query of queries) {
      hash ^= query._requiredBits.hashCode()
    }
    return hash
  }

  private areSameQueries(a: QueryLike[], b: QueryLike[]): boolean {
    if (a.length !== b.length) return false
    for (let i = 0; i < a.length; i++) {
      if (a[i] !== b[i]) return false
    }
    return true
  }

  clearAll() {
    this.map.clear()
  }

  clearInner() {
    for (const byHash of this.map.values()) {
      byHash.clear()
    }
  }

  set(key: number, queries: QueryLike[], value: T) {
    const hash = this.hash(queries)
    const byHash = this.map.getOrCreate(hash)
    byHash.set(queries, value)
  }

  get(key: number, queries: QueryLike[]): T | undefined {
    const hash = this.hash(queries)
    const byHash = this.map.get(hash)
    if (!byHash) return undefined
    for (const [key, value] of byHash.entries()) {
      if (this.areSameQueries(key, queries)) return value
    }
  }

  getOrCreate(queries: QueryLike[], create: () => T): T {
    const hash = this.hash(queries)
    const byHash = this.map.getOrCreate(hash)
    for (const [key, value] of byHash.entries()) {
      if (this.areSameQueries(key, queries)) return value
    }
    const created = create()
    byHash.set(queries, created)
    return created
  }
}
