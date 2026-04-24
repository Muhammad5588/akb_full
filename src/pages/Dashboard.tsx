import { useState, memo, useRef, useEffect, useMemo, lazy, Suspense, useCallback, type CSSProperties } from "react";
import { useQuery } from "@tanstack/react-query";
import {
    MapPin,
    Calendar,
    Edit3,
    ChevronLeft,
    ChevronRight,
    Home,
    ScanBarcode,
    Plane,
    Wallet,
    MessageSquare,
    ListOrdered,
    Calculator,
    Package,
} from "lucide-react";
import TrackCodeTab from "./dashboard/TrackCodeTab";
import {
    getActiveCarouselItems,
    trackCarouselView,
    trackCarouselClick,
    type CarouselMediaItemResponse,
} from "@/api/services/carousel";
import CarouselMediaModal from "@/components/carousel/CarouselMediaModal";
import { toast } from "sonner";
import { ActionButton, type ActionItemData } from "@/components/user_page/ActionButtons";
import { UniqueBackground } from "@/components/ui/UniqueBackground";
import { useTranslation } from 'react-i18next';
import { useProfile } from "@/hooks/useProfile";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------
interface CarouselItemData {
    id: number;
    type: "feature" | "ad";
    titleKey?: string;
    subKey?: string;
    title?: string;
    sub?: string;
    gradient?: string;
    gradientStyle?: string;
    bgIcon?: React.ReactNode;
    mainIcon?: React.ReactNode;
    mediaType?: "image" | "video" | "gif";
    mediaUrl?: string;
    actionUrl?: string;
    textColor?: string;
    fromApi?: boolean;
    mediaItems?: CarouselMediaItemResponse[];
}

// ---------------------------------------------------------------------------
// Statik ma'lumotlar — modul darajasida, har rendirda qayta yaratilmaydi
// ---------------------------------------------------------------------------
const CAROUSEL_ITEMS: CarouselItemData[] = [
    {
        id: 1,
        type: "feature",
        titleKey: "dashboard.carousel.prohibited.title",
        subKey: "dashboard.carousel.prohibited.sub",
        gradient: "from-[#ef4444] via-[#f97316] to-[#fb7185]",
        bgIcon: <span aria-hidden className="absolute -right-2 top-1 select-none text-[5.1rem] font-black leading-none tracking-[-0.08em] text-white/12">!</span>,
        mainIcon: <span aria-hidden className="text-[1.55rem] font-black leading-none">!</span>,
    },
    {
        id: 2,
        type: "feature",
        titleKey: "dashboard.carousel.id.title",
        subKey: "dashboard.carousel.id.sub",
        gradient: "from-[#4338ca] via-[#2563eb] to-[#06b6d4]",
        bgIcon: <span aria-hidden className="absolute -right-1 top-3 select-none text-[4.25rem] font-black leading-none tracking-[-0.06em] text-white/12">ID</span>,
        mainIcon: <span aria-hidden className="text-[0.95rem] font-black leading-none tracking-[0.12em]">ID</span>,
    },
    {
        id: 3,
        type: "feature",
        titleKey: "dashboard.carousel.delivery.title",
        subKey: "dashboard.carousel.delivery.sub",
        gradient: "from-[#0f766e] via-[#0891b2] to-[#1d4ed8]",
        bgIcon: <span aria-hidden className="absolute -right-2 top-3 select-none text-[3.6rem] font-black leading-none tracking-[0.08em] text-white/12">AIR</span>,
        mainIcon: <span aria-hidden className="text-[0.78rem] font-black leading-none tracking-[0.18em]">AIR</span>,
    },
];

const PRIMARY_ACTIONS: (Omit<ActionItemData, 'label' | 'desc' | 'badge' | 'actionLabel'> & {
    labelKey: string; descKey: string; badgeKey: string; actionLabelKey: string
})[] = [
    { id: "request",  icon: <Edit3 className="w-5 h-5" />,   bgIcon: <Edit3 style={{ width: 80, height: 80 }} />,   labelKey: "dashboard.actions.request.label",  descKey: "dashboard.actions.request.desc",  badgeKey: "dashboard.actions.request.badge",  actionLabelKey: "dashboard.actions.request.action",  theme: "blue",  priority: "primary" },
    { id: "report",   icon: <Package className="w-5 h-5" />, bgIcon: <Package style={{ width: 80, height: 80 }} />, labelKey: "dashboard.sections.myCargo",       descKey: "dashboard.sections.cargoReport",  badgeKey: "dashboard.actions.history.badge",  actionLabelKey: "dashboard.actions.history.action",  theme: "cyan",  priority: "primary" },
    { id: "payment",  icon: <Wallet className="w-5 h-5" />,  bgIcon: <Wallet style={{ width: 80, height: 80 }} />,  labelKey: "dashboard.actions.payment.label",  descKey: "dashboard.actions.payment.desc",  badgeKey: "dashboard.actions.payment.badge",  actionLabelKey: "dashboard.actions.payment.action",  theme: "green", priority: "primary" },
    { id: "china",    icon: <MapPin className="w-5 h-5" />,  bgIcon: <MapPin style={{ width: 80, height: 80 }} />,  labelKey: "dashboard.actions.china.label",    descKey: "dashboard.actions.china.desc",    badgeKey: "dashboard.actions.china.badge",    actionLabelKey: "dashboard.actions.china.action",    theme: "slate", priority: "primary" },
];

