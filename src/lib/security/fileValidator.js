/**
 * Enterprise-grade File Validator
 * Uses "Magic Numbers" to verify the exact MIME type of a file buffer, preventing spoofing attacks.
 */

const MAGIC_NUMBERS = {
  // %PDF
  'application/pdf': [0x25, 0x50, 0x44, 0x46],
  // JPEG / JPG
  'image/jpeg': [0xFF, 0xD8, 0xFF],
  // PNG
  'image/png': [0x89, 0x50, 0x4E, 0x47, 0x0D, 0x0A, 0x1A, 0x0A],
};

/**
 * Validates a file Buffer against an array of allowed MIME types.
 * 
 * @param {Buffer|ArrayBuffer} buffer - The file buffer to check
 * @param {string[]} allowedTypes - Array of allowed MIME types (e.g. ['application/pdf', 'image/jpeg'])
 * @returns {boolean} True if the magic number matches one of the allowed types.
 */
export function validateMagicNumber(buffer, allowedTypes) {
  if (!buffer || buffer.length < 8) return false;

  const view = new Uint8Array(buffer);

  for (const type of allowedTypes) {
    const magic = MAGIC_NUMBERS[type];
    if (!magic) continue; // If we don't have a magic number definition, we fail closed.

    let isMatch = true;
    for (let i = 0; i < magic.length; i++) {
      if (view[i] !== magic[i]) {
        isMatch = false;
        break;
      }
    }

    if (isMatch) return true;
  }

  return false;
}
