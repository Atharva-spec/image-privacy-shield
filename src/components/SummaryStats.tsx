import type { QueuedImage } from "@/pages/Index";

interface Props {
  images: QueuedImage[];
}

export default function SummaryStats({ images }: Props) {
  const highRisk = images.filter((i) => i.riskScore >= 60).length;
  const medRisk = images.filter((i) => i.riskScore >= 25 && i.riskScore < 60).length;
  const totalFields = images.reduce((sum, i) => sum + Object.keys(i.metadata).length, 0);

  const stats = [
    { label: "Queued", value: images.length, accent: "text-foreground" },
    { label: "High risk", value: highRisk, accent: "text-destructive" },
    { label: "Med risk", value: medRisk, accent: "text-warning" },
    { label: "Fields found", value: totalFields, accent: "text-foreground" },
  ];

  return (
    <div className="grid grid-cols-2 gap-3 sm:grid-cols-4 animate-fade-up">
      {stats.map((s) => (
        <div key={s.label} className="rounded-lg border bg-card p-4">
          <p className="text-xs uppercase tracking-wider text-muted-foreground font-mono">{s.label}</p>
          <p className={`mt-1 text-2xl font-bold font-mono ${s.accent}`}>{s.value}</p>
        </div>
      ))}
    </div>
  );
}