const SECONDARY_ACTIONS: (Omit<ActionItemData, 'label' | 'desc' | 'badge' | 'actionLabel'> & {
    labelKey: string; descKey: string; badgeKey: string; actionLabelKey: string
})[] = [
    { id: "calculator",       icon: <Calculator className="w-5 h-5" />,   bgIcon: <Calculator style={{ width: 72, height: 72 }} />,   labelKey: "dashboard.actions.calculator.label", descKey: "dashboard.actions.calculator.desc", badgeKey: "dashboard.actions.calculator.badge", actionLabelKey: "dashboard.actions.calculator.action", theme: "cyan",  priority: "secondary" },
    { id: "schedule",         icon: <Calendar className="w-5 h-5" />,     bgIcon: <Calendar style={{ width: 72, height: 72 }} />,     labelKey: "dashboard.actions.schedule.label",   descKey: "dashboard.actions.schedule.desc",   badgeKey: "dashboard.actions.schedule.badge",   actionLabelKey: "dashboard.actions.schedule.action",   theme: "blue",  priority: "secondary" },
    { id: "delivery_history", icon: <ListOrdered className="w-5 h-5" />,  bgIcon: <ListOrdered style={{ width: 72, height: 72 }} />,  labelKey: "dashboard.actions.history.label",    descKey: "dashboard.actions.history.desc",    badgeKey: "dashboard.actions.history.badge",    actionLabelKey: "dashboard.actions.history.action",    theme: "slate", priority: "secondary" },
];

// ---------------------------------------------------------------------------
// CarouselCard inline style konstantalari
// ---------------------------------------------------------------------------

/**
 * Ad karta media elementi uchun CSS mask-image.
 * Separate overlay div'ga ehtiyoj yo'q — background qanday bo'lsa ham ishlaydi:
 *   transparent 0% → rasm chap tomonidan ko'rinmaydi (background shaffof ko'rinadi)
 *   black 30%      → rasm o'ng tomonda to'liq ko'rinadi
 * Bu yondashuv white/gradient/dark background larning barchasida qo'shimcha overlay
 * div kerak qilmaydi va "qorong'i chiziq" artefakti yo'qoladi.
 */
const AD_IMAGE_MASK: CSSProperties = {
    maskImage:       'linear-gradient(to top, transparent 0%, rgba(0,0,0,0.6) 32%, black 58%)',
    WebkitMaskImage: 'linear-gradient(to top, transparent 0%, rgba(0,0,0,0.6) 32%, black 58%)',
};

/** Feature karta (mediaUrl bor, mainIcon yo'q): kontent overlay */
const FEATURE_MEDIA_OVERLAY_STYLE: CSSProperties = {
    background:
        "linear-gradient(90deg, rgba(var(--akb-surface-rgb, 255, 255, 255), 1) 0%, rgba(var(--akb-surface-rgb, 255, 255, 255), 0.92) 45%, rgba(var(--akb-surface-rgb, 255, 255, 255), 0.12) 100%)",
};

