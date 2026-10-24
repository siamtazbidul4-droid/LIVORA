import React, { useRef, useState } from 'react';
import { api, ApiError } from '../../services/api';
import { ImagePlus, LoaderCircle, Trash2, Upload } from 'lucide-react';

interface UploadedAsset {
  asset: { url: string };
}

interface AdminImageUploaderProps {
  label: string;
  value: string;
  onChange: (url: string) => void;
  onRemove?: () => void;
}

const MAX_IMAGE_SIZE = 5 * 1024 * 1024;
const ALLOWED_IMAGE_TYPES = new Set(['image/jpeg', 'image/png', 'image/webp']);

export const AdminImageUploader: React.FC<AdminImageUploaderProps> = ({
  label,
  value,
  onChange,
  onRemove,
}) => {
  const fileInput = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const uploadFile = async (file?: File) => {
    if (!file) return;
    setError(null);
    if (!ALLOWED_IMAGE_TYPES.has(file.type)) {
      setError('Choose a JPEG, PNG, or WebP image.');
      return;
    }
    if (file.size > MAX_IMAGE_SIZE) {
      setError('Image must be 5 MB or smaller.');
      return;
    }

    const body = new FormData();
    body.append('file', file);
    setUploading(true);
    try {
      const result = await api.post<UploadedAsset>('/admin/media', body);
      onChange(result.asset.url);
    } catch (uploadError: unknown) {
      setError(
        uploadError instanceof ApiError
          ? uploadError.message
          : 'Image upload failed. Check your connection and try again.'
      );
    } finally {
      setUploading(false);
      if (fileInput.current) fileInput.current.value = '';
    }
  };

  return (
    <div className="space-y-2">
      <span className="block text-xs font-medium text-stone-700">{label}</span>
      <div
        onDragOver={(event) => event.preventDefault()}
        onDrop={(event) => {
          event.preventDefault();
          void uploadFile(event.dataTransfer.files[0]);
        }}
        className="flex flex-col sm:flex-row sm:items-center gap-3 rounded-xl border border-dashed border-stone-300 bg-stone-50/70 p-3"
      >
        {value ? (
          <img
            src={value}
            alt={`${label} preview`}
            className="h-20 w-28 rounded-lg border border-stone-200 bg-white object-cover"
          />
        ) : (
          <div className="flex h-20 w-28 items-center justify-center rounded-lg border border-stone-200 bg-white text-stone-400">
            <ImagePlus className="h-6 w-6" aria-hidden="true" />
          </div>
        )}
        <div className="flex flex-wrap items-center gap-2">
          <input
            ref={fileInput}
            type="file"
            accept="image/jpeg,image/png,image/webp"
            className="sr-only"
            aria-label={`Choose ${label.toLowerCase()}`}
            onChange={(event) => void uploadFile(event.currentTarget.files?.[0])}
          />
          <button
            type="button"
            onClick={() => fileInput.current?.click()}
            disabled={uploading}
            className="inline-flex min-h-10 items-center gap-2 rounded-lg bg-[#133E32] px-3 py-2 text-xs font-semibold text-white hover:bg-[#0d2e24] disabled:cursor-wait disabled:opacity-60"
          >
            {uploading ? (
              <LoaderCircle className="h-4 w-4 animate-spin" aria-hidden="true" />
            ) : (
              <Upload className="h-4 w-4" aria-hidden="true" />
            )}
            {uploading ? 'Uploading…' : value ? 'Replace image' : 'Choose image'}
          </button>
          {value || onRemove ? (
            <button
              type="button"
              onClick={() => {
                setError(null);
                if (onRemove) onRemove();
                else onChange('');
              }}
              disabled={uploading}
              className="inline-flex min-h-10 items-center gap-2 rounded-lg border border-stone-300 bg-white px-3 py-2 text-xs font-semibold text-stone-700 hover:bg-stone-100 disabled:opacity-60"
            >
              <Trash2 className="h-4 w-4" aria-hidden="true" />
              Remove
            </button>
          ) : null}
          <span className="text-[11px] text-stone-500">Drop a JPEG, PNG, or WebP (max 5 MB)</span>
        </div>
      </div>
      {error && <p role="alert" className="text-xs font-medium text-rose-700">{error}</p>}
      <p aria-live="polite" className="sr-only">{uploading ? 'Uploading image' : ''}</p>
    </div>
  );
};
