import {
  registerComponent,
  MutableBox2,
  ReadVector2,
  ReadBox2,
} from "@glass/core"
import { Context } from "./Context"

export class Body {
  static readonly componentId = registerComponent(this)

  readonly shape: Body.Shape
  readonly boxBounds = new MutableBox2()
  readonly tileMapName?: string
  readonly tileMapLayerName?: string

  constructor(
    opts: {
      shape?: Body.Shape
      offsetX?: number
      offsetY?: number
      width?: number
      height?: number
      tileMapName?: string
      tileMapLayerName?: string
    } = {},
  ) {
    this.shape = opts.shape ?? Body.Shape.Box

    this.boxBounds.radii
      .setTo(opts.width ?? 2, opts.height ?? 2)
      .scaleEquals(0.5)
    this.boxBounds.center.setTo(opts.offsetX ?? 0, opts.offsetY ?? 0)

    if (this.shape === Body.Shape.TileMap) {
      if (!opts.tileMapName)
        throw new Error("TileMap shape requires tileMapName.")
      if (!opts.tileMapLayerName)
        throw new Error("TileMap shape requires tileMapLayerName.")
      this.tileMapName = opts.tileMapName
      this.tileMapLayerName = opts.tileMapLayerName
    }
  }

  updateBounds(
    width: number = 0,
    height: number = 0,
    offsetX: number = 0,
    offsetY: number = 0,
  ) {
    this.boxBounds.radii.setTo(width, height).scaleEquals(0.5)
    this.boxBounds.center.setTo(offsetX, offsetY)
  }

  get width() {
    return this.boxBounds.width
  }
  get height() {
    return this.boxBounds.height
  }
  get radii() {
    return this.boxBounds.radii
  }
  get offset() {
    return this.boxBounds.center
  }
  get offsetX() {
    return this.boxBounds.x
  }
  get offsetY() {
    return this.boxBounds.y
  }
  get relativeX0() {
    return this.boxBounds.x0
  }
  get relativeX1() {
    return this.boxBounds.x1
  }
  get relativeY0() {
    return this.boxBounds.y0
  }
  get relativeY1() {
    return this.boxBounds.y1
  }

  checkOverlap(
    coral: Context,
    b: Body,
    positionA: { coords: ReadVector2 },
    positionB: { coords: ReadVector2 },
  ): boolean {
    const a = this
    const posA = positionA.coords
    const posB = positionB.coords

    // Simplify this function by moving the simpler shape to the "a" side,
    // if there's currently a simpler shape on the "b" side.
    // This means we don't need as many branches in our shape-vs-shape checks.
    if (a.shape > b.shape) return b.checkOverlap(coral, a, positionB, positionA)

    if (this.shape === Body.Shape.Box && b.shape === Body.Shape.Box) {
      return checkBoxOverlapsBox(posA, a.boxBounds, posB, b.boxBounds)
    } else if (
      this.shape === Body.Shape.Box &&
      b.shape === Body.Shape.Rounded
    ) {
      return checkBoxOverlapsRounded(posA, a.boxBounds, posB, b.boxBounds)
    } else if (
      this.shape === Body.Shape.Rounded &&
      b.shape === Body.Shape.Rounded
    ) {
      return checkRoundedOverlapsRounded(posA, a.boxBounds, posB, b.boxBounds)
    } else {
      throw new Error(
        "Collision detection not yet implemented for these shapes.",
      )
    }
  }

  checkSurfaceRightward(
    coral: Context,
    positionL: { coords: ReadVector2 },
    r: Body,
    positionR: { coords: ReadVector2 },
  ): boolean {
    const l = this
    const posL = positionL.coords
    const posR = positionR.coords

    if (l.shape === Body.Shape.Box && r.shape === Body.Shape.Box) {
      return checkBoxTouchRightwardBox(posL, l.boxBounds, posR, r.boxBounds)
    } else if (l.shape === Body.Shape.Box && r.shape === Body.Shape.TileMap) {
      return checkBoxTouchRightwardTileMap(coral, posL, l.boxBounds, posR, r)
    } else if (l.shape === Body.Shape.TileMap && r.shape === Body.Shape.Box) {
      return checkBoxTouchLeftwardTileMap(coral, posR, r.boxBounds, posL, l)
    } else {
      throw new Error(
        "Rightward surface detection not yet implemented for these shapes.",
      )
    }
  }

