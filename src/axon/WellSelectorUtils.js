



//##################################################################################
/**
 * Use: 
 * import * as WellSelectorUtils from './WellSelectorUtils.js';
 * WellSelectorUtils.isCircleInsideRect()
 */
//##################################################################################

 

//##################################################################################
export function isRectInsideRect(x1, y1, width, height, rx1, ry1, rx2, ry2) {
        const left = Math.min(rx1, rx2);
        const right = Math.max(rx1, rx2);
        const top = Math.min(ry1, ry2);
        const bottom = Math.max(ry1, ry2);
    
        // Calculate the four corners based on the center (x1, y1)
        const corners = [
            { x: x1 - width / 2, y: y1 - height / 2 }, // Top-left
            { x: x1 + width / 2, y: y1 - height / 2 }, // Top-right
            { x: x1 - width / 2, y: y1 + height / 2 }, // Bottom-left
            { x: x1 + width / 2, y: y1 + height / 2 }  // Bottom-right
        ];
    
        // Check if any of the corners are inside the second rectangle
        return corners.some(corner => 
            corner.x >= left && corner.x <= right && corner.y >= top && corner.y <= bottom
        );
    }
    

//##################################################################################
export function isCircleInsideRect(cx, cy, r, x1, y1, x2, y2) {
    console.log("isCircleInsideRect2", cx, cy, r, x1, y1, x2, y2)
  // Ensure x1, y1 is the top-left and x2, y2 is the bottom-right
  const rectLeft = Math.min(x1, x2);
  const rectRight = Math.max(x1, x2);
  const rectTop = Math.min(y1, y2);
  const rectBottom = Math.max(y1, y2);

  // Find the closest point on the rectangle to the circle's center
  const closestX = Math.max(rectLeft, Math.min(cx, rectRight));
  const closestY = Math.max(rectTop, Math.min(cy, rectBottom));

  // Calculate the distance between the circle's center and this closest point
  const dx = cx - closestX;
  const dy = cy - closestY;

  // If the distance from the circle's center to the closest point is less than or equal to the circle's radius, it's inside or overlapping
  const distanceSquared = dx * dx + dy * dy;

  return distanceSquared <= r * r; // If true, part of the circle is inside the rectangle
}


//##################################################################################
export function isPointInsideSquare(point, squareCenter, squareSize) {
    const squareX = squareCenter.x - squareSize / 2;
    const squareY = squareCenter.y - squareSize / 2;
    return point.x >= squareX && point.x <= (squareX + squareSize) && point.y >= squareY && point.y <= (squareY + squareSize);
}

//##################################################################################
export function isPointInsideRect(point, squareCenter, squareWidth, squareHeight) {
    const squareX = squareCenter.x - squareWidth / 2;
    const squareY = squareCenter.y - squareHeight / 2;
    return point.x >= squareX && point.x <= (squareX + squareWidth) && point.y >= squareY && point.y <= (squareY + squareHeight);
}

//##################################################################################
export function isSquareInsideRect(x, y, rasterSize, x1, y1, x2, y2) {
  // Check if the square's top-left corner is inside the global rect
  // AND the square's bottom-right corner is inside the global rect
  return x >= x1 && y >= y1 && x + rasterSize <= x2 && y + rasterSize <= y2;
}

//##################################################################################
export function isSquareInsideRect2(x, y, rasterSize, x1, y1, x2, y2) {
  // Normalize the rectangle to ensure x1, y1 is the top-left and x2, y2 is the bottom-right
  const rectX1 = Math.min(x1, x2);
  const rectY1 = Math.min(y1, y2);
  const rectX2 = Math.max(x1, x2);
  const rectY2 = Math.max(y1, y2);

  // Check if the square is overlapping or inside the rectangle
  return !(
    x + rasterSize <= rectX1 || // Square is completely to the left of the rect
    y + rasterSize <= rectY1 || // Square is completely above the rect
    x >= rectX2 || // Square is completely to the right of the rect
    y >= rectY2
  ); // Square is completely below the rect
}

//##################################################################################
export function isLineIntersectingSquare(x1, y1, x2, y2, squareX, squareY, size) {
  // Define the square's corners
  const topLeft = { x: squareX, y: squareY };
  const topRight = { x: squareX + size, y: squareY };
  const bottomLeft = { x: squareX, y: squareY + size };
  const bottomRight = { x: squareX + size, y: squareY + size };

  // Helper function to check if a point is inside the square
  function isPointInsideSquare(px, py) {
    return (
      px >= squareX &&
      px <= squareX + size &&
      py >= squareY &&
      py <= squareY + size
    );
  }

  // Helper function to check if two line segments intersect
  function doLinesIntersect(p1, q1, p2, q2) {
    function orientation(p, q, r) {
      const val = (q.y - p.y) * (r.x - q.x) - (q.x - p.x) * (r.y - q.y);
      if (val === 0) return 0; // Collinear
      return val > 0 ? 1 : 2; // Clockwise or Counterclockwise
    }

    function onSegment(p, q, r) {
      return (
        q.x <= Math.max(p.x, r.x) &&
        q.x >= Math.min(p.x, r.x) &&
        q.y <= Math.max(p.y, r.y) &&
        q.y >= Math.min(p.y, r.y)
      );
    }

    const o1 = orientation(p1, q1, p2);
    const o2 = orientation(p1, q1, q2);
    const o3 = orientation(p2, q2, p1);
    const o4 = orientation(p2, q2, q1);

    // General case
    if (o1 !== o2 && o3 !== o4) return true;

    // Special cases
    if (o1 === 0 && onSegment(p1, p2, q1)) return true;
    if (o2 === 0 && onSegment(p1, q2, q1)) return true;
    if (o3 === 0 && onSegment(p2, p1, q2)) return true;
    if (o4 === 0 && onSegment(p2, q1, q2)) return true;

    return false;
  }

  // Check if either endpoint of the line is inside the square
  if (isPointInsideSquare(x1, y1) || isPointInsideSquare(x2, y2)) {
    return true;
  }

  // Check if the line intersects any of the square's edges
  if (
    doLinesIntersect({ x: x1, y: y1 }, { x: x2, y: y2 }, topLeft, topRight) ||
    doLinesIntersect(
      { x: x1, y: y1 },
      { x: x2, y: y2 },
      topRight,
      bottomRight
    ) ||
    doLinesIntersect(
      { x: x1, y: y1 },
      { x: x2, y: y2 },
      bottomRight,
      bottomLeft
    ) ||
    doLinesIntersect({ x: x1, y: y1 }, { x: x2, y: y2 }, bottomLeft, topLeft)
  ) {
    return true;
  }

  return false; // No intersection
}