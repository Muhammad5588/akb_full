import { useMemo, useState } from 'react';
import { useInfiniteQuery, useQuery } from '@tanstack/react-query';
import { motion } from 'framer-motion';
import {
  ArrowLeft,
  ReceiptText,
  Calendar as CalendarIcon,
  CreditCard,
  CheckCircle2,
  Clock,
  AlertCircle,
  Wallet,
  TrendingDown,
} from 'lucide-react';
import { paymentService, type TransactionHistoryItem } from '@/api/services/paymentService';
import { walletService } from '@/api/services/walletService';
import { formatTashkentDateTime } from '@/lib/format';
import { UniqueBackground } from '@/components/ui/UniqueBackground';
import { useTranslation } from 'react-i18next';
import MakePaymentModal from '@/components/modals/MakePaymentModal';

interface UserHistoryPageProps {
  onBack?: () => void;
}

type PaymentStatus = TransactionHistoryItem['payment_status'];

const statusMeta: Record<PaymentStatus, { labelKey: string; className: string; Icon: typeof CheckCircle2 } > = {
  paid: {
    labelKey: 'paymentHistory.status.paid',
    className: 'bg-[#effbf5] text-[#15835b] border-[#ccebdc]',
    Icon: CheckCircle2,
  },
  partial: {
    labelKey: 'paymentHistory.status.partial',
    className: 'bg-[#eef6ff] text-[#0b4edb] border-[#cfe0f1]',
    Icon: Clock,
  },
  pending: {
    labelKey: 'paymentHistory.status.pending',
    className: 'bg-[#fff1f1] text-[#c44747] border-[#f0cccc]',
    Icon: Clock,
  },
};

const formatMoney = (value: number) => `${value.toLocaleString('uz-UZ')} so'm`;

const BreakdownBadge = ({ label, value }: { label: string; value: number }) => (
  <div className="flex items-center justify-between rounded-lg bg-white border border-[#dbe8f4] px-2.5 sm:px-3 py-2 text-xs font-semibold text-[#334a62]">
    <span className="truncate mr-1">{label}</span>
    <span className="text-xs sm:text-sm text-[#07182f] whitespace-nowrap">{value.toLocaleString('uz-UZ')}</span>
  </div>
);

