import { useState, useMemo, useCallback, memo } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { motion, AnimatePresence } from 'framer-motion';
import { toast } from 'sonner';
import {
  Building2, CreditCard, Link2, FileText, Plane,
  Plus, Pencil, Trash2, Check, X, Loader2,
  ToggleLeft, ToggleRight, Save,
} from 'lucide-react';

import {
  listPartners, listPaymentMethods, createPaymentMethod,
  updatePaymentMethod, deletePaymentMethod,
  getFotoHisobot, updateFotoHisobot,
  listAliases, createAlias, updateAlias, deleteAlias,
  type Partner, type PaymentMethod, type PaymentMethodCreate,
  type PaymentMethodUpdate, type FlightAliasCreate,
} from '../../api/services/partnerService';
import LightSelect from '../ui/LightSelect';

type TabKey = 'methods' | 'foto' | 'aliases';

const ONLINE_PROVIDERS = [
  { value: 'Click', label: 'Click', url: 'https://click.uz/' },
  { value: 'Payme', label: 'Payme', url: 'https://payme.uz/' },
] as const;

interface PartnersManagerProps {
  embedded?: boolean;
}

export default function PartnersManager({ embedded = false }: PartnersManagerProps) {
  const [selectedPartnerId, setSelectedPartnerId] = useState<number | null>(null);
  const [tab, setTab] = useState<TabKey>('methods');

  const partnersQuery = useQuery({
    queryKey: ['admin-partners'],
    queryFn: listPartners,
    staleTime: 60_000,
  });

  const partners = useMemo(() => partnersQuery.data ?? [], [partnersQuery.data]);

  const partnerOptions = useMemo(
    () => partners.map((p) => ({ value: String(p.id), label: `${p.display_name} (${p.code})` })),
    [partners],
  );

  // Derived effective id falls back to first partner — no setState-in-effect.
  const effectiveId = selectedPartnerId ?? partners[0]?.id ?? null;
  const selected = partners.find((p) => p.id === effectiveId) ?? null;

  return (
    <div className={embedded ? '' : 'min-h-screen bg-[#f5f5f4] dark:bg-[#0a0a0a]'}>
      <div className={`max-w-5xl mx-auto ${embedded ? '' : 'px-3 sm:px-5 py-4 sm:py-6'}`}>

        {!embedded && (
          <div className="flex items-center gap-3 mb-5">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-blue-500 to-cyan-500 flex items-center justify-center shadow-md shadow-blue-500/20">
              <Building2 className="w-5 h-5 text-white" />
            </div>
            <div>
              <h1 className="text-[17px] font-bold text-gray-900 dark:text-white tracking-tight">
                Partnerlar
              </h1>
              <p className="text-[11px] text-gray-400 dark:text-gray-500">
                Karta, link, foto-hisobot va maskalar
              </p>
            </div>
          </div>
        )}

        {/* Partner picker */}
        <div className="mb-4">
          <label className="block text-[11px] font-semibold text-gray-500 dark:text-gray-400 mb-1.5 uppercase tracking-wider">
            Partner
          </label>
          {partnersQuery.isLoading ? (
            <div className="h-11 rounded-xl bg-gray-100 dark:bg-white/[0.04] animate-pulse" />
          ) : partners.length === 0 ? (
            <div className="text-[13px] text-gray-400 px-3 py-2">Partner topilmadi.</div>
          ) : (
            <LightSelect
              options={partnerOptions}
              value={effectiveId !== null ? String(effectiveId) : ''}
              onChange={(v) => setSelectedPartnerId(Number(v))}
              placeholder="Partner tanlang"
            />
          )}
        </div>

        {selected && (
          <>
            {/* Tabs */}
            <div className="flex gap-1 bg-gray-100 dark:bg-white/[0.05] rounded-xl p-1 mb-4 overflow-x-auto">
              <TabBtn active={tab === 'methods'} onClick={() => setTab('methods')} icon={<CreditCard className="w-3.5 h-3.5" />}>
                To'lov
              </TabBtn>
              <TabBtn active={tab === 'foto'} onClick={() => setTab('foto')} icon={<FileText className="w-3.5 h-3.5" />}>
                Foto-hisobot
              </TabBtn>
              <TabBtn active={tab === 'aliases'} onClick={() => setTab('aliases')} icon={<Plane className="w-3.5 h-3.5" />}>
                Maskalar
              </TabBtn>
            </div>

            <AnimatePresence mode="wait">
              <motion.div
                key={tab + selected.id}
                initial={{ opacity: 0, y: 6 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -6 }}
                transition={{ duration: 0.18 }}
              >
                {tab === 'methods' && <PaymentMethodsPanel partner={selected} />}
                {tab === 'foto' && <FotoHisobotPanel partner={selected} />}
                {tab === 'aliases' && <AliasesPanel partner={selected} />}
              </motion.div>
            </AnimatePresence>
          </>
        )}
      </div>
    </div>
  );
}

