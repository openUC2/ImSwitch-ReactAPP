import React, {
  useState,
  useEffect,
  useRef,
  useCallback,
  useMemo,
} from "react";
import { useDispatch, useSelector } from "react-redux";
import {
  Paper,
  Grid,
  Button,
  Typography,
  TextField,
  Box,
  Switch,
  FormControlLabel,
  Slider,
  Card,
  CardContent,
  CardHeader,
  Divider,
  Alert,
  Tabs,
  Tab,
} from "@mui/material";
import * as focusLockSlice from "../state/slices/FocusLockSlice.js";
import { useTheme } from "@mui/material/styles";
import { useWebSocket } from "../context/WebSocketContext";
import "chartjs-adapter-date-fns";
import { Line } from "react-chartjs-2";
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
} from "chart.js";

// Import updated API functions
import apiFocusLockControllerFocusCalibrationStart from "../backendapi/apiFocusLockControllerFocusCalibrationStart.js";
import apiFocusLockControllerGetParamsAstigmatism from "../backendapi/apiFocusLockControllerGetParamsAstigmatism.js";
import apiFocusLockControllerReturnLastImage from "../backendapi/apiFocusLockControllerReturnLastImage.js";
import apiFocusLockControllerReturnLastCroppedImage from "../backendapi/apiFocusLockControllerReturnLastCroppedImage.js";
import apiFocusLockControllerSetCropFrameParameters from "../backendapi/apiFocusLockControllerSetCropFrameParameters.js";
import apiFocusLockControllerSetPIParameters from "../backendapi/apiFocusLockControllerSetPIParameters.js";
import apiFocusLockControllerSetPIControllerParams from "../backendapi/apiFocusLockControllerSetPIControllerParams.js";
import apiFocusLockControllerSetParamsAstigmatism from "../backendapi/apiFocusLockControllerSetParamsAstigmatism.js";
import apiFocusLockControllerToggleFocus from "../backendapi/apiFocusLockControllerToggleFocus.js";
import apiFocusLockControllerUnlockFocus from "../backendapi/apiFocusLockControllerUnlockFocus.js";
import apiFocusLockControllerStartFocusMeasurement from "../backendapi/apiFocusLockControllerStartFocusMeasurement.js";
import apiFocusLockControllerStopFocusMeasurement from "../backendapi/apiFocusLockControllerStopFocusMeasurement.js";
import apiFocusLockControllerEnableFocusLock from "../backendapi/apiFocusLockControllerEnableFocusLock.js";
import apiFocusLockControllerGetFocusLockState from "../backendapi/apiFocusLockControllerGetFocusLockState.js";
import apiFocusLockControllerGetPIParameters from "../backendapi/apiFocusLockControllerGetPIParameters.js";
import apiFocusLockControllerGetPIControllerParams from "../backendapi/apiFocusLockControllerGetPIControllerParams.js";
import apiFocusLockControllerRunFocusCalibrationDynamic from "../backendapi/apiFocusLockControllerRunFocusCalibrationDynamic.js";
import apiFocusLockControllerGetCalibrationStatus from "../backendapi/apiFocusLockControllerGetCalibrationStatus.js";
import apiPositionerControllerMovePositioner from "../backendapi/apiPositionerControllerMovePositioner.js";
import apiFocusLockControllerSetExposureTime from "../backendapi/apiFocusLockControllerSetExposureTime.js";
import apiFocusLockControllerSetGain from "../backendapi/apiFocusLockControllerSetGain.js";
import apiFocusLockControllerGetExposureTime from "../backendapi/apiFocusLockControllerGetExposureTime.js";
import apiFocusLockControllerGetGain from "../backendapi/apiFocusLockControllerGetGain.js";

// Register Chart.js components
ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend
);

// TabPanel component for PI parameters
const TabPanel = (props) => {
  const { children, value, index, ...other } = props;
  return (
    <div
      role="tabpanel"
      hidden={value !== index}
      id={`pi-tabpanel-${index}`}
      aria-labelledby={`pi-tab-${index}`}
      {...other}
    >
      {value === index && <Box sx={{ p: 2 }}>{children}</Box>}
    </div>
  );
};

