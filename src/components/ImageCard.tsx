import { isSensitiveField, getRiskLevel } from "@/lib/metadata";
import type { QueuedImage } from "@/pages/Index";

function formatSize(bytes: number) {
  if (bytes < 1024) return bytes + " B";
  if (bytes < 1048576) return (bytes / 1024).toFixed(1) + " KB";
  return (bytes / 1048576).toFixed(1) + " MB";
}

interface Props {
  image: QueuedImage;
}

export default function ImageCard({ image }: Props) {
  const { label, color } = getRiskLevel(image.riskScore);
  const fields = Object.keys(image.metadata);

  const borderClass = image.cleaned
    ? "border-success/50"
    : color === "destructive"
    ? "border-destructive/30"
    : "border-border";

  const barColor =
    color === "success" ? "bg-success" : color === "warning" ? "bg-warning" : "bg-destructive";

  return (
    <div
      className={`rounded-lg border bg-card p-4 transition-colors animate-fade-up ${borderClass}`}
      style={{ animationDelay: `${Math.random() * 0.15}s` }}
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
              <p className="font-mono text-xs text-muted-foreground">
                {formatSize(image.cleaned ? image.cleanedSize! : image.file.size)}
                {image.cleaned && (
                  <span className="ml-2 text-success">Cleaned ✓</span>
                )}
              </p>
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
          {!image.cleaned && (
            <div className="mt-2 h-1.5 w-full overflow-hidden rounded-full bg-secondary">
              <div
                className={`h-full rounded-full transition-all duration-500 ${barColor}`}
                style={{ width: `${image.riskScore}%` }}
              />
            </div>
          )}

          {/* Progress bar during cleaning */}
          {image.progress !== undefined && image.progress < 100 && !image.cleaned && (
            <div className="mt-2 h-1.5 w-full overflow-hidden rounded-full bg-secondary">
              <div
                className="h-full rounded-full bg-primary transition-all duration-300"
                style={{ width: `${image.progress}%` }}
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
    </div>
  );
}
