import {
  registerComponent,
  World,
  Entity,
  System,
  Vector2,
  Button,
  Status,
} from "@glass/core"
import { Opal } from "@glass/opal"
import { Context } from "./Context"
import {
  ACTIVE_MENU_ENTITY,
  FOCUSED_MENU_ENTITY,
  MENU_MOST_RECENT_FOCUS,
  SCRATCH_VECTOR,
} from "./Zircon.private"

const DIR_UP = new Vector2(0, -1)
const DIR_DOWN = new Vector2(0, 1)
const DIR_LEFT = new Vector2(-1, 0)
const DIR_RIGHT = new Vector2(1, 0)

export class MenuConfig {
  wrapX: boolean = true
  wrapY: boolean = true
}

export class Menu {
  static readonly componentId = registerComponent(this)

  readonly config: MenuConfig
  readonly collectionEntity?: Entity

  private [MENU_MOST_RECENT_FOCUS]: Entity | undefined

  constructor(config: Partial<MenuConfig> & { inside?: Entity } = {}) {
    this.collectionEntity = config.inside
    this.config = Object.assign(new MenuConfig(), config)
    delete (this.config as any).inside
  }
}

export const MenuNavigateSystem = (world: World) => {
  // For any action which changes the active entity for a context
  // (i.e. activations and deactivations), we need to save them in a batch
  // to run at the end. Otherwise, we risk double-dipping on our `runEach`
  // method (e.g., handling an activation button press to activate an inner
  // item, then later in the entity iteration using that same button press
  // again to activate whatever was inside _that_ item).
  // Therefore, we use this `effects` array to buffer the effects,
  // and we'll run them in a big batch at the end.
  const effects: (() => void)[] = []

  return System.for([Context, Menu], {
    shouldMatchAll: [Menu],

    run(entities) {
      effects.splice(0, effects.length)
      for (const [entity, components] of entities.entries()) {
        this.runEach(entity, ...components)
      }
      effects.forEach((effect) => effect())
    },

    runEach(entity, context, menu) {
      // Navigation is only possible in the active menu.
      if (context.activeMenuEntity !== entity) return

      // Get the menu items inside this menu.
      const childEntities = world.getCollected(entity, Menu)

      // If no menu item is focused, focus the first child of this menu.
      if (context.focusedMenuEntity === undefined) {
        context[FOCUSED_MENU_ENTITY] = childEntities.values().next().value
      }

      // Respond to input to navigate the menu.
      if (context.buttons.isPressedJustNow(Button.A))
        effects.push(() => activateFocusedEntity(world, context))
      else if (context.buttons.isPressedJustNow(Button.B))
        effects.push(() => deactivateActiveEntity(world, context))
      else if (context.buttons.isPressedJustNow(Button.Up))
        moveFocusInDirection(world, context, menu, childEntities, DIR_UP)
      else if (context.buttons.isPressedJustNow(Button.Down))
        moveFocusInDirection(world, context, menu, childEntities, DIR_DOWN)
      else if (context.buttons.isPressedJustNow(Button.Left))
        moveFocusInDirection(world, context, menu, childEntities, DIR_LEFT)
      else if (context.buttons.isPressedJustNow(Button.Right))
        moveFocusInDirection(world, context, menu, childEntities, DIR_RIGHT)
    },
  })
}

export const MenuSetsStatusSystem = (world: World) =>
  System.for([Context, Menu, Status], {
    runEach(entity, context, menu, status) {
      status.set("active", entity === context.activeMenuEntity)
      status.set("focused", entity === context.focusedMenuEntity)
    },
  })

// Set the focus to the given entity, setting its parent menu as active.
// Throws an error if the entity is not in a menu.
export function setFocusedMenuEntity(
  context: Context,
  entity: Entity | undefined,
) {
  const { world } = context

  // If no entity is given, focus the first item in the active menu (if any).
  if (entity === undefined) {
    context[FOCUSED_MENU_ENTITY] = context.activeMenuEntity
      ? world.getCollected(context.activeMenuEntity, Menu)?.values().next()
          .value
      : undefined
    return
  }

  // Make sure the entity is in a menu.
  const menu = world.get(entity, Menu)
  if (!menu) throw new Error(`Entity ${entity} has no Menu component.`)

  // Save the most recent focus to the old menu if we can.
  const oldParentEntity = context.activeMenuEntity
  if (oldParentEntity !== undefined) {
    const oldParentMenu = world.get(oldParentEntity, Menu)
    if (oldParentMenu)
      oldParentMenu[MENU_MOST_RECENT_FOCUS] = context.focusedMenuEntity
  }

  // Save the new focus to the new menu if we can.
  const newParentEntity = menu.collectionEntity
  if (newParentEntity) {
    const newParentMenu = world.get(newParentEntity, Menu)
    if (newParentMenu) newParentMenu[MENU_MOST_RECENT_FOCUS] = entity
  }

  // Set the new menu state.
  context[FOCUSED_MENU_ENTITY] = entity
  context[ACTIVE_MENU_ENTITY] = newParentEntity
}