const SummaryValueCard = ({
  label,
  amount,
  helper,
  tone,
  icon: Icon,
  loading,
}: {
  label: string;
  amount: number;
  helper: string;
  tone: 'positive' | 'debt';
  icon: typeof Wallet;
  loading: boolean;
}) => {
  const toneClasses = tone === 'positive'
    ? {
      shell: 'border-[#ccebdc] bg-[#f6fffb]',
      icon: 'bg-[#effbf5] text-[#15835b] border-[#ccebdc]',
      value: 'text-[#15835b]',
    }
    : {
      shell: 'border-[#f0cccc] bg-[#fff8f8]',
      icon: 'bg-[#fff1f1] text-[#c44747] border-[#f0cccc]',
      value: 'text-[#c44747]',
    };

  return (
    <div className={`rounded-lg border p-4 shadow-[0_8px_20px_rgba(10,35,70,0.05)] ${toneClasses.shell}`}>
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="text-[11px] font-bold uppercase tracking-normal text-[#63758a]">{label}</p>
          {loading ? (
            <div className="mt-3 h-7 w-28 animate-pulse rounded-lg bg-[#dbe8f4]" />
          ) : (
            <p className={`mt-2 text-2xl font-black leading-none tracking-normal ${toneClasses.value}`}>
              {formatMoney(amount)}
            </p>
          )}
          <p className="mt-1 text-xs font-medium text-[#63758a]">{helper}</p>
        </div>
        <div className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-lg border ${toneClasses.icon}`}>
          <Icon className="h-5 w-5" />
        </div>
      </div>
    </div>
  );
};

const HistoryCard = ({ item }: { item: TransactionHistoryItem }) => {
  const { t } = useTranslation();
  const StatusIcon = statusMeta[item.payment_status].Icon;

  const showBreakdown = item.payment_status === 'paid' || item.payment_status === 'partial';
  const breakdownEntries = useMemo(
    () => [
      { key: 'click', label: t('paymentHistory.breakdownTypes.click'), value: item.breakdown.click },
      { key: 'payme', label: t('paymentHistory.breakdownTypes.payme'), value: item.breakdown.payme },
      { key: 'cash', label: t('paymentHistory.breakdownTypes.cash'), value: item.breakdown.cash },
      { key: 'card', label: t('paymentHistory.breakdownTypes.card'), value: item.breakdown.card },
    ],
    [item.breakdown.click, item.breakdown.payme, item.breakdown.cash, item.breakdown.card, t],
  );

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      className="relative overflow-hidden rounded-lg border border-[#dbe8f4] bg-white shadow-sm p-4 sm:p-5"
    >
      <div className="relative flex items-start justify-between gap-3">
        <div className="space-y-1 min-w-0 flex-1">
          <p className="text-xs font-semibold text-[#63758a] uppercase tracking-normal">{t('paymentHistory.card.flight')}</p>
          <h3 className="text-base sm:text-lg md:text-xl font-bold text-[#07182f] leading-tight truncate" title={item.flight_name}>{item.flight_name}</h3>
          <p className="text-xs sm:text-sm text-[#63758a] flex items-center gap-1">
            <CalendarIcon className="w-4 h-4 sm:w-5 sm:h-5" />
            {formatTashkentDateTime(item.created_at, 'uz')}
          </p>
        </div>
        <span
          className={`inline-flex items-center gap-1 sm:gap-1.5 px-2 sm:px-3 py-1 sm:py-1.5 rounded-full text-[10px] sm:text-xs font-bold border whitespace-nowrap shrink-0 ${statusMeta[item.payment_status].className}`}
        >
          <StatusIcon className="w-3 h-3 sm:w-4 sm:h-4" />
          {t(statusMeta[item.payment_status].labelKey)}
        </span>
      </div>

      <div className="relative mt-4 grid grid-cols-2 gap-2 sm:gap-3">
        <div className="rounded-lg bg-[#f8fbfe] border border-[#edf3f8] p-3">
          <p className="text-[11px] sm:text-xs text-[#63758a] font-semibold">{t('paymentHistory.card.totalAmount')}</p>
          <p className="text-base sm:text-lg font-bold text-[#07182f]">{formatMoney(item.total_amount)}</p>
        </div>
        <div className="rounded-lg bg-[#f8fbfe] border border-[#edf3f8] p-3">
          <p className="text-[11px] sm:text-xs text-[#63758a] font-semibold">{t('paymentHistory.card.paid')}</p>
          <p className="text-base sm:text-lg font-bold text-[#15835b]">{formatMoney(item.paid_amount)}</p>
        </div>
        <div className="rounded-lg bg-[#f8fbfe] border border-[#edf3f8] p-3">
          <p className="text-[11px] sm:text-xs text-[#63758a] font-semibold">{t('paymentHistory.card.remaining')}</p>
          <p className="text-base sm:text-lg font-bold text-[#c44747]">{formatMoney(item.remaining_amount)}</p>
        </div>
        <div className="rounded-lg bg-[#f8fbfe] border border-[#edf3f8] p-3">
          <p className="text-[11px] sm:text-xs text-[#63758a] font-semibold flex items-center gap-1">
            <CreditCard className="w-4 h-4 sm:w-5 sm:h-5" />
            {t('paymentHistory.card.paymentType')}
          </p>
          <p className="text-sm sm:text-base font-bold text-[#07182f] capitalize truncate" title={item.payment_type}>{item.payment_type}</p>
          <p className="text-[11px] sm:text-xs text-[#63758a] mt-1">{item.is_taken_away ? t('paymentHistory.card.takenAway') : t('paymentHistory.card.notTakenAway')}</p>
        </div>
      </div>

      {showBreakdown && (
        <div className="relative mt-4 p-3 rounded-lg bg-[#f8fbfe] border border-[#edf3f8]">
          <div className="flex items-center gap-2 mb-3 text-sm sm:text-base font-semibold text-[#07182f]">
            <ReceiptText className="w-4 h-4 sm:w-5 sm:h-5" />
            {t('paymentHistory.card.breakdown')}
          </div>
          <div className="grid grid-cols-2 gap-2">
            {breakdownEntries.map((entry) => (
              <BreakdownBadge key={entry.key} label={entry.label} value={entry.value} />
            ))}
          </div>
        </div>
      )}
    </motion.div>
  );
};

const SkeletonCard = () => (
  <div className="relative overflow-hidden rounded-lg border border-[#dbe8f4] bg-white shadow-sm p-5">
    <div className="absolute inset-0 bg-gradient-to-br from-white/70 to-white/30 dark:from-white/10 dark:to-white/5 animate-pulse" />
    <div className="relative space-y-4">
      <div className="h-4 w-2/5 bg-[#e8eff6] rounded-full" />
      <div className="h-7 w-3/5 bg-[#e8eff6] rounded-full" />
      <div className="grid grid-cols-2 gap-2 sm:gap-3">
        {[...Array(4)].map((_, idx) => (
          <div key={idx} className="h-14 rounded-lg bg-[#e8eff6]" />
        ))}
      </div>
      <div className="grid grid-cols-2 gap-2">
        {[...Array(4)].map((_, idx) => (
          <div key={idx} className="h-8 rounded-lg bg-[#e8eff6]" />
        ))}
      </div>
    </div>
  </div>
);

export default function UserHistoryPage({ onBack }: UserHistoryPageProps) {
  const { t } = useTranslation();
  const [isPaymentOpen, setIsPaymentOpen] = useState(false);
  const {
    data,
    isLoading,
    isFetchingNextPage,
    fetchNextPage,
    hasNextPage,
    isError,
    refetch,
  } = useInfiniteQuery({
    queryKey: ['payment-history'],
    queryFn: ({ pageParam = 0 }) => paymentService.getPaymentHistory(10, pageParam),
    getNextPageParam: (lastPage) => {
      const nextOffset = lastPage.offset + lastPage.items.length;
      return nextOffset < lastPage.total_count ? nextOffset : undefined;
    },
    initialPageParam: 0,
  });

  const {
    data: walletData,
    isLoading: isWalletLoading,
    refetch: refetchWallet,
  } = useQuery({
    queryKey: ['walletBalance'],
    queryFn: walletService.getWalletBalance,
  });

  const items = data?.pages.flatMap((page) => page.items) ?? [];
  const totalCount = data?.pages?.[0]?.total_count ?? 0;
  const walletBalance = walletData?.wallet_balance ?? 0;
  const debt = walletData?.debt ?? 0;
  const debtAmount = debt < 0 ? Math.abs(debt) : 0;

  const handlePaymentClose = () => {
    setIsPaymentOpen(false);
    refetch();
    refetchWallet();
  };

  return (
    <div className="min-h-screen bg-[#f4f8fc] text-[#07182f] pb-28 pt-20 relative">
      <UniqueBackground />

      <div className="container mx-auto px-4 max-w-lg md:max-w-3xl lg:max-w-5xl relative z-10">
        <div className="rounded-lg border border-[#dbe8f4] bg-white p-4 shadow-[0_10px_24px_rgba(10,35,70,0.06)]">
          <div className="flex items-start justify-between gap-3">
            <div className="min-w-0">
              {onBack && (
                <button
                  onClick={onBack}
                  className="mb-3 inline-flex items-center gap-2 rounded-lg border border-[#dbe8f4] bg-[#f8fbfe] px-3 py-2 text-sm font-semibold text-[#63758a] transition hover:bg-[#eef6ff] hover:text-[#0b4edb]"
                >
                  <ArrowLeft className="w-4 h-4" />
                  {t('paymentHistory.back')}
                </button>
              )}
              <p className="text-[11px] font-bold text-[#0b4edb] uppercase tracking-normal">
                {t('paymentHistory.subtitle')}
              </p>
              <h1 className="mt-1 text-3xl font-semibold text-[#07182f]">
                {t('paymentHistory.financialCenter', 'Moliyaviy markaz')}
              </h1>
              <p className="mt-1 text-sm text-[#63758a]">
                {t('paymentHistory.desc')}
              </p>
            </div>
            <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-lg border border-[#cfe0f1] bg-[#eef6ff] text-[#0b4edb]">
              <CreditCard className="h-5 w-5" />
            </div>
          </div>

          <div className="mt-5 grid grid-cols-1 gap-3 sm:grid-cols-2">
            <SummaryValueCard
              label={t('wallet.modal.availableBalance', "Mavjud mablag'")}
              amount={walletBalance}
              helper={t('paymentHistory.summary.balanceHelper', 'Hamyon balansi')}
              tone="positive"
              icon={Wallet}
              loading={isWalletLoading}
            />
            <SummaryValueCard
              label={t('wallet.modal.activeDebt', 'Umumiy qarz')}
              amount={debtAmount}
              helper={t('paymentHistory.summary.debtHelper', "To'lanishi kerak")}
              tone="debt"
              icon={TrendingDown}
              loading={isWalletLoading}
            />
          </div>

          <button
            onClick={() => setIsPaymentOpen(true)}
            className="mt-4 flex h-12 w-full items-center justify-center gap-2 rounded-lg bg-[#0b4edb] px-4 text-base font-bold text-white shadow-[0_10px_20px_rgba(11,78,219,0.18)] transition hover:bg-[#073fba] active:scale-[0.99]"
          >
            <CreditCard className="h-5 w-5" />
            {t('reports.pay', "To'lov qilish")}
          </button>
        </div>

        {isError && (
          <div className="relative overflow-hidden rounded-lg border border-[#f3caca] bg-[#fff1f1] p-4 text-[#c44747] mt-6">
            <div className="flex items-start gap-2">
              <AlertCircle className="w-5 h-5" />
              <div>
                <p className="font-bold">{t('paymentHistory.error.title')}</p>
                <p className="text-sm opacity-80">{t('paymentHistory.error.desc')}</p>
              </div>
            </div>
            <div className="mt-3 flex gap-2">
              <button
                onClick={() => refetch()}
                className="px-3 py-2 rounded-lg bg-[#c44747] text-white text-sm font-semibold shadow-sm"
              >
                {t('paymentHistory.error.retry')}
              </button>
              {onBack && (
                <button
                  onClick={onBack}
                  className="px-3 py-2 rounded-lg border border-[#dbe8f4] bg-white text-sm font-semibold text-[#63758a] hover:bg-[#eef6ff]"
                >
                  {t('paymentHistory.error.home')}
                </button>
              )}
            </div>
          </div>
        )}

        <div className="mt-6 flex items-center justify-between gap-3">
          <div>
            <p className="text-[11px] font-bold uppercase tracking-normal text-[#0b4edb] dark:text-[#fff1f1]">
              {t('paymentHistory.historyLabel', "To'lovlar")}
            </p>
            <h2 className="text-xl font-semibold text-[#07182f] dark:text-[#f3f3f3]">
              {t('paymentHistory.title')}
            </h2>
          </div>
          <span className="rounded-full border border-[#dbe8f4] bg-white px-3 py-1.5 text-xs font-bold text-[#63758a]">
            {totalCount}
          </span>
        </div>

        {isLoading && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-6 mt-4">
            {[...Array(3)].map((_, idx) => (
              <SkeletonCard key={idx} />
            ))}
          </div>
        )}

        {!isLoading && !isError && items.length === 0 && (
          <div className="relative overflow-hidden rounded-lg border border-[#dbe8f4] bg-white shadow-[0_8px_22px_rgba(10,35,70,0.06)] p-8 text-center mt-4">
            <div className="flex items-center justify-center w-14 h-14 mx-auto rounded-lg bg-[#eef6ff] text-[#0b4edb] mb-3">
              <ReceiptText className="w-6 h-6" />
            </div>
            <h3 className="text-lg font-bold text-[#07182f]">{t('paymentHistory.emptyState.title')}</h3>
            <p className="text-sm text-[#63758a] mt-1">{t('paymentHistory.emptyState.desc')}</p>
          </div>
        )}

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-6 mt-4">
          {items.map((item) => (
            <HistoryCard key={item.id} item={item} />
          ))}
        </div>

        {hasNextPage && !isError && (
          <div className="flex justify-center pt-4 pb-10">
            <button
              onClick={() => fetchNextPage()}
              disabled={isFetchingNextPage}
              className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-[#0b4edb] text-white font-semibold shadow-sm disabled:opacity-60 disabled:cursor-not-allowed"
            >
              {isFetchingNextPage ? t('paymentHistory.loading') : t('paymentHistory.loadMore', { current: items.length, total: totalCount })}
            </button>
          </div>
        )}
      </div>

      <MakePaymentModal
        isOpen={isPaymentOpen}
        onClose={handlePaymentClose}
      />
    </div>
  );
}
