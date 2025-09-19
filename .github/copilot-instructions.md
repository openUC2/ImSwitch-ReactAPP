# Copilot Instructions for ImSwitch-ReactAPP

## Project Overview
- **ImSwitch-ReactAPP** is a React frontend for controlling ImSwitch-based microscopes via browser, using WebRTC (AIORTC) for live video and device control.
- The backend (see `python/server.py`) provides streaming and control endpoints for stage and illumination.
- The app is structured for modularity: major UI logic is in `src/axon/`, state management in `src/state/`, and API calls in `src/backendapi/`.

## Key Architectural Patterns
- **LiveViewControlWrapper** (in `src/axon/`) is the main entry for live image viewing and device control, including overlays for intensity, scale bar, and stage movement.
- **Frontend intensity scaling**: All image intensity adjustments are performed client-side using the Canvas API (see `LiveViewControlWrapper`).
- **Redux** is used for state management (see `src/state/`).
- **API communication**: All backend interactions are via REST endpoints defined in `src/backendapi/`.
- **Component extraction**: UI logic is split into focused components (see `src/axon/` and `src/components/`).

## Developer Workflows
- **Install dependencies**: `npm install`
- **Start frontend**: `npm start` (runs on [http://localhost:3000](http://localhost:3000))
- **Run backend server**: `python server.py` (from `python/` directory)
- **Run tests**: `npm test` (Jest, with tests in `src/__tests__/` and `src/axon/`)
- **Build for production**: `npm run build`
- **Docker**: Build and run with `docker build -t microscope-app .` and `docker run -p 5000:5000 8001:8001 microscope-app`

## Project-Specific Conventions
- **Image processing**: Always use frontend scaling for 8-bit JPEGs; do not offload to backend.
- **Overlay controls**: Intensity sliders, scale bar, and stage controls are integrated into the main viewer.
- **API endpoints**: Use the files in `src/backendapi/` as the single source of truth for backend communication.
- **Component structure**: Place new device or UI logic in `src/axon/` if related to microscopy, or `src/components/` for generic UI.
- **Assets**: Place static images in `src/assets/` and public-facing files in `public/`.

## Integration Points
- **WebRTC streaming**: Handled by backend (`python/server.py`) and consumed in frontend via MJPEG or WebRTC components.
- **Redux store**: All global state should be managed via slices in `src/state/slices/`.
- **Testing**: Use Jest for unit/integration tests; see `src/__tests__/` and `src/axon/*.test.js` for examples.

## Examples
- See `src/axon/LiveViewControlWrapper.js` for the main image viewer and overlays.
- See `src/backendapi/` for API call patterns.
- See `src/state/slices/` for Redux slice structure.

---
For more, see `README.md` and code comments in key files. When in doubt, follow the structure and patterns in `src/axon/` and `src/backendapi/`.