// ─── Tab button ────────────────────────────────────────────────────────────────

const TabBtn = memo(function TabBtn({
  active, onClick, icon, children,
}: {
  active: boolean;
  onClick: () => void;
  icon: React.ReactNode;
  children: React.ReactNode;
}) {
  return (
    <button
      onClick={onClick}
      className={`flex-1 flex items-center justify-center gap-1.5 px-3 py-2 rounded-lg text-[12px] font-semibold transition-all whitespace-nowrap ${
        active
          ? 'bg-white dark:bg-white/[0.09] text-gray-900 dark:text-white shadow-sm'
          : 'text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300'
      }`}
    >
      {icon}
      {children}
    </button>
  );
});

// ─── Payment methods panel ─────────────────────────────────────────────────────

function PaymentMethodsPanel({ partner }: { partner: Partner }) {
  const qc = useQueryClient();
  const [creating, setCreating] = useState<'card' | 'link' | null>(null);
  const [editingId, setEditingId] = useState<number | null>(null);

  const methodsQuery = useQuery({
    queryKey: ['partner-methods', partner.id],
    queryFn: () => listPaymentMethods(partner.id),
    staleTime: 30_000,
  });

  const methods = methodsQuery.data ?? [];

  const invalidate = () => qc.invalidateQueries({ queryKey: ['partner-methods', partner.id] });

  const toggleActiveMut = useMutation({
    mutationFn: ({ id, is_active }: { id: number; is_active: boolean }) =>
      updatePaymentMethod(partner.id, id, { is_active }),
    onSuccess: () => invalidate(),
    onError: (e: { message?: string }) => toast.error(e.message ?? 'Xatolik'),
  });

  const deleteMut = useMutation({
    mutationFn: (id: number) => deletePaymentMethod(partner.id, id),
    onSuccess: () => {
      invalidate();
      toast.success("O'chirildi");
    },
    onError: (e: { message?: string }) => toast.error(e.message ?? 'Xatolik'),
  });

  return (
    <div className="space-y-3">

      {/* Add buttons */}
      <div className="flex flex-wrap gap-2">
        <button
          onClick={() => { setCreating('card'); setEditingId(null); }}
          disabled={creating === 'card'}
          className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-blue-500 hover:bg-blue-600 active:scale-95 transition-all text-white text-[12px] font-semibold shadow-md shadow-blue-500/20 disabled:opacity-50"
        >
          <Plus className="w-3.5 h-3.5" /> Karta
        </button>
        <button
          onClick={() => { setCreating('link'); setEditingId(null); }}
          disabled={creating === 'link'}
          className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-cyan-500 hover:bg-cyan-600 active:scale-95 transition-all text-white text-[12px] font-semibold shadow-md shadow-cyan-500/20 disabled:opacity-50"
        >
          <Plus className="w-3.5 h-3.5" /> Online havola
        </button>
      </div>

      {/* Create form */}
      <AnimatePresence>
        {creating && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="overflow-hidden"
          >
            <CreateMethodForm
              partnerId={partner.id}
              kind={creating}
              onClose={() => setCreating(null)}
              onCreated={invalidate}
            />
          </motion.div>
        )}
      </AnimatePresence>

      {/* List */}
      {methodsQuery.isLoading ? (
        <div className="space-y-2">
          {[1, 2].map((i) => (
            <div key={i} className="h-16 rounded-xl bg-gray-100 dark:bg-white/[0.04] animate-pulse" />
          ))}
        </div>
      ) : methods.length === 0 ? (
        <div className="text-center py-8 text-[13px] text-gray-400">Hech qanday usul yo'q.</div>
      ) : (
        <div className="space-y-2">
          {methods.map((m) => (
            <MethodRow
              key={m.id}
              method={m}
              isEditing={editingId === m.id}
              onEdit={() => { setEditingId(m.id); setCreating(null); }}
              onCancelEdit={() => setEditingId(null)}
              onSaved={() => { setEditingId(null); invalidate(); }}
              onToggleActive={() => toggleActiveMut.mutate({ id: m.id, is_active: !m.is_active })}
              onDelete={() => {
                if (confirm("O'chirilsinmi?")) deleteMut.mutate(m.id);
              }}
              partnerId={partner.id}
            />
          ))}
        </div>
      )}
    </div>
  );
}