  checkSurfaceLeftward(
    coral: Context,
    positionR: { coords: ReadVector2 },
    l: Body,
    positionL: { coords: ReadVector2 },
  ): boolean {
    return l.checkSurfaceRightward(coral, positionL, this, positionR)
  }

  checkSurfaceDownward(
    coral: Context,
    positionU: { coords: ReadVector2 },
    d: Body,
    positionD: { coords: ReadVector2 },
  ): boolean {
    const u = this
    const posU = positionU.coords
    const posD = positionD.coords

    if (this.shape === Body.Shape.Box && d.shape === Body.Shape.Box) {
      return checkBoxTouchDownwardBox(posU, u.boxBounds, posD, d.boxBounds)
    } else if (u.shape === Body.Shape.Box && d.shape === Body.Shape.TileMap) {
      return checkBoxTouchDownwardTileMap(coral, posU, u.boxBounds, posD, d)
    } else if (u.shape === Body.Shape.TileMap && d.shape === Body.Shape.Box) {
      return checkBoxTouchUpwardTileMap(coral, posD, d.boxBounds, posU, u)
    } else {
      throw new Error(
        "Downward surface detection not yet implemented for these shapes.",
      )
    }
  }

  checkSurfaceUpward(
    coral: Context,
    positionD: { coords: ReadVector2 },
    u: Body,
    positionU: { coords: ReadVector2 },
  ): boolean {
    return u.checkSurfaceDownward(coral, positionU, this, positionD)
  }

  fetchTileMapLayer(coral: Context) {
    if (this.shape !== Body.Shape.TileMap)
      throw new TypeError("This is not a TileMap collision shape.")

    return coral.opal.tileMaps
      .get(this.tileMapName!)
      ?.layer(this.tileMapLayerName!)
  }

  tileMapIsSolidInXYRange(
    coral: Context,
    x0: number,
    x1: number,
    y0: number,
    y1: number,
  ): boolean {
    if (this.shape !== Body.Shape.TileMap)
      throw new TypeError("This is not a TileMap collision shape.")

    return (
      coral.opal.tileMaps
        .get(this.tileMapName!)
        ?.layer(this.tileMapLayerName!)
        ?.isNonZeroInXYRange(x0, x1, y0, y1) ?? false
    )
  }
}

export namespace Body {
  export enum Shape {
    // Axis-aligned bounding box.
    // That is, a rectangle whose sides are always parallel to the X and Y axes.
    //
    // Defined by a width and height, with optional position offset.
    Box = 0,

    // Axis-aligned bounding box with rounded corners, to nearest capsule shape.
    // In other words, the radius of the corners is half the smallest dimension.
    //
    // It is defined using the same parameters as an axis-aligned bounding box,
    // but collision checks treat it as having rounded corners.
    //
    // Examples:
    //
    // (tall capsule)      (circle)              (wide capsule)
    //
    //   v--- W ---v      v--- W ---v     v----------- W ------------v
    // >    #####       >    #####      >    ######################
    // :  #########     :  #########    :  ##########################
    // : ###########    H ###########   H ############################
    // : ###########    : ###########   : ############################
    // H ###########    :  #########    :  ##########################
    // : ###########    >    #####      >    ######################
    // : ###########
    // :  #########
    // >    #####
    Rounded,

    // TODO: Bitmap,

    // Tile map collision layer.
    // Conceptually, this is an aggregate of axis-aligned bounding boxes,
    // one for each solid tile in the specified tile map layer.
    //
    // Collision checks against this shape query the tile map data.
    TileMap,
  }
}

function checkBoxOverlapsBox(
  posA: ReadVector2,
  boundsA: ReadBox2,
  posB: ReadVector2,
  boundsB: ReadBox2,
): boolean {
  const aX0 = boundsA.x0 + posA.x
  const bX0 = boundsB.x0 + posB.x
  const aX1 = boundsA.x1 + posA.x
  const bX1 = boundsB.x1 + posB.x
  if (aX0 >= bX1 || bX0 >= aX1) return false

  const aY0 = boundsA.y0 + posA.y
  const bY0 = boundsB.y0 + posB.y
  const aY1 = boundsA.y1 + posA.y
  const bY1 = boundsB.y1 + posB.y
  if (aY0 >= bY1 || bY0 >= aY1) return false

  return true
}

