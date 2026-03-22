import { useState } from "react";
import { Info } from "lucide-react";
import { isSensitiveField, getRiskLevel, isPng, getFileTypeLabel } from "@/lib/metadata";
import type { QueuedImage } from "@/pages/Index";

function formatSize(bytes: number) {
  if (bytes < 1024) return bytes + " B";
  if (bytes < 1048576) return (bytes / 1024).toFixed(1) + " KB";
  return (bytes / 1048576).toFixed(1) + " MB";
}

const FILE_TYPE_STYLES: Record<string, { bg: string; text: string }> = {
  JPEG: { bg: "hsla(135, 30%, 12%, 1)", text: "hsl(155 100% 40%)" },
  PNG: { bg: "hsla(230, 30%, 12%, 1)", text: "hsl(213 100% 65%)" },
  WEBP: { bg: "hsla(280, 30%, 12%, 1)", text: "hsl(280 60% 70%)" },
  IMG: { bg: "hsl(var(--secondary))", text: "hsl(var(--muted-foreground))" },
};

interface Props {
  image: QueuedImage;
  selected?: boolean;
  onSelect?: () => void;
}

export default function ImageCard({ image, selected, onSelect }: Props) {
  const { label, color } = getRiskLevel(image.riskScore);
  const fields = Object.keys(image.metadata);
  const [flashing, setFlashing] = useState(false);
  const fileTypeLabel = getFileTypeLabel(image.file);
  const typeStyle = FILE_TYPE_STYLES[fileTypeLabel] || FILE_TYPE_STYLES.IMG;

  const handleClick = () => {
    setFlashing(true);
    setTimeout(() => setFlashing(false), 250);
    onSelect?.();
  };

  const borderStyle: React.CSSProperties = image.cleaned
    ? {
        borderColor: "hsla(155,100%,53%,0.3)",
        boxShadow: selected ? "0 0 0 4px hsla(155,100%,53%,0.1)" : undefined,
      }
    : selected
    ? { borderColor: "hsl(213 100% 65%)" }
    : {};

  const barColor =
    color === "success" ? "bg-success" : color === "warning" ? "bg-warning" : "bg-destructive";

  const progressDone = image.progress === 100 && image.cleaned;

  return (
    <div
      onClick={handleClick}
      className={`rounded-lg border bg-card p-4 cursor-pointer animate-fade-up ${
        image.cleaned ? "metascrub-pulse" : ""
      }`}
      style={{
        ...borderStyle,
        transition: "border-color 0.2s ease, box-shadow 0.5s ease-out, background-color 0.25s ease",
        animationDelay: `${Math.random() * 0.15}s`,
        backgroundColor: flashing ? "hsl(215 30% 15%)" : undefined,
      }}
    >
      <div className="flex gap-4">
        {/* Thumbnail */}
        <div className="h-20 w-20 shrink-0 overflow-hidden rounded-md bg-secondary">
          <img
            src={image.thumbUrl}
            alt={image.file.name}
            className="h-full w-full object-cover"
          />
        </div>

        {/* Info */}
        <div className="min-w-0 flex-1">
          <div className="flex items-start justify-between gap-2">
            <div className="min-w-0">
              <p className="truncate font-mono text-sm text-foreground">{image.file.name}</p>
              <div className="flex items-center gap-2 font-mono text-xs text-muted-foreground">
                <span>{formatSize(image.cleaned ? image.cleanedSize! : image.file.size)}</span>
                {/* File type badge */}
                <span
                  className="rounded px-1.5 py-0.5 font-mono text-[10px] font-bold uppercase"
                  style={{ backgroundColor: typeStyle.bg, color: typeStyle.text }}
                >
                  {fileTypeLabel}
                </span>
                {image.cleaned && (
                  <span className="text-success" style={{ animation: "fadeIn 0.3s ease-out" }}>
                    Cleaned ✓
                  </span>
                )}
              </div>
            </div>

            {/* Risk badge */}
            <span
              className={`shrink-0 rounded px-2 py-0.5 font-mono text-xs font-bold ${
                image.cleaned
                  ? "bg-success/15 text-success"
                  : color === "success"
                  ? "bg-success/15 text-success"
                  : color === "warning"
                  ? "bg-warning/15 text-warning"
                  : "bg-destructive/15 text-destructive"
              }`}
            >
              {image.cleaned ? "SAFE" : `${image.riskScore}% ${label}`}
            </span>
          </div>

          {/* Risk bar */}
          {!image.cleaned && image.progress === undefined && (
            <div className="mt-2 h-1.5 w-full overflow-hidden rounded-full bg-secondary">
              <div
                className={`h-full rounded-full transition-all duration-500 ${barColor}`}
                style={{ width: `${image.riskScore}%` }}
              />
            </div>
          )}

          {/* Progress bar during cleaning */}
          {image.progress !== undefined && (
            <div className="mt-2 h-1.5 w-full overflow-hidden rounded-full bg-secondary">
              <div
                className="h-full rounded-full"
                style={{
                  width: `${image.progress}%`,
                  backgroundColor: progressDone ? "hsl(155 100% 50%)" : "hsl(213 100% 65%)",
                  transition:
                    image.progress <= 40
                      ? "width 0.05s ease"
                      : image.progress <= 75
                      ? "width 0.4s ease"
                      : "width 0.3s ease, background-color 0.3s ease",
                }}
              />
            </div>
          )}
        </div>
      </div>

      {/* Metadata pills */}
      {fields.length > 0 && (
        <div className="mt-3 flex flex-wrap gap-1.5">
          {fields.map((field) => (
            <span
              key={field}
              className={`rounded px-1.5 py-0.5 font-mono text-[10px] leading-tight ${
                isSensitiveField(field)
                  ? "bg-destructive/15 text-destructive"
                  : "bg-secondary text-muted-foreground"
              }`}
            >
              {field}
            </span>
          ))}
        </div>
      )}

      {/* PNG disclaimer */}
      {isPng(image.file) && (
        <div className="mt-2 flex items-center gap-1 font-mono text-[10px] text-muted-foreground">
          <Info className="h-3 w-3 shrink-0" />
          <span>PNG metadata detection limited — stripping is still applied</span>
        </div>
      )}
    </div>
  );
}
