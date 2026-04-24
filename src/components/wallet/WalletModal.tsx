import { useState, useRef, memo } from 'react';
import { createPortal } from 'react-dom';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import {
    Upload, Loader2, CreditCard, CheckCircle, AlertCircle, Wallet,
    Copy, Check, X, Plane, Calendar, ChevronDown, ArrowDownToLine,
    Receipt, Bell, TrendingDown
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { walletService, type PaymentReminderItem } from '@/api/services/walletService';
import { toast } from 'sonner';
import { useTranslation } from 'react-i18next';
import { cn } from '@/lib/utils';
import MakePaymentModal from '@/components/modals/MakePaymentModal';

interface WalletModalProps {
    isOpen: boolean;
    onClose: () => void;
}

type TabKey = 'reminders' | 'pay-debt' | 'refund';

// --- Reminder Card (reused from old PaymentReminders) ---
const ReminderCard = memo(({ reminder, idx, onPay }: { reminder: PaymentReminderItem; idx: number; onPay: (flightName: string) => void }) => {
    const [isExpanded, setIsExpanded] = useState(false);
    const { t } = useTranslation();

    return (
        <motion.div
            layout
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: idx * 0.07, duration: 0.35 }}
        >
            <Card
                onClick={() => setIsExpanded(!isExpanded)}
                className={cn(
                    "relative overflow-hidden border border-[#dbe8f4] shadow-[0_8px_20px_rgba(10,35,70,0.05)] bg-white transition-all cursor-pointer group",
                    isExpanded ? "border-[#0b84e5] ring-2 ring-[#37c5f3]/20" : "hover:border-[#0b84e5]"
                )}
            >
                <div className={cn(
                    "absolute left-0 top-0 bottom-0 w-1 transition-colors duration-300",
                    isExpanded ? "bg-[#0b4edb]" : "bg-[#cfe0f1] group-hover:bg-[#0b84e5]"
                )} />

                <CardContent className="p-4 pl-5">
                    <div className="flex justify-between items-start">
                        <div className="flex items-center gap-2.5">
                            <div className="p-2 bg-[#eef6ff] rounded-lg text-[#0b4edb]">
                                <Plane className="w-4 h-4" />
                            </div>
                            <div>
                                <h4 className="font-bold text-[#07182f] text-base leading-tight">
                                    {reminder.flight}
                                </h4>
                                <p className="text-[11px] text-[#63758a] font-medium mt-0.5">
                                    {t('profile.payments.cargoPayment', "Kargo to'lovi")}
                                </p>
                            </div>
                        </div>
                        <motion.div animate={{ rotate: isExpanded ? 180 : 0 }} className="text-[#7d91a8]">
                            <ChevronDown className="w-4 h-4" />
                        </motion.div>
                    </div>

                    <div className="mt-3 flex justify-between items-end">
                        <Badge variant="outline" className="bg-[#f8fbfe] text-[#63758a] border-[#dbe8f4] gap-1 py-0.5 px-2 text-[11px]">
                            <Calendar className="w-3 h-3" />
                            {reminder.deadline}
                        </Badge>
                        <div className="text-right">
                            <span className="text-[10px] uppercase font-bold text-[#7d91a8] block mb-0.5">{t('profile.payments.remaining', "Qoldiq")}</span>
                            <span className="text-base font-black text-[#c44747]">
                                {reminder.remaining.toLocaleString()} so'm
                            </span>
                        </div>
                    </div>

                    <AnimatePresence>
                        {isExpanded && (
                            <motion.div
                                initial={{ opacity: 0, height: 0 }}
                                animate={{ opacity: 1, height: "auto" }}
                                exit={{ opacity: 0, height: 0 }}
                                transition={{ duration: 0.25, ease: "easeInOut" }}
                                className="overflow-hidden"
                            >
                                <div className="pt-3 mt-3 border-t border-dashed border-[#dbe8f4] space-y-2">
                                    <div className="flex justify-between items-center text-sm">
                                        <span className="text-[#63758a]">{t('profile.payments.totalCharged', "Jami")}</span>
                                        <span className="font-semibold text-[#07182f]">{reminder.total.toLocaleString()}</span>
                                    </div>
                                    <div className="flex justify-between items-center text-sm">
                                        <span className="text-[#63758a]">{t('profile.payments.totalPaid', "To'langan")}</span>
                                        <span className="font-semibold text-[#15835b]">{reminder.paid.toLocaleString()}</span>
                                    </div>
                                    <div className="pt-2">
                                        <Button
                                            className="w-full rounded-lg bg-[#0b4edb] hover:bg-[#073fba] text-white shadow-sm h-10 font-semibold"
                                            onClick={(e) => { e.stopPropagation(); onPay(reminder.flight); }}
                                        >
                                            <CreditCard className="w-4 h-4 mr-2" />
                                            {t('profile.payments.payNow', "Hozir to'lash")}
                                        </Button>
                                    </div>
                                </div>
                            </motion.div>
                        )}
                    </AnimatePresence>
                </CardContent>
            </Card>
        </motion.div>
    );
});
ReminderCard.displayName = 'ReminderCard';

