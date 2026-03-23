import { useState, useEffect, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import BrandShield from "@/components/BrandShield";
import {
  isSensitiveField,
  getRiskLevel,
  isJpeg,
  getFileTypeLabel,
  type JpegHiddenBlocks,
} from "@/lib/metadata";
import type { QueuedImage } from "@/pages/Index";
import RiskCircle from "@/components/RiskCircle";

const GPS_FIELDS = ["GPSLatitude", "GPSLongitude", "GPSAltitude", "GPSLatitudeRef", "GPSLongitudeRef"];
const DEVICE_FIELDS = ["Make", "Model", "Software", "CameraSerialNumber", "BodySerialNumber", "LensSerialNumber"];
const TIME_FIELDS = ["DateTime", "DateTimeOriginal", "DateTimeDigitized"];

interface ReportField {
  key: string;
  value: string;
  hint?: string;
}

interface FieldGroup {
  label: string;
  fields: ReportField[];
  isHidden?: boolean;
}

const MAKERNOTE_HINT =
  "Vendor-only EXIF block. On some devices it can hold serials or other identifiers; rarely, extra network-related vendor fields.";
const THUMBNAIL_HINT =
  "Smaller preview stored inside the JPEG. It is a separate image buffer and is removed when you strip metadata.";

function groupFields(
  metadata: Record<string, string>,
  fileIsJpeg: boolean,
  jpegHidden?: JpegHiddenBlocks
): FieldGroup[] {
  const groups: FieldGroup[] = [
    { label: "Location data", fields: [] },
    { label: "Device info", fields: [] },
    { label: "Timestamps", fields: [] },
  ];

  if (fileIsJpeg && jpegHidden) {
    const hiddenFields: ReportField[] = [];
    if (jpegHidden.makerNote) {
      hiddenFields.push({ key: "MakerNote", value: "", hint: MAKERNOTE_HINT });
    }
    if (jpegHidden.embeddedThumbnail) {
      hiddenFields.push({ key: "EmbeddedThumbnail", value: "", hint: THUMBNAIL_HINT });
    }
    if (hiddenFields.length > 0) {
      groups.push({ label: "Hidden data", fields: hiddenFields, isHidden: true });
    }
  }

  groups.push({ label: "Other fields", fields: [] });

  for (const [key, val] of Object.entries(metadata)) {
    if (GPS_FIELDS.includes(key)) groups[0].fields.push({ key, value: val });
    else if (DEVICE_FIELDS.includes(key)) groups[1].fields.push({ key, value: val });
    else if (TIME_FIELDS.includes(key)) groups[2].fields.push({ key, value: val });
    else {
      groups[groups.length - 1].fields.push({ key, value: val });
    }
  }
  return groups.filter((g) => g.fields.length > 0);
}

function hiddenBlockCount(jpegHidden?: JpegHiddenBlocks): number {
  if (!jpegHidden) return 0;
  return (jpegHidden.makerNote ? 1 : 0) + (jpegHidden.embeddedThumbnail ? 1 : 0);
}

/* ── Main Panel ── */
interface Props {
  image: QueuedImage | null;
  visible: boolean;
}

export default function MetadataReportPanel({ image, visible }: Props) {
  const [tab, setTab] = useState<"before" | "after">("before");
  const [tabKey, setTabKey] = useState(0);

  useEffect(() => {
    setTab("before");
    setTabKey((k) => k + 1);
  }, [image?.id]);

  const handleTabSwitch = (t: "before" | "after") => {
    setTab(t);
    setTabKey((k) => k + 1);
  };

  const fileIsJpeg = image ? isJpeg(image.file) : false;
  const groups = useMemo(
    () => (image ? groupFields(image.metadata, fileIsJpeg, image.jpegHidden) : []),
    [image, fileIsJpeg]
  );
  const { label: riskLabel, color: riskColor } = image
    ? getRiskLevel(image.riskScore)
    : { label: "—", color: "success" as const };

  const totalFields = image ? Object.keys(image.metadata).length : 0;
  const sensitiveFields = image
    ? Object.keys(image.metadata).filter(isSensitiveField).length
    : 0;

  const hiddenDataBlocks = hiddenBlockCount(image?.jpegHidden);

  const riskDesc = (() => {
    if (!image) return "";
    const parts: string[] = [];
    if (riskColor === "destructive") {
      parts.push("GPS coordinates and device identifiers expose your exact location and hardware.");
    } else if (riskColor === "warning") {
      parts.push("Device or timestamp data could reveal when and where this was taken.");
    } else {
      parts.push("Minimal metadata detected. Low privacy exposure.");
    }
    if (fileIsJpeg && hiddenDataBlocks > 0) {
      parts.push("Extra EXIF image data (maker note and/or embedded preview) detected.");
    }
    return parts.join(" ");
  })();

  const fileTypeLabel = image ? getFileTypeLabel(image.file) : "—";

  let rowIdx = 0;

  return (
    <div
      className="fixed right-0 top-0 h-screen w-[260px] flex flex-col border-l border-border bg-card overflow-hidden z-30"
      style={{
        transform: visible ? "translateX(0)" : "translateX(100%)",
        transition: "transform 0.35s cubic-bezier(0.22,1,0.36,1)",
      }}
    >
      <div className="flex-1 overflow-y-auto px-3 py-4" style={{ scrollbarWidth: "thin" }}>
        {/* Header */}
        <div className="flex items-center gap-2 mb-1">
          <BrandShield size="sm" alt="" />
          <h2 className="font-mono text-xs font-bold tracking-wide text-foreground uppercase">
            Metadata report
          </h2>
        </div>

        {!image ? (
          <p className="mt-2 font-mono text-[10px] text-muted-foreground leading-relaxed">
            click any image card to inspect
          </p>
        ) : (
          <>
            <p className="mt-1 truncate font-mono text-[11px] font-medium text-primary">
              {image.file.name}
            </p>
            <p className="font-mono text-[10px] text-muted-foreground">
              click any image card to inspect
            </p>

            {/* Tabs */}
            <div className="mt-3 flex gap-1 rounded-md bg-secondary p-0.5">
              {(["before", "after"] as const).map((t) => (
                <button
                  key={t}
                  onClick={() => handleTabSwitch(t)}
                  className={`flex-1 rounded px-2 py-1 font-mono text-[10px] font-bold uppercase transition-colors ${
                    tab === t
                      ? "bg-card text-foreground shadow-sm"
                      : "text-muted-foreground hover:text-foreground"
                  }`}
                >
                  {t === "before" ? "Before" : "After"}
                </button>
              ))}
            </div>

            {/* Risk summary */}
            <div className="mt-3 rounded-md bg-secondary/50 p-2.5">
              <div className="flex items-center gap-2.5">
                <RiskCircle
                  score={image.cleaned && tab === "after" ? 0 : image.riskScore}
                  color={image.cleaned && tab === "after" ? "success" : riskColor}
                />
                <div className="min-w-0">
                  <p
                    className={`font-mono text-xs font-bold ${
                      image.cleaned && tab === "after"
                        ? "text-success"
                        : riskColor === "destructive"
                        ? "text-destructive"
                        : riskColor === "warning"
                        ? "text-warning"
                        : "text-success"
                    }`}
                  >
                    {image.cleaned && tab === "after" ? "SAFE" : riskLabel}
                  </p>
                  <p className="font-mono text-[9px] leading-snug text-muted-foreground mt-0.5">
                    {image.cleaned && tab === "after"
                      ? "All metadata has been stripped."
                      : riskDesc}
                  </p>
                </div>
              </div>
            </div>

            {/* Grouped metadata rows */}
            <AnimatePresence mode="wait">
              <motion.div
                key={tabKey}
                initial={{ opacity: 0, x: 8 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -8 }}
                transition={{ duration: 0.15 }}
                className="mt-3 space-y-3"
              >
                {groups.map((group) => (
                  <div key={group.label}>
                    <p className="font-mono text-[9px] uppercase tracking-widest text-muted-foreground mb-1">
                      {group.label}
                    </p>
                    {group.fields.map(({ key, value: val, hint }) => {
                      const idx = rowIdx++;
                      const sensitive = isSensitiveField(key);
                      const cleaned = image.cleaned && tab === "after";
                      const isHiddenRow = group.isHidden === true;
                      return (
                        <motion.div
                          key={key}
                          initial={{ opacity: 0, x: 10 }}
                          animate={{ opacity: 1, x: 0 }}
                          transition={{
                            duration: 0.2,
                            delay: idx * 0.03,
                            ease: "easeOut",
                          }}
                          className="flex items-baseline justify-between gap-2 py-[3px] min-w-0"
                          style={
                            cleaned && isHiddenRow
                              ? { borderLeft: "2px solid hsl(var(--success) / 0.3)", paddingLeft: 6 }
                              : isHiddenRow
                              ? { borderLeft: "2px solid transparent", paddingLeft: 6 }
                              : undefined
                          }
                        >
                          <span className="font-mono text-[10px] text-muted-foreground truncate shrink-0">
                            {key}
                          </span>
                          {cleaned ? (
                            <span className="font-mono text-[10px] font-medium shrink-0 text-success">
                              removed
                            </span>
                          ) : isHiddenRow ? (
                            <div className="flex flex-col items-end min-w-0 max-w-[min(148px,100%)]">
                              <span className="font-mono text-[10px] shrink-0 text-destructive">
                                present
                              </span>
                              {hint ? (
                                <span className="font-mono text-[9px] text-muted-foreground text-right leading-snug break-words">
                                  {hint}
                                </span>
                              ) : null}
                            </div>
                          ) : (
                            <span
                              className={`font-mono text-[10px] truncate text-right max-w-[100px] ${
                                sensitive ? "text-destructive" : "text-foreground"
                              }`}
                            >
                              {val}
                            </span>
                          )}
                        </motion.div>
                      );
                    })}
                  </div>
                ))}
                {groups.length === 0 && (
                  <p className="font-mono text-[10px] text-muted-foreground">No metadata found</p>
                )}
              </motion.div>
            </AnimatePresence>

            {/* Footer stats */}
            <div className="mt-4 space-y-1 border-t border-border pt-3">
              {[
                { label: "Total fields", value: String(totalFields) },
                { label: "Sensitive", value: String(sensitiveFields) },
                {
                  label: "Hidden data",
                  value: fileIsJpeg
                    ? hiddenDataBlocks > 0
                      ? `${hiddenDataBlocks} block${hiddenDataBlocks === 1 ? "" : "s"}`
                      : "none detected"
                    : "—",
                },
                { label: "File type", value: fileTypeLabel },
                {
                  label: "Status",
                  value: image.cleaned ? "Cleaned ✓" : "Pending",
                  isSuccess: image.cleaned,
                },
              ].map((s) => (
                <div key={s.label} className="flex justify-between font-mono text-[10px]">
                  <span className="text-muted-foreground">{s.label}</span>
                  <span className={
                    "isSuccess" in s && s.isSuccess ? "font-medium text-success" : "text-foreground"
                  }>
                    {s.value}
                  </span>
                </div>
              ))}
            </div>
          </>
        )}
      </div>
    </div>
  );
}
