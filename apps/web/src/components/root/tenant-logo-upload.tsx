"use client";

import { Button, cn } from "@jubely/ui";
import { Camera, Loader2, Trash2, Upload } from "lucide-react";
import { useCallback, useEffect, useId, useMemo, useRef, useState } from "react";
import { LOGO_ACCEPT, validateTenantLogoFile } from "@/lib/tenantLogo";
import { TenantLogo } from "./tenant-logo";

type TenantLogoUploadProps = {
  name: string;
  currentUrl?: string | null;
  file: File | null;
  onFileChange: (file: File | null) => void;
  onSave?: () => void;
  onRemove?: () => void;
  saving?: boolean;
  removing?: boolean;
  disabled?: boolean;
  className?: string;
};

export function TenantLogoUpload({
  name,
  currentUrl,
  file,
  onFileChange,
  onSave,
  onRemove,
  saving = false,
  removing = false,
  disabled = false,
  className,
}: TenantLogoUploadProps) {
  const inputId = useId();
  const inputRef = useRef<HTMLInputElement>(null);
  const [dragOver, setDragOver] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const previewUrl = useMemo(() => (file ? URL.createObjectURL(file) : null), [file]);

  useEffect(() => {
    if (!previewUrl) return;
    return () => URL.revokeObjectURL(previewUrl);
  }, [previewUrl]);

  const displayUrl = previewUrl ?? currentUrl ?? null;
  const busy = saving || removing;
  const hasPending = Boolean(file);
  const canRemove = Boolean(onRemove && currentUrl && !file);

  const pickFile = useCallback(
    (next: File | null) => {
      if (!next) {
        onFileChange(null);
        setError(null);
        return;
      }
      const validation = validateTenantLogoFile(next);
      if (validation) {
        setError(validation);
        onFileChange(null);
        return;
      }
      setError(null);
      onFileChange(next);
    },
    [onFileChange],
  );

  const onInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    pickFile(e.target.files?.[0] ?? null);
    e.target.value = "";
  };

  const onDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(false);
    if (disabled || busy) return;
    pickFile(e.dataTransfer.files?.[0] ?? null);
  };

  return (
    <div className={cn("flex flex-col gap-3 sm:flex-row sm:items-start", className)}>
      <button
        type="button"
        disabled={disabled || busy}
        onClick={() => inputRef.current?.click()}
        onDragOver={(e) => {
          e.preventDefault();
          if (!disabled && !busy) setDragOver(true);
        }}
        onDragLeave={() => setDragOver(false)}
        onDrop={onDrop}
        className={cn(
          "group relative mx-auto shrink-0 rounded-2xl outline-none transition focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background sm:mx-0",
          dragOver && "ring-2 ring-primary ring-offset-2 ring-offset-background",
          (disabled || busy) && "cursor-not-allowed opacity-60",
        )}
        aria-label="Changer le logo"
      >
        <TenantLogo
          tenant={{ name, logo_url: displayUrl ?? undefined }}
          size="xl"
          className={cn("shadow-sm transition group-hover:brightness-95", !displayUrl && "border-dashed")}
        />
        <span className="absolute inset-0 flex flex-col items-center justify-center gap-1 rounded-2xl bg-background/75 opacity-0 transition group-hover:opacity-100 group-focus-visible:opacity-100">
          <Camera className="h-6 w-6 text-foreground" aria-hidden />
          <span className="text-xs font-medium text-foreground">Modifier</span>
        </span>
        {busy ? (
          <span className="absolute inset-0 flex items-center justify-center rounded-2xl bg-background/80">
            <Loader2 className="h-7 w-7 animate-spin text-muted-foreground" aria-hidden />
          </span>
        ) : null}
      </button>

      <input
        ref={inputRef}
        id={inputId}
        type="file"
        accept={LOGO_ACCEPT}
        className="sr-only"
        disabled={disabled || busy}
        onChange={onInputChange}
      />

      <div className="min-w-0 flex-1 space-y-2 text-center sm:text-left">
        <div>
          <p className="text-sm font-medium">Logo de l&apos;enseigne</p>
          <p className="text-xs text-muted-foreground">
            PNG, JPEG, WebP ou SVG · max 2 Mo. Glissez une image ou cliquez sur l&apos;aperçu.
          </p>
        </div>
        {error ? <p className="text-xs text-destructive">{error}</p> : null}
        {hasPending ? (
          <p className="text-xs text-muted-foreground">
            Nouveau fichier : <span className="font-mono">{file?.name}</span>
            {file ? ` (${Math.round(file.size / 1024)} Ko)` : null}
          </p>
        ) : currentUrl ? (
          <p className="text-xs text-muted-foreground">Logo enregistré sur le tenant.</p>
        ) : (
          <p className="text-xs text-muted-foreground">Aucun logo — les initiales s&apos;affichent à la place.</p>
        )}
        <div className="flex flex-wrap justify-center gap-2 sm:justify-start">
          <Button type="button" variant="outline" size="sm" className="gap-1.5" disabled={disabled || busy} onClick={() => inputRef.current?.click()}>
            <Upload size={14} aria-hidden />
            {hasPending ? "Changer" : "Importer"}
          </Button>
          {hasPending && onSave ? (
            <Button type="button" size="sm" disabled={disabled || busy} onClick={onSave}>
              {saving ? <Loader2 className="animate-spin" size={14} aria-hidden /> : null}
              Enregistrer le logo
            </Button>
          ) : null}
          {hasPending ? (
            <Button type="button" variant="ghost" size="sm" disabled={disabled || busy} onClick={() => pickFile(null)}>
              Annuler
            </Button>
          ) : null}
          {canRemove ? (
            <Button type="button" variant="ghost" size="sm" className="gap-1.5 text-destructive hover:text-destructive" disabled={disabled || busy} onClick={onRemove}>
              {removing ? <Loader2 className="animate-spin" size={14} aria-hidden /> : <Trash2 size={14} aria-hidden />}
              Retirer
            </Button>
          ) : null}
        </div>
      </div>
    </div>
  );
}
