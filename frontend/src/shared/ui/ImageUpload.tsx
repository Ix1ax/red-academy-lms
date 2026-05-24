import { useRef, useState } from 'react';
import { ImageIcon, Loader2, X } from 'lucide-react';
import { apiUrl } from '@/shared/api/config';
import { getAccessToken } from '@/shared/auth/session';

interface ImageUploadProps {
  value?: string; // current URL
  onChange: (url: string | null) => void;
  label?: string;
  className?: string;
}

export function ImageUpload({ value, onChange, label = 'Обложка', className = '' }: ImageUploadProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleFile(file: File) {
    if (!file.type.startsWith('image/')) {
      setError('Допускаются только изображения');
      return;
    }
    if (file.size > 10 * 1024 * 1024) {
      setError('Размер файла не должен превышать 10 МБ');
      return;
    }
    setError(null);
    setUploading(true);
    try {
      const form = new FormData();
      form.append('file', file);
      form.append('accessLevel', 'PUBLIC');
      const token = getAccessToken();
      const res = await fetch(`${apiUrl}/api/files`, {
        method: 'POST',
        body: form,
        headers: token ? { Authorization: `Bearer ${token}` } : {},
      });
      if (!res.ok) throw new Error('Ошибка загрузки');
      const dto: { id: string } = await res.json();
      onChange(`${apiUrl}/api/files/${dto.id}/content`);
    } catch {
      setError('Не удалось загрузить изображение');
    } finally {
      setUploading(false);
    }
  }

  function handleDrop(e: React.DragEvent) {
    e.preventDefault();
    const file = e.dataTransfer.files[0];
    if (file) handleFile(file);
  }

  function handleChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (file) handleFile(file);
  }

  return (
    <div className={`space-y-1 ${className}`}>
      <label className="block text-sm font-medium text-gray-700">{label}</label>
      <div
        onDragOver={(e) => e.preventDefault()}
        onDrop={handleDrop}
        onClick={() => !uploading && inputRef.current?.click()}
        className={`relative flex flex-col items-center justify-center rounded-xl border-2 border-dashed
          cursor-pointer transition-colors
          ${value ? 'border-transparent' : 'border-gray-300 hover:border-primary bg-gray-50 hover:bg-primary-light/30'}
          ${uploading ? 'opacity-60 pointer-events-none' : ''}
        `}
        style={{ minHeight: 160 }}
      >
        {value ? (
          <>
            <img
              src={value}
              alt="cover preview"
              className="w-full h-40 object-cover rounded-xl"
            />
            <button
              type="button"
              onClick={(e) => { e.stopPropagation(); onChange(null); }}
              className="absolute top-2 right-2 bg-black/50 hover:bg-black/70 text-white rounded-full p-1 transition-colors"
            >
              <X size={14} />
            </button>
          </>
        ) : uploading ? (
          <div className="flex flex-col items-center gap-2 py-8 text-gray-500">
            <Loader2 size={28} className="animate-spin text-primary" />
            <span className="text-sm">Загрузка…</span>
          </div>
        ) : (
          <div className="flex flex-col items-center gap-2 py-8 text-gray-400">
            <ImageIcon size={28} />
            <span className="text-sm font-medium text-gray-600">Перетащите или выберите изображение</span>
            <span className="text-xs text-gray-400">PNG, JPG, WEBP · до 10 МБ</span>
          </div>
        )}
      </div>
      <input
        ref={inputRef}
        type="file"
        accept="image/*"
        className="hidden"
        onChange={handleChange}
      />
      {error && <p className="text-xs text-red-600">{error}</p>}
    </div>
  );
}
