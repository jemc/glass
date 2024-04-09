import {
  registerComponent,
  Entity,
  ButtonState,
  SystemContext,
  Phase,
  Component,
} from "@glass/core"
import { Opal } from "@glass/opal"
import { FOCUSED_MENU_ENTITY, ACTIVE_MENU_ENTITY } from "./Zircon.private"
import { setFocusedMenuEntity, setActiveMenuEntity } from "./Menu"
import {
  MenuNavigateSystem,
  MenuSetsStatusSystem,
  RenderTextSystem,
  RenderChunkedGaugeOfSystem,
} from "."

export class Context extends SystemContext {
  static readonly componentId = registerComponent(this)

  readonly buttons: ButtonState
  readonly world = this.opal.world
  readonly agate = this.opal.agate

  constructor(readonly opal: Opal.Context) {
    super()

    this.buttons = new ButtonState(this.world.clock)

    this.world.addSystem(Phase.Impetus, MenuNavigateSystem, this)
    this.world.addSystem(Phase.Impetus, MenuSetsStatusSystem, this)
    this.world.addSystem(Phase.PreRender, RenderTextSystem, this)
    this.world.addSystem(Phase.PreRender, RenderChunkedGaugeOfSystem, this)
  }

  create(...components: Component[]): number {
    return this.world.create(this.agate, this.opal, this, ...components)
  }

  // Get the menu entity that is currently focused.
  //
  // Focus moves between menu items as the user navigates menus.
  //
  // Pressing the activate button will activate the focused menu item, if any.
  get focusedMenuEntity() {
    return this[FOCUSED_MENU_ENTITY]
  }
  [FOCUSED_MENU_ENTITY]?: Entity
  set focusedMenuEntity(entity: Entity | undefined) {
    setFocusedMenuEntity(this, entity)
  }

  // Get the menu entity that is currently active.
  //
  // The active entity updates after a menu item has been activated
  // (by pressing the activate button while it is focused).
  //
  // If the active menu item is also a menu (as in a nested hierarchy of menus),
  // one of its menu items will be the focused menu item.
  //
  // Pressing the deactivate button will deactivate the currently active
  // menu item and make it the new focused item (which implies that
  // the outer menu that contains the item will become active).
  get activeMenuEntity() {
    return this[ACTIVE_MENU_ENTITY]
  }
  [ACTIVE_MENU_ENTITY]?: Entity
  set activeMenuEntity(entity: Entity | undefined) {
    setActiveMenuEntity(this, entity)
  }
}
