import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { Provider } from 'react-redux';
import { configureStore } from '@reduxjs/toolkit';
import '@testing-library/jest-dom';

import StreamControlOverlay from './StreamControlOverlay';
import liveStreamSliceReducer from '../state/slices/LiveStreamSlice';

// Mock fetch
global.fetch = jest.fn();

describe('StreamControlOverlay Component', () => {
  let store;
  const mockHostIP = 'http://localhost';
  const mockHostPort = '8001';
  
  beforeEach(() => {
    jest.clearAllMocks();
    
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
  });
  
  test('renders collapsed by default', () => {
    render(
      <Provider store={store}>
        <StreamControlOverlay hostIP={mockHostIP} hostPort={mockHostPort} />
      </Provider>
    );
    
    // Should show only the icon button when collapsed
    const iconButton = screen.getByRole('button');
    expect(iconButton).toBeInTheDocument();
    
    // Should not show the full controls
    expect(screen.queryByText(/Window\/Level/i)).not.toBeInTheDocument();
  });
  
  test('expands when icon is clicked', () => {
    render(
      <Provider store={store}>
        <StreamControlOverlay hostIP={mockHostIP} hostPort={mockHostPort} />
      </Provider>
    );
    
    const iconButton = screen.getByRole('button');
    fireEvent.click(iconButton);
    
    // Should show the full controls after clicking
    expect(screen.getByText(/Window\/Level/i)).toBeInTheDocument();
    expect(screen.getByText(/Format: BINARY/i)).toBeInTheDocument();
  });
  
  test('shows correct format and range for binary mode', () => {
    render(
      <Provider store={store}>
        <StreamControlOverlay hostIP={mockHostIP} hostPort={mockHostPort} />
      </Provider>
    );
    
    // Expand the overlay
    fireEvent.click(screen.getByRole('button'));
    
    // Check format indicator
    expect(screen.getByText(/Format: BINARY/i)).toBeInTheDocument();
    expect(screen.getByText(/Range: 0 - 65535/i)).toBeInTheDocument();
  });
  
  test('shows correct format and range for JPEG mode', () => {
    // Update store to JPEG mode
    store = configureStore({
      reducer: {
        liveStreamState: liveStreamSliceReducer,
      },
      preloadedState: {
        liveStreamState: {
          minVal: 0,
          maxVal: 255,
          gamma: 1.0,
          imageFormat: 'jpeg',
          isLegacyBackend: true,
          backendCapabilities: {
            binaryStreaming: false,
            webglSupported: false,
          },
        },
      },
    });
    
    render(
      <Provider store={store}>
        <StreamControlOverlay hostIP={mockHostIP} hostPort={mockHostPort} />
      </Provider>
    );
    
    // Expand the overlay
    fireEvent.click(screen.getByRole('button'));
    
    // Check format indicator
    expect(screen.getByText(/Format: JPEG/i)).toBeInTheDocument();
    expect(screen.getByText(/Range: 0 - 255/i)).toBeInTheDocument();
  });
  
  test('displays min/max window values', () => {
    render(
      <Provider store={store}>
        <StreamControlOverlay hostIP={mockHostIP} hostPort={mockHostPort} />
      </Provider>
    );
    
    // Expand the overlay
    fireEvent.click(screen.getByRole('button'));
    
    // Check that min/max values are displayed
    expect(screen.getByText(/Window: 0 - 65535/i)).toBeInTheDocument();
  });
  
  test('displays gamma value', () => {
    render(
      <Provider store={store}>
        <StreamControlOverlay hostIP={mockHostIP} hostPort={mockHostPort} />
      </Provider>
    );
    
    // Expand the overlay
    fireEvent.click(screen.getByRole('button'));
    
    // Check that gamma value is displayed
    expect(screen.getByText(/Gamma: 1.00/i)).toBeInTheDocument();
  });
  
  test('has auto contrast button', () => {
    render(
      <Provider store={store}>
        <StreamControlOverlay hostIP={mockHostIP} hostPort={mockHostPort} />
      </Provider>
    );
    
    // Expand the overlay
    fireEvent.click(screen.getByRole('button'));
    
    // Check that auto contrast button exists
    const autoContrastButton = screen.getByText(/Auto Contrast/i);
    expect(autoContrastButton).toBeInTheDocument();
  });
  
  test('calls auto contrast API when button is clicked', async () => {
    global.fetch.mockResolvedValue({
      json: async () => ({ minVal: 100, maxVal: 5000 }),
    });
    
    render(
      <Provider store={store}>
        <StreamControlOverlay hostIP={mockHostIP} hostPort={mockHostPort} />
      </Provider>
    );
    
    // Expand the overlay
    fireEvent.click(screen.getByRole('button'));
    
    // Click auto contrast button
    const autoContrastButton = screen.getByText(/Auto Contrast/i);
    fireEvent.click(autoContrastButton);
    
    // Check that API was called
    expect(global.fetch).toHaveBeenCalledWith(
      `${mockHostIP}:${mockHostPort}/HistogrammController/minmaxvalues`
    );
  });
  
  test('collapses when close button is clicked', () => {
    render(
      <Provider store={store}>
        <StreamControlOverlay hostIP={mockHostIP} hostPort={mockHostPort} />
      </Provider>
    );
    
    // Expand the overlay
    fireEvent.click(screen.getByRole('button'));
    expect(screen.getByText(/Window\/Level/i)).toBeInTheDocument();
    
    // Find and click the close button
    const closeButtons = screen.getAllByRole('button');
    const closeButton = closeButtons.find(btn => btn.querySelector('[data-testid="CloseIcon"]'));
    if (closeButton) {
      fireEvent.click(closeButton);
    }
    
    // Should be collapsed again (only icon button visible)
    expect(screen.queryByText(/Format: BINARY/i)).not.toBeInTheDocument();
  });
});
