import { useState, useCallback, memo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useProfile } from '@/hooks/useProfile';
import { reportService, type ReportResponse } from '@/api/services/reportService';
import { trackCargo, type TrackCodeSearchResponse } from '@/api/services/cargo';
import { TrackResultCard } from '@/pages/dashboard/components/TrackResultCard';
import { UniqueBackground } from '@/components/ui/UniqueBackground';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { CardContent } from '@/components/ui/card';
import {
    Plane,
    Calendar,
    Package,
    DollarSign,
    Scale,
    ChevronLeft,
    AlertCircle,
    CreditCard,
    CheckCircle2,
    Clock,
    XCircle,
    RefreshCw,
    Search,
    ArrowRight
} from 'lucide-react';
import { format } from 'date-fns';
import { uz } from 'date-fns/locale';
import { motion, AnimatePresence } from 'framer-motion';
import { toast } from 'sonner';
import MakePaymentModal from '@/components/modals/MakePaymentModal';
import { useTranslation } from 'react-i18next';

// --- Types ---

type ViewState = 'list' | 'detail';

interface FlightCardProps {
    flightName: string;
    onClick: () => void;
}

interface ReportHistoryItemProps {
    report: ReportResponse;
    onPay: (amount: number) => void;
    onTrackClick: (code: string) => void;
    onImageClick: (url: string) => void;
}

// --- Components ---

const FlightCard = memo(({ flightName, onClick }: FlightCardProps) => {
    const { t } = useTranslation();
    return (
    <motion.div
        layoutId={`flight-${flightName}`}
        onClick={onClick}
        className="group cursor-pointer relative overflow-hidden rounded-lg bg-white border border-[#dbe8f4] shadow-[0_8px_22px_rgba(10,35,70,0.06)] transition-all duration-300 hover:-translate-y-[1px] hover:border-[#0b84e5]"
    >
        <CardContent className="p-4 relative z-10">
            <div className="flex items-start justify-between gap-3">
                <div className="flex min-w-0 items-center gap-3">
                    <div className="w-12 h-12 rounded-lg bg-[#eef6ff] border border-[#cfe0f1] flex items-center justify-center text-[#0b4edb]">
                        <Plane className="w-6 h-6" />
                    </div>
                    <div className="min-w-0">
                        <p className="text-[11px] text-[#63758a] font-semibold uppercase tracking-normal mb-1">{t('reports.flight')}</p>
                        <h3 className="text-xl font-semibold text-[#07182f] group-hover:text-[#0b4edb] transition-colors tracking-normal truncate">
                            {flightName}
                        </h3>
                    </div>
                </div>
                <div className="shrink-0 text-[#9fb7cc] group-hover:text-[#0b4edb] transition-colors">
                    <ArrowRight className="w-5 h-5" />
                </div>
            </div>

            <div className="mt-4 grid grid-cols-2 gap-2">
                <div className="rounded-lg border border-[#edf3f8] bg-[#f8fbfe] px-3 py-2">
                    <p className="text-[10px] font-semibold uppercase tracking-normal text-[#7d91a8]">
                        {t('reports.statusLabel', 'Holat')}
                    </p>
                    <p className="mt-1 text-sm font-bold text-[#0b4edb]">
                        {t('cargoSummary.active', 'Aktiv')}
                    </p>
                </div>
                <div className="rounded-lg border border-[#edf3f8] bg-[#f8fbfe] px-3 py-2">
                    <p className="text-[10px] font-semibold uppercase tracking-normal text-[#7d91a8]">
                        {t('reports.actionLabel', 'Amal')}
                    </p>
                    <p className="mt-1 text-sm font-bold text-[#07182f]">
                        {t('reports.openDetails', "Tafsilotlarni ko'rish")}
                    </p>
                </div>
            </div>
        </CardContent>
    </motion.div>
    );
});