function checkBoxTouchRightwardBox(
  posL: ReadVector2,
  boundsL: ReadBox2,
  posR: ReadVector2,
  boundsR: ReadBox2,
): boolean {
  return (
    posL.x + boundsL.x1 + 1 !== posR.x + boundsR.x0 &&
    posL.y + boundsL.y0 < posR.y + boundsR.y1 &&
    posL.y + boundsL.y1 > posR.y + boundsR.y0
  )
}

function checkBoxTouchDownwardBox(
  posU: ReadVector2,
  boundsU: ReadBox2,
  posD: ReadVector2,
  boundsD: ReadBox2,
): boolean {
  return (
    posU.y + boundsU.y1 + 1 === posD.y + boundsD.y0 &&
    posU.x + boundsU.x0 < posD.x + boundsD.x1 &&
    posU.x + boundsU.x1 > posD.x + boundsD.x0
  )
}

function checkCircleOverlapsCircle(
  posA: ReadVector2,
  offsetA: ReadVector2,
  radiusA: number,
  posB: ReadVector2,
  offsetB: ReadVector2,
  radiusB: number,
): boolean {
  // How far is it between the centers of the two circles?
  const centerDistX = Math.abs(posA.x + offsetA.x - posB.x - offsetB.x)
  const centerDistY = Math.abs(posA.y + offsetA.y - posB.y - offsetB.y)

  // Compare the two circle radii to the actual distance,
  // joining the two axes using Pythagorean Theorem (X*X + Y*Y compares to R*R).
  const radiiSq = radiusA * radiusA + radiusB * radiusB
  const distanceSq = centerDistX * centerDistX + centerDistY * centerDistY
  return radiiSq > distanceSq
}

function checkBoxOverlapsCircle(
  boxPos: ReadVector2,
  box: ReadBox2,
  circlePos: ReadVector2,
  circleOffset: ReadVector2,
  circleRadius: number,
): boolean {
  // How far is it from the center of the circle to the center of the box?
  const centerDistX = Math.abs(
    circlePos.x + circleOffset.x - boxPos.x - box.center.x,
  )
  const centerDistY = Math.abs(
    circlePos.y + circleOffset.y - boxPos.y - box.center.y,
  )

  // Okay, but how far is it to the _nearest_ point of the box?
  const nearestBoxX = Math.max(0, centerDistX - box.halfWidth)
  const nearestBoxY = Math.max(0, centerDistY - box.halfHeight)

  // Compare the circle radius to the actual distance,
  // joining the two axes using Pythagorean Theorem (X*X + Y*Y compares to R*R).
  const radiusSq = circleRadius * circleRadius
  const distanceSq = nearestBoxX * nearestBoxX + nearestBoxY * nearestBoxY
  return radiusSq > distanceSq
}

function checkBoxOverlapsRounded(
  boxPos: ReadVector2,
  boxBounds: ReadBox2,
  roundedPos: ReadVector2,
  roundedBounds: ReadBox2,
): boolean {
  // First check if they'd overlap as boxes.
  // If not, they definitely don't overlap when one is rounded.
  if (!checkBoxOverlapsBox(boxPos, boxBounds, roundedPos, roundedBounds))
    return false

  // The simplest case is when the rounded body is a circle (a rounded square).
  // We can return after just one inner check in that special case.
  const radiusX = roundedBounds.radii.x
  const radiusY = roundedBounds.radii.y
  if (radiusX === radiusY) {
    return checkBoxOverlapsCircle(
      boxPos,
      boxBounds,
      roundedPos,
      roundedBounds.center,
      radiusX,
    )
  }

  // Otherwise, we can check the rounded capsule shape as being made of two
  // circles at either end, and an overlapping box in the middle
  // (note that the two circles may also overlap if the shape is short enough).
  //
  //    11111############22222
  //  111111111########222222222
  // 11111111111######22222222222
  // 11111111111######22222222222
  //  111111111########222222222
  //    11111############22222
  //
  // (circle1) (middle) (circle2)
  //
  // If any of those composing shapes overlap, then the overall shape overlaps.

  const radius = Math.min(radiusX, radiusY)
  const isWide = radiusX > radiusY

  // Check circle 1.
  const circleOffset = roundedPos.cloneMutable()
  if (isWide) {
    circleOffset.x -= roundedBounds.radii.x - radius
  } else {
    circleOffset.y -= roundedBounds.radii.y - radius
  }
  if (
    checkBoxOverlapsCircle(boxPos, boxBounds, roundedPos, circleOffset, radius)
  )
    return true

  // Check circle 2.
  circleOffset.copyFrom(roundedPos)
  if (isWide) {
    circleOffset.x += roundedBounds.radii.x - radius
  } else {
    circleOffset.y += roundedBounds.radii.y - radius
  }
  if (
    checkBoxOverlapsCircle(boxPos, boxBounds, roundedPos, circleOffset, radius)
  )
    return true

  // Check the middle box.
  // This is our last check, so we return the inner check's result directly.
  const middleBox = roundedBounds.cloneMutable()
  if (isWide) {
    middleBox.radii.x -= radius
  } else {
    middleBox.radii.y -= radius
  }
  return checkBoxOverlapsBox(boxPos, boxBounds, roundedPos, middleBox)
}