const CarouselCard = memo(({ item, onView }: { item: CarouselItemData; onView?: () => void }) => {
    const { t } = useTranslation();
    const cardRef = useRef<HTMLDivElement>(null);
    const isAd = item.type === "ad";
    const hasGradient = !!item.gradientStyle || !!item.gradient;
    const hasFeatureGradient = item.type === "feature" && hasGradient;
    const title = item.titleKey ? t(item.titleKey) : item.title;
    const sub   = item.subKey   ? t(item.subKey)   : item.sub;

    // onView — IntersectionObserver bilan bir marta ishga tushadi
    useEffect(() => {
        if (!onView || !cardRef.current) return;
        const observer = new IntersectionObserver(
            ([entry]) => {
                if (entry.isIntersecting) {
                    onView();
                    observer.disconnect();
                }
            },
            { threshold: 0.5 },
        );
        observer.observe(cardRef.current);
        return () => observer.disconnect();
    }, [onView]);

    if (isAd) {
        const adHasGradient = !!item.gradientStyle;
        // textColor faqat API tomonidan ATAYLAB o'rnatilgan bo'lsa ishlatiladi,
        // aks holda gradient karta uchun default qora matn (light bg uchun o'qiladi)
        const titleColor = item.textColor ?? '#07182f';
        const subTextClass = "flex items-center gap-1 text-sm font-medium leading-snug text-[#63758a]";
        const badgeClass = adHasGradient
            ? "absolute left-4 top-4 rounded-md border border-white/25 bg-white/15 px-2 py-1 text-[10px] font-semibold uppercase backdrop-blur-sm dark:border-white/30 bg-white/60 text-[#f3f3f3]"
            : "absolute left-4 top-4 rounded-md border border-[#cfe0f1] bg-[#eef7ff] px-2 py-1 text-[10px] font-semibold uppercase dark:border-[#2B4166] bg-white/60 text-[#f3f3f3]";
        const topBarClass = adHasGradient
            ? "absolute inset-x-0 top-0 h-1 bg-[#0b4edb]/40"
            : "absolute inset-x-0 top-0 h-1 bg-[#0b4edb]";

        return (
            <div
                ref={cardRef}
                className="h-full w-full rounded-lg relative overflow-hidden text-left cursor-pointer transition-all duration-300 border border-[#dbe8f4] group hover:border-[#0b84e5]"
                style={{
                    background: adHasGradient ? item.gradientStyle : '#ffffff',
                    boxShadow: '0 10px 24px rgba(15,47,87,0.08)',
                }}
            >
                {/* Rasm — mask-image orqali chap tomoni shaffof (overlay div kerak emas) */}
                {item.mediaUrl && (
                    item.mediaType === "video" ? (
                        <video
                            src={item.mediaUrl}
                            className="absolute inset-0 h-full w-full object-cover transition-transform duration-700 group-hover:scale-105"
                            style={AD_IMAGE_MASK}
                            autoPlay muted loop playsInline
                        />
                    ) : (
                        <img
                            src={item.mediaUrl}
                            alt={item.title || "Ad"}
                            className="absolute inset-0 h-full w-full object-cover transition-transform duration-700 group-hover:scale-105"
                            style={AD_IMAGE_MASK}
                        />
                    )
                )}

                <div className={topBarClass} />
                <div className={badgeClass}>{t('dashboard.carousel.badge', 'Yangilik')}</div>

                <div className="absolute inset-0 z-10 flex max-w-[68%] flex-col justify-end p-5 sm:p-6">
                    {title && (
                        <h3
                            className="mb-2 text-lg font-semibold leading-tight sm:text-xl"
                            style={{ color: titleColor }}
                        >
                            {title}
                        </h3>
                    )}
                    {sub && (
                        <p className={subTextClass}>
                            {sub} <ChevronRight className="w-4 h-4" />
                        </p>
                    )}
                </div>
            </div>
        );
    }

    return (
        <div
            ref={cardRef}
            className={`h-full w-full rounded-lg relative overflow-hidden cursor-pointer transition-all duration-300 ${
                hasFeatureGradient
                    ? `border border-white/15 shadow-[0_16px_34px_rgba(15,47,87,0.18)] ${item.gradient ? `bg-gradient-to-br ${item.gradient}` : ""}`
                    : "border border-[#dbe8f4] bg-white shadow-[0_10px_24px_rgba(15,47,87,0.08)] hover:border-[#0b84e5]"
            }`}
            style={item.gradientStyle ? { background: item.gradientStyle } : undefined}
        >
            {item.mediaUrl && !item.mainIcon && (
                <>
                    <img
                        src={item.mediaUrl}
                        alt={item.title || "Feature"}
                        className="absolute inset-y-0 right-0 h-full w-[72%] object-cover"
                    />
                    <div className="absolute inset-0" style={FEATURE_MEDIA_OVERLAY_STYLE} />
                </>
            )}

            <div className={`absolute inset-x-0 top-0 h-1 ${hasFeatureGradient ? "bg-white/70" : "bg-[#0b4edb]"}`} />
            {hasFeatureGradient ? (
                <>
                    <div className="absolute -right-8 top-5 h-24 w-24 rounded-full bg-white/20 blur-2xl" />
                    <div className="absolute bottom-0 left-0 h-24 w-24 rounded-full bg-black/10 blur-2xl" />
                    {item.bgIcon && <div className="absolute inset-0">{item.bgIcon}</div>}
                </>
            ) : (
                <div className="absolute right-4 top-4 h-16 w-16 rounded-lg border border-[#dbe8f4] bg-[#f8fbfe]" />
            )}

            <div className="h-full flex flex-col justify-between relative z-10 p-5 sm:p-6">
                {item.mainIcon ? (
                    <div className={`relative z-20 hidden h-12 w-12 shrink-0 rounded-xl items-center justify-center text-white sm:flex ${
                        hasFeatureGradient
                            ? "border border-white/20 bg-white/15 text-white shadow-lg backdrop-blur-sm"
                            : "border border-[#cfe0f1] bg-[#eef7ff] text-[#0b4edb]"
                    }`}>
                        {item.mainIcon}
                    </div>
                ) : item.mediaUrl ? (
                    <div className={`self-start rounded-md px-2 py-1 text-[10px] font-bold uppercase tracking-normal ${
                        hasFeatureGradient
                            ? "border border-white/20 bg-white/15 text-white backdrop-blur-sm"
                            : "border border-[#cfe0f1] bg-[#eef7ff] text-[#0b4edb]"
                    }`}>
                        {t('dashboard.carousel.badge', 'Yangilik')}
                    </div>
                ) : (
                    <div />
                )}

                <div className={`${item.mediaUrl && !item.mainIcon ? "max-w-[72%]" : ""} ${item.mainIcon ? "pt-16 sm:pt-0" : ""}`}>
                    <h3
                        className={`mb-2 text-lg font-semibold leading-tight sm:text-xl ${hasFeatureGradient ? "text-white" : "text-[#07182f]"}`}
                        style={item.textColor ? { color: item.textColor } : undefined}
                    >
                        {title}
                    </h3>
                    {sub && (
                        <p className={`text-sm font-medium leading-snug ${hasFeatureGradient ? "text-white/82" : "text-[#63758a]"}`}>
                            {sub}
                        </p>
                    )}
                </div>
            </div>
        </div>
    );
});

CarouselCard.displayName = "CarouselCard";

// ---------------------------------------------------------------------------
// SectionTitle
// ---------------------------------------------------------------------------
const SectionTitle = memo(({
    children,
    accessory,
}: {
    children: React.ReactNode;
    accessory?: React.ReactNode;
}) => (
    <div className="mb-4 flex items-center gap-3">
        <div className="inline-flex min-w-0 items-center gap-2 rounded-full border border-[#dbe8f4] bg-white/80 px-3 py-2 shadow-[0_10px_24px_rgba(15,47,87,0.08)] backdrop-blur-sm dark:border-white/10 dark:bg-[#102038]/72 dark:shadow-[0_12px_24px_rgba(2,10,20,0.24)]">
            <span className="h-2.5 w-2.5 shrink-0 rounded-full bg-[#0b4edb] shadow-[0_0_0_4px_rgba(11,78,219,0.14)] dark:bg-[#39C6FF] dark:shadow-[0_0_0_4px_rgba(57,198,255,0.12)]" />
            <h2 className="truncate text-[1.02rem] font-semibold leading-tight tracking-normal text-[#07182f] dark:text-white sm:text-lg">
                {children}
            </h2>
        </div>
        <div className="h-px flex-1 rounded-full bg-[linear-gradient(90deg,rgba(11,78,219,0.22),rgba(207,224,241,0.6),rgba(255,255,255,0))] dark:bg-[linear-gradient(90deg,rgba(57,198,255,0.26),rgba(143,160,188,0.18),rgba(255,255,255,0))]" />
        {accessory}
    </div>
));

SectionTitle.displayName = "SectionTitle";

// ---------------------------------------------------------------------------
// Carousel cube — CSS custom property, modul darajasida bir marta
// ---------------------------------------------------------------------------
const CUBE_SHELL_STYLE: CSSProperties = { ['--akb-cube-depth' as string]: 'clamp(6.8rem, 19vw, 9rem)' };

