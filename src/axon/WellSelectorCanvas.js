import React, { useRef, useEffect, useState } from "react";
import { forwardRef, useImperativeHandle } from "react";
import { useDispatch, useSelector } from "react-redux";

import * as wellSelectorSlice from "../state/slices/WellSelectorSlice.js";
import * as experimentSlice from "../state/slices/ExperimentSlice.js";
import * as positionSlice from "../state/slices/PositionSlice.js";
import * as objectiveSlice from "../state/slices/ObjectiveSlice.js";

import * as wsUtils from "./WellSelectorUtils.js";
import apiPositionerControllerMovePositioner from "../backendapi/apiPositionerControllerMovePositioner.js";

import fetchObjectiveControllerGetStatus from "../middleware/fetchObjectiveControllerGetStatus.js";

import { X } from "@mui/icons-material";

//##################################################################################

export const Mode = Object.freeze({
  SINGLE_SELECT: "single",
  CUP_SELECT: "cup",
  AREA_SELECT: "area",
  MOVE_CAMERA: "camera",
});

export const Shape = Object.freeze({
  EMPTY: "",
  RECTANGLE: "rectangle",
  CIRCLE: "circle",
});

//##################################################################################
const WellSelectorCanvas = forwardRef((props, ref) => {
  const canvasRef = useRef(null);
  const parentRef = useRef(null);
  const isRendering = useRef(false);

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
  const wellSelectorState = useSelector(wellSelectorSlice.getWellSelectorState);
  const experimentState = useSelector(experimentSlice.getExperimentState);
  const positionState = useSelector(positionSlice.getPositionState);
  const objectiveState = useSelector(objectiveSlice.getObjectiveState);

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
  }, []); //Triggered on component startup

  //##################################################################################
  useEffect(() => {
    //initial fov request
    //console.log("initial fov request ");
    fetchObjectiveControllerGetStatus(dispatch);
  }, []); //TODO maybe add connection change

  //##################################################################################
  useEffect(() => {
    // Draw canvas content when state changed
    renderCanvas();
  }, [
    scale,
    offset,
    wellSelectorState,
    experimentState,
    mouseDownFlag,
    mouseDownPosition,
    mouseMovePosition,
    positionState,
    objectiveState,
  ]);

  //##################################################################################

  //##################################################################################
  const calcPixelToPhysicalRatio = () => {
    return canvasRef.current.width / experimentState.wellLayout.width;
    //return canvasRef.current.height / experimentState.wellLayout.height; // should be the same like width ratio
  };

  const calcPhy2Px = (physical) => {
    return physical * calcPixelToPhysicalRatio();
  };

  const calcPx2Phy = (pixel) => {
    return pixel / calcPixelToPhysicalRatio();
  };

  const calcPhyPoint2PxPoint = (point) => ({
    x: point.x * calcPixelToPhysicalRatio(),
    y: point.y * calcPixelToPhysicalRatio(),
  });

  const calcPxPoint2PhyPoint = (point) => ({
    x: point.x / calcPixelToPhysicalRatio(),
    y: point.y / calcPixelToPhysicalRatio(),
  });

  //##################################################################################
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

    //draw name if exsists
    if (well.name) {
      ctx.font = "12px Arial";
      ctx.fillStyle = strokeStyle;
      ctx.textAlign = "center";
      ctx.fillText(well.name, x, y);
    }
  };

  //##################################################################################
  function drawRectangleWithCross(ctx, rectPosition, rectWidth, rectHeight) {
    // Define the center of the rectangle
    const rectCenterX = rectPosition.x;
    const rectCenterY = rectPosition.y;

    // Define cross dimensions (half of the smallest dimension of the rectangle)
    const crossSize = Math.min(rectWidth, rectHeight) / 2;

    // Draw the rectangle (centered at rectCenterX, rectCenterY)
    ctx.beginPath();
    ctx.rect(
      rectCenterX - rectWidth / 2,
      rectCenterY - rectHeight / 2,
      rectWidth,
      rectHeight
    );
    ctx.stroke(); // Stroke the rectangle

    // Draw the cross inside the rectangle, centered
    // Vertical line of the cross
    ctx.beginPath();
    ctx.moveTo(rectCenterX, rectCenterY - crossSize / 2);
    ctx.lineTo(rectCenterX, rectCenterY + crossSize / 2);
    ctx.stroke();

    // Horizontal line of the cross
    ctx.beginPath();
    ctx.moveTo(rectCenterX - crossSize / 2, rectCenterY);
    ctx.lineTo(rectCenterX + crossSize / 2, rectCenterY);
    ctx.stroke();
  }

  //##################################################################################
  function isWellInsideSelection(well, fromPositionPx, toPositionPx) {
    // Convert positions using calcPx2Phy
    const fromX = calcPx2Phy(fromPositionPx.x);
    const fromY = calcPx2Phy(fromPositionPx.y);
    const toX = calcPx2Phy(toPositionPx.x);
    const toY = calcPx2Phy(toPositionPx.y);

    //shape
    let isInside = false;
    if (well.shape == "circle") {
      isInside = wsUtils.isCircleInsideRect(
        well.x,
        well.y,
        well.radius,
        fromX,
        fromY,
        toX,
        toY
      );
    } else if (well.shape == "rectangle") {
      isInside = wsUtils.isRectInsideRect(
        well.x,
        well.y,
        well.width,
        well.height,
        fromX,
        fromY,
        toX,
        toY
      );
      //console.log("isWellInsideSelection::isRectInsideRect", isInside)
    }

    // Check if the well (circle) is inside the rectangle using wsUtils
    return isInside;
  }

  //##################################################################################

  function getRasterWidthAsPx() {
    return calcPhy2Px(objectiveState.fovX);
  }

  function getRasterHeightAsPx() {
    return calcPhy2Px(objectiveState.fovY);
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
    const aspectRatio =
      experimentState.wellLayout.width / experimentState.wellLayout.height;
    canvas.width = clientWidth;
    canvas.height = clientWidth / aspectRatio;
    //console.log("canvas", canvas.width, canvas.height, "---", aspectRatio);

    let ratioX = canvas.width / experimentState.wellLayout.width;
    let ratioY = canvas.height / experimentState.wellLayout.height;
    //console.log("ratio", ratioX, ratioY, calcPixelToPhysicalRatio());

    //------------ clear all draws

    ctx.clearRect(0, 0, ctx.canvas.width, ctx.canvas.height);

    //------------ apply translation and scaling

    ctx.translate(offset.x, offset.y);
    ctx.scale(scale, scale);

    //------------  draw background

    //ctx.fillStyle = "white"; // Replace with your desired background color
    //ctx.fillRect(0, 0, canvas.width, canvas.height);

    //------------ draw the border

    ctx.beginPath();
    ctx.fillStyle = "white";
    ctx.strokeStyle = "darkgray"; // Border color
    ctx.lineWidth = 8; // Border thickness

    // Draw three sides: left, right, and bottom
    const boffset = 4;
    const triangleSize = ctx.canvas.height * 0.05;
    ctx.moveTo(boffset, triangleSize);
    ctx.lineTo(triangleSize + boffset, boffset);
    ctx.lineTo(canvas.width - boffset, boffset); // Top (not drawn here, so no need for this)
    ctx.lineTo(canvas.width - boffset, canvas.height - boffset); // Right
    ctx.lineTo(boffset, canvas.height - boffset); // Bottom
    ctx.closePath();

    ctx.stroke(); // Apply the stroke
    ctx.fill();

    //------------ draw raster
    /*
    ctx.strokeStyle = "rgb(230, 230, 230)"; // Grid line color
    ctx.lineWidth = 1;
    for (let x = 0; x < canvas.width; x += getRasterWidthAsPx()) {
      for (let y = 0; y < canvas.height; y += getRasterHeightAsPx()) {
        ctx.strokeRect(
          x,
          y,
          getRasterWidthAsPx(),
          getRasterHeightAsPx()
        );
      }
    } */

    //------------ draw wells

    experimentState.wellLayout.wells.forEach((well) => {
      //draw well
      drawWell(ctx, well, "darkgray", 2);
    });

    //------------  draw global point list path

    if (experimentState.pointList.length > 0) {
      ctx.strokeStyle = "lightblue"; // Line color
      ctx.lineWidth = 2; // Line width
      ctx.beginPath();
      ctx.moveTo(
        calcPhy2Px(experimentState.pointList[0].x),
        calcPhy2Px(experimentState.pointList[0].y)
      ); // Move to the first point
      experimentState.pointList.forEach((itPoint) => {
        ctx.lineTo(calcPhy2Px(itPoint.x), calcPhy2Px(itPoint.y)); // Draw lines to each point
      });
      ctx.stroke(); // Apply the stroke to actually draw the path
    }

    //------------ draw global point list

    experimentState.pointList.forEach((itPoint, index) => {
      // Define the square's position and size
      const rasterWidthOverlapedPx =
        getRasterWidthAsPx() * (1 - wellSelectorState.overlapWidth);
      const rasterHeightOverlapedPx =
        getRasterHeightAsPx() * (1 - wellSelectorState.overlapHeight);

      //center square
      const pointCenterXpx = calcPhy2Px(itPoint.x); // - Math.min(squareWidth, getRasterWidthAsPx()) / 2;
      const pointCenterYpx = calcPhy2Px(itPoint.y); // - Math.min(squareHeight, getRasterHeightAsPx()) / 2;

      // Draw neighbors around the original rectangle in a grid pattern, but avoid corners and increase roundness
      ctx.strokeStyle = "lightgray"; // Light gray color for the outlines
      ctx.fillStyle = "rgba(0, 0, 0, 0.01)"; // Black color for the square's fill
      ctx.lineWidth = 1; // Line width for the rectangles
      ctx.lineCap = "round"; // Rounded ends for lines

      //calc neighbors
      let neighborPointList = [];
      if (itPoint.shape == Shape.CIRCLE) {
        //calc neighbors
        const rasterCenterPx = {
          x: calcPhy2Px(itPoint.x),
          y: calcPhy2Px(itPoint.y),
        };

        neighborPointList = wsUtils.calculateRasterOval(
          rasterCenterPx,
          rasterWidthOverlapedPx,
          rasterHeightOverlapedPx,
          calcPhy2Px(itPoint.circleRadiusX),
          calcPhy2Px(itPoint.circleRadiusY)
        );
      } else if (itPoint.shape == Shape.RECTANGLE) {
        //calc neighbors
        const rasterCenterPx = {
          x: calcPhy2Px(itPoint.x),
          y: calcPhy2Px(itPoint.y),
        };

        neighborPointList = wsUtils.calculateRasterRect(
          rasterCenterPx,
          rasterWidthOverlapedPx,
          rasterHeightOverlapedPx,
          calcPhy2Px(itPoint.rectPlusX),
          calcPhy2Px(itPoint.rectMinusX),
          calcPhy2Px(itPoint.rectPlusY),
          calcPhy2Px(itPoint.rectMinusY)
        );
      }

      // draw the neighbors
      neighborPointList.forEach((point) => {
        const neighborWidth = wellSelectorState.showOverlap
          ? getRasterWidthAsPx()
          : Math.min(rasterWidthOverlapedPx, getRasterWidthAsPx());
        const neighborHeight = wellSelectorState.showOverlap
          ? getRasterHeightAsPx()
          : Math.min(rasterHeightOverlapedPx, getRasterHeightAsPx());
        //const neighborWidth = Math.min(rasterWidthOverlaped, getRasterWidthAsPx());
        //const neighborHeight = Math.min(rasterHeightOverlaped, getRasterHeightAsPx());
        ctx.strokeStyle = "lightgray";
        ctx.fillRect(
          point.x - neighborWidth / 2,
          point.y - neighborHeight / 2,
          neighborWidth,
          neighborHeight
        );
        ctx.strokeRect(
          point.x - neighborWidth / 2,
          point.y - neighborHeight / 2,
          neighborWidth,
          neighborHeight
        );
      });

      //draw the point area shape
      if (wellSelectorState.showShape) {
        if (itPoint.shape == Shape.CIRCLE) {
          // Draw circle
          ctx.strokeStyle = "black";
          ctx.lineWidth = 1;
          ctx.beginPath();
          ctx.ellipse(
            calcPhy2Px(itPoint.x), // center x
            calcPhy2Px(itPoint.y), // center y
            calcPhy2Px(itPoint.circleRadiusX),
            calcPhy2Px(itPoint.circleRadiusY),
            0, // rotation
            0, // start angle
            2 * Math.PI // end angle
          );
          ctx.stroke();
        } else if (itPoint.shape == Shape.RECTANGLE) {
          // Draw rectangle
          ctx.strokeStyle = "black";
          ctx.lineWidth = 1;
          ctx.strokeRect(
            calcPhy2Px(itPoint.x - itPoint.rectMinusX),
            calcPhy2Px(itPoint.y - itPoint.rectMinusY),
            calcPhy2Px(itPoint.rectPlusX + itPoint.rectMinusX),
            calcPhy2Px(itPoint.rectPlusY + itPoint.rectMinusY)
          );
        }
      }

      // Draw center square
      ctx.strokeStyle = "black"; // Black color for the square's outline
      ctx.fillStyle = "rgba(0, 0, 0, 0.05)"; // Black color for the square's fill
      ctx.lineWidth = 1; // Line width for the square
      ctx.lineCap = "round"; // Rounded ends for lines

      // check if center square selected
      if (wellSelectorState.mode == Mode.SINGLE_SELECT) {
        //check if mouse down
        if (mouseDownFlag) {
          //check if point is dragged by the user
          if (dragPointIndex == index) {
            ctx.strokeStyle = "red"; //display point in red while dragged by the user
            ctx.fillStyle = "rgba(255, 0, 0, 0.5)"; // red color for the square's outline
          }
        } else {
          //check if mouse is over point while moving without dragging
          if (
            wsUtils.isPointInsideRect(
              mouseMovePosition,
              calcPhyPoint2PxPoint(itPoint),
              rasterWidthOverlapedPx,
              rasterHeightOverlapedPx
            )
          ) {
            ctx.strokeStyle = "red"; //show selected point red
            ctx.fillStyle = "rgba(255, 0, 0, 0.1)"; // red color for the square's outline
          }
        }
      }

      // Draw the square
      const centerWidth = wellSelectorState.showOverlap
        ? getRasterWidthAsPx()
        : Math.min(rasterWidthOverlapedPx, getRasterWidthAsPx());
      const centerHeight = wellSelectorState.showOverlap
        ? getRasterHeightAsPx()
        : Math.min(rasterHeightOverlapedPx, getRasterHeightAsPx());
      //const centerWidth = getRasterWidthAsPx();
      //const centerHeight = getRasterHeightAsPx();
      ctx.beginPath();
      ctx.rect(
        pointCenterXpx - centerWidth / 2,
        pointCenterYpx - centerHeight / 2,
        centerWidth,
        centerHeight
      );
      ctx.fill();
      ctx.stroke();

      // draw the index as label
      const fontSize = 10 / scale;
      ctx.font = `${fontSize}px Arial`;
      ctx.fillStyle = ctx.strokeStyle; //"black"; use same color for text
      const textWidth = ctx.measureText(index).width;
      const textX = pointCenterXpx - centerWidth / 2 + 2;
      const textY = pointCenterYpx - centerHeight / 2 - 2; // "-2" Adjust for vertical alignment
      ctx.fillText(index, textX, textY);
    });

    //------------ draw mode area select

    if (wellSelectorState.mode == Mode.AREA_SELECT) {
      if (mouseDownFlag) {
        // Define the square's position and size
        const rasterWidthOverlaped =
          getRasterWidthAsPx() * (1 - wellSelectorState.overlapWidth);
        const rasterHeightOverlaped =
          getRasterHeightAsPx() * (1 - wellSelectorState.overlapHeight);

        //draw the tiles
        ctx.strokeStyle = "red"; // Grid line color
        ctx.lineWidth = 1 / scale;

        //generate points in rect
        const pointsInRectList = wsUtils.generateCenterPointsInRect(
          mouseDownPosition,
          mouseMovePosition,
          rasterWidthOverlaped,
          rasterHeightOverlaped
        );

        // Draw squares inside the bounding box
        if (isShiftKeyPressed) {
          //shift: create multiple points
          //create multiple points
          pointsInRectList.forEach((point) => {
            const insideWidth = wellSelectorState.showOverlap
              ? getRasterWidthAsPx()
              : Math.min(rasterWidthOverlaped, getRasterWidthAsPx());
            const insideHeight = wellSelectorState.showOverlap
              ? getRasterHeightAsPx()
              : Math.min(rasterHeightOverlaped, getRasterHeightAsPx());
            //const insideWidth = getRasterWidthAsPx();
            //const insideHeight = getRasterHeightAsPx();
            ctx.strokeRect(
              point.x, // - insideWidth/2,
              point.y, // - insideHeight/2,
              insideWidth,
              insideHeight
            );
          });
        } else {
          //without shift: create single point
          //calc and draw center rect
          const centerPoint = wsUtils.calcCenterPoint(
            mouseDownPosition,
            mouseMovePosition
          );
          const usedWidth = wellSelectorState.showOverlap
            ? getRasterWidthAsPx()
            : Math.min(rasterWidthOverlaped, getRasterWidthAsPx());
          const usedHeight = wellSelectorState.showOverlap
            ? getRasterHeightAsPx()
            : Math.min(rasterHeightOverlaped, getRasterHeightAsPx());
          ctx.strokeRect(
            centerPoint.x - usedWidth / 2,
            centerPoint.y - usedHeight / 2,
            usedWidth,
            usedHeight
          );

          //calc neighbors
          const rectangleWidth = Math.abs(
            mouseMovePosition.x - mouseDownPosition.x
          );
          const rectangleHeight = Math.abs(
            mouseMovePosition.y - mouseDownPosition.y
          );

          const timesWidth = Math.floor(rectangleWidth / rasterWidthOverlaped);
          const timesHeight = Math.floor(
            rectangleHeight / rasterHeightOverlaped
          );
          const neighborsWidth = Math.ceil(timesWidth / 2);
          const neighborsHeight = Math.ceil(timesHeight / 2);

          // calc neighbor poitn list
          const neighborPointList = wsUtils.calculateNeighborPointsSquare(
            centerPoint.x,
            centerPoint.y,
            rasterWidthOverlaped,
            rasterHeightOverlaped,
            neighborsWidth,
            neighborsHeight
          );

          // draw neighbors
          neighborPointList.forEach((point) => {
            const neighborWidth = wellSelectorState.showOverlap
              ? getRasterWidthAsPx()
              : Math.min(rasterWidthOverlaped, getRasterWidthAsPx());
            const neighborHeight = wellSelectorState.showOverlap
              ? getRasterHeightAsPx()
              : Math.min(rasterHeightOverlaped, getRasterHeightAsPx());

            ctx.strokeRect(
              point.x - neighborWidth / 2,
              point.y - neighborHeight / 2,
              neighborWidth,
              neighborHeight
            );
          });
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
        experimentState.wellLayout.wells.forEach((well) => {
          if (
            isWellInsideSelection(well, mouseDownPosition, mouseMovePosition)
          ) {
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
      // draw mouse position
      ctx.strokeStyle = "black";
      drawRectangleWithCross(
        ctx,
        mouseMovePosition,
        getRasterWidthAsPx(),
        getRasterHeightAsPx()
      );
      // draw target camera position
      ctx.strokeStyle = "green";
      drawRectangleWithCross(
        ctx,
        calcPhyPoint2PxPoint(wellSelectorState.cameraTargetPosition),
        getRasterWidthAsPx(),
        getRasterHeightAsPx()
      );
    }

    //------------ draw camera position

    // Define the square's position and size
    const cameraWidth = getRasterWidthAsPx();
    const cameraHeight = getRasterHeightAsPx();

    //center square
    //console.log("rednerCanvas: draw camera position", positionState);
    const squareX = calcPhy2Px(positionState.x) - cameraWidth / 2;
    const squareY = calcPhy2Px(positionState.y) - cameraHeight / 2;

    // draw neighbors around the original rectangle
    ctx.strokeStyle = "red"; // Black color for the square's outline
    ctx.lineWidth = 1; // Line width for the square
    ctx.lineCap = "round"; // Rounded ends for lines
    ctx.strokeRect(squareX, squareY, cameraWidth, cameraHeight);

    //------------ draw mouse position

    ctx.beginPath();
    ctx.arc(mouseMovePosition.x, mouseMovePosition.y, 4, 0, Math.PI * 2);
    ctx.fillStyle = "red";
    ctx.fill();

    //------------ draw global position

    /*ctx.beginPath();
    ctx.arc(position.x, position.y, 4, 0, Math.PI * 2);
    ctx.fillStyle = "red";
    ctx.fill();*/

    //------------  draw mode

    /*ctx.font = "20px Arial";
    ctx.fillStyle = "black";
    ctx.fillText(wellSelectorState.mode, 10, 30);*/

    //------------  draw mouse up or down

    /*const status = mouseDownFlag
      ? `Mouse Down: ${Math.floor(mouseDownPosition.x)}x${Math.floor(
          mouseDownPosition.y
        )}`
      : "Mouse Up";
    ctx.fillText(status, 10, 50);*/

    //------------ draw mouse move

    /*if (mouseDownFlag) {
      ctx.fillText(
        `Mouse Move: ${Math.floor(mouseMovePosition.x)}x${Math.floor(
          mouseMovePosition.y
        )}`,
        10,
        70
      );
    }*/

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
            calcPhyPoint2PxPoint(itPoint),
            getRasterWidthAsPx(),
            getRasterHeightAsPx()
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
    //console.log("handleMouseMove");
    //handle mouse move
    const newMousePosition = getLocalMousePosition(e);
    const canvasRect = canvasRef.current.getBoundingClientRect();
    setMouseMovePosition(newMousePosition);
    //dispatch(positionSlice.setPosition({ ...newMousePosition, z: 0 }));

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
        experimentState.wellLayout.wells.forEach((well) => {
          //create point if it is selected
          if (
            isWellInsideSelection(well, mouseDownPosition, mouseMovePosition)
          ) {
            dispatch(
              experimentSlice.createPoint({
                x: well.x,
                y: well.y,
                name: well.name,
                shape: well.shape,
                rectPlusX:
                  well.shape == Shape.RECTANGLE
                    ? Math.round(well.width / 2)
                    : 0,
                rectPlusY:
                  well.shape == Shape.RECTANGLE
                    ? Math.round(well.height / 2)
                    : 0,
                rectMinusX:
                  well.shape == Shape.RECTANGLE
                    ? Math.round(well.width / 2)
                    : 0,
                rectMinusY:
                  well.shape == Shape.RECTANGLE
                    ? Math.round(well.height / 2)
                    : 0,
                circleRadiusX: well.shape == Shape.CIRCLE ? well.radius : 0,
                circleRadiusY: well.shape == Shape.CIRCLE ? well.radius : 0,
              })
            );
          }
        });
      }
    }

    //handle mode cup select
    if (wellSelectorState.mode == Mode.AREA_SELECT) {
      //check mouse
      if (mouseDownFlag) {
        //mode
        if (e.shiftKey) {
          // Define the square's position and size
          const squareWidthPx =
            getRasterWidthAsPx() * (1 - wellSelectorState.overlapWidth);
          const squareHeightPx =
            getRasterHeightAsPx() * (1 - wellSelectorState.overlapHeight);

          //generate points in rect
          const pointsInRectList = wsUtils.generateCenterPointsInRect(
            mouseDownPosition,
            mouseMovePosition,
            squareWidthPx,
            squareHeightPx
          );

          // create points
          pointsInRectList.forEach((point) => {
            let shiftedPoint = point; //
            shiftedPoint.x += getRasterWidthAsPx() / 2;
            shiftedPoint.y += getRasterHeightAsPx() / 2;
            //createNewPoint(calcPxPoint2PhyPoint(shiftedPoint));
            dispatch(
              experimentSlice.createPoint(calcPxPoint2PhyPoint(shiftedPoint))
            );
          });
        } else {
          //calc center rect
          const centerPointPx = wsUtils.calcCenterPoint(
            mouseDownPosition,
            mouseMovePosition
          );

          //create the point
          const centerPointPhy = calcPxPoint2PhyPoint(centerPointPx);
          const mouseDownPositionPhy = calcPxPoint2PhyPoint(mouseDownPosition);
          const mouseMovePositionPhy = calcPxPoint2PhyPoint(mouseMovePosition);

          //calc area
          const leftEdge = Math.min(
            mouseDownPositionPhy.x,
            mouseMovePositionPhy.x
          );
          const rightEdge = Math.max(
            mouseDownPositionPhy.x,
            mouseMovePositionPhy.x
          );
          const topEdge = Math.min(
            mouseDownPositionPhy.y,
            mouseMovePositionPhy.y
          );
          const bottomEdge = Math.max(
            mouseDownPositionPhy.y,
            mouseMovePositionPhy.y
          );

          const xMinus = Math.round(centerPointPhy.x - leftEdge); //Note: round value
          const xPlus = Math.round(rightEdge - centerPointPhy.x);
          const yMinus = Math.round(centerPointPhy.y - topEdge);
          const yPlus = Math.round(bottomEdge - centerPointPhy.y);

          //create point
          dispatch(
            experimentSlice.createPoint({
              x: centerPointPhy.x,
              y: centerPointPhy.y,
              shape: Shape.RECTANGLE,
              rectPlusX: xPlus,
              rectMinusX: xMinus,
              rectPlusY: yPlus,
              rectMinusY: yMinus,
            })
          );
        }
      }
    }

    if (wellSelectorState.mode === Mode.AREA_SELECT && mouseDownFlag) {
      // Bounding-Box in Redux ablegen
      dispatch(
        wellSelectorSlice.setSavedBoundingBox({
          fromPos: mouseDownPosition,
          toPos: mouseMovePosition,
        })
      );
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

    //handle mode
    if (wellSelectorState.mode == Mode.MOVE_CAMERA) {
      //move camera
      apiPositionerControllerMovePositioner({
        axis: "X",
        dist: calcPx2Phy(localPos.x),
        isAbsolute: true,
        speed: 20000,
      })
        .then((positionerResponse) => {
          console.log("apiMovePositioner X", positionerResponse);
        })
        .catch((error) => {
          console.error("apiMovePositioner X", "Error moving position:", error);
        });

      apiPositionerControllerMovePositioner({
        axis: "Y",
        dist: calcPx2Phy(localPos.y),
        isAbsolute: true,
        speed: 20000,
      })
        .then((positionerResponse) => {
          console.log("apiMovePositioner Y", positionerResponse);
        })
        .catch((error) => {
          console.error("apiMovePositioner Y", "Error moving position:", error);
        });

      //save target
      dispatch(
        wellSelectorSlice.setCameraTargetPosition(
          calcPxPoint2PhyPoint(localPos)
        )
      );
    }

    //hide context menu
    if (showMenu) {
      setShowMenu(false);
      return;
    }
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

    //TODO for test RM ME------------
    if (event.key === "+") {
      console.log("Plus key pressed", objectiveState);
      dispatch(objectiveSlice.setFovX(objectiveState.fovX * 1.1));
      dispatch(objectiveSlice.setFovY(objectiveState.fovY * 1.1));
    }

    if (event.key === "-") {
      console.log("Minus key pressed", objectiveState);
      dispatch(objectiveSlice.setFovX(objectiveState.fovX * 0.9));
      dispatch(objectiveSlice.setFovY(objectiveState.fovY * 0.9));
    }

    if (event.key === "*") {
      console.log("Mul key pressed", objectiveState);
      dispatch(objectiveSlice.setFovX(2500));
      dispatch(objectiveSlice.setFovY(1000));
    }

    if (event.key === "/") {
      console.log(objectiveState.fovX);
      console.log(objectiveState.fovY);
    }

    //TODO for test RM ME------------
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
            calcPhyPoint2PxPoint(itPoint),
            getRasterWidthAsPx(),
            getRasterHeightAsPx()
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
            dispatch(experimentSlice.removePoint(pointIndex)),
            setShowMenu(false)
          ),
        });
      } else {
        actionList.push({
          label: "Create Point",
          action: () => (
            //createNewPoint(calcPxPoint2PhyPoint(menuPositionLocal)),
            dispatch(
              experimentSlice.createPoint(
                calcPxPoint2PhyPoint(menuPositionLocal)
              )
            ),
            setShowMenu(false)
          ),
        });
      }
    }
    //return list
    return actionList;
  };

  //##################################################################################
  return (
    <div
      ref={parentRef}
      style={{
        position: "relative",
        overflow: "hidden",
        //background: "black",
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
          width: "100%", // Canvas width will adjust to the parent's width
          height: "100%", // Canvas height will adjust to the parent's height
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
