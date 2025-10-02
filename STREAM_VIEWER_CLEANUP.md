# Stream Viewer Cleanup - JPEG vs Binary

## Overview
This update significantly improves the stream viewer experience in ImSwitch-ReactAPP by providing better control over JPEG and binary streaming modes, with a more accessible UI and proper handling of 8-bit vs 16-bit data ranges.

## Key Changes

### 1. Explicit Stream Format Switching
**File: `src/components/StreamSettings.js`**

- Added a unified dropdown selector to switch between Binary (16-bit) and JPEG (8-bit) streaming
- Replaced separate enable/disable switches with a single, clear stream type selector
- Ensures mutual exclusivity - only one format can be active at a time
- Auto-adjusts min/max window/level values when switching formats:
  - JPEG → Binary: Scales up from 8-bit (0-255) to 16-bit (0-65535)
  - Binary → JPEG: Scales down from 16-bit to 8-bit

### 2. Dynamic Range Controls
**Files: `src/components/LiveView.js`, `src/components/StreamControlOverlay.js`**

- Min/Max sliders now dynamically adjust their range based on the active stream format:
  - **JPEG mode**: Range 0-255 (8-bit)
  - **Binary mode**: Range 0-65535 (full 16-bit, not 16384)
- Format indicator displays the current mode and valid range
- Values are automatically scaled when switching between formats

### 3. Transparent Overlay Controls
**File: `src/components/StreamControlOverlay.js`**

- Created a new floating overlay component for window/level controls
- Positioned in the top-right corner of the video stream
- Features:
  - Collapsible/expandable design (starts collapsed as icon button)
  - Semi-transparent background with blur effect
  - Shows current format and range
  - Contains min/max sliders, gamma control, and auto-contrast button
  - No longer clutters the sidebar
  - Improves accessibility by being directly over the image

### 4. JPEG Quality Control
**Files: `src/components/StreamSettings.js`, `src/backendapi/apiSettingsControllerSetJpegQuality.js`**

- Added JPEG compression quality slider (1-100)
- Only visible when JPEG streaming is enabled
- Integrates with backend via new API endpoint
- Gracefully handles legacy backends that don't support the endpoint

### 5. Improved Legacy Backend Support
**File: `src/components/StreamSettings.js`**

- Auto-detects when binary streaming is unavailable
- Automatically falls back to JPEG streaming
- Shows clear warning message about legacy backend
- Disables binary streaming options when not available
- Preserves user settings where possible

### 6. RGB Binary Streaming Placeholder
**File: `src/components/StreamSettings.js`**

- Added documentation note about RGB binary streaming
- Indicates that RGB support requires backend adjustment
- Placeholder for future RGB handling implementation

### 7. Redux State Management
**File: `src/state/slices/LiveStreamSlice.js`**

- Updated default `imageFormat` to "binary" (from "unknown")
- Updated default `maxVal` to 65535 (full 16-bit range)
- Added better tracking of stream format throughout the app
- Auto-updates when stream settings change

## API Changes

### New Endpoint
```javascript
apiSettingsControllerSetJpegQuality(quality: number)
```
- Sets JPEG compression quality for legacy streaming
- Parameters: quality (1-100)
- Gracefully handles missing endpoint on older backends

### Modified Usage
```javascript
apiSettingsControllerSetStreamParams({
  throttle_ms: number,
  compression: { algorithm: string, level: number },
  subsampling: { factor: number, auto_max_dim: number }
})
```
- Now only called when binary streaming is enabled
- Separated from JPEG quality settings

## UI/UX Improvements

### Before
- Window/level controls buried in scrollable sidebar
- Separate switches for binary and JPEG (could conflict)
- Fixed slider ranges regardless of format
- No clear indication of which format is active
- Difficult to access controls while viewing image

### After
- Window/level controls as overlay directly on image
- Single dropdown for format selection
- Dynamic slider ranges that match the format
- Clear format indicator showing current mode and range
- Easy access - just click icon to expand controls
- Auto-scaling of values when switching formats

## Backend Compatibility

### Modern Backend (with Binary Streaming)
- Default to binary streaming on first load
- Full 16-bit dynamic range
- Compression and subsampling controls available
- Can switch to JPEG for compatibility

### Legacy Backend (JPEG Only)
- Auto-detects lack of binary streaming API
- Falls back to JPEG automatically
- Shows warning message about legacy mode
- JPEG quality control still available
- Binary streaming options are disabled

## Testing Recommendations

1. **Legacy Backend Test**:
   - Start with backend that doesn't have `/SettingsController/getStreamParams`
   - Verify auto-fallback to JPEG
   - Check that warning message appears
   - Verify JPEG quality control works
   - Verify slider range is 0-255

2. **Modern Backend Test**:
   - Start with backend supporting binary streaming
   - Verify binary mode is default
   - Check slider range is 0-65535
   - Switch to JPEG and verify range changes to 0-255
   - Switch back to binary and verify range returns to 0-65535
   - Test compression/subsampling controls

3. **Overlay Controls Test**:
   - Verify overlay appears collapsed as icon
   - Click to expand and verify controls work
   - Test min/max sliders
   - Test gamma slider
   - Test auto-contrast button
   - Verify format indicator shows correct mode

## Future Enhancements

1. **RGB Binary Streaming**: Backend needs to support RGB format in UC2F packets
2. **Adaptive Histogram Computation**: Real-time histogram updates for binary streams
3. **LUT Support**: Custom lookup tables for advanced visualization
4. **Multi-channel Support**: Independent controls for each channel in RGB mode

## Migration Notes

No breaking changes for users. The update is backward compatible:
- Existing JPEG streaming continues to work
- Legacy backends automatically detected and handled
- User settings preserved where possible
- Redux state auto-migrates to new format tracking

## Files Modified

- `src/components/StreamSettings.js` - Major refactor for format switching
- `src/components/LiveView.js` - Dynamic slider range
- `src/components/StreamControlOverlay.js` - New overlay component
- `src/axon/LiveViewControlWrapper.js` - Integration of overlay
- `src/state/slices/LiveStreamSlice.js` - Updated defaults
- `src/backendapi/apiSettingsControllerSetJpegQuality.js` - New API endpoint

## Summary

This update provides a significantly improved user experience for controlling image streaming in ImSwitch. The transparent overlay makes controls more accessible, the dynamic ranges ensure proper handling of both 8-bit and 16-bit data, and the explicit format switching prevents confusion between JPEG and binary modes.
