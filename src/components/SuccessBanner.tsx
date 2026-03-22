import { Download, ShieldCheck } from "lucide-react";

interface Props {
  totalFieldsRemoved: number;
  imageCount: number;
  onDownload: () => void;
}

export default function SuccessBanner({ totalFieldsRemoved, imageCount, onDownload }: Props) {
  return (
    <div className="animate-fade-up rounded-lg border border-success/30 bg-success/5 p-5">
      <div className="flex flex-col items-center gap-3 sm:flex-row sm:justify-between">
        <div className="flex items-center gap-3">
          <ShieldCheck className="h-6 w-6 text-success" />
          <div>
            <p className="font-medium text-foreground">
              All {imageCount} image{imageCount !== 1 ? "s" : ""} cleaned
            </p>
            <p className="text-sm font-mono text-muted-foreground">
              {totalFieldsRemoved} metadata field{totalFieldsRemoved !== 1 ? "s" : ""} removed
            </p>
          </div>
        </div>
        <button
          onClick={onDownload}
          className="flex items-center gap-2 rounded-lg bg-primary px-5 py-2.5 font-mono text-sm font-bold text-primary-foreground transition-transform active:scale-[0.97] hover:shadow-lg hover:shadow-primary/20"
        >
          <Download className="h-4 w-4" />
          Download {imageCount > 1 ? "ZIP" : "image"}
        </button>
      </div>
    </div>
  );
}