// ─── Single method row ────────────────────────────────────────────────────────

const MethodRow = memo(function MethodRow({
  method, isEditing, onEdit, onCancelEdit, onSaved, onToggleActive, onDelete, partnerId,
}: {
  method: PaymentMethod;
  isEditing: boolean;
  onEdit: () => void;
  onCancelEdit: () => void;
  onSaved: () => void;
  onToggleActive: () => void;
  onDelete: () => void;
  partnerId: number;
}) {
  if (isEditing) {
    return (
      <EditMethodForm
        partnerId={partnerId}
        method={method}
        onCancel={onCancelEdit}
        onSaved={onSaved}
      />
    );
  }

  return (
    <div className="rounded-xl border border-gray-200 dark:border-white/[0.08] bg-white dark:bg-white/[0.03] px-3.5 py-3 flex items-center gap-3">
      <div className={`w-9 h-9 rounded-lg flex items-center justify-center shrink-0 ${
        method.method_type === 'card'
          ? 'bg-blue-100 dark:bg-blue-500/15 text-blue-600 dark:text-blue-400'
          : 'bg-cyan-100 dark:bg-cyan-500/15 text-cyan-600 dark:text-cyan-400'
      }`}>
        {method.method_type === 'card' ? <CreditCard className="w-4 h-4" /> : <Link2 className="w-4 h-4" />}
      </div>

      <div className="flex-1 min-w-0">
        {method.method_type === 'card' ? (
          <>
            <div className="text-[13px] font-bold text-gray-900 dark:text-white tracking-wider">
              {formatCard(method.card_number ?? '')}
            </div>
            <div className="text-[11px] text-gray-500 dark:text-gray-400 truncate">
              {method.card_holder ?? '—'}
            </div>
          </>
        ) : (
          <>
            <div className="text-[13px] font-bold text-gray-900 dark:text-white">{method.link_label}</div>
            <div className="text-[11px] text-gray-500 dark:text-gray-400 truncate">{method.link_url}</div>
          </>
        )}
      </div>

      <div className="flex items-center gap-0.5 shrink-0">
        <button
          onClick={onToggleActive}
          title={method.is_active ? 'Faol' : 'Nofaol'}
          className={`w-8 h-8 rounded-lg flex items-center justify-center transition-colors ${
            method.is_active
              ? 'text-green-600 hover:bg-green-50 dark:hover:bg-green-500/10'
              : 'text-gray-400 hover:bg-gray-100 dark:hover:bg-white/[0.05]'
          }`}
        >
          {method.is_active ? <ToggleRight className="w-5 h-5" /> : <ToggleLeft className="w-5 h-5" />}
        </button>
        <button
          onClick={onEdit}
          className="w-8 h-8 rounded-lg flex items-center justify-center text-gray-500 hover:text-blue-500 hover:bg-blue-50 dark:hover:bg-blue-500/10 transition-colors"
        >
          <Pencil className="w-3.5 h-3.5" />
        </button>
        <button
          onClick={onDelete}
          className="w-8 h-8 rounded-lg flex items-center justify-center text-gray-500 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-500/10 transition-colors"
        >
          <Trash2 className="w-3.5 h-3.5" />
        </button>
      </div>
    </div>
  );
});

function formatCard(num: string): string {
  return num.replace(/\D/g, '').replace(/(.{4})/g, '$1 ').trim();
}

// ─── Create method form ───────────────────────────────────────────────────────

