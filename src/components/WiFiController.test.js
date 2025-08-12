import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { Provider } from 'react-redux';
import { configureStore } from '@reduxjs/toolkit';
import WiFiController from './WiFiController';
import wifiReducer from '../state/slices/WiFiSlice';

// Mock fetch
global.fetch = jest.fn();

const createMockStore = (initialState = {}) => {
  return configureStore({
    reducer: {
      wifiState: wifiReducer,
    },
    preloadedState: {
      wifiState: {
        tabIndex: 0,
        availableNetworks: [],
        currentSSID: null,
        currentIfname: null,
        isConnected: false,
        selectedSSID: "",
        password: "",
        ifname: "",
        apSSID: "",
        apPassword: "",
        apIfname: "",
        apConName: "imswitch-hotspot",
        apBand: "bg",
        apChannel: null,
        isScanning: false,
        isConnecting: false,
        isCreatingAP: false,
        isAPActive: false,
        connectionInfo: {},
        apInfo: {},
        lastError: null,
        ...initialState,
      },
    },
  });
};

const renderWithStore = (store) => {
  return render(
    <Provider store={store}>
      <WiFiController hostIP="http://localhost" hostPort="8001" />
    </Provider>
  );
};

describe('WiFiController', () => {
  beforeEach(() => {
    fetch.mockClear();
  });

  it('renders without crashing', () => {
    const store = createMockStore();
    renderWithStore(store);
    
    expect(screen.getByText('Connect to Network')).toBeInTheDocument();
    expect(screen.getByText('Create Access Point')).toBeInTheDocument();
    expect(screen.getByText('Connection Info')).toBeInTheDocument();
  });

  it('fetches current SSID and scans networks on mount', async () => {
    fetch
      .mockResolvedValueOnce({
        json: () => Promise.resolve({ ssid: null, ifname: 'wlan0' }),
      })
      .mockResolvedValueOnce({
        json: () => Promise.resolve({ 
          networks: [
            { ssid: 'TestNetwork', signal: -45, security: 'WPA2', channel: '6' }
          ], 
          ifname: 'wlan0' 
        }),
      });

    const store = createMockStore();
    renderWithStore(store);

    await waitFor(() => {
      expect(fetch).toHaveBeenCalledWith('http://localhost:8001/WiFiController/getCurrentSSID');
      expect(fetch).toHaveBeenCalledWith('http://localhost:8001/WiFiController/scanNetworks');
    });
  });

  it('displays scanned networks', async () => {
    const mockNetworks = [
      { ssid: 'TestNetwork1', signal: -45, security: 'WPA2', channel: '6' },
      { ssid: 'TestNetwork2', signal: -65, security: 'Open', channel: '11' },
    ];

    const store = createMockStore({
      availableNetworks: mockNetworks,
    });

    renderWithStore(store);

    expect(screen.getByText('TestNetwork1')).toBeInTheDocument();
    expect(screen.getByText('TestNetwork2')).toBeInTheDocument();
    expect(screen.getByText('Signal: -45 dBm')).toBeInTheDocument();
    expect(screen.getByText('Security: WPA2')).toBeInTheDocument();
  });

  it('handles network selection', () => {
    const mockNetworks = [
      { ssid: 'TestNetwork', signal: -45, security: 'WPA2', channel: '6' },
    ];

    const store = createMockStore({
      availableNetworks: mockNetworks,
    });

    renderWithStore(store);

    const networkButton = screen.getByText('TestNetwork').closest('div[role="button"]');
    fireEvent.click(networkButton);

    const selectedNetworkField = screen.getByDisplayValue('TestNetwork');
    expect(selectedNetworkField).toBeInTheDocument();
  });

  it('handles access point creation', async () => {
    fetch.mockResolvedValueOnce({
      json: () => Promise.resolve({ 
        status: 'up', 
        ssid: 'TestAP', 
        ifname: 'wlan0', 
        con_name: 'imswitch-hotspot',
        ipv4: '10.42.0.1/24'
      }),
    });

    const store = createMockStore({
      tabIndex: 1,
      apSSID: 'TestAP',
      apPassword: 'password123',
    });

    renderWithStore(store);

    const startButton = screen.getByText('Start Access Point');
    fireEvent.click(startButton);

    await waitFor(() => {
      expect(fetch).toHaveBeenCalledWith(
        expect.stringContaining('/WiFiController/startAccessPoint?ssid=TestAP&password=password123')
      );
    });
  });

  it('displays connection status', () => {
    const store = createMockStore({
      tabIndex: 2,
      isConnected: true,
      currentSSID: 'MyNetwork',
      currentIfname: 'wlan0',
    });

    renderWithStore(store);

    expect(screen.getByText('Connected')).toBeInTheDocument();
    expect(screen.getByText('MyNetwork')).toBeInTheDocument();
    expect(screen.getByText('wlan0')).toBeInTheDocument();
  });

  it('handles errors gracefully', () => {
    const store = createMockStore({
      lastError: 'Failed to connect to network',
    });

    renderWithStore(store);

    expect(screen.getByText('Failed to connect to network')).toBeInTheDocument();
  });
});
