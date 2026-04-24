import { useState, useEffect, useRef } from "react";
import { useQuery } from "@tanstack/react-query";
import { Search, History, X, Loader2, AlertCircle } from "lucide-react";
import { trackCargo } from "@/api/services/cargo";
import { TrackResultCard } from "./components/TrackResultCard";
import { motion, AnimatePresence } from "framer-motion";
import { toast } from "sonner";
import { History as HistoryIcon } from "lucide-react";
import { useTranslation } from 'react-i18next';
import NotificationCenter from "@/components/notifications/NotificationCenter";

const HISTORY_KEY = "track_code_history_v2"; // Changed key to avoid conflict with old string-only history

interface HistoryItem {
    code: string;
    flightName?: string;
    date: number;
}

interface TrackCodeTabProps {
    initialQuery?: string;
    autoFocus?: boolean;
    onFocusConsumed?: () => void;
    embedded?: boolean;
    onCargoClick?: () => void;
}

export default function TrackCodeTab({
    initialQuery,
    autoFocus = false,
    onFocusConsumed,
    embedded = false,
    onCargoClick,
}: TrackCodeTabProps) {
    const { t } = useTranslation();
    const normalizedInitialQuery = initialQuery?.trim().toUpperCase() ?? "";
    const hasInitialQuery = normalizedInitialQuery.length >= 3;
    const [query, setQuery] = useState(() => hasInitialQuery ? normalizedInitialQuery : "");
    const [history, setHistory] = useState<HistoryItem[]>([]);
    const [activeSearch, setActiveSearch] = useState<string | null>(() => hasInitialQuery ? normalizedInitialQuery : null);
    const inputRef = useRef<HTMLInputElement>(null);
    // Load history
    useEffect(() => {
        const saved = localStorage.getItem(HISTORY_KEY);
        if (saved) {
            try {
                const parsed = JSON.parse(saved) as HistoryItem[];
                queueMicrotask(() => setHistory(parsed));
            } catch (e) {
                console.error("Failed to parse history", e);
            }
        }
    }, []);

    // autoFocus effect
    useEffect(() => {
        if (autoFocus && inputRef.current) {
            // Kichik delay - tab animation tugashini kutamiz
            const timer = setTimeout(() => {
                inputRef.current?.focus();
                onFocusConsumed?.();
            }, 350);
            return () => clearTimeout(timer);
        }
    }, [autoFocus, onFocusConsumed]);

    const addToHistory = (code: string, flightName?: string) => {
        const cleanCode = code.trim().toUpperCase();
        if (!cleanCode) return;

        setHistory(prev => {
            // Remove existing entry for this code
            const filtered = prev.filter(h => h.code !== cleanCode);
            // Add new entry to top
            const newItem: HistoryItem = {
                code: cleanCode,
                flightName: flightName || prev.find(h => h.code === cleanCode)?.flightName, // Preserve existing flight name if not provided
                date: Date.now()
            };
            const newHistory = [newItem, ...filtered].slice(0, 6);
            localStorage.setItem(HISTORY_KEY, JSON.stringify(newHistory));
            return newHistory;
        });
    };

    const removeFromHistory = (e: React.MouseEvent, code: string) => {
        e.stopPropagation();
        setHistory(prev => {
            const newHistory = prev.filter(h => h.code !== code);
            localStorage.setItem(HISTORY_KEY, JSON.stringify(newHistory));
            return newHistory;
        });
    }

    // API Query
    const { data, isLoading, error, isSuccess } = useQuery({
        queryKey: ["trackCargo", activeSearch],
        queryFn: () => trackCargo(activeSearch!),
        enabled: !!activeSearch && activeSearch.length >= 3,
        retry: false,
    });

    // Update history with flight name when data is found
    useEffect(() => {
        if (data && data.found) {
            // Find flight name from items
            const flightName = data.items?.[0]?.flight_name;
            if (activeSearch) {
                queueMicrotask(() => addToHistory(activeSearch, flightName || undefined));
            }
        }
    }, [data, activeSearch]);

    const handleSearch = (e?: React.FormEvent) => {
        e?.preventDefault();
        if (!query || query.length < 3) {
            toast.error(t('tracking.validation'));
            return;
        }
        const clean = query.trim().toUpperCase();
        setActiveSearch(clean);
        addToHistory(clean); // Add immediately, will update with flight name later
    };

    const handleChipClick = (item: HistoryItem) => {
        setQuery(item.code);
        setActiveSearch(item.code);
        addToHistory(item.code, item.flightName);
    };

    return (
        <div className={`animate-in fade-in slide-in-from-bottom-4 duration-500 ${embedded ? 'space-y-4 pb-0' : 'space-y-5 pb-20'}`}>

            {/* Title & Cargo Navigation */}
            <div className={`flex flex-wrap items-center justify-between gap-3 px-1 ${embedded ? 'mb-2' : 'mb-4'}`}>
                <div className="flex min-w-0 flex-1 items-center gap-3">
                    <div className="inline-flex min-w-0 items-center gap-2 rounded-full border border-[#dbe8f4] bg-white/80 px-3 py-2 shadow-[0_10px_24px_rgba(15,47,87,0.08)] backdrop-blur-sm dark:border-white/10 dark:bg-[#102038]/72 dark:shadow-[0_12px_24px_rgba(2,10,20,0.24)]">
                        <span className="h-2.5 w-2.5 shrink-0 rounded-full bg-[#0b4edb] shadow-[0_0_0_4px_rgba(11,78,219,0.14)] dark:bg-[#39C6FF] dark:shadow-[0_0_0_4px_rgba(57,198,255,0.12)]" />
                        <h2 className="truncate text-base font-semibold leading-tight text-[#07182f] dark:text-white sm:text-lg">
                            {t('tracking.title')}
                        </h2>
                    </div>
                    <div className="hidden h-px flex-1 rounded-full bg-[linear-gradient(90deg,rgba(11,78,219,0.22),rgba(207,224,241,0.6),rgba(255,255,255,0))] dark:bg-[linear-gradient(90deg,rgba(57,198,255,0.26),rgba(143,160,188,0.18),rgba(255,255,255,0))] sm:block" />
                </div>

                {onCargoClick && (
                    <div className="ml-auto flex items-center gap-2">
                        <NotificationCenter triggerClassName="rounded-md border border-[#cfe0f1] bg-white shadow-sm hover:bg-[#eef6ff] hover:text-[#0b4edb] dark:text-[#63758a] dark:hover:text-[#0b4edb]" />
                        <button
                            type="button"
                            onClick={onCargoClick}
                            className="
                                flex items-center gap-2 px-3 py-1.5 rounded-md text-sm font-medium
                                bg-[#eef6ff] text-[#0b4edb] border border-[#cfe0f1]
                                hover:bg-[#e1f0ff] transition-colors
                            "
                        >
                            <HistoryIcon className="w-4 h-4" />
                            <span>{t('tracking.myCargo')}</span>
                        </button>
                    </div>
                )}
            </div>

            <form onSubmit={handleSearch} className={`rounded-lg border border-[#cfe0f1] bg-white shadow-sm space-y-3 ${embedded ? 'p-3.5' : 'p-4'}`}>
                <div className="relative">
                    <input
                        type="text"
                        ref={inputRef}
                        value={query}
                        onChange={(e) => setQuery(e.target.value.toUpperCase())}
                        placeholder={t('tracking.placeholder')}
                        className="
                            w-full h-12 pl-10 pr-4 rounded-lg
                            bg-[#f8fbfe]
                            border border-[#cfe0f1]
                            text-lg font-mono font-semibold text-[#07182f] placeholder:font-sans placeholder:text-sm placeholder:font-medium placeholder:text-[#7d91a8]
                            focus:outline-none focus:ring-2 focus:ring-[#37c5f3]/20 focus:border-[#0b84e5]
                            transition-all duration-200
                        "
                    />
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-[#7d91a8] w-5 h-5" />
                </div>

                <button
                    type="submit"
                    disabled={isLoading}
                    className="
                        w-full flex items-center justify-center gap-2.5
                        h-12 rounded-lg
                        bg-[#0b4edb] hover:bg-[#073fba] active:bg-[#063493] active:scale-[0.98]
                        text-white font-semibold text-sm tracking-wide
                        shadow-[0_10px_20px_rgba(11,78,219,0.18)]
                        transition-all duration-200 disabled:opacity-60 disabled:cursor-not-allowed
                    "
                >
                    {isLoading ? (
                        <>
                            <Loader2 className="w-4.5 h-4.5 animate-spin" />
                            <span>{t('tracking.searching')}</span>
                        </>
                    ) : (
                        <>
                            <Search className="w-4 h-4" />
                            <span>{t('tracking.search', 'Qidirish')}</span>
                        </>
                    )}
                </button>
            </form>

            {/* History Chips */}
            {history.length > 0 && !data && (
                <div className="space-y-2">
                    <div className="flex items-center gap-2 text-sm text-[#63758a] ml-1">
                        <History className="w-4 h-4" />
                        <span>{t('tracking.recentSearches')}</span>
                    </div>
                    <div className="flex flex-wrap gap-2">
                        {history.map(item => (
                            <button
                                key={item.code}
                                onClick={() => handleChipClick(item)}
                                className="
                   group flex items-center gap-2 px-3 py-1.5 rounded-md
                   bg-white hover:bg-[#eef6ff]
                   border border-[#dbe8f4] hover:border-[#0b84e5]
                   transition-all text-sm font-mono text-[#334a62]
                 "
                            >
                                <span className="font-bold">{item.code}</span>
                                {item.flightName && (
                                    <span className="px-1.5 py-0.5 bg-[#eef6ff] rounded-md text-[10px] text-[#63758a]">
                                        {item.flightName}
                                    </span>
                                )}
                                <X
                                    onClick={(e) => removeFromHistory(e, item.code)}
                                    className="w-3 h-3 opacity-0 group-hover:opacity-100 text-gray-400 hover:text-red-500 transition-opacity"
                                />
                            </button>
                        ))}
                    </div>
                </div>
            )}

            {/* Results Region */}
            <div className={embedded ? 'min-h-0' : 'min-h-[200px]'}>
                {isLoading && (
                    <div className="flex flex-col items-center justify-center py-10 opacity-70">
                        <Loader2 className="w-10 h-10 animate-spin text-[#0b4edb] mb-2" />
                        <p className="text-sm font-medium text-[#63758a]">{t('tracking.searching')}</p>
                    </div>
                )}

                {error && (
                    <div className="bg-[#fff1f1] border border-[#f0cccc] p-4 rounded-lg flex items-center gap-3 text-[#c44747]">
                        <AlertCircle className="w-6 h-6 flex-shrink-0" />
                        <p className="text-sm font-medium">{t('tracking.error')}</p>
                    </div>
                )}

                {isSuccess && data && (
                    <AnimatePresence mode="wait">
                        {data.found ? (
                            <motion.div
                                key="result"
                                initial={{ opacity: 0, y: 10 }}
                                animate={{ opacity: 1, y: 0 }}
                                exit={{ opacity: 0, y: -10 }}
                            >
                                <TrackResultCard data={data} />
                            </motion.div>
                        ) : (
                            <motion.div
                                key="not-found"
                                initial={{ opacity: 0, scale: 0.95 }}
                                animate={{ opacity: 1, scale: 1 }}
                                className="flex flex-col items-center justify-center py-10 text-center"
                            >
                                <div className="w-16 h-16 bg-white rounded-lg border border-[#dbe8f4] flex items-center justify-center mb-4">
                                    <Search className="w-10 h-10 text-[#9fb7cc]" />
                                </div>
                                <h3 className="text-lg font-bold text-[#07182f]">{t('tracking.notFoundTitle')}</h3>
                                <p className="text-[#63758a] max-w-xs mx-auto">
                                    {t('tracking.notFoundDesc', { code: activeSearch })}
                                </p>
                            </motion.div>
                        )}
                    </AnimatePresence>
                )}
            </div>

        </div>
    );
}