// ---------------------------------------------------------------------------
// Tab icon lookup — conditional rendering o'rniga O(1) map
// ---------------------------------------------------------------------------
const TAB_ICONS: Record<string, React.ReactNode> = {
    track:            <ScanBarcode className="relative z-10 h-4 w-4" />,
    schedule:         <Calendar    className="relative z-10 h-4 w-4" />,
    request:          <Edit3       className="relative z-10 h-4 w-4" />,
    delivery_history: <ListOrdered className="relative z-10 h-4 w-4" />,
};

// ---------------------------------------------------------------------------
// ImportantCarouselSection
// ---------------------------------------------------------------------------
const ImportantCarouselSection = memo(({
    sortedCarouselItems,
    boundedCarouselIndex,
    onStep,
    onSelect,
    onItemClick,
    onTouchStart,
    onTouchEnd,
    onPause,
    onResume,
    isCubeAnimating,
    cubeRotation,
    onCubeTransitionEnd,
}: {
    sortedCarouselItems: CarouselItemData[];
    boundedCarouselIndex: number;
    onStep: (direction: 1 | -1) => void;
    onSelect: (index: number) => void;
    onItemClick: (item: CarouselItemData) => void;
    onTouchStart: (e: React.TouchEvent) => void;
    onTouchEnd: (e: React.TouchEvent) => void;
    onPause: () => void;
    onResume: () => void;
    isCubeAnimating: boolean;
    cubeRotation: number;
    onCubeTransitionEnd: () => void;
}) => {
    const { t } = useTranslation();
    const hasMultipleSlides = sortedCarouselItems.length > 1;
    const totalSlides       = sortedCarouselItems.length;

    const getItemAtOffset = useCallback(
        (offset: number) => {
            if (totalSlides === 0) return null;
            return sortedCarouselItems[(boundedCarouselIndex + offset + totalSlides) % totalSlides];
        },
        [boundedCarouselIndex, sortedCarouselItems, totalSlides],
    );

    const frontItem = getItemAtOffset(0);
    const rightItem = totalSlides > 1 ? getItemAtOffset(1)  : null;
    const backItem  = totalSlides > 2 ? getItemAtOffset(2)  : null;
    const leftItem  = totalSlides > 1 ? getItemAtOffset(-1) : null;
    const mobileIconItem = isCubeAnimating
        ? (cubeRotation < 0 ? rightItem : leftItem) ?? frontItem
        : frontItem;

    const cubeTransform = useMemo<CSSProperties>(
        () => ({
            transform: `translateZ(calc(var(--akb-cube-depth) * -1)) rotateY(${cubeRotation}deg)`,
            transition: isCubeAnimating ? 'transform 620ms cubic-bezier(0.22, 0.7, 0.12, 1)' : 'none',
        }),
        [cubeRotation, isCubeAnimating],
    );

    const handleTransitionEnd = useCallback(
        (event: React.TransitionEvent<HTMLDivElement>) => {
            if (
                event.target !== event.currentTarget ||
                event.propertyName !== 'transform' ||
                !isCubeAnimating
            ) return;
            onCubeTransitionEnd();
        },
        [isCubeAnimating, onCubeTransitionEnd],
    );

    return (
        <section>
            <SectionTitle>{t('dashboard.sections.important')}</SectionTitle>

            <div
                className="relative -mx-1 px-1 pb-4 sm:mx-0 sm:px-0"
                onTouchStart={onTouchStart}
                onTouchEnd={onTouchEnd}
                onMouseEnter={onPause}
                onMouseLeave={onResume}
            >
                <div
                    className="relative h-[184px] overflow-hidden rounded-[22px] sm:h-[220px] [perspective:2200px]"
                    style={CUBE_SHELL_STYLE}
                >
                    {mobileIconItem?.mainIcon && (
                        <div className="absolute left-[calc(4.5%+1.1rem)] top-5 z-20 flex h-12 w-12 items-center justify-center rounded-xl border border-white/24 bg-white/18 text-white shadow-[0_10px_24px_rgba(15,47,87,0.18)] backdrop-blur-sm sm:hidden">
                            {mobileIconItem.mainIcon}
                        </div>
                    )}

                    <div
                        className="absolute inset-0 [transform-style:preserve-3d]"
                        style={cubeTransform}
                        onTransitionEnd={handleTransitionEnd}
                    >
                        {frontItem && (
                            <button
                                key={`front-${frontItem.id}`}
                                type="button"
                                className="group absolute inset-y-3 left-[4.5%] right-[4.5%] h-auto text-left outline-none [backface-visibility:hidden] [transform-style:preserve-3d] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-500 sm:inset-y-4 sm:left-[7%] sm:right-[7%]"
                                style={{ transform: 'translateZ(var(--akb-cube-depth))' }}
                                onClick={() => onItemClick(frontItem)}
                            >
                                <div className="relative h-full rounded-[22px] shadow-[0_24px_46px_rgba(15,47,87,0.16)]">
                                    <CarouselCard item={frontItem} />
                                </div>
                            </button>
                        )}

                        {rightItem && (
                            <div
                                key={`right-${rightItem.id}`}
                                aria-hidden="true"
                                className="pointer-events-none absolute inset-y-3 left-[4.5%] right-[4.5%] h-auto opacity-90 [backface-visibility:hidden] sm:inset-y-4 sm:left-[7%] sm:right-[7%]"
                                style={{ transform: 'rotateY(90deg) translateZ(var(--akb-cube-depth))' }}
                            >
                                <div className="relative h-full rounded-[22px] shadow-[0_20px_36px_rgba(15,47,87,0.12)]">
                                    <div className="pointer-events-none absolute inset-0 rounded-[22px] bg-[#07182f]/5" />
                                    <CarouselCard item={rightItem} />
                                </div>
                            </div>
                        )}

                        {backItem && (
                            <div
                                key={`back-${backItem.id}`}
                                aria-hidden="true"
                                className="pointer-events-none absolute inset-y-3 left-[4.5%] right-[4.5%] h-auto opacity-80 [backface-visibility:hidden] sm:inset-y-4 sm:left-[7%] sm:right-[7%]"
                                style={{ transform: 'rotateY(180deg) translateZ(var(--akb-cube-depth))' }}
                            >
                                <div className="relative h-full rounded-[22px] shadow-[0_16px_30px_rgba(15,47,87,0.1)]">
                                    <div className="pointer-events-none absolute inset-0 rounded-[22px] bg-[#07182f]/10" />
                                    <CarouselCard item={backItem} />
                                </div>
                            </div>
                        )}

                        {leftItem && (
                            <div
                                key={`left-${leftItem.id}`}
                                aria-hidden="true"
                                className="pointer-events-none absolute inset-y-3 left-[4.5%] right-[4.5%] h-auto opacity-90 [backface-visibility:hidden] sm:inset-y-4 sm:left-[7%] sm:right-[7%]"
                                style={{ transform: 'rotateY(-90deg) translateZ(var(--akb-cube-depth))' }}
                            >
                                <div className="relative h-full rounded-[22px] shadow-[0_20px_36px_rgba(15,47,87,0.12)]">
                                    <div className="pointer-events-none absolute inset-0 rounded-[22px] bg-[#07182f]/5" />
                                    <CarouselCard item={leftItem} />
                                </div>
                            </div>
                        )}
                    </div>

                    {hasMultipleSlides && (
                        <>
                            <button
                                type="button"
                                aria-label={t('dashboard.carousel.previous', 'Oldingi')}
                                disabled={isCubeAnimating}
                                onClick={() => onStep(-1)}
                                className="absolute left-2 top-1/2 z-10 hidden h-10 w-10 -translate-y-1/2 items-center justify-center rounded-full border border-white/45 bg-white/78 text-[#0b4edb] shadow-[0_10px_22px_rgba(15,47,87,0.12)] backdrop-blur-sm transition hover:bg-white disabled:opacity-40 md:flex"
                            >
                                <ChevronLeft className="h-5 w-5" />
                            </button>
                            <button
                                type="button"
                                aria-label={t('dashboard.carousel.next', 'Keyingi')}
                                disabled={isCubeAnimating}
                                onClick={() => onStep(1)}
                                className="absolute right-2 top-1/2 z-10 hidden h-10 w-10 -translate-y-1/2 items-center justify-center rounded-full border border-white/45 bg-white/78 text-[#0b4edb] shadow-[0_10px_22px_rgba(15,47,87,0.12)] backdrop-blur-sm transition hover:bg-white disabled:opacity-40 md:flex"
                            >
                                <ChevronRight className="h-5 w-5" />
                            </button>
                        </>
                    )}
                </div>

                {sortedCarouselItems.length > 1 && (
                    <div className="mt-3 flex items-center justify-center gap-1.5">
                        {sortedCarouselItems.map((item, index) => (
                            <button
                                key={`${item.fromApi ? "api" : "static"}-dot-${item.id}`}
                                type="button"
                                onClick={() => onSelect(index)}
                                className={`h-1.5 rounded-full transition-all duration-300 ${index === boundedCarouselIndex ? "w-6 bg-[#0b4edb]" : "w-1.5 bg-[#cfe0f1] hover:bg-[#9edcf0]"}`}
                                aria-label={`${index + 1}`}
                            />
                        ))}
                    </div>
                )}
            </div>
        </section>
    );
});

