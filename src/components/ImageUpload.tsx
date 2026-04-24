import React, { useRef, useState } from 'react';
import { Upload, X, Image as ImageIcon } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useTranslation } from 'react-i18next';
import { toast } from 'sonner';

interface ImageUploadProps {
  label: string;
  value?: File | string | null;
  onChange: (file: File | null) => void;
  error?: string;
  isLoading?: boolean;
  variant?: 'mandarin' | 'akb';
}

const STYLES = `
  @keyframes drag-bounce { 0%{transform:scale(1)} 50%{transform:scale(0.97)} 100%{transform:scale(1)} }
  @keyframes upload-float {
    0%,100% { transform: translateY(0); }
    50%      { transform: translateY(-5px); }
  }
  .drag-active  { animation: drag-bounce .3s ease; }
  .upload-icon  { animation: upload-float 2.5s ease-in-out infinite; }
`;

export default function ImageUpload({
  label,
  value,
  onChange,
  error,
  isLoading = false,
  variant = 'mandarin',
}: ImageUploadProps) {
  const { t } = useTranslation();
  const [preview, setPreview] = useState<string | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const isAkb = variant === 'akb';

  React.useEffect(() => {
    if (typeof value === 'string') setPreview(value);
  }, [value]);

  const handleFileChange = (file: File | null) => {
    if (!file) return;

    const allowedTypes = ["image/jpeg", "image/png", "image/jpg", "image/webp", "image/heic", "image/heif"];
    const fileExtension = file.name.split('.').pop()?.toLowerCase();
    const allowedExtensions = ['jpeg', 'jpg', 'png', 'webp', 'heic', 'heif'];

    if (!allowedTypes.includes(file.type) && !allowedExtensions.includes(fileExtension || '')) {
      toast.error(t('form.messages.invalidFileType'));
      if (fileInputRef.current) fileInputRef.current.value = '';
      return;
    }

    if (file.size > 10 * 1024 * 1024) {
      toast.error(t('form.messages.fileTooLarge'));
      if (fileInputRef.current) fileInputRef.current.value = '';
      return;
    }

    onChange(file);
    const reader = new FileReader();
    reader.onloadend = () => setPreview(reader.result as string);
    reader.readAsDataURL(file);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    handleFileChange(e.dataTransfer.files[0]);
  };
  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };
  const handleDragLeave = () => setIsDragging(false);
  const handleRemove = () => {
    onChange(null);
    setPreview(null);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  return (
    <>
      <style>{STYLES}</style>
      <div className="space-y-2">
        <label className={[
          'flex items-center gap-1.5 text-sm font-semibold',
          isAkb ? 'text-[#0b2b53] dark:text-[#B8C4D9]' : 'text-gray-700 dark:text-gray-200',
        ].join(' ')}>
          <ImageIcon className={[
            'h-3.5 w-3.5',
            isAkb ? 'text-[#0b84e5] dark:text-[#8FA0BC]' : 'text-orange-500',
          ].join(' ')} />
          {label}
        </label>

        {isLoading ? (
          <div className={[
            'relative h-[180px] overflow-hidden border-2 border-dashed',
            isAkb
              ? 'rounded-lg border-[#cfe0f1] bg-white dark:border-[#2B4166] dark:bg-[#111A2E]'
              : 'rounded-2xl border-gray-200 bg-gray-50 dark:border-white/10 dark:bg-white/5',
          ].join(' ')}>
            <div
              className={[
                'absolute inset-0 bg-gradient-to-r from-transparent to-transparent',
                isAkb ? 'via-[#eef7ff] dark:via-[#16233D]' : 'via-orange-100/50 dark:via-orange-500/8',
              ].join(' ')}
              style={{ animation: 'shimmer 1.5s ease-in-out infinite' }}
            />
            <div className="absolute inset-0 flex items-center justify-center">
              <div className={[
                'h-10 w-10 animate-spin rounded-full border-4',
                isAkb ? 'border-[#cfe0f1] border-t-[#0b4edb] dark:border-[#2B4166] dark:border-t-[#39C6FF]' : 'border-orange-200 border-t-orange-500',
              ].join(' ')} />
            </div>
          </div>
        ) : !preview ? (
          <div
            onClick={() => fileInputRef.current?.click()}
            onDrop={handleDrop}
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            className={[
              'group relative flex min-h-[180px] cursor-pointer flex-col items-center justify-center gap-4 border-2 border-dashed p-6 transition-all duration-300 ease-in-out',
              isAkb ? 'rounded-lg' : 'rounded-2xl',
              isDragging && !isAkb
                ? 'drag-active border-orange-500 bg-orange-50 shadow-lg shadow-orange-500/20 dark:bg-orange-500/10'
                : '',
              !isDragging && !isAkb
                ? 'border-gray-200 hover:border-orange-400 hover:bg-orange-50/40 dark:border-white/10 dark:hover:border-orange-500/40 dark:hover:bg-orange-500/5'
                : '',
              isDragging && isAkb
                ? 'drag-active border-[#0b84e5] bg-[#eef7ff] shadow-[0_8px_22px_rgba(11,78,219,0.12)] dark:border-[#39C6FF] dark:bg-[#16233D] dark:shadow-[0_12px_24px_rgba(2,10,20,0.22)]'
                : '',
              !isDragging && isAkb
                ? 'border-[#cfe0f1] bg-white hover:border-[#0b84e5] hover:bg-[#f8fbfe] dark:border-[#2B4166] dark:bg-[#111A2E] dark:hover:border-[#39C6FF] dark:hover:bg-[#16233D]'
                : '',
              error ? (isAkb ? 'border-red-400' : 'border-red-400 dark:border-red-500/40') : '',
            ].join(' ')}
          >
            {isDragging && (
              <div className={[
                'pointer-events-none absolute inset-0',
                isAkb ? 'rounded-lg bg-[#0b84e5]/10 dark:bg-[#39C6FF]/10' : 'rounded-2xl bg-gradient-to-br from-orange-500/10 to-amber-500/10',
              ].join(' ')} />
            )}

            <div className={[
              'p-4 transition-all duration-300',
              isAkb ? 'rounded-lg' : 'rounded-2xl',
              isDragging && !isAkb
                ? 'scale-110 bg-gradient-to-br from-orange-500 to-amber-500 shadow-xl shadow-orange-500/40'
                : '',
              !isDragging && !isAkb
                ? 'bg-orange-100 group-hover:bg-orange-200 dark:bg-orange-500/15 dark:group-hover:bg-orange-500/25'
                : '',
              isDragging && isAkb
                ? 'scale-105 bg-[#0b4edb] shadow-[0_8px_18px_rgba(11,78,219,0.22)] dark:bg-[#2F6BFF] dark:shadow-[0_10px_22px_rgba(2,10,20,0.24)]'
                : '',
              !isDragging && isAkb
                ? 'bg-[#eef7ff] group-hover:bg-[#e2f2ff] dark:bg-[#16233D] dark:group-hover:bg-[#1B2A47]'
                : '',
            ].join(' ')}>
              <Upload className={[
                'h-7 w-7 transition-colors duration-300',
                isDragging ? 'text-white upload-icon' : isAkb ? 'text-[#0b4edb] dark:text-[#B8C4D9]' : 'text-orange-500',
              ].join(' ')} />
            </div>

            <div className="text-center">
              <p className={[
                'text-sm font-semibold transition-colors duration-200',
                isAkb
                  ? 'text-[#0b2b53] group-hover:text-[#0b4edb] dark:text-[#F3F7FF] dark:group-hover:text-[#F3F7FF]'
                  : 'text-gray-600 group-hover:text-orange-600 dark:text-gray-300 dark:group-hover:text-orange-400',
              ].join(' ')}>
                {t('form.dragDropImage')}
              </p>
              <p className={[
                'mt-1 font-mono text-xs',
                isAkb ? 'text-[#63758a] dark:text-[#8FA0BC]' : 'text-gray-400 dark:text-gray-500',
              ].join(' ')}>
                {t('form.supportedFormats')}
              </p>
            </div>

            <input
              ref={fileInputRef}
              type="file"
              accept="image/jpeg, image/png, image/webp, .heic, .heif"
              onChange={(e) => handleFileChange(e.target.files?.[0] || null)}
              className="hidden"
            />
          </div>
        ) : (
          <div className={[
            'group relative h-[180px] overflow-hidden border-2 transition-all duration-300',
            isAkb
              ? 'rounded-lg border-[#cfe0f1] shadow-[0_8px_22px_rgba(15,47,87,0.06)] hover:border-[#0b84e5] dark:border-[#2B4166] dark:shadow-[0_14px_28px_rgba(2,10,20,0.22)] dark:hover:border-[#39C6FF]'
              : 'rounded-2xl border-orange-200 shadow-md hover:border-orange-400 hover:shadow-xl hover:shadow-orange-500/15 dark:border-orange-500/30 dark:hover:border-orange-500/60',
          ].join(' ')}>
            <img src={preview} alt={label} className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105" />

            <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-black/10 to-transparent opacity-0 transition-opacity duration-300 group-hover:opacity-100" />

            <div className="absolute inset-0 flex items-center justify-center opacity-0 transition-all duration-300 group-hover:opacity-100">
              <Button
                type="button"
                onClick={handleRemove}
                variant="destructive"
                size="icon"
                className={[
                  'scale-75 shadow-xl transition-transform duration-300 group-hover:scale-100',
                  isAkb ? 'rounded-lg' : 'rounded-xl',
                ].join(' ')}
              >
                <X className="h-5 w-5" />
              </Button>
            </div>

            <div className={[
              'absolute right-2 top-2 flex translate-y-1 items-center gap-1 px-2.5 py-1 text-xs font-bold text-white opacity-0 shadow-lg transition-all duration-300 group-hover:translate-y-0 group-hover:opacity-100',
              isAkb ? 'rounded-lg bg-[#0b4edb] dark:bg-[#2F6BFF]' : 'rounded-full bg-green-500',
            ].join(' ')}>
              <span>{isAkb ? 'OK' : '\u2713'}</span>
            </div>
          </div>
        )}
      </div>
    </>
  );
}
