import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { Provider } from 'react-redux';
import { configureStore } from '@reduxjs/toolkit';
import '@testing-library/jest-dom';

import IlluminationController from '../components/IlluminationController';
import ParameterEditorComponent from './ParameterEditorComponent';
import experimentSliceReducer from '../state/slices/ExperimentSlice';
import parameterRangeSliceReducer from '../state/slices/ParameterRangeSlice';
import connectionSettingsSliceReducer from '../state/slices/ConnectionSettingsSlice';

// Mock the middleware functions
jest.mock('../middleware/fetchExperimentControllerGetCurrentExperimentParams', () => 
  jest.fn()
);
jest.mock('../middleware/fetchLaserControllerCurrentValues', () => 
  jest.fn()
);

// Mock fetch
global.fetch = jest.fn();

describe('IlluminationController and ParameterEditorComponent Integration', () => {
  let store;
  
  beforeEach(() => {
    // Create a test store with shared state
    store = configureStore({
      reducer: {
        experimentState: experimentSliceReducer,
        parameterRangeState: parameterRangeSliceReducer,
        connectionSettingsState: connectionSettingsSliceReducer,
      },
      preloadedState: {
        parameterRangeState: {
          illuSources: ['LED', 'Laser 1'],
          illuSourceMinIntensities: [0, 0],
          illuSourceMaxIntensities: [1023, 1023],
          timeLapsePeriod: { min: 0, max: 1000 },
          numberOfImages: { min: 1, max: 1000 },
          autoFocus: { min: 1, max: 1000 },
          autoFocusStepSize: { min: 0.1, max: 10 },
          zStack: { min: -10, max: 20 },
          zStackStepSize: { min: 0.1, max: 10 },
          speed: [1, 5, 10, 50, 100],
        },
        experimentState: {
          parameterValue: {
            illuIntensities: [100, 200],
            timeLapsePeriod: 1,
            numberOfImages: 10,
            autoFocus: false,
            autoFocusMin: 0,
            autoFocusMax: 100,
            autoFocusStepSize: 1,
            zStackMin: 0,
            zStackMax: 10,
            zStackStepSize: 1,
            speed: 1,
            gains: [0, 0],
            exposureTimes: [100, 100],
            performanceMode: false,
          },
        },
        connectionSettingsState: {
          ip: 'http://localhost',
          apiPort: '8001',
        },
      },
    });

    fetch.mockClear();
  });

  const renderWithRedux = (component) => {
    return render(
      <Provider store={store}>
        {component}
      </Provider>
    );
  };

  test('both components share the same Redux state for laser intensities', () => {
    // Render both components
    const { container: illuminationContainer } = renderWithRedux(
      <IlluminationController hostIP="http://localhost" hostPort="8001" />
    );
    
    const { container: parameterContainer } = renderWithRedux(
      <ParameterEditorComponent />
    );

    // Both should show the same intensity values from Redux
    const illuminationValues = illuminationContainer.querySelectorAll('[role="slider"]');
    const parameterSliders = parameterContainer.querySelectorAll('input[type="range"]');
    
    // Values should match the Redux state (100, 200)
    expect(illuminationValues[0]).toHaveAttribute('aria-valuenow', '100');
    expect(illuminationValues[1]).toHaveAttribute('aria-valuenow', '200');
    expect(parameterSliders[0]).toHaveValue('100');
    expect(parameterSliders[1]).toHaveValue('200');
  });

  test('changes in IlluminationController update ParameterEditorComponent', async () => {
    // Mock successful API response
    fetch.mockResolvedValue({ ok: true });
    
    // Render IlluminationController
    const { container: illuminationContainer } = renderWithRedux(
      <IlluminationController hostIP="http://localhost" hostPort="8001" />
    );
    
    // Change value in IlluminationController
    const illuminationSliders = illuminationContainer.querySelectorAll('[role="slider"]');
    fireEvent.change(illuminationSliders[0], { target: { value: '150' } });
    
    // Verify Redux state was updated
    await waitFor(() => {
      const state = store.getState();
      expect(state.experimentState.parameterValue.illuIntensities[0]).toBe(150);
    });
    
    // Now render ParameterEditorComponent and check it shows the updated value
    const { container: parameterContainer } = renderWithRedux(
      <ParameterEditorComponent />
    );
    
    const parameterSliders = parameterContainer.querySelectorAll('input[type="range"]');
    expect(parameterSliders[0]).toHaveValue('150'); // Should reflect the change
  });

  test('changes in ParameterEditorComponent update IlluminationController', async () => {
    // Mock successful API response
    fetch.mockResolvedValue({ ok: true });
    
    // Render ParameterEditorComponent
    const { container: parameterContainer } = renderWithRedux(
      <ParameterEditorComponent />
    );
    
    // Change value in ParameterEditorComponent
    const parameterSliders = parameterContainer.querySelectorAll('input[type="range"]');
    fireEvent.change(parameterSliders[1], { target: { value: '250' } });
    
    // Verify Redux state was updated
    await waitFor(() => {
      const state = store.getState();
      expect(state.experimentState.parameterValue.illuIntensities[1]).toBe(250);
    });
    
    // Now render IlluminationController and check it shows the updated value
    const { container: illuminationContainer } = renderWithRedux(
      <IlluminationController hostIP="http://localhost" hostPort="8001" />
    );
    
    const illuminationSliders = illuminationContainer.querySelectorAll('[role="slider"]');
    expect(illuminationSliders[1]).toHaveAttribute('aria-valuenow', '250'); // Should reflect the change
  });

  test('both components make backend API calls with same parameters', async () => {
    // Mock successful API response
    fetch.mockResolvedValue({ ok: true });
    
    // Test IlluminationController API call
    const { container: illuminationContainer } = renderWithRedux(
      <IlluminationController hostIP="http://localhost" hostPort="8001" />
    );
    
    const illuminationSliders = illuminationContainer.querySelectorAll('[role="slider"]');
    fireEvent.change(illuminationSliders[0], { target: { value: '300' } });
    
    await waitFor(() => {
      expect(fetch).toHaveBeenCalledWith(
        'http://localhost:8001/LaserController/setLaserValue?laserName=LED&value=300'
      );
    });
    
    fetch.mockClear();
    
    // Test ParameterEditorComponent API call
    const { container: parameterContainer } = renderWithRedux(
      <ParameterEditorComponent />
    );
    
    const parameterSliders = parameterContainer.querySelectorAll('input[type="range"]');
    fireEvent.change(parameterSliders[0], { target: { value: '350' } });
    
    await waitFor(() => {
      expect(fetch).toHaveBeenCalledWith(
        'http://localhost:8001/LaserController/setLaserValue?laserName=LED&value=350'
      );
    });
  });
});