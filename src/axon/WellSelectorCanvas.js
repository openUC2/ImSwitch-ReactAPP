import React, { useRef, useEffect, useState } from "react";
import { forwardRef, useImperativeHandle } from "react";
import { useDispatch, useSelector } from "react-redux";

import * as wellSelectorSlice from "../state/slices/WellSelectorSlice.js";
import * as experimentSlice from "../state/slices/ExperimentSlice.js";
import * as hardwareSlice from "../state/slices/HardwareSlice.js";
import * as positionSlice from "../state/slices/PositionSlice.js";

import * as wsUtils from "./WellSelectorUtils.js";
//##################################################################################

export const Mode = Object.freeze({
  SINGLE_SELECT: "single",
  CUP_SELECT: "cup",
  AREA_SELECT: "area",
  MOVE_CAMERA: "camera",
});

//##################################################################################
const WellSelectorCanvas = forwardRef((props, ref) => {
  const canvasRef = useRef(null);
  const [wellLayout, setWellLayout] = useState({
    unit: "um",
    width: 1000000,
    height: 600000,
    wells: [
      { x: 200000, y: 200000, shape: "circle", radius: 50000 },
      { x: 400000, y: 200000, shape: "circle", radius: 90000 },
      { x: 600000, y: 200000, shape: "circle", radius: 90000 },
      { x: 800000, y: 200000, shape: "circle", radius: 90000 },
      { x: 200000, y: 400000, shape: "circle", radius: 90000 },
      { x: 400000, y: 400000, shape: "circle", radius: 90000 },
      { x: 600000, y: 400000, shape: "rectangle", width: 90000, height: 180000, },
      { x: 800000, y: 400000, shape: "rectangle", width: 180000, height: 180000, },
    ],
  });

  /*const [wells, setWells] = useState([
    { x: 200, y: 200, radius: 90, color: "red", selected: false },
    { x: 400, y: 200, radius: 90, color: "red", selected: false },
    { x: 600, y: 200, radius: 90, color: "red", selected: false },
    { x: 800, y: 200, radius: 90, color: "red", selected: false },
    { x: 200, y: 400, radius: 90, color: "red", selected: false },
    { x: 400, y: 400, radius: 90, color: "red", selected: false },
    { x: 600, y: 400, radius: 90, color: "red", selected: false },
    { x: 800, y: 400, radius: 90, color: "red", selected: false },
  ]);*/

  const [scale, setScale] = useState(1);
  const [offset, setOffset] = useState({ x: 0, y: 0 });

  const [showMenu, setShowMenu] = useState(false);
  const [menuPosition, setMenuPosition] = useState({ x: 0, y: 0 });
  const [menuPositionLocal, setMenuPositionLocal] = useState({ x: 0, y: 0 });

  const [isCanvasDragging, setIsCanvasDragging] = useState(false);
  const dragCanvasStart = useRef({ x: 0, y: 0 });

  const [mouseDownFlag, setMouseDownFlag] = useState(false);
  const [mouseDownPosition, setMouseDownPosition] = useState({ x: 0, y: 0 });
  const [mouseMovePosition, setMouseMovePosition] = useState({ x: 0, y: 0 });

  const [isCtrlKeyPressed, setIsCtrlKeyPressed] = useState(false);
  const [isShiftKeyPressed, setIsShiftKeyPressed] = useState(false);

  //mode: single
  const [dragPointIndex, setDragPointIndex] = useState(-1);

  //##################################################################################

  // redux dispatcher
  const dispatch = useDispatch();

  // Access global Redux state
  const wellSelectorState = useSelector(
    wellSelectorSlice.getWellSelectorState
  );
  const experimentState = useSelector(experimentSlice.getExperimentState);
  const hardwareState = useSelector(hardwareSlice.getHardwareState);

  const position = useSelector(positionSlice.getPosition);

  //##################################################################################
  useImperativeHandle(ref, () => ({
    resetView: () => {
      //reset scale and offset
      setScale(1);
      setOffset({ x: 0, y: 0 });
    },
  }));

  //##################################################################################
  useEffect(() => {
    //get canvas ref
    const canvas = canvasRef.current;

    //focus canvas
    canvas.focus();

    // Add event listener to prevent default scrolling for the canvas
    const preventDefaultScroll = (e) => {
      if (e.ctrlKey) e.preventDefault();
    };
    canvas.addEventListener("wheel", preventDefaultScroll, { passive: false });

    return () => {
      canvas.removeEventListener("wheel", preventDefaultScroll);
    };
  }, []);

  //##################################################################################
  useEffect(() => {
    // Draw canvas content
    renderCanvas();
  }, [
    scale,
    offset,
    wellSelectorState,
    experimentState,
    hardwareState,
    wellLayout,
    mouseDownFlag,
    mouseDownPosition,
    mouseMovePosition,
    position,
  ]);

  //##################################################################################
  const calcPixelToPhysicalRatio = () => {
    return canvasRef.current.width / wellLayout.width;
    //return canvasRef.current.height / wellLayout.height; // should be the same like width ratio
  };

  const calcPhy2Px = (physical) => {
    return physical * calcPixelToPhysicalRatio();
  };

  const calcPx2Phy = (pixel) => {
    return pixel / calcPixelToPhysicalRatio();
  };

  const drawWell = (ctx, well, strokeStyle = "black", lineWidth = 2) => {
    // Convert physical values into pixel space
    const x = calcPhy2Px(well.x);
    const y = calcPhy2Px(well.y);
    const radius = calcPhy2Px(well.radius);
    const width = calcPhy2Px(well.width);
    const height = calcPhy2Px(well.height);

    // Set the drawing style (use defaults if not provided)
    ctx.strokeStyle = strokeStyle;
    ctx.lineWidth = lineWidth;

    // Draw well based on its shape
    if (well.shape === "circle") {
      // Draw a circle
      ctx.beginPath();
      ctx.arc(x, y, radius, 0, Math.PI * 2);
      ctx.stroke();
    } else if (well.shape === "rectangle") {
      // Draw a rectangle
      const topLeftX = x - width / 2;
      const topLeftY = y - height / 2;
      ctx.strokeRect(topLeftX, topLeftY, width, height);
    }
  };

  function isWellInsideSelection(well, fromPositionPx, toPositionPx) {
    // Convert positions using calcPx2Phy
    const fromX = calcPx2Phy(fromPositionPx.x);
    const fromY = calcPx2Phy(fromPositionPx.y);
    const toX = calcPx2Phy(toPositionPx.x);
    const toY = calcPx2Phy(toPositionPx.y);
  
    //shape
    let isInside = false;
    if(well.shape == "circle"){
        isInside = wsUtils.isCircleInsideRect(well.x, well.y, well.radius, fromX, fromY, toX, toY);
    }else if(well.shape == "rectangle")
    {
        isInside = wsUtils.isRectInsideRect(well.x, well.y, well.width, well.height, fromX, fromY, toX, toY);
        //console.log("isWellInsideSelection::isRectInsideRect", isInside)
    }

    // Check if the well (circle) is inside the rectangle using wsUtils
    return isInside;
  }

  //##################################################################################
  const renderCanvas = () => {
    console.log("renderCanvas");
    
    //------------ create canvas
    const canvas = canvasRef.current;
    const ctx = canvas.getContext("2d");

    //ctx.save();

    // Get the parent element's width
    const offsetWidth = canvas.parentElement.offsetWidth;
    const clientWidth = canvas.parentElement.clientWidth;
    //console.log("Parent width:", offsetWidth, clientWidth);

    //set canvas dimensions
    const aspectRatio = wellLayout.width / wellLayout.height;
    canvas.width = clientWidth;
    canvas.height = clientWidth / aspectRatio;
    //console.log("canvas", canvas.width, canvas.height, "---", aspectRatio);

    let ratioX = canvas.width / wellLayout.width;
    let ratioY = canvas.height / wellLayout.height;
    //console.log("ratio", ratioX, ratioY, calcPixelToPhysicalRatio());

    //------------ clear all draws
    ctx.clearRect(0, 0, ctx.canvas.width, ctx.canvas.height);

    //------------  Apply translation and scaling
    ctx.translate(offset.x, offset.y);
    ctx.scale(scale, scale);

    //------------  BG
    ctx.fillStyle = "white"; // Replace with your desired background color
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    ////------------ draw raster
    /*
    ctx.strokeStyle = "rgb(230, 230, 230)"; // Grid line color
    ctx.lineWidth = 1;
    for (let x = 0; x < canvas.width; x += wellSelectorState.rasterWidth) {
      for (let y = 0; y < canvas.height; y += wellSelectorState.rasterHeight) {
        ctx.strokeRect(
          x,
          y,
          wellSelectorState.rasterWidth,
          wellSelectorState.rasterHeight
        );
      }
    } */

    //------------ draw wells
    wellLayout.wells.forEach((well) => {
      //draw well
      drawWell(ctx, well, "black", 2);
    });

    //------------ draw wells DEPRECATED
    /*
      wells.forEach((well) => {
        const { x, y, radius, color, selected } = well;
  
        ctx.beginPath();
        ctx.arc(x, y, radius, 0, Math.PI * 2);
        ctx.strokeStyle = "black";
        ctx.lineWidth = 2;
        ctx.stroke();
      }); */

    //------------  draw global point list path
    if (experimentState.pointList.length > 0) {
      ctx.strokeStyle = "lightblue"; // Line color
      ctx.lineWidth = 2; // Line width
      ctx.beginPath();
      ctx.moveTo(calcPhy2Px(experimentState.pointList[0].x), calcPhy2Px(experimentState.pointList[0].y)); // Move to the first point
      experimentState.pointList.forEach((itPoint) => {
        ctx.lineTo(calcPhy2Px(itPoint.x), calcPhy2Px(itPoint.y)); // Draw lines to each point
      });
      ctx.stroke(); // Apply the stroke to actually draw the path
    }

    //------------ draw global point list
    experimentState.pointList.forEach((itPoint, index) => {
      // Define the square's position and size
      const squareWidth = wellSelectorState.rasterWidth;
      const squareHeight = wellSelectorState.rasterHeight;

      //center square
      const squareX = calcPhy2Px(itPoint.x) - squareWidth / 2;
      const squareY = calcPhy2Px(itPoint.y) - squareHeight / 2;

      // draw neighbors around the original rectangle
      ctx.strokeStyle = "lightgray"; // Black color for the square's outline
      ctx.lineWidth = 1; // Line width for the square
      ctx.lineCap = "round"; // Rounded ends for lines
      const numNeighbors = wellSelectorState.pointNeighbors; // Number of neighbor layers
      for (let i = -numNeighbors; i <= numNeighbors; i++) {
        for (let j = -numNeighbors; j <= numNeighbors; j++) {
          if (i === 0 && j === 0) continue; // Skip the center (original rectangle)
          // Calculate position for the neighboring rectangle
          const neighborX =
            squareX + i * squareWidth * (wellSelectorState.overlapWidth - 1);
          const neighborY =
            squareY + j * squareHeight * (wellSelectorState.overlapHeight - 1);
          // Draw the neighboring rectangle  //neighborX*wellSelectorState.overlapWidth, neighborY*wellSelectorState.overlapHeight
          ctx.strokeRect(neighborX, neighborY, squareWidth, squareHeight);
        }
      }

      // Draw center square
      ctx.strokeStyle = "black"; // Black color for the square's outline
      ctx.lineWidth = 1; // Line width for the square
      ctx.lineCap = "round"; // Rounded ends for lines

      //handle state
      if (wellSelectorState.mode == Mode.SINGLE_SELECT) {
        //check if mouse down
        if (mouseDownFlag) {
          //check if point is dragged by the user
          if (dragPointIndex == index) {
            ctx.strokeStyle = "red"; //display point in red while dragged by the user
          }
        } else {
          //check if mouse is over point while moving without dragging
          if (
            wsUtils.isPointInsideRect(
              mouseMovePosition,
              {x:calcPhy2Px(itPoint.x), y:calcPhy2Px(itPoint.y)},
              squareWidth,
              squareHeight
            )
          ) {
            ctx.strokeStyle = "red"; //show selected point red
          }
        }
      }

      // Draw the square
      ctx.beginPath();
      ctx.rect(squareX, squareY, squareWidth, squareHeight); // Draw the square
      ctx.stroke();

      // draw the index as label
      ctx.font = "20px Arial";
      ctx.fillStyle = ctx.strokeStyle; //"black"; use same color for text
      const textWidth = ctx.measureText(index).width;
      const textX = squareX; //itPoint.x - textWidth / 2;
      const textY = squareY - 2; //itPoint.y + 10; // Adjust for vertical alignment
      ctx.fillText(index, textX, textY);
    });

    //------------ draw mode area select
    if (wellSelectorState.mode == Mode.AREA_SELECT) {
      if (mouseDownFlag) {
        //draw the tiles
        ctx.strokeStyle = "red"; // Grid line color
        ctx.lineWidth = 1 / scale;

        // Ensure the starting and ending positions are always in the correct order
        const startX = Math.min(mouseDownPosition.x, mouseMovePosition.x);
        const endX = Math.max(mouseDownPosition.x, mouseMovePosition.x);
        const startY = Math.min(mouseDownPosition.y, mouseMovePosition.y);
        const endY = Math.max(mouseDownPosition.y, mouseMovePosition.y);

        // Draw squares inside the bounding box
        for (
          let x = startX;
          x < endX - wellSelectorState.rasterWidth;
          x += wellSelectorState.rasterWidth
        ) {
          for (
            let y = startY;
            y < endY - wellSelectorState.rasterHeight;
            y += wellSelectorState.rasterHeight
          ) {
            ctx.strokeRect(
              x,
              y,
              wellSelectorState.rasterWidth,
              wellSelectorState.rasterHeight
            );
          }
        }

        //draw the bounding box
        ctx.strokeStyle = "blue";
        ctx.lineWidth = 2;
        ctx.strokeRect(
          mouseDownPosition.x,
          mouseDownPosition.y,
          mouseMovePosition.x - mouseDownPosition.x,
          mouseMovePosition.y - mouseDownPosition.y
        );
      }
    }

    //------------ draw mode cup select
    if (wellSelectorState.mode == Mode.CUP_SELECT) {
      if (mouseDownFlag) {
        //draw selected wells (simply overdraw the wells)
        wellLayout.wells.forEach((well) => {  
            if(isWellInsideSelection(well, mouseDownPosition, mouseMovePosition))
            {
                drawWell(ctx, well, "red", 2);
            }
        });

        //draw the bounding box
        ctx.strokeStyle = "blue";
        ctx.lineWidth = 2;
        ctx.strokeRect(
          mouseDownPosition.x,
          mouseDownPosition.y,
          mouseMovePosition.x - mouseDownPosition.x,
          mouseMovePosition.y - mouseDownPosition.y
        );
      }
    }

    //------------ draw mode move camera
    if (wellSelectorState.mode == Mode.MOVE_CAMERA) {
      // Define rectangle dimensions
      const rectWidth = wellSelectorState.rasterWidth;
      const rectHeight = wellSelectorState.rasterHeight;
      const rectX = mouseMovePosition.x;
      const rectY = mouseMovePosition.y;

      // Define cross dimensions
      const crossSize = Math.min(rectWidth, rectHeight) / 2;

      // Draw the rectangle (centered at rectX, rectY)
      ctx.beginPath();
      // Adjust to position rectangle centered at rectX, rectY
      ctx.rect(
        rectX - rectWidth / 2,
        rectY - rectHeight / 2,
        rectWidth,
        rectHeight
      );
      ctx.stroke(); // Stroke the rectangle

      // Calculate center of the rectangle (rectX, rectY are the center now)
      const centerX = rectX;
      const centerY = rectY;

      // Draw the cross inside the rectangle, centered
      // Vertical line of the cross
      ctx.beginPath();
      ctx.moveTo(centerX, centerY - crossSize / 2);
      ctx.lineTo(centerX, centerY + crossSize / 2);
      ctx.stroke();

      // Horizontal line of the cross
      ctx.beginPath();
      ctx.moveTo(centerX - crossSize / 2, centerY);
      ctx.lineTo(centerX + crossSize / 2, centerY);
      ctx.stroke();
    }

    //------------ draw global position
    ctx.beginPath();
    ctx.arc(position.x, position.y, 4, 0, Math.PI * 2);
    ctx.fillStyle = "red";
    ctx.fill();

    //------------ draw camera position
    
    // Define the square's position and size
    const squareWidth = wellSelectorState.rasterWidth;
    const squareHeight = wellSelectorState.rasterHeight;

    //center square
    const squareX = calcPhy2Px(hardwareState.position.x) - squareWidth / 2;
    const squareY = calcPhy2Px(hardwareState.position.y) - squareHeight / 2;


    // draw neighbors around the original rectangle
    ctx.strokeStyle = "green"; // Black color for the square's outline
    ctx.lineWidth = 1; // Line width for the square
    ctx.lineCap = "round"; // Rounded ends for lines
    ctx.strokeRect(squareX, squareY, squareWidth, squareHeight);


    //------------  draw mode
    ctx.font = "20px Arial";
    ctx.fillStyle = "black";
    ctx.fillText(wellSelectorState.mode, 10, 30);

    //------------  draw mouse up or down
    const status = mouseDownFlag
      ? `Mouse Down: ${Math.floor(mouseDownPosition.x)}x${Math.floor(
          mouseDownPosition.y
        )}`
      : "Mouse Up";
    ctx.fillText(status, 10, 50);

    //------------ draw mouse move
    if (mouseDownFlag) {
      ctx.fillText(
        `Mouse Move: ${Math.floor(mouseMovePosition.x)}x${Math.floor(
          mouseMovePosition.y
        )}`,
        10,
        70
      );
    }

    //ctx.restore();
  };

  //##################################################################################
  const handleWheel = (e) => {
    if (!e.ctrlKey) return; // Allow zoom only if Ctrl is pressed
    e.preventDefault();

    const canvas = canvasRef.current;
    const rect = canvas.getBoundingClientRect();

    // Mouse position relative to the canvas
    const mouseX = e.clientX - rect.left;
    const mouseY = e.clientY - rect.top;

    // Convert mouse position to canvas coordinates
    const canvasX = (mouseX - offset.x) / scale;
    const canvasY = (mouseY - offset.y) / scale;

    // Calculate the new scale
    const zoomMin = 0.5;
    const zoomMax = 10;
    const zoomFactor = 0.1;
    const newScale = Math.min(
      Math.max(scale - e.deltaY * zoomFactor * 0.01, zoomMin),
      zoomMax
    );

    // Adjust the offset so the zoom centers around the mouse position
    const scaleChange = newScale / scale;

    // Correct offset adjustment to zoom around the mouse
    const newOffsetX = mouseX - canvasX * newScale;
    const newOffsetY = mouseY - canvasY * newScale;

    // Update state
    setOffset({ x: newOffsetX, y: newOffsetY });
    setScale(newScale);
  };

  //##################################################################################
  const handleMouseDown = (e) => {
    console.log("handleMouseDown");

    //filter only left mouse
    if (e.button != 0) return;

    //drag mouse down
    //const canvasRect = canvasRef.current.getBoundingClientRect();
    const newMousePosition = getLocalMousePosition(e);
    setMouseDownFlag(true);
    setMouseDownPosition(newMousePosition);

    // Allow dragging only if Ctrl is pressed
    if (e.ctrlKey) {
      //handle drag
      setIsCanvasDragging(true);
      dragCanvasStart.current = {
        x: e.clientX - offset.x,
        y: e.clientY - offset.y,
      };
      return;
    }

    //handle mode
    if (wellSelectorState.mode == Mode.SINGLE_SELECT) {
      //for each point
      experimentState.pointList.forEach((itPoint, index) => {
        //check if mouse is over point
        if (
          wsUtils.isPointInsideRect(
            mouseMovePosition,
            {x:calcPhy2Px(itPoint.x), y:calcPhy2Px(itPoint.y)},
            wellSelectorState.rasterWidth,
            wellSelectorState.rasterHeight
          )
        ) {
          console.log("setDragPointIndex");
          //start drag
          setDragPointIndex(index);
          return;
        }
      });
    }
  };

  //##################################################################################
  const handleMouseMove = (e) => {
    console.log("handleMouseMove");
    //handle mouse move
    const newMousePosition = getLocalMousePosition(e);
    const canvasRect = canvasRef.current.getBoundingClientRect();
    setMouseMovePosition(newMousePosition);
    dispatch(positionSlice.setPosition({ ...newMousePosition, z: 0 }));

    //handle mode
    if (wellSelectorState.mode == Mode.SINGLE_SELECT) {
      if (mouseDownFlag && dragPointIndex != -1) {
        //copy and update point
        let newPoint = { ...experimentState.pointList[dragPointIndex] };
        newPoint.x = calcPx2Phy(newMousePosition.x);
        newPoint.y = calcPx2Phy(newMousePosition.y);
        //save point in redux
        dispatch(
          experimentSlice.replacePoint({
            index: dragPointIndex,
            newPoint: newPoint,
          })
        );
      }
    }

    //handle offset
    if (!isCanvasDragging) return;
    setOffset({
      x: e.clientX - dragCanvasStart.current.x,
      y: e.clientY - dragCanvasStart.current.y,
    });
  };

  //##################################################################################
  const handleMouseUp = (e) => {
    console.log("handleMouseUp");

    //handle mode single select
    if (wellSelectorState.mode == Mode.SINGLE_SELECT) {
      setDragPointIndex(-1);
    }

    //handle mode cup select
    if (wellSelectorState.mode == Mode.CUP_SELECT) {
      //check mouse
      if (mouseDownFlag) {
        //check selected wells
        wellLayout.wells.forEach((well) => {
          //create point if it is selected
          if (isWellInsideSelection(well, mouseDownPosition, mouseMovePosition)) {
            createNewPoint({ x: (well.x), y: (well.y) });
          }
        });
      }
    }

    //set flags
    setMouseDownFlag(false);
    setIsCanvasDragging(false);
  };

  //##################################################################################
  const handleClick = (e) => {
    const localPos = getLocalMousePosition(e);
    console.log(`handleClick: X: ${localPos.x}, Y: ${localPos.y}`);

    //avoid strg
    if (e.ctrlKey) return;

    //hide context menu
    if (showMenu) {
      setShowMenu(false);
      return;
    }

    //handle mode
    /*
    if (wellSelectorState.mode == Mode.SINGLE_SELECT) {
      //TODO if point is under mouse -> remove
      //TODO else -> add

      const localPos = getLocalMousePosition(e);
      //console.log(`handleMouseUp: X: ${localPos.x}, Y: ${localPos.y}`);

      //find selection point
      const selectedIndex = pointList.findIndex((p) => {
        const halfSize = wellSelectorState.rasterSize / 2;
        return (
          localPos.x > p.x - halfSize &&
          localPos.x < p.x + halfSize &&
          localPos.y > p.y - halfSize &&
          localPos.y < p.y + halfSize
        );
      });

      console.log(selectedIndex);

      //handle
      if (selectedIndex != -1) {
        //remove point
        dispatch(pointsSlice.removePoint(selectedIndex));
      } else {
        //create new point
        const newPoint = {
          id: "0",
          name: "Point A",
          x: localPos.x,
          y: localPos.y,
        };
        dispatch(pointsSlice.addPoint(newPoint));
      }
    }
      */
  };

  //##################################################################################
  const handleContextMenu = (event) => {
    //prevent default right click
    event.preventDefault();
    //prevent menu on ctrl
    if (event.ctrlKey) return;
    //show menu
    const canvasBounds = canvasRef.current.getBoundingClientRect();
    const xPos = event.clientX - canvasBounds.left;
    const yPos = event.clientY - canvasBounds.top;
    setMenuPosition({ x: xPos, y: yPos });
    setMenuPositionLocal(getLocalMousePosition(event));
    setShowMenu(true);
  };

  //##################################################################################
  const handleKeyDown = (event) => {
    console.log("handleKeyDown", event.ctrlKey);
    setIsCtrlKeyPressed(event.ctrlKey);
    setIsShiftKeyPressed(event.shiftKey);
  };

  //##################################################################################
  const handleKeyUp = (event) => {
    console.log("handleKeyDown", event.ctrlKey);
    setIsCtrlKeyPressed(event.ctrlKey);
    setIsShiftKeyPressed(event.shiftKey);
  };

  //##################################################################################
  const getLocalMousePosition = (e) => {
    const canvas = canvasRef.current;
    const rect = canvas.getBoundingClientRect(); // Get canvas position in the viewport

    // Mouse position relative to the canvas
    const canvasX = e.clientX - rect.left;
    const canvasY = e.clientY - rect.top;

    // Convert global canvas position to local canvas coordinates considering scale and offset
    const localX = (canvasX - offset.x) / scale;
    const localY = (canvasY - offset.y) / scale;

    return { x: localX, y: localY };
  };

  //##################################################################################
  const getCursorStyle = () => {
    //handle canvas drag
    if (isCtrlKeyPressed) {
      return isCanvasDragging ? "grabbing" : "grab";
    }

    //handle single select
    if (wellSelectorState.mode == Mode.SINGLE_SELECT) {
      if (dragPointIndex != -1) {
        return "grabbing";
      }
    }

    //default
    return "default";
  };

  //##################################################################################
  const createNewPoint = (position) => {
    //create new point
    const newPoint = {
      id: "0",
      name: "Point A",
      x: position.x,
      y: position.y,
    };
    dispatch(experimentSlice.addPoint(newPoint));
  };

  //##################################################################################
  const createContextMenuActionList = () => {
    //create list
    let actionList = [];
    //handle mode
    if (wellSelectorState.mode == Mode.SINGLE_SELECT) {
      //search points below mouse
      let pointIndex = -1;
      experimentState.pointList.forEach((itPoint, index) => {
        if (
          wsUtils.isPointInsideRect(
            mouseMovePosition,
            {x:calcPhy2Px(itPoint.x), y:calcPhy2Px(itPoint.y)},
            wellSelectorState.rasterWidth,
            wellSelectorState.rasterHeight
          )
        ) {
          pointIndex = index;
        }
      });

      // build acton list
      if (pointIndex != -1) {
        actionList.push({
          label: "Remove Point",
          action: () => (
            dispatch(experimentSlice.removePoint(pointIndex)), setShowMenu(false)
          ),
        });
      } else {
        actionList.push({
          label: "Add Point",
          action: () => (createNewPoint({x:calcPx2Phy(menuPositionLocal.x), y:calcPx2Phy(menuPositionLocal.y)}), setShowMenu(false)),
        });
      }
    }
    //return list
    return actionList;
  };

  //##################################################################################
  return (
    <div
      style={{
        position: "relative",
        border: "1px solid white", //TODO RM ME
        overflow: "hidden",
        //width: "100%",
        //height: "100%"
      }}
    >
      {/* canvas */}
      <canvas
        ref={canvasRef}
        tabIndex="0" // Make it focusable for key down event and canvas focus
        onWheel={handleWheel} // Zoom only with Ctrl
        onMouseDown={handleMouseDown} // Start dragging
        onMouseMove={handleMouseMove} // Handle dragging movement
        onMouseUp={handleMouseUp} // Stop dragging
        onMouseLeave={handleMouseUp} // Stop dragging if mouse leaves canvas
        onClick={handleClick} // Log local position on click
        onKeyDown={handleKeyDown}
        onKeyUp={handleKeyUp}
        onContextMenu={handleContextMenu}
        style={{
          //border: "1px solid white", //Note: dont set border size because it leads to canvas grow (canvas.parentElement.clientWidth)
          cursor: getCursorStyle(),
          display: "block",
        }}
      />
      {/* canvas end */}

      {/* context menu */}
      {showMenu && (
        <div
          style={{
            position: "absolute",
            top: menuPosition.y,
            left: menuPosition.x,
            background: "",
            display: "flex",
            flexDirection: "column",
          }}
        >
          {createContextMenuActionList().map((action, index) => (
            <button key={index} onClick={action.action}>
              {action.label}
            </button>
          ))}
        </div>
      )}
      {/* context menu end */}
    </div>
  );
});

//##################################################################################

export default WellSelectorCanvas;
