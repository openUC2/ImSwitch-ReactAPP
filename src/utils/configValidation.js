/**
 * Configuration validation utilities for UC2Controller
 */

/**
 * Validates JSON configuration structure and content
 * @param {object} config - The configuration object to validate
 * @returns {object} - { isValid: boolean, errors: array, warnings: array }
 */
export const validateConfiguration = (config) => {
  const errors = [];
  const warnings = [];

  if (!config || typeof config !== 'object') {
    errors.push('Configuration must be a valid object');
    return { isValid: false, errors, warnings };
  }

  // Check for required basic structure
  if (!config.detector) {
    warnings.push('No detector configuration found');
  }

  if (!config.actuators) {
    warnings.push('No actuators configuration found');
  }

  if (!config.positioners) {
    warnings.push('No positioners configuration found');
  }

  // Validate device configurations if present
  if (config.detector && typeof config.detector !== 'object') {
    errors.push('Detector configuration must be an object');
  }

  if (config.actuators && typeof config.actuators !== 'object') {
    errors.push('Actuators configuration must be an object');
  }

  if (config.positioners && typeof config.positioners !== 'object') {
    errors.push('Positioners configuration must be an object');
  }

  // Check for common configuration issues
  if (config.actuators) {
    Object.entries(config.actuators).forEach(([key, actuator]) => {
      if (!actuator.managerName) {
        warnings.push(`Actuator '${key}' missing managerName`);
      }
      if (!actuator.managerProperties) {
        warnings.push(`Actuator '${key}' missing manageProperties`);
      }
    });
  }

  const isValid = errors.length === 0;
  return { isValid, errors, warnings };
};

/**
 * Validates JSON string syntax
 * @param {string} jsonString - JSON string to validate
 * @returns {object} - { isValid: boolean, error: string|null, parsed: object|null }
 */
export const validateJsonString = (jsonString) => {
  try {
    const parsed = JSON.parse(jsonString);
    return { isValid: true, error: null, parsed };
  } catch (error) {
    return { 
      isValid: false, 
      error: error.message,
      parsed: null 
    };
  }
};

/**
 * Formats validation results for user display
 * @param {object} validationResult - Result from validateConfiguration
 * @returns {string} - Formatted message for display
 */
export const formatValidationMessage = (validationResult) => {
  const { isValid, errors, warnings } = validationResult;
  
  let message = '';
  
  if (isValid) {
    message = '✅ Configuration is valid';
    if (warnings.length > 0) {
      message += `\n⚠️ Warnings:\n${warnings.map(w => `• ${w}`).join('\n')}`;
    }
  } else {
    message = '❌ Configuration has errors:';
    message += `\n${errors.map(e => `• ${e}`).join('\n')}`;
    if (warnings.length > 0) {
      message += `\n⚠️ Warnings:\n${warnings.map(w => `• ${w}`).join('\n')}`;
    }
  }
  
  return message;
};

/**
 * Creates a preview summary of the configuration
 * @param {object} config - Configuration object
 * @returns {object} - Summary object with counts and key information
 */
export const createConfigurationPreview = (config) => {
  if (!config || typeof config !== 'object') {
    return { 
      valid: false, 
      summary: 'Invalid configuration',
      detectorCount: 0,
      actuatorCount: 0,
      positionerCount: 0,
      totalDevices: 0,
      devices: []
    };
  }

  const devices = [];
  
  // Extract detector information
  let detectorCount = 0;
  if (config.detector && typeof config.detector === 'object') {
    detectorCount = Object.keys(config.detector).length;
    Object.entries(config.detector).forEach(([key, detector]) => {
      devices.push({
        name: key,
        type: 'Detector',
        manager: detector.managerName || 'Unknown'
      });
    });
  }

  // Extract actuator information  
  let actuatorCount = 0;
  if (config.actuators && typeof config.actuators === 'object') {
    actuatorCount = Object.keys(config.actuators).length;
    Object.entries(config.actuators).forEach(([key, actuator]) => {
      devices.push({
        name: key,
        type: 'Actuator',
        manager: actuator.managerName || 'Unknown'
      });
    });
  }

  // Extract positioner information
  let positionerCount = 0;
  if (config.positioners && typeof config.positioners === 'object') {
    positionerCount = Object.keys(config.positioners).length;
    Object.entries(config.positioners).forEach(([key, positioner]) => {
      devices.push({
        name: key,
        type: 'Positioner',
        manager: positioner.managerName || 'Unknown'
      });
    });
  }

  return {
    valid: true,
    detectorCount,
    actuatorCount,
    positionerCount,
    totalDevices: detectorCount + actuatorCount + positionerCount,
    devices
  };
};