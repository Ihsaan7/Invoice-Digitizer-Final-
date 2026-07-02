import { useState, useRef, useCallback } from "react";
import { Upload, Camera, Image, Loader2, FileImage } from "lucide-react";
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
    <div className="flex flex-col items-center gap-8">
      <div className="text-center space-y-3 max-w-lg">
        <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-primary/10 mb-2">
          <FileImage className="w-8 h-8 text-primary" />
        </div>
        <h2 className="text-2xl font-semibold" data-testid="text-upload-title">
          Upload Invoice Note
        </h2>
        <p className="text-muted-foreground text-sm leading-relaxed">
          Take a photo or upload an image of a handwritten note. The AI will extract model numbers and rates automatically — the last number in your note is treated as the grand total.
        </p>
      </div>

      <Card
        className={`w-full max-w-xl p-0 transition-colors ${
          dragOver ? "border-primary bg-primary/5" : ""
        }`}
      >
        <div
          className="relative flex flex-col items-center justify-center gap-4 p-10 cursor-pointer min-h-[280px]"
          onDrop={handleDrop}
          onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
          onDragLeave={() => setDragOver(false)}
          onClick={() => fileInputRef.current?.click()}
          data-testid="dropzone-upload"
        >
          {isLoading ? (
            <div className="flex flex-col items-center gap-4">
              <div className="relative">
                <div className="w-20 h-20 rounded-full border-4 border-muted animate-pulse" />
                <Loader2 className="w-10 h-10 text-primary absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 animate-spin" />
              </div>
              <div className="text-center">
                <p className="font-medium" data-testid="text-processing">Processing image...</p>
                <p className="text-sm text-muted-foreground mt-1">AI is extracting invoice data</p>
              </div>
            </div>
          ) : preview ? (
            <div className="flex flex-col items-center gap-3">
              <img
                src={preview}
                alt="Preview"
                className="max-h-48 rounded-md object-contain"
                data-testid="img-preview"
              />
              <p className="text-sm text-muted-foreground">Click or drop another image to replace</p>
            </div>
          ) : (
            <div className="flex flex-col items-center gap-3">
              <div className="w-16 h-16 rounded-full bg-muted flex items-center justify-center">
                <Upload className="w-7 h-7 text-muted-foreground" />
              </div>
              <div className="text-center">
                <p className="font-medium">Drop your handwritten note here</p>
                <p className="text-sm text-muted-foreground mt-1">or click to browse files</p>
              </div>
              <div className="flex items-center gap-2 mt-2 text-xs text-muted-foreground">
                <Image className="w-3.5 h-3.5" />
                <span>JPG, PNG, WEBP supported</span>
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
      </Card>

      <div className="flex items-center gap-3">
        <Button
          variant="secondary"
          onClick={() => cameraInputRef.current?.click()}
          disabled={isLoading}
          data-testid="button-camera"
        >
          <Camera className="w-4 h-4 mr-2" />
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

      <Card className="w-full max-w-xl p-5">
        <h3 className="text-sm font-medium mb-3">How it works</h3>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          {[
            { step: "1", title: "Upload", desc: "Photo of handwritten invoice note" },
            { step: "2", title: "Extract", desc: "AI reads models, rates & total" },
            { step: "3", title: "Invoice", desc: "Download a professional PDF" },
          ].map((item) => (
            <div key={item.step} className="flex items-start gap-3">
              <div className="flex-shrink-0 w-7 h-7 rounded-full bg-primary/10 text-primary flex items-center justify-center text-xs font-semibold">
                {item.step}
              </div>
              <div>
                <p className="text-sm font-medium">{item.title}</p>
                <p className="text-xs text-muted-foreground">{item.desc}</p>
              </div>
            </div>
          ))}
        </div>
      </Card>
    </div>
  );
}
