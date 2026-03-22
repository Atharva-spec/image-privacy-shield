import { useCallback, useState } from "react";
import { Upload } from "lucide-react";

interface DropZoneProps {
  onFiles: (files: File[]) => void;
  compact?: boolean;
}

const ACCEPTED = ["image/jpeg", "image/png", "image/webp"];

export default function DropZone({ onFiles, compact }: DropZoneProps) {
  const [dragging, setDragging] = useState(false);

  const handleFiles = useCallback(
    (fileList: FileList | null) => {
      if (!fileList) return;
      const valid = Array.from(fileList).filter((f) => ACCEPTED.includes(f.type));
      if (valid.length) onFiles(valid);
    },
    [onFiles]
  );

  const onDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      setDragging(false);
      handleFiles(e.dataTransfer.files);
    },
    [handleFiles]
  );

  if (compact) {
    return (
      <div
        onDragOver={(e) => { e.preventDefault(); setDragging(true); }}
        onDragLeave={() => setDragging(false)}
        onDrop={onDrop}
        className={`flex items-center gap-3 rounded-lg border border-dashed p-3 transition-colors cursor-pointer ${
          dragging ? "border-primary bg-primary/5" : "border-border hover:border-muted-foreground"
        }`}
        onClick={() => {
          const input = document.createElement("input");
          input.type = "file";
          input.multiple = true;
          input.accept = ACCEPTED.join(",");
          input.onchange = () => handleFiles(input.files);
          input.click();
        }}
      >
        <Upload className="h-4 w-4 text-primary shrink-0" />
        <span className="text-sm text-muted-foreground font-mono">
          Drop more images or <span className="text-primary underline underline-offset-2">browse</span>
        </span>
      </div>
    );
  }

  return (
    <div
      onDragOver={(e) => { e.preventDefault(); setDragging(true); }}
      onDragLeave={() => setDragging(false)}
      onDrop={onDrop}
      onClick={() => {
        const input = document.createElement("input");
        input.type = "file";
        input.multiple = true;
        input.accept = ACCEPTED.join(",");
        input.onchange = () => handleFiles(input.files);
        input.click();
      }}
      className={`flex flex-col items-center justify-center gap-4 rounded-xl border-2 border-dashed p-16 transition-all cursor-pointer ${
        dragging
          ? "border-primary bg-primary/5 scale-[1.01]"
          : "border-border hover:border-muted-foreground"
      }`}
    >
      <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-primary/10">
        <Upload className="h-7 w-7 text-primary" />
      </div>
      <div className="text-center">
        <p className="text-lg font-medium text-foreground">Drop images here</p>
        <p className="mt-1 text-sm text-muted-foreground font-mono">
          JPEG, PNG, WEBP — or <span className="text-primary underline underline-offset-2">browse files</span>
        </p>
      </div>
    </div>
  );
}