ImportantCarouselSection.displayName = "ImportantCarouselSection";

// ---------------------------------------------------------------------------
// HeaderTabs
// ---------------------------------------------------------------------------
const HeaderTabs = memo(({ activeTab, setActiveTab }: { activeTab: string; setActiveTab: (t: string) => void }) => {
    const { t } = useTranslation();
    const trackLabel = t(
        activeTab === 'track'            ? 'dashboard.tabs.track'   :
        activeTab === 'schedule'         ? 'dashboard.tabs.schedule':
        activeTab === 'request'          ? 'dashboard.tabs.request' :
        activeTab === 'delivery_history' ? 'dashboard.tabs.history' :
                                           'dashboard.tabs.track'
    );
    const activeIcon = TAB_ICONS[activeTab] ?? TAB_ICONS.track;

    return (
        <div className="relative mb-5 z-10">
            <div className="grid grid-cols-[1fr_1.35fr] items-center gap-2 rounded-lg border border-[#dbe8f4] bg-white p-1.5 shadow-sm">
                <button
                    onClick={() => setActiveTab("home")}
                    className="relative flex h-11 items-center justify-center gap-2 overflow-hidden rounded-md px-3 text-sm font-semibold text-[#63758a] transition-colors hover:bg-[#eef6ff] hover:text-[#0b4edb]"
                >
                    <Home className="h-4 w-4" />
                    <span className="relative z-10">{t('dashboard.tabs.home')}</span>
                </button>

                <div className="relative flex h-11 items-center justify-center gap-2 overflow-hidden rounded-md bg-[#0b4edb] px-3 text-sm font-semibold text-white shadow-sm">
                    {activeIcon}
                    <span className="relative z-10">{trackLabel}</span>
                </div>
            </div>
        </div>
    );
});

HeaderTabs.displayName = "HeaderTabs";

// ---------------------------------------------------------------------------
// Loading fallback
// ---------------------------------------------------------------------------
const PageLoadingFallback = memo(() => {
    const { t } = useTranslation();
    return (
        <div className="min-h-[60vh] flex flex-col items-center justify-center w-full animate-in fade-in duration-300">
            <div className="w-16 h-16 relative flex items-center justify-center">
                <div className="absolute inset-0 rounded-full border-4 border-[#dbe8f4]" />
                <div className="absolute inset-0 rounded-full border-4 border-transparent border-t-cyan-500 border-r-cyan-500 animate-spin" />
                <Plane className="w-6 h-6 text-cyan-500 animate-pulse absolute" />
            </div>
            <p className="mt-4 text-sm font-medium text-[#63758a] animate-pulse">
                {t('dashboard.loading')}
            </p>
        </div>
    );
});

PageLoadingFallback.displayName = "PageLoadingFallback";

