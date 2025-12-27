# Offline OME-Zarr Viewer (Vizarr Integration)

This document describes the offline OME-Zarr viewer integration for the ImSwitch React App.

## Overview

The application now includes an integrated offline OME-Zarr viewer based on the `@hms-dbmi/viv` library (the same library used by the online Vizarr viewer). This allows viewing of multidimensional microscopy data without requiring an internet connection.

## Features

### 1. Integrated Vizarr Viewer Component

A new `VizarrViewer` component (`src/components/VizarrViewer.jsx`) provides:

- **Offline viewing** of OME-Zarr files served from the backend
- **Multi-channel support** with individual channel settings
- **Z-stack navigation** for 3D datasets
- **Time series navigation** for time-lapse data
- **Zoom and pan controls** with mouse/touch support
- **Contrast adjustment** per channel
- **Fit to screen** functionality
- **Option to open in external Vizarr** (for when internet is available)

### 2. FileManager Integration

Right-click on any `.zarr` or `.ome.zarr` folder in the File Manager to see the **"Open with Vizarr"** option:

- Automatically detects OME-Zarr directories
- Opens the file directly in the integrated viewer
- Switches to the Vizarr viewer tab

### 3. ExperimentComponent Integration

The experiment controls now have two buttons for viewing OME-Zarr data:

- **"Open Vizarr (offline)"** - Opens in the integrated viewer (works without internet)
- **"Open External Vizarr"** - Opens in the online vizarr.io viewer (requires internet)

### 4. Navigation

The OME-Zarr Viewer is available in the sidebar under **Essentials**:

- Click on "OME-Zarr Viewer" to open the viewer
- Recent files are tracked in the viewer state

## Technical Details

### Loading Mechanism

The viewer uses `loadOmeZarr` from `@hms-dbmi/viv` to properly load OME-Zarr data. This is the same approach used by the online vizarr viewer and ensures compatibility with various OME-Zarr formats.

```javascript
import { loadOmeZarr } from "@hms-dbmi/viv";

// Load the zarr data
const loaderData = await loadOmeZarr(fullUrl);
// loaderData.data contains the loader for MultiscaleImageLayer
// loaderData.metadata contains the zarr metadata
```

### Redux State Management

The viewer state is managed through a Redux slice (`src/state/slices/VizarrViewerSlice.js`):

```javascript
// Actions available:
openViewer({ url, fileName })  // Open a file in the viewer
closeViewer()                   // Close the viewer
setCurrentUrl({ url, fileName }) // Change the current URL
refreshViewer()                 // Force refresh
clearRecentFiles()              // Clear history
```

### URL Format

The viewer accepts relative paths like `/recordings/experiment.ome.zarr` and constructs the full URL using the connection settings from Redux.

### File Detection

Files are detected as OME-Zarr if their name ends with:
- `.zarr`
- `.ome.zarr`

## Usage Examples

### Opening from FileManager

1. Navigate to a folder containing OME-Zarr data
2. Right-click on a `.zarr` or `.ome.zarr` folder
3. Select "Open with Vizarr"
4. The viewer opens with the selected file

### Opening after Experiment

1. Run an experiment that generates OME-Zarr data
2. After the experiment completes, click "Open Vizarr (offline)"
3. The latest scan is automatically opened in the viewer

### Direct Navigation

1. Click on "OME-Zarr Viewer" in the sidebar
2. If a file was previously opened, it will be displayed
3. Use the toolbar to adjust view settings

## Controls

| Action | Keyboard/Mouse |
|--------|----------------|
| Zoom In/Out | Scroll wheel or +/- buttons |
| Pan | Click and drag |
| Fit to Screen | Click the fit button |
| Open Settings | Click the gear icon |
| Refresh | Click the refresh button |
| Open External | Click the external link button |
| Close | Click the X button |

## Dependencies

The viewer uses these existing project dependencies:
- `@hms-dbmi/viv` - Multiscale image layer rendering
- `@deck.gl/react` - WebGL-based rendering
- `@deck.gl/core` - Orthographic view controls
- `@mui/material` - UI components
