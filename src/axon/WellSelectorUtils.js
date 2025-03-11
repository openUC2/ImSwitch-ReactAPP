//##################################################################################
/**
 * Use:
 * import * as WellSelectorUtils from './WellSelectorUtils.js';
 * WellSelectorUtils.isCircleInsideRect()
 */
//##################################################################################

//##################################################################################
export function calculateNeighborPointsSquare(
  squareX,
  squareY,
  squareWidth,
  squareHeight,
  numNeighborsX,
  numNeighborsY
) {
  const points = [];

  for (let i = -numNeighborsX; i <= numNeighborsX; i++) {
    for (let j = -numNeighborsY; j <= numNeighborsY; j++) {
      // Skip the original rectangle at the center
      if (i === 0 && j === 0) continue;

      // Calculate the position for the neighboring rectangle
      const neighborX = squareX + i * squareWidth;
      const neighborY = squareY + j * squareHeight;

      points.push({ x: neighborX, y: neighborY });
    }
  }

  return points;
}

//##################################################################################
export function calculateNeighborPointsCircle(
  squareX,
  squareY,
  squareWidth,
  squareHeight,
  numNeighbors
) {
  const points = [];

  // Determine the maximum dimension and circle radius
  const maxDim = Math.max(squareWidth, squareHeight);
  const circleRadius = numNeighbors * maxDim;

  // Calculate neighbor limits based on aspect ratio
  const adjustedNeighborsX = Math.ceil(circleRadius / squareWidth);
  const adjustedNeighborsY = Math.ceil(circleRadius / squareHeight);

  // Helper function to check if a point lies within the circle
  function isInCircle(i, j) {
    const centerX = i * squareWidth;
    const centerY = j * squareHeight;
    const distance = Math.sqrt(centerX * centerX + centerY * centerY);
    return distance <= circleRadius;
  }

  // Loop to compute valid neighbor points
  for (let i = -adjustedNeighborsX; i <= adjustedNeighborsX; i++) {
    for (let j = -adjustedNeighborsY; j <= adjustedNeighborsY; j++) {
      // Skip the original rectangle at the center
      if (i === 0 && j === 0) continue;

      // Ensure the point lies within the circle
      if (!isInCircle(i, j)) continue;

      // Calculate the position for the neighboring point
      const neighborX = squareX + i * squareWidth;
      const neighborY = squareY + j * squareHeight;

      points.push({ x: neighborX, y: neighborY });
    }
  }

  return points;
}

//##################################################################################
export function generateCenterPointsInRect(
  rectStartPoint,
  rectEndPoint,
  wellWidth,
  wellHeight
) {
  // Ensure starting and ending positions are correctly ordered
  const startX = Math.min(rectStartPoint.x, rectEndPoint.x);
  const endX = Math.max(rectStartPoint.x, rectEndPoint.x);
  const startY = Math.min(rectStartPoint.y, rectEndPoint.y);
  const endY = Math.max(rectStartPoint.y, rectEndPoint.y);

  const points = [];

  // Generate points inside the bounding box
  for (let x = startX; x <= endX - wellWidth; x += wellWidth) {
    for (let y = startY; y <= endY - wellHeight; y += wellHeight) {
      points.push({ x, y });
    }
  }

  return points;
}

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
    { x: x1 + width / 2, y: y1 + height / 2 }, // Bottom-right
  ];

  // Check if any of the corners are inside the second rectangle
  return corners.some(
    (corner) =>
      corner.x >= left &&
      corner.x <= right &&
      corner.y >= top &&
      corner.y <= bottom
  );
}

//##################################################################################
export function isCircleInsideRect(cx, cy, r, x1, y1, x2, y2) {
  console.log("isCircleInsideRect2", cx, cy, r, x1, y1, x2, y2);
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
  return (
    point.x >= squareX &&
    point.x <= squareX + squareSize &&
    point.y >= squareY &&
    point.y <= squareY + squareSize
  );
}