function CreateMethodForm({
  partnerId, kind, onClose, onCreated,
}: {
  partnerId: number;
  kind: 'card' | 'link';
  onClose: () => void;
  onCreated: () => void;
}) {
  const [cardNumber, setCardNumber] = useState('');
  const [cardHolder, setCardHolder] = useState('');
  const [provider, setProvider] = useState<string>('Click');
  const [linkUrl, setLinkUrl] = useState('');
  const [weight, setWeight] = useState(1);

  const mut = useMutation({
    mutationFn: (body: PaymentMethodCreate) => createPaymentMethod(partnerId, body),
    onSuccess: () => {
      toast.success("Qo'shildi");
      onCreated();
      onClose();
    },
    onError: (e: { message?: string }) => toast.error(e.message ?? 'Xatolik'),
  });

  const handleSubmit = useCallback(() => {
    if (kind === 'card') {
      const cleaned = cardNumber.replace(/\s|-/g, '');
      if (cleaned.length < 12 || !/^\d+$/.test(cleaned)) {
        toast.error("Karta raqami noto'g'ri");
        return;
      }
      if (!cardHolder.trim()) {
        toast.error('Karta egasi yozilmagan');
        return;
      }
      mut.mutate({
        method_type: 'card',
        card_number: cleaned,
        card_holder: cardHolder.trim(),
        is_active: true,
        weight,
      });
    } else {
      if (!linkUrl.trim()) {
        toast.error('Havola yozilmagan');
        return;
      }
      mut.mutate({
        method_type: 'link',
        link_label: provider,
        link_url: linkUrl.trim(),
        is_active: true,
        weight,
      });
    }
  }, [kind, cardNumber, cardHolder, provider, linkUrl, weight, mut]);

  return (
    <div className="rounded-xl border border-blue-200 dark:border-blue-500/20 bg-blue-50/40 dark:bg-blue-500/[0.04] p-3.5 space-y-3">
      <div className="flex items-center justify-between">
        <div className="text-[12px] font-bold text-blue-700 dark:text-blue-400 uppercase tracking-wider">
          {kind === 'card' ? 'Yangi karta' : 'Yangi online havola'}
        </div>
        <button
          onClick={onClose}
          className="w-7 h-7 rounded-lg text-gray-400 hover:bg-gray-100 dark:hover:bg-white/[0.05] flex items-center justify-center"
        >
          <X className="w-4 h-4" />
        </button>
      </div>

      {kind === 'card' ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
          <FieldInput
            label="Karta raqami"
            value={cardNumber}
            onChange={(v) => setCardNumber(v.replace(/[^\d\s-]/g, ''))}
            placeholder="1234 5678 1234 5678"
            maxLength={23}
          />
          <FieldInput
            label="Karta egasi"
            value={cardHolder}
            onChange={setCardHolder}
            placeholder="Falonchi Pistonchi"
            maxLength={128}
          />
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
          <div>
            <label className="block text-[10px] font-semibold text-gray-500 dark:text-gray-400 mb-1 uppercase tracking-wider">
              Provayder
            </label>
            <LightSelect
              options={ONLINE_PROVIDERS.map((p) => ({ value: p.value, label: p.label }))}
              value={provider}
              onChange={setProvider}
              placeholder="Tanlang"
            />
          </div>
          <FieldInput
            label="To'lov havolasi"
            value={linkUrl}
            onChange={setLinkUrl}
            placeholder={provider === 'Click' ? 'https://click.uz/pay/...' : 'https://payme.uz/...'}
          />
        </div>
      )}

      <FieldInput
        label="Tartib (1-100)"
        value={String(weight)}
        onChange={(v) => setWeight(Math.min(100, Math.max(1, Number(v) || 1)))}
        type="number"
        className="max-w-[140px]"
      />

      <div className="flex gap-2 pt-1">
        <button
          onClick={handleSubmit}
          disabled={mut.isPending}
          className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-blue-500 hover:bg-blue-600 text-white text-[12px] font-semibold shadow-md shadow-blue-500/20 disabled:opacity-50 active:scale-95 transition-all"
        >
          {mut.isPending ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Check className="w-3.5 h-3.5" />}
          Saqlash
        </button>
        <button
          onClick={onClose}
          className="px-4 py-2 rounded-xl bg-gray-100 dark:bg-white/[0.06] text-gray-700 dark:text-gray-300 text-[12px] font-semibold hover:bg-gray-200 dark:hover:bg-white/[0.1] transition-colors"
        >
          Bekor
        </button>
      </div>
    </div>
  );
}

// ─── Edit method form ─────────────────────────────────────────────────────────

