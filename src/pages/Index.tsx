import { useState, useCallback } from "react";
import { saveAs } from "file-saver";
import JSZip from "jszip";
import { Shield } from "lucide-react";
import DropZone from "@/components/DropZone";
import SummaryStats from "@/components/SummaryStats";
import ImageCard from "@/components/ImageCard";
import SuccessBanner from "@/components/SuccessBanner";
import { readMetadata, stripMetadata, calculateRiskScore, type ImageMetadata } from "@/lib/metadata";

export interface QueuedImage {
  id: string;
  file: File;
  thumbUrl: string;
  metadata: ImageMetadata;
  riskScore: number;
  cleaned: boolean;
  cleanedBlob?: Blob;
  cleanedSize?: number;
  progress?: number;
}

export default function Index() {
  const [images, setImages] = useState<QueuedImage[]>([]);
  const [processing, setProcessing] = useState(false);
  const allCleaned = images.length > 0 && images.every((i) => i.cleaned);

  const handleFiles = useCallback(async (files: File[]) => {
    const newImages: QueuedImage[] = [];
    for (const file of files) {
      const metadata = await readMetadata(file);
      const fields = Object.keys(metadata);
      const riskScore = calculateRiskScore(fields);
      newImages.push({
        id: crypto.randomUUID(),
        file,
        thumbUrl: URL.createObjectURL(file),
        metadata,
        riskScore,
        cleaned: false,
      });
    }
    setImages((prev) => [...prev, ...newImages]);
  }, []);

  const handleScrub = useCallback(async () => {
    setProcessing(true);
    const updated = [...images];

    for (let i = 0; i < updated.length; i++) {
      if (updated[i].cleaned) continue;

      // Animate progress
      for (let p = 0; p <= 80; p += 20) {
        updated[i] = { ...updated[i], progress: p };
        setImages([...updated]);
        await new Promise((r) => setTimeout(r, 60));
      }

      try {
        const { blob, size } = await stripMetadata(updated[i].file);
        updated[i] = { ...updated[i], cleaned: true, cleanedBlob: blob, cleanedSize: size, progress: 100 };
      } catch {
        updated[i] = { ...updated[i], progress: 100 };
      }
      setImages([...updated]);
    }

    setProcessing(false);
  }, [images]);

  const handleDownload = useCallback(async () => {
    const cleaned = images.filter((i) => i.cleaned && i.cleanedBlob);
    if (cleaned.length === 0) return;

    if (cleaned.length === 1) {
      const img = cleaned[0];
      const ext = img.file.name.split(".").pop() || "jpg";
      const name = img.file.name.replace(/\.[^.]+$/, "");
      saveAs(img.cleanedBlob!, `clean_${name}.${ext}`);
      return;
    }

    const zip = new JSZip();
    for (const img of cleaned) {
      const ext = img.file.name.split(".").pop() || "jpg";
      const name = img.file.name.replace(/\.[^.]+$/, "");
      zip.file(`clean_${name}.${ext}`, img.cleanedBlob!);
    }
    const blob = await zip.generateAsync({ type: "blob" });
    saveAs(blob, "metascrub_cleaned.zip");
  }, [images]);

  const totalFieldsRemoved = images
    .filter((i) => i.cleaned)
    .reduce((sum, i) => sum + Object.keys(i.metadata).length, 0);

  return (
    <div className="mx-auto min-h-screen max-w-3xl px-4 py-8 sm:py-16">
      {/* Header */}
      <div className="mb-8 text-center animate-fade-up">
        <div className="flex items-center justify-center gap-2.5">
          <Shield className="h-7 w-7 text-primary" />
          <h1 className="text-2xl font-bold tracking-tight text-foreground sm:text-3xl">
            Meta<span className="text-primary">Scrub</span>
          </h1>
        </div>
        <p className="mt-2 font-mono text-xs text-muted-foreground">
          your images are processed locally in your browser and never stored
        </p>
      </div>

      {/* Drop zone */}
      <div className="animate-fade-up" style={{ animationDelay: "0.1s" }}>
        <DropZone onFiles={handleFiles} compact={images.length > 0} />
      </div>

      {images.length > 0 && (
        <div className="mt-6 space-y-4">
          {/* Summary */}
          <SummaryStats images={images} />

          {/* Scrub button */}
          {!allCleaned && (
            <button
              onClick={handleScrub}
              disabled={processing}
              className="w-full rounded-lg bg-primary py-3 font-mono text-sm font-bold text-primary-foreground transition-transform active:scale-[0.98] hover:shadow-lg hover:shadow-primary/20 disabled:opacity-50 disabled:cursor-not-allowed animate-fade-up"
            >
              {processing ? "Scrubbing…" : "Strip all metadata"}
            </button>
          )}

          {/* Success banner */}
          {allCleaned && (
            <SuccessBanner
              totalFieldsRemoved={totalFieldsRemoved}
              imageCount={images.length}
              onDownload={handleDownload}
            />
          )}

          {/* Image cards */}
          <div className="space-y-3">
            {images.map((img) => (
              <ImageCard key={img.id} image={img} />
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
