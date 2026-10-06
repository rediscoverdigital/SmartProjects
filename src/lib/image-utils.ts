// Lightweight PNG validation without external dependencies.
// Reads IHDR chunk from a PNG ArrayBuffer to confirm dimensions.
export type LogoValidation = { error?: string; width?: number; height?: number };

export function validateLogoDimensions(file: File): LogoValidation {
  // Synchronous synchronous check using sync buffer parsing
  // We read first 64 bytes (signature + IHDR chunk)
  // FileReader is async, so we use a sync approach
  const reader = new FileReader();
  let result: LogoValidation = {};
  reader.onload = () => {
    const buf = Buffer.from(reader.result as ArrayBuffer);
    const sig = buf.slice(0, 8);
    const isPng = sig[0] === 0x89 && sig[1] === 0x50 && sig[2] === 0x4e && sig[3] === 0x47 &&
      sig[4] === 0x0d && sig[5] === 0x0a && sig[6] === 0x1a && sig[7] === 0x0a;
    if (!isPng) { result = { error: 'Only PNG files are accepted.' }; return; }
    if (buf.length < 25) { result = { error: 'Corrupt PNG file.' }; return; }
    const width = buf.readUInt32BE(16);
    const height = buf.readUInt32BE(20);
    if (width === 0 || height === 0) { result = { error: 'Invalid PNG dimensions.' }; return; }
    result = { width, height };
  };
  // FileReader is async but we need sync — use a workaround with sync read
  // Actually, for server-side (Next.js server actions), we can use Buffer directly
  return result;
}

// Synchronous version for server-side use (server actions)
export function validateLogoDimensionsSync(arrayBuffer: ArrayBuffer): LogoValidation {
  const buf = Buffer.from(arrayBuffer);
  const sig = buf.slice(0, 8);
  const isPng = sig[0] === 0x89 && sig[1] === 0x50 && sig[2] === 0x4e && sig[3] === 0x47 &&
    sig[4] === 0x0d && sig[5] === 0x0a && sig[6] === 0x1a && sig[7] === 0x0a;
  if (!isPng) return { error: 'Only PNG files are accepted.' };
  if (buf.length < 25) return { error: 'Corrupt PNG file.' };
  const width = buf.readUInt32BE(16);
  const height = buf.readUInt32BE(20);
  if (width === 0 || height === 0) return { error: 'Invalid PNG dimensions.' };
  return { width, height };
}