// --- Main WalletModal ---
export function WalletModal({ isOpen, onClose }: WalletModalProps) {
    const { t } = useTranslation();
    const queryClient = useQueryClient();
    const fileInputRef = useRef<HTMLInputElement>(null);
    const [file, setFile] = useState<File | null>(null);
    const [refundAmount, setRefundAmount] = useState('');
    const [selectedCardId, setSelectedCardId] = useState<string>('');
    const [copied, setCopied] = useState(false);
    const [activeTab, setActiveTab] = useState<TabKey>('reminders');
    const [paymentFlight, setPaymentFlight] = useState<string | null>(null);
    const [isPaymentOpen, setIsPaymentOpen] = useState(false);

    // Fetch balance (new schema)
    const { data: walletData, isLoading: isBalanceLoading } = useQuery({
        queryKey: ['walletBalance'],
        queryFn: walletService.getWalletBalance,
        enabled: isOpen,
    });

    const walletBalance = walletData?.wallet_balance ?? 0;
    const debt = walletData?.debt ?? 0;
    const hasDebt = debt < 0;
    const reminders = walletData?.reminders ?? [];

    // Fetch active company card ONLY if debt exists
    const { data: activeCard, isLoading: isActiveCardLoading } = useQuery({
        queryKey: ['activeCompanyCard'],
        queryFn: walletService.getActiveCompanyCard,
        enabled: isOpen && hasDebt,
    });

    const { data: cardsData } = useQuery({
        queryKey: ['walletCards'],
        queryFn: walletService.getWalletCards,
        enabled: isOpen,
    });

    // Mutations
    const getErrorMessage = (error: unknown, fallback: string) => {
        if (typeof error === 'object' && error !== null) {
            const e = error as { message?: string; data?: { detail?: string } };
            return e.data?.detail ?? e.message ?? fallback;
        }
        return fallback;
    };

    const payDebtMutation = useMutation({
        mutationFn: walletService.payDebt,
        onSuccess: () => {
            toast.success(t('wallet.modal.receiptSent', "To'lov cheki yuborildi"));
            queryClient.invalidateQueries({ queryKey: ['walletBalance'] });
            handleClose();
        },
        onError: (error: unknown) => {
            toast.error(getErrorMessage(error, t('wallet.modal.errorOccurred', "Xatolik yuz berdi")));
        }
    });

    // Temporarily disabled — will be re-enabled when refund feature goes live
    // const refundMutation = useMutation({
    //     mutationFn: walletService.requestRefund,
    //     onSuccess: () => {
    //         toast.success(t('wallet.modal.refundSent'));
    //         queryClient.invalidateQueries({ queryKey: ['walletBalance'] });
    //         handleClose();
    //     },
    //     onError: (error: unknown) => {
    //         toast.error(getErrorMessage(error, t('wallet.modal.errorOccurred')));
    //     }
    // });

    const canRefund = walletBalance >= 5000;

    const handleClose = () => {
        setFile(null);
        setRefundAmount('');
        setSelectedCardId('');
        setPaymentFlight(null);
        setIsPaymentOpen(false);
        onClose();
    };

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files && e.target.files[0]) {
            const selectedFile = e.target.files[0];
            const allowedTypes = [
                "image/jpeg", "image/jpg", "image/png", "image/webp",
                "image/heic", "image/heif", "application/pdf",
            ];
            const isHeic = selectedFile.name.toLowerCase().endsWith('.heic') || selectedFile.name.toLowerCase().endsWith('.heif');
            if (!allowedTypes.includes(selectedFile.type) && !isHeic) {
                toast.error(t('wallet.modal.formatError', "Faqat rasm (JPG, PNG, HEIC) yoki PDF formatidagi fayllarni yuklang."));
                if (fileInputRef.current) fileInputRef.current.value = '';
                return;
            }
            const maxSize = 10 * 1024 * 1024;
            if (selectedFile.size > maxSize) {
                toast.error(t('wallet.modal.sizeError', "Fayl hajmi 10MB dan oshmasligi kerak."));
                if (fileInputRef.current) fileInputRef.current.value = '';
                return;
            }
            setFile(selectedFile);
        }
    };

    const handlePayDebt = () => {
        if (!file) return;
        const formData = new FormData();
        formData.append('receipt', file);
        payDebtMutation.mutate(formData);
    };

    // Temporarily disabled — will be re-enabled when refund feature goes live
    // const handleRefund = () => {
    //     if (!refundAmount || !selectedCardId) return;
    //     refundMutation.mutate({
    //         amount: Number(refundAmount),
    //         card_id: Number(selectedCardId)
    //     });
    // };

    const copyToClipboard = (text: string) => {
        navigator.clipboard.writeText(text);
        setCopied(true);
        toast.success(t('wallet.modal.copiedState', "Karta raqami nusxalandi"));
        setTimeout(() => setCopied(false), 2000);
    };

    // Build available tabs
    const tabs: { key: TabKey; label: string; icon: React.ReactNode; count?: number }[] = [];
    if (reminders.length > 0) {
        tabs.push({ key: 'reminders', label: t('wallet.tabs.reminders'), icon: <Bell className="w-4 h-4" />, count: reminders.length });
    }
    if (hasDebt) {
        tabs.push({ key: 'pay-debt', label: t('wallet.tabs.payDebt'), icon: <Receipt className="w-4 h-4" /> });
    }
    if (walletBalance > 0) {
        tabs.push({ key: 'refund', label: t('wallet.tabs.refund'), icon: <ArrowDownToLine className="w-4 h-4" /> });
    }

    // Default to first available tab
    const resolvedTab = tabs.find(tab => tab.key === activeTab) ? activeTab : (tabs[0]?.key ?? 'reminders');

    if (typeof document === 'undefined') return null;

    const modalContent = (
        <>
            <AnimatePresence>
                {isOpen && (
                    <div className="fixed inset-0 z-[100] flex items-end md:items-center justify-center">
                        {/* Backdrop */}
                        <motion.div
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            transition={{ duration: 0.2 }}
                            onClick={handleClose}
                            className="absolute inset-0 bg-[#07182f]/35"
                        />

                        {/* Modal / Bottom Sheet */}
                        <motion.div
                            initial={{ y: '100%', opacity: 0 }}
                            animate={{ y: 0, opacity: 1 }}
                            exit={{ y: '100%', opacity: 0 }}
                            transition={{ type: 'spring', damping: 30, stiffness: 300 }}
                            className={cn(
                                "relative w-full max-h-[92vh] flex flex-col",
                                "bg-[#f4f8fc]",
                                "rounded-t-lg md:rounded-lg",
                                "md:max-w-lg md:mx-4",
                                "shadow-[0_18px_48px_rgba(10,35,70,0.18)] border border-[#dbe8f4]",
                                "overflow-hidden"
                            )}
                        >
                            {/* Drag Handle (mobile) */}
                            <div className="md:hidden flex justify-center pt-3 pb-1">
                                <div className="w-10 h-1 rounded-full bg-[#cfe0f1]" />
                            </div>

                            {/* Header with close */}
                            <div className="flex items-start justify-between gap-4 px-5 pt-3 pb-3 md:pt-5">
                                <div className="min-w-0">
                                    <p className="text-[11px] font-bold uppercase tracking-normal text-[#0b4edb]">
                                        {t('wallet.modal.subtitle', 'AKB Cargo')}
                                    </p>
                                    <h2 className="mt-1 text-2xl font-semibold text-[#07182f]">
                                        {t('wallet.modal.title', "Moliyaviy markaz")}
                                    </h2>
                                    <p className="mt-1 text-sm text-[#63758a]">
                                        {t('wallet.modal.description', "Balans, qarz va to'lov amallari")}
                                    </p>
                                </div>
                                <button
                                    onClick={handleClose}
                                    className="shrink-0 p-2 rounded-lg border border-[#dbe8f4] bg-white hover:bg-[#eef6ff] transition-colors"
                                    aria-label="Close"
                                >
                                    <X className="w-5 h-5 text-[#63758a]" />
                                </button>
                            </div>

                            {/* Scrollable content */}
                            <div className="flex-1 overflow-y-auto overscroll-contain px-5 pb-8 space-y-5">

                                {/* Loading state */}
                                {isBalanceLoading ? (
                                    <div className="flex flex-col items-center justify-center py-16">
                                        <Loader2 className="h-8 w-8 animate-spin text-[#0b4edb] mb-4" />
                                        <p className="text-[#63758a] text-sm">{t('wallet.modal.loading', "Ma'lumotlar yuklanmoqda...")}</p>
                                    </div>
                                ) : (
                                    <>
                                        {/* Metric Cards */}
                                        <div className="grid grid-cols-2 gap-3">
                                            {/* Available Balance */}
                                            <motion.div
                                                initial={{ opacity: 0, scale: 0.95 }}
                                                animate={{ opacity: 1, scale: 1 }}
                                                transition={{ delay: 0.1 }}
                                                className="relative overflow-hidden rounded-lg bg-[#f6fffb] border border-[#ccebdc] p-4 shadow-[0_8px_20px_rgba(10,35,70,0.05)]"
                                            >
                                                <div className="flex items-center gap-2 mb-2">
                                                    <div className="p-1.5 bg-[#effbf5] rounded-lg border border-[#ccebdc]">
                                                        <Wallet className="w-4 h-4 text-[#15835b]" />
                                                    </div>
                                                    <span className="text-[11px] font-semibold text-[#63758a] uppercase tracking-normal">
                                                        {t('wallet.modal.availableBalance', "Balans")}
                                                    </span>
                                                </div>
                                                <p className="text-xl font-black text-[#15835b] tracking-normal">
                                                    {walletBalance.toLocaleString()}
                                                </p>
                                                <p className="text-[10px] text-[#7d91a8] font-medium">so'm</p>
                                            </motion.div>

                                            {/* Debt */}
                                            <motion.div
                                                initial={{ opacity: 0, scale: 0.95 }}
                                                animate={{ opacity: 1, scale: 1 }}
                                                transition={{ delay: 0.15 }}
                                                className="relative overflow-hidden rounded-lg bg-[#fff8f8] border border-[#f0cccc] p-4 shadow-[0_8px_20px_rgba(10,35,70,0.05)]"
                                            >
                                                <div className="flex items-center gap-2 mb-2">
                                                    <div className="p-1.5 bg-[#fff1f1] rounded-lg border border-[#f0cccc]">
                                                        <TrendingDown className="w-4 h-4 text-[#c44747]" />
                                                    </div>
                                                    <span className="text-[11px] font-semibold text-[#63758a] uppercase tracking-normal">
                                                        {t('wallet.modal.activeDebt', "Qarz")}
                                                    </span>
                                                </div>
                                                <p className={cn(
                                                    "text-xl font-black tracking-normal",
                                                    hasDebt ? "text-[#c44747]" : "text-[#9fb7cc]"
                                                )}>
                                                    {hasDebt ? Math.abs(debt).toLocaleString() : '0'}
                                                </p>
                                                <p className="text-[10px] text-[#7d91a8] font-medium">so'm</p>
                                            </motion.div>
                                        </div>

                                        <Button
                                            onClick={() => {
                                                setPaymentFlight(null);
                                                setIsPaymentOpen(true);
                                            }}
                                            className="w-full h-12 rounded-lg bg-[#0b4edb] hover:bg-[#073fba] text-white font-semibold shadow-[0_10px_20px_rgba(11,78,219,0.18)]"
                                        >
                                            <CreditCard className="w-4 h-4 mr-2" />
                                            {t('reports.pay', "To'lov qilish")}
                                        </Button>

                                        {/* Warning text */}
                                        {walletData?.warning_text && (
                                            <div className="bg-[#fff8e6] border border-[#f1dfad] rounded-lg p-3 flex items-start gap-2.5">
                                                <AlertCircle className="w-4 h-4 text-[#936b14] mt-0.5 shrink-0" />
                                                <p className="text-xs text-[#936b14]">{walletData.warning_text.replace(/<\/?b>/g, ' ').replace(/⚠/g, '').trim()}</p>
                                            </div>
                                        )}

                                        {/* Tabs */}
                                        {tabs.length > 0 && (
                                            <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-hide">
                                                {tabs.map((tab) => (
                                                    <button
                                                        key={tab.key}
                                                        onClick={() => setActiveTab(tab.key)}
                                                        className={cn(
                                                            "flex items-center gap-1.5 px-4 py-2.5 rounded-lg text-sm font-semibold whitespace-nowrap transition-all",
                                                            resolvedTab === tab.key
                                                                ? "bg-[#0b4edb] text-white shadow-sm"
                                                                : "bg-white text-[#63758a] border border-[#dbe8f4] hover:bg-[#eef6ff] hover:text-[#0b4edb]"
                                                        )}
                                                    >
                                                        {tab.icon}
                                                        {tab.label}
                                                        {tab.count != null && (
                                                            <span className={cn(
                                                                "ml-1 text-[10px] font-bold px-1.5 py-0.5 rounded-full",
                                                                resolvedTab === tab.key
                                                                    ? "bg-white/20 text-white"
                                                                    : "bg-[#fff1f1] text-[#c44747]"
                                                            )}>
                                                                {tab.count}
                                                            </span>
                                                        )}
                                                    </button>
                                                ))}
                                            </div>
                                        )}

                                        {/* Tab Content */}
                                        <AnimatePresence mode="wait">
                                            {/* --- REMINDERS TAB --- */}
                                            {resolvedTab === 'reminders' && reminders.length > 0 && (
                                                <motion.div
                                                    key="reminders"
                                                    initial={{ opacity: 0, x: -10 }}
                                                    animate={{ opacity: 1, x: 0 }}
                                                    exit={{ opacity: 0, x: 10 }}
                                                    transition={{ duration: 0.2 }}
                                                    className="space-y-3"
                                                >
                                                    {reminders.map((reminder, idx) => (
                                                        <ReminderCard
                                                            key={`${reminder.flight}-${idx}`}
                                                            reminder={reminder}
                                                            idx={idx}
                                                            onPay={(flightName) => {
                                                                setPaymentFlight(flightName);
                                                                setIsPaymentOpen(true);
                                                            }}
                                                        />
                                                    ))}
                                                </motion.div>
                                            )}

                                            {/* --- PAY DEBT TAB --- */}
                                            {resolvedTab === 'pay-debt' && hasDebt && (
                                                <motion.div
                                                    key="pay-debt"
                                                    initial={{ opacity: 0, x: -10 }}
                                                    animate={{ opacity: 1, x: 0 }}
                                                    exit={{ opacity: 0, x: 10 }}
                                                    transition={{ duration: 0.2 }}
                                                    className="space-y-4"
                                                >
                                                    <div className="bg-[#fff1f1] border border-[#f3caca] rounded-lg p-4 flex items-start gap-3">
                                                        <AlertCircle className="h-5 w-5 text-[#c44747] mt-0.5 shrink-0" />
                                                        <div>
                                                            <h3 className="text-sm font-semibold text-[#c44747]">
                                                                {t('wallet.modal.debtExists', "Qarzdorlik mavjud")}
                                                            </h3>
                                                            <p className="text-sm text-[#8f3a3a] mt-1">
                                                                {t('wallet.modal.debtMessage', "Sizda {{amount}} so'm qarzdorlik mavjud. Iltimos, quyidagi kartaga to'lov qiling va chekni yuklang.", { amount: Math.abs(debt).toLocaleString() })}
                                                            </p>
                                                        </div>
                                                    </div>

                                                    {/* Active Company Card */}
                                                    {isActiveCardLoading ? (
                                                        <div className="h-40 w-full bg-[#dbe8f4] animate-pulse rounded-lg" />
                                                    ) : activeCard ? (
                                                        <div className="relative overflow-hidden rounded-lg bg-white p-5 text-[#07182f] shadow-[0_8px_20px_rgba(10,35,70,0.05)] border border-[#dbe8f4]">
                                                            <div className="relative z-10">
                                                                <div className="flex justify-between items-start mb-5">
                                                                    <div className="flex h-9 w-12 items-center justify-center rounded-lg border border-[#cfe0f1] bg-[#eef6ff]">
                                                                        <CreditCard className="h-5 w-5 text-[#0b4edb]" />
                                                                    </div>
                                                                    <Button
                                                                        variant="outline"
                                                                        size="sm"
                                                                        className="rounded-lg border-[#cfe0f1] bg-[#eef6ff] text-[#0b4edb] hover:bg-[#e1f0ff] hover:text-[#0b4edb]"
                                                                        onClick={() => copyToClipboard(activeCard.card_number)}
                                                                    >
                                                                        {copied ? <Check className="h-4 w-4 mr-1.5" /> : <Copy className="h-4 w-4 mr-1.5" />}
                                                                        {copied ? t('wallet.modal.copySuccess', "Nusxalandi") : t('wallet.modal.copyAction', "Nusxalash")}
                                                                    </Button>
                                                                </div>
                                                                <div className="space-y-3">
                                                                    <div>
                                                                        <p className="text-xs text-[#63758a] uppercase mb-1 font-semibold">{t('wallet.cards.cardNumber', "Karta raqami")}</p>
                                                                        <p className="font-mono text-lg tracking-normal truncate text-[#07182f]">{activeCard.card_number.replace(/(\d{4})/g, '$1 ').trim()}</p>
                                                                    </div>
                                                                    <div>
                                                                        <p className="text-xs text-[#63758a] uppercase mb-1 font-semibold">{t('wallet.cards.cardHolder', "Egasi")}</p>
                                                                        <p className="font-medium uppercase tracking-normal truncate text-[#07182f]">{activeCard.holder_name}</p>
                                                                    </div>
                                                                </div>
                                                            </div>
                                                        </div>
                                                    ) : (
                                                        <div className="text-center p-6 border border-dashed rounded-lg bg-white border-[#cfe0f1]">
                                                            <AlertCircle className="h-10 w-10 text-[#0b4edb] mx-auto mb-3" />
                                                            <h4 className="text-sm font-semibold text-[#07182f]">{t('wallet.modal.paymentPaused', "To'lov qabul qilish vaqtincha to'xtatilgan")}</h4>
                                                            <p className="text-sm text-[#63758a] mt-1">
                                                                {t('wallet.modal.noActiveCard', "Hozirda faol karta mavjud emas.")}
                                                            </p>
                                                        </div>
                                                    )}

                                                    {activeCard && (
                                                        <>
                                                            <div className="space-y-3">
                                                                <Label className="text-sm font-semibold">{t('wallet.modal.uploadReceipt', "To'lov chekini yuklash")}</Label>
                                                                <div
                                                                    onClick={() => fileInputRef.current?.click()}
                                                                    className={cn(
                                                                        "border-2 border-dashed rounded-lg p-5 flex flex-col items-center justify-center cursor-pointer transition-colors",
                                                                        file
                                                                            ? "border-[#22a06b] bg-[#effbf5]"
                                                                            : "border-[#cfe0f1] hover:border-[#0b84e5] hover:bg-[#f8fbfe]"
                                                                    )}
                                                                >
                                                                    <input
                                                                        type="file"
                                                                        ref={fileInputRef}
                                                                        onChange={handleFileChange}
                                                                        accept="image/*,application/pdf"
                                                                        className="hidden"
                                                                    />
                                                                    {file ? (
                                                                        <>
                                                                            <CheckCircle className="h-8 w-8 text-emerald-500 mb-2" />
                                                                            <p className="text-sm font-medium text-[#15835b]">{file.name}</p>
                                                                            <p className="text-xs text-emerald-500 mt-1">{t('wallet.modal.clickToChange', "O'zgartirish uchun bosing")}</p>
                                                                        </>
                                                                    ) : (
                                                                        <>
                                                                            <Upload className="h-7 w-7 text-[#0b4edb] mb-2" />
                                                                            <p className="text-sm font-medium text-[#07182f]">{t('wallet.modal.clickToSelect', "Chekni tanlash uchun bosing")}</p>
                                                                            <p className="mt-1 text-xs text-[#63758a]">JPG, PNG, HEIC, PDF - 10MB</p>
                                                                        </>
                                                                    )}
                                                                </div>
                                                            </div>

                                                            <Button
                                                                onClick={handlePayDebt}
                                                                disabled={!file || payDebtMutation.isPending}
                                                                className="w-full h-12 text-base rounded-lg bg-[#0b4edb] hover:bg-[#073fba] text-white shadow-sm"
                                                            >
                                                                {payDebtMutation.isPending ? <Loader2 className="animate-spin mr-2" /> : null}
                                                                {t('wallet.modal.sendReceipt', "Chekni yuborish")}
                                                            </Button>
                                                        </>
                                                    )}
                                                </motion.div>
                                            )}

                                            {/* --- REFUND TAB (Coming Soon) --- */}
                                            {resolvedTab === 'refund' && (
                                                <motion.div
                                                    key="refund"
                                                    initial={{ opacity: 0, x: -10 }}
                                                    animate={{ opacity: 0.8, x: 0 }}
                                                    exit={{ opacity: 0, x: 10 }}
                                                    transition={{ duration: 0.2 }}
                                                    className="space-y-4"
                                                >
                                                    {/* Coming Soon notice */}
                                                    <div className="bg-[#eef6ff] border border-[#cfe0f1] rounded-lg p-4 flex items-start gap-3">
                                                        <AlertCircle className="h-5 w-5 text-[#0b4edb] mt-0.5 shrink-0" />
                                                        <div>
                                                            <h3 className="text-sm font-semibold text-[#07182f]">{t('wallet.modal.comingSoon')}</h3>
                                                        </div>
                                                    </div>

                                                    {canRefund ? (
                                                        <>
                                                            <div className="bg-[#effbf5] border border-[#ccebdc] rounded-lg p-4 flex items-start gap-3">
                                                                <CheckCircle className="h-5 w-5 text-[#15835b] mt-0.5 shrink-0" />
                                                                <div>
                                                                    <h3 className="text-sm font-semibold text-[#15835b]">{t('wallet.modal.sufficientFunds')}</h3>
                                                                    <p className="text-sm text-[#15835b] mt-1">
                                                                        {t('wallet.modal.refundAvailable', { amount: walletBalance.toLocaleString() })}
                                                                    </p>
                                                                </div>
                                                            </div>

                                                            <div className="space-y-3 pointer-events-none">
                                                                <div className="space-y-2">
                                                                    <Label className="text-sm font-semibold">{t('wallet.modal.refundAmount')}</Label>
                                                                    <div className="relative">
                                                                        <Input
                                                                            type="number"
                                                                            value={refundAmount}
                                                                            onChange={(e) => setRefundAmount(e.target.value)}
                                                                            placeholder="0"
                                                                            max={walletBalance}
                                                                            disabled
                                                                            className="pl-4 pr-12 h-12 text-lg rounded-lg border-[#dbe8f4] bg-[#f8fbfe]"
                                                                        />
                                                                        <span className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-500 text-sm font-medium">so'm</span>
                                                                    </div>
                                                                    <p className="text-xs text-gray-500 text-right">{t('wallet.modal.maxAmount', { amount: walletBalance.toLocaleString() })}</p>
                                                                </div>

                                                                <div className="space-y-2">
                                                                    <Label className="text-sm font-semibold">{t('wallet.modal.selectCard')}</Label>
                                                                    <Select value={selectedCardId} onValueChange={setSelectedCardId} disabled>
                                                                        <SelectTrigger className="h-12 w-full rounded-lg border-[#dbe8f4] bg-[#f8fbfe]">
                                                                            <SelectValue placeholder={t('wallet.modal.selectCard')} />
                                                                        </SelectTrigger>
                                                                        <SelectContent>
                                                                            {cardsData?.cards.length === 0 ? (
                                                                                <div className="p-2 text-sm text-center text-gray-500">{t('wallet.modal.noCardsAvailable')}</div>
                                                                            ) : (
                                                                                cardsData?.cards.map((card) => (
                                                                                    <SelectItem key={card.id} value={String(card.id)}>
                                                                                        <div className="flex items-center gap-2">
                                                                                            <CreditCard className="h-4 w-4 text-gray-500" />
                                                                                            <span>{card.masked_number}</span>
                                                                                            <span className="text-xs text-gray-400">({card.holder_name})</span>
                                                                                        </div>
                                                                                    </SelectItem>
                                                                                ))
                                                                            )}
                                                                        </SelectContent>
                                                                    </Select>
                                                                </div>
                                                            </div>

                                                            <Button
                                                                disabled
                                                                className="w-full h-12 text-base rounded-lg bg-[#22a06b] text-white shadow-sm cursor-not-allowed"
                                                            >
                                                                {t('wallet.modal.sendRequest')} (Coming Soon)
                                                            </Button>
                                                        </>
                                                    ) : (
                                                        <div className="flex flex-col items-center justify-center py-8 text-center">
                                                            <div className="w-16 h-16 bg-[#eef6ff] rounded-lg flex items-center justify-center mb-4">
                                                                <Wallet className="h-8 w-8 text-gray-400" />
                                                            </div>
                                                            <h3 className="text-base font-semibold text-[#07182f] mb-2">{t('wallet.modal.insufficientBalance')}</h3>
                                                            <p className="text-[#63758a] text-sm max-w-xs mx-auto">
                                                                {t('wallet.modal.minBalanceRequired', { amount: walletBalance.toLocaleString() })}
                                                            </p>
                                                        </div>
                                                    )}
                                                </motion.div>
                                            )}
                                        </AnimatePresence>

                                        {/* Fallback: No tabs available (no debt, no balance, no reminders) */}
                                        {tabs.length === 0 && (
                                            <motion.div
                                                initial={{ opacity: 0, scale: 0.95 }}
                                                animate={{ opacity: 1, scale: 1 }}
                                                className="flex flex-col items-center justify-center py-8 text-center"
                                            >
                                                <div className="w-16 h-16 bg-[#effbf5] rounded-lg flex items-center justify-center mb-4">
                                                    <CheckCircle className="h-8 w-8 text-emerald-500" />
                                                </div>
                                                <h3 className="text-base font-semibold text-[#07182f] mb-2">
                                                    {t('wallet.modal.allClear', "Hammasi yaxshi!")}
                                                </h3>
                                                <p className="text-[#63758a] text-sm max-w-xs mx-auto">
                                                    {t('wallet.modal.noActions', "Hozircha hech qanday amal talab qilinmaydi.")}
                                                </p>
                                            </motion.div>
                                        )}
                                    </>
                                )}
                            </div>
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>

            {/* Payment Modal for reminders — renders on top without closing WalletModal */}
            <MakePaymentModal
                isOpen={isPaymentOpen}
                onClose={() => {
                    setIsPaymentOpen(false);
                    setPaymentFlight(null);
                    queryClient.invalidateQueries({ queryKey: ['walletBalance'] });
                }}
                preselectedFlightName={paymentFlight}
            />
        </>
    );

    return createPortal(modalContent, document.body);
}