function checkCircleOverlapsRounded(
  posA: ReadVector2,
  offsetA: ReadVector2,
  radiusA: number,
  posB: ReadVector2,
  boundsB: ReadBox2,
): boolean {
  // The simplest case is when the rounded body is a circle (a rounded square).
  // We can return after just one inner check in that special case.
  const radiusBX = boundsB.radii.x
  const radiusBY = boundsB.radii.y
  if (radiusBX === radiusBY) {
    return checkCircleOverlapsCircle(
      posA,
      offsetA,
      radiusA,
      posB,
      boundsB.center,
      radiusBX,
    )
  }

  // Otherwise, we can check the rounded capsule shape as being made of two
  // circles at either end, and an overlapping box in the middle
  // (note that the two circles may also overlap if the shape is short enough).
  //
  //    11111############22222
  //  111111111########222222222
  // 11111111111######22222222222
  // 11111111111######22222222222
  //  111111111########222222222
  //    11111############22222
  //
  // (circle1) (middle) (circle2)
  //
  // If any of those composing shapes overlap, then the overall shape overlaps.

  const radiusB = Math.min(radiusBX, radiusBY)
  const isWide = radiusBX > radiusBY

  // Check circle 1.
  const circleOffsetB = posB.cloneMutable()
  if (isWide) {
    circleOffsetB.x -= boundsB.radii.x - radiusB
  } else {
    circleOffsetB.y -= boundsB.radii.y - radiusB
  }
  if (
    checkCircleOverlapsCircle(
      posA,
      offsetA,
      radiusA,
      posB,
      circleOffsetB,
      radiusB,
    )
  )
    return true

  // Check circle 2.
  circleOffsetB.copyFrom(posB)
  if (isWide) {
    circleOffsetB.x += boundsB.radii.x - radiusB
  } else {
    circleOffsetB.y += boundsB.radii.y - radiusB
  }
  if (
    checkCircleOverlapsCircle(
      posA,
      offsetA,
      radiusA,
      posB,
      circleOffsetB,
      radiusB,
    )
  )
    return true

  // Check the middle box.
  // This is our last check, so we return the inner check's result directly.
  const middleBoxB = boundsB.cloneMutable()
  if (isWide) {
    middleBoxB.radii.x -= radiusB
  } else {
    middleBoxB.radii.y -= radiusB
  }
  return checkBoxOverlapsCircle(posB, middleBoxB, posA, offsetA, radiusA)
}

