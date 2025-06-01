import React, { useState, useEffect } from "react";
import { useDispatch, useSelector } from "react-redux";
import { FormControlLabel, Switch } from "@mui/material";
import { useTheme } from "@mui/material/styles";

import * as experimentSlice from "../state/slices/ExperimentSlice.js";
import * as parameterRangeSlice from "../state/slices/ParameterRangeSlice.js";
import fetchExperimentControllerGetCurrentExperimentParams from "../middleware/fetchExperimentControllerGetCurrentExperimentParams.js";

const ParameterEditorComponent = () => {
  const theme = useTheme();
  const dispatch = useDispatch();

  // read parameter & range from Redux
  const parameterValue = useSelector((state) => state.experimentState.parameterValue);
  const parameterRange = useSelector(parameterRangeSlice.getParameterRangeState);

  // fallback arrays
  const intensities = parameterValue.illuIntensities || [];
  const gains       = parameterValue.gains || [];
  const exposures   = parameterValue.exposureTimes || [];

  // Fill missing intensity/gain/exposure with zero if needed
  const initializedIntensities = parameterRange.illuSources.map(
    (_, idx) => intensities[idx] ?? 0
  );
  const initializedGains = parameterRange.illuSources.map(
    (_, idx) => gains[idx] ?? 0
  );
  const initializedExposures = parameterRange.illuSources.map(
    (_, idx) => exposures[idx] ?? 0
  );

  // performance mode fallback
  const initializedPerformanceMode = parameterValue.performanceMode || false;

  // fetch experiment params on mount
  useEffect(() => {
    fetchExperimentControllerGetCurrentExperimentParams(dispatch);
  }, [dispatch]);

  // ensure intensities array size matches available sources
  useEffect(() => { // TODO: This should be done in the fetch middleware I guess? @marco
    const initIlluIntensityArray = parameterRange.illuSources.map(
      (_, idx) => intensities[idx] ?? 0
    );
    const initGainsArray = parameterRange.illuSources.map(
      (_, idx) => gains[idx] ?? 0 
    );
    const initExposuresArray = parameterRange.illuSources.map(
      (_, idx) => exposures[idx] ?? 0
    );
    if (JSON.stringify(intensities) !== JSON.stringify(initIlluIntensityArray)) {
      dispatch(experimentSlice.setIlluminationIntensities(initIlluIntensityArray));
    }
    if (JSON.stringify(gains) !== JSON.stringify(initGainsArray)) {
      dispatch(experimentSlice.setGains(initGainsArray));
    }
    if (JSON.stringify(exposures) !== JSON.stringify(initExposuresArray)) {
      dispatch(experimentSlice.setExposureTimes(initExposuresArray));
    }
    // apply the illusources to the experiment state
    if (parameterRange.illuSources.length > 0) {
      dispatch(experimentSlice.setIllumination(parameterRange.illuSources));
    }
  }, [parameterRange.illuSources, intensities, dispatch]);

  // helper functions for intensities, gains, exposures
  const setIntensity = (idx, value) => {
    const arr = [...intensities];
    arr[idx] = value;
    dispatch(experimentSlice.setIlluminationIntensities(arr));
  };

  const setGains = (idx, value) => {
    const arr = [...gains];
    arr[idx] = value;
    dispatch(experimentSlice.setGains(arr));
  };

  const setExposure = (idx, value) => {
    const arr = [...exposures];
    arr[idx] = value;
    dispatch(experimentSlice.setExposureTimes(arr));
  };

  const setPerformanceMode = (mode) => {
    dispatch(experimentSlice.setPerformanceMode(mode));
  };

  const tdStyle = { padding: "6px 8px", verticalAlign: "top" };

  return (
    <div style={{ textAlign: "left", padding: 10, fontSize: 16 }}>
      <h4 style={{ margin: 0, fontSize: 30 }}>Parameter Editor</h4>
      <table style={{ width: "100%", borderCollapse: "collapse", marginTop: 10 }}>
        <thead>
          <tr style={{ borderBottom: "1px solid #ddd" }}>
            <th style={tdStyle}>Category</th>
            <th style={tdStyle}>Parameter</th>
            <th style={tdStyle}>Value</th>
          </tr>
        </thead>
        <tbody>
          {/* Displays all illumination sources without checkboxes */}
          {parameterRange.illuSources.map((src, idx) => {
            const minI = parameterRange.illuSourceMinIntensities[idx] || 0;
            const maxI = parameterRange.illuSourceMaxIntensities[idx] || 1023;
            return (
              <tr key={`illu-${src}`}>
                <td style={tdStyle}>Illumination</td>
                <td style={tdStyle}>{src}</td>
                <td style={tdStyle}>
                  {/* intensity slider */}
                  <div style={{ marginBottom: 4 }}>
                    <span style={{ marginRight: 6 }}>Intensity:</span>
                    <input
                      type="range"
                      min={minI}
                      max={maxI}
                      step="1"
                      value={initializedIntensities[idx]}
                      onChange={(e) => setIntensity(idx, Number(e.target.value))}
                      style={{ width: "60%" }}
                    />
                    <span style={{ marginLeft: 6 }}>
                      {initializedIntensities[idx]} mW
                    </span>
                  </div>

                  {/* gain */}
                  <div style={{ marginBottom: 4 }}>
                    <span style={{ marginRight: 6 }}>Gain:</span>
                    <input
                      type="number"
                      value={initializedGains[idx]}
                      onChange={(e) => setGains(idx, Number(e.target.value))}
                      style={{ width: 80 }}
                    />
                  </div>

                  {/* exposure */}
                  <div style={{ marginBottom: 4 }}>
                    <span style={{ marginRight: 6 }}>Exposure (ms):</span>
                    <input
                      type="number"
                      value={initializedExposures[idx]}
                      onChange={(e) => setExposure(idx, Number(e.target.value))}
                      style={{ width: 80 }}
                    />
                  </div>

                  {/* performance mode toggle */}
                  <div>
                    <FormControlLabel
                      control={
                        <Switch
                          checked={initializedPerformanceMode}
                          onChange={(e) => setPerformanceMode(e.target.checked)}
                        />
                      }
                      label="Performance Mode"
                    />
                  </div>
                </td>
              </tr>
            );
          })}

          {/* Speed */}
          <tr>
            <td></td>
            <td style={tdStyle}>Speed</td>
            <td style={tdStyle}>
              <select
                value={parameterValue.speed}
                onChange={(e) =>
                  dispatch(experimentSlice.setSpeed(Number(e.target.value)))
                }
                style={{ width: "100%", padding: 5 }}
              >
                {parameterRange.speed.map((s) => (
                  <option key={s} value={s}>
                    {s}
                  </option>
                ))}
              </select>
            </td>
          </tr>

          {/* Time-lapse */}
          <tr>
            <td rowSpan="2" style={tdStyle}>
              Time-lapse
            </td>
            <td style={tdStyle}>Period (s)</td>
            <td style={tdStyle}>
              <input
                type="number"
                min={parameterRange.timeLapsePeriod.min}
                max={parameterRange.timeLapsePeriod.max}
                step="1"
                value={parameterValue.timeLapsePeriod}
                onChange={(e) =>
                  dispatch(
                    experimentSlice.setTimeLapsePeriod(Number(e.target.value))
                  )
                }
                style={{ width: "100%", padding: 5 }}
              />
            </td>
          </tr>
          <tr>
            <td style={tdStyle}>Number of Images</td>
            <td style={tdStyle}>
              <input
                type="number"
                min={parameterRange.numberOfImages.min}
                max={parameterRange.numberOfImages.max}
                step="1"
                value={parameterValue.numberOfImages}
                onChange={(e) =>
                  dispatch(experimentSlice.setNumberOfImages(Number(e.target.value)))
                }
                style={{ width: "100%", padding: 5 }}
              />
            </td>
          </tr>

          {/* Autofocus */}
          <tr>
            <td rowSpan="4" style={tdStyle}>
              Autofocus
            </td>
            <td style={tdStyle}>Enable</td>
            <td style={tdStyle}>
              <input
                type="checkbox"
                checked={parameterValue.autoFocus}
                onChange={(e) =>
                  dispatch(experimentSlice.setAutoFocus(e.target.checked))
                }
              />
            </td>
          </tr>
          <tr>
            <td style={tdStyle}>Min Focus Position</td>
            <td style={tdStyle}>
              <input
                type="number"
                min={parameterRange.autoFocus.min}
                max={parameterRange.autoFocus.max}
                step="1"
                value={parameterValue.autoFocusMin}
                onChange={(e) =>
                  dispatch(experimentSlice.setAutoFocusMin(Number(e.target.value)))
                }
                style={{ width: "100%", padding: 5 }}
              />
            </td>
          </tr>
          <tr>
            <td style={tdStyle}>Max Focus Position</td>
            <td style={tdStyle}>
              <input
                type="number"
                min={parameterRange.autoFocus.min}
                max={parameterRange.autoFocus.max}
                step="1"
                value={parameterValue.autoFocusMax}
                onChange={(e) =>
                  dispatch(experimentSlice.setAutoFocusMax(Number(e.target.value)))
                }
                style={{ width: "100%", padding: 5 }}
              />
            </td>
          </tr>
          <tr>
            <td style={tdStyle}>Step Size</td>
            <td style={tdStyle}>
              <input
                type="number"
                min={parameterRange.autoFocusStepSize.min}
                max={parameterRange.autoFocusStepSize.max}
                step="0.1"
                value={parameterValue.autoFocusStepSize}
                onChange={(e) =>
                  dispatch(
                    experimentSlice.setAutoFocusStepSize(Number(e.target.value))
                  )
                }
                style={{ width: "100%", padding: 5 }}
              />
            </td>
          </tr>

          {/* Z-stack */}
          <tr>
            <td rowSpan="3" style={tdStyle}>
              Z-Stack
            </td>
            <td style={tdStyle}>Min Focus Position</td>
            <td style={tdStyle}>
              <input
                type="number"
                min={parameterRange.zStack.min}
                max={parameterRange.zStack.max}
                step="1"
                value={parameterValue.zStackMin}
                onChange={(e) =>
                  dispatch(experimentSlice.setZStackMin(Number(e.target.value)))
                }
                style={{ width: "100%", padding: 5 }}
              />
            </td>
          </tr>
          <tr>
            <td style={tdStyle}>Max Focus Position</td>
            <td style={tdStyle}>
              <input
                type="number"
                min={parameterRange.zStack.min}
                max={parameterRange.zStack.max}
                step="1"
                value={parameterValue.zStackMax}
                onChange={(e) =>
                  dispatch(experimentSlice.setZStackMax(Number(e.target.value)))
                }
                style={{ width: "100%", padding: 5 }}
              />
            </td>
          </tr>
          <tr>
            <td style={tdStyle}>Step Size</td>
            <td style={tdStyle}>
              <input
                type="number"
                min={parameterRange.zStackStepSize.min}
                max={parameterRange.zStackStepSize.max}
                step="0.1"
                value={parameterValue.zStackStepSize}
                onChange={(e) =>
                  dispatch(experimentSlice.setZStackStepSize(Number(e.target.value)))
                }
                style={{ width: "100%", padding: 5 }}
              />
            </td>
          </tr>
        </tbody>
      </table>
    </div>
  );
};

export default ParameterEditorComponent;