// ---------------------------------------------------------------------------
// DashboardHeader
// ---------------------------------------------------------------------------
const DashboardHeader = memo(({ name }: { name?: string }) => {
    const { t } = useTranslation();
    const displayName = name?.trim().split(/\s+/)[0];

    return (
        <header className="mb-4">
            <div className="rounded-lg border border-[#dbe8f4] bg-white p-4 shadow-[0_8px_20px_rgba(15,47,87,0.05)]">
                <p className="text-sm font-medium text-[#0b84e5]">{t('dashboard.greeting', 'Assalomu alaykum 👋')}</p>
                <h1 className="mt-1 max-w-md text-xl font-semibold leading-tight text-[#07182f]">
                    {displayName
                        ? `${displayName}, ${t('dashboard.welcomeCabinet', 'welcome to your AKB Cargo cabinet')}`
                        : t('dashboard.customerWelcome', 'Welcome to your AKB Cargo cabinet')}
                </h1>
                <p className="mt-1 text-xs font-medium uppercase tracking-[0.08em] text-[#7d91a8]">
                    {t('dashboard.customer', 'AKB Cargo mijozi')}
                </p>
                <p className="mt-3 max-w-md text-sm leading-6 text-[#63758a]">
                    {t('dashboard.heroSubtitle', 'Yukingizni kuzating, zayavka qoldiring va to\'lovlarni boshqaring.')}
                </p>
            </div>
        </header>
    );
});

DashboardHeader.displayName = "DashboardHeader";

// ---------------------------------------------------------------------------
// Lazy imports
// ---------------------------------------------------------------------------
const ChinaAddressModal    = lazy(() => import('../components/modals/ChinaAddressModal'));
const MakePaymentModal     = lazy(() => import('../components/modals/MakePaymentModal'));
const FlightSchedulePage   = lazy(() => import('../components/pages/FlightSchedulePage'));
const DeliveryRequestPage  = lazy(() => import('../components/pages/DeliveryRequestPage'));
const DeliveryHistoryPage  = lazy(() => import('../components/pages/DeliveryHistoryPage'));
const CalculatorModal      = lazy(() => import('../components/modals/CalculatorModal'));
const ProhibitedItemsModal = lazy(() => import('../components/modals/ProhibitedItemsModal'));

// ---------------------------------------------------------------------------
// Dashboard
// ---------------------------------------------------------------------------
interface DashboardProps {
    onNavigateToReports?: () => void;
    onNavigateToHistory?: () => void;
}

