// UC2F binary packet parser and decompression utilities
import LZ4 from 'lz4js';

/**
 * Parse UC2F binary packet header and extract compressed data
 */
export function parseUC2F(buf) {
  const view = new DataView(buf);
  let offset = 0;

  const header = {
    width: view.getUint32(offset, true),
    height: view.getUint32(offset + 4, true),
    stride: view.getUint32(offset + 8, true),
    bitdepth: view.getUint16(offset + 12, true),
    channels: view.getUint16(offset + 14, true),
    pixfmt: view.getUint16(offset + 16, true),
    ts: view.getBigUint64(offset + 18, true),
    compSize: view.getUint32(offset + 26, true),
  };

  const headerSize = 30;
  const comp = new Uint8Array(buf, headerSize, header.compSize);

  return { header, comp };
}

/**
 * Decompress LZ4-compressed data
 */
export function decompressLZ4(comp) {
  try {
    return LZ4.decompress(comp);
  } catch (error) {
    console.error('LZ4 decompression failed:', error);
    throw new Error(`LZ4 decompression failed: ${error.message}`);
  }
}

/**
 * Convert decompressed raw data to Uint16Array with proper stride handling
 */
export function rawToUint16Array(raw, width, height, stride) {
  const expectedSize = (stride / 2) * height;
  
  if (stride === width * 2) {
    return new Uint16Array(raw.buffer, raw.byteOffset, expectedSize);
  } else {
    const u16Result = new Uint16Array(width * height);
    const u16Raw = new Uint16Array(raw.buffer, raw.byteOffset);
    const pixelsPerRow = stride / 2;
    
    for (let y = 0; y < height; y++) {
      const srcOffset = y * pixelsPerRow;
      const dstOffset = y * width;
      for (let x = 0; x < width; x++) {
        u16Result[dstOffset + x] = u16Raw[srcOffset + x];
      }
    }
    
    return u16Result;
  }
}

/**
 * Complete UC2F packet processing pipeline
 */
export function processUC2FPacket(buf) {
  const { header, comp } = parseUC2F(buf);
  const raw = decompressLZ4(comp);
  const dataU16 = rawToUint16Array(raw, header.width, header.height, header.stride);
  
  return {
    ...header,
    dataU16
  };
}

/**
 * Check if the browser supports the required features
 */
export function checkFeatureSupport() {
  let webgl2 = false;
  let intTextures = false;
  
  try {
    const canvas = document.createElement('canvas');
    const gl = canvas.getContext('webgl2');
    if (gl) {
      webgl2 = true;
      intTextures = !!(gl.R16UI && gl.RED_INTEGER && gl.UNSIGNED_SHORT);
    }
  } catch (e) {
    console.warn('WebGL2 feature detection failed:', e);
  }
  
  let lz4Available = false;
  try {
    lz4Available = typeof LZ4 !== 'undefined' && typeof LZ4.decompress === 'function';
  } catch (e) {
    console.warn('LZ4 not available:', e);
  }
  
  return {
    webgl2,
    intTextures,
    lz4: lz4Available
  };
}
