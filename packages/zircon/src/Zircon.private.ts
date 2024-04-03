import { MutableVector2 } from "@glass/core"

// This vector is used to calculate various things, but it isn't retained.
// It's just a scratch space reserved for intermediate calculations.
export const SCRATCH_VECTOR = new MutableVector2()

// These symbols are used to access private properties.
export const ACTIVE_MENU_ENTITY = Symbol("activeMenuEntity") // on Context
export const FOCUSED_MENU_ENTITY = Symbol("focusedMenuEntity") // on Context
export const MENU_MOST_RECENT_FOCUS = Symbol("mostRecentFocus") // on Menu
