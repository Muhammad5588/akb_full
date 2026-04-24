import { motion, animate } from 'framer-motion';
import { Wallet, Copy, Check, ShieldCheck } from 'lucide-react';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { type ProfileResponse } from '@/types/profile';
import { useState, memo, useEffect, useRef } from 'react';
import { useTranslation } from 'react-i18next';
import { toast } from 'sonner';
import { useQuery } from '@tanstack/react-query';
import { walletService } from '@/api/services/walletService';

interface ProfileHeroProps {
    user: ProfileResponse;
    onBalanceClick?: () => void;
}

export const ProfileHero = memo(({ user, onBalanceClick }: ProfileHeroProps) => {
    const [copied, setCopied] = useState(false);
    const { t } = useTranslation();

    // Fetch wallet balance
    const { data: walletData } = useQuery({
        queryKey: ['walletBalance'],
        queryFn: walletService.getWalletBalance,
        refetchInterval: 30000,
    });

    const walletBalance = walletData?.wallet_balance ?? 0;
    const debt = walletData?.debt ?? 0;
    const hasDebt = debt < 0;
    const displayCode = user.extra_code || user.client_code;

    // The primary display value: debt (absolute) if in debt, otherwise wallet balance
    const primaryValue = hasDebt ? Math.abs(debt) : walletBalance;

    // Animation for primary number — direct DOM update to avoid re-renders
    const balanceRef = useRef<HTMLSpanElement>(null);

    useEffect(() => {
        if (!balanceRef.current) return;
        
        const controls = animate(0, primaryValue, {
            duration: 1.5,
            ease: "easeOut",
            onUpdate(value) {
                if (balanceRef.current) {
                    balanceRef.current.textContent = Math.round(value).toLocaleString();
                }
            }
        });
        
        return controls.stop;
    }, [primaryValue]);

    const fallbackCopyText = (text: string) => {
        const textarea = document.createElement('textarea');
        textarea.value = text;
        textarea.setAttribute('readonly', '');
        textarea.style.position = 'fixed';
        textarea.style.opacity = '0';
        textarea.style.pointerEvents = 'none';
        document.body.appendChild(textarea);
        textarea.focus();
        textarea.select();

        const successful = document.execCommand('copy');
        document.body.removeChild(textarea);
        return successful;
    };

    const handleCopyId = async () => {
        try {
            if (navigator.clipboard?.writeText) {
                await navigator.clipboard.writeText(displayCode);
            } else if (!fallbackCopyText(displayCode)) {
                throw new Error('copy_failed');
            }

            setCopied(true);
            window.setTimeout(() => setCopied(false), 2000);
            toast.success(t('profile.hero.idCopied'));
        } catch {
            toast.error(
                t('profile.hero.idCopyError', "ID nusxalanmadi. Qayta urinib ko'ring."),
            );
        }
    };

    return (
        <div className="relative mb-5 bg-transparent">
            <motion.div
                initial={{ opacity: 0, y: -20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.8, ease: "easeOut" }}
                className="
                    bg-white
                    p-5 sm:p-6
                    rounded-lg
                    shadow-[0_10px_24px_rgba(10,35,70,0.06)] text-[#07182f] text-left relative transform-gpu
                    border border-[#dbe8f4]
                    overflow-hidden
                "
                style={{ willChange: 'transform, opacity' }}
            >
                <div className="relative z-10 flex items-start gap-4">
                    <motion.div
                        initial={{ scale: 0.8, opacity: 0 }}
                        animate={{ scale: 1, opacity: 1 }}
                        transition={{ delay: 0.2, type: "spring" }}
                        className="relative shrink-0 group"
                        style={{ willChange: 'transform, opacity' }}
                    >
                        <Avatar className="w-16 h-16 md:w-[72px] md:h-[72px] border border-[#cfe0f1] shadow-sm relative z-10 rounded-lg">
                            <AvatarImage src={user.avatar_url} alt={user.full_name} className="object-cover" />
                            <AvatarFallback className="text-2xl font-bold bg-[#0b4edb] text-white rounded-lg">
                                {user.full_name?.charAt(0) || 'A'}
                            </AvatarFallback>
                        </Avatar>
                    </motion.div>

                    <div className="min-w-0 flex-1">
                        <div className="mb-2 inline-flex items-center gap-1.5 rounded-full border border-[#cfe0f1] bg-[#eef6ff] px-2.5 py-1 text-[11px] font-bold uppercase tracking-normal text-[#0b4edb]">
                            <ShieldCheck className="h-3.5 w-3.5" />
                            AKB Cargo
                        </div>
                        <h1 className="truncate text-2xl md:text-2xl font-semibold tracking-normal text-[#07182f]">
                            {user.full_name}
                        </h1>
                        <span className="mt-1 block text-[#63758a] text-xs font-medium tracking-normal">
                            {t('profile.hero.registeredDate', { date: user.created_at })}
                        </span>
                        <button
                            type="button"
                            className="mt-3 flex max-w-full items-center gap-2 bg-[#f8fbfe] px-3 py-2 rounded-lg border border-[#dbe8f4] cursor-pointer hover:bg-[#eef6ff] transition-colors"
                            onClick={handleCopyId}
                        >
                            <span className="truncate text-[#0b4edb] text-sm font-semibold tracking-normal">ID: {displayCode}</span>
                            {copied ? <Check size={14} className="shrink-0 text-[#15835b]" /> : <Copy size={14} className="shrink-0 text-[#0b4edb]" />}
                        </button>
                    </div>
                </div>
            </motion.div>

            <motion.div
                initial={{ y: 50, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                transition={{ delay: 0.4, type: "spring", stiffness: 100 }}
                className="relative mt-3 w-full z-20 pointer-events-none"
                style={{ willChange: 'transform, opacity' }}
            >
                <div
                    onClick={onBalanceClick}
                    className="bg-white border border-[#dbe8f4] shadow-[0_8px_20px_rgba(10,35,70,0.05)] rounded-lg p-4 relative overflow-hidden pointer-events-auto cursor-pointer hover:border-[#0b84e5] active:scale-[0.99] transition-all duration-200"
                >
                    <div className="flex items-center justify-between relative z-10">
                        <div>
                            <p className="text-[11px] uppercase tracking-normal text-[#63758a] font-bold mb-1">
                                {hasDebt ? t('profile.hero.debtLabel') : t('profile.hero.balance')}
                            </p>
                            <h2 className={`text-2xl font-black tracking-normal ${
                                hasDebt
                                    ? 'text-[#c44747]'
                                    : 'text-[#15835b]'
                            }`}>
                                {hasDebt && <span>-</span>}
                                <span ref={balanceRef}>{primaryValue.toLocaleString()}</span>{' '}
                                <span className="text-lg text-[#7d91a8] font-normal">{t('profile.hero.currency')}</span>
                            </h2>
                            {hasDebt ? (
                                <div className="inline-flex items-center gap-1.5 mt-2 bg-[#effbf5] border border-[#ccebdc] rounded-full px-2.5 py-1">
                                    <Wallet className="w-3.5 h-3.5 text-[#15835b] shrink-0" />
                                    <span className="text-xs font-semibold text-[#15835b]">
                                        {t('profile.hero.availableLabel')}: {walletBalance.toLocaleString()} {t('profile.hero.currency')}
                                    </span>
                                </div>
                            ) : null}
                        </div>
                        <div className={`
                            h-12 w-12 rounded-lg flex items-center justify-center shadow-sm transition-colors duration-300
                            ${hasDebt ? 'bg-[#fff1f1] text-[#c44747] border border-[#f0cccc]' : 'bg-[#effbf5] text-[#15835b] border border-[#ccebdc]'}
                        `}>
                            <Wallet className="h-6 w-6" />
                        </div>
                    </div>
                </div>
            </motion.div>
        </div>
    );
});
ProfileHero.displayName = 'ProfileHero';