export default function Dashboard({ onNavigateToReports, onNavigateToHistory }: DashboardProps) {
    const [activeTab, setActiveTab] = useState(() => {
        const params = new URLSearchParams(window.location.search);
        const tab    = params.get("tab");
        const valid  = ["home", "track", "schedule", "request", "delivery_history"];
        return valid.includes(tab ?? "") ? (tab as string) : "home";
    });

    const [isChinaModalOpen,      setIsChinaModalOpen]      = useState(false);
    const [isPaymentModalOpen,    setIsPaymentModalOpen]    = useState(false);
    const [isCalculatorOpen,      setIsCalculatorOpen]      = useState(false);
    const [isProhibitedModalOpen, setIsProhibitedModalOpen] = useState(false);
    const [mediaModalItem,        setMediaModalItem]        = useState<CarouselItemData | null>(null);

    const { t }              = useTranslation();
    const { data: profile }  = useProfile();

    const { data: apiCarouselItems } = useQuery({
        queryKey: ['carousel-items'],
        queryFn:  getActiveCarouselItems,
        staleTime: 5 * 60 * 1000,
        retry: 1,
    });

    const sortedCarouselItems = useMemo((): CarouselItemData[] => {
        const fromApi: CarouselItemData[] = apiCarouselItems
            ? [...apiCarouselItems]
                .sort((a, b) => a.order - b.order)
                .map((item) => ({
                    id:           item.id,
                    type:         item.type as "ad" | "feature",
                    title:        item.title       ?? undefined,
                    sub:          item.sub_title   ?? undefined,
                    gradientStyle: item.gradient   ?? 'linear-gradient(135deg, #eef7ff, #eafaff)',
                    mediaType:    item.media_type,
                    mediaUrl:     item.media_url,
                    actionUrl:    item.action_url  ?? undefined,
                    textColor:    item.text_color,
                    fromApi:      true,
                    mediaItems:   item.media_items ?? [],
                }))
            : [];

        const staticFeatures = CAROUSEL_ITEMS
            .filter(i => i.type === "feature")
            .sort((a, b) => a.id - b.id);

        return [...fromApi, ...staticFeatures];
    }, [apiCarouselItems]);

    // Touch refs
    const touchStartX          = useRef<number | null>(null);
    const touchStartY          = useRef<number | null>(null);
    const carouselTouchStartX  = useRef<number | null>(null);
    const carouselTouchStartY  = useRef<number | null>(null);
    const viewedCarouselIdsRef = useRef<Set<number>>(new Set());

    // Carousel state
    const [activeCarouselIndex, setActiveCarouselIndex] = useState(0);
    const [isCarouselPaused,    setIsCarouselPaused]    = useState(false);
    const [isCubeAnimating,     setIsCubeAnimating]     = useState(false);
    const [cubeRotation,        setCubeRotation]        = useState(0);
    const [cubeDirection,       setCubeDirection]       = useState<1 | -1>(1);

    const boundedCarouselIndex = sortedCarouselItems.length > 0
        ? Math.min(activeCarouselIndex, sortedCarouselItems.length - 1)
        : 0;
    const activeCarouselItem = sortedCarouselItems[boundedCarouselIndex];

    // ── Handlers ────────────────────────────────────────────────────────────

    const handleCarouselStep = useCallback((direction: 1 | -1) => {
        if (sortedCarouselItems.length <= 1 || isCubeAnimating) return;
        setCubeDirection(direction);
        setCubeRotation(direction === 1 ? -90 : 90);
        setIsCubeAnimating(true);
    }, [isCubeAnimating, sortedCarouselItems.length]);

    const handleCubeTransitionEnd = useCallback(() => {
        setIsCubeAnimating(false);
        setCubeRotation(0);
        setActiveCarouselIndex((cur) =>
            (cur + cubeDirection + sortedCarouselItems.length) % sortedCarouselItems.length
        );
    }, [cubeDirection, sortedCarouselItems.length]);

    const handleCarouselSelect = useCallback((index: number) => {
        const total = sortedCarouselItems.length;
        if (total === 0) return;
        const next = (boundedCarouselIndex + 1) % total;
        const prev = (boundedCarouselIndex - 1 + total) % total;
        if (index === next) { handleCarouselStep(1);  return; }
        if (index === prev) { handleCarouselStep(-1); return; }
        setActiveCarouselIndex(index);
    }, [boundedCarouselIndex, handleCarouselStep, sortedCarouselItems.length]);

    const handleSetActiveTab = useCallback((tab: string) => {
        setActiveTab(tab);
        const url = new URL(window.location.href);
        if (tab === "home") {
            url.searchParams.delete("tab");
        } else {
            url.searchParams.set("tab", tab);
        }
        window.history.replaceState(null, "", url.toString());
    }, []);

    const handleCarouselItemClick = useCallback((item: CarouselItemData) => {
        if (item.fromApi) {
            const hasGallery = (item.mediaItems?.length ?? 0) > 1;
            if (hasGallery) {
                setMediaModalItem(item);
            } else if (item.actionUrl) {
                trackCarouselClick(item.id);
                window.open(item.actionUrl, "_blank");
            }
        } else {
            if (item.id === 1) setIsProhibitedModalOpen(true);
        }
    }, []);

    const handleActionClick = useCallback((id: string) => {
        switch (id) {
            case 'calculator':       setIsCalculatorOpen(true);              break;
            case 'history':          onNavigateToHistory?.();                break;
            case 'china':            setIsChinaModalOpen(true);              break;
            case 'schedule':         handleSetActiveTab('schedule');         break;
            case 'request':          handleSetActiveTab('request');          break;
            case 'delivery_history': handleSetActiveTab('delivery_history'); break;
            case 'payment':          setIsPaymentModalOpen(true);            break;
            case 'report':           onNavigateToReports?.();                break;
            default:                 toast.info(t('dashboard.toast.comingSoon', { id }));
        }
    }, [handleSetActiveTab, onNavigateToHistory, onNavigateToReports, t]);

    const onTouchStart = useCallback((e: React.TouchEvent) => {
        touchStartX.current = e.targetTouches[0].clientX;
        touchStartY.current = e.targetTouches[0].clientY;
        setIsCarouselPaused(true);
    }, []);

    const onTouchEnd = useCallback((e: React.TouchEvent) => {
        if (!touchStartX.current || !touchStartY.current) return;
        const distanceX = touchStartX.current - e.changedTouches[0].clientX;
        const distanceY = touchStartY.current - e.changedTouches[0].clientY;
        const minSwipe = 50;
        if (Math.abs(distanceX) > Math.abs(distanceY)) {
            if (distanceX >  minSwipe) handleSetActiveTab("track");
            if (distanceX < -minSwipe) handleSetActiveTab("home");
        }
        touchStartX.current = null;
        touchStartY.current = null;
        setTimeout(() => setIsCarouselPaused(false), 3000);
    }, [handleSetActiveTab]);

    const onCarouselTouchStart = useCallback((e: React.TouchEvent) => {
        e.stopPropagation();
        carouselTouchStartX.current = e.targetTouches[0].clientX;
        carouselTouchStartY.current = e.targetTouches[0].clientY;
        setIsCarouselPaused(true);
    }, []);

    const onCarouselTouchEnd = useCallback((e: React.TouchEvent) => {
        e.stopPropagation();
        if (carouselTouchStartX.current === null || carouselTouchStartY.current === null) {
            setTimeout(() => setIsCarouselPaused(false), 3000);
            return;
        }
        const distanceX = carouselTouchStartX.current - e.changedTouches[0].clientX;
        const distanceY = carouselTouchStartY.current - e.changedTouches[0].clientY;
        if (Math.abs(distanceX) > Math.abs(distanceY) && Math.abs(distanceX) > 36) {
            handleCarouselStep(distanceX > 0 ? 1 : -1);
        }
        carouselTouchStartX.current = null;
        carouselTouchStartY.current = null;
        setTimeout(() => setIsCarouselPaused(false), 3000);
    }, [handleCarouselStep]);

    const handleCarouselPause  = useCallback(() => setIsCarouselPaused(true),  []);
    const handleCarouselResume = useCallback(() => setIsCarouselPaused(false), []);

    // ── Effects ─────────────────────────────────────────────────────────────

    useEffect(() => {
        if (!activeCarouselItem?.fromApi || activeTab !== "home") return;
        if (viewedCarouselIdsRef.current.has(activeCarouselItem.id)) return;
        viewedCarouselIdsRef.current.add(activeCarouselItem.id);
        trackCarouselView(activeCarouselItem.id);
    }, [activeCarouselItem?.fromApi, activeCarouselItem?.id, activeTab]);

    useEffect(() => {
        if (activeTab !== "home" || isCarouselPaused || sortedCarouselItems.length <= 1) return;
        const interval = setInterval(() => handleCarouselStep(1), 4500);
        return () => clearInterval(interval);
    }, [activeTab, handleCarouselStep, isCarouselPaused, sortedCarouselItems.length]);

    // ── Render ───────────────────────────────────────────────────────────────

    return (
        <div
            className="min-h-screen bg-[#f4f8fc] text-[#07182f] pb-24 font-sans selection:bg-[#37c5f3]/20"
            onTouchStart={onTouchStart}
            onTouchEnd={onTouchEnd}
        >
            <UniqueBackground />

            <div className="relative z-10 max-w-4xl mx-auto px-4 pt-[80px]">
                {activeTab !== "home" && activeTab !== "track" && <DashboardHeader name={profile?.full_name} />}
                {activeTab !== "home" && <HeaderTabs activeTab={activeTab} setActiveTab={handleSetActiveTab} />}

                {activeTab === 'schedule' && (
                    <Suspense fallback={<PageLoadingFallback />}>
                        <FlightSchedulePage
                            onBack={() => handleSetActiveTab('home')}
                            onNavigateToTrack={() => handleSetActiveTab('track')}
                        />
                    </Suspense>
                )}

                {activeTab === 'request' && (
                    <Suspense fallback={<PageLoadingFallback />}>
                        <DeliveryRequestPage
                            onBack={() => handleSetActiveTab('home')}
                            onNavigateToProfile={() => {}}
                            onNavigateToHistory={() => handleSetActiveTab('delivery_history')}
                        />
                    </Suspense>
                )}

                {activeTab === 'delivery_history' && (
                    <Suspense fallback={<PageLoadingFallback />}>
                        <DeliveryHistoryPage onBack={() => handleSetActiveTab('home')} />
                    </Suspense>
                )}

                {activeTab === "home" ? (
                    <div className="space-y-4 animate-in fade-in slide-in-from-bottom-4 duration-500">
                        <ImportantCarouselSection
                            sortedCarouselItems={sortedCarouselItems}
                            boundedCarouselIndex={boundedCarouselIndex}
                            onStep={handleCarouselStep}
                            onSelect={handleCarouselSelect}
                            onItemClick={handleCarouselItemClick}
                            onTouchStart={onCarouselTouchStart}
                            onTouchEnd={onCarouselTouchEnd}
                            onPause={handleCarouselPause}
                            onResume={handleCarouselResume}
                            isCubeAnimating={isCubeAnimating}
                            cubeRotation={cubeRotation}
                            onCubeTransitionEnd={handleCubeTransitionEnd}
                        />

                        <TrackCodeTab embedded onCargoClick={onNavigateToReports} />

                        <section>
                            <SectionTitle>{t('dashboard.sections.mainActions', 'Asosiy amallar')}</SectionTitle>
                            <div className="grid grid-cols-2 gap-3">
                                {PRIMARY_ACTIONS.map((action) => (
                                    <ActionButton
                                        key={action.id}
                                        item={{
                                            ...action,
                                            label:       t(action.labelKey),
                                            desc:        t(action.descKey),
                                            badge:       t(action.badgeKey),
                                            actionLabel: t(action.actionLabelKey),
                                        }}
                                        onClick={() => handleActionClick(action.id)}
                                    />
                                ))}
                            </div>
                        </section>

                        <section>
                            <SectionTitle>{t('dashboard.sections.services')}</SectionTitle>
                            <div className="grid grid-cols-1 gap-2.5 sm:grid-cols-3">
                                {SECONDARY_ACTIONS.map((action) => (
                                    <ActionButton
                                        key={action.id}
                                        item={{
                                            ...action,
                                            label:       t(action.labelKey),
                                            desc:        t(action.descKey),
                                            badge:       t(action.badgeKey),
                                            actionLabel: t(action.actionLabelKey),
                                        }}
                                        onClick={() => handleActionClick(action.id)}
                                    />
                                ))}
                            </div>
                        </section>

                        <section className="pb-8 px-1">
                            <button
                                className="group relative grid w-full grid-cols-[auto_1fr_auto] items-center gap-3 overflow-hidden rounded-lg p-3 bg-white text-[#07182f] border border-[#dbe8f4] active:scale-[0.98] transition-all duration-300 shadow-sm hover:border-[#0b84e5] hover:bg-[#f8fbfe]"
                                onClick={() => window.open("https://t.me/mandarin_admin", "_blank")}
                            >
                                <div className="absolute inset-y-2 left-2 w-1 rounded-lg bg-[#0b84e5]" />
                                <div className="w-11 h-11 rounded-lg bg-[#eef7ff] text-[#0b4edb] flex items-center justify-center transition-transform group-hover:scale-105">
                                    <MessageSquare className="w-5 h-5" />
                                </div>
                                <div className="min-w-0 text-left">
                                    <h3 className="text-sm font-bold">{t('dashboard.sections.feedback')}</h3>
                                    <p className="text-[10px] text-[#63758a] font-medium">{t('dashboard.sections.contactUs')}</p>
                                </div>
                                <div className="h-9 w-9 rounded-lg bg-[#0b4edb] text-white flex items-center justify-center group-hover:translate-x-1 transition-transform">
                                    <ChevronRight className="w-5 h-5" />
                                </div>
                            </button>

                            <div className="text-center mt-6">
                                <p className="text-[10px] text-[#9fb7cc] font-mono">v2.0 - AKB Cargo</p>
                            </div>
                        </section>
                    </div>
                ) : activeTab === "track" ? (
                    <TrackCodeTab onCargoClick={onNavigateToReports} />
                ) : null}

                <Suspense fallback={null}>
                    <ChinaAddressModal    isOpen={isChinaModalOpen}      onClose={() => setIsChinaModalOpen(false)} />
                    <MakePaymentModal     isOpen={isPaymentModalOpen}    onClose={() => setIsPaymentModalOpen(false)} />
                    <CalculatorModal      isOpen={isCalculatorOpen}      onClose={() => setIsCalculatorOpen(false)} />
                    <ProhibitedItemsModal isOpen={isProhibitedModalOpen} onClose={() => setIsProhibitedModalOpen(false)} />
                </Suspense>

                <CarouselMediaModal
                    isOpen={mediaModalItem !== null}
                    onClose={() => setMediaModalItem(null)}
                    itemId={mediaModalItem?.id ?? 0}
                    title={mediaModalItem?.title}
                    subTitle={mediaModalItem?.sub}
                    actionUrl={mediaModalItem?.actionUrl}
                    mediaItems={mediaModalItem?.mediaItems ?? []}
                />
            </div>
        </div>
    );
}