function checkRoundedOverlapsRounded(
  posA: ReadVector2,
  boundsA: ReadBox2,
  posB: ReadVector2,
  boundsB: ReadBox2,
): boolean {
  // First check if they'd overlap as boxes.
  // If not, they definitely don't overlap when both are rounded.
  if (!checkBoxOverlapsBox(posA, boundsA, posB, boundsB)) return false

  // The simplest case is when one rounded body is a circle (a rounded square).
  // We can return after just one inner check in that special case.
  if (boundsA.radii.x === boundsA.radii.y) {
    return checkCircleOverlapsRounded(
      posA,
      boundsA.center,
      boundsA.radii.x,
      posB,
      boundsB,
    )
  }
  if (boundsB.radii.x === boundsB.radii.y) {
    return checkCircleOverlapsRounded(
      posB,
      boundsB.center,
      boundsB.radii.x,
      posA,
      boundsA,
    )
  }

  // Otherwise, we can check the "a" rounded capsule shape as being made of two
  // circles at either end, and an overlapping box in the middle
  // (note that the two circles may also overlap if the shape is short enough).
  //
  //    11111############22222
  //  111111111########222222222
  // 11111111111######22222222222
  // 11111111111######22222222222
  //  111111111########222222222
  //    11111############22222
  //
  // (circle1) (middle) (circle2)
  //
  // If any of those composing shapes overlap, then the overall shape overlaps.

  const radius = Math.min(boundsA.radii.x, boundsA.radii.y)
  const isWide = boundsA.radii.x > boundsA.radii.y

  // Check circle 1.
  const circleOffset = posA.cloneMutable()
  if (isWide) {
    circleOffset.x -= boundsA.radii.x - radius
  } else {
    circleOffset.y -= boundsA.radii.y - radius
  }
  if (checkCircleOverlapsRounded(posA, circleOffset, radius, posB, boundsB))
    return true

  // Check circle 2.
  circleOffset.copyFrom(posA)
  if (isWide) {
    circleOffset.x += boundsA.radii.x - radius
  } else {
    circleOffset.y += boundsA.radii.y - radius
  }
  if (checkCircleOverlapsRounded(posA, circleOffset, radius, posB, boundsB))
    return true

  // Check the middle box.
  // This is our last check, so we return the inner check's result directly.
  const middleBox = boundsA.cloneMutable()
  if (isWide) {
    middleBox.radii.x -= radius
  } else {
    middleBox.radii.y -= radius
  }
  return checkBoxOverlapsRounded(posA, middleBox, posB, boundsB)
}

function checkBoxTouchRightwardTileMap(
  coral: Context,
  posL: ReadVector2,
  boundsL: ReadBox2,
  tileMapPos: ReadVector2,
  tileMap: Body,
): boolean {
  const layer = tileMap.fetchTileMapLayer(coral)
  const x = posL.x - tileMapPos.x + boundsL.x1
  if (!layer || !layer.xIsAligned(x)) return false

  const y0 = posL.y - tileMapPos.y + boundsL.y0
  const y1 = posL.y - tileMapPos.y + boundsL.y1 - 1
  return layer.isNonZeroInXYRange(x, x, y0, y1)
}

function checkBoxTouchLeftwardTileMap(
  coral: Context,
  posR: ReadVector2,
  boundsR: ReadBox2,
  tileMapPos: ReadVector2,
  tileMap: Body,
): boolean {
  const layer = tileMap.fetchTileMapLayer(coral)
  let x = posR.x - tileMapPos.x + boundsR.x0
  if (!layer || !layer.xIsAligned(x)) return false
  x -= 1

  const y0 = posR.y - tileMapPos.y + boundsR.y0
  const y1 = posR.y - tileMapPos.y + boundsR.y1 - 1
  return layer.isNonZeroInXYRange(x, x, y0, y1)
}

function checkBoxTouchDownwardTileMap(
  coral: Context,
  posU: ReadVector2,
  boundsU: ReadBox2,
  tileMapPos: ReadVector2,
  tileMap: Body,
): boolean {
  const layer = tileMap.fetchTileMapLayer(coral)
  const y = posU.y - tileMapPos.y + boundsU.y1
  if (!layer || !layer.yIsAligned(y)) return false

  const x0 = posU.x - tileMapPos.x + boundsU.x0
  const x1 = posU.x - tileMapPos.x + boundsU.x1 - 1
  return layer.isNonZeroInXYRange(x0, x1, y, y)
}

function checkBoxTouchUpwardTileMap(
  coral: Context,
  posD: ReadVector2,
  boundsD: ReadBox2,
  tileMapPos: ReadVector2,
  tileMap: Body,
): boolean {
  const layer = tileMap.fetchTileMapLayer(coral)
  let y = posD.y - tileMapPos.y + boundsD.y0
  if (!layer || !layer.yIsAligned(y)) return false
  y -= 1

  const x0 = posD.x - tileMapPos.x + boundsD.x0
  const x1 = posD.x - tileMapPos.x + boundsD.x1 - 1
  return tileMap.tileMapIsSolidInXYRange(coral, x0, x1, y, y)
}
