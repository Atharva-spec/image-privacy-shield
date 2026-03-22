import ExifReader from "exifreader";

export interface ImageMetadata {
  [key: string]: string;
}

const SENSITIVE_FIELDS = new Set([
  "GPSLatitude",
  "GPSLongitude",
  "GPSAltitude",
  "GPSLatitudeRef",
  "GPSLongitudeRef",
  "Make",
  "Model",
  "Software",
  "DateTime",
  "DateTimeOriginal",
  "DateTimeDigitized",
  "Artist",
  "Copyright",
  "OwnerName",
  "CameraSerialNumber",
  "BodySerialNumber",
  "LensSerialNumber",
]);

const GPS_FIELDS = ["GPSLatitude", "GPSLongitude", "GPSAltitude", "GPSLatitudeRef", "GPSLongitudeRef"];
const DEVICE_FIELDS = ["Make", "Model"];
const TIME_FIELDS = ["DateTime", "DateTimeOriginal", "DateTimeDigitized"];
const IDENTITY_FIELDS = ["Artist", "Copyright", "OwnerName"];

export function isSensitiveField(field: string): boolean {
  return SENSITIVE_FIELDS.has(field);
}

export function calculateRiskScore(fields: string[], fileType?: string): number {
  let score = 0;
  if (fields.some((f) => GPS_FIELDS.includes(f))) score += 50;
  if (fields.some((f) => DEVICE_FIELDS.includes(f))) score += 20;
  if (fields.some((f) => TIME_FIELDS.includes(f))) score += 15;
  if (fields.some((f) => IDENTITY_FIELDS.includes(f))) score += 15;
  // JPEG files always contain MakerNote data that Sharp strips
  if (fileType === "image/jpeg") score += 10;
  return Math.min(score, 100);
}

export function isJpeg(file: File): boolean {
  return file.type === "image/jpeg";
}

export function isPng(file: File): boolean {
  return file.type === "image/png";
}

export function getFileTypeLabel(file: File): string {
  if (file.type === "image/jpeg") return "JPEG";
  if (file.type === "image/png") return "PNG";
  if (file.type === "image/webp") return "WEBP";
  return "IMG";
}

export function getRiskLevel(score: number): { label: string; color: "success" | "warning" | "destructive" } {
  if (score < 25) return { label: "LOW", color: "success" };
  if (score < 60) return { label: "MED", color: "warning" };
  return { label: "HIGH", color: "destructive" };
}

export async function readMetadata(file: File): Promise<ImageMetadata> {
  const buffer = await file.arrayBuffer();
  try {
    const tags = ExifReader.load(buffer, { expanded: false });
    const result: ImageMetadata = {};
    for (const [key, value] of Object.entries(tags)) {
      if (key === "MakerNote" || key === "UserComment" || key === "Thumbnail") continue;
      const v = value as any;
      const desc = v?.description ?? v?.value;
      if (desc !== undefined && desc !== null && String(desc).length < 200) {
        result[key] = String(desc);
      }
    }
    return result;
  } catch {
    return {};
  }
}

export function stripMetadata(file: File): Promise<{ blob: Blob; size: number }> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    const url = URL.createObjectURL(file);
    img.onload = () => {
      const canvas = document.createElement("canvas");
      canvas.width = img.naturalWidth;
      canvas.height = img.naturalHeight;
      const ctx = canvas.getContext("2d")!;
      ctx.drawImage(img, 0, 0);
      URL.revokeObjectURL(url);

      const mimeMap: Record<string, string> = {
        "image/jpeg": "image/jpeg",
        "image/png": "image/png",
        "image/webp": "image/webp",
      };
      const mime = mimeMap[file.type] || "image/png";
      canvas.toBlob(
        (blob) => {
          if (blob) resolve({ blob, size: blob.size });
          else reject(new Error("Failed to create blob"));
        },
        mime,
        mime === "image/jpeg" ? 0.95 : undefined
      );
    };
    img.onerror = () => {
      URL.revokeObjectURL(url);
      reject(new Error("Failed to load image"));
    };
    img.src = url;
  });
}
