export type SupportedImageType = "image/jpeg" | "image/png" | "image/webp";
export type SanitizedImage = Readonly<{ bytes: Uint8Array; contentType: SupportedImageType; width: number; height: number }>;

const metadataMarkers = new Set([0xe1, 0xed, 0xfe]);
const metadataChunks = new Set(["eXIf", "tEXt", "zTXt", "iTXt"]);

function ascii(bytes: Uint8Array, offset: number, length: number): string { return String.fromCharCode(...bytes.slice(offset, offset + length)); }
function uint16(bytes: Uint8Array, offset: number, little = false): number { return new DataView(bytes.buffer, bytes.byteOffset, bytes.byteLength).getUint16(offset, little); }
function uint32(bytes: Uint8Array, offset: number, little = false): number { return new DataView(bytes.buffer, bytes.byteOffset, bytes.byteLength).getUint32(offset, little); }
function joined(parts: readonly Uint8Array[]): Uint8Array {
  const output = new Uint8Array(parts.reduce((size, part) => size + part.length, 0));
  let offset = 0;
  for (const part of parts) { output.set(part, offset); offset += part.length; }
  return output;
}

function jpegOrientation(segment: Uint8Array): number {
  if (ascii(segment, 4, 6) !== "Exif\0\0") return 1;
  const tiff = 10;
  const little = ascii(segment, tiff, 2) === "II";
  if (!little && ascii(segment, tiff, 2) !== "MM") throw new Error("Metadados JPEG inválidos.");
  if (uint16(segment, tiff + 2, little) !== 42) throw new Error("Metadados JPEG inválidos.");
  const directory = tiff + uint32(segment, tiff + 4, little);
  const entries = uint16(segment, directory, little);
  for (let index = 0; index < entries; index += 1) {
    const entry = directory + 2 + index * 12;
    if (entry + 12 > segment.length) throw new Error("Metadados JPEG truncados.");
    if (uint16(segment, entry, little) === 0x0112) return uint16(segment, entry + 8, little);
  }
  return 1;
}

function sanitizeJpeg(bytes: Uint8Array): SanitizedImage {
  let offset = 2;
  let width = 0;
  let height = 0;
  const parts: Uint8Array[] = [bytes.slice(0, 2)];
  while (offset + 4 <= bytes.length) {
    if (bytes[offset] !== 0xff) throw new Error("Imagem JPEG corrompida.");
    const marker = bytes[offset + 1] ?? 0;
    if (marker === 0xda) { parts.push(bytes.slice(offset)); offset = bytes.length; break; }
    const length = uint16(bytes, offset + 2);
    const end = offset + length + 2;
    if (length < 2 || end > bytes.length) throw new Error("Imagem JPEG truncada.");
    const segment = bytes.slice(offset, end);
    if (marker === 0xe1 && jpegOrientation(segment) !== 1) throw new Error("Gire a foto antes do envio para remover a orientação EXIF.");
    if ([0xc0, 0xc1, 0xc2].includes(marker)) { height = uint16(bytes, offset + 5); width = uint16(bytes, offset + 7); }
    if (!metadataMarkers.has(marker)) parts.push(segment);
    offset = end;
  }
  if (!width || !height || offset !== bytes.length || bytes.at(-2) !== 0xff || bytes.at(-1) !== 0xd9) throw new Error("Imagem JPEG corrompida.");
  return { bytes: joined(parts), contentType: "image/jpeg", width, height };
}

function sanitizePng(bytes: Uint8Array): SanitizedImage {
  const signature = [0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a];
  if (!signature.every((value, index) => bytes[index] === value)) throw new Error("Imagem PNG inválida.");
  const parts: Uint8Array[] = [bytes.slice(0, 8)];
  let offset = 8;
  let width = 0;
  let height = 0;
  let ended = false;
  while (offset + 12 <= bytes.length) {
    const length = uint32(bytes, offset);
    const end = offset + 12 + length;
    if (end > bytes.length) throw new Error("Imagem PNG truncada.");
    const type = ascii(bytes, offset + 4, 4);
    if (type === "IHDR") { width = uint32(bytes, offset + 8); height = uint32(bytes, offset + 12); }
    if (!metadataChunks.has(type)) parts.push(bytes.slice(offset, end));
    offset = end;
    if (type === "IEND") { ended = true; break; }
  }
  if (!width || !height || !ended || offset !== bytes.length) throw new Error("Imagem PNG corrompida.");
  return { bytes: joined(parts), contentType: "image/png", width, height };
}

function webpDimensions(bytes: Uint8Array): readonly [number, number] | null {
  const format = ascii(bytes, 12, 4);
  if (format === "VP8X") return [1 + (bytes[24] ?? 0) + ((bytes[25] ?? 0) << 8) + ((bytes[26] ?? 0) << 16), 1 + (bytes[27] ?? 0) + ((bytes[28] ?? 0) << 8) + ((bytes[29] ?? 0) << 16)];
  if (format === "VP8 " && bytes[23] === 0x9d && bytes[24] === 0x01 && bytes[25] === 0x2a) return [((bytes[26] ?? 0) | ((bytes[27] ?? 0) << 8)) & 0x3fff, ((bytes[28] ?? 0) | ((bytes[29] ?? 0) << 8)) & 0x3fff];
  if (format !== "VP8L" || bytes[20] !== 0x2f) return null;
  return [1 + (bytes[21] ?? 0) + (((bytes[22] ?? 0) & 0x3f) << 8), 1 + ((bytes[22] ?? 0) >> 6) + ((bytes[23] ?? 0) << 2) + (((bytes[24] ?? 0) & 0x0f) << 10)];
}

function inspectWebp(bytes: Uint8Array): SanitizedImage {
  if (bytes.length < 30 || ascii(bytes, 0, 4) !== "RIFF" || ascii(bytes, 8, 4) !== "WEBP" || uint32(bytes, 4, true) + 8 !== bytes.length) throw new Error("Imagem WebP truncada.");
  const dimensions = webpDimensions(bytes);
  if (!dimensions?.[0] || !dimensions[1]) throw new Error("Imagem WebP corrompida.");
  if (ascii(bytes, 12, 4) === "VP8X" && ((bytes[20] ?? 0) & 0x0c) !== 0) throw new Error("Remova metadados EXIF/XMP do WebP antes do envio.");
  return { bytes, contentType: "image/webp", width: dimensions[0], height: dimensions[1] };
}

export function sanitizeImageUpload(bytes: Uint8Array): SanitizedImage {
  if (bytes[0] === 0xff && bytes[1] === 0xd8) return sanitizeJpeg(bytes);
  if (bytes[0] === 0x89 && bytes[1] === 0x50) return sanitizePng(bytes);
  if (ascii(bytes, 0, 4) === "RIFF") return inspectWebp(bytes);
  throw new Error("Formato real da imagem não permitido.");
}
