import React, { useState, useEffect } from "react";
import { useDispatch, useSelector } from "react-redux";

import * as experimentSlice from "../state/slices/ExperimentSlice.js";
import * as parameterRangeSlice from "../state/slices/ParameterRangeSlice.js";



import fetchExperimentControllerGetCurrentExperimentParams from '../middleware/fetchExperimentControllerGetCurrentExperimentParams.js';  


import { useTheme  } from "@mui/material/styles";
import { FormControl, InputLabel, NativeSelect } from "@mui/material";

//##################################################################################
const ParameterEditorComponent = () => {
  //theme
  const theme = useTheme();

  // Accessing parameterValue and parameterRange in Redux store
  const dispatch = useDispatch();

  const parameterValue = useSelector(
    (state) => state.experimentState.parameterValue
  );
  const parameterRange = useSelector(parameterRangeSlice.getParameterRangeState);

  //##################################################################################
  useEffect(() => {
    //update on startup
    fetchExperimentControllerGetCurrentExperimentParams(dispatch);
  }, []); // Empty dependency array means this runs once when the component mounts

  //##################################################################################
  // Define common styles for td elements with reduced bottom padding and consistent input width
  const tdStyle = {
    paddingTop: "8px",
    paddingRight: "8px",
    paddingBottom: "4px", // Reduced bottom padding
    paddingLeft: "8px",
  };

  const tdRowSpanStyle = {
    ...tdStyle, // Inherit base styles
    verticalAlign: "top",
  };

  const inputStyle = {
    width: "100%", // Make input fields take up full width of the cell
    padding: "5px", // Add some padding for comfort
  };

  const selectStyle = {
    ...inputStyle, // Reuse inputStyle for select elements
  };

  const checkboxStyle = {
    marginLeft: "auto", // Align checkbox to the right
    marginRight: "0", // Remove default left margin
  };

  // Span style for the slider value
  const valueSpanStyle = {
    position: "absolute",
    //top: '-25px',
    //left: '50%',
    transform: "translateX(-100%)",
    fontSize: "14px",
    //color: 'red',
    //textShadow: '3px 3px 5px rgba(0, 0, 0, 0.9)'
  };

  return (
    <div
      style={{
        border: "1px solid #eee",
        textAlign: "left",
        padding: "10px",
        margin: "0px",
        fontSize: "16px", // Apply reduced font size to the whole component
      }}
    >
      <h4 style={{ margin: "0", padding: "0", fontSize: "30px" }}>
        Parameter Editor
      </h4>{" "}
      {/* Smaller header font size */}
      <table
        style={{ width: "100%", borderCollapse: "collapse", marginTop: "10px" }}
      >
        <thead>
          <tr style={{ borderBottom: "1px solid #ddd" }}>
            <th style={{ textAlign: "left", padding: "8px" }}>Category</th>
            <th style={{ textAlign: "left", padding: "8px" }}>Parameter</th>
            <th style={{ textAlign: "left", padding: "8px" }}>Value</th>
          </tr>
        </thead>
        <tbody>
          {/* General Category (Illumination, Brightfield, etc.) */}
          <tr>
            <td style={tdStyle}>General</td>
            <td style={tdStyle}>Illumination</td>
            <td style={tdStyle}>
              <NativeSelect
                value={parameterValue.illumination}
                onChange={(e) =>
                  dispatch(experimentSlice.setIllumination(e.target.value))
                }
                style={selectStyle}
              >
                {parameterRange.illumination.map((option) => (
                  <option key={option} value={option}>
                    {option}
                  </option>
                ))}
              </NativeSelect>
            </td>
          </tr>
          <tr>
            <td style={tdStyle}></td>
            <td style={tdStyle}>Brightfield</td>
            <td style={tdStyle}>
              <input
                type="checkbox"
                checked={parameterValue.brightfield}
                onChange={(e) =>
                  dispatch(experimentSlice.setBrightfield(e.target.checked))
                }
                style={{ ...inputStyle, ...checkboxStyle }}
              />
            </td>
          </tr>
          <tr>
            <td style={tdStyle}></td>
            <td style={tdStyle}>Darkfield</td>
            <td style={tdStyle}>
              <input
                type="checkbox"
                checked={parameterValue.darkfield}
                onChange={(e) =>
                  dispatch(experimentSlice.setDarkfield(e.target.checked))
                }
                style={{ ...inputStyle, ...checkboxStyle }}
              />
            </td>
          </tr>
          <tr>
            <td style={tdStyle}></td>
            <td style={tdStyle}>Laser</td>
            <td style={tdStyle}>
              <NativeSelect
                value={parameterValue.laserWaveLength}
                onChange={(e) =>
                  dispatch(
                    experimentSlice.setLaserWaveLength(Number(e.target.value))
                  )
                }
                style={selectStyle}
              >
                {parameterRange.laserWaveLength.map((wavelength) => (
                  <option key={wavelength} value={wavelength}>
                    {wavelength} nm
                  </option>
                ))}
              </NativeSelect>
            </td>
          </tr>
          <tr>
            <td style={tdStyle}></td>
            <td style={tdStyle}>DPC (Differential Phase Contrast)</td>
            <td style={tdStyle}>
              <input
                type="checkbox"
                checked={parameterValue.differentialPhaseContrast}
                onChange={(e) =>
                  dispatch(
                    experimentSlice.setDifferentialPhaseContrast(
                      e.target.checked
                    )
                  )
                }
                style={{ ...inputStyle, ...checkboxStyle }}
              />
            </td>
          </tr>
          <tr>
            <td style={tdStyle}></td>
            <td style={tdStyle}>Speed</td>
            <td style={tdStyle}>
            <NativeSelect
                value={parameterValue.speed}
                onChange={(e) =>
                  dispatch(experimentSlice.setSpeed(Number(e.target.value)))
                }
                style={selectStyle}
              >
                {parameterRange.speed.map((option) => (
                  <option key={option} value={option}>
                    {option}
                  </option>
                ))}
              </NativeSelect>
            </td>
          </tr>

          {/* Time-lapse Parameters */}
          <tr>
            <td rowSpan="2" style={tdRowSpanStyle}>
              Time-lapse
            </td>
            <td style={tdStyle}>Period</td>
            <td style={tdStyle}>
              <div style={{ position: "relative", width: "100%" }}>
                <span style={valueSpanStyle}>
                  {parameterValue.timeLapsePeriod} s
                </span>
                <input
                  type="range"
                  value={parameterValue.timeLapsePeriod}
                  min={parameterRange.timeLapsePeriod.min}
                  max={parameterRange.timeLapsePeriod.max}
                  step="0.1"
                  onChange={(e) =>
                    dispatch(
                      experimentSlice.setTimeLapsePeriod(Number(e.target.value))
                    )
                  }
                  style={{ width: "100%" }}
                />
              </div>
            </td>
          </tr>
          <tr>
            <td style={tdStyle}>Number of Images</td>
            <td style={tdStyle}>
              <div style={{ position: "relative", width: "100%" }}>
                <span style={valueSpanStyle}>
                  {parameterValue.numberOfImages}
                </span>
                <input
                  type="range"
                  value={parameterValue.numberOfImages}
                  min={parameterRange.numberOfImages.min}
                  max={parameterRange.numberOfImages.max}
                  step="1"
                  onChange={(e) =>
                    dispatch(
                      experimentSlice.setNumberOfImages(Number(e.target.value))
                    )
                  }
                  style={{ width: "100%" }}
                />
              </div>
            </td>
          </tr>

          {/* Autofocus Parameters */}
          <tr>
            <td rowSpan="3" style={tdRowSpanStyle}>
              Autofocus
            </td>
            <td style={tdStyle}>Min Focus Position</td>
            <td style={tdStyle}>
              <div style={{ position: "relative", width: "100%" }}>
                <span style={valueSpanStyle}>
                  {parameterValue.autoFocusMin}
                </span>
                <input
                  type="range"
                  value={parameterValue.autoFocusMin}
                  min={parameterRange.autoFocus.min}
                  max={parameterRange.autoFocus.max}
                  step="0.1"
                  onChange={(e) =>
                    dispatch(
                      experimentSlice.setAutoFocusMin(Number(e.target.value))
                    )
                  }
                  style={{ width: "100%" }}
                />
              </div>
            </td>
          </tr>
          <tr>
            <td style={tdStyle}>Max Focus Position</td>
            <td style={tdStyle}>
              <div style={{ position: "relative", width: "100%" }}>
                <span style={valueSpanStyle}>
                  {parameterValue.autoFocusMax}
                </span>
                <input
                  type="range"
                  value={parameterValue.autoFocusMax}
                  min={parameterRange.autoFocus.min}
                  max={parameterRange.autoFocus.max}
                  step="0.1"
                  onChange={(e) =>
                    dispatch(
                      experimentSlice.setAutoFocusMax(Number(e.target.value))
                    )
                  }
                  style={{ width: "100%" }}
                />
              </div>
            </td>
          </tr>
          <tr>
            <td style={tdStyle}>Stepsize</td>
            <td style={tdStyle}>
              <div style={{ position: "relative", width: "100%" }}>
                <span style={valueSpanStyle}>
                  {parameterValue.autoFocusStepSize}
                </span>
                <input
                  type="range"
                  value={parameterValue.autoFocusStepSize}
                  min={parameterRange.autoFocusStepSize.min}
                  max={parameterRange.autoFocusStepSize.max}
                  step="0.1"
                  onChange={(e) =>
                    dispatch(
                      experimentSlice.setAutoFocusStepSize(
                        Number(e.target.value)
                      )
                    )
                  }
                  style={{ width: "100%" }}
                />
              </div>
            </td>
          </tr>

          {/* Z-Stack Parameters */}
          <tr>
            <td rowSpan="3" style={tdRowSpanStyle}>
              Z-Stack
            </td>
            <td style={tdStyle}>Min Focus Position</td>
            <td style={tdStyle}>
              <div style={{ position: "relative", width: "100%" }}>
                <span style={valueSpanStyle}>{parameterValue.zStackMin}</span>
                <input
                  type="range"
                  value={parameterValue.zStackMin}
                  min={parameterRange.zStack.min}
                  max={parameterRange.zStack.max}
                  step="0.1"
                  onChange={(e) =>
                    dispatch(
                      experimentSlice.setZStackMin(Number(e.target.value))
                    )
                  }
                  style={{ width: "100%" }}
                />
              </div>
            </td>
          </tr>
          <tr>
            <td style={tdStyle}>Max Focus Position</td>
            <td style={tdStyle}>
              <div style={{ position: "relative", width: "100%" }}>
                <span style={valueSpanStyle}>{parameterValue.zStackMax}</span>
                <input
                  type="range"
                  value={parameterValue.zStackMax}
                  min={parameterRange.zStack.min}
                  max={parameterRange.zStack.max}
                  step="0.1"
                  onChange={(e) =>
                    dispatch(
                      experimentSlice.setZStackMax(Number(e.target.value))
                    )
                  }
                  style={{ width: "100%" }}
                />
              </div>
            </td>
          </tr>
          <tr>
            <td style={tdStyle}>Stepsize</td>
            <td style={tdStyle}>
              <div style={{ position: "relative", width: "100%" }}>
                <span style={valueSpanStyle}>
                  {parameterValue.zStackStepSize}
                </span>
                <input
                  type="range"
                  value={parameterValue.zStackStepSize}
                  min={parameterRange.zStackStepSize.min}
                  max={parameterRange.zStackStepSize.max}
                  step="0.1"
                  onChange={(e) =>
                    dispatch(
                      experimentSlice.setZStackStepSize(Number(e.target.value))
                    )
                  }
                  style={{ width: "100%" }}
                />
              </div>
            </td>
          </tr>
        </tbody>
      </table>
    </div>
  );
};

export default ParameterEditorComponent;
