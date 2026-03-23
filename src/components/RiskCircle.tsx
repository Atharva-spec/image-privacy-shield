import { useState, useEffect } from "react";

interface Props {
  score: number;
  color: string;
}

export default function RiskCircle({ score, color }: Props) {
  const r = 18;
  const circ = 2 * Math.PI * r;
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

  const strokeColorClass =
    color === "destructive"
      ? "stroke-destructive"
      : color === "warning"
      ? "stroke-warning"
      : "stroke-success";

  const fillColorClass =
    color === "destructive"
      ? "fill-destructive"
      : color === "warning"
      ? "fill-warning"
      : "fill-success";

  return (
    <div className="flex items-center gap-3">
      <svg width="48" height="48" viewBox="0 0 48 48">
        <circle cx="24" cy="24" r={r} fill="none" className="stroke-border" strokeWidth="3" />
        <circle
          cx="24"
          cy="24"
          r={r}
          fill="none"
          className={strokeColorClass}
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
          className={`font-mono text-[11px] font-bold ${fillColorClass}`}
        >
          {displayScore}%
        </text>
      </svg>
    </div>
  );
}
