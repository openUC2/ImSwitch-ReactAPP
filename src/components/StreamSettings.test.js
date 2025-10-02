import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { Provider } from 'react-redux';
import { configureStore } from '@reduxjs/toolkit';
import '@testing-library/jest-dom';

import StreamSettings from './StreamSettings';
import liveStreamSliceReducer from '../state/slices/LiveStreamSlice';

// Mock API calls
jest.mock('../backendapi/apiSettingsControllerGetStreamParams');
jest.mock('../backendapi/apiSettingsControllerSetStreamParams');
jest.mock('../backendapi/apiSettingsControllerSetJpegQuality');

import apiSettingsControllerGetStreamParams from '../backendapi/apiSettingsControllerGetStreamParams';
import apiSettingsControllerSetStreamParams from '../backendapi/apiSettingsControllerSetStreamParams';
import apiSettingsControllerSetJpegQuality from '../backendapi/apiSettingsControllerSetJpegQuality';

describe('StreamSettings Component', () => {
  let store;
  
  beforeEach(() => {
    // Reset mocks
    jest.clearAllMocks();
    
    // Create a test store
    store = configureStore({
      reducer: {
        liveStreamState: liveStreamSliceReducer,
      },
      preloadedState: {
        liveStreamState: {
          minVal: 0,
          maxVal: 65535,
          gamma: 1.0,
          imageFormat: 'binary',
          isLegacyBackend: false,
          backendCapabilities: {
            binaryStreaming: true,
            webglSupported: true,
          },
        },
      },
    });
    
    // Setup default mock responses
    apiSettingsControllerGetStreamParams.mockResolvedValue({
      binary: {
        enabled: true,
        compression: { algorithm: 'lz4', level: 0 },
        subsampling: { factor: 1, auto_max_dim: 0 },
        throttle_ms: 50,
        bitdepth_in: 12,
        pixfmt: 'GRAY16',
      },
      jpeg: {
        enabled: false,
        quality: 85,
      },
    });
    
    apiSettingsControllerSetStreamParams.mockResolvedValue({ success: true });
    apiSettingsControllerSetJpegQuality.mockResolvedValue({ success: true });
  });
  
  test('renders stream settings with binary mode by default', async () => {
    render(
      <Provider store={store}>
        <StreamSettings />
      </Provider>
    );
    
    await waitFor(() => {
      expect(screen.getByText(/Stream Format/i)).toBeInTheDocument();
    });
    
    // Check that binary streaming is selected
    const streamTypeSelect = screen.getByLabelText(/Stream Type/i);
    expect(streamTypeSelect).toHaveTextContent(/Binary.*16-bit/i);
  });
  
  test('detects legacy backend and falls back to JPEG', async () => {
    // Mock API failure
    apiSettingsControllerGetStreamParams.mockRejectedValue(
      new Error('404: Not Found')
    );
    
    render(
      <Provider store={store}>
        <StreamSettings />
      </Provider>
    );
    
    await waitFor(() => {
      expect(screen.getByText(/Legacy Backend Detected/i)).toBeInTheDocument();
    });
  });
  
  test('shows JPEG quality control when JPEG is selected', async () => {
    render(
      <Provider store={store}>
        <StreamSettings />
      </Provider>
    );
    
    await waitFor(() => {
      expect(screen.getByLabelText(/Stream Type/i)).toBeInTheDocument();
    });
    
    // Switch to JPEG mode
    const streamTypeSelect = screen.getByLabelText(/Stream Type/i);
    fireEvent.mouseDown(streamTypeSelect);
    
    const jpegOption = screen.getByText(/JPEG.*8-bit/i);
    fireEvent.click(jpegOption);
    
    // Wait for JPEG settings to appear
    await waitFor(() => {
      expect(screen.getByLabelText(/Compression Quality/i)).toBeInTheDocument();
    });
  });
  
  test('shows binary settings when binary is selected', async () => {
    render(
      <Provider store={store}>
        <StreamSettings />
      </Provider>
    );
    
    await waitFor(() => {
      expect(screen.getByText(/Binary Stream Settings/i)).toBeInTheDocument();
    });
    
    // Check for binary-specific controls
    expect(screen.getByLabelText(/Compression Algorithm/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/Subsampling Factor/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/Throttle/i)).toBeInTheDocument();
  });
  
  test('updates Redux state when format changes', async () => {
    render(
      <Provider store={store}>
        <StreamSettings />
      </Provider>
    );
    
    await waitFor(() => {
      expect(screen.getByLabelText(/Stream Type/i)).toBeInTheDocument();
    });
    
    // Initial format should be binary
    expect(store.getState().liveStreamState.imageFormat).toBe('binary');
    
    // Switch to JPEG
    const streamTypeSelect = screen.getByLabelText(/Stream Type/i);
    fireEvent.mouseDown(streamTypeSelect);
    const jpegOption = screen.getByText(/JPEG.*8-bit/i);
    fireEvent.click(jpegOption);
    
    // Format should update to JPEG
    await waitFor(() => {
      expect(store.getState().liveStreamState.imageFormat).toBe('jpeg');
    });
  });
  
  test('displays RGB note for binary streaming', async () => {
    render(
      <Provider store={store}>
        <StreamSettings />
      </Provider>
    );
    
    await waitFor(() => {
      expect(screen.getByText(/RGB binary streaming requires backend support/i)).toBeInTheDocument();
    });
  });
});
