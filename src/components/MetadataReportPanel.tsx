import { useState, useEffect, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Shield } from "lucide-react";
import { isSensitiveField, getRiskLevel } from "@/lib/metadata";
import type { QueuedImage } from "@/pages/Index";

const GPS_FIELDS = ["GPSLatitude", "GPSLongitude", "GPSAltitude", "GPSLatitudeRef", "GPSLongitudeRef"];
const DEVICE_FIELDS = ["Make", "Model", "Software", "CameraSerialNumber", "BodySerialNumber", "LensSerialNumber"];
const TIME_FIELDS = ["DateTime", "DateTimeOriginal", "DateTimeDigitized"];

function groupFields(metadata: Record<string, string>) {
  const groups: { label: string; fields: [string, string][] }[] = [
    { label: "Location data", fields: [] },
    { label: "Device info", fields: [] },
    { label: "Timestamps", fields: [] },
    { label: "Other fields", fields: [] },
  ];
  for (const [key, val] of Object.entries(metadata)) {
    if (GPS_FIELDS.includes(key)) groups[0].fields.push([key, val]);
    else if (DEVICE_FIELDS.includes(key)) groups[1].fields.push([key, val]);
    else if (TIME_FIELDS.includes(key)) groups[2].fields.push([key, val]);
    else groups[3].fields.push([key, val]);
  }
  return groups.filter((g) => g.fields.length > 0);
}

/* ── Risk Circle ── */
function RiskCircle({ score, color }: { score: number; color: string }) {
  const r = 18;
  const circ = 2 * Math.PI * r; // ~113.1
  const offset = circ - (score / 100) * circ;
  const [displayScore, setDisplayScore] = useState(0);

  useEffect(() => {
    setDisplayScore(0);
    let start: number | null = null;
    const duration = 600;
    function step(ts: number) {
      if (!start) start = ts;
      const p = Math.min((ts - start) / duration, 1);
      const eased = 1 - Math.pow(1 - p, 3);
      setDisplayScore(Math.round(eased * score));
      if (p < 1) requestAnimationFrame(step);
    }
    requestAnimationFrame(step);
  }, [score]);

  const strokeColor =
    color === "destructive"
      ? "hsl(348 100% 64%)"
      : color === "warning"
      ? "hsl(36 90% 55%)"
      : "hsl(155 100% 40%)";

  return (
    <div className="flex items-center gap-3">
      <svg width="48" height="48" viewBox="0 0 48 48">
        <circle cx="24" cy="24" r={r} fill="none" stroke="hsl(245 20% 16%)" strokeWidth="3" />
        <circle
          cx="24"
          cy="24"
          r={r}
          fill="none"
          stroke={strokeColor}
          strokeWidth="3"
          strokeLinecap="round"
          strokeDasharray={circ}
          strokeDashoffset={offset}
          transform="rotate(-90 24 24)"
          style={{ transition: "stroke-dashoffset 0.6s cubic-bezier(0.22,1,0.36,1)" }}
        />
        <text
          x="24"
          y="24"
          textAnchor="middle"
          dominantBaseline="central"
          className="font-mono text-[11px] font-bold"
          fill={strokeColor}
        >
          {displayScore}%
        </text>
      </svg>
    </div>
  );
}

/* ── Main Panel ── */
interface Props {
  image: QueuedImage | null;
  visible: boolean;
}

export default function MetadataReportPanel({ image, visible }: Props) {
  const [tab, setTab] = useState<"before" | "after">("before");
  const [tabKey, setTabKey] = useState(0);

  // Reset tab when image changes
  useEffect(() => {
    setTab("before");
    setTabKey((k) => k + 1);
  }, [image?.id]);

  const handleTabSwitch = (t: "before" | "after") => {
    setTab(t);
    setTabKey((k) => k + 1);
  };

  const groups = useMemo(() => (image ? groupFields(image.metadata) : []), [image]);
  const { label: riskLabel, color: riskColor } = image
    ? getRiskLevel(image.riskScore)
    : { label: "—", color: "success" as const };

  const totalFields = image ? Object.keys(image.metadata).length : 0;
  const sensitiveFields = image
    ? Object.keys(image.metadata).filter(isSensitiveField).length
    : 0;

  const riskDesc =
    riskColor === "destructive"
      ? "GPS coordinates and device identifiers expose your exact location and hardware."
      : riskColor === "warning"
      ? "Device or timestamp data could reveal when and where this was taken."
      : "Minimal metadata detected. Low privacy exposure.";

  // Flatten for stagger index
  let rowIdx = 0;

  return (
    <div
      className="flex w-[260px] shrink-0 flex-col border-l overflow-hidden"
      style={{
        background: "hsl(240 33% 4%)",
        borderColor: "hsl(245 20% 16%)",
        borderLeftWidth: "0.5px",
        transform: visible ? "translateX(0)" : "translateX(100%)",
        transition: "transform 0.35s cubic-bezier(0.22,1,0.36,1)",
      }}
    >
      <div className="flex-1 overflow-y-auto px-3 py-4" style={{ scrollbarWidth: "thin" }}>
        {/* Header */}
        <div className="flex items-center gap-2 mb-1">
          <Shield className="h-4 w-4 text-primary" />
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
            <p
              className="mt-1 truncate font-mono text-[11px] font-medium"
              style={{ color: "hsl(213 100% 65%)" }}
            >
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
                    {group.fields.map(([key, val]) => {
                      const idx = rowIdx++;
                      const sensitive = isSensitiveField(key);
                      const cleaned = image.cleaned && tab === "after";
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
                          className="flex items-baseline justify-between gap-2 py-[3px]"
                        >
                          <span className="font-mono text-[10px] text-muted-foreground truncate shrink-0">
                            {key}
                          </span>
                          {cleaned ? (
                            <span
                              className="font-mono text-[10px] font-medium shrink-0"
                              style={{ color: "hsl(155 100% 40%)" }}
                            >
                              removed
                            </span>
                          ) : (
                            <span
                              className="font-mono text-[10px] truncate text-right max-w-[100px]"
                              style={{
                                color: sensitive
                                  ? "hsl(348 100% 64%)"
                                  : "hsl(240 20% 93%)",
                              }}
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
                  label: "Status",
                  value: image.cleaned ? "Cleaned ✓" : "Pending",
                  color: image.cleaned ? "hsl(155 100% 40%)" : undefined,
                },
              ].map((s) => (
                <div key={s.label} className="flex justify-between font-mono text-[10px]">
                  <span className="text-muted-foreground">{s.label}</span>
                  <span style={s.color ? { color: s.color } : undefined} className={s.color ? "font-medium" : "text-foreground"}>
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