// Activate the given menu item. If a menu, one of its items will be focused.
// If we have a memory of the last focused item, we'll use that.
// Otherwise, the first registered item in the menu will be focused.
export function setActiveMenuEntity(
  context: Context,
  entity: Entity | undefined,
) {
  const { world } = context

  // If no entity is given, clear the relevant state.
  if (entity === undefined) {
    context[ACTIVE_MENU_ENTITY] = undefined
    context[FOCUSED_MENU_ENTITY] = undefined
    return
  }

  // Set the entity as active.
  context[ACTIVE_MENU_ENTITY] = entity
  context[FOCUSED_MENU_ENTITY] = undefined

  // If the focused item is a menu, focus one of its child menu items -
  // either the most recently focused item (if available and still in the menu)
  // or the first item (the first one that was registered as an InMenu in it).
  const possibleFoci = world.getCollected(entity, Menu)
  if (possibleFoci.size > 0) {
    const menu = world.get(entity, Menu)
    if (menu) {
      const mostRecentFocus = menu[MENU_MOST_RECENT_FOCUS]
      if (mostRecentFocus !== undefined && possibleFoci.has(mostRecentFocus)) {
        context[FOCUSED_MENU_ENTITY] = mostRecentFocus
      } else {
        const newFocus = possibleFoci.values().next().value
        menu[MENU_MOST_RECENT_FOCUS] = newFocus
        context[FOCUSED_MENU_ENTITY] = newFocus
      }
    } else {
      const newFocus = possibleFoci.values().next().value
      context[FOCUSED_MENU_ENTITY] = newFocus
    }
  }
}

function activateFocusedEntity(world: World, context: Context) {
  const entity = context.focusedMenuEntity
  if (entity === undefined) return

  setActiveMenuEntity(context, entity)
}

function deactivateActiveEntity(world: World, context: Context) {
  const entity = context.activeMenuEntity
  if (entity === undefined) return

  // Save the new focus to the new menu if we can.
  const newMenuEntity = world.get(entity, Menu)?.collectionEntity
  if (newMenuEntity) {
    const newMenu = world.get(newMenuEntity, Menu)
    if (newMenu) newMenu[MENU_MOST_RECENT_FOCUS] = entity
  }

  // The previously active item becomes now the focused item,
  // and if it is an item in a higher menu, that higher menu becomes active.
  context[FOCUSED_MENU_ENTITY] = entity
  context[ACTIVE_MENU_ENTITY] = newMenuEntity
}

function moveFocusInDirection(
  world: World,
  context: Context,
  menu: Menu,
  menuItemEntities: ReadonlySet<Entity>,
  direction: Vector2,
) {
  const { focusedMenuEntity } = context
  if (!focusedMenuEntity) return

  const focusedPosition = world.get(focusedMenuEntity, Opal.Position)
  if (!focusedPosition) return

  const menuItemPositions = world.getForMany(menuItemEntities, Opal.Position)
  menuItemPositions.delete(focusedMenuEntity) // exclude the focused entity

  let nearestEntity = findNearestEntityInDirection(
    menuItemPositions,
    focusedPosition,
    direction,
    menu.config,
  )

  if (nearestEntity !== undefined) {
    menu[MENU_MOST_RECENT_FOCUS] = nearestEntity
    context[FOCUSED_MENU_ENTITY] = nearestEntity
  }
}

function findNearestEntityInDirection(
  entityPositions: Readonly<Map<number, Opal.Position>>,
  fromPosition: Readonly<Opal.Position>,
  direction: Vector2,
  config: Pick<MenuConfig, "wrapX" | "wrapY">,
  deltaX = 0,
  deltaY = 0,
) {
  let nearestEntity: Entity | undefined
  let nearestDistanceSquared = Infinity

  // Find the nearest menu item in the direction of the navigation.
  const fromX = fromPosition.x + deltaX
  const fromY = fromPosition.y + deltaY
  for (const [menuItemEntity, position] of entityPositions.entries()) {
    // Ignore menu items that are not in the direction of the navigation.
    if (
      (direction.x && direction.x * (position.x - fromX) <= 0) ||
      (direction.y && direction.y * (position.y - fromY) <= 0)
    )
      continue

    // Ignore menu items that are further away than the current nearest.
    const distanceSquared = SCRATCH_VECTOR.setTo(fromX, fromY)
      .minusEquals(position.coords)
      .magnitudeSquared()
    if (distanceSquared >= nearestDistanceSquared) continue

    // If we get here, this is the new nearest menu item.
    nearestEntity = menuItemEntity
    nearestDistanceSquared = distanceSquared
  }
  if (nearestEntity !== undefined) return nearestEntity

  // Nothing was found in the direction of navigation, so we may need to wrap.
  // Note that we check the current delta is zero, to avoid wrapping twice.
  if (direction.x !== 0 && config.wrapX && deltaX === 0) {
    const min = direction.x > 0 ? Math.min : Math.max
    let wrapX = 0
    for (const position of entityPositions.values()) {
      wrapX = min(wrapX, position.x - fromPosition.x)
    }
    if (wrapX !== 0) {
      return findNearestEntityInDirection(
        entityPositions,
        fromPosition,
        direction,
        config,
        wrapX * 1.1, // add an extra 10% in the wrap direction
        0,
      )
    }
  }
  if (direction.y !== 0 && config.wrapY && deltaY === 0) {
    const min = direction.y > 0 ? Math.min : Math.max
    let wrapY = 0
    for (const position of entityPositions.values()) {
      wrapY = min(wrapY, position.y - fromPosition.y)
    }
    if (wrapY !== 0) {
      return findNearestEntityInDirection(
        entityPositions,
        fromPosition,
        direction,
        config,
        0,
        wrapY * 1.1, // add an extra 10% in the wrap direction
      )
    }
  }
}
