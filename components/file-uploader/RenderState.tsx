import { cn } from "@/lib/utils";
import { CloudUploadIcon, ImageIcon, Loader2, XIcon } from "lucide-react";
import { Button } from "../ui/button";
import Image from "next/image";
import { useState } from "react";

export function RenderEmptyState({ isDragActive }: { isDragActive: boolean }) {
  return (
    <div className="text-center">
      <div className="flex items-center mx-auto justify-center size-12 rounded-full bg-muted mb-4">
        <CloudUploadIcon
          className={cn(
            "size-6 text-muted-foreground",
            isDragActive && "text-primary",
          )}
        />
      </div>
      <p className="text-base font-semibold text-foreground">
        Drop your files here or{" "}
        <span className="text-primary font-bold cursor-pointer">
          click to upload
        </span>
      </p>
      <Button type="button" className="mt-4">
        Select File
      </Button>
    </div>
  );
}

export function RenderErrorState({ onRetry }: { onRetry: () => void }) {
  return (
    <div className=" text-center">
      <div className="flex items-center mx-auto justify-center size-12 rounded-full bg-destructive/30 mb-4">
        <ImageIcon className={cn("size-6 text-destructive")} />
      </div>

      <p className="text-base font-semibold">Upload Failed</p>
      <p className="text-xs mt-1 text-muted-foreground">Something went wrong</p>
      <Button className="mt-4" type="button" onClick={onRetry}>
        Retry File Selection
      </Button>
    </div>
  );
}

export function RenderUploadedState({
  previewUrl,
  isDeleting,
  handleRemoveFile,
  fileType,
}: {
  previewUrl: string;
  isDeleting: boolean;
  handleRemoveFile: () => void;
  fileType: "image" | "video";
}) {
  const [imageError, setImageError] = useState(false);

  return (
    <div className="relative w-full max-w-2xl border-2 border-gray-300 rounded-lg overflow-hidden">
      <div className="relative w-full h-[400px] bg-gray-100 flex items-center justify-center">
        {fileType === "video" ? (
          <video
            src={previewUrl}
            controls
            className="w-full h-full object-contain"
          />
        ) : imageError ? (
          <div className="flex flex-col items-center justify-center gap-4">
            <ImageIcon className="w-16 h-16 text-muted-foreground" />
            <p className="text-sm text-muted-foreground">
              Image preview unavailable
            </p>
            <p className="text-xs text-muted-foreground font-mono">
              {previewUrl}
            </p>
          </div>
        ) : (
          <Image
            src={previewUrl}
            alt="Uploaded File"
            fill
            className="object-contain"
            sizes="896px"
            priority={false}
            unoptimized={true}
            onError={() => {
              setImageError(true);
            }}
          />
        )}
      </div>
      <div className="absolute top-2 right-2">
        <Button
          variant="destructive"
          size="icon"
          className="rounded-full shadow-lg"
          onClick={handleRemoveFile}
          disabled={isDeleting}
        >
          {isDeleting ? (
            <Loader2 className="size-4 animate-spin" />
          ) : (
            <XIcon className="size-4" />
          )}
        </Button>
      </div>
    </div>
  );
}

export function RenderUploadingState({
  progress,
  fileName,
}: {
  progress: number;
  fileName?: string;
}) {
  return (
    <div className="text-center flex justify-center items-center flex-col">
      <p>{progress}</p>

      <p className="mt-2 text-sm font-medium text-foreground">Uploading...</p>

      {fileName && (
        <p className="mt-1 text-xs text-muted-foreground truncate max-w-xs">
          {fileName}
        </p>
      )}
    </div>
  );
}
