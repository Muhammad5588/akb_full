import { useState, useEffect, useCallback, memo } from 'react';
import { useTranslation } from 'react-i18next';
import { createPortal } from 'react-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
    X, Copy, Check, MapPin, Loader2, Download,
    ZoomIn, 
    // Phone, 
    AlertTriangle, RefreshCw,
} from 'lucide-react';
import { toast } from 'sonner';
import { apiClient } from '@/api/client';

// --- Types ---
interface ChinaAddressData {
    client_code: string;
    phone: string;
    region: string;
    address_line: string;
    full_address_string: string;
    warning_text: string;
    images: string[];
}

interface ChinaAddressModalProps {
    isOpen: boolean;
    onClose: () => void;
}

// --- Image tab labels (keyed by filename substring) ---
const IMAGE_TAB_LABELS: Record<string, string> = {
    pindoudou: 'Pinduoduo',
    taobao: 'Taobao',
};

function getTabLabel(url: string, index: number): string {
    const lower = url.toLowerCase();
    for (const [key, label] of Object.entries(IMAGE_TAB_LABELS)) {
        if (lower.includes(key)) return label;
    }
    return `${index + 1}`;
}

const ChinaAddressModal = ({ isOpen, onClose }: ChinaAddressModalProps) => {
    const { t } = useTranslation();
    const [data, setData] = useState<ChinaAddressData | null>(null);
    const [error, setError] = useState<string | null>(null);
    const [imageLoaded, setImageLoaded] = useState<Record<number, boolean>>({});
    const [copied, setCopied] = useState(false);
    const [previewOpen, setPreviewOpen] = useState(false);
    const [activeTab, setActiveTab] = useState(0);
    const [previewIndex, setPreviewIndex] = useState(0);

    const isLoading = isOpen && !data && !error;

    // Fetch from real API
    useEffect(() => {
        if (!isOpen || data || error) return;
        let cancelled = false;

        apiClient
            .get<ChinaAddressData>('/api/v1/clients/me/china-address')
            .then((res) => {
                if (!cancelled) setData(res.data);
            })
            .catch((err) => {
                if (!cancelled) setError(err?.message ?? t('chinaAddress.error.generic'));
            });

        return () => { cancelled = true; };
    }, [isOpen, data, error, t]);

    const handleRetry = useCallback(() => {
        setError(null);
        setData(null);
    }, []);

    const handleCopy = useCallback(() => {
        if (!data) return;
        navigator.clipboard.writeText(data.full_address_string);
        setCopied(true);
        toast.success(t('chinaAddress.toast.copied'));
        setTimeout(() => setCopied(false), 2000);
    }, [data, t]);

    const handleDownloadImage = useCallback(async (e: React.MouseEvent, imageUrl: string) => {
        e.stopPropagation();
        try {
            const response = await fetch(imageUrl);
            const blob = await response.blob();
            const url = window.URL.createObjectURL(blob);
            const link = document.createElement('a');
            link.href = url;
            link.download = `china-warehouse-${Date.now()}.jpg`;
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
            setTimeout(() => window.URL.revokeObjectURL(url), 5000);
            toast.success(t('chinaAddress.toast.downloading'));
        } catch {
            window.open(imageUrl, '_blank');
            toast.error(t('chinaAddress.toast.downloadFailed'));
        }
    }, [t]);

    const openPreview = useCallback((index: number) => {
        setPreviewIndex(index);
        setPreviewOpen(true);
    }, []);

    // --- Portal content ---
    const modalContent = (
        <AnimatePresence>
            {isOpen && (
                <>
                    {/* Backdrop */}
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        onClick={onClose}
                        className="fixed inset-0 bg-[#07182f]/35 z-[9999] flex items-center justify-center p-4"
                        style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0 }}
                    >
                        {/* Modal Card */}
                        <motion.div
                            initial={{ scale: 0.95, opacity: 0, y: 20 }}
                            animate={{ scale: 1, opacity: 1, y: 0 }}
                            exit={{ scale: 0.95, opacity: 0, y: 20 }}
                            transition={{ type: 'spring', damping: 25, stiffness: 300 }}
                            onClick={(e) => e.stopPropagation()}
                            className="bg-white w-full max-w-md max-h-[90vh] rounded-lg overflow-y-auto shadow-2xl border border-[#dbe8f4] relative z-[10000]"
                        >
                            {/* Header */}
                            <div className="sticky top-0 z-10 flex items-center justify-between p-5 border-b border-[#dbe8f4] bg-white">
                                <h2 className="text-xl font-bold flex items-center gap-2 text-[#07182f]">
                                    <MapPin className="w-5 h-5 text-[#0b4edb]" />
                                    {t('chinaAddress.title')}
                                </h2>
                                <button
                                    onClick={onClose}
                                    className="p-2 rounded-lg hover:bg-[#eef6ff] transition-colors text-[#63758a]"
                                >
                                    <X className="w-5 h-5" />
                                </button>
                            </div>

                            {/* Body */}
                            <div className="p-5 space-y-4">
                                {/* --- Loading State --- */}
                                {isLoading && (
                                    <div className="flex flex-col items-center justify-center py-16 gap-3">
                                        <Loader2 className="w-10 h-10 text-[#0b4edb] animate-spin" />
                                        <p className="text-sm text-[#63758a]">{t('chinaAddress.loading')}</p>
                                    </div>
                                )}

                                {/* --- Error State --- */}
                                {error && (
                                    <motion.div
                                        initial={{ opacity: 0, y: 10 }}
                                        animate={{ opacity: 1, y: 0 }}
                                        className="flex flex-col items-center justify-center py-12 gap-4"
                                    >
                                        <div className="p-4 rounded-lg bg-[#fff1f1]">
                                            <AlertTriangle className="w-8 h-8 text-red-500" />
                                        </div>
                                        <p className="text-center text-[#63758a] text-sm max-w-xs">
                                            {error}
                                        </p>
                                        <button
                                            onClick={handleRetry}
                                            className="flex items-center gap-2 px-5 py-2.5 rounded-lg bg-[#0b4edb] hover:bg-[#073fba] text-white font-semibold transition-colors active:scale-95"
                                        >
                                            <RefreshCw className="w-4 h-4" />
                                            {t('chinaAddress.retry')}
                                        </button>
                                    </motion.div>
                                )}

                                {/* --- Data Loaded --- */}
                                {data && (
                                    <motion.div
                                        initial={{ opacity: 0 }}
                                        animate={{ opacity: 1 }}
                                        transition={{ delay: 0.1 }}
                                        className="space-y-4"
                                    >
                                        {/* Address Card */}
                                        <div className="bg-[#eef6ff] rounded-lg p-4 border border-[#cfe0f1] space-y-1">
                                            <p className="text-sm text-[#63758a] font-medium">
                                                {t('chinaAddress.fullAddress')}
                                            </p>
                                            <div className="text-base font-mono font-bold text-[#07182f] leading-relaxed whitespace-pre-wrap break-words">
                                                {data.full_address_string.split('\n').filter(Boolean).map((line, i) => (
                                                    <div key={i} className="mb-1 last:mb-0">{line}</div>
                                                ))}
                                            </div>
                                        </div>

                                        {/* Copy Button — large & obvious */}
                                        <button
                                            onClick={handleCopy}
                                            className="w-full py-4 rounded-lg bg-[#0b4edb] hover:bg-[#073fba] text-white font-bold text-lg shadow-sm active:scale-[0.97] transition-all flex items-center justify-center gap-3 group"
                                        >
                                            {copied ? (
                                                <>
                                                    <Check className="w-7 h-7" />
                                                    <span className="text-xl">{t('chinaAddress.copied')}</span>
                                                </>
                                            ) : (
                                                <>
                                                    <Copy className="w-7 h-7 group-hover:rotate-12 transition-transform" />
                                                    <span className="text-xl">{t('chinaAddress.copyButton')}</span>
                                                </>
                                            )}
                                        </button>

                                        {/* Image Tabs */}
                                        {data.images.length > 0 && (
                                            <div className="space-y-3">
                                                {/* Tab selector */}
                                                {data.images.length > 1 && (
                                                    <div className="flex gap-2 p-1 rounded-lg bg-[#eef3f8]">
                                                        {data.images.map((url, i) => (
                                                            <button
                                                                key={i}
                                                                onClick={() => setActiveTab(i)}
                                                                className={`flex-1 py-2 px-3 rounded-lg text-sm font-semibold transition-all ${
                                                                    activeTab === i
                                                                        ? 'bg-white text-[#0b4edb] shadow-sm border border-[#dbe8f4]'
                                                                        : 'text-[#63758a] hover:text-[#07182f]'
                                                                }`}
                                                            >
                                                                {getTabLabel(url, i)}
                                                            </button>
                                                        ))}
                                                    </div>
                                                )}

                                                {/* Active image */}
                                                <div
                                                    className="relative w-full aspect-[4/3] bg-[#f8fbfe] rounded-lg overflow-hidden group cursor-pointer border border-[#dbe8f4]"
                                                    onClick={() => openPreview(activeTab)}
                                                >
                                                    {!imageLoaded[activeTab] && (
                                                        <div className="absolute inset-0 flex items-center justify-center">
                                                            <Loader2 className="w-7 h-7 text-[#0b4edb] animate-spin" />
                                                        </div>
                                                    )}
                                                    <AnimatePresence mode="wait">
                                                        <motion.img
                                                            key={activeTab}
                                                            initial={{ opacity: 0 }}
                                                            animate={{ opacity: imageLoaded[activeTab] ? 1 : 0 }}
                                                            exit={{ opacity: 0 }}
                                                            transition={{ duration: 0.3 }}
                                                            src={data.images[activeTab]}
                                                            alt={getTabLabel(data.images[activeTab], activeTab)}
                                                            className="w-full h-full object-contain transition-transform duration-500 group-hover:scale-105"
                                                            onLoad={() => setImageLoaded((prev) => ({ ...prev, [activeTab]: true }))}
                                                        />
                                                    </AnimatePresence>
                                                    <div className="absolute inset-0 bg-[#07182f]/0 group-hover:bg-[#07182f]/10 transition-colors flex items-center justify-center opacity-0 group-hover:opacity-100">
                                                        <div className="bg-[#07182f]/80 p-2 rounded-lg text-white">
                                                            <ZoomIn className="w-6 h-6" />
                                                        </div>
                                                    </div>
                                                </div>
                                            </div>
                                        )}

                                        {/* Warning Banner */}
                                        {data.warning_text && (
                                            <motion.div
                                                initial={{ opacity: 0, y: 8 }}
                                                animate={{ opacity: 1, y: 0 }}
                                                transition={{ delay: 0.25 }}
                                                className="flex gap-3 p-4 rounded-lg bg-[#fff1f1] border border-[#f3caca]"
                                            >
                                                <AlertTriangle className="w-5 h-5 text-red-500 shrink-0 mt-0.5" />
                                                <p className="text-sm font-medium text-[#c44747] leading-relaxed">
                                                    {data.warning_text.replace(/<\/?b>/g, ' ').replace(/⚠/g, '').trim()}
                                                </p>
                                            </motion.div>
                                        )}
                                    </motion.div>
                                )}
                            </div>
                        </motion.div>
                    </motion.div>

                    {/* Fullscreen Image Preview */}
                    <AnimatePresence>
                        {previewOpen && data && data.images[previewIndex] && (
                            <motion.div
                                initial={{ opacity: 0 }}
                                animate={{ opacity: 1 }}
                                exit={{ opacity: 0 }}
                                onClick={() => setPreviewOpen(false)}
                                className="fixed inset-0 bg-[#07182f]/95 z-[11000] flex items-center justify-center p-4"
                                style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0 }}
                            >
                                <button
                                    onClick={() => setPreviewOpen(false)}
                                    className="absolute top-4 right-4 p-3 bg-white/10 hover:bg-white/20 rounded-full text-white transition-colors z-10"
                                >
                                    <X className="w-6 h-6" />
                                </button>

                                {/* Preview tab switcher */}
                                {data.images.length > 1 && (
                                    <div className="absolute top-4 left-1/2 -translate-x-1/2 flex gap-2 z-20">
                                        {data.images.map((url, i) => (
                                            <button
                                                key={i}
                                                onClick={(e) => { e.stopPropagation(); setPreviewIndex(i); }}
                                                className={`px-4 py-2 rounded-lg text-sm font-semibold transition-all ${
                                                    previewIndex === i
                                                        ? 'bg-white/20 text-white'
                                                        : 'bg-white/5 text-white/60 hover:bg-white/10 hover:text-white'
                                                }`}
                                            >
                                                {getTabLabel(url, i)}
                                            </button>
                                        ))}
                                    </div>
                                )}

                                <div className="absolute bottom-6 left-0 right-0 px-4 flex items-center justify-center gap-3 z-20">
                                    <button
                                        onClick={(e) => handleDownloadImage(e, data.images[previewIndex])}
                                        className="px-6 py-3.5 bg-[#0b4edb] hover:bg-[#073fba] rounded-lg text-white font-medium flex items-center justify-center gap-2 transition-all active:scale-95 shadow-sm"
                                    >
                                        <Download className="w-5 h-5" />
                                        {t('chinaAddress.downloadButton')}
                                    </button>
                                </div>

                                <motion.img
                                    key={previewIndex}
                                    initial={{ scale: 0.9, opacity: 0 }}
                                    animate={{ scale: 1, opacity: 1 }}
                                    exit={{ scale: 0.9, opacity: 0 }}
                                    onClick={(e) => e.stopPropagation()}
                                    src={data.images[previewIndex]}
                                    alt="Full Preview"
                                    className="max-w-full max-h-[80vh] object-contain rounded-lg shadow-2xl"
                                />
                            </motion.div>
                        )}
                    </AnimatePresence>
                </>
            )}
        </AnimatePresence>
    );

    if (typeof document === 'undefined') return null;
    return createPortal(modalContent, document.body);
};

export default memo(ChinaAddressModal);
