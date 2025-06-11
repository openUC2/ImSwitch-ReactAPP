import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { Provider } from 'react-redux';
import { configureStore } from '@reduxjs/toolkit';
import '@testing-library/jest-dom';

import IlluminationController from './IlluminationController';
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

describe('IlluminationController Redux Integration', () => {
  let store;
  
  beforeEach(() => {
    // Create a test store with initial state
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
        },
        experimentState: {
          parameterValue: {
            illuIntensities: [100, 200],
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

  test('renders laser controls from Redux state', () => {
    renderWithRedux(<IlluminationController hostIP="http://localhost" hostPort="8001" />);
    
    // Should show laser names from Redux state
    expect(screen.getByText('LED')).toBeInTheDocument();
    expect(screen.getByText('Laser 1')).toBeInTheDocument();
    
    // Should show current values from Redux state
    expect(screen.getByText('100')).toBeInTheDocument();
    expect(screen.getByText('200')).toBeInTheDocument();
  });

  test('updates Redux state when slider changes', async () => {
    renderWithRedux(<IlluminationController hostIP="http://localhost" hostPort="8001" />);
    
    // Mock successful API response
    fetch.mockResolvedValueOnce({
      ok: true,
    });
    
    // Find the first slider and change its value
    const sliders = screen.getAllByRole('slider');
    fireEvent.change(sliders[0], { target: { value: '150' } });
    
    // Check that Redux state was updated
    await waitFor(() => {
      const state = store.getState();
      expect(state.experimentState.parameterValue.illuIntensities[0]).toBe(150);
    });
    
    // Check that backend API was called
    expect(fetch).toHaveBeenCalledWith(
      'http://localhost:8001/LaserController/setLaserValue?laserName=LED&value=150'
    );
  });

  test('uses connection settings from Redux when available', async () => {
    renderWithRedux(<IlluminationController hostIP="http://fallback" hostPort="9999" />);
    
    // Mock successful API response
    fetch.mockResolvedValueOnce({
      ok: true,
    });
    
    // Change a slider value
    const sliders = screen.getAllByRole('slider');
    fireEvent.change(sliders[0], { target: { value: '300' } });
    
    // Should use Redux connection settings, not props
    await waitFor(() => {
      expect(fetch).toHaveBeenCalledWith(
        'http://localhost:8001/LaserController/setLaserValue?laserName=LED&value=300'
      );
    });
  });

  test('falls back to props when Redux connection settings unavailable', async () => {
    // Create store without connection settings
    const storeWithoutConnection = configureStore({
      reducer: {
        experimentState: experimentSliceReducer,
        parameterRangeState: parameterRangeSliceReducer,
        connectionSettingsState: connectionSettingsSliceReducer,
      },
      preloadedState: {
        parameterRangeState: {
          illuSources: ['LED'],
          illuSourceMinIntensities: [0],
          illuSourceMaxIntensities: [1023],
        },
        experimentState: {
          parameterValue: {
            illuIntensities: [100],
          },
        },
        connectionSettingsState: {
          ip: null,
          apiPort: null,
        },
      },
    });

    render(
      <Provider store={storeWithoutConnection}>
        <IlluminationController hostIP="http://fallback" hostPort="9999" />
      </Provider>
    );
    
    // Mock successful API response
    fetch.mockResolvedValueOnce({
      ok: true,
    });
    
    // Change a slider value
    const sliders = screen.getAllByRole('slider');
    fireEvent.change(sliders[0], { target: { value: '400' } });
    
    // Should use prop values as fallback
    await waitFor(() => {
      expect(fetch).toHaveBeenCalledWith(
        'http://fallback:9999/LaserController/setLaserValue?laserName=LED&value=400'
      );
    });
  });

  test('handles backend API errors gracefully', async () => {
    renderWithRedux(<IlluminationController hostIP="http://localhost" hostPort="8001" />);
    
    // Mock API error
    fetch.mockRejectedValueOnce(new Error('Network error'));
    
    // Mock console.error to verify error logging
    const consoleSpy = jest.spyOn(console, 'error').mockImplementation(() => {});
    
    // Change a slider value
    const sliders = screen.getAllByRole('slider');
    fireEvent.change(sliders[0], { target: { value: '500' } });
    
    // Redux state should still be updated despite API error
    await waitFor(() => {
      const state = store.getState();
      expect(state.experimentState.parameterValue.illuIntensities[0]).toBe(500);
    });
    
    // Error should be logged
    await waitFor(() => {
      expect(consoleSpy).toHaveBeenCalledWith(
        'Failed to set laser value in backend:',
        expect.any(Error)
      );
    });
    
    consoleSpy.mockRestore();
  });

  test('shows loading message when no laser sources available', () => {
    // Create store without laser sources
    const emptyStore = configureStore({
      reducer: {
        experimentState: experimentSliceReducer,
        parameterRangeState: parameterRangeSliceReducer,
        connectionSettingsState: connectionSettingsSliceReducer,
      },
      preloadedState: {
        parameterRangeState: {
          illuSources: [],
        },
        experimentState: {
          parameterValue: {
            illuIntensities: [],
          },
        },
        connectionSettingsState: {},
      },
    });

    render(
      <Provider store={emptyStore}>
        <IlluminationController hostIP="http://localhost" hostPort="8001" />
      </Provider>
    );
    
    expect(screen.getByText('Loading laser names…')).toBeInTheDocument();
  });
});