function EditMethodForm({
  partnerId, method, onCancel, onSaved,
}: {
  partnerId: number;
  method: PaymentMethod;
  onCancel: () => void;
  onSaved: () => void;
}) {
  const [cardNumber, setCardNumber] = useState(method.card_number ?? '');
  const [cardHolder, setCardHolder] = useState(method.card_holder ?? '');
  const [linkLabel, setLinkLabel] = useState(method.link_label ?? 'Click');
  const [linkUrl, setLinkUrl] = useState(method.link_url ?? '');
  const [weight, setWeight] = useState(method.weight);

  const mut = useMutation({
    mutationFn: (body: PaymentMethodUpdate) => updatePaymentMethod(partnerId, method.id, body),
    onSuccess: () => {
      toast.success('Saqlandi');
      onSaved();
    },
    onError: (e: { message?: string }) => toast.error(e.message ?? 'Xatolik'),
  });

  const handleSave = () => {
    if (method.method_type === 'card') {
      const cleaned = cardNumber.replace(/\s|-/g, '');
      mut.mutate({ card_number: cleaned, card_holder: cardHolder.trim(), weight });
    } else {
      mut.mutate({ link_label: linkLabel, link_url: linkUrl.trim(), weight });
    }
  };

  return (
    <div className="rounded-xl border border-amber-200 dark:border-amber-500/20 bg-amber-50/40 dark:bg-amber-500/[0.04] p-3.5 space-y-3">
      <div className="text-[12px] font-bold text-amber-700 dark:text-amber-400 uppercase tracking-wider">
        Tahrirlash
      </div>

      {method.method_type === 'card' ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
          <FieldInput label="Karta raqami" value={cardNumber} onChange={(v) => setCardNumber(v.replace(/[^\d\s-]/g, ''))} maxLength={23} />
          <FieldInput label="Karta egasi" value={cardHolder} onChange={setCardHolder} maxLength={128} />
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
          <div>
            <label className="block text-[10px] font-semibold text-gray-500 dark:text-gray-400 mb-1 uppercase tracking-wider">
              Provayder
            </label>
            <LightSelect
              options={ONLINE_PROVIDERS.map((p) => ({ value: p.value, label: p.label }))}
              value={linkLabel}
              onChange={setLinkLabel}
              placeholder="Tanlang"
            />
          </div>
          <FieldInput label="Havola" value={linkUrl} onChange={setLinkUrl} />
        </div>
      )}

      <FieldInput
        label="Tartib"
        value={String(weight)}
        onChange={(v) => setWeight(Math.min(100, Math.max(1, Number(v) || 1)))}
        type="number"
        className="max-w-[140px]"
      />

      <div className="flex gap-2">
        <button
          onClick={handleSave}
          disabled={mut.isPending}
          className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-amber-500 hover:bg-amber-600 text-white text-[12px] font-semibold disabled:opacity-50 active:scale-95 transition-all"
        >
          {mut.isPending ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Save className="w-3.5 h-3.5" />}
          Saqlash
        </button>
        <button
          onClick={onCancel}
          className="px-4 py-2 rounded-xl bg-gray-100 dark:bg-white/[0.06] text-gray-700 dark:text-gray-300 text-[12px] font-semibold hover:bg-gray-200 dark:hover:bg-white/[0.1] transition-colors"
        >
          Bekor
        </button>
      </div>
    </div>
  );
}

// ─── Foto-hisobot panel ───────────────────────────────────────────────────────

function FotoHisobotPanel({ partner }: { partner: Partner }) {
  const qc = useQueryClient();
  const [text, setText] = useState<string | null>(null);

  const query = useQuery({
    queryKey: ['partner-foto', partner.id],
    queryFn: () => getFotoHisobot(partner.id),
    staleTime: 60_000,
  });

  // Parent remounts this panel via key={tab + partner.id}, so local
  // state always starts fresh when partner changes — no sync effect needed.
  const serverText = query.data?.foto_hisobot ?? '';

  const mut = useMutation({
    mutationFn: (val: string) => updateFotoHisobot(partner.id, val),
    onSuccess: () => {
      toast.success('Saqlandi');
      setText(null);
      qc.invalidateQueries({ queryKey: ['partner-foto', partner.id] });
    },
    onError: (e: { message?: string }) => toast.error(e.message ?? 'Xatolik'),
  });

  const value = text ?? serverText;
  const dirty = value !== serverText;
  const length = value.length;

  return (
    <div className="space-y-3">
      <div>
        <div className="flex items-center justify-between mb-1.5">
          <label className="block text-[11px] font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">
            Foto-hisobot matni
          </label>
          <span className={`text-[10px] font-mono ${length > 4000 ? 'text-red-500' : 'text-gray-400'}`}>
            {length} / 4000
          </span>
        </div>

        {query.isLoading ? (
          <div className="h-40 rounded-xl bg-gray-100 dark:bg-white/[0.04] animate-pulse" />
        ) : (
          <textarea
            value={value}
            onChange={(e) => setText(e.target.value)}
            placeholder="Partner uchun custom footer matni..."
            maxLength={4000}
            rows={8}
            className="w-full px-3.5 py-2.5 rounded-xl border border-gray-200 dark:border-white/[0.08] bg-white dark:bg-white/[0.03] text-[13px] text-gray-900 dark:text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500/30 focus:border-blue-500 resize-y"
          />
        )}
      </div>

      <button
        onClick={() => mut.mutate(value)}
        disabled={!dirty || mut.isPending || length > 4000}
        className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-blue-500 hover:bg-blue-600 text-white text-[12px] font-semibold shadow-md shadow-blue-500/20 disabled:opacity-50 disabled:cursor-not-allowed active:scale-95 transition-all"
      >
        {mut.isPending ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Save className="w-3.5 h-3.5" />}
        Saqlash
      </button>
    </div>
  );
}

