import { describe, expect, test } from "vitest"
import { Button, Entity, World } from "@glass/core"
import { Agate } from "@glass/agate"
import { Opal } from "@glass/opal"
import { Zircon } from "@glass/zircon"

describe("Menu", () => {
  test("it allows navigation through nested menu items", () => {
    const world = new World()
    const agate = new Agate.Context(world)
    const opal = new Opal.Context(agate, {
      canvas: document.createElement("canvas"),
    })
    const zircon = new Zircon.Context(opal)

    function makeMenu(x: number, y: number, opts: { inside?: Entity } = {}) {
      const pos = new Opal.Position(x, y)
      const menu = zircon.create(
        pos,
        new Zircon.Menu(opts),
        new Agate.Status(world.clock),
      )
      return menu
    }
    function makeTerminal(x: number, y: number, opts: { inside: Entity }) {
      const pos = new Opal.Position(x, y)
      return zircon.create(
        pos,
        new Zircon.Menu(opts),
        new Agate.Status(world.clock),
      )
    }

    // Menu categories are in a perfect rhombus shape,
    // with the vertical dimension being narrower than the horizontal.
    //           Lunch
    //     Brkft       Dssrt
    //           Dinnr
    const rootMenu = makeMenu(0, 0)
    const breakfastMenu = makeMenu(10, 30, { inside: rootMenu })
    const dinnerMenu = makeMenu(30, 40, { inside: rootMenu })
    const lunchMenu = makeMenu(30, 20, { inside: rootMenu })
    const dessertMenu = makeMenu(50, 30, { inside: rootMenu })

    // Breakfast foods are in a square grid.
    //     Waffl    Panck
    //
    //     Bndct    Toast
    const pancake = makeTerminal(40, 20, { inside: breakfastMenu })
    const waffle = makeTerminal(20, 20, { inside: breakfastMenu })
    const toast = makeTerminal(40, 40, { inside: breakfastMenu })
    const benedict = makeTerminal(20, 40, { inside: breakfastMenu })

    // Lunch foods are laid out in a straight vertical line.
    //          Burgr
    //          Pizza
    //          Pasta
    //          Salad
    const salad = makeTerminal(30, 40, { inside: lunchMenu })
    const burger = makeTerminal(30, 10, { inside: lunchMenu })
    const pizza = makeTerminal(30, 20, { inside: lunchMenu })
    const pasta = makeTerminal(30, 30, { inside: lunchMenu })

    // Dinner foods are laid out in a straight horizontal line.
    //
    // Steak Chckn Salmn Seitn
    //
    const steak = makeTerminal(10, 30, { inside: dinnerMenu })
    const chicken = makeTerminal(20, 30, { inside: dinnerMenu })
    const salmon = makeTerminal(30, 30, { inside: dinnerMenu })
    const seitan = makeTerminal(40, 30, { inside: dinnerMenu })

    // Dessert foods are laid out in a top-right-to-bottom-left diagonal line.
    //                Cooki
    //          Shake
    //    Sorbt
    const cookie = makeTerminal(40, 20, { inside: dessertMenu })
    const shake = makeTerminal(30, 30, { inside: dessertMenu })
    const sorbet = makeTerminal(20, 40, { inside: dessertMenu })

    // Define some functions to make testing more ergonomic
    const allItems = [
      rootMenu,
      ...[breakfastMenu, lunchMenu, dinnerMenu, dessertMenu],
      ...[waffle, pancake, toast, benedict],
      ...[burger, pizza, pasta, salad],
      ...[steak, chicken, salmon, seitan],
      ...[cookie, shake, sorbet],
    ]
    let timestamp = 0
    function tick() {
      // Update the world.
      world.clock.tick(++timestamp)
      // Confirm statuses of menu items.
      for (const item of allItems) {
        const s = world.get(item, Agate.Status)!
        expect(s.is("focused")).toBe(item === zircon.focusedMenuEntity)
        expect(s.is("active")).toBe(item === zircon.activeMenuEntity)
      }
    }
    function afterPressing(button: Button) {
      zircon.buttons.capture(button)
      tick()
      zircon.buttons.release(button)
    }

    // Nothing is active or focused by default.
    tick()
    expect(zircon.focusedMenuEntity).toBe(undefined)
    expect(zircon.activeMenuEntity).toBe(undefined)

    // First, we set the root menu to be the active menu.
    zircon.activeMenuEntity = rootMenu
    tick()
    expect(zircon.focusedMenuEntity).toBe(breakfastMenu)
    expect(zircon.activeMenuEntity).toBe(rootMenu)

    // Pressing Right moves from Breakfast to either Lunch or Dinner
    // (which are both to the right of Breakfast and equally close).
    // Our algorithm will choose Dinner because it was declared before Lunch.
    afterPressing(Button.Right)
    expect(zircon.focusedMenuEntity).toBe(dinnerMenu)
    expect(zircon.activeMenuEntity).toBe(rootMenu)

    // Pressing Right again moves to Dessert (the only item to the right).
    afterPressing(Button.Right)
    expect(zircon.focusedMenuEntity).toBe(dessertMenu)
    expect(zircon.activeMenuEntity).toBe(rootMenu)

    // Pressing Up moves to Lunch (the only item above).
    afterPressing(Button.Up)
    expect(zircon.focusedMenuEntity).toBe(lunchMenu)
    expect(zircon.activeMenuEntity).toBe(rootMenu)

    // Pressing Down moves to Dinner (all 3 other items are below Lunch),
    // but because the rhombus is vertically narrow, Dinner is closest.
    afterPressing(Button.Down)
    expect(zircon.focusedMenuEntity).toBe(dinnerMenu)
    expect(zircon.activeMenuEntity).toBe(rootMenu)

    // Pressing A activates the focused item (i.e. the Dinner menu).
    // We haven't used this menu yet, so the first item (Steak) is focused.
    afterPressing(Button.A)
    expect(zircon.focusedMenuEntity).toBe(steak)
    expect(zircon.activeMenuEntity).toBe(dinnerMenu)

    // Pressing Right moves to Chicken.
    afterPressing(Button.Right)
    expect(zircon.focusedMenuEntity).toBe(chicken)
    expect(zircon.activeMenuEntity).toBe(dinnerMenu)

    // Pressing Up does nothing because there are no items above Chicken.
    // Wrapping around in the vertical direction does nothing, since the
    // menu layout is a perfectly flat horizontal line.
    afterPressing(Button.Up)
    expect(zircon.focusedMenuEntity).toBe(chicken)
    expect(zircon.activeMenuEntity).toBe(dinnerMenu)

    // Pressing Down does nothing because there are no items below Chicken.
    // Wrapping around in the vertical direction does nothing, since the
    // menu layout is a perfectly flat horizontal line.
    afterPressing(Button.Down)
    expect(zircon.focusedMenuEntity).toBe(chicken)
    expect(zircon.activeMenuEntity).toBe(dinnerMenu)

    // Pressing Right moves to Salmon.
    afterPressing(Button.Right)
    expect(zircon.focusedMenuEntity).toBe(salmon)
    expect(zircon.activeMenuEntity).toBe(dinnerMenu)

    // Pressing B deactivates the Dinner menu, bringing us back into the
    // Root menu, with focus still pointing to the Dinner menu.
    afterPressing(Button.B)
    expect(zircon.focusedMenuEntity).toBe(dinnerMenu)
    expect(zircon.activeMenuEntity).toBe(rootMenu)

    // Pressing A activates the Dinner menu again, this time bringing us
    // to the same place where we left off earlier (Salmon).
    afterPressing(Button.A)
    expect(zircon.focusedMenuEntity).toBe(salmon)
    expect(zircon.activeMenuEntity).toBe(dinnerMenu)

    // Pressing Right moves to Seitan.
    afterPressing(Button.Right)
    expect(zircon.focusedMenuEntity).toBe(seitan)
    expect(zircon.activeMenuEntity).toBe(dinnerMenu)

    // Pressing Right again wraps around to Steak, because wrapping is enabled.
    afterPressing(Button.Right)
    expect(zircon.focusedMenuEntity).toBe(steak)
    expect(zircon.activeMenuEntity).toBe(dinnerMenu)

    // Pressing Left wraps back around to Seitan.
    afterPressing(Button.Left)
    expect(zircon.focusedMenuEntity).toBe(seitan)
    expect(zircon.activeMenuEntity).toBe(dinnerMenu)

    // Now, if we disable X wrapping for this menu, pressing Right does nothing.
    world.get(dinnerMenu, Zircon.Menu)!.config.wrapX = false
    afterPressing(Button.Right)
    expect(zircon.focusedMenuEntity).toBe(seitan)
    expect(zircon.activeMenuEntity).toBe(dinnerMenu)

    // Pressing B deactivates the Dinner menu, bringing us back into the
    // Root menu, with focus still pointing to the Dinner menu.
    afterPressing(Button.B)
    expect(zircon.focusedMenuEntity).toBe(dinnerMenu)
    expect(zircon.activeMenuEntity).toBe(rootMenu)

    // Pressing Down from Dinner in the Root menu wraps around to Lunch.
    afterPressing(Button.Down)
    expect(zircon.focusedMenuEntity).toBe(lunchMenu)
    expect(zircon.activeMenuEntity).toBe(rootMenu)

    // Pressing A activates the Lunch menu, with focus on Salad,
    // because it was the first declared item.
    afterPressing(Button.A)
    expect(zircon.focusedMenuEntity).toBe(salad)
    expect(zircon.activeMenuEntity).toBe(lunchMenu)

    // Pressing Left does nothing because nothing is to the left of Salad.
    // Wrapping around in the horizontal direction does nothing, since the
    // menu layout is a perfectly flat vertical line.
    afterPressing(Button.Left)
    expect(zircon.focusedMenuEntity).toBe(salad)
    expect(zircon.activeMenuEntity).toBe(lunchMenu)

    // Pressing Right does nothing because nothing is to the right of Salad.
    // Wrapping around in the horizontal direction does nothing, since the
    // menu layout is a perfectly flat vertical line.
    afterPressing(Button.Right)
    expect(zircon.focusedMenuEntity).toBe(salad)
    expect(zircon.activeMenuEntity).toBe(lunchMenu)

    // Pressing Down wraps around to Burger.
    afterPressing(Button.Down)
    expect(zircon.focusedMenuEntity).toBe(burger)
    expect(zircon.activeMenuEntity).toBe(lunchMenu)

    // Pressing Up wraps back around to Salad.
    afterPressing(Button.Up)
    expect(zircon.focusedMenuEntity).toBe(salad)
    expect(zircon.activeMenuEntity).toBe(lunchMenu)

    // Now, if we disable Y wrapping for this menu, pressing Down does nothing.
    world.get(lunchMenu, Zircon.Menu)!.config.wrapY = false
    afterPressing(Button.Down)
    expect(zircon.focusedMenuEntity).toBe(salad)
    expect(zircon.activeMenuEntity).toBe(lunchMenu)

    // Pressing Up moves to Pasta.
    afterPressing(Button.Up)
    expect(zircon.focusedMenuEntity).toBe(pasta)
    expect(zircon.activeMenuEntity).toBe(lunchMenu)

    // Pressing Up again moves to Pizza.
    afterPressing(Button.Up)
    expect(zircon.focusedMenuEntity).toBe(pizza)
    expect(zircon.activeMenuEntity).toBe(lunchMenu)

    // Pressing B deactivates the Lunch menu, bringing us back into the
    // Root menu, with focus still pointing to the Lunch menu.
    afterPressing(Button.B)
    expect(zircon.focusedMenuEntity).toBe(lunchMenu)
    expect(zircon.activeMenuEntity).toBe(rootMenu)

    // Pressing Right from Lunch in the Root menu takes us to Dessert.
    afterPressing(Button.Right)
    expect(zircon.focusedMenuEntity).toBe(dessertMenu)
    expect(zircon.activeMenuEntity).toBe(rootMenu)

    // Pressing A activates the Dessert menu, with focus on Cookie,
    // because it was the first declared item.
    afterPressing(Button.A)
    expect(zircon.focusedMenuEntity).toBe(cookie)
    expect(zircon.activeMenuEntity).toBe(dessertMenu)

    // Pressing Left moves to Shake, because it is diagonally left of Cookie.
    afterPressing(Button.Left)
    expect(zircon.focusedMenuEntity).toBe(shake)
    expect(zircon.activeMenuEntity).toBe(dessertMenu)

    // Pressing Down moves to Sorbet, because it is diagonally down from Shake.
    afterPressing(Button.Down)
    expect(zircon.focusedMenuEntity).toBe(sorbet)
    expect(zircon.activeMenuEntity).toBe(dessertMenu)

    // Pressing Right moves back to Shake, being diagonally right of Sorbet.
    afterPressing(Button.Right)
    expect(zircon.focusedMenuEntity).toBe(shake)
    expect(zircon.activeMenuEntity).toBe(dessertMenu)

    // Pressing Up moves back to Cookie, being diagonally up from Shake.
    afterPressing(Button.Up)
    expect(zircon.focusedMenuEntity).toBe(cookie)
    expect(zircon.activeMenuEntity).toBe(dessertMenu)

    // Now we directly activate the Root menu, bringing us back there.
    // Dessert is focused, because it's where we came from.
    zircon.activeMenuEntity = rootMenu
    expect(zircon.focusedMenuEntity).toBe(dessertMenu)
    expect(zircon.activeMenuEntity).toBe(rootMenu)

    // Pressing A brings us back into the Dessert menu.
    afterPressing(Button.A)
    expect(zircon.focusedMenuEntity).toBe(cookie)
    expect(zircon.activeMenuEntity).toBe(dessertMenu)

    // Now we directly focus the Toast item, which implicitly
    // brings us into the Breakfast menu as the new active menu.
    zircon.focusedMenuEntity = toast
    expect(zircon.focusedMenuEntity).toBe(toast)
    expect(zircon.activeMenuEntity).toBe(breakfastMenu)

    // Pressing B deactivates the Breakfast menu, bringing us back to Root.
    // Breakfast is focused, because it's where we came from,
    // even though we didn't navigate to it normally through the Root menu.
    afterPressing(Button.B)
    expect(zircon.focusedMenuEntity).toBe(breakfastMenu)
    expect(zircon.activeMenuEntity).toBe(rootMenu)

    // Now we directly activate the Breakfast menu, bringing us back there.
    // Toast is focused, because it's the most recent focused item there.
    zircon.activeMenuEntity = breakfastMenu
    expect(zircon.focusedMenuEntity).toBe(toast)
    expect(zircon.activeMenuEntity).toBe(breakfastMenu)

    // Now we directly unfocus the Toast item, which implicitly
    // brings us to Pancake as the new focused item,
    // because it was the first declared item.
    zircon.focusedMenuEntity = undefined
    expect(zircon.focusedMenuEntity).toBe(pancake)
    expect(zircon.activeMenuEntity).toBe(breakfastMenu)

    // Pressing Left from Pancake moves to Waffle.
    afterPressing(Button.Left)
    expect(zircon.focusedMenuEntity).toBe(waffle)
    expect(zircon.activeMenuEntity).toBe(breakfastMenu)

    // Pressing Left again from Waffle wraps back around to Pancake.
    afterPressing(Button.Left)
    expect(zircon.focusedMenuEntity).toBe(pancake)
    expect(zircon.activeMenuEntity).toBe(breakfastMenu)

    // Pressing Down from Pancake moves to Toast.
    afterPressing(Button.Down)
    expect(zircon.focusedMenuEntity).toBe(toast)
    expect(zircon.activeMenuEntity).toBe(breakfastMenu)

    // Pressing Down again from Toast wraps back around to Pancake.
    afterPressing(Button.Down)
    expect(zircon.focusedMenuEntity).toBe(pancake)
    expect(zircon.activeMenuEntity).toBe(breakfastMenu)

    // Pressing Up again from Pancake wraps back around to Toast.
    afterPressing(Button.Up)
    expect(zircon.focusedMenuEntity).toBe(toast)
    expect(zircon.activeMenuEntity).toBe(breakfastMenu)

    // Pressing Right from Toast wraps around to Benedict.
    afterPressing(Button.Right)
    expect(zircon.focusedMenuEntity).toBe(benedict)
    expect(zircon.activeMenuEntity).toBe(breakfastMenu)

    // Now, if we disable X wrapping for this menu, pressing Left does nothing.
    world.get(breakfastMenu, Zircon.Menu)!.config.wrapX = false
    afterPressing(Button.Left)
    expect(zircon.focusedMenuEntity).toBe(benedict)
    expect(zircon.activeMenuEntity).toBe(breakfastMenu)

    // But pressing Down still wraps around to Waffle.
    afterPressing(Button.Down)
    expect(zircon.focusedMenuEntity).toBe(waffle)
    expect(zircon.activeMenuEntity).toBe(breakfastMenu)

    // If we disable Y wrapping and re-enable X wrapping, now
    // pressing Up does nothing.
    world.get(breakfastMenu, Zircon.Menu)!.config.wrapY = false
    world.get(breakfastMenu, Zircon.Menu)!.config.wrapX = true
    afterPressing(Button.Up)
    expect(zircon.focusedMenuEntity).toBe(waffle)
    expect(zircon.activeMenuEntity).toBe(breakfastMenu)

    // But pressing Left still wraps around to Pancake.
    afterPressing(Button.Left)
    expect(zircon.focusedMenuEntity).toBe(pancake)
    expect(zircon.activeMenuEntity).toBe(breakfastMenu)

    // Directly activating the Lunch menu brings us to Pizza,
    // because it was the most recent focused item there.
    zircon.activeMenuEntity = lunchMenu
    expect(zircon.focusedMenuEntity).toBe(pizza)
    expect(zircon.activeMenuEntity).toBe(lunchMenu)

    // Directly activating the Dinner menu brings us to Seitan,
    // because it was the most recent focused item there.
    zircon.activeMenuEntity = dinnerMenu
    expect(zircon.focusedMenuEntity).toBe(seitan)
    expect(zircon.activeMenuEntity).toBe(dinnerMenu)

    // Directly activating the Root menu brings us to Breakfast,
    // because it was the most recent focused item there,
    // even though we just came from the Dinner menu (directly).
    zircon.activeMenuEntity = rootMenu
    expect(zircon.focusedMenuEntity).toBe(breakfastMenu)
    expect(zircon.activeMenuEntity).toBe(rootMenu)
  })
})
