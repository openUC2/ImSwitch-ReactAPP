import fetchLaserControllerCurrentValues from './fetchLaserControllerCurrentValues';
import * as experimentSlice from '../state/slices/ExperimentSlice';

// Mock fetch globally
global.fetch = jest.fn();

// Mock the Redux actions
jest.mock('../state/slices/ExperimentSlice', () => ({
  setIlluminationIntensities: jest.fn(() => ({ type: 'SET_ILLUMINATION_INTENSITIES' })),
}));

describe('fetchLaserControllerCurrentValues', () => {
  const mockDispatch = jest.fn();
  const mockConnectionSettings = {
    ip: 'https://localhost',
    apiPort: 8001,
  };
  const mockLaserNames = ['Laser1', 'Laser2'];

  beforeEach(() => {
    fetch.mockClear();
    mockDispatch.mockClear();
    experimentSlice.setIlluminationIntensities.mockClear();
  });

  test('fetches laser values and updates Redux state successfully', async () => {
    // Mock successful fetch responses
    fetch
      .mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve(150),
      })
      .mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve(200),
      });

    await fetchLaserControllerCurrentValues(mockDispatch, mockConnectionSettings, mockLaserNames);

    // Check that fetch was called for each laser
    expect(fetch).toHaveBeenCalledTimes(2);
    expect(fetch).toHaveBeenCalledWith(
      'https://localhost:8001/LaserController/getLaserValue?laserName=Laser1'
    );
    expect(fetch).toHaveBeenCalledWith(
      'https://localhost:8001/LaserController/getLaserValue?laserName=Laser2'
    );

    // Check that Redux state was updated with the fetched values
    expect(experimentSlice.setIlluminationIntensities).toHaveBeenCalledWith([150, 200]);
    expect(mockDispatch).toHaveBeenCalledWith({ type: 'SET_ILLUMINATION_INTENSITIES' });
  });

  test('handles fetch failures gracefully with default values', async () => {
    // Mock one successful and one failed fetch
    fetch
      .mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve(100),
      })
      .mockRejectedValueOnce(new Error('Network error'));

    const consoleSpy = jest.spyOn(console, 'error').mockImplementation(() => {});

    await fetchLaserControllerCurrentValues(mockDispatch, mockConnectionSettings, mockLaserNames);

    // Should still update Redux with success value and 0 for failed fetch
    expect(experimentSlice.setIlluminationIntensities).toHaveBeenCalledWith([100, 0]);
    
    consoleSpy.mockRestore();
  });

  test('handles HTTP error responses with default values', async () => {
    // Mock HTTP error responses
    fetch
      .mockResolvedValueOnce({
        ok: false,
        status: 404,
      })
      .mockResolvedValueOnce({
        ok: false,
        status: 500,
      });

    const consoleSpy = jest.spyOn(console, 'warn').mockImplementation(() => {});

    await fetchLaserControllerCurrentValues(mockDispatch, mockConnectionSettings, mockLaserNames);

    // Should update Redux with default values for failed requests
    expect(experimentSlice.setIlluminationIntensities).toHaveBeenCalledWith([0, 0]);
    
    consoleSpy.mockRestore();
  });

  test('handles non-numeric response values', async () => {
    // Mock responses with invalid data
    fetch
      .mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve('invalid'),
      })
      .mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve(null),
      });

    await fetchLaserControllerCurrentValues(mockDispatch, mockConnectionSettings, mockLaserNames);

    // Should use 0 for non-numeric values
    expect(experimentSlice.setIlluminationIntensities).toHaveBeenCalledWith([0, 0]);
  });

  test('does not fetch when connection settings are missing', async () => {
    const consoleSpy = jest.spyOn(console, 'warn').mockImplementation(() => {});

    // Test with missing IP
    await fetchLaserControllerCurrentValues(mockDispatch, { apiPort: 8001 }, mockLaserNames);
    expect(fetch).not.toHaveBeenCalled();

    // Test with missing port
    await fetchLaserControllerCurrentValues(mockDispatch, { ip: 'https://localhost' }, mockLaserNames);
    expect(fetch).not.toHaveBeenCalled();

    // Test with empty laser names
    await fetchLaserControllerCurrentValues(mockDispatch, mockConnectionSettings, []);
    expect(fetch).not.toHaveBeenCalled();

    consoleSpy.mockRestore();
  });

  test('encodes laser names properly in URL', async () => {
    const laserNamesWithSpecialChars = ['Laser 1', 'Laser+2'];
    
    fetch
      .mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve(50),
      })
      .mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve(75),
      });

    await fetchLaserControllerCurrentValues(mockDispatch, mockConnectionSettings, laserNamesWithSpecialChars);

    expect(fetch).toHaveBeenCalledWith(
      'https://localhost:8001/LaserController/getLaserValue?laserName=Laser%201'
    );
    expect(fetch).toHaveBeenCalledWith(
      'https://localhost:8001/LaserController/getLaserValue?laserName=Laser%2B2'
    );
  });
});