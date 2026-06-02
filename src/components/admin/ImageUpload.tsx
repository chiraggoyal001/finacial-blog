import { useState, useRef, useCallback } from "react";
import { Upload, Trash2, Loader2, Image as ImageIcon, Link as LinkIcon, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { uploadContentImage } from "@/lib/storage";

interface ImageUploadProps {
  value: string;
  onChange: (url: string) => void;
  label: string;
  placeholder?: string;
  folder?: string;
}

export function ImageUpload({
  value,
  onChange,
  label,
  placeholder = "https://...",
  folder = "general",
}: ImageUploadProps) {
  const [isUploading, setIsUploading] = useState(false);
  const [isDragging, setIsDragging] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleUpload = useCallback(
    async (file: File) => {
      setIsUploading(true);
      try {
        const publicUrl = await uploadContentImage(file, folder);
        onChange(publicUrl);
        toast.success("Image uploaded and optimized successfully!");
      } catch (error: any) {
        toast.error(error.message || "Failed to upload image");
        console.error("Image upload error:", error);
      } finally {
        setIsUploading(false);
      }
    },
    [onChange, folder]
  );

  const handleFileInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      handleUpload(file);
    }
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = () => {
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    const file = e.dataTransfer.files?.[0];
    if (file && file.type.startsWith("image/")) {
      handleUpload(file);
    } else {
      toast.error("Please drop an image file");
    }
  };

  const triggerFileInput = () => {
    fileInputRef.current?.click();
  };

  const handleRemove = () => {
    onChange("");
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <Label className="font-semibold text-sm">{label}</Label>
        {value && (
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={handleRemove}
            className="text-red-500 hover:text-red-700 hover:bg-red-50 dark:hover:bg-red-950/20 h-8 px-2"
          >
            <Trash2 className="h-4 w-4 mr-1.5" />
            Remove
          </Button>
        )}
      </div>

      {/* Upload Zone & Preview */}
      <div
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        className={`relative border-2 border-dashed rounded-lg overflow-hidden transition-all duration-200 min-h-[200px] flex flex-col items-center justify-center bg-muted/30 ${
          isDragging
            ? "border-primary bg-primary/5 ring-2 ring-primary/20"
            : "border-muted-foreground/20 hover:border-muted-foreground/45"
        } ${isUploading ? "pointer-events-none opacity-80" : ""}`}
      >
        {value ? (
          // Preview state
          <div className="relative w-full aspect-video flex items-center justify-center bg-black/5 dark:bg-black/20">
            <img
              src={value}
              alt={label}
              className="max-h-[260px] w-full object-contain"
            />
            {/* Quick change overlay */}
            <div className="absolute inset-0 bg-black/40 opacity-0 hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
              <Button
                type="button"
                variant="secondary"
                size="sm"
                onClick={triggerFileInput}
              >
                <Upload className="h-4 w-4 mr-1.5" />
                Change Image
              </Button>
            </div>
          </div>
        ) : (
          // Empty / Upload prompt state
          <div
            onClick={triggerFileInput}
            className="p-6 text-center cursor-pointer w-full flex flex-col items-center justify-center space-y-2 select-none"
          >
            <div className="h-10 w-10 rounded-full bg-background flex items-center justify-center shadow-sm border border-muted-foreground/10 text-muted-foreground">
              <Upload className="h-5 w-5" />
            </div>
            <div>
              <p className="text-sm font-medium">Click to upload or drag & drop</p>
              <p className="text-xs text-muted-foreground mt-1">
                PNG, JPG, WebP or GIF up to 5MB (auto-optimized to WebP)
              </p>
            </div>
          </div>
        )}

        {/* Loading Spinner */}
        {isUploading && (
          <div className="absolute inset-0 bg-background/60 backdrop-blur-[1px] flex flex-col items-center justify-center space-y-2">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
            <p className="text-xs font-medium text-muted-foreground">
              Uploading and compressing...
            </p>
          </div>
        )}
      </div>

      {/* Hidden File Input */}
      <input
        type="file"
        ref={fileInputRef}
        onChange={handleFileInputChange}
        accept="image/jpeg,image/png,image/webp,image/gif"
        className="hidden"
      />

      {/* Fallback Text Input (for pasting external URLs) */}
      <div className="flex gap-2 items-center pt-1">
        <div className="relative flex-1">
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-muted-foreground">
            <LinkIcon className="h-3.5 w-3.5" />
          </div>
          <Input
            type="text"
            value={value}
            onChange={(e) => onChange(e.target.value)}
            placeholder={placeholder}
            className="pl-9 text-xs h-8 text-muted-foreground"
          />
        </div>
      </div>
    </div>
  );
}