const FocusLockController = () => {
  // Calibration polling state
  const calibrationPollingRef = useRef(null);
  const calibrationTimeoutRef = useRef(null);
  const [isCalibrationPolling, setIsCalibrationPolling] = useState(false);
  const dispatch = useDispatch();
  const theme = useTheme();
  const socket = useWebSocket();
  const canvasRef = useRef(null);
  const intervalRef = useRef(null);
  const retryCountRef = useRef(0);
  const imgRef = useRef(null);
  const latestFocus = useRef(0);

  const maxRetries = 3;
  const [pollingError, setPollingError] = useState(false);
  const [continuousImageLoading, setContinuousImageLoading] = useState(false); // New state for image polling control
  const [piTabValue, setPiTabValue] = useState(0); // State for PI parameter tabs

  // Calibration parameters exposed to user
  const [scanRangeUm, setScanRangeUm] = useState(200);
  const [numSteps, setNumSteps] = useState(20);
  const [settleTime, setSettleTime] = useState(0.5);

  // Access Redux state with specific selectors for better performance
  const isMeasuring = useSelector((state) => state.focusLockState.isMeasuring);
  // Split selectors to prevent unnecessary re-renders when only focus values change
  const focusLockUI = useSelector((state) => ({
    isFocusLocked: state.focusLockState.isFocusLocked,
    isCalibrating: state.focusLockState.isCalibrating,
    gaussianSigma: state.focusLockState.gaussianSigma,
    backgroundThreshold: state.focusLockState.backgroundThreshold,
    cropSize: state.focusLockState.cropSize,
    cropCenter: state.focusLockState.cropCenter,
    frameSize: state.focusLockState.frameSize,
    lastImage: state.focusLockState.lastImage,
    lastCroppedImage: state.focusLockState.lastCroppedImage,
    showImageSelector: state.focusLockState.showImageSelector,
    isLoadingImage: state.focusLockState.isLoadingImage,
    kp: state.focusLockState.kp,
    ki: state.focusLockState.ki,
    setPoint: state.focusLockState.setPoint,
    safetyDistanceLimit: state.focusLockState.safetyDistanceLimit,
    safetyMoveLimit: state.focusLockState.safetyMoveLimit,
    minStepThreshold: state.focusLockState.minStepThreshold,
    safetyMotionActive: state.focusLockState.safetyMotionActive,
    currentFocusValue: state.focusLockState.currentFocusValue,
    exposureTime: state.focusLockState.exposureTime,
    gain: state.focusLockState.gain,
  }));

  // Separate selector for chart data to minimize re-renders
  const chartDataSource = useSelector((state) => ({
    focusValues: state.focusLockState.focusValues,
    focusTimepoints: state.focusLockState.focusTimepoints,
    motorPositions: state.focusLockState.motorPositions,
    setPointSignals: state.focusLockState.setPointSignals,
    focusHistory: state.focusLockState.focusHistory,
  }));

  // Local state for image display and crop selection
  const [cropSelection, setCropSelection] = useState({
    isSelecting: false,
    startX: 0,
    startY: 0,
    endX: 0,
    endY: 0,
  });

  // Load last image from backend - memoized to prevent unnecessary re-renders
  const loadLastImage = useCallback(async () => {
    try {
      dispatch(focusLockSlice.setIsLoadingImage(true));
      setPollingError(false);

      const blob = await apiFocusLockControllerReturnLastImage();

      // Clean up previous blob URL to prevent memory leaks
      if (focusLockUI.lastImage && focusLockUI.lastImage.startsWith("blob:")) {
        URL.revokeObjectURL(focusLockUI.lastImage);
      }

      const dataUrl = URL.createObjectURL(blob);
      dispatch(focusLockSlice.setLastImage(dataUrl));
      dispatch(focusLockSlice.setShowImageSelector(true));

      // After image loads, set frameSize in Redux to natural image dimensions for consistency
      setTimeout(() => {
        const img = imgRef.current;
        if (img && img.naturalWidth && img.naturalHeight) {
          dispatch(
            focusLockSlice.setFrameSize([img.naturalWidth, img.naturalHeight])
          );
        }
      }, 100); // Reduce timeout from 1000ms to 100ms

      // Reset retry count on success
      retryCountRef.current = 0;
    } catch (error) {
      console.error("Failed to load last image:", error);
      retryCountRef.current += 1;

      // Stop polling after max retries to prevent CPU overload
      if (retryCountRef.current >= maxRetries) {
        setPollingError(true);
        if (intervalRef.current) {
          clearInterval(intervalRef.current);
          intervalRef.current = null;
          dispatch(focusLockSlice.setIsMeasuring(false));
        }
      }
    } finally {
      dispatch(focusLockSlice.setIsLoadingImage(false));
    }
  }, [dispatch, maxRetries]); // Remove focusLockState dependency

  /** keep the latest value without causing re-renders */
  useEffect(() => {
    latestFocus.current = focusLockUI.currentFocusValue;
  }, [focusLockUI.currentFocusValue]); // Add dependency array

  /** dataset memoized to prevent unnecessary Chart.js re-renders */
  const chartData = useMemo(() => {
    // Memoize the data transformation to prevent recalculation on every render
    // Focus Value
    const transformedFocusData = chartDataSource.focusValues.map((v, i) => ({
      x: chartDataSource.focusTimepoints[i] || i,
      y: v ?? 0,
    }));
    // Motor Position
    const transformedMotorData =
      chartDataSource.motorPositions?.map((v, i) => ({
        x: chartDataSource.focusTimepoints[i] || i,
        y: v ?? 0,
      })) || [];
    // Set Point Signal
    const transformedSetPointData =
      chartDataSource.setPointSignals?.map((v, i) => ({
        x: chartDataSource.focusTimepoints[i] || i,
        y: v ?? 0,
      })) || [];

    // If setPointSignals is not present, fallback to extracting from focusHistory
    let setPointData = transformedSetPointData;
    if (
      setPointData.length === 0 &&
      Array.isArray(chartDataSource.focusHistory)
    ) {
      setPointData = chartDataSource.focusHistory.map((entry, i) => ({
        x: entry.timestamp || i,
        y: entry.setPointSignal ?? 0,
      }));
    }

    return {
      datasets: [
        {
          label: "Focus Value",
          borderColor: theme.palette.primary.main,
          backgroundColor: theme.palette.primary.light,
          data: transformedFocusData,
          pointRadius: 0,
          tension: 0.2,
          yAxisID: "y",
        },
        {
          label: "Set Point Signal",
          borderColor: "orange",
          backgroundColor: "rgba(255,165,0,0.2)",
          data: setPointData,
          pointRadius: 0,
          tension: 0.2,
          yAxisID: "y", // left axis
        },
        {
          label: "Motor Position",
          borderColor: theme.palette.secondary.main,
          backgroundColor: theme.palette.secondary.light,
          data: transformedMotorData,
          pointRadius: 0,
          tension: 0.2,
          yAxisID: "y1",
        },
      ],
    };
  }, [
    theme.palette.primary.main,
    theme.palette.primary.light,
    theme.palette.secondary.main,
    theme.palette.secondary.light,
    chartDataSource.focusValues,
    chartDataSource.motorPositions,
    chartDataSource.focusTimepoints,
    chartDataSource.setPointSignals,
    chartDataSource.focusHistory,
  ]);

  const chartOptions = useMemo(
    () => ({
      animation: false,
      scales: {
        x: {
          type: "linear",
          title: { display: true, text: "Sample" },
          ticks: { autoSkip: true, maxTicksLimit: 10 },
        },
        y: {
          type: "linear",
          display: true,
          position: "left",
          title: { display: true, text: "Focus Value" },
        },
        y1: {
          type: "linear",
          display: true,
          position: "right",
          title: { display: true, text: "Motor Position (µm)" },
          grid: {
            drawOnChartArea: false,
          },
        },
      },
      interaction: { intersect: false },
      plugins: { legend: { position: "top" } },
    }),
    []
  );

  // Polling for image updates with better error handling and cleanup
  useEffect(() => {
    // Clear any existing interval
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }

    // Only poll when measuring is active, continuous loading is enabled, and no polling errors
    if (isMeasuring && continuousImageLoading && !pollingError) {
      // Fix: Only poll when actually measuring AND continuous loading is enabled
      intervalRef.current = setInterval(loadLastImage, 500);
    }

    // Cleanup function
    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
    };
  }, [isMeasuring, continuousImageLoading, pollingError, loadLastImage]);

  // Load initial parameters on mount
  useEffect(() => {
    loadAstigmatismParameters();
    loadPIParameters();
    loadFocusLockState();
    loadCameraParameters();

    // Cleanup blob URLs on unmount
    return () => {
      // Cleanup is handled automatically by React when state changes
      // No need to manually revoke URLs here as they're managed by Redux state
    };
  }, []);

  // WebSocket handler for laser value updates - optimized to reduce re-renders
  useEffect(() => {
    if (!socket) return;

    // Throttle mechanism to reduce Redux updates frequency
    let lastUpdateTime = 0;
    const UPDATE_THROTTLE_MS = 100; // Update at most every 100ms (10Hz)

    const handleSignal = (data) => {
      try {
        const parsedData = JSON.parse(data);

        // Check if this is a laser value update
        // Format: {"p0":"('Laser', 'LED', 'Value')","p1":20812}
        if (parsedData.p0 && parsedData.p1 !== undefined) {
          // Parse the p0 string to extract laser information
          const p0String = parsedData.p0;
          const value = parsedData.p1;

          // Extract laser name and type from the tuple string
          // Expected format: "('Laser', 'LED', 'Value')"
          const tupleMatch = p0String.match(
            /\('([^']+)',\s*'([^']+)',\s*'([^']+)'\)/
          );

          if (
            tupleMatch &&
            tupleMatch[1] === "Laser" &&
            tupleMatch[3] === "Value"
          ) {
            const laserName = tupleMatch[2]; // e.g., 'LED'
            const now = Date.now();

            // Throttle updates to reduce CPU overhead
            if (now - lastUpdateTime < UPDATE_THROTTLE_MS) return;

            // Only update if the value actually changed significantly
            if (Math.abs(latestFocus.current - value) > 0.001) {
              // Add threshold to reduce noise
              lastUpdateTime = now;

              // Combine both actions into a single dispatch to reduce re-renders
              dispatch(
                focusLockSlice.addFocusValue({
                  focusValue: value,
                  timestamp: now,
                })
              );

              // Update the ref immediately for next comparison
              latestFocus.current = value;
            }
          }
        }
      } catch (error) {
        // Reduce error logging frequency to prevent console spam
        if (Math.random() < 0.01) {
          // Log only 1% of errors
          console.error("Error parsing WebSocket laser update:", error);
        }
      }
    };

    socket.on("signal", handleSignal);

    return () => {
      socket.off("signal", handleSignal);
    };
  }, [socket, dispatch]); // Remove latestFocus from dependencies to prevent recreation

  // Load astigmatism parameters from backend - memoized
  const loadAstigmatismParameters = useCallback(async () => {
    try {
      const params = await apiFocusLockControllerGetParamsAstigmatism();
      if (params) {
        dispatch(focusLockSlice.setGaussianSigma(params.gaussianSigma || 1.0));
        dispatch(
          focusLockSlice.setBackgroundThreshold(
            params.backgroundThreshold || 100.0
          )
        );
        dispatch(focusLockSlice.setCropSize(params.cropSize || 100));
        dispatch(focusLockSlice.setCropCenter(params.cropCenter || [0, 0]));
      }
    } catch (error) {
      console.error("Failed to load astigmatism parameters:", error);
    }
  }, [dispatch]);

  // Load PI parameters from backend - memoized
  const loadPIParameters = useCallback(async () => {
    try {
      // Try to get extended PI controller parameters first
      const params = await apiFocusLockControllerGetPIControllerParams();
      if (params) {
        dispatch(focusLockSlice.setKp(params.kp || 0.1));
        dispatch(focusLockSlice.setKi(params.ki || 0.0));
        dispatch(focusLockSlice.setSetPoint(params.setPoint || 0.0));
        dispatch(
          focusLockSlice.setSafetyDistanceLimit(
            params.safetyDistanceLimit || 500.0
          )
        );
        dispatch(
          focusLockSlice.setSafetyMoveLimit(params.safetyMoveLimit || 3.0)
        );
        dispatch(
          focusLockSlice.setMinStepThreshold(params.minStepThreshold || 0.002)
        );
        dispatch(
          focusLockSlice.setSafetyMotionActive(
            params.safetyMotionActive || false
          )
        );
      }
    } catch (error) {
      console.warn(
        "Extended PI parameters not available, trying legacy API:",
        error
      );
      // Fallback to legacy PI parameters API
      try {
        const params = await apiFocusLockControllerGetPIParameters();
        if (params && Array.isArray(params) && params.length >= 2) {
          dispatch(focusLockSlice.setKp(params[0] || 0.1));
          dispatch(focusLockSlice.setKi(params[1] || 0.01));
        }
      } catch (legacyError) {
        console.error("Failed to load PI parameters:", legacyError);
      }
    }
  }, [dispatch]);

  // Load focus lock state from backend - memoized
  const loadFocusLockState = useCallback(async () => {
    try {
      const state = await apiFocusLockControllerGetFocusLockState();
      if (state) {
        dispatch(focusLockSlice.setFocusLocked(state.is_locked || false));
        dispatch(
          focusLockSlice.setIsCalibrating(state.is_calibrating || false)
        );
        dispatch(focusLockSlice.setIsMeasuring(state.is_measuring || false));
      }
    } catch (error) {
      console.error("Failed to load focus lock state:", error);
    }
  }, [dispatch]);

  // Load camera parameters from backend - memoized
  const loadCameraParameters = useCallback(async () => {
    try {
      // Load exposure time
      try {
        const exposureTime = await apiFocusLockControllerGetExposureTime();
        if (exposureTime !== undefined && exposureTime !== null) {
          dispatch(focusLockSlice.setExposureTime(exposureTime));
        }
      } catch (error) {
        console.warn("Failed to load exposure time, using default:", error);
      }

      // Load gain
      try {
        const gain = await apiFocusLockControllerGetGain();
        if (gain !== undefined && gain !== null) {
          dispatch(focusLockSlice.setGain(gain));
        }
      } catch (error) {
        console.warn("Failed to load gain, using default:", error);
      }
    } catch (error) {
      console.error("Failed to load camera parameters:", error);
    }
  }, [dispatch]);

  // Start/stop focus measurement - memoized
  const toggleFocusMeasurement = useCallback(async () => {
    try {
      if (isMeasuring) {
        await apiFocusLockControllerStopFocusMeasurement();
        dispatch(focusLockSlice.setIsMeasuring(false));
        // Clear any polling errors when manually stopping
        setPollingError(false);
        retryCountRef.current = 0;
      } else {
        await apiFocusLockControllerStartFocusMeasurement();
        dispatch(focusLockSlice.setIsMeasuring(true));
        setPollingError(false);
        retryCountRef.current = 0;
      }
    } catch (error) {
      console.error("Failed to toggle focus measurement:", error);
    }
  }, [isMeasuring, dispatch]);

  // Handle PI parameter updates - memoized
  const updatePIParameters = useCallback(async () => {
    try {
      await apiFocusLockControllerSetPIParameters({
        kp: focusLockUI.kp,
        ki: focusLockUI.ki,
      });
    } catch (error) {
      console.error("Failed to update PI parameters:", error);
    }
  }, [focusLockUI.kp, focusLockUI.ki]);

  // Handle extended PI controller parameter updates - memoized
  const updatePIControllerParameters = useCallback(async () => {
    try {
      await apiFocusLockControllerSetPIControllerParams({
        kp: focusLockUI.kp,
        ki: focusLockUI.ki,
        setPoint: focusLockUI.setPoint,
        safetyDistanceLimit: focusLockUI.safetyDistanceLimit,
        safetyMoveLimit: focusLockUI.safetyMoveLimit,
        minStepThreshold: focusLockUI.minStepThreshold,
        safetyMotionActive: focusLockUI.safetyMotionActive,
      });
    } catch (error) {
      console.error("Failed to update PI controller parameters:", error);
    }
  }, [
    focusLockUI.kp,
    focusLockUI.ki,
    focusLockUI.setPoint,
    focusLockUI.safetyDistanceLimit,
    focusLockUI.safetyMoveLimit,
    focusLockUI.minStepThreshold,
    focusLockUI.safetyMotionActive,
  ]);

  // Handle astigmatism parameter updates - memoized
  const updateAstigmatismParameters = useCallback(async () => {
    try {
      await apiFocusLockControllerSetParamsAstigmatism({
        gaussianSigma: focusLockUI.gaussianSigma,
        backgroundThreshold: focusLockUI.backgroundThreshold,
        cropSize: focusLockUI.cropSize,
        cropCenter: focusLockUI.cropCenter,
      });
    } catch (error) {
      console.error("Failed to update astigmatism parameters:", error);
    }
  }, [
    focusLockUI.gaussianSigma,
    focusLockUI.backgroundThreshold,
    focusLockUI.cropSize,
    focusLockUI.cropCenter,
  ]);

  // Handle camera parameter updates - memoized
  const updateExposureTime = useCallback(async () => {
    try {
      await apiFocusLockControllerSetExposureTime(focusLockUI.exposureTime);
    } catch (error) {
      console.error("Failed to update exposure time:", error);
    }
  }, [focusLockUI.exposureTime]);

  const updateGain = useCallback(async () => {
    try {
      await apiFocusLockControllerSetGain(focusLockUI.gain);
    } catch (error) {
      console.error("Failed to update gain:", error);
    }
  }, [focusLockUI.gain]);

  // Handle crop frame parameter updates - memoized
  // Always send cropSize as integer to match backend API signature
  // Always send frameSize as [width, height] in NATURAL image coordinates for consistency
  const updateCropFrameParameters = useCallback(
    async (overrideCropCenter = null, overrideCropSize = null) => {
      try {
        // Always use natural image dimensions for consistent coordinate system
        let frameSize = focusLockUI.frameSize;
        const img = imgRef.current;
        if (img && img.naturalWidth && img.naturalHeight) {
          // Use natural dimensions to ensure coordinate system consistency
          frameSize = [img.naturalWidth, img.naturalHeight];
          // Update Redux with natural dimensions
          dispatch(focusLockSlice.setFrameSize(frameSize));
        }

        await apiFocusLockControllerSetCropFrameParameters({
          cropSize: Math.round(overrideCropSize ?? focusLockUI.cropSize),
          cropCenter: overrideCropCenter ?? focusLockUI.cropCenter,
          frameSize: frameSize,
        });
      } catch (error) {
        console.error("Failed to update crop frame parameters:", error);
      }
    },
    [
      focusLockUI.cropSize,
      focusLockUI.cropCenter,
      focusLockUI.frameSize,
      dispatch,
    ]
  );

  // Reset crop coordinates - memoized
  const resetCropCoordinates = useCallback(() => {
    dispatch(focusLockSlice.resetCropCenter());
    updateCropFrameParameters();
  }, [dispatch, updateCropFrameParameters]);

  // Toggle focus lock - memoized
  const toggleFocusLock = useCallback(async () => {
    try {
      await apiFocusLockControllerEnableFocusLock({
        enable: !focusLockUI.isFocusLocked,
      });
      dispatch(focusLockSlice.setFocusLocked(!focusLockUI.isFocusLocked));
    } catch (error) {
      console.error("Failed to toggle focus lock:", error);
    }
  }, [focusLockUI.isFocusLocked, dispatch]);

  // Start focus calibration - memoized
  const startCalibration = useCallback(async () => {
    try {
      dispatch(focusLockSlice.setIsCalibrating(true));
      setIsCalibrationPolling(true);
      // Use user-provided values for calibration
      await apiFocusLockControllerRunFocusCalibrationDynamic({
        scan_range_um: scanRangeUm,
        num_steps: numSteps,
        settle_time: settleTime,
      });
      // Start polling calibration status
      if (calibrationPollingRef.current)
        clearInterval(calibrationPollingRef.current);
      if (calibrationTimeoutRef.current)
        clearTimeout(calibrationTimeoutRef.current);
      let elapsed = 0;
      calibrationPollingRef.current = setInterval(async () => {
        try {
          const status = await apiFocusLockControllerGetCalibrationStatus();
          if (status && status.calibration_active === false) {
            dispatch(focusLockSlice.setIsCalibrating(false));
            setIsCalibrationPolling(false);
            clearInterval(calibrationPollingRef.current);
            calibrationPollingRef.current = null;
          }
        } catch (err) {
          // Ignore polling errors
        }
      }, 1000);
      calibrationTimeoutRef.current = setTimeout(() => {
        if (calibrationPollingRef.current) {
          clearInterval(calibrationPollingRef.current);
          calibrationPollingRef.current = null;
        }
        dispatch(focusLockSlice.setIsCalibrating(false));
        setIsCalibrationPolling(false);
      }, 10000);
    } catch (error) {
      console.error("Failed to start calibration:", error);
      dispatch(focusLockSlice.setIsCalibrating(false));
      setIsCalibrationPolling(false);
    }
  }, [dispatch, scanRangeUm, numSteps, settleTime]);

  // Unlock focus - memoized
  const unlockFocus = useCallback(async () => {
    try {
      await apiFocusLockControllerUnlockFocus();
      dispatch(focusLockSlice.setFocusLocked(false));
    } catch (error) {
      console.error("Failed to unlock focus:", error);
    }
  }, [dispatch]);

  // Z-axis movement functions - memoized
  const moveZAxis = useCallback(async (distance) => {
    try {
      await apiPositionerControllerMovePositioner({
        positionerName: "ESP32Stage", // Default positioner name, might need adjustment
        axis: "Z",
        dist: distance,
        isAbsolute: false, // Relative movement
        isBlocking: false, // Non-blocking movement
        speed: 1000, // Default speed, might need adjustment
      });
    } catch (error) {
      console.error(`Failed to move Z-axis by ${distance}:`, error);
    }
  }, []);

  const moveZUp10 = useCallback(() => moveZAxis(10), [moveZAxis]);
  const moveZDown10 = useCallback(() => moveZAxis(-10), [moveZAxis]);
  const moveZUp100 = useCallback(() => moveZAxis(100), [moveZAxis]);
  const moveZDown100 = useCallback(() => moveZAxis(-100), [moveZAxis]);

  // Handle mouse events for crop selection on image - improved to prevent dragging and memoized
  const handleImageMouseDown = useCallback((e) => {
    e.preventDefault(); // Prevent default drag behavior

    const currentImage = e.target;
    if (!currentImage) return;

    // Always use the image's natural size for coordinates
    const rect = currentImage.getBoundingClientRect();
    const x =
      ((e.clientX - rect.left) * currentImage.naturalWidth) / rect.width;
    const y =
      ((e.clientY - rect.top) * currentImage.naturalHeight) / rect.height;

    setCropSelection({
      isSelecting: true,
      startX: x,
      startY: y,
      endX: x,
      endY: y,
    });
  }, []);

  const handleImageMouseMove = useCallback(
    (e) => {
      if (!cropSelection.isSelecting) return;
      e.preventDefault();

      const currentImage = e.target;
      const rect = currentImage.getBoundingClientRect();
      const x =
        ((e.clientX - rect.left) * currentImage.naturalWidth) / rect.width;
      const y =
        ((e.clientY - rect.top) * currentImage.naturalHeight) / rect.height;

      setCropSelection((prev) => ({
        ...prev,
        endX: x,
        endY: y,
      }));
    },
    [cropSelection.isSelecting]
  );

  const handleImageMouseUp = useCallback(
    (e) => {
      if (!cropSelection.isSelecting) return;
      e.preventDefault();

      const currentImage = e.target;
      const rect = currentImage.getBoundingClientRect();
      const x =
        ((e.clientX - rect.left) * currentImage.naturalWidth) / rect.width;
      const y =
        ((e.clientY - rect.top) * currentImage.naturalHeight) / rect.height;

      // Use the last mouse position as endX/endY
      const newCrop = {
        ...cropSelection,
        endX: x,
        endY: y,
      };

      const centerX = (newCrop.startX + newCrop.endX) / 2;
      const centerY = (newCrop.startY + newCrop.endY) / 2;
      const newCropCenter = [Math.round(centerX), Math.round(centerY)];
      const newCropSize = Math.round(
        Math.max(
          Math.abs(newCrop.endX - newCrop.startX),
          Math.abs(newCrop.endY - newCrop.startY)
        )
      );

      dispatch(focusLockSlice.setCropCenter(newCropCenter));
      dispatch(focusLockSlice.setSelectedCropRegion(newCrop));
      // update cropSize in focusLockSlice, always as integer
      dispatch(focusLockSlice.setCropSize(newCropSize));

      setCropSelection((prev) => ({
        ...prev,
        isSelecting: false,
      }));

      // Update crop parameters in backend with the new values directly to avoid race condition
      updateCropFrameParameters(newCropCenter, newCropSize);
    },
    [
      cropSelection.isSelecting,
      cropSelection.startX,
      cropSelection.endX,
      cropSelection.startY,
      cropSelection.endY,
      dispatch,
      updateCropFrameParameters,
    ]
  );

  // Memoize current image to prevent unnecessary recalculations
  const currentImage = useMemo(() => {
    return focusLockUI.lastImage; // Simplified since pollImageUrl not in split state
  }, [focusLockUI.lastImage]);

  return (
    <Paper style={{ padding: "24px", maxWidth: 1400, margin: "0 auto" }}>
      <Grid container spacing={3}>
        {/* Title */}
        <Grid item xs={12}>
          <Typography variant="h5" gutterBottom>
            Focus Lock Controller (Astigmatism-based)
          </Typography>
          <Typography variant="body2" color="textSecondary">
            Maintain objective focus using astigmatism-based feedback control
          </Typography>
        </Grid>

        {/* Status and Controls */}
        <Grid item xs={12} md={4}>
          <Card>
            <CardHeader title="Focus Lock Status" />
            <CardContent>
              <Box sx={{ display: "flex", flexDirection: "column", gap: 2 }}>
                {/* Calibration parameter inputs */}
                <TextField
                  label="Scan Range (µm)"
                  type="number"
                  value={scanRangeUm}
                  onChange={(e) => setScanRangeUm(Number(e.target.value))}
                  size="small"
                  inputProps={{ step: 1, min: 100, max: 10000 }}
                  sx={{ mb: 1 }}
                />
                <TextField
                  label="Number of Steps"
                  type="number"
                  value={numSteps}
                  onChange={(e) => setNumSteps(Number(e.target.value))}
                  size="small"
                  inputProps={{ step: 1, min: 2, max: 100 }}
                  sx={{ mb: 1 }}
                />
                <TextField
                  label="Settle Time (s)"
                  type="number"
                  value={settleTime}
                  onChange={(e) => setSettleTime(Number(e.target.value))}
                  size="small"
                  inputProps={{ step: 0.1, min: 0.1, max: 10 }}
                  sx={{ mb: 2 }}
                />

                <FormControlLabel
                  control={
                    <Switch
                      checked={focusLockUI.isFocusLocked}
                      onChange={toggleFocusLock}
                      color="primary"
                    />
                  }
                  label={`Focus Lock ${
                    focusLockUI.isFocusLocked ? "Enabled" : "Disabled"
                  }`}
                />

                <FormControlLabel
                  control={
                    <Switch
                      checked={isMeasuring}
                      onChange={toggleFocusMeasurement}
                      color="secondary"
                    />
                  }
                  label={`Measurement ${isMeasuring ? "Running" : "Stopped"}`}
                />

                <FormControlLabel
                  control={
                    <Switch
                      checked={continuousImageLoading}
                      onChange={(e) =>
                        setContinuousImageLoading(e.target.checked)
                      }
                      color="info"
                      disabled={!isMeasuring} // Only enable when measuring is active
                    />
                  }
                  label={`Continuous Image Loading ${
                    continuousImageLoading ? "Enabled" : "Disabled"
                  }`}
                />

                {pollingError && (
                  <Alert severity="warning" size="small">
                    Image polling stopped due to connection error. Check backend
                    connection.
                  </Alert>
                )}

                <Typography variant="body2">
                  Current Focus Value:{" "}
                  {focusLockUI.currentFocusValue.toFixed(3)}
                </Typography>

                <Typography variant="body2">
                  Current Motor Position: 0.000 µm
                </Typography>

                <Typography variant="body2">Set Point Signal: 0.000</Typography>

                <Box sx={{ display: "flex", gap: 1, flexDirection: "column" }}>
                  <Button
                    variant="contained"
                    onClick={startCalibration}
                    disabled={focusLockUI.isCalibrating || isCalibrationPolling}
                    fullWidth
                  >
                    {focusLockUI.isCalibrating || isCalibrationPolling
                      ? "Calibrating..."
                      : "Start Calibration"}
                  </Button>

                  <Button
                    variant="outlined"
                    onClick={unlockFocus}
                    disabled={!focusLockUI.isFocusLocked}
                    fullWidth
                  >
                    Unlock Focus
                  </Button>
                </Box>
              </Box>
            </CardContent>
          </Card>
        </Grid>

        {/* Focus Value Graph */}
        <Grid item xs={12} md={8}>
          <Card>
            <CardHeader
              title="Focus Value & Motor Position History"
              subheader="Chart showing last 50 data points with dual y-axes"
            />
            <CardContent>
              <Box sx={{ height: 350, position: "relative" }}>
                {/* Render chart using Redux slice data */}
                <Line data={chartData} options={chartOptions} />
                {chartDataSource.focusValues.length === 0 && (
                  <Box
                    sx={{
                      position: "absolute",
                      top: 0,
                      left: 0,
                      right: 0,
                      bottom: 0,
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      border: "2px dashed #ccc",
                      borderRadius: 1,
                      flexDirection: "column",
                      gap: 1,
                      backgroundColor: "rgba(255,255,255,0.7)",
                      pointerEvents: "none",
                    }}
                  >
                    <Typography variant="h6" color="textSecondary">
                      Real-time Focus Value & Motor Position Chart
                    </Typography>
                    <Typography variant="body2" color="textSecondary">
                      (Dual-axis chart showing focus value and motor position
                      for last 50 data points)
                    </Typography>
                  </Box>
                )}
              </Box>
              <Button
                size="small"
                onClick={() => dispatch(focusLockSlice.clearFocusHistory())}
                sx={{ mt: 1 }}
                variant="outlined"
                color="secondary"
              >
                Reset Graph Data
              </Button>
            </CardContent>
          </Card>
        </Grid>

        {/* PI Controller Parameters */}
        <Grid item xs={12} md={6}>
          <Card>
            <CardHeader title="PI Controller Parameters" />
            <CardContent>
              <Tabs
                value={piTabValue}
                onChange={(e, newValue) => setPiTabValue(newValue)}
                aria-label="PI parameters tabs"
              >
                <Tab
                  label="Basic (Kp, Ki)"
                  id="pi-tab-0"
                  aria-controls="pi-tabpanel-0"
                />
                <Tab
                  label="Extended"
                  id="pi-tab-1"
                  aria-controls="pi-tabpanel-1"
                />
              </Tabs>

              <TabPanel value={piTabValue} index={0}>
                <Box sx={{ display: "flex", flexDirection: "column", gap: 3 }}>
                  <Box>
                    <Typography gutterBottom>
                      Kp (Proportional): {focusLockUI.kp}
                    </Typography>
                    <Slider
                      value={focusLockUI.kp}
                      onChange={(e, value) =>
                        dispatch(focusLockSlice.setKp(value))
                      }
                      min={0}
                      max={2}
                      step={0.01}
                      valueLabelDisplay="auto"
                    />
                  </Box>

                  <Box>
                    <Typography gutterBottom>
                      Ki (Integral): {focusLockUI.ki}
                    </Typography>
                    <Slider
                      value={focusLockUI.ki}
                      onChange={(e, value) =>
                        dispatch(focusLockSlice.setKi(value))
                      }
                      min={0}
                      max={2}
                      step={0.01}
                      valueLabelDisplay="auto"
                    />
                  </Box>

                  <Button variant="contained" onClick={updatePIParameters}>
                    Update Basic PI Parameters
                  </Button>
                </Box>
              </TabPanel>

              <TabPanel value={piTabValue} index={1}>
                <Box sx={{ display: "flex", flexDirection: "column", gap: 3 }}>
                  <TextField
                    label="Set Point"
                    type="number"
                    value={focusLockUI.setPoint}
                    onChange={(e) =>
                      dispatch(
                        focusLockSlice.setSetPoint(
                          parseFloat(e.target.value) || 0
                        )
                      )
                    }
                    size="small"
                    inputProps={{ step: 0.1 }}
                  />

                  <TextField
                    label="Safety Distance Limit"
                    type="number"
                    value={focusLockUI.safetyDistanceLimit}
                    onChange={(e) =>
                      dispatch(
                        focusLockSlice.setSafetyDistanceLimit(
                          parseFloat(e.target.value) || 0
                        )
                      )
                    }
                    size="small"
                    inputProps={{ step: 1, min: 0 }}
                  />

                  <TextField
                    label="Safety Move Limit"
                    type="number"
                    value={focusLockUI.safetyMoveLimit}
                    onChange={(e) =>
                      dispatch(
                        focusLockSlice.setSafetyMoveLimit(
                          parseFloat(e.target.value) || 0
                        )
                      )
                    }
                    size="small"
                    inputProps={{ step: 0.1, min: 0 }}
                  />

                  <TextField
                    label="Min Step Threshold"
                    type="number"
                    value={focusLockUI.minStepThreshold}
                    onChange={(e) =>
                      dispatch(
                        focusLockSlice.setMinStepThreshold(
                          parseFloat(e.target.value) || 0
                        )
                      )
                    }
                    size="small"
                    inputProps={{ step: 0.001, min: 0 }}
                  />

                  <FormControlLabel
                    control={
                      <Switch
                        checked={focusLockUI.safetyMotionActive}
                        onChange={(e) =>
                          dispatch(
                            focusLockSlice.setSafetyMotionActive(
                              e.target.checked
                            )
                          )
                        }
                      />
                    }
                    label="Safety Motion Active"
                  />

                  <Button
                    variant="contained"
                    onClick={updatePIControllerParameters}
                  >
                    Update Extended PI Parameters
                  </Button>
                </Box>
              </TabPanel>
            </CardContent>
          </Card>
        </Grid>

        {/* Camera Parameters */}
        <Grid item xs={12} md={6}>
          <Card>
            <CardHeader title="Camera Parameters" />
            <CardContent>
              <Box sx={{ display: "flex", flexDirection: "column", gap: 3 }}>
                <TextField
                  label="Exposure Time (ms)"
                  type="number"
                  value={focusLockUI.exposureTime}
                  onChange={(e) =>
                    dispatch(
                      focusLockSlice.setExposureTime(
                        parseFloat(e.target.value) || 0
                      )
                    )
                  }
                  size="small"
                  inputProps={{ step: 1, min: 1, max: 10000 }}
                  helperText="Camera exposure time in milliseconds"
                />

                <TextField
                  label="Gain"
                  type="number"
                  value={focusLockUI.gain}
                  onChange={(e) =>
                    dispatch(
                      focusLockSlice.setGain(parseFloat(e.target.value) || 0)
                    )
                  }
                  size="small"
                  inputProps={{ step: 0.1, min: 0, max: 100 }}
                  helperText="Camera gain value"
                />

                <Box sx={{ display: "flex", gap: 1 }}>
                  <Button
                    variant="contained"
                    onClick={updateExposureTime}
                    sx={{ flex: 1 }}
                  >
                    Update Exposure
                  </Button>

                  <Button
                    variant="contained"
                    onClick={updateGain}
                    sx={{ flex: 1 }}
                  >
                    Update Gain
                  </Button>
                </Box>

                <Button
                  variant="outlined"
                  onClick={() => {
                    updateExposureTime();
                    updateGain();
                  }}
                  fullWidth
                >
                  Update All Camera Parameters
                </Button>
              </Box>
            </CardContent>
          </Card>
        </Grid>

        {/* Z-Axis Movement Controls */}
        <Grid item xs={12} md={6}>
          <Card>
            <CardHeader title="Z-Axis Stage Movement" />
            <CardContent>
              <Box sx={{ display: "flex", flexDirection: "column", gap: 2 }}>
                <Typography variant="body2" color="textSecondary" gutterBottom>
                  Manual Z-axis positioning for focus adjustment
                </Typography>

                {/* Fine movement controls (+/- 10µm) */}
                <Box>
                  <Typography variant="subtitle2" gutterBottom>
                    Fine Movement (±10µm)
                  </Typography>
                  <Box
                    sx={{ display: "flex", gap: 1, justifyContent: "center" }}
                  >
                    <Button
                      variant="contained"
                      color="primary"
                      onClick={moveZUp10}
                      sx={{ minWidth: 100 }}
                    >
                      Z +10µm
                    </Button>
                    <Button
                      variant="contained"
                      color="primary"
                      onClick={moveZDown10}
                      sx={{ minWidth: 100 }}
                    >
                      Z -10µm
                    </Button>
                  </Box>
                </Box>

                {/* Coarse movement controls (+/- 100µm) */}
                <Box>
                  <Typography variant="subtitle2" gutterBottom>
                    Coarse Movement (±100µm)
                  </Typography>
                  <Box
                    sx={{ display: "flex", gap: 1, justifyContent: "center" }}
                  >
                    <Button
                      variant="contained"
                      color="secondary"
                      onClick={moveZUp100}
                      sx={{ minWidth: 100 }}
                    >
                      Z +100µm
                    </Button>
                    <Button
                      variant="contained"
                      color="secondary"
                      onClick={moveZDown100}
                      sx={{ minWidth: 100 }}
                    >
                      Z -100µm
                    </Button>
                  </Box>
                </Box>

                <Typography
                  variant="caption"
                  color="textSecondary"
                  textAlign="center"
                >
                  Use fine movements for precise adjustments, coarse movements
                  for larger changes
                </Typography>
              </Box>
            </CardContent>
          </Card>
        </Grid>

        {/* Astigmatism Parameters */}
        <Grid item xs={12} md={6}>
          <Card>
            <CardHeader title="Astigmatism Parameters" />
            <CardContent>
              <Box sx={{ display: "flex", flexDirection: "column", gap: 3 }}>
                <TextField
                  label="Gaussian Sigma"
                  type="number"
                  value={focusLockUI.gaussianSigma}
                  onChange={(e) =>
                    dispatch(
                      focusLockSlice.setGaussianSigma(
                        parseFloat(e.target.value)
                      )
                    )
                  }
                  size="small"
                  inputProps={{ step: 0.1, min: 0.1, max: 10 }}
                />

                <TextField
                  label="Background Threshold"
                  type="number"
                  value={focusLockUI.backgroundThreshold}
                  onChange={(e) =>
                    dispatch(
                      focusLockSlice.setBackgroundThreshold(
                        parseFloat(e.target.value)
                      )
                    )
                  }
                  size="small"
                  inputProps={{ step: 1, min: 0, max: 1000 }}
                />

                <TextField
                  label="Crop Size"
                  type="number"
                  value={focusLockUI.cropSize}
                  onChange={(e) =>
                    dispatch(
                      focusLockSlice.setCropSize(parseInt(e.target.value))
                    )
                  }
                  size="small"
                  inputProps={{ step: 1, min: 10, max: 500 }}
                />

                <Typography variant="body2">
                  Crop Center: [{focusLockUI.cropCenter[0]},{" "}
                  {focusLockUI.cropCenter[1]}] (image pixels)
                </Typography>

                <Typography variant="body2" color="textSecondary">
                  Frame Size: [{focusLockUI.frameSize[0]},{" "}
                  {focusLockUI.frameSize[1]}] (natural dimensions)
                </Typography>

                <Box sx={{ display: "flex", gap: 1 }}>
                  <Button
                    variant="contained"
                    onClick={updateAstigmatismParameters}
                    sx={{ flex: 1 }}
                  >
                    Update Astigmatism Parameters
                  </Button>

                  <Button
                    variant="outlined"
                    onClick={resetCropCoordinates}
                    sx={{ flex: 1 }}
                  >
                    Reset Coordinates
                  </Button>
                </Box>
              </Box>
            </CardContent>
          </Card>
        </Grid>

        {/* Image Selection and Crop Region */}
        <Grid item xs={12}>
          <Card>
            <CardHeader
              title="Image and Crop Region Selection"
              action={
                <Box sx={{ display: "flex", gap: 1, alignItems: "center" }}>
                  <Button
                    variant="outlined"
                    onClick={loadLastImage}
                    disabled={focusLockUI.isLoadingImage}
                  >
                    {focusLockUI.isLoadingImage
                      ? "Loading..."
                      : "Load Last Image"}
                  </Button>
                </Box>
              }
            />
            <CardContent>
              {currentImage ? (
                <Box
                  sx={{
                    position: "relative",
                    display: "inline-block",
                    maxWidth: "100%",
                  }}
                >
                  <img
                    ref={imgRef}
                    src={currentImage}
                    alt="Camera preview for focus analysis"
                    style={{
                      maxWidth: "100%",
                      minHeight: "500px",
                      maxHeight: "700px",
                      cursor: "crosshair",
                      border: "1px solid #ccc",
                      userSelect: "none",
                      pointerEvents: "auto",
                    }}
                    draggable={false}
                    onMouseDown={handleImageMouseDown}
                    onMouseMove={handleImageMouseMove}
                    onMouseUp={handleImageMouseUp}
                    onDragStart={(e) => e.preventDefault()}
                    onLoad={(e) => {
                      // Update frameSize in Redux with natural image dimensions for coordinate consistency
                      const img = e.target;
                      if (img.naturalWidth && img.naturalHeight) {
                        dispatch(
                          focusLockSlice.setFrameSize([
                            img.naturalWidth,
                            img.naturalHeight,
                          ])
                        );
                      }
                    }}
                  />

                  {/* Show crop selection overlay */}
                  {/*
                    To ensure overlays are correctly positioned and sized regardless of image scaling,
                    we must map image pixel coordinates to display coordinates using the rendered image size.
                  */}
                  {/*
                    Use clientWidth/clientHeight for overlay scaling to match the rendered image size on all screens.
                  */}
                  <img
                    ref={canvasRef}
                    src={currentImage}
                    alt="hidden for overlay calc"
                    style={{ display: "none" }}
                    onLoad={() => {
                      /* trigger re-render for overlay calc */
                    }}
                  />
                  {(() => {
                    // Get the displayed image element
                    const img = imgRef.current;
                    if (!img) return null;
                    // Use clientWidth/clientHeight for actual rendered size
                    const dispW =
                      img.clientWidth || img.width || img.naturalWidth;
                    const dispH =
                      img.clientHeight || img.height || img.naturalHeight;
                    const natW = img.naturalWidth;
                    const natH = img.naturalHeight;
                    if (!natW || !natH) return null;
                    const scaleX = dispW / natW;
                    const scaleY = dispH / natH;

                    // Helper to map image pixel coordinates to display coordinates
                    const toDisplayX = (x) => x * scaleX;
                    const toDisplayY = (y) => y * scaleY;

                    // Crop selection overlay
                    let cropOverlay = null;
                    if (cropSelection.isSelecting) {
                      const left = toDisplayX(
                        Math.min(cropSelection.startX, cropSelection.endX)
                      );
                      const top = toDisplayY(
                        Math.min(cropSelection.startY, cropSelection.endY)
                      );
                      const width = Math.abs(
                        toDisplayX(cropSelection.endX) -
                          toDisplayX(cropSelection.startX)
                      );
                      const height = Math.abs(
                        toDisplayY(cropSelection.endY) -
                          toDisplayY(cropSelection.startY)
                      );
                      cropOverlay = (
                        <div
                          style={{
                            position: "absolute",
                            left,
                            top,
                            width,
                            height,
                            border: "2px dashed red",
                            backgroundColor: "rgba(255, 0, 0, 0.1)",
                            pointerEvents: "none",
                          }}
                        />
                      );
                    }

                    // Crop center overlay
                    const centerX = toDisplayX(focusLockUI.cropCenter[0]);
                    const centerY = toDisplayY(focusLockUI.cropCenter[1]);
                    const cropCenterOverlay = (
                      <div
                        style={{
                          position: "absolute",
                          left: centerX - 5,
                          top: centerY - 5,
                          width: 10,
                          height: 10,
                          backgroundColor: "red",
                          borderRadius: "50%",
                          pointerEvents: "none",
                        }}
                      />
                    );

                    // Crop size preview overlay
                    const cropSize = focusLockUI.cropSize;
                    const cropSizeOverlay = (
                      <div
                        style={{
                          position: "absolute",
                          left: centerX - (cropSize * scaleX) / 2,
                          top: centerY - (cropSize * scaleY) / 2,
                          width: cropSize * scaleX,
                          height: cropSize * scaleY,
                          border: "2px solid blue",
                          backgroundColor: "rgba(0, 0, 255, 0.1)",
                          pointerEvents: "none",
                        }}
                      />
                    );
                    return (
                      <>
                        {cropOverlay}
                        {cropCenterOverlay}
                        {cropSizeOverlay}
                      </>
                    );
                  })()}
                </Box>
              ) : (
                <Box
                  sx={{
                    height: 400,
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    border: "2px dashed #ccc",
                    borderRadius: 1,
                    flexDirection: "column",
                    gap: 2,
                  }}
                >
                  <Typography variant="h6" color="textSecondary">
                    📷 Image Display Area
                  </Typography>
                  <Typography
                    variant="body2"
                    color="textSecondary"
                    textAlign="center"
                  >
                    Click "Load Last Image" to view and select crop region for
                    focus analysis
                    <br />
                    Interactive crop selection with mouse drag
                  </Typography>
                  {isMeasuring && (
                    <Typography variant="body2" color="primary">
                      Waiting for camera image...
                    </Typography>
                  )}
                </Box>
              )}
            </CardContent>
          </Card>
        </Grid>
      </Grid>
    </Paper>
  );
};

export default FocusLockController;
