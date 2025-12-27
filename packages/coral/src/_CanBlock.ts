import {
  Entity,
  QueryLike,
  QueryListMap,
  queryListValues,
  registerComponent,
  System,
} from "@glass/core"
import { Context } from "./Context"
import { BlockedBy } from "./BlockedBy"

// This is a private component, only created and used internally in Coral.
// It gets updated every frame to track which entities can be BlockedBy a
// given potentially-blocking entity.
export class _CanBlock {
  static readonly componentId = registerComponent(this)

  readonly entitySets: Set<ReadonlySet<Entity>> = new Set()
  readonly entitySetsDownwardOnly: Set<ReadonlySet<Entity>> = new Set()

  constructor() {}
}

// Clear the entity sets on all _CanBlock components.
export const _CanBlockRefreshSystem1 = (coral: Context) =>
  System.for(coral, [_CanBlock], {
    runEach(entity, canBlock) {
      canBlock.entitySets.clear()
      canBlock.entitySetsDownwardOnly.clear()
    },
  })

// Incrementally populate the entity sets on all _CanBlock components, using
// caching to reuse the same sets for entities with the same BlockedBy queries.
export const _CanBlockRefreshSystem2 = (coral: Context) =>
  System.for(coral, [BlockedBy], {
    _cache: new QueryListMap<Set<Entity>>(),

    run(entities) {
      this._cache.clearInner()

      for (const [entity, [blockedBy]] of entities) {
        const canBlockEntities = this._cache.getOrCreate(
          blockedBy.queries as unknown as QueryLike[],
          () => {
            const canBlockEntities = new Set<Entity>()

            for (const [blockedByEntity] of queryListValues(
              blockedBy.queries,
            )) {
              coral.world
                .getOrCreate(blockedByEntity, _CanBlock, () => new _CanBlock())
                .entitySets.add(canBlockEntities)
            }

            return canBlockEntities
          },
        )
        canBlockEntities.add(entity)

        if (blockedBy.additionalQueries.downwardOnly) {
          const canBlockEntitiesDownwardOnly = this._cache.getOrCreate(
            blockedBy.additionalQueries.downwardOnly as unknown as QueryLike[],
            () => {
              const canBlockEntitiesDownwardOnly = new Set<Entity>()

              for (const [blockedByEntity] of queryListValues(
                blockedBy.additionalQueries.downwardOnly,
              )) {
                coral.world
                  .getOrCreate(
                    blockedByEntity,
                    _CanBlock,
                    () => new _CanBlock(),
                  )
                  .entitySetsDownwardOnly.add(canBlockEntitiesDownwardOnly)
              }

              return canBlockEntitiesDownwardOnly
            },
          )
          canBlockEntitiesDownwardOnly.add(entity)
        }
      }
    },
  })