//##################################################################################
export function isPointInsideRect(
  point,
  squareCenter,
  squareWidth,
  squareHeight
) {
  const squareX = squareCenter.x - squareWidth / 2;
  const squareY = squareCenter.y - squareHeight / 2;
  return (
    point.x >= squareX &&
    point.x <= squareX + squareWidth &&
    point.y >= squareY &&
    point.y <= squareY + squareHeight
  );
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
export const calcCenterPoint = (pointA, pointB) => {
    const centerX = (pointA.x + pointB.x) / 2;
    const centerY = (pointA.y + pointB.y) / 2;
    return { x: centerX, y: centerY };
  };


//##################################################################################
export function isLineIntersectingSquare(
  x1,
  y1,
  x2,
  y2,
  squareX,
  squareY,
  size
) {
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

//##################################################################################
export const wellLayoutDefault = {
    name: "Default",
    unit: "um",
    width: 120000,  // Standard width for 32-well plate
    height: 80000,  // Standard height for 32-well plate
    wells: [ ],
  };

  export const wellLayoutDevelopment = {
    name: "Development",
    unit: "um",
    width: 1000000,
    height: 600000,
    wells: [
      { x: 200000, y: 200000, shape: "circle", radius: 50000, name:"A1" },
      { x: 400000, y: 200000, shape: "circle", radius: 90000, name:"A2" },
      { x: 600000, y: 200000, shape: "circle", radius: 90000, name:"A3" },
      { x: 800000, y: 200000, shape: "circle", radius: 90000, name:"A4" },
      { x: 200000, y: 400000, shape: "circle", radius: 90000, name:"B1" },
      { x: 400000, y: 400000, shape: "circle", radius: 90000 },
      {
        x: 600000,
        y: 400000,
        shape: "rectangle",
        width: 90000,
        height: 180000,
      },
      {
        x: 800000,
        y: 400000,
        shape: "rectangle",
        width: 180000,
        height: 180000,
        name:"B4"
      },
    ],
  };

  export const wellLayout32 = {
    name: "Wellplate 32",
    unit: "um",
    width: 128000,
    height: 86000,
    wells: [
        { "x": 15000, "y": 15000, "shape": "circle", "radius": 4500 },
        { "x": 45000, "y": 15000, "shape": "circle", "radius": 4500 },
        { "x": 75000, "y": 15000, "shape": "circle", "radius": 4500 },
        { "x": 105000, "y": 15000, "shape": "circle", "radius": 4500 },
        
        { "x": 15000, "y": 30000, "shape": "circle", "radius": 4500 },
        { "x": 45000, "y": 30000, "shape": "circle", "radius": 4500 },
        { "x": 75000, "y": 30000, "shape": "circle", "radius": 4500 },
        { "x": 105000, "y": 30000, "shape": "circle", "radius": 4500 },
        
        { "x": 15000, "y": 45000, "shape": "circle", "radius": 4500 },
        { "x": 45000, "y": 45000, "shape": "circle", "radius": 4500 },
        { "x": 75000, "y": 45000, "shape": "circle", "radius": 4500 },
        { "x": 105000, "y": 45000, "shape": "circle", "radius": 4500 },
        
        { "x": 15000, "y": 60000, "shape": "circle", "radius": 4500 },
        { "x": 45000, "y": 60000, "shape": "circle", "radius": 4500 },
        { "x": 75000, "y": 60000, "shape": "circle", "radius": 4500 },
        { "x": 105000, "y": 60000, "shape": "circle", "radius": 4500 },
        
        { "x": 15000, "y": 75000, "shape": "circle", "radius": 4500 },
        { "x": 45000, "y": 75000, "shape": "circle", "radius": 4500 },
        { "x": 75000, "y": 75000, "shape": "circle", "radius": 4500 },
        { "x": 105000, "y": 75000, "shape": "circle", "radius": 4500 }
    ]
}
;

export const histolayout = {
  name: "histolayout",
  unit: "um",
  width: 128000,
  height: 86000,
  wells: [
    {
      x: 15000,
      y: 0,
      shape: "rectangle",
      width: 24000,
      height: 100000,
      name: "A1",
    }
    ]
}
;


export const wellLayout96 = {
    name: "Wellplate 96",
    unit: "um",
    width: 128000,
    height: 86000,
    wells: [
        { "x": 10667, "y": 10667, "shape": "circle", "radius": 4500 },
        { "x": 21334, "y": 10667, "shape": "circle", "radius": 4500 },
        { "x": 32001, "y": 10667, "shape": "circle", "radius": 4500 },
        { "x": 42668, "y": 10667, "shape": "circle", "radius": 4500 },
        { "x": 53335, "y": 10667, "shape": "circle", "radius": 4500 },
        { "x": 64002, "y": 10667, "shape": "circle", "radius": 4500 },
        { "x": 74669, "y": 10667, "shape": "circle", "radius": 4500 },
        { "x": 85336, "y": 10667, "shape": "circle", "radius": 4500 },
        
        { "x": 10667, "y": 21334, "shape": "circle", "radius": 4500 },
        { "x": 21334, "y": 21334, "shape": "circle", "radius": 4500 },
        { "x": 32001, "y": 21334, "shape": "circle", "radius": 4500 },
        { "x": 42668, "y": 21334, "shape": "circle", "radius": 4500 },
        { "x": 53335, "y": 21334, "shape": "circle", "radius": 4500 },
        { "x": 64002, "y": 21334, "shape": "circle", "radius": 4500 },
        { "x": 74669, "y": 21334, "shape": "circle", "radius": 4500 },
        { "x": 85336, "y": 21334, "shape": "circle", "radius": 4500 },
        
        { "x": 10667, "y": 32001, "shape": "circle", "radius": 4500 },
        { "x": 21334, "y": 32001, "shape": "circle", "radius": 4500 },
        { "x": 32001, "y": 32001, "shape": "circle", "radius": 4500 },
        { "x": 42668, "y": 32001, "shape": "circle", "radius": 4500 },
        { "x": 53335, "y": 32001, "shape": "circle", "radius": 4500 },
        { "x": 64002, "y": 32001, "shape": "circle", "radius": 4500 },
        { "x": 74669, "y": 32001, "shape": "circle", "radius": 4500 },
        { "x": 85336, "y": 32001, "shape": "circle", "radius": 4500 },
        
        { "x": 10667, "y": 42668, "shape": "circle", "radius": 4500 },
        { "x": 21334, "y": 42668, "shape": "circle", "radius": 4500 },
        { "x": 32001, "y": 42668, "shape": "circle", "radius": 4500 },
        { "x": 42668, "y": 42668, "shape": "circle", "radius": 4500 },
        { "x": 53335, "y": 42668, "shape": "circle", "radius": 4500 },
        { "x": 64002, "y": 42668, "shape": "circle", "radius": 4500 },
        { "x": 74669, "y": 42668, "shape": "circle", "radius": 4500 },
        { "x": 85336, "y": 42668, "shape": "circle", "radius": 4500 },
        
        { "x": 10667, "y": 53335, "shape": "circle", "radius": 4500 },
        { "x": 21334, "y": 53335, "shape": "circle", "radius": 4500 },
        { "x": 32001, "y": 53335, "shape": "circle", "radius": 4500 },
        { "x": 42668, "y": 53335, "shape": "circle", "radius": 4500 },
        { "x": 53335, "y": 53335, "shape": "circle", "radius": 4500 },
        { "x": 64002, "y": 53335, "shape": "circle", "radius": 4500 },
        { "x": 74669, "y": 53335, "shape": "circle", "radius": 4500 },
        { "x": 85336, "y": 53335, "shape": "circle", "radius": 4500 },
        
        { "x": 10667, "y": 64002, "shape": "circle", "radius": 4500 },
        { "x": 21334, "y": 64002, "shape": "circle", "radius": 4500 },
        { "x": 32001, "y": 64002, "shape": "circle", "radius": 4500 },
        { "x": 42668, "y": 64002, "shape": "circle", "radius": 4500 },
        { "x": 53335, "y": 64002, "shape": "circle", "radius": 4500 },
        { "x": 64002, "y": 64002, "shape": "circle", "radius": 4500 },
        { "x": 74669, "y": 64002, "shape": "circle", "radius": 4500 },
        { "x": 85336, "y": 64002, "shape": "circle", "radius": 4500 }
    ]
}

;