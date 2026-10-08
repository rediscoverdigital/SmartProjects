// Lightweight image validation without external dependencies.
// Reads file signatures to confirm actual format (not just MIME type).
export type ImageValidation = { error?: string; width?: number; height?: number };

// ── PNG ─────────────────────────────────────────────────────
function validatePng(buf: Buffer): ImageValidation {
  const sig = buf.slice(0, 8);
  const isPng = sig[0] === 0x89 && sig[1] === 0x50 && sig[2] === 0x4e && sig[3] === 0x47 &&
    sig[4] === 0x0d && sig[5] === 0x0a && sig[6] === 0x1a && sig[7] === 0x0a;
  if (!isPng) return { error: 'Invalid PNG signature.' };
  if (buf.length < 25) return { error: 'Corrupt PNG file.' };
  const width = buf.readUInt32BE(16);
  const height = buf.readUInt32BE(20);
  if (width === 0 || height === 0) return { error: 'Invalid PNG dimensions.' };
  return { width, height };
}

// ── JPEG ────────────────────────────────────────────────────
function validateJpeg(buf: Buffer): ImageValidation {
  // JPEG starts with FF D8 FF
  if (buf[0] !== 0xff || buf[1] !== 0xd8 || buf[2] !== 0xff) {
    return { error: 'Invalid JPEG signature.' };
  }
  // Find SOF0 marker (0xFF 0xC0) to read dimensions
  for (let i = 2; i < Math.min(buf.length - 10); i++) {
    if (buf[i] === 0xff && (buf[i + 1] === 0xc0 || buf[i + 1] === 0xc2)) {
      const height = buf.readUInt16BE(i + 5);
      const width = buf.readUInt16BE(i + 7);
      if (width === 0 || height === 0) return { error: 'Invalid JPEG dimensions.' };
      return { width, height };
    }
  }
  return { error: 'Could not read JPEG dimensions.' };
}

// ── WebP ────────────────────────────────────────────────────
function validateWebp(buf: Buffer): ImageValidation {
  // RIFF....WEBP
  if (buf.length < 12 || buf.toString('ascii', 0, 4) !== 'RIFF' || buf.toString('ascii', 8, 12) !== 'WEBP') {
    return { error: 'Invalid WebP signature.' };
  }
  // VP8 (lossy) or VP8L (lossless) or VP8X (extended)
  const format = buf.toString('ascii', 12, 16);
  if (format === 'VP8 ') {
    // Lossy: dimensions at offset 26 (2 bytes each, 14-bit)
    if (buf.length < 30) return { error: 'Corrupt WebP file.' };
    const width = buf.readUInt16LE(26) & 0x3fff;
    const height = buf.readUInt16LE(28) & 0x3fff;
    return { width, height };
  } else if (format === 'VP8L') {
    // Lossless: dimensions at offset 21 (14-bit each, packed)
    if (buf.length < 25) return { error: 'Corrupt WebP file.' };
    const b0 = buf[21], b1 = buf[22], b2 = buf[23], b3 = buf[24];
    const width = 1 + (((b1 & 0x3f) << 8) | b0);
    const height = 1 + (((b3 & 0xf) << 10) | (b2 << 2) | ((b1 & 0xc0) >> 6));
    return { width, height };
  } else if (format === 'VP8X') {
    // Extended: canvas size at offset 24 (24-bit each)
    if (buf.length < 30) return { error: 'Corrupt WebP file.' };
    const width = 1 + (buf[24] | (buf[25] << 8) | (buf[26] << 16));
    const height = 1 + (buf[27] | (buf[28] << 8) | (buf[29] << 16));
    return { width, height };
  }
  return { error: 'Unsupported WebP format.' };
}

/** Validate image file by its actual binary signature (not MIME type).
 *  Returns dimensions for valid images, error for invalid ones.
 */
export function validateImageSignature(buf: Buffer, mimeType: string): ImageValidation {
  if (mimeType === 'image/png' || mimeType === 'image/x-png') return validatePng(buf);
  if (mimeType === 'image/jpeg' || mimeType === 'image/jpg') return validateJpeg(buf);
  if (mimeType === 'image/webp') return validateWebp(buf);
  return { error: 'Unsupported image format.' };
}

/** Validate PNG specifically (for logo uploads). */
export function validateLogoDimensionsSync(arrayBuffer: ArrayBuffer): ImageValidation {
  return validatePng(Buffer.from(arrayBuffer));
}
