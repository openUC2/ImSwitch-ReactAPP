import React, { useState, useEffect } from "react";
import { useDispatch, useSelector } from "react-redux";

import * as experimentSlice from "../state/slices/ExperimentSlice.js";
import * as parameterRangeSlice from "../state/slices/ParameterRangeSlice.js";
import { FormControlLabel, Switch } from "@mui/material";

import fetchExperimentControllerGetCurrentExperimentParams from "../middleware/fetchExperimentControllerGetCurrentExperimentParams.js";

import { useTheme } from "@mui/material/styles";

//##################################################################################
//  ParameterEditorComponent – rewritten to satisfy requirements:
//  1. Illumination sources as a check‑list (no dropdown)
//  2. Per‑source intensity slider + per‑source gain & exposure number boxes
//  3. Autofocus, timelapse, z‑stack numeric boxes instead of sliders
//##################################################################################

const ParameterEditorComponent = () => {
  const theme = useTheme();
  const dispatch = useDispatch();

  // current values
  const parameterValue = useSelector((state) => state.experimentState.parameterValue);
  const parameterRange = useSelector(parameterRangeSlice.getParameterRangeState);

  // ensure new arrays exist in experiment state (back‑compat)
  const selectedSources = parameterValue.illumination || [];
  const intensities      = parameterValue.illuIntensities || [];
  const gains            = parameterValue.gains            || [];
  const exposures        = parameterValue.exposureTimes    || [];

  // Initialize missing values with zero for all illumination sources
const initializedIntensities = parameterRange.illuSources.map(
  (_, idx) => intensities[idx] ?? 0
);
const initializedGains = parameterRange.illuSources.map(
  (_, idx) => gains[idx] ?? 0
);
const initializedExposures = parameterRange.illuSources.map(
  (_, idx) => exposures[idx] ?? 0
);
const initializedPerformanceMode = parameterValue.performanceMode || false;

  //################################################################################
  useEffect(() => {
    fetchExperimentControllerGetCurrentExperimentParams(dispatch);
  }, []);

    useEffect(() => {
    const initArr = parameterRange.illuSources.map((_, idx) => intensities[idx] ?? 0);
    // Only dispatch if there's at least one undefined replaced by zero
    if (JSON.stringify(intensities) !== JSON.stringify(initArr)) {
      dispatch(experimentSlice.setIlluminationIntensities(initArr));
    }
  }, [parameterRange.illuSources, intensities, dispatch]);

  //################################################################################
  const tdStyle = {
    padding: "6px 8px",
    verticalAlign: "top",
  };

  // -------- illumination helpers -------------------------------------------------
  const toggleSource = (src) => {
  let updated;
  if (selectedSources.includes(src)) {
    updated = selectedSources.filter((s) => s !== src);
  } else {
    updated = [...selectedSources, src];
  }
  dispatch(experimentSlice.setIllumination(updated));
};

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
  //-----------------------------------------------------------------------
  return (
    <div style={{ textAlign: "left", padding: 10, fontSize: 16 }}>
      <h4 style={{ margin: 0, fontSize: 30 }}>Parameter Editor</h4>

      {/* ===================== GENERAL / ILLUMINATION ==================== */}
      <table style={{ width: "100%", borderCollapse: "collapse", marginTop: 10 }}>
        <thead>
          <tr style={{ borderBottom: "1px solid #ddd" }}>
            <th style={tdStyle}>Category</th>
            <th style={tdStyle}>Parameter</th>
            <th style={tdStyle}>Value</th>
          </tr>
        </thead>
        <tbody>
          <tr>
            <td style={tdStyle}>General</td>
            <td style={tdStyle}>Illumination Sources</td>
            <td style={tdStyle}>
              {parameterRange.illuSources.map((src, idx) => (
                <div key={src} style={{ display: "flex", alignItems: "center", marginBottom: 4 }}>
                  <input
                    type="checkbox"
                    checked={selectedSources.includes(src)}
                    onChange={() => toggleSource(src)}
                    style={{ marginRight: 6 }}
                  />
                  <span style={{ flex: 1 }}>{src}</span>
                </div>
              ))}
            </td>
          </tr>

          {parameterRange.illuSources.map((src, idx) => {
            const minI = parameterRange.illuSourceMinIntensities[idx] || 0;
            const maxI = parameterRange.illuSourceMaxIntensities[idx] || 1023;
            return (
              <tr key={`illu-${src}`} style={{ opacity: selectedSources.includes(src) ? 1 : 0.4 }}>
                <td></td>
                <td style={tdStyle}>{src} settings</td>
                <td style={tdStyle}>
                  {/* intensity slider */}
                  <div style={{ marginBottom: 4 }}>
                    <span style={{ marginRight: 6 }}>Intensity:</span>
                    <input
                      type="range"
                      min={minI}
                      max={maxI}
                      step="1"
                      value={initializedIntensities[idx] ?? minI}
                      onChange={(e) => setIntensity(idx, Number(e.target.value))}
                      disabled={!selectedSources.includes(src)}
                      style={{ width: "60%" }}
                    />
                    <span style={{ marginLeft: 6 }}>{initializedIntensities[idx] ?? minI} mW</span>
                  </div>

                  {/* gain */}
                  <div style={{ marginBottom: 4 }}>
                    <span style={{ marginRight: 6 }}>Gain:</span>
                    <input
                      type="number"
                      value={initializedGains[idx] ?? 0}
                      onChange={(e) => setGains(idx, Number(e.target.value))}
                      style={{ width: 80 }}
                      disabled={!selectedSources.includes(src)}
                    />
                  </div>

                  {/* exposure */}
                  <div>
                    <span style={{ marginRight: 6 }}>Exposure (ms):</span>
                    <input
                      type="number"
                      value={initializedExposures[idx] ?? 0}
                      onChange={(e) => setExposure(idx, Number(e.target.value))}
                      style={{ width: 80 }}
                      disabled={!selectedSources.includes(src)}
                    />
                  </div>

                  {/* Performance mode toggle */}
                  <div>
                  <FormControlLabel
                    control={
                      <Switch
                        checked={parameterValue.performanceMode}
                        onChange={(e) => {
                            setPerformanceMode(e.target.checked);
                        }}
                      />
                    }
                  label="Performance Mode"
                /> 
                    </div>
                </td>
              </tr>
            );
          })}

          {/* ===================== SPEED ==================== */}
          <tr>
            <td></td>
            <td style={tdStyle}>Speed</td>
            <td style={tdStyle}>
              <select
                value={parameterValue.speed}
                onChange={(e) => dispatch(experimentSlice.setSpeed(Number(e.target.value)))}
                style={{ width: "100%", padding: 5 }}
              >
                {parameterRange.speed.map((s) => (
                  <option key={s} value={s}>{s}</option>
                ))}
              </select>
            </td>
          </tr>

          {/* ===================== TIME‑LAPSE ==================== */}
          <tr>
            <td rowSpan="2" style={tdStyle}>Time‑lapse</td>
            <td style={tdStyle}>Period (s)</td>
            <td style={tdStyle}>
              <input
                type="number"
                min={parameterRange.timeLapsePeriod.min}
                max={parameterRange.timeLapsePeriod.max}
                step="1"
                value={parameterValue.timeLapsePeriod}
                onChange={(e) => dispatch(experimentSlice.setTimeLapsePeriod(Number(e.target.value)))}
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
                onChange={(e) => dispatch(experimentSlice.setNumberOfImages(Number(e.target.value)))}
                style={{ width: "100%", padding: 5 }}
              />
            </td>
          </tr>

          {/* ===================== AUTOFOCUS ==================== */}
          <tr>
            <td rowSpan="4" style={tdStyle}>Autofocus</td>
            <td style={tdStyle}>Enable</td>
            <td style={tdStyle}>
              <input
                type="checkbox"
                checked={parameterValue.autoFocus}
                onChange={(e) => dispatch(experimentSlice.setAutoFocus(e.target.checked))}
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
                onChange={(e) => dispatch(experimentSlice.setAutoFocusMin(Number(e.target.value)))}
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
                onChange={(e) => dispatch(experimentSlice.setAutoFocusMax(Number(e.target.value)))}
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
                onChange={(e) => dispatch(experimentSlice.setAutoFocusStepSize(Number(e.target.value)))}
                style={{ width: "100%", padding: 5 }}
              />
            </td>
          </tr>

          {/* ===================== Z‑STACK ==================== */}
          <tr>
            <td rowSpan="3" style={tdStyle}>Z‑Stack</td>
            <td style={tdStyle}>Min Focus Position</td>
            <td style={tdStyle}>
              <input
                type="number"
                min={parameterRange.zStack.min}
                max={parameterRange.zStack.max}
                step="1"
                value={parameterValue.zStackMin}
                onChange={(e) => dispatch(experimentSlice.setZStackMin(Number(e.target.value)))}
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
                onChange={(e) => dispatch(experimentSlice.setZStackMax(Number(e.target.value)))}
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
                onChange={(e) => dispatch(experimentSlice.setZStackStepSize(Number(e.target.value)))}
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
