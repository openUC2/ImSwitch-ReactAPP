import React, { useState, useEffect } from "react";
import { ReactSortable } from "react-sortablejs";
import { useDispatch, useSelector } from "react-redux";

import * as experimentSlice from "../state/slices/ExperimentSlice";

//##################################################################################
const PointListEditorComponent = () => {
  //redux dispatcher
  const dispatch = useDispatch();

  // Access global Redux state
  const experimentState = useSelector(experimentSlice.getExperimentState);
  console.log("PointListEditorComponent", experimentState)
  console.log("PointListEditorComponent", experimentState.pointList)

  //##################################################################################
  const setOrderedList = (newList) => {
    console.log("setOrderedList", newList);
    dispatch(experimentSlice.setPointList(newList)); // Update Redux state
  };

  //##################################################################################
  const handlePositionChanged = (index, axis, value) => {
    // Handle input changes for x and y values
    const updatedPoints = experimentState.pointList.map((point, idx) => {
      if (idx === index) {
        return { ...point, [axis]: value };
      }
      return point;
    });

    // Update Redux state
    dispatch(experimentSlice.setPointList(updatedPoints));
  };

  //##################################################################################
  const handleRemovePoint = (index) => {
    // Update Redux state
    dispatch(experimentSlice.removePoint(index));
  };

  //##################################################################################
  const handleCreatePoint = (id) => {
    //create new point TODO change to e.g. PointBuilder
    const newPoint = { id: "0", name: "Point A", x: 100, y: 100 };
    // Update Redux state
    dispatch(experimentSlice.addPoint(newPoint));
  };

  //##################################################################################
  const handleDeleteAll = () => {
    // Update Redux state
    dispatch(experimentSlice.setPointList([]));
  };

  //##################################################################################
  return (
    <div
      style={{
        border: "1px solid #fff",
        textAlign: "left",
        padding: "10px",
        margin: "0px", 
        minWidth: "600px", 
      }}
    >
      {/* Header */}
      <h4 style={{ margin: "0", padding: "0" }}>Point List Editor</h4>

      {/* Remove item button */}
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          width: "100%",
          marginBottom: "8px",
        }}
      >
        <button onClick={handleCreatePoint}>+</button>
        <button onClick={handleDeleteAll}>delete all</button>
      </div>

      {/* Sortable list */}
      <ReactSortable
        filter=".addImageButtonContainer"
        dragClass="sortableDrag"
        list={experimentState.pointList} 
        setList={setOrderedList}
        animation="200"
        easing="ease-out" 
        //onEnd={handleOnDragEnd}
        handle=".drag-handle" // Only the drag icon (handle) will be draggable
      >
        {experimentState.pointList.map(
          (
            item,
            index //for each point
          ) => (
            <div //point item
              className="draggableItem"
              style={{
                border: "1px solid #fff",
                textAlign: "left",
                padding: "5px",
                margin: "0px",
                backgroundColor: "",
                display: "flex", // Enable Flexbox for horizontal alignment
                flexDirection: "row", // Arrange children in a row
                gap: "10px", // Optional: space between items
              }}
              key={index} //key={item.id}
            >
              {/* Point Name */}
              <div
                className="drag-handle"
                style={{
                  cursor: "move", // Change cursor to indicate draggable area // {item.name}
                  width: "50px",
                }}
              >
                ≡{index}:
              </div>

              {/* Input for x value */}
              <div>x</div>
              <input
                type="number"
                value={item.x}
                onChange={(e) =>
                  handlePositionChanged(index, "x", parseFloat(e.target.value))
                }
                placeholder="X value"
                style={{ flex: 1 }} // Ensures inputs take equal space
              />

              {/* Input for y value */}
              <div>y</div>
              <input
                type="number"
                value={item.y}
                onChange={(e) =>
                  handlePositionChanged(index, "y", parseFloat(e.target.value))
                }
                placeholder="Y value"
                style={{ flex: 1 }} // Ensures inputs take equal space
              />

              {/* Remove item button*/}
              <button onClick={() => handleRemovePoint(index)}>Delete</button>
              {/* dummy button*/}
              <button disabled={true}>Goto</button>
            </div>
          )
        )}
      </ReactSortable>
    </div>
  );
};

//##################################################################################
export default PointListEditorComponent;
