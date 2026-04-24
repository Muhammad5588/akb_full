import { useState, useEffect, useRef } from "react";
import { useTranslation } from 'react-i18next';
import { createPortal } from "react-dom";
import { X, Scale, Box, Calculator, DollarSign, Info, Gift, MessageCircle } from "lucide-react";
import { apiClient } from "@/api/client";
import { normalizeNumber } from "@/utils/numberFormat";

interface CalculatorModalProps {
    isOpen: boolean;
    onClose: () => void;
}

interface CalcResult {
    chargeable_weight: number;
    price_per_kg_usd: number;
    price_per_kg_uzs: number;
    estimated_price_usd: number;
    estimated_price_uzs: number;
}

interface CalculatorPayload {
    is_gabarit: boolean;
    m: number;
    x?: number;
    y?: number;
    z?: number;
}

export default function CalculatorModal({ isOpen, onClose }: CalculatorModalProps) {
    const { t } = useTranslation();
    const [mounted, setMounted] = useState(false);
    const [isGabarit, setIsGabarit] = useState(false);

    // Asosiy qiymatlar
    const [weight, setWeight] = useState("");
    const [length, setLength] = useState(""); // x
    const [width, setWidth] = useState("");   // y
    const [height, setHeight] = useState(""); // z

    const [result, setResult] = useState<CalcResult | null>(null);
    const [isLoading, setIsLoading] = useState(false);

    // API ni ketma-ket chaqirmaslik uchun (Debounce timer)
    const typingTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

    // SSR/hydration xavfsizligi uchun mounted state
    useEffect(() => {
        setMounted(true);
        return () => setMounted(false);
    }, []);

    // Scroll-lock: modal ochiq bo'lganda body scroll'ini bloklash
    useEffect(() => {
        if (!isOpen) return;
        const original = document.body.style.overflow;
        document.body.style.overflow = "hidden";
        return () => {
            document.body.style.overflow = original;
        };
    }, [isOpen]);

    // Modal yopilganda state'larni tozalash
    useEffect(() => {
        if (!isOpen) {
            setWeight("");
            setLength("");
            setWidth("");
            setHeight("");
            setResult(null);
            setIsGabarit(false);
        }
    }, [isOpen]);

    // Live hisoblash logikasi (500ms debounce)
    useEffect(() => {
        if (typingTimeoutRef.current) {
            clearTimeout(typingTimeoutRef.current);
        }

        const fetchCalculation = async () => {
            const m = parseFloat(weight);
            if (isNaN(m) || m <= 0) {
                setResult(null);
                return;
            }

            let payload: CalculatorPayload = {
                is_gabarit: isGabarit,
                m: m,
            };

            // Agar gabarit bo'lsa, x,y,z (metrda) majburiy
            if (isGabarit) {
                const x = parseFloat(length) / 100;
                const y = parseFloat(width) / 100;
                const z = parseFloat(height) / 100;

                if (isNaN(x) || isNaN(y) || isNaN(z) || x <= 0 || y <= 0 || z <= 0) {
                    setResult(null);
                    return;
                }
                payload = { ...payload, x, y, z };
            }

            setIsLoading(true);
            try {
                const response = await apiClient.post<CalcResult>(
                    "/api/v1/client/calculator",
                    payload
                );
                setResult(response.data);
            } catch (error) {
                console.error("Calculator API Error:", error);
                setResult(null);
            } finally {
                setIsLoading(false);
            }
        };

        typingTimeoutRef.current = setTimeout(() => {
            fetchCalculation();
        }, 500);

        return () => {
            if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current);
        };
    }, [weight, length, width, height, isGabarit]);

    if (!mounted || !isOpen) return null;

    return createPortal(
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4">
            {/* Backdrop */}
            <div
                className="absolute inset-0 bg-[#07182f]/35 transition-opacity"
                onClick={onClose}
            />

            {/* Modal Container — bottom sheet on mobile, centered on sm+ */}
            <div className="
                relative w-full sm:max-w-md md:max-w-lg bg-white
                rounded-t-lg sm:rounded-lg shadow-2xl overflow-hidden
                animate-in slide-in-from-bottom-full sm:zoom-in-95 duration-300
                border border-[#dbe8f4]
            ">
                {/* Header */}
                <div className="px-6 py-5 border-b border-[#dbe8f4] flex items-center justify-between bg-[#f8fbfe]">
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-lg bg-[#eef6ff] flex items-center justify-center text-[#0b4edb]">
                            <Calculator className="w-5 h-5" />
                        </div>
                        <div>
                            <h2 className="text-xl font-extrabold text-[#07182f]">{t('calculator.title')}</h2>
                            <p className="text-xs font-medium text-[#63758a]">{t('calculator.subtitle')}</p>
                        </div>
                    </div>
                    <button
                        onClick={onClose}
                        className="w-8 h-8 rounded-lg bg-white border border-[#dbe8f4] flex items-center justify-center text-[#63758a] hover:bg-[#eef6ff] active:scale-95 transition-transform"
                    >
                        <X className="w-4 h-4" />
                    </button>
                </div>

                <div className="p-6 space-y-6 max-h-[85vh] overflow-y-auto pb-[env(safe-area-inset-bottom,24px)]">
                    {/* Segmented Control (Tabs) */}
                    <div className="flex bg-[#eef3f8] p-1.5 rounded-lg relative">
                        <button
                            onClick={() => setIsGabarit(false)}
                            className={`flex-1 flex items-center justify-center gap-2 py-3 rounded-md text-sm font-bold transition-all duration-300 z-10 ${
                                !isGabarit ? "text-[#07182f] shadow-sm" : "text-[#63758a]"
                            }`}
                        >
                            <Scale className="w-4 h-4" /> {t('calculator.tabs.normal')}
                        </button>
                        <button
                            onClick={() => setIsGabarit(true)}
                            className={`flex-1 flex items-center justify-center gap-2 py-3 rounded-md text-sm font-bold transition-all duration-300 z-10 ${
                                isGabarit ? "text-[#07182f] shadow-sm" : "text-[#63758a]"
                            }`}
                        >
                            <Box className="w-4 h-4" /> {t('calculator.tabs.dimensional')}
                        </button>

                        {/* Animated sliding background */}
                        <div
                            className="absolute top-1.5 bottom-1.5 w-[calc(50%-6px)] bg-white rounded-md shadow-sm border border-[#dbe8f4] transition-transform duration-300 ease-out"
                            style={{ transform: isGabarit ? "translateX(100%)" : "translateX(0)" }}
                        />
                    </div>

                    {/* Inputs */}
                    <div className="space-y-4">
                        {/* Asosiy vazn */}
                        <div>
                            <label className="block text-sm font-bold text-[#07182f] mb-2">
                                {t('calculator.inputs.weightLabel')}
                            </label>
                            <div className="relative">
                                <input
                                    type="number"
                                    inputMode="decimal"
                                    value={weight}
                                    onChange={(e) => {
                                        const normalized = normalizeNumber(e.target.value);
                                        if (normalized !== null) setWeight(normalized);
                                    }}
                                    placeholder="0.00"
                                    className="w-full bg-[#f8fbfe] border border-[#dbe8f4] rounded-lg px-5 py-4 text-xl sm:text-2xl font-bold text-[#07182f] placeholder:text-[#9fb7cc] focus:outline-none focus:ring-2 focus:ring-[#37c5f3]/25 focus:border-[#0b84e5] transition-all"
                                />
                                <span className="absolute right-5 top-1/2 -translate-y-1/2 text-[#63758a] font-bold">{t('calculator.inputs.kg')}</span>
                            </div>
                        </div>

                        {/* Gabarit o'lchamlari */}
                        {isGabarit && (
                            <div className="animate-in fade-in slide-in-from-top-4 duration-300">
                                <label className="block text-sm font-bold text-[#07182f] mb-2">
                                    {t('calculator.inputs.dimensionsLabel')}
                                </label>
                                <div className="grid grid-cols-3 gap-3">
                                    <div className="relative">
                                        <input
                                            type="number" inputMode="decimal" value={length} onChange={(e) => {
                                                const normalized = normalizeNumber(e.target.value);
                                                if (normalized !== null) setLength(normalized);
                                            }} placeholder={t('calculator.inputs.length')}
                                            className="w-full bg-[#f8fbfe] border border-[#dbe8f4] rounded-lg px-3 py-3 text-center text-lg font-bold text-[#07182f] focus:outline-none focus:ring-2 focus:ring-[#37c5f3]/25 focus:border-[#0b84e5]"
                                        />
                                        <span className="block text-center text-[10px] text-[#63758a] mt-1">{t('calculator.inputs.lengthUnit')}</span>
                                    </div>
                                    <div className="relative">
                                        <input
                                            type="number" inputMode="decimal" value={width} onChange={(e) => {
                                                const normalized = normalizeNumber(e.target.value);
                                                if (normalized !== null) setWidth(normalized);
                                            }} placeholder={t('calculator.inputs.width')}
                                            className="w-full bg-[#f8fbfe] border border-[#dbe8f4] rounded-lg px-3 py-3 text-center text-lg font-bold text-[#07182f] focus:outline-none focus:ring-2 focus:ring-[#37c5f3]/25 focus:border-[#0b84e5]"
                                        />
                                        <span className="block text-center text-[10px] text-[#63758a] mt-1">{t('calculator.inputs.widthUnit')}</span>
                                    </div>
                                    <div className="relative">
                                        <input
                                            type="number" inputMode="decimal" value={height} onChange={(e) => {
                                                const normalized = normalizeNumber(e.target.value);
                                                if (normalized !== null) setHeight(normalized);
                                            }} placeholder={t('calculator.inputs.height')}
                                            className="w-full bg-[#f8fbfe] border border-[#dbe8f4] rounded-lg px-3 py-3 text-center text-lg font-bold text-[#07182f] focus:outline-none focus:ring-2 focus:ring-[#37c5f3]/25 focus:border-[#0b84e5]"
                                        />
                                        <span className="block text-center text-[10px] text-[#63758a] mt-1">{t('calculator.inputs.heightUnit')}</span>
                                    </div>
                                </div>
                            </div>
                        )}
                    </div>

                    {/* Live Natija Qismi (Optimized UI) */}
                    <div className="mt-4 space-y-3">
                        {isLoading ? (
                            <div className="bg-[#f8fbfe] rounded-lg h-24 flex flex-col items-center justify-center gap-3 animate-pulse border border-[#dbe8f4]">
                                <div className="w-6 h-6 border-3 border-[#37c5f3]/30 border-t-[#0b4edb] rounded-full animate-spin" />
                                <p className="text-sm font-medium text-[#63758a]">{t('calculator.results.calculating')}</p>
                            </div>
                        ) : result ? (
                            <div className="animate-in fade-in slide-in-from-bottom-2 duration-300 space-y-3">
                                
                                {/* 1. Hisoblangan Vazn (Main Focus) */}
                                <div className="bg-[#07182f] rounded-lg p-5 text-white flex justify-between items-center shadow-sm">
                                    <div>
                                        <p className="text-[#9ee8ff] font-medium text-sm">{t('calculator.results.chargeableWeight')}</p>
                                        <p className="text-3xl font-black mt-0.5">{result.chargeable_weight} <span className="text-lg font-medium opacity-90">kg</span></p>
                                    </div>
                                    <div className="w-12 h-12 bg-white/10 rounded-lg flex items-center justify-center">
                                        <Scale className="w-6 h-6 text-white" />
                                    </div>
                                </div>

                                {/* 2. Joriy Tarif (Flat & Minimal) */}
                                <div className="bg-[#f8fbfe] border border-[#dbe8f4] rounded-lg p-4 flex justify-between items-center">
                                    <p className="text-[#63758a] font-medium text-sm flex items-center gap-2">
                                        <Info className="w-4 h-4 text-[#0b84e5]" />
                                        {t('calculator.results.pricePerKg')}
                                    </p>
                                    <div className="text-right">
                                        <p className="text-base font-bold text-[#07182f]">
                                            ${result.price_per_kg_usd.toLocaleString("uz-UZ", { minimumFractionDigits: 2 })}
                                        </p>
                                        <p className="text-[11px] font-medium text-[#63758a] mt-0.5">
                                            ~{result.price_per_kg_uzs.toLocaleString("uz-UZ")} {t('calculator.results.currencyUzs')}
                                        </p>
                                    </div>
                                </div>

                                {/* 3. Taxminiy To'lov (Distinct Color for Interaction) */}
                                <div className="bg-[#effbf5] border border-[#ccebdc] rounded-lg p-4 flex justify-between items-center relative overflow-hidden">
                                    <p className="text-[#15835b] font-semibold text-sm flex items-center gap-2 relative z-10">
                                        <DollarSign className="w-4 h-4" />
                                        {t('calculator.results.estimatedPayment')}
                                    </p>
                                    <div className="text-right relative z-10">
                                        <p className="text-xl font-black text-[#15835b]">
                                            {result.estimated_price_uzs.toLocaleString("uz-UZ")} <span className="text-sm">{t('calculator.results.currencyUzs')}</span>
                                        </p>
                                        <p className="text-[11px] font-bold text-[#15835b]/70 mt-0.5">
                                            ${result.estimated_price_usd.toLocaleString("uz-UZ", { minimumFractionDigits: 2 })}
                                        </p>
                                    </div>
                                </div>

                            </div>
                        ) : (
                            <div className="flex flex-col items-center justify-center h-28 text-center bg-[#f8fbfe] border border-dashed border-[#cfe0f1] rounded-lg">
                                <Calculator className="w-6 h-6 mb-2 text-[#7d91a8]" />
                                <p className="text-xs font-medium text-[#63758a] max-w-[200px]">
                                    {t('calculator.results.emptyState')}
                                </p>
                            </div>
                        )}
                    </div>

                    {/* Gabarit info & CTA — faqat gabarit natijasi bo'lganda */}
                    {isGabarit && result && (
                        <div className="space-y-4 animate-in fade-in slide-in-from-bottom-3 duration-300">
                            {/* Explanation container */}
                            <div className="bg-[#eef6ff] border border-[#cfe0f1] rounded-lg p-5">
                                <div className="flex items-start gap-3">
                                    <div className="mt-0.5 w-9 h-9 shrink-0 rounded-lg bg-white border border-[#cfe0f1] flex items-center justify-center text-[#0b4edb]">
                                        <Info className="w-5 h-5" />
                                    </div>
                                    <div>
                                        <h4 className="text-sm font-extrabold text-[#07182f] mb-1.5">
                                            {t('calculator.dimensionalInfo.title')}
                                        </h4>
                                        <p className="text-[13px] leading-relaxed text-[#31506e]">
                                            {t('calculator.dimensionalInfo.desc')}
                                        </p>
                                    </div>
                                </div>

                                {/* Discount highlight */}
                                <div className="mt-4 bg-white border border-[#dbe8f4] rounded-lg p-4 flex items-start gap-3">
                                    <div className="mt-0.5 w-8 h-8 shrink-0 rounded-lg bg-[#effbf5] flex items-center justify-center text-[#15835b]">
                                        <Gift className="w-4 h-4" />
                                    </div>
                                    <p className="text-[13px] leading-relaxed font-semibold text-[#31506e]">
                                        {t('calculator.dimensionalInfo.discount')}
                                    </p>
                                </div>
                            </div>

                            {/* CTA Button */}
                            <button
                                onClick={() => window.open("https://t.me/mandarin_admin", "_blank", "noopener,noreferrer")}
                                className="w-full flex items-center justify-center gap-2.5 bg-[#0b4edb] hover:bg-[#073fba] active:scale-[0.98] text-white font-bold text-sm py-4 rounded-lg shadow-sm transition-all duration-200"
                            >
                                <MessageCircle className="w-5 h-5" />
                                {t('calculator.dimensionalInfo.contactAdmin')}
                            </button>
                        </div>
                    )}

                    <p className="text-center text-[10px] text-[#7d91a8] leading-tight pb-20">
                        {t('calculator.footerNote')}
                    </p>
                </div>
            </div>
        </div>,
        document.body
    );
}
