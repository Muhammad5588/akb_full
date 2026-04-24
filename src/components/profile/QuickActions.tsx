import { CreditCard, FilePlus, UserCog, ChevronRight } from 'lucide-react';
import { memo } from 'react';
import { useTranslation } from 'react-i18next';

interface QuickActionsProps {
    onWalletClick: () => void;
    onCardsClick: () => void;
    onPassportsClick: () => void;
}

export const QuickActions = memo(({ onWalletClick, onCardsClick, onPassportsClick }: QuickActionsProps) => {
    const { t } = useTranslation();

    return (
        <div className="grid w-full grid-cols-1 gap-2 md:mb-0 md:gap-3">
            <ActionButton
                icon={<CreditCard className="h-5 w-5 text-[#0b4edb]" />}
                label={t('profile.quickActions.payments')}
                onClick={onWalletClick}
                delay={0.1}
                bgColor="bg-[#eef6ff]"
                borderColor="border-[#cfe0f1]"
            />
            <ActionButton
                icon={<FilePlus className="h-5 w-5 text-[#15835b]" />}
                label={t('profile.quickActions.addPassport')}
                onClick={onPassportsClick}
                delay={0.2}
                bgColor="bg-[#effbf5]"
                borderColor="border-[#ccebdc]"
            />
            <ActionButton
                icon={<UserCog className="h-5 w-5 text-[#334a62]" />}
                label={t('profile.quickActions.myCards')}
                onClick={onCardsClick}
                delay={0.3}
                bgColor="bg-[#f2f6fa]"
                borderColor="border-[#dbe8f4]"
            />
        </div>
    );
});
QuickActions.displayName = 'QuickActions';

interface ActionButtonProps {
    icon: React.ReactNode;
    label: string;
    onClick: () => void;
    delay: number;
    bgColor: string;
    borderColor: string;
}

const ActionButton = memo(({ icon, label, onClick, delay, bgColor, borderColor }: ActionButtonProps) => {
    return (
        <button
            className="
                group relative flex items-center justify-between gap-3 p-3 w-full
                rounded-lg transition-all duration-300
                bg-white
                border border-[#dbe8f4]
                shadow-[0_8px_20px_rgba(10,35,70,0.05)]
                hover:border-[#0b84e5] hover:bg-[#f8fbfe]
                active:scale-95 active:shadow-inner
            "
            onClick={onClick}
            style={{ animationDelay: `${delay}s` }}
        >
            <div className={`
                w-11 h-11 rounded-lg border flex items-center justify-center
                transition-transform duration-300 group-hover:scale-110 group-active:scale-90
                ${bgColor} ${borderColor}
            `}>
                {icon}
            </div>

            <span className="min-w-0 flex-1 text-left text-sm font-bold text-[#07182f] tracking-normal">
                {label}
            </span>
            <ChevronRight className="h-4 w-4 shrink-0 text-[#9fb7cc] transition-colors group-hover:text-[#0b4edb]" />
        </button>
    );
});
ActionButton.displayName = 'ActionButton';
