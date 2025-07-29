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
    return { valid: false, summary: 'Invalid configuration' };
  }

  const summary = {
    valid: true,
    detectors: config.detector ? Object.keys(config.detector).length : 0,
    actuators: config.actuators ? Object.keys(config.actuators).length : 0,
    positioners: config.positioners ? Object.keys(config.positioners).length : 0,
    lasers: 0,
    scanners: 0,
  };

  // Count specific device types
  if (config.actuators) {
    Object.values(config.actuators).forEach(actuator => {
      if (actuator.managerName === 'UC2ConfigLaser') {
        summary.lasers++;
      }
      if (actuator.managerName === 'UC2ConfigScanner') {
        summary.scanners++;
      }
    });
  }

  return summary;
};