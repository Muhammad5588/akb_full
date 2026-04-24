import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { FileText, CreditCard, MapPin, Calendar, Users, Phone, ShieldCheck } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { type ProfileResponse } from '@/types/profile';

interface PersonalInfoProps {
    user: ProfileResponse;
}

export const PersonalInfo = ({ user }: PersonalInfoProps) => {
    const { t } = useTranslation();
    const [showPhone, setShowPhone] = useState(false);
    const [showPassport, setShowPassport] = useState(false);
    const [showPinfl, setShowPinfl] = useState(false);
    const fallbackValue = 'Not provided';

    useEffect(() => {
        if (!showPinfl) return undefined;

        const timer = window.setTimeout(() => {
            setShowPinfl(false);
        }, 8000);

        return () => window.clearTimeout(timer);
    }, [showPinfl]);

    const normalizeValue = (value?: string | null) => String(value ?? '').trim();
    const hasValue = (value?: string | null) => normalizeValue(value).length > 0;

    const maskValue = (value?: string | null, visibleStart = 2, visibleEnd = 2, maskLength = 6) => {
        const clean = normalizeValue(value);
        if (!clean) return fallbackValue;
        if (clean.length <= visibleStart + visibleEnd) return '*'.repeat(clean.length);
        return `${clean.slice(0, visibleStart)}${'*'.repeat(Math.min(maskLength, clean.length - visibleStart - visibleEnd))}${clean.slice(-visibleEnd)}`;
    };

    const maskPhone = (value?: string | null) => {
        const clean = normalizeValue(value);
        if (!clean) return fallbackValue;
        const digits = clean.replace(/\D/g, '');
        if (digits.length < 4) return maskValue(value, 1, 1, 4);
        const prefix = digits.startsWith('998') ? '+998' : `+${digits.slice(0, Math.min(3, digits.length - 2))}`;
        return `${prefix} ** *** ** ${digits.slice(-2)}`;
    };

    const formatVisiblePhone = (value?: string | null) => {
        const clean = normalizeValue(value);
        if (!clean) return fallbackValue;

        const digits = clean.replace(/\D/g, '');
        if (digits.length === 12 && digits.startsWith('998')) {
            return `+998 ${digits.slice(3, 5)} ${digits.slice(5, 8)} ${digits.slice(8, 10)} ${digits.slice(10, 12)}`;
        }

        if (digits.length === 9) {
            return `+998 ${digits.slice(0, 2)} ${digits.slice(2, 5)} ${digits.slice(5, 7)} ${digits.slice(7, 9)}`;
        }

        return clean;
    };

    const getSensitiveValue = (field: 'phone' | 'passport' | 'pinfl', shown: boolean, value?: string | null) => {
        const clean = normalizeValue(value);
        if (!clean) return fallbackValue;

        if (shown) {
            if (field === 'phone') return formatVisiblePhone(clean);
            return clean;
        }

        if (field === 'phone') return maskPhone(clean);
        if (field === 'passport') return maskValue(clean, 2, 2, 5);
        return maskValue(clean, 4, 2, 8);
    };

    const items = [
        {
            label: t('profile.edit.phone'),
            value: getSensitiveValue('phone', showPhone, user.phone),
            rawValue: '',
            icon: Phone,
            color: 'text-[#0b4edb]',
            bg: 'bg-[#eef6ff]',
            border: 'border-[#cfe0f1]',
            sensitive: true,
            isShown: showPhone,
            canToggle: hasValue(user.phone),
            onToggle: () => setShowPhone((current) => !current),
        },
        {
            label: t('profile.personalInfo.passport'),
            value: getSensitiveValue('passport', showPassport, user.passport_series),
            rawValue: '',
            icon: FileText,
            color: 'text-[#0b4edb]',
            bg: 'bg-[#eef6ff]',
            border: 'border-[#cfe0f1]',
            sensitive: true,
            isShown: showPassport,
            canToggle: hasValue(user.passport_series),
            onToggle: () => setShowPassport((current) => !current),
        },
        {
            label: t('profile.personalInfo.pinfl'),
            value: getSensitiveValue('pinfl', showPinfl, user.pinfl),
            rawValue: '',
            icon: CreditCard,
            color: 'text-[#0b4edb]',
            bg: 'bg-[#eef6ff]',
            border: 'border-[#cfe0f1]',
            sensitive: true,
            isShown: showPinfl,
            canToggle: hasValue(user.pinfl),
            onToggle: () => setShowPinfl((current) => !current),
        },
        { label: t('profile.personalInfo.dateOfBirth'), value: normalizeValue(user.date_of_birth) || fallbackValue, rawValue: user.date_of_birth ?? '', icon: Calendar, color: 'text-[#15835b]', bg: 'bg-[#effbf5]', border: 'border-[#ccebdc]', sensitive: false },
        { label: t('profile.personalInfo.region'), value: normalizeValue(user.region) || fallbackValue, rawValue: user.region ?? '', icon: MapPin, color: 'text-[#0784a6]', bg: 'bg-[#eafaff]', border: 'border-[#bdebf7]', sensitive: false },
        { label: t('profile.personalInfo.district'), value: normalizeValue(user.district) || fallbackValue, rawValue: user.district ?? '', icon: MapPin, color: 'text-[#0784a6]', bg: 'bg-[#eafaff]', border: 'border-[#bdebf7]', sensitive: false },
        { label: t('profile.personalInfo.address'), value: normalizeValue(user.address) || fallbackValue, rawValue: user.address ?? '', icon: MapPin, color: 'text-[#334a62]', bg: 'bg-[#f2f6fa]', border: 'border-[#dbe8f4]', sensitive: false },
        { label: t('profile.personalInfo.referrals'), value: t('profile.personalInfo.referralCount', { count: user.referral_count }), rawValue: '', icon: Users, color: 'text-[#15835b]', bg: 'bg-[#effbf5]', border: 'border-[#ccebdc]', sensitive: false },
    ];

    return (
        <div className="mb-8 max-w-md mx-auto md:max-w-none md:mx-0 md:px-0">
            <div className="mb-4 flex items-start justify-between gap-3">
                <div>
                    <p className="text-[11px] font-bold uppercase tracking-normal text-[#0b4edb] dark:text-[#fff1f1]">
                        {t('profile.personalInfo.secureLabel', 'Himoyalangan')}
                    </p>
                    <h3 className="text-lg font-semibold text-[#07182f] dark:text-[#f3f3f3] flex items-center gap-2">
                        {t('profile.personalInfo.title')}
                    </h3>
                </div>
                <div className="flex h-9 w-9 items-center justify-center rounded-lg border border-[#cfe0f1] bg-[#eef6ff] text-[#0b4edb] dark:border-[#2B4166] dark:bg-[#f3f8ff] dark:text-[#0b4edb]">
                    <ShieldCheck className="h-5 w-5" />
                </div>
            </div>
            <div className="bg-white rounded-lg shadow-[0_8px_20px_rgba(10,35,70,0.05)] border border-[#dbe8f4] overflow-hidden">
                <div className="divide-y divide-[#edf3f8] md:divide-y-0 md:grid md:grid-cols-2 md:gap-2 md:p-2">
                    {items.map((item, idx) => (
                        <motion.div
                            key={item.label}
                            initial={{ opacity: 0, x: -10 }}
                            animate={{ opacity: 1, x: 0 }}
                            transition={{ delay: idx * 0.05 + 0.2 }}
                            className="p-4 flex items-center justify-between group hover:bg-[#f8fbfe] transition-colors md:rounded-lg"
                            onClick={() => {
                                if (!item.sensitive && item.rawValue) {
                                    navigator.clipboard.writeText(item.rawValue);
                                }
                            }}
                        >
                            <div className="flex min-w-0 items-center gap-4">
                                <div className={`p-2.5 rounded-lg border ${item.border} ${item.bg} ${item.color}`}>
                                    <item.icon size={18} />
                                </div>
                                <div className="flex min-w-0 flex-col">
                                    <span className="text-xs md:text-sm text-[#7d91a8] font-medium">{item.label}</span>
                                    <span className="break-words text-sm md:text-base font-semibold text-[#07182f]">{item.value || t('profile.personalInfo.notAvailable')}</span>
                                </div>
                            </div>
                            {item.sensitive && item.canToggle && (
                                <button
                                    type="button"
                                    className="relative z-10 ml-3 shrink-0 cursor-pointer rounded-full border border-[#dbe8f4] bg-[#f8fbfe] px-2 py-1 text-[10px] font-bold text-[#63758a] transition-colors hover:border-[#c6d8ea] hover:bg-[#f1f7fd] focus:outline-none focus:ring-2 focus:ring-[#7fd4ff]/60"
                                    aria-pressed={item.isShown}
                                    title={item.isShown ? t('profile.personalInfo.hide', 'Yashirish') : t('profile.personalInfo.masked', 'Maxfiy')}
                                    onClick={(event) => {
                                        event.stopPropagation();
                                        item.onToggle?.();
                                    }}
                                >
                                    {item.isShown ? t('profile.personalInfo.hide', 'Yashirish') : t('profile.personalInfo.masked', 'Maxfiy')}
                                </button>
                            )}
                        </motion.div>
                    ))}
                </div>
            </div>
        </div>
    );
};
