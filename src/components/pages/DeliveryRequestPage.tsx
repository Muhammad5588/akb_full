import { useState, useCallback, useRef, memo } from 'react';
import { useTranslation, Trans } from 'react-i18next';
import {
  ChevronRight,
  Truck,
  Package,
  Zap,
  Mail,
  Plane,
  Check,
  Copy,
  Upload,
  X,
  AlertTriangle,
  Wallet,
  Loader2,
  CheckCircle2,
  FileText,
  ArrowLeft,
  UserCog,
  Clock,
} from 'lucide-react';
import { toast } from 'sonner';
import {
  getPaidFlights,
  calculateUzpost,
  submitStandardDelivery,
  submitUzpostDelivery,
  type FlightItem,
  type CalculateUzpostResponse,
} from '@/api/services/deliveryService';

// ============================================
// TYPES
// ============================================

type DeliveryType = 'uzpost' | 'yandex' | 'akb' | 'bts';

interface DeliveryOption {
  id: DeliveryType;
  label: string;
  descKey: string;
  icon: React.ReactNode;
  iconBg: string;
}

interface Props {
  onBack: () => void;
  onNavigateToProfile?: () => void;
  onNavigateToHistory?: () => void;
}

// ============================================
// CONSTANTS
// ============================================

const DELIVERY_OPTIONS: DeliveryOption[] = [
  {
    id: 'uzpost',
    label: 'UzPost',
    descKey: 'deliveryRequest.options.uzpost',
    icon: <Mail className="w-8 h-8" />,
    iconBg: 'bg-[#eef6ff] text-[#0b4edb]',
  },
  {
    id: 'yandex',
    label: 'Yandex',
    descKey: 'deliveryRequest.options.yandex',
    icon: <Zap className="w-8 h-8" />,
    iconBg: 'bg-[#fff1f1] text-[#c44747]',
  },
  {
    id: 'akb',
    label: 'AKB Dostavka',
    descKey: 'deliveryRequest.options.akb',
    icon: <Package className="w-8 h-8" />,
    iconBg: 'bg-[#effbf5] text-[#15835b]',
  },
  {
    id: 'bts',
    label: 'BTS',
    descKey: 'deliveryRequest.options.bts',
    icon: <Truck className="w-8 h-8" />,
    iconBg: 'bg-[#eafaff] text-[#0784a6]',
  },
];

// ============================================
// SKELETON COMPONENTS
// ============================================

const FlightSkeleton = () => (
  <div className="space-y-3">
    {[1, 2, 3].map((i) => (
      <div
        key={i}
        className="h-20 rounded-lg bg-[#dbe8f4] animate-pulse"
      />
    ))}
  </div>
);

const CalcSkeleton = () => (
  <div className="space-y-4">
    <div className="h-10 rounded-lg bg-[#dbe8f4] animate-pulse w-3/4" />
    <div className="h-24 rounded-lg bg-[#dbe8f4] animate-pulse" />
    <div className="h-24 rounded-lg bg-[#dbe8f4] animate-pulse" />
    <div className="h-14 rounded-lg bg-[#dbe8f4] animate-pulse" />
  </div>
);

// ============================================
// STEP INDICATOR
// ============================================

