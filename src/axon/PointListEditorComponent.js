import React, { useState, useEffect } from "react";
import { ReactSortable } from "react-sortablejs";
import { useDispatch, useSelector } from "react-redux";

import * as experimentSlice from "../state/slices/ExperimentSlice";

//##################################################################################
const PointListEditorComponent = () => {
  //local state
  const [viewMode, setViewMode] = useState("position");

  //redux dispatcher
  const dispatch = useDispatch();

  // Access global Redux state
  const experimentState = useSelector(experimentSlice.getExperimentState);
  console.log("PointListEditorComponent", experimentState);
  console.log("PointListEditorComponent", experimentState.pointList);

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
    const newPoint = { x: 100000, y: 100000 };
    // Update Redux state
    dispatch(experimentSlice.createPoint(newPoint));
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
        //minWidth: "600px",
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
        {/* create point*/}
        <button onClick={handleCreatePoint}>+</button>

        {/* view mode */}
        <select value={viewMode} onChange={(e) => setViewMode(e.target.value)}>
          <option value="position">Position Parameter</option>
          <option value="shape">Shape Parameter</option>
        </select>

        {/* delete all */}
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
                padding: "4px",
                margin: "0px",
                backgroundColor: "",
                display: "flex", // Enable Flexbox for horizontal alignment
                flexDirection: "row", // Arrange children in a row
                gap: "4px", // Optional: space between items
                fontSize: "18px",
                marginTop: "-1px",
                //flexWrap: "wrap", // Allow the items to wrap if the screen is small
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
              {viewMode == "position" && <div>x</div>}
              {viewMode == "position" && (
                <input
                  type="number"
                  value={item.x}
                  onChange={(e) =>
                    handlePositionChanged(
                      index,
                      "x",
                      parseFloat(e.target.value)
                    )
                  }
                  placeholder="X value"
                  style={{ flex: 1 }} // Ensures inputs take equal space
                />
              )}

              {/* Input for y value */}
              {viewMode == "position" && <div>y</div>}
              {viewMode == "position" && (
                <input
                  type="number"
                  value={item.y}
                  onChange={(e) =>
                    handlePositionChanged(
                      index,
                      "y",
                      parseFloat(e.target.value)
                    )
                  }
                  placeholder="Y value"
                  style={{ flex: 1 }} // Ensures inputs take equal space
                />
              )}

              {/* Input for shape value */}
              {viewMode == "shape" && <div>S</div>}
              {viewMode == "shape" && (
                <select
                  value={item.shape}
                  onChange={(e) =>
                    handlePositionChanged(index, "shape", e.target.value)
                  }
                >
                  <option value="">Off</option>
                  <option value="rectangle">Rect</option>
                  <option value="circle">Circle</option>
                </select>
              )}

              {/* Input for n value */console.log(item.shape)}
              {viewMode == "shape" && item.shape != "" && <div>nX</div>}
              {viewMode == "shape" && item.shape != "" && (
                <input
                  type="number"
                  value={item.neighborsX}
                  min="0"
                  max="1000"
                  onChange={(e) =>
                    handlePositionChanged(
                      index,
                      "neighborsX",
                      parseInt(e.target.value, 10)
                    )
                  }
                  placeholder="Y value"
                  style={{ flex: 1 }} // Ensures inputs take equal space
                />
              )}
              {viewMode == "shape" && item.shape == "rectangle" && <div>nY</div>}
              {viewMode == "shape" && item.shape == "rectangle" && (
                <input
                  type="number"
                  value={item.neighborsY}
                  min="0"
                  max="1000"
                  onChange={(e) =>
                    handlePositionChanged(
                      index,
                      "neighborsY",
                      parseInt(e.target.value, 10)
                    )
                  }
                  placeholder="Y value"
                  style={{ flex: 1 }} // Ensures inputs take equal space
                />
              )}

              {/* dummy button*/}
              <button disabled={true}>Goto</button>
              {/* Remove item button*/}
              <button onClick={() => handleRemovePoint(index)}>Delete</button>
            </div>
          )
        )}
      </ReactSortable>
    </div>
  );
};

//##################################################################################
export default PointListEditorComponent;