// ─── Aliases panel ────────────────────────────────────────────────────────────

function AliasesPanel({ partner }: { partner: Partner }) {
  const qc = useQueryClient();
  const [editingId, setEditingId] = useState<number | null>(null);
  const [editText, setEditText] = useState('');
  
  const [isCreating, setIsCreating] = useState(false);
  const [newReal, setNewReal] = useState('');
  const [newMask, setNewMask] = useState('');

  const query = useQuery({
    queryKey: ['partner-aliases', partner.id],
    queryFn: () => listAliases(partner.id, 200),
    staleTime: 60_000,
  });

  const aliases = query.data ?? [];
  const invalidate = () => qc.invalidateQueries({ queryKey: ['partner-aliases', partner.id] });

  const createMut = useMutation({
    mutationFn: (body: FlightAliasCreate) => createAlias(partner.id, body),
    onSuccess: () => {
      toast.success("Maska qo'shildi");
      setIsCreating(false);
      setNewReal('');
      setNewMask('');
      invalidate();
    },
    onError: (e: { message?: string }) => toast.error(e.message ?? 'Xatolik'),
  });

  const updateMut = useMutation({
    mutationFn: ({ id, mask }: { id: number; mask: string }) => updateAlias(partner.id, id, mask),
    onSuccess: () => {
      toast.success('Saqlandi');
      setEditingId(null);
      invalidate();
    },
    onError: (e: { message?: string }) => toast.error(e.message ?? 'Xatolik'),
  });

  const deleteMut = useMutation({
    mutationFn: (id: number) => deleteAlias(partner.id, id),
    onSuccess: () => {
      toast.success("O'chirildi");
      invalidate();
    },
    onError: (e: { message?: string }) => toast.error(e.message ?? 'Xatolik'),
  });

  if (query.isLoading) {
    return (
      <div className="space-y-2">
        {[1, 2, 3].map((i) => (
          <div key={i} className="h-14 rounded-xl bg-gray-100 dark:bg-white/[0.04] animate-pulse" />
        ))}
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {/* Add button */}
      <div className="flex">
        <button
          onClick={() => setIsCreating(true)}
          disabled={isCreating}
          className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-blue-500 hover:bg-blue-600 active:scale-95 transition-all text-white text-[12px] font-semibold shadow-md shadow-blue-500/20 disabled:opacity-50"
        >
          <Plus className="w-3.5 h-3.5" /> Maska qo'shish
        </button>
      </div>

      {/* Create form */}
      <AnimatePresence>
        {isCreating && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="overflow-hidden"
          >
            <div className="bg-white dark:bg-[#1a1a1a] rounded-xl border border-gray-200 dark:border-white/[0.08] p-4 space-y-3 mb-2 shadow-sm">
              <h3 className="text-[13px] font-bold text-gray-900 dark:text-white">Yangi maska</h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <FieldInput
                  label="Asl reys (Real flight)"
                  value={newReal}
                  onChange={setNewReal}
                  placeholder="Masalan: M200"
                  maxLength={100}
                />
                <FieldInput
                  label="Maska (Mask flight)"
                  value={newMask}
                  onChange={setNewMask}
                  placeholder="Masalan: AKB150"
                  maxLength={100}
                />
              </div>
              <div className="flex justify-end gap-2 pt-1">
                <button
                  onClick={() => setIsCreating(false)}
                  className="px-4 py-2 rounded-xl text-[12px] font-medium text-gray-500 hover:bg-gray-100 dark:hover:bg-white/[0.05] transition-colors"
                >
                  Bekor qilish
                </button>
                <button
                  onClick={() => {
                    if (!newReal.trim() || !newMask.trim()) {
                      toast.error("Barcha maydonlarni to'ldiring");
                      return;
                    }
                    createMut.mutate({ real_flight_name: newReal.trim(), mask_flight_name: newMask.trim() });
                  }}
                  disabled={createMut.isPending}
                  className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-blue-500 hover:bg-blue-600 active:scale-95 transition-all text-white text-[12px] font-semibold disabled:opacity-50"
                >
                  {createMut.isPending && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
                  Saqlash
                </button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {aliases.length === 0 ? (
        <div className="text-center py-8 text-[13px] text-gray-400">Maska yo'q.</div>
      ) : (
        <div className="space-y-2">
          {aliases.map((a) => (
            <div
              key={a.id}
              className="rounded-xl border border-gray-200 dark:border-white/[0.08] bg-white dark:bg-white/[0.03] px-3.5 py-3 flex items-center gap-3"
            >
              <div className="w-8 h-8 rounded-lg bg-orange-100 dark:bg-orange-500/15 text-orange-600 dark:text-orange-400 flex items-center justify-center shrink-0">
                <Plane className="w-4 h-4" />
              </div>

              <div className="flex-1 min-w-0">
                <div className="text-[10px] text-gray-400 uppercase tracking-wider">Asl reys</div>
                <div className="text-[12px] font-medium text-gray-700 dark:text-gray-300 truncate">{a.real_flight_name}</div>
                {editingId === a.id ? (
                  <input
                    value={editText}
                    onChange={(e) => setEditText(e.target.value)}
                    autoFocus
                    maxLength={100}
                    placeholder="Maska"
                    className="mt-1 w-full px-2.5 py-1.5 rounded-lg border border-blue-300 bg-white dark:bg-white/[0.06] text-[13px] text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500/30"
                  />
                ) : (
                  <div className="text-[13px] font-bold text-gray-900 dark:text-white truncate">
                    → {a.mask_flight_name}
                  </div>
                )}
              </div>

              <div className="flex items-center gap-0.5 shrink-0">
                {editingId === a.id ? (
                  <>
                    <button
                      onClick={() => editText.trim() && updateMut.mutate({ id: a.id, mask: editText.trim() })}
                      disabled={updateMut.isPending}
                      className="w-8 h-8 rounded-lg flex items-center justify-center text-green-600 hover:bg-green-50 dark:hover:bg-green-500/10 transition-colors"
                    >
                      {updateMut.isPending ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Check className="w-4 h-4" />}
                    </button>
                    <button
                      onClick={() => setEditingId(null)}
                      className="w-8 h-8 rounded-lg flex items-center justify-center text-gray-400 hover:bg-gray-100 dark:hover:bg-white/[0.05] transition-colors"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </>
                ) : (
                  <>
                    <button
                      onClick={() => { setEditingId(a.id); setEditText(a.mask_flight_name); }}
                      className="w-8 h-8 rounded-lg flex items-center justify-center text-gray-500 hover:text-blue-500 hover:bg-blue-50 dark:hover:bg-blue-500/10 transition-colors"
                    >
                      <Pencil className="w-3.5 h-3.5" />
                    </button>
                    <button
                      onClick={() => { if (confirm("O'chirilsinmi?")) deleteMut.mutate(a.id); }}
                      className="w-8 h-8 rounded-lg flex items-center justify-center text-gray-500 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-500/10 transition-colors"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

// ─── Reusable input ───────────────────────────────────────────────────────────

const FieldInput = memo(function FieldInput({
  label, value, onChange, placeholder, maxLength, type = 'text', className = '',
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
  maxLength?: number;
  type?: string;
  className?: string;
}) {
  return (
    <div className={className}>
      <label className="block text-[10px] font-semibold text-gray-500 dark:text-gray-400 mb-1 uppercase tracking-wider">
        {label}
      </label>
      <input
        type={type}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        maxLength={maxLength}
        className="w-full px-3 py-2 rounded-xl border border-gray-200 dark:border-white/[0.08] bg-white dark:bg-white/[0.03] text-[13px] text-gray-900 dark:text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500/30 focus:border-blue-500"
      />
    </div>
  );
});