const StepIndicator = memo(({ current, total }: { current: number; total: number }) => {
  const { t } = useTranslation();
  const labels = [
    t('deliveryRequest.stepper.type', 'Tur'),
    t('deliveryRequest.stepper.flight', 'Reys'),
    t('deliveryRequest.stepper.confirm', 'Tasdiq'),
    t('deliveryRequest.stepper.done', 'Yakun'),
  ];

  return (
    <div className="mb-5 rounded-lg border border-[#dbe8f4] bg-white p-3 shadow-[0_8px_20px_rgba(15,47,87,0.05)]">
      <div className="grid grid-cols-4 gap-2">
        {Array.from({ length: total }, (_, i) => {
          const step = i + 1;
          const isActive = step === current;
          const isComplete = step < current;

          return (
            <div key={step} className="min-w-0">
              <div
                className={`mb-2 h-1.5 rounded-full transition-colors duration-300 ${
                  isActive
                    ? 'bg-[#0b4edb]'
                    : isComplete
                    ? 'bg-[#37c5f3]'
                    : 'bg-[#dbe8f4]'
                }`}
              />
              <div className="flex items-center gap-1.5">
                <span
                  className={`flex h-5 w-5 shrink-0 items-center justify-center rounded-md text-[10px] font-bold ${
                    isActive
                      ? 'bg-[#0b4edb] text-white'
                      : isComplete
                      ? 'bg-[#eef7ff] text-[#0b4edb]'
                      : 'bg-[#f2f6fa] text-[#7d91a8]'
                  }`}
                >
                  {isComplete ? <Check className="h-3 w-3" /> : step}
                </span>
                <span
                  className={`truncate text-[10px] font-semibold ${
                    isActive ? 'text-[#07182f]' : 'text-[#7d91a8]'
                  }`}
                >
                  {labels[i]}
                </span>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
});

StepIndicator.displayName = 'StepIndicator';

const StepHeader = memo(({ title, subtitle }: { title: string; subtitle?: string }) => (
  <div className="mb-5">
    <p className="mb-1 text-[11px] font-semibold uppercase text-[#0b84e5]">AKB Cargo</p>
    <h2 className="text-2xl font-semibold leading-tight text-[#07182f] dark:text-[#ffffff]">{title}</h2>
    {subtitle && <p className="mt-2 text-sm leading-6 text-[#63758a] dark:text-[#ffffff]">{subtitle}</p>}
  </div>
));

StepHeader.displayName = 'StepHeader';

// ============================================
// STEP 1 — Delivery Type Selection
// ============================================

const StepTypeSelection = memo(
  ({ selectedType, onSelect }: { selectedType: DeliveryType | null; onSelect: (type: DeliveryType) => void }) => {
    const { t } = useTranslation();
    return (
    <div className="animate-in fade-in slide-in-from-right-4 duration-400">
      <StepHeader
        title={t('deliveryRequest.steps.type.title')}
        subtitle={t('deliveryRequest.steps.type.subtitle')}
      />

      <div className="grid grid-cols-2 gap-3">
        {DELIVERY_OPTIONS.map((opt) => {
          const selected = selectedType === opt.id;

          return (
            <button
              key={opt.id}
              onClick={() => onSelect(opt.id)}
              className={`
                relative min-h-[148px] overflow-hidden rounded-lg p-4 text-left
                border transition-all duration-200 active:scale-[0.97]
                ${selected
                  ? 'border-[#0b4edb] bg-[#eef7ff] shadow-[0_10px_22px_rgba(11,78,219,0.12)]'
                  : 'border-[#dbe8f4] bg-white shadow-[0_8px_18px_rgba(15,47,87,0.04)] hover:border-[#0b84e5] hover:bg-[#f8fbfe]'
                }
              `}
            >
              <div className="relative z-10 flex h-full flex-col">
                <div className="mb-4 flex items-start justify-between gap-2">
                  <div
                    className={`
                      flex h-12 w-12 items-center justify-center rounded-lg border border-white/70
                      ${selected ? 'bg-[#0b4edb] text-white' : opt.iconBg}
                    `}
                  >
                    {opt.icon}
                  </div>
                  <span
                    className={`flex h-6 w-6 items-center justify-center rounded-md border ${
                      selected
                        ? 'border-[#0b4edb] bg-[#0b4edb] text-white'
                        : 'border-[#cfe0f1] bg-white text-transparent'
                    }`}
                  >
                    <Check className="h-3.5 w-3.5" />
                  </span>
                </div>
                <h3 className="text-base font-semibold leading-tight text-[#07182f]">{opt.label}</h3>
                <p className="mt-1 text-xs leading-5 text-[#63758a]">{t(opt.descKey)}</p>
              </div>
            </button>
          );
        })}
      </div>
    </div>
    );
  }
);

// ============================================
// STEP 2 — Flight Selection
// ============================================

interface StepFlightProps {
  deliveryType: DeliveryType | null;
  flights: FlightItem[];
  loading: boolean;
  selected: string[];
  onToggle: (name: string) => void;
  onContinue: () => void;
  onBack: () => void;
}

const StepFlightSelection = memo(
  ({ deliveryType, flights, loading, selected, onToggle, onContinue, onBack }: StepFlightProps) => {
    const { t } = useTranslation();
    return (
    <div className="animate-in fade-in slide-in-from-right-4 duration-400">
      <StepHeader
        title={t('deliveryRequest.steps.flight.title')}
        subtitle={t('deliveryRequest.steps.flight.subtitle')}
      />
      {deliveryType === 'akb' && (
        <div className="mb-4 flex items-start gap-2 rounded-lg border border-[#cfe0f1] bg-[#eef7ff] p-3 text-xs font-medium text-[#0b2b53]">
          <Wallet className="mt-0.5 h-4 w-4 shrink-0 text-[#0b4edb]" />
          {t('deliveryRequest.steps.flight.akbNote')}
        </div>
      )}
      {deliveryType === 'yandex' && (
        <div className="mb-4 flex items-start gap-2 rounded-lg border border-[#cfe0f1] bg-[#eef7ff] p-3 text-xs font-medium text-[#0b2b53]">
          <Clock className="mt-0.5 h-4 w-4 shrink-0 text-[#0b4edb]" />
          {t('deliveryRequest.steps.flight.yandexNote')}
        </div>
      )}
      {deliveryType === 'bts' && (
        <div className="mb-4 flex items-start gap-2 rounded-lg border border-[#cfe0f1] bg-[#eef7ff] p-3 text-xs font-medium text-[#0b2b53]">
          <Clock className="mt-0.5 h-4 w-4 shrink-0 text-[#0b4edb]" />
          {t('deliveryRequest.steps.flight.btsNote')}
        </div>
      )}
      {loading ? (
        <FlightSkeleton />
      ) : flights.length === 0 ? (
        <div className="rounded-lg border border-[#dbe8f4] bg-white px-5 py-12 text-center shadow-[0_8px_20px_rgba(15,47,87,0.05)]">
          <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-lg bg-[#eef7ff] text-[#0b4edb]">
            <Plane className="h-8 w-8" />
          </div>
          <p className="text-[#63758a] font-semibold text-lg">
            {t('deliveryRequest.steps.flight.empty')}
          </p>
          <p className="text-[#7d91a8] text-sm mt-1">
            {t('deliveryRequest.steps.flight.emptyDesc')}
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {flights.map((f) => {
            const isChecked = selected.includes(f.flight_name);
            return (
              <button
                key={f.flight_name}
                onClick={() => onToggle(f.flight_name)}
                className={`
                  w-full flex items-center gap-4 p-4 rounded-lg text-left
                  transition-all duration-200 active:scale-[0.98]
                  border shadow-[0_8px_18px_rgba(15,47,87,0.04)]
                  ${
                    isChecked
                      ? 'border-[#0b4edb] bg-[#eef7ff]'
                      : 'border-[#dbe8f4] bg-white hover:border-[#0b84e5] hover:bg-[#f8fbfe]'
                  }
                `}
              >
                {/* Checkbox */}
                <div
                  className={`
                    w-7 h-7 rounded-lg flex items-center justify-center shrink-0
                    transition-all duration-200 border
                    ${
                      isChecked
                        ? 'bg-[#0b4edb] border-[#0b4edb]'
                        : 'border-[#cfe0f1] bg-white'
                    }
                  `}
                >
                  {isChecked && <Check className="w-4 h-4 text-white" strokeWidth={3} />}
                </div>

                {/* Flight Info */}
                <div className="flex-1 min-w-0">
                  <h3 className="font-semibold text-base text-[#07182f]">{f.display_name || f.flight_name}</h3>
                  <p className="text-xs text-[#63758a]">{t('deliveryRequest.steps.flight.flightLabel')}</p>
                </div>

                <Plane className="w-5 h-5 text-[#9fb7cc] shrink-0" />
              </button>
            );
          })}
        </div>
      )}

      {/* Bottom Actions */}
      <div className="mt-6 flex gap-3">
        <button
          onClick={onBack}
          className="
            flex-shrink-0 w-14 h-14 rounded-lg flex items-center justify-center
            bg-white border border-[#dbe8f4] text-[#63758a]
            active:scale-95 transition-colors hover:bg-[#f8fbfe]
          "
        >
          <ArrowLeft className="w-5 h-5" />
        </button>
        <button
          onClick={onContinue}
          disabled={selected.length === 0}
          className={`
            flex-1 h-14 rounded-lg font-semibold text-base
            flex items-center justify-center gap-2
            transition-all duration-200 active:scale-[0.98]
            ${
              selected.length > 0
                ? 'bg-[#0b4edb] text-white shadow-[0_10px_20px_rgba(11,78,219,0.18)] hover:bg-[#073fba]'
                : 'bg-[#e8eff6] text-[#9fb7cc] cursor-not-allowed'
            }
          `}
        >
          {t('deliveryRequest.steps.flight.continueButton')}
          <ChevronRight className="w-5 h-5" />
        </button>
      </div>
    </div>
    );
  }
);

// ============================================
// STEP 3A — Standard Confirmation (Yandex/AKB/BTS)
// ============================================

interface StepStandardProps {
  deliveryType: DeliveryType;
  selectedFlights: string[];
  flightDisplayMap: Record<string, string>;
  submitting: boolean;
  onSubmit: () => void;
  onBack: () => void;
}

const StepStandardConfirm = memo(
  ({ deliveryType, selectedFlights, flightDisplayMap, submitting, onSubmit, onBack }: StepStandardProps) => {
    const { t } = useTranslation();
    const typeLabel =
      DELIVERY_OPTIONS.find((o) => o.id === deliveryType)?.label ?? deliveryType;
    const displayFlights = selectedFlights.map((f) => flightDisplayMap[f] || f);

    return (
      <div className="animate-in fade-in slide-in-from-right-4 duration-400">
        <StepHeader
          title={t('deliveryRequest.steps.confirm.title')}
          subtitle={t('deliveryRequest.steps.confirm.subtitle')}
        />

        {/* Summary Card */}
        <div className="mb-4 rounded-lg border border-[#dbe8f4] bg-white p-5 shadow-[0_8px_20px_rgba(15,47,87,0.05)]">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-12 h-12 rounded-lg bg-[#eef6ff] flex items-center justify-center text-[#0b4edb]">
              <Truck className="w-6 h-6" />
            </div>
            <div>
              <p className="text-xs text-[#63758a]">{t('deliveryRequest.steps.confirm.deliveryType')}</p>
              <h3 className="text-lg font-semibold text-[#07182f]">{typeLabel}</h3>
            </div>
          </div>

          <div className="border-t border-[#edf3f8] pt-4">
            <p className="text-xs text-[#63758a] mb-2 font-medium">
              {t('deliveryRequest.steps.confirm.selectedFlights')}
            </p>
            <div className="flex flex-wrap gap-2">
              {selectedFlights.map((f, i) => (
                <span
                  key={f}
                  className="inline-flex items-center gap-1.5 rounded-lg border border-[#cfe0f1] bg-[#eef7ff] px-3 py-1.5 text-sm font-semibold text-[#0b4edb]"
                >
                  <Plane className="w-3.5 h-3.5" />
                  {displayFlights[i]}
                </span>
              ))}
            </div>
          </div>
        </div>

        {/* Info box */}
        <div className="mb-6 rounded-lg border border-[#cfe0f1] bg-[#eef7ff] p-4">
          <p className="text-sm text-[#0b2b53] font-medium">
            <Trans
              i18nKey="deliveryRequest.steps.confirm.infoMessage"
              values={{ type: typeLabel, flights: displayFlights.join(', ') }}
              components={{ strong: <strong /> }}
            />
          </p>
        </div>

        {/* Bottom Actions */}
        <div className="flex gap-3">
          <button
            onClick={onBack}
            className="
              flex-shrink-0 w-14 h-14 rounded-lg flex items-center justify-center
              bg-white border border-[#dbe8f4] text-[#63758a]
              active:scale-95 transition-colors hover:bg-[#f8fbfe]
            "
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
          <button
            onClick={onSubmit}
            disabled={submitting}
            className="
              flex-1 h-14 rounded-lg font-semibold text-base text-white
              flex items-center justify-center gap-2
              bg-[#0b4edb] hover:bg-[#073fba] active:scale-[0.98]
              shadow-[0_10px_20px_rgba(11,78,219,0.18)] transition-all duration-200
              disabled:opacity-60 disabled:cursor-not-allowed
            "
          >
            {submitting ? (
              <Loader2 className="w-5 h-5 animate-spin" />
            ) : (
              <>
                {t('deliveryRequest.steps.confirm.submitButton')}
                <Check className="w-5 h-5" />
              </>
            )}
          </button>
        </div>
      </div>
    );
  }
);

// ============================================
// STEP 3B — UzPost Calculation & Payment
// ============================================

interface StepUzpostProps {
  calcData: CalculateUzpostResponse | null;
  loading: boolean;
  selectedFlights: string[];
  flightDisplayMap: Record<string, string>;
  submitting: boolean;
  onSubmit: (walletUsed: number, file: File | null) => void;
  onBack: () => void;
}

function StepUzpostPayment({
  calcData,
  loading,
  selectedFlights,
  flightDisplayMap,
  submitting,
  onSubmit,
  onBack,
}: StepUzpostProps) {
  const { t } = useTranslation();
  const [useWallet, setUseWallet] = useState(false);
  const [receiptFile, setReceiptFile] = useState<File | null>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const walletApplied = useWallet && calcData ? Math.min(calcData.wallet_balance, calcData.total_amount) : 0;
  const remaining = calcData ? Math.max(calcData.total_amount - walletApplied, 0) : 0;

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0] ?? null;
    setReceiptFile(file);
    if (file && file.type.startsWith('image/')) {
      setPreview(URL.createObjectURL(file));
    } else {
      setPreview(null);
    }
  };

  const clearFile = () => {
    setReceiptFile(null);
    setPreview(null);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const handleCopy = (text: string) => {
    navigator.clipboard.writeText(text);
    toast.success(t('deliveryRequest.toast.copied'));
  };

  if (loading) {
    return (
      <div className="animate-in fade-in slide-in-from-right-4 duration-400">
        <StepHeader
          title={t('deliveryRequest.steps.uzpost.calcTitle')}
          subtitle={t('deliveryRequest.steps.uzpost.calcDesc')}
        />
        <CalcSkeleton />
      </div>
    );
  }

  // Weight warning screen
  if (calcData?.warning) {
    return (
      <div className="animate-in fade-in slide-in-from-right-4 duration-400">
        <StepHeader title={t('deliveryRequest.steps.uzpost.warningTitle')} />

        <div className="mb-6 rounded-lg border border-[#f0cccc] bg-[#fff7f7] p-6 text-center">
          <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-lg bg-[#fff1f1] text-[#c44747]">
            <AlertTriangle className="h-8 w-8" />
          </div>
          <p className="text-[#9f3131] font-bold text-lg mb-2">
            {t('deliveryRequest.steps.uzpost.weightExceeded')}
          </p>
          <p className="text-[#c44747] text-sm">{calcData.warning}</p>
        </div>

        <button
          onClick={onBack}
          className="
            w-full h-14 rounded-lg font-bold text-base
            flex items-center justify-center gap-2
            bg-white border border-[#dbe8f4] text-[#63758a]
            active:scale-[0.98] transition-colors hover:bg-[#f8fbfe]
          "
        >
          <ArrowLeft className="w-5 h-5" />
          {t('deliveryRequest.steps.uzpost.backButton')}
        </button>
      </div>
    );
  }

  if (!calcData) return null;

  const fullyCoveredByWallet = remaining <= 0;

  return (
    <div className="animate-in fade-in slide-in-from-right-4 duration-400">
      <StepHeader
        title={t('deliveryRequest.steps.uzpost.paymentTitle')}
        subtitle={t('deliveryRequest.steps.uzpost.flightsFor', { flights: selectedFlights.map((f) => flightDisplayMap[f] || f).join(', ') })}
      />

      {/* Summary Grid */}
      <div className="grid grid-cols-2 gap-3 mb-4">
        <div className="rounded-lg border border-[#dbe8f4] bg-white p-4 shadow-[0_8px_20px_rgba(15,47,87,0.05)]">
          <p className="text-xs text-[#63758a] mb-1">{t('deliveryRequest.steps.uzpost.totalWeight')}</p>
          <p className="text-xl font-extrabold text-[#07182f]">{calcData.total_weight} kg</p>
        </div>
        <div className="rounded-lg border border-[#dbe8f4] bg-white p-4 shadow-[0_8px_20px_rgba(15,47,87,0.05)]">
          <p className="text-xs text-[#63758a] mb-1">{t('deliveryRequest.steps.uzpost.totalAmount')}</p>
          <p className="text-xl font-extrabold text-[#0b4edb]">
            {calcData.total_amount.toLocaleString()} so'm
          </p>
        </div>
      </div>

      {/* Wallet Toggle */}
      <div className="mb-4 rounded-lg border border-[#dbe8f4] bg-white p-4 shadow-[0_8px_20px_rgba(15,47,87,0.05)]">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-[#eef7ff] flex items-center justify-center text-[#0b4edb]">
              <Wallet className="w-5 h-5" />
            </div>
            <div>
              <p className="font-semibold text-sm">{t('deliveryRequest.steps.uzpost.walletPay')}</p>
              <p className="text-xs text-[#63758a]">
                {t('deliveryRequest.steps.uzpost.walletBalance', { balance: calcData.wallet_balance.toLocaleString() })}
              </p>
            </div>
          </div>

          {/* Toggle */}
          <button
            onClick={() => setUseWallet(!useWallet)}
            className={`
              relative w-14 h-8 rounded-full transition-colors duration-300
              ${useWallet ? 'bg-[#0b4edb]' : 'bg-[#cfe0f1]'}
            `}
          >
            <div
              className={`
                absolute top-1 w-6 h-6 rounded-full bg-white shadow-md
                transition-transform duration-300
                ${useWallet ? 'translate-x-7' : 'translate-x-1'}
              `}
            />
          </button>
        </div>

        {useWallet && (
          <div className="mt-3 pt-3 border-t border-[#edf3f8] space-y-1">
            <div className="flex justify-between text-sm">
              <span className="text-[#63758a]">{t('deliveryRequest.steps.uzpost.fromWallet')}</span>
              <span className="font-bold text-[#15835b]">
                -{walletApplied.toLocaleString()} so'm
              </span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-[#63758a]">{t('deliveryRequest.steps.uzpost.remainingPayment')}</span>
              <span className="font-extrabold text-lg text-[#07182f]">
                {remaining.toLocaleString()} so'm
              </span>
            </div>
          </div>
        )}
      </div>

      {/* Card Info (only if payment remains) */}
      {!fullyCoveredByWallet && calcData.card && (
        <div className="mb-4 rounded-lg border border-[#dbe8f4] bg-white p-4 shadow-[0_8px_20px_rgba(15,47,87,0.05)]">
          <p className="text-xs text-[#63758a] mb-2 font-medium">
            {t('deliveryRequest.steps.uzpost.paymentCard')}
          </p>
          <div className="flex items-center justify-between">
            <div>
              <p className="font-mono font-bold text-lg tracking-normal">
                {calcData.card.card_number}
              </p>
              <p className="text-xs text-[#63758a]">
                {calcData.card.card_owner}
              </p>
            </div>
            <button
              onClick={() => handleCopy(calcData.card!.card_number)}
              className="
                w-11 h-11 rounded-lg flex items-center justify-center
                bg-[#eef7ff] text-[#0b4edb]
                active:scale-90 transition-transform
              "
            >
              <Copy className="w-5 h-5" />
            </button>
          </div>
        </div>
      )}

      {/* File Upload (only if payment remains) */}
      {!fullyCoveredByWallet && (
        <div className="mb-6">
          <p className="text-xs text-[#63758a] mb-2 font-medium">
            {t('deliveryRequest.steps.uzpost.uploadReceipt')}
          </p>

          {receiptFile ? (
            <div className="rounded-lg border-2 border-dashed border-[#0b84e5] bg-white p-4">
              {preview ? (
                <div className="relative mb-3">
                  <img
                    src={preview}
                    alt="Receipt preview"
                    className="w-full max-h-48 object-contain rounded-lg"
                  />
                  <button
                    onClick={clearFile}
                    className="absolute top-2 right-2 w-8 h-8 rounded-lg bg-[#c44747] text-white flex items-center justify-center active:scale-90 transition-transform shadow-lg"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>
              ) : (
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <FileText className="w-8 h-8 text-[#0b4edb]" />
                    <div>
                      <p className="font-semibold text-sm truncate max-w-[200px]">
                        {receiptFile.name}
                      </p>
                    <p className="text-xs text-[#7d91a8]">
                        {(receiptFile.size / 1024).toFixed(0)} KB
                      </p>
                    </div>
                  </div>
                  <button
                    onClick={clearFile}
                    className="w-8 h-8 rounded-full bg-[#fff1f1] text-[#c44747] flex items-center justify-center active:scale-90 transition-transform"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>
              )}
            </div>
          ) : (
            <button
              onClick={() => fileInputRef.current?.click()}
              className="
                w-full rounded-lg border-2 border-dashed
                border-[#cfe0f1]
                hover:border-[#0b84e5]
                bg-[#f8fbfe]
                p-8 flex flex-col items-center justify-center gap-3
                transition-all duration-200 active:scale-[0.98] group
              "
            >
              <div className="w-14 h-14 rounded-lg bg-[#eef7ff] flex items-center justify-center text-[#0b4edb] group-hover:scale-105 transition-transform">
                <Upload className="w-7 h-7" />
              </div>
              <div className="text-center">
                <p className="font-bold text-sm text-[#334a62]">
                  {t('deliveryRequest.steps.uzpost.uploadButton')}
                </p>
                <p className="text-xs text-[#7d91a8] mt-0.5">
                  {t('deliveryRequest.steps.uzpost.uploadHint')}
                </p>
              </div>
            </button>
          )}

          <input
            ref={fileInputRef}
            type="file"
            accept="image/*,.pdf"
            className="hidden"
            onChange={handleFileChange}
          />
        </div>
      )}

      {/* Bottom Actions */}
      <div className="flex gap-3">
        <button
          onClick={onBack}
          className="
            flex-shrink-0 w-14 h-14 rounded-lg flex items-center justify-center
            bg-white border border-[#dbe8f4] text-[#63758a]
            active:scale-95 transition-colors hover:bg-[#f8fbfe]
          "
        >
          <ArrowLeft className="w-5 h-5" />
        </button>
        <button
          onClick={() => onSubmit(walletApplied, receiptFile)}
          disabled={submitting || (!fullyCoveredByWallet && !receiptFile)}
          className={`
            flex-1 h-14 rounded-lg font-semibold text-base text-white
            flex items-center justify-center gap-2
            transition-all duration-200 active:scale-[0.98]
            ${
              submitting || (!fullyCoveredByWallet && !receiptFile)
                ? 'bg-[#e8eff6] text-[#9fb7cc] cursor-not-allowed'
                : 'bg-[#0b4edb] hover:bg-[#073fba] shadow-[0_10px_20px_rgba(11,78,219,0.18)]'
            }
          `}
        >
          {submitting ? (
            <Loader2 className="w-5 h-5 animate-spin" />
          ) : (
            <>
              {t('deliveryRequest.steps.uzpost.submitButton')}
              <Check className="w-5 h-5" />
            </>
          )}
        </button>
      </div>
    </div>
  );
}

// ============================================
// STEP 4 — Success
// ============================================

const StepSuccess = memo(({ onGoHome }: { onGoHome: () => void }) => {
  const { t } = useTranslation();
  return (
  <div className="animate-in fade-in zoom-in-95 duration-500 rounded-lg border border-[#dbe8f4] bg-white px-5 py-8 text-center shadow-[0_8px_20px_rgba(15,47,87,0.05)]">
    <div className="w-20 h-20 mx-auto rounded-lg bg-[#eef7ff] flex items-center justify-center mb-6">
      <CheckCircle2 className="w-12 h-12 text-[#0b4edb]" />
    </div>
    <h2 className="text-2xl font-semibold mb-2 text-[#07182f]">{t('deliveryRequest.steps.success.title')}</h2>
    <p className="text-[#63758a] text-sm max-w-xs mx-auto mb-8">
      {t('deliveryRequest.steps.success.desc')}
    </p>

    <button
      onClick={onGoHome}
      className="
        w-full max-w-xs mx-auto h-14 rounded-lg font-semibold text-base text-white
        flex items-center justify-center gap-2
        bg-[#0b4edb] hover:bg-[#073fba] active:scale-[0.98]
        shadow-[0_10px_20px_rgba(11,78,219,0.18)] transition-all duration-200
      "
    >
      {t('deliveryRequest.steps.success.homeButton')}
    </button>
  </div>
  );
});

// ============================================
// PROFILE INCOMPLETE ALERT
// ============================================

const ProfileIncompleteAlert = memo(
  ({ onGoProfile, onBack }: { onGoProfile?: () => void; onBack: () => void }) => {
    const { t } = useTranslation();
    return (
    <div className="animate-in fade-in zoom-in-95 duration-400 rounded-lg border border-[#dbe8f4] bg-white px-5 py-8 text-center shadow-[0_8px_20px_rgba(15,47,87,0.05)]">
      <div className="w-20 h-20 mx-auto rounded-lg bg-[#fff1f1] flex items-center justify-center mb-5">
        <UserCog className="w-10 h-10 text-[#c44747]" />
      </div>
      <h2 className="text-xl font-semibold mb-2 text-[#07182f]">{t('deliveryRequest.profile.title')}</h2>
      <p className="text-[#63758a] text-sm max-w-xs mx-auto mb-6">
        {t('deliveryRequest.profile.desc')}
      </p>

      <div className="space-y-3 max-w-xs mx-auto">
        {onGoProfile && (
          <button
            onClick={onGoProfile}
            className="
              w-full h-14 rounded-lg font-semibold text-base text-white
              flex items-center justify-center gap-2
              bg-[#0b4edb] hover:bg-[#073fba] active:scale-[0.98]
              shadow-[0_10px_20px_rgba(11,78,219,0.18)] transition-all duration-200
            "
          >
            <UserCog className="w-5 h-5" />
            {t('deliveryRequest.profile.fillButton')}
          </button>
        )}
        <button
          onClick={onBack}
          className="
            w-full h-14 rounded-lg font-semibold text-base
            flex items-center justify-center gap-2
            bg-white border border-[#dbe8f4] text-[#63758a]
            active:scale-[0.98] transition-colors hover:bg-[#f8fbfe]
          "
        >
          <ArrowLeft className="w-5 h-5" />
          {t('deliveryRequest.steps.uzpost.backButton')}
        </button>
      </div>
    </div>
    );
  }
);

// ============================================
// MAIN COMPONENT
// ============================================

export default function DeliveryRequestPage({ onBack, onNavigateToProfile, onNavigateToHistory }: Props) {
  const { t } = useTranslation();
  // Wizard state
  const [currentStep, setCurrentStep] = useState(1);
  const [deliveryType, setDeliveryType] = useState<DeliveryType | null>(null);
  const [selectedFlights, setSelectedFlights] = useState<string[]>([]);

  // API state
  const [flights, setFlights] = useState<FlightItem[]>([]);
  const [flightDisplayMap, setFlightDisplayMap] = useState<Record<string, string>>({});
  const [flightsLoading, setFlightsLoading] = useState(false);
  const [calcData, setCalcData] = useState<CalculateUzpostResponse | null>(null);
  const [calcLoading, setCalcLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [profileIncomplete, setProfileIncomplete] = useState(false);

  const totalSteps = deliveryType === 'uzpost' ? 4 : 4;

  // ---- Actions ----

  const handleTypeSelect = useCallback(async (type: DeliveryType) => {
    setDeliveryType(type);
    setSelectedFlights([]);
    setCalcData(null);
    setProfileIncomplete(false);
    setCurrentStep(2);
    setFlightsLoading(true);

    try {
      const res = await getPaidFlights();
      setFlights(res.flights);
      setFlightDisplayMap(Object.fromEntries(res.flights.map((f) => [f.flight_name, f.display_name])));
    } catch (err: unknown) {
      const e = err as { message?: string };
      toast.error(e?.message || t('deliveryRequest.toast.flightsError'));
      setFlights([]);
      setFlightDisplayMap({});
    } finally {
      setFlightsLoading(false);
    }
  }, [t]);

  const toggleFlight = useCallback((name: string) => {
    setSelectedFlights((prev) =>
      prev.includes(name) ? prev.filter((n) => n !== name) : [...prev, name]
    );
  }, []);

  const handleFlightContinue = useCallback(async () => {
    if (deliveryType === 'uzpost') {
      setCurrentStep(3);
      setCalcLoading(true);
      try {
        const res = await calculateUzpost(selectedFlights);
        setCalcData(res);
      } catch (err: unknown) {
        const e = err as { message?: string };
        toast.error(e?.message || t('deliveryRequest.toast.calcError'));
      } finally {
        setCalcLoading(false);
      }
    } else {
      setCurrentStep(3);
    }
  }, [deliveryType, selectedFlights, t]);

  const handleStandardSubmit = useCallback(async () => {
    if (!deliveryType || deliveryType === 'uzpost') return;
    setSubmitting(true);
    try {
      await submitStandardDelivery(deliveryType as 'yandex' | 'akb' | 'bts', selectedFlights);
      setCurrentStep(4);
    } catch (err: unknown) {
      const e = err as { status?: number; message?: string };
      if (e?.status === 400 && e?.message?.toLowerCase().includes('profile')) {
        setProfileIncomplete(true);
      } else {
        toast.error(e?.message || t('deliveryRequest.toast.submitError'));
      }
    } finally {
      setSubmitting(false);
    }
  }, [deliveryType, selectedFlights, t]);

  const handleUzpostSubmit = useCallback(
    async (walletUsed: number, file: File | null) => {
      setSubmitting(true);
      try {
        await submitUzpostDelivery(selectedFlights, walletUsed, file);
        setCurrentStep(4);
      } catch (err: unknown) {
        const e = err as { status?: number; message?: string };
        if (e?.status === 400 && e?.message?.toLowerCase().includes('profile')) {
          setProfileIncomplete(true);
        } else {
          toast.error(e?.message || t('deliveryRequest.toast.submitError'));
        }
      } finally {
        setSubmitting(false);
      }
    },
    [selectedFlights, t]
  );

  const goBackStep = useCallback(() => {
    setProfileIncomplete(false);
    if (currentStep > 1) {
      setCurrentStep((s) => s - 1);
    } else {
      onBack();
    }
  }, [currentStep, onBack]);

  // ---- Render ----

  // Profile incomplete overlay
  if (profileIncomplete) {
    return (
      <div className="pb-8">
        {/* Header */}
        <div className="mb-5 flex items-center gap-3">
          <button
            onClick={() => setProfileIncomplete(false)}
            className="flex h-10 w-10 items-center justify-center rounded-lg border border-[#dbe8f4] bg-white text-[#63758a] transition-colors active:scale-95 hover:bg-[#f8fbfe]"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
          <div>
            <p className="text-[11px] font-semibold uppercase text-[#0b84e5]">AKB Cargo</p>
            <h1 className="text-lg font-semibold text-[#07182f] dark:text-[#ffffff]">{t('deliveryRequest.headerTitleShort')}</h1>
          </div>
        </div>
        <ProfileIncompleteAlert
          onGoProfile={onNavigateToProfile}
          onBack={() => setProfileIncomplete(false)}
        />
      </div>
    );
  }

  return (
    <div className="pb-8">
      {/* Header */}
      <div className="mb-3 flex items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <button
            onClick={currentStep === 1 ? onBack : goBackStep}
            className="flex h-10 w-10 items-center justify-center rounded-lg border border-[#dbe8f4] bg-white text-[#63758a] transition-colors active:scale-95 hover:bg-[#f8fbfe]"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
          <div>
            <p className="text-[11px] font-semibold uppercase text-[#0b84e5]">AKB Cargo</p>
            <h1 className="text-lg font-semibold leading-tight text-[#07182f] dark:text-[#ffffff]">{t('deliveryRequest.headerTitle')}</h1>
          </div>
        </div>
        {onNavigateToHistory && (
          <button
            onClick={onNavigateToHistory}
            className="flex items-center gap-1.5 rounded-lg border border-[#cfe0f1] bg-[#eef7ff] px-3 py-2 text-xs font-semibold text-[#0b4edb] transition-colors active:scale-95 hover:bg-[#e1f0ff]"
          >
            <Clock className="w-3.5 h-3.5" />
            {t('deliveryRequest.historyButton')}
          </button>
        )}
      </div>

      {/* Step Progress */}
      {currentStep < 4 && <StepIndicator current={currentStep} total={totalSteps} />}

      {/* Steps */}
      {currentStep === 1 && <StepTypeSelection selectedType={deliveryType} onSelect={handleTypeSelect} />}

      {currentStep === 2 && (
        <StepFlightSelection
          deliveryType={deliveryType}
          flights={flights}
          loading={flightsLoading}
          selected={selectedFlights}
          onToggle={toggleFlight}
          onContinue={handleFlightContinue}
          onBack={goBackStep}
        />
      )}

      {currentStep === 3 && deliveryType === 'uzpost' && (
        <StepUzpostPayment
          calcData={calcData}
          loading={calcLoading}
          selectedFlights={selectedFlights}
          flightDisplayMap={flightDisplayMap}
          submitting={submitting}
          onSubmit={handleUzpostSubmit}
          onBack={goBackStep}
        />
      )}

      {currentStep === 3 && deliveryType && deliveryType !== 'uzpost' && (
        <StepStandardConfirm
          deliveryType={deliveryType}
          selectedFlights={selectedFlights}
          flightDisplayMap={flightDisplayMap}
          submitting={submitting}
          onSubmit={handleStandardSubmit}
          onBack={goBackStep}
        />
      )}

      {currentStep === 4 && <StepSuccess onGoHome={onBack} />}
    </div>
  );
}
