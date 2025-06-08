import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { Provider } from 'react-redux';
import { configureStore } from '@reduxjs/toolkit';
import ParameterEditorComponent from './ParameterEditorComponent';
import experimentReducer from '../state/slices/ExperimentSlice';
import parameterRangeReducer from '../state/slices/ParameterRangeSlice';
import connectionSettingsReducer from '../state/slices/ConnectionSettingsSlice';

// Mock fetch to test backend calls
global.fetch = jest.fn();

// Create a mock store for testing
const createMockStore = (initialState = {}) => {
  return configureStore({
    reducer: {
      experimentState: experimentReducer,
      parameterRangeState: parameterRangeReducer,
      connectionSettingsState: connectionSettingsReducer,
    },
    preloadedState: {
      experimentState: {
        parameterValue: {
          illuIntensities: [100, 150],
          gains: [1, 2],
          exposureTimes: [10, 20],
          performanceMode: false,
          ...initialState.experimentState?.parameterValue,
        },
      },
      parameterRangeState: {
        illuSources: ['Laser1', 'Laser2'],
        illuSourceMinIntensities: [0, 0],
        illuSourceMaxIntensities: [1023, 1023],
        ...initialState.parameterRangeState,
      },
      connectionSettingsState: {
        ip: 'https://localhost',
        apiPort: 8001,
        websocketPort: 8002,
        ...initialState.connectionSettingsState,
      },
    },
  });
};

describe('ParameterEditorComponent', () => {
  beforeEach(() => {
    fetch.mockClear();
  });

  test('renders parameter editor with illumination sources', () => {
    const store = createMockStore();
    
    render(
      <Provider store={store}>
        <ParameterEditorComponent />
      </Provider>
    );
    
    expect(screen.getByText('Parameter Editor')).toBeInTheDocument();
    expect(screen.getByText('Laser1')).toBeInTheDocument();
    expect(screen.getByText('Laser2')).toBeInTheDocument();
  });

  test('intensity slider sends backend API call when changed', async () => {
    fetch.mockResolvedValueOnce({ ok: true });
    
    const store = createMockStore();
    
    render(
      <Provider store={store}>
        <ParameterEditorComponent />
      </Provider>
    );
    
    // Find the first intensity slider and change it
    const intensitySliders = screen.getAllByDisplayValue('100');
    const firstSlider = intensitySliders[0];
    
    fireEvent.change(firstSlider, { target: { value: '200' } });
    
    // Wait for the async backend call to complete
    await waitFor(() => {
      expect(fetch).toHaveBeenCalledWith(
        'https://localhost:8001/LaserController/setLaserValue?laserName=Laser1&value=200'
      );
    });
  });

  test('intensity change gracefully handles backend API failure', async () => {
    // Mock a failed fetch call
    fetch.mockRejectedValueOnce(new Error('Backend error'));
    
    const consoleSpy = jest.spyOn(console, 'error').mockImplementation(() => {});
    
    const store = createMockStore();
    
    render(
      <Provider store={store}>
        <ParameterEditorComponent />
      </Provider>
    );
    
    // Find the first intensity slider and change it
    const intensitySliders = screen.getAllByDisplayValue('100');
    const firstSlider = intensitySliders[0];
    
    fireEvent.change(firstSlider, { target: { value: '300' } });
    
    // Wait for the async call and error handling
    await waitFor(() => {
      expect(consoleSpy).toHaveBeenCalledWith(
        'Failed to update laser intensity in backend:',
        expect.any(Error)
      );
    });
    
    consoleSpy.mockRestore();
  });

  test('intensity change does not make backend call when connection settings missing', async () => {
    const store = createMockStore({
      connectionSettingsState: {
        ip: '',
        apiPort: null,
        websocketPort: 8002,
      },
    });
    
    render(
      <Provider store={store}>
        <ParameterEditorComponent />
      </Provider>
    );
    
    // Find the first intensity slider and change it
    const intensitySliders = screen.getAllByDisplayValue('100');
    const firstSlider = intensitySliders[0];
    
    fireEvent.change(firstSlider, { target: { value: '250' } });
    
    // Wait a bit to ensure no fetch call is made
    await new Promise(resolve => setTimeout(resolve, 100));
    
    expect(fetch).not.toHaveBeenCalled();
  });
});