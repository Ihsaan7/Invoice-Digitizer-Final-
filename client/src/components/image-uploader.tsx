import { useState, useRef, useCallback } from "react";
import { Upload, Camera, Image, Loader2, FileImage, Scan } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";

interface ImageUploaderProps {
  onUpload: (formData: FormData) => void;
  isLoading: boolean;
}

export function ImageUploader({ onUpload, isLoading }: ImageUploaderProps) {
  const [preview, setPreview] = useState<string | null>(null);
  const [dragOver, setDragOver] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const cameraInputRef = useRef<HTMLInputElement>(null);

  const handleFile = useCallback((file: File) => {
    if (!file.type.startsWith("image/")) return;
    const reader = new FileReader();
    reader.onload = (e) => setPreview(e.target?.result as string);
    reader.readAsDataURL(file);
    const formData = new FormData();
    formData.append("image", file);
    onUpload(formData);
  }, [onUpload]);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(false);
    const file = e.dataTransfer.files[0];
    if (file) handleFile(file);
  }, [handleFile]);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) handleFile(file);
  };

  return (
    <div className="flex flex-col items-center gap-8 max-w-2xl mx-auto">
      {/* Hero heading */}
      <div className="text-center space-y-3 animate-slide-up">
        <div className="inline-flex items-center justify-center w-14 h-14 rounded-xl bg-primary/8 mb-1 transition-transform hover:scale-105">
          <FileImage className="w-7 h-7 text-primary" />
        </div>
        <h2
          className="text-2xl font-bold tracking-tight text-foreground"
          data-testid="text-upload-title"
        >
          Upload Invoice Note
        </h2>
        <p className="text-sm text-muted-foreground leading-relaxed max-w-md">
          Photo or scan of any handwritten note. The AI reads model numbers and rates
          automatically — the last number is treated as the grand total.
        </p>
      </div>

      {/* Drop zone */}
      <div className="w-full animate-slide-up delay-100">
        <div
          className={`
            group relative w-full rounded-xl border-2 border-dashed
            transition-all duration-300 cursor-pointer min-h-[260px]
            flex flex-col items-center justify-center gap-4 p-10
            ${dragOver
              ? "border-primary bg-primary/5 scale-[1.01]"
              : "border-border hover:border-primary/50 hover:bg-muted/30 bg-card"
            }
          `}
          onDrop={handleDrop}
          onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
          onDragLeave={() => setDragOver(false)}
          onClick={() => !isLoading && fileInputRef.current?.click()}
          data-testid="dropzone-upload"
        >
          {isLoading ? (
            <div className="flex flex-col items-center gap-5">
              <div className="relative w-16 h-16">
                <div className="absolute inset-0 rounded-full border-4 border-primary/20 animate-ping" />
                <div className="absolute inset-0 rounded-full border-4 border-primary/10" />
                <div className="absolute inset-2 rounded-full bg-primary/5 flex items-center justify-center">
                  <Loader2 className="w-7 h-7 text-primary animate-spin" />
                </div>
              </div>
              <div className="text-center">
                <p className="font-semibold text-foreground" data-testid="text-processing">
                  Analyzing note…
                </p>
                <p className="text-sm text-muted-foreground mt-1">
                  AI is extracting invoice data
                </p>
              </div>
              {/* Progress shimmer */}
              <div className="w-48 h-1 rounded-full overflow-hidden bg-muted">
                <div className="h-full bg-primary/60 rounded-full animate-[shimmer_1.4s_ease-in-out_infinite]" style={{width:"60%"}} />
              </div>
            </div>
          ) : preview ? (
            <div className="flex flex-col items-center gap-3 animate-scale-in">
              <img
                src={preview}
                alt="Preview"
                className="max-h-44 rounded-lg object-contain shadow-md"
                data-testid="img-preview"
              />
              <p className="text-xs text-muted-foreground">Click or drop another image to replace</p>
            </div>
          ) : (
            <div className="flex flex-col items-center gap-3 animate-fade-in">
              <div className="w-14 h-14 rounded-xl bg-muted flex items-center justify-center transition-transform group-hover:scale-105 group-hover:bg-primary/10">
                <Upload className="w-6 h-6 text-muted-foreground group-hover:text-primary transition-colors" />
              </div>
              <div className="text-center">
                <p className="font-semibold text-foreground">
                  Drop your handwritten note here
                </p>
                <p className="text-sm text-muted-foreground mt-1">or click to browse files</p>
              </div>
              <div className="flex items-center gap-1.5 mt-1 text-xs text-muted-foreground/70">
                <Image className="w-3 h-3" />
                <span>JPG · PNG · WEBP · up to 10 MB</span>
              </div>
            </div>
          )}

          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            className="hidden"
            onChange={handleFileChange}
            data-testid="input-file-upload"
          />
        </div>
      </div>

      {/* Camera button */}
      <div className="flex items-center gap-3 animate-slide-up delay-150">
        <Button
          variant="outline"
          onClick={() => cameraInputRef.current?.click()}
          disabled={isLoading}
          className="gap-2 transition-all hover:shadow-sm"
          data-testid="button-camera"
        >
          <Camera className="w-4 h-4" />
          Take Photo
        </Button>
        <input
          ref={cameraInputRef}
          type="file"
          accept="image/*"
          capture="environment"
          className="hidden"
          onChange={handleFileChange}
        />
      </div>

      {/* How it works */}
      <Card className="w-full p-6 animate-slide-up delay-200">
        <p className="text-xs font-label uppercase tracking-widest text-muted-foreground mb-5">
          How it works
        </p>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
          {[
            { step: "01", title: "Upload", desc: "Photo of any handwritten invoice note" },
            { step: "02", title: "Extract", desc: "AI reads model numbers, rates & grand total" },
            { step: "03", title: "Export", desc: "Download a clean, professional PDF invoice" },
          ].map((item, i) => (
            <div key={item.step} className="flex items-start gap-4">
              <div className="flex-shrink-0 w-8 h-8 rounded-lg bg-primary text-primary-foreground flex items-center justify-center">
                <span className="text-[10px] font-bold font-label tracking-wider">{item.step}</span>
              </div>
              <div>
                <p className="text-sm font-semibold text-foreground">{item.title}</p>
                <p className="text-xs text-muted-foreground mt-0.5 leading-relaxed">{item.desc}</p>
              </div>
            </div>
          ))}
        </div>
      </Card>
    </div>
  );
}