const ReportHistoryItem = memo(({ report, onPay, onTrackClick, onImageClick }: ReportHistoryItemProps) => {
    const { t } = useTranslation();
    const sentDate = report.is_sent_web_date
        ? format(new Date(report.is_sent_web_date), 'dd MMMM, HH:mm', { locale: uz })
        : t('reports.unknownDate');

    const isPaid = report.payment_status === 'paid';
    const isPartial = report.payment_status === 'partial';
    const StatusIcon = isPaid ? CheckCircle2 : isPartial ? Clock : XCircle;
    const statusLabel = isPaid
        ? t('reports.status.paid')
        : isPartial
            ? t('reports.status.partial')
            : t('reports.status.unpaid');
    const statusClasses = isPaid
        ? 'bg-[#effbf5] text-[#15835b] border-[#ccebdc]'
        : isPartial
            ? 'bg-[#eef6ff] text-[#0b4edb] border-[#c7dcf3]'
            : 'bg-[#fff1f1] text-[#c44747] border-[#f0cccc]';

    return (
        <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-white rounded-lg p-4 border border-[#dbe8f4] shadow-[0_8px_22px_rgba(10,35,70,0.06)] space-y-4"
        >
            {/* Header */}
            <div className="flex flex-wrap items-start justify-between gap-3 pb-3 border-b border-[#edf3f8]">
                <div className="flex min-w-0 items-center gap-3">
                    <div className="w-10 h-10 rounded-lg bg-[#eef6ff] border border-[#cfe0f1] flex items-center justify-center text-[#0b4edb] shrink-0">
                        <Package className="w-5 h-5" />
                    </div>
                    <div className="min-w-0">
                        <p className="text-sm font-bold text-[#07182f]">{t('reports.cargoReport')}</p>
                        <p className="text-xs text-[#63758a] flex items-center gap-1">
                            <Calendar className="w-3 h-3" /> {sentDate}
                        </p>
                    </div>
                </div>
                {/* Status Badge */}
                <div className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-bold border ${statusClasses}`}>
                    <StatusIcon className="w-3.5 h-3.5" />
                    {statusLabel}
                </div>
            </div>

            {/* Info Grid */}
            <div className="grid grid-cols-2 gap-3">
                <div className="bg-[#f8fbfe] border border-[#edf3f8] rounded-lg p-3">
                    <span className="text-[10px] uppercase text-[#7d91a8] font-semibold">{t('reports.weight')}</span>
                    <div className="flex items-center gap-1 text-[#07182f] font-bold text-base mt-0.5">
                        <Scale className="w-4 h-4 text-[#0b84e5]" />
                        {report.total_weight} <span className="text-xs font-normal text-[#63758a]">kg</span>
                    </div>
                </div>
                <div className="bg-[#f8fbfe] border border-[#edf3f8] rounded-lg p-3">
                    <span className="text-[10px] uppercase text-[#7d91a8] font-semibold">{t('reports.totalPrice')}</span>
                    <div className="flex items-start gap-1 text-[#07182f] font-bold text-base mt-0.5">
                        <DollarSign className="w-4 h-4 text-[#15835b] mt-1" />
                        <div className="flex flex-col">
                            <span>
                                {report.total_price_uzs.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 4 })}
                                <span className="text-xs font-normal text-[#63758a] ml-1">so'm</span>
                            </span>
                            <span className="text-xs font-normal text-[#7d91a8]">
                                ${report.total_price_usd.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 4 })}
                            </span>
                        </div>
                    </div>
                </div>
            </div>

            {/* Photos Grid */}
            {report.photo_file_ids && report.photo_file_ids.length > 0 && (
                <div className="mb-4">
                    <p className="text-[10px] uppercase text-[#7d91a8] font-semibold mb-2">{t('reports.photos')}</p>
                    <div className="flex overflow-x-auto gap-3 pb-2 scrollbar-hide" style={{ scrollbarWidth: 'none' }}>
                        {report.photo_file_ids.map((photoId, i) => (
                            <div 
                                key={i} 
                                onClick={() => onImageClick(photoId)}
                                className="flex-shrink-0 w-24 h-24 sm:w-28 sm:h-28 rounded-lg overflow-hidden bg-[#f8fbfe] border border-[#dbe8f4] relative group cursor-pointer"
                            >
                                <img
                                    src={`${photoId}`}
                                    alt={`Cargo photo ${i + 1}`}
                                    className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
                                    onError={(e) => {
                                        (e.target as HTMLImageElement).src = 'https://placehold.co/400x400/png?text=Rasm+Topilmadi';
                                    }}
                                />
                            </div>
                        ))}
                    </div>
                </div>
            )}

            {/* Track Codes */}
            {report.track_codes.length > 0 && (
                <div>
                    <p className="text-[10px] uppercase text-[#7d91a8] font-semibold mb-2">{t('reports.trackCodes')}</p>
                    <div className="flex flex-wrap gap-2">
                        {report.track_codes.map((code, i) => (
                            <button
                                key={i}
                                onClick={() => onTrackClick(code)}
                                className="px-3 py-2 bg-[#eef6ff] hover:bg-[#e1f0ff] text-[#0b4edb] text-xs font-mono rounded-lg transition-colors border border-[#cfe0f1] active:scale-95"
                            >
                                {code}
                            </button>
                        ))}
                    </div>
                </div>
            )}

            {/* Payment Action */}
            {report.payment_status !== 'paid' && (
                <Button
                    className={`w-full min-h-11 rounded-lg font-bold text-white shadow-sm active:scale-[0.98] transition-all
                ${report.payment_status === 'unpaid'
                            ? 'bg-[#c44747] hover:bg-[#a83a3a]'
                            : 'bg-[#0b4edb] hover:bg-[#073fba]'
                        }`}
                    onClick={() => onPay(report.total_price_uzs - report.paid_amount)}
                >
                    <CreditCard className="w-4 h-4 mr-2" />
                    {report.payment_status === 'unpaid' ? t('reports.pay') : t('reports.payRemaining')}
                    <span className="ml-1 opacity-90 text-xs font-normal">
                        ({(report.expected_amount - report.paid_amount).toLocaleString()} so'm)
                    </span>
                </Button>
            )}
        </motion.div>
    );
});

// --- Image Preview Modal ---
interface ImagePreviewModalProps {
    src: string | null;
    onClose: () => void;
}

const ImagePreviewModal = ({ src, onClose }: ImagePreviewModalProps) => (
    <AnimatePresence>
        {src && (
            <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                onClick={onClose}
                className="fixed inset-0 z-[100] flex items-center justify-center bg-[#07182f]/95 p-4 cursor-zoom-out"
            >
                <button
                    onClick={onClose}
                    className="absolute top-4 right-4 sm:top-8 sm:right-8 p-2 bg-white/10 hover:bg-white/20 text-white rounded-lg transition-colors z-50"
                >
                    <XCircle className="w-8 h-8" />
                </button>
                <motion.img
                    initial={{ scale: 0.9, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    exit={{ scale: 0.9, opacity: 0 }}
                    transition={{ type: "spring", damping: 25, stiffness: 300 }}
                    src={src}
                    alt="Preview"
                    className="max-w-full max-h-[90vh] object-contain rounded-lg shadow-[0_18px_48px_rgba(15,47,87,0.24)] cursor-default"
                    onClick={(e) => e.stopPropagation()}
                />
            </motion.div>
        )}
    </AnimatePresence>
);

// --- Custom Drawer Component ---
interface BottomDrawerProps {
    open: boolean;
    onClose: () => void;
    children: React.ReactNode;
}

const BottomDrawer = ({ open, onClose, children }: BottomDrawerProps) => (
    <AnimatePresence>
        {open && (
            <>
                {/* Backdrop */}
                <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    onClick={onClose}
                    className="fixed inset-0 bg-[#07182f]/35 z-50"
                />
                {/* Drawer Panel */}
                <motion.div
                    initial={{ y: "100%" }}
                    animate={{ y: 0 }}
                    exit={{ y: "100%" }}
                    transition={{ type: "spring", damping: 25, stiffness: 200 }}
                    className="fixed bottom-0 left-0 right-0 z-50 bg-[#f8fbfe] rounded-t-lg max-h-[85vh] flex flex-col shadow-[0_-18px_40px_rgba(10,35,70,0.16)] border border-[#dbe8f4]"
                >
                    {/* Handle */}
                    <div className="w-12 h-1.5 bg-[#cfe0f1] rounded-full mx-auto mt-4 mb-2 flex-shrink-0" />

                    <div className="flex-1 overflow-y-auto overflow-x-hidden p-4 pb-10">
                        {children}
                    </div>
                </motion.div>
            </>
        )}
    </AnimatePresence>
);

const SummaryChips = memo(({ flightsCount, history }: { flightsCount: number; history: ReportResponse[] }) => {
    const { t } = useTranslation();
    const unpaidCount = history.filter((item) => item.payment_status !== 'paid').length;
    const paidCount = history.filter((item) => item.payment_status === 'paid').length;
    const chips = [
        { label: t('cargoSummary.active', 'Aktiv'), value: flightsCount, icon: Package, valueClass: 'text-[#0b4edb]', iconClass: 'bg-[#eef6ff] text-[#0b4edb] border-[#cfe0f1]' },
        { label: t('cargoSummary.onWay', "Yo'lda"), value: history.length, icon: Plane, valueClass: 'text-[#0784a6]', iconClass: 'bg-[#eafaff] text-[#0784a6] border-[#bdebf7]' },
        { label: t('cargoSummary.billing', 'Hisob'), value: unpaidCount, icon: CreditCard, valueClass: 'text-[#c44747]', iconClass: 'bg-[#fff1f1] text-[#c44747] border-[#f0cccc]' },
        { label: t('cargoSummary.delivered', 'Yetkazilgan'), value: paidCount, icon: CheckCircle2, valueClass: 'text-[#15835b]', iconClass: 'bg-[#effbf5] text-[#15835b] border-[#ccebdc]' },
    ];

    return (
        <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
            {chips.map((chip) => {
                const Icon = chip.icon;
                return (
                    <div key={chip.label} className="rounded-lg border border-[#dbe8f4] bg-white px-3 py-3 shadow-[0_6px_16px_rgba(10,35,70,0.05)]">
                        <div className="flex items-center justify-between gap-2">
                            <p className={`text-2xl font-black leading-none ${chip.valueClass}`}>{chip.value}</p>
                            <div className={`w-8 h-8 rounded-lg border flex items-center justify-center ${chip.iconClass}`}>
                                <Icon className="w-4 h-4" />
                            </div>
                        </div>
                        <p className="mt-2 text-xs font-semibold leading-none text-[#63758a]">{chip.label}</p>
                    </div>
                );
            })}
        </div>
    );
});

export default function UserReportsPage() {
    const { data: user, isLoading: isUserLoading, isError: isUserError } = useProfile();
    const { t } = useTranslation();

    // State
    const [selectedFlight, setSelectedFlight] = useState<string | null>(null);
    const view: ViewState = selectedFlight ? 'detail' : 'list';

    // Track Drawer State
    const [selectedTrackCode, setSelectedTrackCode] = useState<string | null>(null);
    const [trackData, setTrackData] = useState<TrackCodeSearchResponse | null>(null);
    const [isTrackLoading, setIsTrackLoading] = useState(false);

    // Payment Modal State
    const [isPaymentOpen, setIsPaymentOpen] = useState(false);
    const [paymentFlightName, setPaymentFlightName] = useState<string | null>(null);

    // Image Preview State
    const [previewImage, setPreviewImage] = useState<string | null>(null);

    // --- Data Fetching (TanStack Query) ---

    // 1. Fetch Flights
    const {
        data: flights = [],
        isLoading: isLoadingFlights,
        refetch: refetchFlights,
        isRefetching: isRefetchingFlights
    } = useQuery({
        queryKey: ['webFlights', user?.client_code],
        queryFn: () => reportService.getWebFlights(user!.client_code),
        enabled: !!user?.client_code,
        staleTime: 5 * 60 * 1000, // 5 minutes
    });

    // 2. Fetch History (Only when flight selected)
    const {
        data: history = [],
        isLoading: isLoadingHistory,
        refetch: refetchHistory,
        isRefetching: isRefetchingHistory
    } = useQuery({
        queryKey: ['webHistory', user?.client_code, selectedFlight],
        queryFn: () => reportService.getWebHistory(user!.client_code, selectedFlight!),
        enabled: !!user?.client_code && !!selectedFlight,
        staleTime: 5 * 60 * 1000, // 5 minutes
    });

    // --- Handlers ---

    const handleRefresh = () => {
        if (view === 'detail' && selectedFlight) {
            refetchHistory();
        } else {
            refetchFlights();
        }
    };

    const isRefreshing = isRefetchingFlights || isRefetchingHistory;

    const handleTrackClick = async (code: string) => {
        setSelectedTrackCode(code);
        setIsTrackLoading(true);
        setTrackData(null);
        try {
            const data = await trackCargo(code);
            setTrackData(data);
        } catch (error) {
            console.error("Track error", error);
            toast.error(t('reports.trackCodeNotFound'));
            // Don't close immediately, let user see empty state or error
        } finally {
            setIsTrackLoading(false);
        }
    };

    const openPaymentModal = useCallback(() => {
        if (!selectedFlight) {
            toast.error(t('reports.noFlightSelected'));
            return;
        }
        setPaymentFlightName(selectedFlight);
        setIsPaymentOpen(true);
    }, [selectedFlight, t]);

    const handlePay = useCallback(
        () => openPaymentModal(),
        [openPaymentModal],
    ) as (amount: number) => void;

    const handlePaymentClose = useCallback(() => {
        setIsPaymentOpen(false);
        setPaymentFlightName(null);
        // Refresh history after payment
        if (selectedFlight) refetchHistory();
    }, [selectedFlight, refetchHistory]);

    // --- Render Helpers ---

    if (isUserLoading) {
        return (
            <div className="min-h-screen bg-[#f4f8fc] text-[#07182f]">
                <UniqueBackground />
                <div className="container max-w-md mx-auto px-4 pt-20 space-y-4 relative z-10">
                    <Skeleton className="h-10 w-1/2 rounded-lg" />
                    <Skeleton className="h-32 w-full rounded-lg" />
                    <Skeleton className="h-32 w-full rounded-lg" />
                </div>
            </div>
        );
    }

    if (isUserError || !user) {
        return (
            <div className="min-h-screen bg-[#f4f8fc] text-[#07182f]">
                <UniqueBackground />
                <div className="relative z-10 flex flex-col items-center justify-center min-h-[60vh] px-4 pt-20 text-center">
                    <AlertCircle className="w-12 h-12 text-red-500 mb-4" />
                    <h3 className="text-lg font-bold">{t('reports.errorTitle')}</h3>
                    <Button onClick={() => window.location.reload()} className="mt-4" variant="outline">
                        <RefreshCw className="w-4 h-4 mr-2" /> {t('reports.retry')}
                    </Button>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-[#f4f8fc] text-[#07182f] font-sans transition-colors duration-300 pb-34 pt-20">
            <UniqueBackground />

            <div className="container max-w-lg mx-auto px-4 relative z-10">

                {/* Header / Navigation */}
                <div className="mb-5 rounded-lg border border-[#dbe8f4] bg-white p-4 shadow-[0_10px_24px_rgba(10,35,70,0.06)]">
                    <div className="flex items-start justify-between gap-4">
                        {view === 'detail' ? (
                            <div className="min-w-0">
                                <button
                                    onClick={() => setSelectedFlight(null)}
                                    className="mb-3 flex items-center gap-2 text-[#63758a] hover:text-[#07182f] transition-colors"
                                >
                                    <span className="p-2 rounded-lg bg-[#f8fbfe] border border-[#dbe8f4] hover:bg-[#eef6ff] transition-colors">
                                        <ChevronLeft className="w-5 h-5" />
                                    </span>
                                    <span className="font-bold text-sm">{t('reports.back')}</span>
                                </button>
                                <p className="text-[11px] font-bold uppercase tracking-normal text-[#0b4edb]">
                                    {t('reports.selectedFlight', 'Tanlangan reys')}
                                </p>
                                <h1 className="mt-1 truncate text-2xl font-semibold text-[#07182f]">
                                    {selectedFlight}
                                </h1>
                            </div>
                        ) : (
                            <div className="min-w-0">
                                <p className="text-[11px] font-bold uppercase tracking-normal text-[#0b4edb]">
                                    {t('reports.shipmentDashboard', 'Yuklar paneli')}
                                </p>
                                <h1 className="mt-1 text-3xl font-semibold text-[#07182f]">
                                    {t('reports.title')}
                                </h1>
                                <p className="mt-1 text-sm text-[#63758a] font-medium">
                                    {t('reports.subtitle')}
                                </p>
                            </div>
                        )}

                        {/* Refresh Button */}
                        <button
                            onClick={handleRefresh}
                            disabled={isRefreshing}
                            className="shrink-0 p-3 rounded-lg bg-[#eef6ff] border border-[#cfe0f1] hover:bg-[#e1f0ff] active:scale-90 transition-all text-[#0b4edb] disabled:opacity-60"
                        >
                            <RefreshCw className={`w-5 h-5 ${isRefreshing ? 'animate-spin' : ''}`} />
                        </button>
                    </div>

                    <div className="mt-4">
                        <SummaryChips flightsCount={flights.length} history={history} />
                    </div>
                </div>

                <AnimatePresence mode="wait">
                    {view === 'list' ? (
                        <motion.div
                            key="list"
                            initial={{ opacity: 0, x: -20 }}
                            animate={{ opacity: 1, x: 0 }}
                            exit={{ opacity: 0, x: -20 }}
                            transition={{ duration: 0.3 }}
                            className="grid grid-cols-1 gap-4"
                        >
                            {isLoadingFlights ? (
                                [1, 2, 3].map(i => <Skeleton key={i} className="h-32 w-full rounded-lg bg-[#dbe8f4]" />)
                            ) : flights.length > 0 ? (
                                flights.map(flightName => (
                                    <FlightCard
                                        key={flightName}
                                        flightName={flightName}
                                        onClick={() => setSelectedFlight(flightName)}
                                    />
                                ))
                            ) : (
                                <div className="rounded-lg border border-[#dbe8f4] bg-white px-6 py-12 text-center shadow-[0_8px_22px_rgba(10,35,70,0.06)]">
                                    <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-lg border border-[#cfe0f1] bg-[#eef6ff] text-[#0b4edb]">
                                        <Search className="w-7 h-7" />
                                    </div>
                                    <p className="text-base font-bold text-[#07182f]">{t('reports.noReports')}</p>
                                    <p className="mt-2 text-sm text-[#63758a]">
                                        {t('reports.noReportsHint', "Yuklar kelganda ular shu yerda ko'rinadi.")}
                                    </p>
                                </div>
                            )}
                        </motion.div>
                    ) : (
                        <motion.div
                            key="detail"
                            initial={{ opacity: 0, x: 50 }}
                            animate={{ opacity: 1, x: 0 }}
                            exit={{ opacity: 0, x: 50 }}
                            transition={{ duration: 0.3 }}
                            className="space-y-4"
                        >
                            {/* Detail Title */}
                            <div className="rounded-lg border border-[#dbe8f4] bg-[#eef6ff] px-4 py-3">
                                <p className="text-[11px] font-bold uppercase tracking-normal text-[#0b4edb]">
                                    {t('reports.detailsLabel', 'Reys tafsilotlari')}
                                </p>
                                <h2 className="mt-1 text-lg font-semibold text-[#07182f]">{t('reports.details', { flight: selectedFlight })}</h2>
                            </div>

                            {isLoadingHistory ? (
                                [1, 2, 3].map(i => <Skeleton key={i} className="h-48 w-full rounded-lg bg-[#dbe8f4]" />)
                            ) : history.length > 0 ? (
                                history.map((item, idx) => (
                                    <ReportHistoryItem
                                        key={idx}
                                        report={item}
                                        onPay={handlePay}
                                        onTrackClick={handleTrackClick}
                                        onImageClick={setPreviewImage}
                                    />
                                ))
                            ) : (
                                <div className="rounded-lg border border-[#dbe8f4] bg-white px-6 py-10 text-center shadow-[0_8px_22px_rgba(10,35,70,0.06)]">
                                    <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-lg border border-[#cfe0f1] bg-[#eef6ff] text-[#0b4edb]">
                                        <Package className="w-7 h-7" />
                                    </div>
                                    <p className="text-base font-bold text-[#07182f]">{t('reports.notFound')}</p>
                                    <p className="mt-2 text-sm text-[#63758a]">
                                        {t('reports.notFoundHint', "Bu reys bo'yicha yuk ma'lumotlari hali mavjud emas.")}
                                    </p>
                                </div>
                            )}
                        </motion.div>
                    )}
                </AnimatePresence>
            </div>

            {/* Payment Modal */}
            <MakePaymentModal
                isOpen={isPaymentOpen}
                onClose={handlePaymentClose}
                preselectedFlightName={paymentFlightName}
            />

            {/* Custom Bottom Drawer for Track Details */}
            <BottomDrawer open={!!selectedTrackCode} onClose={() => setSelectedTrackCode(null)}>
                <div className="mb-4 rounded-lg border border-[#dbe8f4] bg-white p-4 shadow-[0_6px_16px_rgba(10,35,70,0.05)]">
                    <div className="flex items-center gap-3">
                        <div className="flex h-10 w-10 items-center justify-center rounded-lg border border-[#cfe0f1] bg-[#eef6ff] text-[#0b4edb]">
                            <Search className="w-5 h-5" />
                        </div>
                        <div className="min-w-0">
                            <p className="text-[11px] font-bold uppercase tracking-normal text-[#0b4edb]">
                                {t('reports.searchResult')}
                            </p>
                            <h3 className="truncate text-lg font-semibold text-[#07182f]">
                                {selectedTrackCode}
                            </h3>
                        </div>
                    </div>
                </div>

                {isTrackLoading ? (
                    <div className="space-y-4">
                        <Skeleton className="h-24 w-full rounded-lg" />
                        <Skeleton className="h-48 w-full rounded-lg" />
                    </div>
                ) : trackData ? (
                    <TrackResultCard data={trackData} />
                ) : (
                    <div className="flex flex-col items-center justify-center py-10 text-[#7d91a8]">
                        <Search className="w-16 h-16 opacity-20 mb-4" />
                        <p>{t('reports.notFound')}</p>
                    </div>
                )}
            </BottomDrawer>

            {/* Image Preview Modal */}
            <ImagePreviewModal
                src={previewImage}
                onClose={() => setPreviewImage(null)}
            />
        </div>
    );
}
